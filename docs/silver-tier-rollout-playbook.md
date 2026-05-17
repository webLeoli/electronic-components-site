# Silver Tier 描述重写 — 执行手册 (v3)

> **目的**：把 571,533 个 Silver tier 产品（qualityScore 45-69）通过描述重写跨过 70 分阈值进入 Gold tier，使 indexable 从 false 翻转为 true，sitemap 自动包含这些 URL、Google 可索引。
>
> **预期效果**：基于 50 产品试点 + 1000 dry-run 实测，**91-94%** Silver 产品在重写后翻 Gold；剩余的是 obsolete/eol 产品（lifecycle -8 分），需要 datasheet 抓取再过关。
>
> **责任分工**：
> - **架构层（已完成）**：`src/lib/desc-templates.js` v2、AdminSetting 70 阈值策略、Sitemap/canonical 自动响应、所有脚本崩溃安全
> - **执行层（本文档对象）**：按 checklist 跑脚本、检查指标、汇报结果
>
> **v3 改动 (2026-05-17)**：
> - 命令全部改为 **PowerShell 语法**（适配 Windows 默认 shell）
> - `apply-new-descriptions.mjs` 的 ids-out 记录改为 **update 前同步写**，崩溃零漏
> - 新增 `--skip-uncategorized` 跳过 188 个 categoryId=null 孤儿产品（默认带上）
> - `restore-descriptions.mjs` 加 `--ids-file=path.txt`，支持几十万 id 回滚
> - 阶段 3 的回滚命令全部改用 `--ids-file`
>
> **v2 改动回顾**：
> - classifier 70+ 条规则两层匹配，fallback 率 < 2.5%（剩余全部是孤儿数据）
> - a/an 语法修复
> - AdminSetting threshold 同步、admin UI 不再 hardcoded 45
> - 真实 Silver 数量 Top 6：Rochester / TI / Renesas / **Torex** / Maxim / Microchip

---

## 0. 前置条件检查（5 分钟）

```powershell
cd "D:\脚本案例\electronic-components-site"

# 1. 确认 .env 中的 DATABASE_URL
Select-String -Path .env -Pattern "^DATABASE_URL"

# 2. 确认能连上数据库
node scripts\check-db.cjs
# 期望：Products: 719342 Categories: 141 Manufacturers: 383

# 3. 跑单元测试
node scripts\test-desc-templates.mjs
# 期望末行：=== Total: 41 passed, 0 failed ===

# 4. 跑 classifier fallback 实测
$env:OFFSET='300000'; node scripts\check-classifier-fallback.cjs
# 期望：fallback < 3%

# 5. D: 盘剩余 ≥ 500MB
```

---

## 1. 备份现有描述（必做，10 分钟）

⚠️ **任何批量写入前必须先备份**。

```powershell
node scripts\backup-descriptions.mjs
# 输出：backups\descriptions-{YYYYMMDD-HHmm}.jsonl
# 记下完整文件名，后面所有回滚命令都用它！
```

**验证备份完整**：
```powershell
(Get-Content backups\descriptions-*.jsonl | Measure-Object -Line).Lines
# 期望：719342
```

---

## 2. 同步 70 阈值到 AdminSetting（必做，1 分钟）

⚠️ **关键前置**。不同步的话 admin UI 仍会按代码默认值跑（已改 70，但显式写入更稳）。

```powershell
# 先看当前 policy
node scripts\set-indexing-policy.mjs --show

# 写入 70 阈值
node scripts\set-indexing-policy.mjs --threshold=70 --disabled=false

# 再确认一次
node scripts\set-indexing-policy.mjs --show
# 期望：
#   quality_index_threshold = 70
#   quality_indexing_disabled  = false
```

完成后 admin UI "Re-score All" 按钮副标题应显示 `Recompute @ ≥70`。

---

## 3. 分阶段铺开（核心动作）

> 🎯 **策略**：分 3 阶段递增，每阶段验证后再进下一阶段。每阶段失败可独立回滚。
> ⚠️ **所有命令默认带 `--skip-uncategorized`**，跳过 188 个 categoryId=null 的孤儿产品。这些孤儿产品会落到 fallback "integrated circuit"，留待后续单独的分类补齐流程处理。

### 阶段 3.1：拓宽试点到 1,000 个（30 分钟）

```powershell
# Step A: dry-run，再次确认无 fallback
node scripts\apply-new-descriptions.mjs --silver-only --limit=1000 --skip-uncategorized --dry-run
# 期望：'integrated circuit' 字眼为 0（除非孤儿数据未被跳过）

# Step B: live 写入，崩溃安全 ids-out
node scripts\apply-new-descriptions.mjs --silver-only --limit=1000 --skip-uncategorized --ids-out=phase31-ids.txt
# 末行：IDs written to: phase31-ids.txt  (XXXX ids)

# Step C: 重算这批产品的分数
node scripts\rescore-subset.mjs --file=phase31-ids.txt --threshold=70
```

**通过标准**：
- ✅ `Flipped to indexable` ≥ 850（即 85%+ flip 率）
- ✅ Step A 抽样描述无 `is a integrated`、重复词等异常
- ✅ 抽 3 个翻 Gold 的产品 curl HTML，确认 meta robots 不再 noindex（见第 5 节）

**回滚（如不通过）**：
```powershell
node scripts\restore-descriptions.mjs --file=backups\descriptions-XXXXXXXX.jsonl --ids-file=phase31-ids.txt
```

### 阶段 3.2：按真实 Silver 数量 Top 6 品牌铺开（~60 分钟）

> **真实 Silver tier 排名（2026-05-17 实测）**：
> 1. Rochester Electronics — 93,307
> 2. Texas Instruments — 67,129
> 3. Renesas — 46,634
> 4. **Torex Semiconductor — 42,193** ⚠️ 易漏
> 5. Maxim Integrated — 35,593
> 6. Microchip — 31,292
>
> 合计 31.6 万，占 Silver 总量 55%。

```powershell
# 每个品牌独立 ids-out 文件，方便按品牌回滚
node scripts\apply-new-descriptions.mjs --mfr="Rochester Electronics" --silver-only --skip-uncategorized --ids-out=phase32-rochester.txt
node scripts\apply-new-descriptions.mjs --mfr="Texas Instruments"     --silver-only --skip-uncategorized --ids-out=phase32-ti.txt
node scripts\apply-new-descriptions.mjs --mfr="Renesas"               --silver-only --skip-uncategorized --ids-out=phase32-renesas.txt
node scripts\apply-new-descriptions.mjs --mfr="Torex Semiconductor"   --silver-only --skip-uncategorized --ids-out=phase32-torex.txt
node scripts\apply-new-descriptions.mjs --mfr="Maxim Integrated"      --silver-only --skip-uncategorized --ids-out=phase32-maxim.txt
node scripts\apply-new-descriptions.mjs --mfr="Microchip"             --silver-only --skip-uncategorized --ids-out=phase32-microchip.txt

# 合并 6 个文件做一次性重算
Get-Content phase32-rochester.txt,phase32-ti.txt,phase32-renesas.txt,phase32-torex.txt,phase32-maxim.txt,phase32-microchip.txt | Set-Content phase32-all.txt

node scripts\rescore-subset.mjs --file=phase32-all.txt --threshold=70
```

**通过标准**：每个品牌 flip 率 ≥ 80%（Rochester obsolete 占比高，可能略低）。

**按品牌回滚示例**（万一某个品牌出问题）：
```powershell
node scripts\restore-descriptions.mjs --file=backups\descriptions-XXXXXXXX.jsonl --ids-file=phase32-torex.txt
```

### 阶段 3.3：剩余所有 Silver tier（约 25 万产品，~50 分钟）

```powershell
# 前面 6 品牌已 Gold 的不会被 --silver-only 再选中
node scripts\apply-new-descriptions.mjs --silver-only --skip-uncategorized --ids-out=phase33-remaining.txt

node scripts\rescore-subset.mjs --file=phase33-remaining.txt --threshold=70
```

---

## 4. 全站校准（10 分钟）

```powershell
node scripts\compute-quality-scores.mjs --threshold=70
```

观察输出末尾：
```
  Gold       XXX,XXX
  Silver     XXX,XXX   ← 应 ≤ 10 万（剩余都是 obsolete + 无 datasheet）
  Bronze     XXX,XXX
  Noindex    XXX,XXX
  ----
  Indexable  XXX,XXX  (XX.X%)   ← 应 ≥ 70%
```

**通过标准**：indexable 比例从 15.3% 升到 ≥ 70%（产品数从 110K 升到 ≥ 500K）。

---

## 5. 验证产品页输出（10 分钟）

```powershell
# 起 dev server（如未启动）
# npm run dev

# 抽 5 个翻 Gold 的产品 + 1 个仍 Silver 的 obsolete 对比
curl.exe -s "http://localhost:3000/product/altera/EP4CE6E22C8N" -o $env:TEMP\check1.html
curl.exe -s "http://localhost:3000/product/torex-semiconductor/XC6121A240ER-G" -o $env:TEMP\check2.html

# 提取关键标签
Select-String -Path $env:TEMP\check1.html -Pattern 'name="robots" content="[^"]*"|<title>[^<]*</title>|<link rel="canonical"[^>]*>'
```

**期望**：
- ✅ Gold 产品：**无** `<meta name="robots" content="noindex,..."`
- ✅ Silver/obsolete 产品：仍有 `<meta name="robots" content="noindex, follow"`（按预期，留待 datasheet 阶段）
- ✅ canonical 指向 `https://fpgacenter.com/product/...`

---

## 6. 提交 sitemap 给 Google Search Console（5 分钟）

```
1. https://search.google.com/search-console
2. 选 fpgacenter.com 资源 → 左侧 Sitemaps
3. 提交 sitemap.xml
```

后续每周一次监控：覆盖率、性能、Index Coverage。

---

## 7. 回滚流程

### 全量回滚（极端情况）
```powershell
node scripts\restore-descriptions.mjs --file=backups\descriptions-XXXXXXXX.jsonl
node scripts\compute-quality-scores.mjs --threshold=70
```
约 1.5-2 小时。

### 阶段级回滚（推荐）
```powershell
# 阶段 3.1
node scripts\restore-descriptions.mjs --file=backups\descriptions-XXXXXXXX.jsonl --ids-file=phase31-ids.txt

# 阶段 3.2 某品牌
node scripts\restore-descriptions.mjs --file=backups\descriptions-XXXXXXXX.jsonl --ids-file=phase32-torex.txt

# 阶段 3.3 全量
node scripts\restore-descriptions.mjs --file=backups\descriptions-XXXXXXXX.jsonl --ids-file=phase33-remaining.txt
```

### 紧急下线索引
```powershell
node scripts\set-indexing-policy.mjs --disabled=true
# 此后 admin/api 视为 disabled，但已有 indexable=true 字段仍在
# 需要再跑 rescore 才会真正下线（脚本会读到 disabled 并强制设为 false）
```

---

## 8. 完成后向架构层汇报的指标

| 指标 | 怎么拿 | 期望值 |
|---|---|---|
| 备份文件路径 | `ls backups\` | 1 个 jsonl，~300MB |
| AdminSetting threshold | `node scripts\set-indexing-policy.mjs --show` | 70 |
| 阶段 3.1 flip 率 | `rescore-subset.mjs` 输出 | ≥ 85% |
| 阶段 3.2 / 3.3 各 flip 率 | 同上 | ≥ 80% |
| 全站 indexable% | `compute-quality-scores.mjs` 末尾 | ≥ 70% |
| 抽样产品 HTML robots 标签 | `curl + Select-String` | Gold 无 noindex |
| GSC sitemap 提交时间 | GSC 截图 | 已成功 |
| 各阶段 ids-out 文件 | `ls phase*.txt` | 与日志的 `IDs written to` 行数一致 |

---

## 9. 已知留给阶段 4+ 的问题

- **3-5% obsolete 产品仍卡 Silver**：lifecycle=2 扣 8 分，需 datasheet 抓取
- **0 个产品有 image**：不影响过 70 阈值，但补图能拉到 80+
- **188 个产品 categoryId=null**：本阶段被 `--skip-uncategorized` 跳过，需独立分类补齐流程
- **Rochester Electronics 106K 数据真实性**：需采购侧复核
- **Google 实际收录率取决于域名权重 + 内容质量综合判断**

---

## 附：脚本数据流

```
backup-descriptions.mjs              ← 必须先跑（产出 backups/*.jsonl）
   ↓
set-indexing-policy.mjs              ← 必须先跑（写 AdminSetting threshold=70）
   ↓
apply-new-descriptions.mjs           ← 接受 --mfr/--silver-only/--skip-uncategorized/--limit
   ↓ 产出 --ids-out=phaseN.txt        ← update 前同步写，崩溃零漏
rescore-subset.mjs                   ← 接受 --file=phaseN.txt
   ↓ 重写 qualityScore + indexable
（产品页 ISR 自动失效）
   ↓
sitemap.xml 自动更新

回滚链路：
backups/*.jsonl + phaseN.txt → restore-descriptions.mjs --file=... --ids-file=phaseN.txt
```

任何异常输出、卡死、性能问题，把脚本完整输出截图发回。**不要自行修改 desc-templates.js、quality-score.js、indexing-policy.js 或这 6 个脚本**——这些由架构层维护。

— 维护者：架构层
