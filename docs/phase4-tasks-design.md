# 阶段 4 设计文档 — 三任务全面客观分析

> 本文档刻意**不做幸存者偏差式承诺**，每个任务都列出"可能不工作的情形"与"我无法解决的部分"。设计先于执行，需用户审阅后才动手。

---

# 任务 1：L1 分类聚合页改造

## 1.1 实测现状（颠覆了原假设）

我原本以为"L1 _count.products=0 意味着页面空荡荡"。**实测结论：L1 页面已经渲染了完整产品列表**，递归把 L1+L2+L3 的所有产品挂上分页（`src/app/category/[[...slug]]/page.js:120-128`）。

8 个 L1 当前数据：

| L1 | 产品总数 | indexable | L2 数 | Top 3 Mfrs |
|---|---:|---:|---:|---|
| Embedded & Programmable | 155,211 | 72,568 | 3 | Microchip, Renesas, Rochester |
| Power Management | 226,180 | 5,636 | 7 | Torex, TI, Rochester |
| Memory | 67,117 | 15,550 | 3 | Micron, Renesas, Rochester |
| Analog & Mixed Signal | 88,903 | 2,087 | 4 | Rochester, TI, Maxim |
| Logic | 55,805 | 2,172 | 3 | Rochester, TI, Onsemi |
| Interface & Communication | 34,640 | 2,976 | 4 | Rochester, TI, Maxim |
| Clock & Timing | 62,417 | 8,992 | 3 | Renesas, Skyworks, Rochester |
| Audio, Video & Telecom | 28,881 | 1,278 | 3 | Rochester, TI, Maxim |

**响应实测（dev mode）**：
- `/category/embedded` 16.6s, 251KB ← 严重慢
- `/category/power-management` 3.5s, 273KB

embedded 比 power-management 慢 5 倍，**说明 product count + first 20 query 在大 L1 上有性能问题**（也是任务 2 的范围）。

## 1.2 真实问题（修正后）

不是"页面空荡荡"，而是：
- 直接进表格，**没有总览段落**告诉用户"这个分类是干什么的"
- L2 子分类只在侧边栏 filter，**没有视觉上突出**让用户快速分流到精确品类
- **没有品牌入口**（虽然下方有 manufacturers 链接）
- **没有 H2 段落结构**让搜索引擎理解页面主题层次
- **没有 FAQ 段落**（manufacturer 页有，category 页缺）
- 当前 H1 只是 "Embedded & Programmable" + 一行 seoDesc，**信息密度过低**

## 1.3 改造目标

为 L1 页面（仅当 `category.parentId === null` 且 `category.children.length > 0` 时触发）加：

1. **顶部 hero 段落**：H1 + 数据摘要 ("155K parts, 72K indexable, 3 sub-families") + 1-2 句行业上下文
2. **L2 子分类 grid**（不依赖侧边栏 filter）：3-7 个卡片，每个含 L2 名 + 产品数 + 2-3 个热门 partNumber
3. **Top 5 manufacturers 卡片**：链接到 manufacturer 页
4. **保留现有 product table + pagination**（兼容性）
5. **底部 FAQ**（4-6 个问答，per-L1 不同）
6. **CollectionPage + FAQ JSON-LD**

不改的：L2/L3 渲染路径不变。

## 1.4 子任务分解

| # | 子任务 | 文件 | 时间 |
|---|---|---|---|
| 1.A | 写 `lib/l1-content.js` 生成器（hero 段落 + FAQ） | 新 | 2-3 小时 |
| 1.B | 写 `L1CategoryView.js` 服务端组件 | 新 | 2-3 小时 |
| 1.C | 改 `category/[[...slug]]/page.js` 分流逻辑 | 改 | 1 小时 |
| 1.D | 数据查询：L2 每个的 top 3 partNumber + 产品计数（不动主 query） | 改 | 1 小时 |
| 1.E | 验证 8 个 L1 页面 HTML 输出 + 响应时间不退化 | 测 | 1 小时 |

**总计 7-9 小时（1 个工作日）**

## 1.5 风险 & 不确定性（不回避）

| 风险 | 概率 | 缓解 |
|---|---|---|
| **L1 改造可能增加 0.5-2s 响应时间**（加了 L2 的 N 个 sub-query） | 高 | 用 `Promise.all` 并发 + 缓存 `unstable_cache(tags=['l1', slug])` 5 分钟 |
| **行业上下文段落如果太模板化**，被 Helpful-Content 算法判 thin | 中 | 每个 L1 写独有的 200-300 字段落，**不能 AI 一键生成 8 个**——必须人工或半自动 |
| **8 个 L1 命名不符合主流 SEO 词**（如 "Embedded & Programmable"，没人搜这个） | 中 | seoTitle 应使用主流词（"FPGA & MCU"），但 H1 可以保留品牌命名 |
| **Mouser/Digi-Key 的 L1 页排名已是垄断**，我们不一定能挤进 | 高 | 接受这个事实，目标是抢长尾 L2/L3 而非 L1 关键词 |
| **改 page.js 可能影响 L2/L3 渲染** | 低 | 分流条件严格检查 parentId+children.length，单独路径 |

## 1.6 失败模式（最坏情况）

- L1 改造后响应时间从 3-16s 退化到 10-30s → 用户跳出率上升 → Google 降权
- 行业段落写得太"AI 味"→ 被 Originality.ai/SpamBrain 检测 → 整站权重受牵连
- L1 词竞争太强，6 个月后 GSC 数据显示 L1 几乎没流量 → 这项工作 ROI 接近零

## 1.7 验证标准

- ✅ 8 个 L1 页面响应时间不超过当前值（不能因改造变慢）
- ✅ HTML 中有 H1 + 至少 3 个 H2（hero / subcategories / FAQ）
- ✅ FAQ JSON-LD 通过 Google Rich Results Test
- ✅ 每个 L1 段落 unique（手写或半自动），不出现 "best price" / "high quality" 等模板词

## 1.8 我无法解决的部分

- 8 个 L1 的中长尾排名是否能进 Google Top 10 — 取决于域名权重与外链
- L2 行业内容质量取决于业务洞察，AI 只能搭骨架，肉需要人写

---

# 任务 2：首页 8s 响应性能诊断

## 2.1 实测现状

| 路径 | dev mode 响应 | HTML 大小 |
|---|---:|---:|
| `/` | 8.2s | 158 KB |
| `/category` | 2.6s | 103 KB |
| `/category/embedded` | **16.6s** | 251 KB |
| `/category/power-management` | 3.5s | 273 KB |
| `/category/fpgas` | 0.33s | 239 KB |
| `/manufacturer/altera` | 1.0s | 124 KB |
| `/manufacturers` | 2.0s | 372 KB |
| `/sitemap.xml` | 1.0s | 3.7 KB |
| `/product/altera/EP4CE6E22C8N` | ~1-2s | 165 KB |

**最慢的不是首页**，是 `/category/embedded` 16.6s。但首页 8.2s 也异常。

## 2.2 真实问题诊断（先验假设，需实测验证）

| 假设 | 证据 | 验证方法 |
|---|---|---|
| A. Dev mode Turbopack 编译开销 99% | 同样代码 prod build 通常快 5-10x | `npm run build && npm run start` 复测 |
| B. `getHomeData` 中 4 个并行 query 慢 | 没数据 | 加 `console.time()` 包裹每个 await |
| C. `prisma.category.findMany({})` 拉全 141 个分类（只用 12 个） | code review 确认 | EXPLAIN ANALYZE + 改为只 select L1 |
| D. embedded 16.6s 是 `prisma.product.count` 在 categoryIds 含 ~30 个 IDs 上慢 | 假设 | 数据库 EXPLAIN ANALYZE |
| E. Google Font 加载阻塞 | dev 阶段 SSR 不阻塞 | Lighthouse |
| F. 数据库不在本地（远程 PG） | 未知 | 看 `.env` DATABASE_URL |

## 2.3 子任务分解

| # | 子任务 | 输出 |
|---|---|---|
| 2.A | 起 prod build + start，复测所有路径 | 性能对照表 |
| 2.B | 加 Server-Timing header 到首页 + L1 页 | 分段耗时数据 |
| 2.C | 跑 EXPLAIN ANALYZE 在最慢的 5 个 query 上 | 慢查询清单 |
| 2.D | 用 Lighthouse 跑首页 + L1 一次 | Core Web Vitals |
| 2.E | 写诊断报告 | 风险/收益矩阵 |
| 2.F | **决定**：值不值得修。修哪些。 | 用户拍板 |

**总计 4-6 小时**（不含修复，仅诊断）。

## 2.4 风险 & 不确定性

| 风险 | 影响 |
|---|---|
| Prod 模式可能就是快的，所有"性能问题"是 dev 假象 | 任务 2 工作量大减 |
| 数据库连接到的是远程实例（如 Supabase free tier），延迟天生高 | 不可优化 |
| `prisma.product.count` 慢是因为 categoryId 索引不够强 | 加复合索引可解，但要 migration |
| 即使本地优化好，Vercel/Cloudflare 部署到全球后还是有延迟 | 跨域 CDN 缓存策略另一个问题 |
| 性能改完，朋友的批量写入可能让缓存失效，又慢 | 需要 ISR 策略协调 |

## 2.5 失败模式

- 测完发现 prod 模式就是 0.5-1s，**任务 2 没事可做**（这是好结果）
- 测完发现是数据库瓶颈，但 DB 是托管的不能直接调优 → 只能加 Redis 缓存层（工作量大）
- 测完发现首页 8s 是 ISR 冷启动，每 5 分钟才出现一次，**生产环境用户基本看不到** → 改 revalidate 时间即可

## 2.6 决策树

```
跑 prod build 测试
├─ 全部 < 2s ────→ 任务 2 完成（无需修复，记录基线）
├─ 首页 > 3s ─────┐
└─ L1 > 5s ──────┤
                  ├─ 加 Server-Timing 定位瓶颈
                  ├─ 数据库瓶颈 → EXPLAIN ANALYZE → 加索引/重写 query
                  ├─ Prisma 关联查询过深 → 拆分查询
                  └─ ISR 冷启动 → 加 warming cron
```

## 2.7 我无法解决的部分

- 数据库托管服务的网络延迟
- 真实用户的 Core Web Vitals（需要 GSC + RUM 数据，不是 Lighthouse 实验室数据）

---

# 任务 3：5-8 篇支柱博客内容

## 3.1 实测现状

- BlogPost 表 3 条：2 已发布 / 1 草稿
- 已发布的 2 篇质量样本：
  - "How to Choose the Right FPGA for Your Project" — 4,219 chars (~700 词), 4 分钟阅读, 187 views
  - "STM32F103 vs STM32F407" — 309 views
  - 结构化（H2/H3）、有重点加粗、举例
- 后端完整：`sanitize-html`、markdown 转换、TOC、JSON-LD、关联产品

**已有内容的局限**：
- 700 词偏短，**支柱内容（pillar content）行业标杆是 1500-3500 词**
- 没有作者署名/资历（YMYL 边缘话题对 EEAT 不利）
- 没有引用权威来源（IDEA / JEDEC / IPC 标准）

## 3.2 选题分析（按 ROI 排序，附搜索量估计与难度）

| # | 选题 | 搜索意图 | 关键词 | 写作难度 | 我能做多少 |
|---|---|---|---|---|---|
| 1 | "EOL vs NRND vs Obsolete: understanding the IC lifecycle" | 教育 | EOL NRND obsolete difference | 低 | 90% — 公开知识 |
| 2 | "What is IDEA-STD-1010 and why it matters for procurement" | 合规 | IDEA-1010, counterfeit detection | 中 | 80% — 标准公开但解释要准确 |
| 3 | "How to source obsolete electronic components: a guide" | 采购 | obsolete IC sourcing | 中 | 60% — 流程可以写，**真实案例需要你提供** |
| 4 | "Last-time buy strategy: how much to stockpile" | 决策 | LTB strategy, last time buy calculation | 中 | 70% — 模型公开，但实战需要业务输入 |
| 5 | "BOM scrubbing: identifying lifecycle risks" | 工程 | BOM scrubbing, BOM risk analysis | 中 | 70% |
| 6 | "FPGA cross-reference: Altera/Xilinx/Lattice equivalents" | 选型 | FPGA cross reference | **高** | 50% — **错了损失专业形象**，要查 datasheet |
| 7 | "How counterfeit ICs enter the supply chain" | 合规 | counterfeit IC detection | 中 | 60% — 敏感话题，不能批评具体公司 |
| 8 | "Spartan/Cyclone obsolescence: planning for end-of-life" | 工程+采购 | Spartan EOL, Cyclone obsolete | 中 | 60% |

## 3.3 真实写作能力的客观评估

**我（AI）能做的**：
- 标准化结构（H1/H2/H3、TOC、要点列表）
- 公开技术知识的整理和呈现
- 通顺、专业语调的文字
- SEO 关键词布局
- 内部链接策略

**我（AI）不能做的**：
- 真实业务案例（"我们 2024 年帮某客户 X 解决 Y"）
- 客户引用 / 专家观点
- 行业内幕（薪资、利润率、供应商关系）
- 个性化的"踩坑经验"
- 实物照片 / 截图（datasheet 截图等）

**我（AI）做了反而扣分的**：
- 假冒作者署名 / 资历背书
- 编造客户案例 / 数字
- 引用无来源的"专家观点"

→ **这意味着 5-8 篇支柱内容的"骨架我能搭，肉你要补"**。如果完全交给 AI，会产出**结构正确但缺乏 EEAT 信号**的内容，Google 现在的 SpamBrain 越来越擅长识别这种"AI 通稿"。

## 3.4 子任务分解（修正后的现实主义版本）

| 阶段 | 子任务 | 谁来做 | 时间 |
|---|---|---|---|
| 3.A | 选题终稿（从 8 个选 5 个） | 你拍板 | 30 min |
| 3.B | 每篇 H2/H3 大纲 + 关键数据点列表 | 我 | 1 小时/篇 |
| 3.C | 写第一稿（800-1200 词骨架） | 我 | 2-3 小时/篇 |
| 3.D | **加业务案例 + 内部数据 + 你的专家观点** | 你 | 1-2 小时/篇 |
| 3.E | 关键词优化 + 内部链接 | 我 | 30 min/篇 |
| 3.F | SEO 元数据 (seoTitle/seoDesc/keywords) | 我 | 15 min/篇 |
| 3.G | 发布到 BlogPost 表（status=published） | 我 | 5 min/篇 |

**单篇总计 ~5-7 小时，5 篇合计 25-35 小时（4-6 个工作日）**。

⚠️ **3.D 是 EEAT 关键，跳过这一步就和 AI 通稿没区别**。

## 3.5 风险 & 不确定性

| 风险 | 概率 | 缓解 |
|---|---|---|
| 文章发布后 6 个月无外链 → 不会排上去 | 高 | 需要外链建设策略（另一个工作流） |
| Google 算法升级判 AI 内容 → 已发布内容降权 | 中 | 加真人作者署名（需要你提供） |
| FPGA cross-reference 写错型号对应 → 损害专业形象 | 中 | 主动放弃选题 6，或严格 datasheet 核对 |
| 写完后无人维护，技术信息过时（如 Xilinx → AMD 收购等） | 高 | 每 6 月复核机制 |
| 选题与商业转化不挂钩 → 来流量但不变 RFQ | 中 | 每篇底部加 RFQ CTA + 相关产品链接 |

## 3.6 失败模式

- 写完 5 篇都不上首页 → 流量为零（最常见）
- AI 生成被判 spam → 整站权重受牵连
- 数据写错（如 FPGA 对照表错误）→ 行业内被嘲笑 → 信誉损失大于流量收益

## 3.7 决策点（需用户先回答）

1. **选哪 5 篇？** — 推荐 1, 2, 3, 5, 8（避开选题 6 FPGA cross-reference，技术风险太高）
2. **业务案例你能提供吗？** — 这是 3.D 的关键
3. **作者署名怎么定？** — 是用真名 + LinkedIn（理想），还是 "FPGACenter Team"（弱化 EEAT）
4. **发布节奏？** — 一周 1 篇还是一次性发完？

## 3.8 我无法解决的部分

- 真实业务案例的提供
- 作者身份背书
- 外链建设（需要外联团队）
- 6 个月后的内容维护

---

# 三任务执行顺序建议

```
任务 2 (性能诊断)          ← 0.5-1 天，先做。结果决定任务 1 是否需要先优化基线
        ↓
任务 1 (L1 改造)           ← 1 天，依赖任务 2 不退化保证
        ↓
任务 3 (博客 5 篇)         ← 4-6 天，可与任务 1 后期并行（你写业务案例，我搭骨架）
```

理由：
- 任务 2 最短最低风险，结果可能让任务 1 不需要做（或要求更严格）
- 任务 3 时间最长，越早启动越好
- 任务 1 改造前必须确认性能基线

---

# 共同的我无法解决的部分（横跨 3 任务）

1. **域名权重提升**：需要外链建设
2. **品牌信任信号**：需要真实公司资料 / 客户证言
3. **业务案例 / 数字**：你的内部数据
4. **作者 EEAT 信号**：需要真实工程师 / 采购的署名
5. **Google 算法的最终判决**：技术 SEO 只能确保不被罚，不能确保排名

— 文档版本：v1，2026-05-17
