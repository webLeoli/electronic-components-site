import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import prisma from '@/lib/db';
import { buildSeoImageName, monthPath } from '@/lib/image-upload-policy';

// AI blog writer: provider-pluggable content generation for the admin workbench.
// Text adapters:
//   - "openai-compatible": OpenAI, DeepSeek, Qwen/DashScope, Moonshot, GLM, ... —
//     anything exposing a /chat/completions endpoint. Configurable base URL + key.
//   - "anthropic": Claude via the official SDK (API key).
//   - "codex-cli" / "claude-cli": no key at all — shells out to a locally
//     installed & already-authorized `codex` / `claude` CLI, consuming the
//     user's ChatGPT / Claude subscription. Requires the site and the CLI to
//     run on the same machine (run `codex login` / `claude` login once first).
// Image generation goes through an OpenAI-compatible /images/generations endpoint
// and is OPTIONAL: any failure falls back to the themed generated cover
// (blog-cover.js) so publishing never blocks on an image API.

export const AI_WRITER_SETTING_KEY = 'ai_writer_config';

const DEFAULT_CONFIG = {
  text: {
    provider: 'openai-compatible', // 'openai-compatible' | 'anthropic'
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-5.2',
  },
  image: {
    enabled: false,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-image-1',
    size: '1536x1024',
  },
};

function mergeConfig(saved) {
  return {
    text: { ...DEFAULT_CONFIG.text, ...(saved?.text || {}) },
    image: { ...DEFAULT_CONFIG.image, ...(saved?.image || {}) },
  };
}

export async function getAiWriterConfig() {
  try {
    const row = await prisma.adminSetting.findUnique({ where: { key: AI_WRITER_SETTING_KEY } });
    return mergeConfig(row?.value ? JSON.parse(row.value) : null);
  } catch {
    return mergeConfig(null);
  }
}

export async function saveAiWriterConfig(incoming) {
  const current = await getAiWriterConfig();
  const next = {
    text: { ...current.text, ...(incoming?.text || {}) },
    image: { ...current.image, ...(incoming?.image || {}) },
  };
  // An empty apiKey in the payload means "keep the stored key" so the UI never
  // has to echo secrets back.
  if (!incoming?.text?.apiKey) next.text.apiKey = current.text.apiKey;
  if (!incoming?.image?.apiKey) next.image.apiKey = current.image.apiKey;

  await prisma.adminSetting.upsert({
    where: { key: AI_WRITER_SETTING_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: AI_WRITER_SETTING_KEY, value: JSON.stringify(next) },
  });
  return next;
}

// Never send stored secrets to the browser; the UI only needs to know they exist.
export function maskAiWriterConfig(config) {
  return {
    text: { ...config.text, apiKey: '', hasKey: Boolean(config.text.apiKey) },
    image: { ...config.image, apiKey: '', hasKey: Boolean(config.image.apiKey) },
  };
}

function trimBase(url) {
  return String(url || '').replace(/\/+$/, '');
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

export function buildArticlePrompt({ topic, keywords, categoryName, parts }) {
  const partList = parts.length
    ? parts
        .map(
          (p) =>
            `- ${p.partNumber} | ${p.manufacturer} | ${(p.description || '').slice(0, 90)} | stock: ${p.stock ?? 'RFQ'}`,
        )
        .join('\n')
    : '(none available - leave relatedProducts empty)';

  const system = `You are the senior technical content writer for FPGACenter, an electronic-components distributor specializing in legacy FPGA/CPLD sourcing, obsolete-part procurement, and Chinese-alternative cross-referencing. You write practical, engineering-accurate articles for procurement engineers and hardware designers. You never fabricate stock numbers, prices, or part specifications you are not sure about. Respond with STRICT JSON only - no markdown fences, no commentary outside the JSON.`;

  const user = `Write a blog article for FPGACenter.

Topic: ${topic}
${keywords ? `Target keywords: ${keywords}` : ''}
${categoryName ? `Category: ${categoryName}` : ''}

Real parts currently in our catalog that are relevant (you may reference these and ONLY these as related products):
${partList}

Requirements:
- English, 1200-1800 words of markdown body.
- Structure: short intro (no heading), then ## sections with ### subsections where useful.
- Include exactly one markdown comparison table where it genuinely helps.
- Include a "## FAQ" section with 3-4 questions using ### for each question.
- Practical procurement angle: lifecycle status, sourcing risk, verification steps, alternatives.
- Where natural, mention that readers can request a quote (the site routes /rfq and /bom exist) - at most twice, no hard selling.
- Do NOT invent specific prices, lead times, or stock quantities.
- Do NOT include a top-level # title in the markdown body (the site renders the title separately).

Return STRICT JSON with exactly these fields:
{
  "title": "string, <= 70 chars, compelling and keyword-bearing",
  "slug": "string, lowercase-hyphenated, <= 80 chars",
  "excerpt": "string, 140-160 chars, plain text",
  "contentMarkdown": "string, the full markdown body",
  "seoTitle": "string, <= 60 chars",
  "seoDesc": "string, 140-155 chars",
  "seoKeywords": "string, comma-separated, 5-8 terms",
  "tags": "string, comma-separated, 3-5 tags",
  "relatedProducts": "string, comma-separated part numbers chosen ONLY from the catalog list above, up to 6, or empty string"
}`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// Text adapters
// ---------------------------------------------------------------------------

async function generateWithOpenAICompatible(cfg, { system, user }) {
  const res = await fetch(`${trimBase(cfg.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 500);
    throw new Error(`Text API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Text API returned an empty response');
  return content;
}

async function generateWithAnthropic(cfg, { system, user }) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({
    apiKey: cfg.apiKey,
    ...(cfg.baseUrl && trimBase(cfg.baseUrl) !== 'https://api.anthropic.com'
      ? { baseURL: trimBase(cfg.baseUrl) }
      : {}),
  });

  const params = {
    model: cfg.model || 'claude-opus-5',
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content: user }],
  };

  // On Claude Opus 5 / Fable 5, safety classifiers can decline a request
  // (stop_reason "refusal"); server-side fallbacks re-run it on another model
  // automatically so a benign topic never dead-ends.
  const supportsFallback = /^claude-(opus-5|fable-5)/.test(params.model);
  const stream = supportsFallback
    ? client.beta.messages.stream({
        ...params,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
    : client.messages.stream(params);

  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') {
    throw new Error('The model declined to write about this topic. Try rephrasing it.');
  }
  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  if (!text) throw new Error('Text API returned an empty response');
  return text;
}

// ---------------------------------------------------------------------------
// Local CLI adapters (subscription auth, no API key)
// ---------------------------------------------------------------------------

export function isCliProvider(provider) {
  return provider === 'codex-cli' || provider === 'claude-cli';
}

function safeModelArg(model) {
  // Model names are the only user-controlled CLI argument; restrict to a safe
  // charset because Windows requires shell: true to resolve .cmd shims.
  const m = String(model || '').trim();
  return /^[\w.\-:/]+$/.test(m) ? m : '';
}

function runCli(command, args, stdinInput, timeoutMs = 540000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === 'win32',
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`Failed to run ${command}: ${e.message}. Is it installed on this server?`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `${command} exited with code ${code}: ${(stderr || stdout).slice(-500) || 'no output'}`,
          ),
        );
      } else {
        resolve({ stdout, stderr });
      }
    });
    child.stdin.write(stdinInput);
    child.stdin.end();
  });
}

async function generateWithCodexCli(cfg, { system, user }) {
  // codex exec: prompt via stdin ('-'), final agent message written to a temp
  // file via -o so stdout log noise never corrupts parsing.
  const outFile = path.join(os.tmpdir(), `codex-article-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  const model = safeModelArg(cfg.model);
  const args = [
    'exec',
    '--skip-git-repo-check',
    '-s', 'read-only',
    '--ephemeral',
    // Deterministic server behavior: skip the machine-local config.toml (a
    // pinned model there can be unsupported by this CLI build); login/auth is
    // still honored. An explicit model from the UI is passed via -m.
    '--ignore-user-config',
    '--color', 'never',
    '-o', outFile,
    ...(model ? ['-m', model] : []),
    '-',
  ];
  try {
    await runCli('codex', args, `${system}\n\n${user}`);
    const text = await readFile(outFile, 'utf8');
    if (!text.trim()) throw new Error('Codex CLI returned an empty response');
    return text;
  } finally {
    unlink(outFile).catch(() => {});
  }
}

async function generateWithClaudeCli(cfg, { system, user }) {
  const model = safeModelArg(cfg.model);
  const args = ['-p', '--output-format', 'text', ...(model ? ['--model', model] : [])];
  const { stdout } = await runCli('claude', args, `${system}\n\n${user}`);
  if (!stdout.trim()) throw new Error('Claude CLI returned an empty response');
  return stdout;
}

export async function generateArticle(config, promptInput) {
  const prompt = buildArticlePrompt(promptInput);
  let raw;
  switch (config.text.provider) {
    case 'anthropic':
      raw = await generateWithAnthropic(config.text, prompt);
      break;
    case 'codex-cli':
      raw = await generateWithCodexCli(config.text, prompt);
      break;
    case 'claude-cli':
      raw = await generateWithClaudeCli(config.text, prompt);
      break;
    default:
      raw = await generateWithOpenAICompatible(config.text, prompt);
  }
  return parseArticleJson(raw);
}

export function parseArticleJson(raw) {
  let text = String(raw).trim();
  // Tolerate models that wrap the JSON in code fences despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();
  if (!text.startsWith('{')) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Model response was not JSON');
    text = text.slice(start, end + 1);
  }
  let article;
  try {
    article = JSON.parse(text);
  } catch {
    throw new Error('Model returned invalid JSON - try again');
  }
  for (const field of ['title', 'slug', 'excerpt', 'contentMarkdown']) {
    if (!article[field] || typeof article[field] !== 'string') {
      throw new Error(`Model response is missing "${field}"`);
    }
  }
  article.slug = article.slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
  return article;
}

// ---------------------------------------------------------------------------
// Cover image (optional; returns null on any failure so callers fall back to
// the themed generated cover)
// ---------------------------------------------------------------------------

export async function generateCoverImage(imageCfg, { title, slug }) {
  if (!imageCfg?.enabled || !imageCfg.apiKey) return null;
  try {
    const prompt = `Clean professional editorial cover illustration for an electronics engineering article titled "${title}". Abstract circuit board traces and IC chips, dark slate blue background with a single warm orange accent, modern flat vector style, subtle depth. Absolutely no text, letters, numbers, or logos.`;

    const res = await fetch(`${trimBase(imageCfg.baseUrl)}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${imageCfg.apiKey}`,
      },
      body: JSON.stringify({
        model: imageCfg.model,
        prompt,
        n: 1,
        size: imageCfg.size || '1536x1024',
      }),
    });
    if (!res.ok) {
      console.error(`AI cover image API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const item = data.data?.[0];
    if (!item) return null;

    let buffer;
    if (item.b64_json) {
      buffer = Buffer.from(item.b64_json, 'base64');
    } else if (item.url) {
      const imgRes = await fetch(item.url);
      if (!imgRes.ok) return null;
      buffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return null;
    }

    const datePath = monthPath();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog', ...datePath.split('/'));
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    const fileName = buildSeoImageName({
      folder: 'blog',
      ext: '.png', // buildSeoImageName expects path.extname format (leading dot)
      title,
      slug,
      context: 'cover',
      originalName: 'ai-cover.png',
    });
    await writeFile(path.join(uploadDir, fileName), buffer);
    return `/uploads/blog/${datePath}/${fileName}`;
  } catch (e) {
    console.error('AI cover image generation failed:', e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Catalog context: real parts fed into the prompt so relatedProducts and any
// part references are grounded in inventory instead of hallucinated.
// ---------------------------------------------------------------------------

export async function findRelevantParts(topic, keywords, limit = 8) {
  const tokens = `${topic} ${keywords || ''}`
    .split(/[\s,;/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .slice(0, 10);
  if (tokens.length === 0) return [];

  try {
    return await prisma.product.findMany({
      where: {
        OR: tokens.flatMap((token) => [
          { partNumber: { contains: token, mode: 'insensitive' } },
          { manufacturer: { contains: token, mode: 'insensitive' } },
          { description: { contains: token, mode: 'insensitive' } },
        ]),
      },
      select: {
        partNumber: true,
        manufacturer: true,
        description: true,
        stock: true,
      },
      orderBy: [{ stock: 'desc' }, { qualityScore: 'desc' }],
      take: limit,
    });
  } catch {
    return [];
  }
}
