# 数据质量审计（厂商重复 / 产品重复 / 薄内容）

审计时间：2026-08-15，基于本地 `fpgacenter` 库实测（719,342 products / 383 manufacturers / 141 categories）。
所有数字均为查询结果，非估算。

---

## 1. 根因：`Product.manufacturer` 是自由文本，没有任何规范化

- `prisma/schema.prisma:15` — `manufacturer String`，不是指向 `Manufacturer` 的外键。
- 厂商页 `src/app/manufacturer/[slug]/page.js:69` 用**精确字符串相等**取产品：
  `prisma.product.count({ where: { manufacturer: name } })`。
- 产品 URL 里也带厂商 slug：`src/lib/seo.js:35` `productPath()` → `/product/<mfr-slug>/<partNumber>`。
- 导入脚本不做规范化：`scripts/import-jsonl.mjs:71` 直接 `item['Manufacturer'] || 'Unknown'`，
  `scripts/import-products.mjs:676` 同理；`scripts/sync-manufacturers.mjs` 再把每个新拼写建成一条
  `Manufacturer` 记录。

结论：供应商 feed 里同一家公司的每种写法都会变成一个独立品牌 + 一套独立 URL。

---

## 2. 厂商 0 产品：35 条 `Manufacturer` 记录

`/manufacturers` 列表页会把它们显示成 “0 products”（`src/app/manufacturers/page.js:111`），
并且它们全部进 sitemap（`src/lib/sitemap-data.js:187` 无条件取全部 manufacturer）。

### 2a. 15 条是拼写变体（真正的“同一厂商被拆开”）

| 0 产品的记录 | 实际承载产品的写法 | 产品数 |
|---|---|---|
| Analog Devices Inc. | Analog Devices | 18,099 |
| Intersil Corporation | Intersil | 11,210 |
| ROHM | ROHM Semiconductor | 6,681 |
| Lattice Semiconductor Corporation | Lattice Semiconductor | 5,929 |
| Monolithic Power Systems | Monolithic Power Systems Inc. | 4,270 |
| Microsemi Corporation | Microsemi | 3,078 |
| Digi International, Inc. | Digi International | 435 |
| Azoteq (Pty) Ltd. | Azoteq | 52 |
| MYIR Tech Limited | MYIR Tech | 50 |
| Lantronix, Inc. | Lantronix | 7 |
| Astera Labs, Inc. | Astera Labs | 4 |
| Marvell | Marvell Technology, Inc. | 4 |
| Holtek | Holtek Semiconductor | 1 |
| Digi International Inc. (Digi) | （同 Digi International） | 435 |
| Analog Devices Inc./Maxim Integrated | （ADI + Maxim 混写） | — |

### 2b. 20 条从来没有产品（纯空页面）

`AIRPAX / Sensata`、`AMD / Xilinx`、`Airoha`、`BAE Systems`、`BYD Semiconductor`、`Chipown`、
`Harris Semiconductor`、`Harting`、`Hirose`、`HiSilicon`、`HY Electronic (Cayman) Limited`、
`JAE Electronics`、`LoRa Alliance`、`LSI/CSI`、`LSI Computer Systems, Inc. (LSI/CSI)`、
`MediaTek`、`Mitsubishi Electric`、`System-On-Chip (SOC) Technologies`、`TI Burr-Brown™`、`Unknown`

注：`AMD / Xilinx` 和 `Analog Devices Inc.` 还被 `src/lib/fallbacks.js` 的 `FALLBACK_BRANDS` /
`FALLBACK_PARTS` 引用，即降级 UI 会主动链到 0 产品页面。

### 2c. 另外 10 组重复发生在**两个都有产品**的写法之间（更严重，两边都在出页面）

| 组 | 写法 A | 写法 B |
|---|---|---|
| Nexperia | Nexperia USA Inc. (3,967) | Nexperia (365) |
| Nuvoton | Nuvoton Technology Corporation America (1,403) | Nuvoton Technology (286) |
| Richtek | Richtek USA (1,859) | Richtek Technology (35) |
| GigaDevice | GigaDevice Semiconductor (202) | GigaDevice (7) |
| NXP | NXP Semiconductors (16,013) | NXP (5) |
| Semtech | Semtech Corporation (1,347) | Semtech (3) |
| Micron | Micron Technology Inc. (9,958) | Micron (1) |
| Sharp | Sharp Microelectronics (490) | Sharp (1) |
| Alpha & Omega | Alpha & Omega Semiconductor (647) | Alpha & Omega (1) |
| 其它 | Finisar Corporation (7) / Finisar (1)；GHI Electronics, LLC (4) / GHI Electronics (1)；Realtek (1) / Realtek Semiconductor (1) | |

25 个归一化冲突组合计覆盖 **86,425 条产品**。

### 2d. 未合并、但属于同一集团的品牌（**建议保留独立，不要合并**）

`Xilinx` (6,503) / `Altera` (13,323) / `Maxim Integrated` (42,668) / `Linear Technology` (25,302) /
`Intersil` (11,210) / `Atmel` (10,478) / `Micrel` (36) / `Spansion` (13,314) /
`Cypress Semiconductor` (13,219) / `Freescale Semiconductor` (4,262) / `Fairchild` (928) /
`International Rectifier` (1,191) / `Burr-Brown` (4) / `Unitrode` (4) / `IDT` (3,265)。

理由：搜索需求是按停产品牌名走的（“Maxim MAX232”“Xilinx XC7A100T”），合并到收购方会丢失长尾流量。
这些属于**业务决策**，不在技术清理范围内。

---

## 3. 产品重复：1,861 组 / 3,814 条

> **修正（2026-08-15）**：初审用“去掉所有非字母数字”做归一化，得到 12,315 组 / 24,760 行。
> 那个数字是错的：其中 **10,121 组（82%）**配对的是 `MAX505ACNG+`（Maxim 无铅版）和
> `MAX505ACNG`（含铅版）这种 **`+` 后缀差异** —— 它们是不同的可订购料号，规格差异正好落在
> RoHS 字段上，合并会 301 掉几千个正当页面。
> 正确的归一化只忽略分隔符标点 `, ; : ' " 空格 . _ - / \ ( )`，保留 `+` 这类含义后缀。

同一料号只因分隔符标点差异被当成两个产品（`partNumber` 上的 `@unique` 拦不住）。

- 真实重复：**1,861 组，3,814 行，其中 1,211 行 `indexable=true`**。
- 最终已合并 **1,816 组（1,906 行降索引 + 301）**，保留 45 组（见 6.9：第一版保留了 158 组，
  收紧判定规则后降到 45）。
- 带分隔符标点的料号：18,213 条含 `, ; : ' "`，124 条以标点结尾，127 条超过 30 字符。

实例：

```
真重复（只差分隔符，已合并）：
  74AHC132D,112       @Nexperia               ← 保留（24 项规格）
  74AHC132D112        @Rochester Electronics  ← 301 过去（6 项规格）

  TJA1028T/5V0/20:11  @NXP Semiconductors
  TJA1028T5V02011     @Rochester Electronics

假重复（不同可订购料号，未合并）：
  MAX505ACNG+         @Maxim Integrated       ← 无铅/RoHS 版
  MAX505ACNG          @Rochester Electronics  ← 含铅版
```

来源是 Digi-Key 式 feed 里的 `,11` / `:5` / `;118` 12NC 后缀分隔符被不同渠道写成不同形式。

---

## 4. “经销商当厂商”：Rochester Electronics 106,452 条

- Rochester 是授权停产件经销商，不是这些料号的原厂。
- 其中一部分与原厂页面构成真重复（已含在第 3 节的 1,861 组里，多数由 Rochester 页面 301 到原厂页面）。
  初审说的“6,148 条”同样来自那个过度归一化的 key，不成立。
- 描述文案因此在事实上是错的，而且自相矛盾（同一颗料两页并存）：

```
MIC5203-3.0BM5-TR @Microchip
  “...manufactured by Microchip ... is no longer produced by Microchip”
MIC5203-30BM5 TR  @Rochester Electronics
  “...manufactured by Rochester Electronics ... currently in active production”
```

同类问题的其它经销商：`Flip Electronics` (1,701)、`Prolabs Ltd.` (2,643)、`NTE Electronics` (153)、
`Waldom Electronics` (78)、`Micross Components` (43)、`Quality Semiconductor` (92)。

---

## 5. 薄内容（低质量页面）

| 指标 | 数量 |
|---|---|
| specs 中 ≥8 个字段是 `"-"` | 76,463（其中 **38,464 已 indexable**） |
| specs 中 ≥12 个字段是 `"-"` | 47,945 |
| 无 datasheet | 718,959（99.95%） |
| 无图片 | 719,342（100%） |
| 无价格 | 116,775 |
| 无分类 | 77 |

薄内容集中度：`Rochester Electronics` 34,864（21,220 已收录）、`Skyworks Solutions` 11,040（9,307 已收录）、
`Silicon Labs` 2,617（2,594 已收录）、`Spansion` 3,160、`Cypress` 3,825。

问题在于**质量分没有惩罚空规格**：Rochester 那条全 `-` 规格的页面 `qualityScore=72`，
比规格齐全的 Microchip 页（70）还高，所以照样进索引。`src/lib/quality-score.js` 的权重需要复核。

正面结论：描述文案没有整段重复（>20 条共用同一描述的组数为 0），分类树也基本健康
（141 个分类里只有 `clock-dds` 一个空子树，且已在 `next.config.mjs:26` 做了 301）。

---

## 6. 已执行的修复（2026-08-15）

按“先建规范化层、再清数据”的顺序做完。每一步都有 dry-run，写库脚本默认 dry run。

### 6.1 厂商规范化层（防复发）

- 新增 [`src/lib/manufacturer-canonical.js`](../src/lib/manufacturer-canonical.js)：别名表
  （最终 104 个规范名 / 118 种旧拼写）+ `canonicalManufacturer()` / `manufacturerSlug()` /
  `isDistributorBrand()`。
- 接入所有写路径：`import-jsonl.mjs`、`import-products.mjs`、`sync-manufacturers.mjs`、
  `/api/admin/products`、`/api/admin/manufacturers`，以及 `lib/seo.js` 的 `productPath()`。
- 顺手修掉三个各自实现的 slug 函数：`import-jsonl` 的 `slugify` 和 `import-products` 的 `toSlug`
  把 `&` 变成 `-`，而产品 URL 把 `&` 变成 `and` —— 用它们建出来的品牌 slug，自己的产品页永远指不到。
- 后台建产品时 `Product.manufacturer` 存的是原始输入、`Manufacturer` 行存的是规范名，两边不一致，
  也一并修了（这是重复品牌的另一个入口）。
- 原有的 `src/lib/manufacturer-map.js` 只被两个 admin 接口用过、从没进过导入路径 —— 现在改成薄壳，
  转发到上面这一份，两处不可能再打架。

### 6.2 厂商合并

`node scripts/merge-manufacturers.mjs --apply`

| 项 | 结果 |
|---|---|
| 改写产品品牌 | 29,542 行 / 26 种拼写 |
| 新建规范名品牌行 | 3 条（`Micron Technology`、`LSI Computer Systems`、`Omron`，原来只有别名行） |
| 退休别名品牌行 | 46 条（26 条有产品 + 20 条 0 产品，档案字段先并给保留行） |
| 删除空壳品牌 | 12 条（任何拼写下都从来没有产品） |
| `Manufacturer` 行数 | 383 → 328（第二批改名后仍 328，串号修复后 **325**） |
| 0 产品品牌页 | 35 → **0** |
| 产品里的不同品牌数 | 348 → 328 → **325**（与品牌行数完全对齐） |

合并后抽查（产品数 = 两个拼写之和）：Nexperia 4,332（3,967+365）、ISSI 5,682（4,663+1,019）、
Onsemi 21,038（21,029+9）、NXP Semiconductors 16,018（16,013+5）、Micron Technology 9,959。

301 由 [`next.config.mjs`](../next.config.mjs) 从同一张别名表生成（这一轮 105 条，加上 6.6 的第二批
共 **227 条**），品牌 slug 是单个路径段，所以一条规则覆盖该品牌下所有产品 URL。
产品路由本身也会把非规范品牌段 301 到规范路径，双保险。

### 6.3 料号去重

`node scripts/dedupe-part-numbers.mjs --apply`

- 第一轮合并 1,703 组 / 1,787 行：`duplicateOfId` 指向保留页 + `indexable=false`，
  产品页读到该字段就 301。（判定规则在 6.9 收紧后，最终是 1,816 组 / 1,906 行。）
- 当时保留 158 组（详细度相同、品牌不同、规格本身不一致）→ 见 6.9。
- 不物理删除：`--reset` 可整体释放。
- 新增 `Product.duplicateOfId` 字段与索引（`prisma db push`，三个 GIN trigram 索引已确认存活）。
- 列表页/搜索/厂商页/分类页都加了 `duplicateOfId: null`，否则重复行还会占一个结果位、点进去立刻 301。

### 6.4 质量分与索引门槛

`src/lib/quality-score.js` 的 `scoreSpecs` 改成**只给填了值的字段计分**（原来按 key 数量计分，
feed 用 `-` 把 key 补齐就能拿满分）。门槛随之从 50 调到 44：

| 门槛 | 保留 | 掉出（薄内容占比） | 新进（薄内容占比） |
|---|---|---|---|
| 44 | 506,663 | 40,468（79% 薄） | 37,613（0% 薄） |
| 47 | 490,488 | 56,643（67% 薄） | 25,832（0% 薄） |
| 50 | 460,101 | 87,030（44% 薄） | 13,454（0% 薄） |

选 44：掉出的绝大多数是空规格页，进来的全是有真规格的页，总量几乎不变。继续用 50 会把 4.8 万个
规格齐全的页面一起踢出索引。索引量 547,131 → 543,530。

同时修了两个会让去重白做的地方：重算脚本结尾强制 `duplicateOfId IS NOT NULL → indexable=false`，
后台编辑产品时也不再给重复行重新打开索引。

顺带把 `compute-quality-scores.mjs` 的分页从 `skip/take` 换成主键游标 —— OFFSET 让最后几批各花 13 秒，
全量读一遍要一个多小时，现在 42–70 秒；写阶段加了重试（这次跑的时候真的断过一次连接，
半途中断会留下一半新一半旧的分数）。

### 6.5 经销商文案与占位符

`node scripts/fix-distributor-copy.mjs --apply`

- `manufactured by <经销商>` → `supplied by <经销商>`：108,274 行。
- `is no longer produced by <经销商>` → `is no longer produced by the original manufacturer`：32,024 行。
- `is currently in active production through <经销商>` → `is currently available through`：76,036 行。
- `This - component` → `This component`：74,591 行（mountType 占位符 `-` 被写进了正文，与经销商无关）。
- 渲染路径（`generateRichDescription`）和 schema.org `brand` 也改了：经销商行不再声称自己是原厂，
  结构化数据里不再把经销商当品牌。

### 6.6 去法律后缀改名（第二批）

`node scripts/merge-manufacturers.mjs --apply`（同一张别名表，扩了 59 条）

- 改写 **74,982 行 / 59 种拼写**：`Skyworks Solutions`→`Skyworks`(22,910)、`ABLIC Inc.`→`ABLIC`(16,655)、
  `Diodes Incorporated`→`Diodes`(11,094)、`Nisshinbo Micro Devices Inc.`(8,349)、
  `Infineon Technologies`→`Infineon`(6,925)、`Prolabs Ltd.`(2,643)、`Broadcom Limited`(2,507) 等。
- 品牌行仍是 328（新建 59 + 退休 59，档案字段继承给保留行）。重定向自动涨到 227 条。
- **没照搬旧表的 4 条**：`Samsung Electro-Mechanics`→`Samsung`（是另一家公司 SEMCO）、
  `Pericom`→`Diodes`（被收购品牌，按 7.1 保留）、`Socle Technology SHARP`→`Sharp`（无法确认那 14 颗料归谁）、
  以及 `ROHM Semiconductor`/`Sharp Microelectronics`/`Micron Technology`/`LSI` 这几组方向相反的
  （已经按正确方向合并过，再翻转会造成 301 环）。
- 两条改成缩写的也没照搬：`Micro Commercial Components, Corp.`→`MCC`、`IEI Integration Corp.`→`IEI`，
  只去后缀不缩写（数据手册搜的是全名）。
- **重音字符改用 slug 转写**，不改公司名：`Weidmüller` 的 slug 从 `weidm-ller` 变成 `weidmuller`，
  `Boréas Technologies` 从 `bor-as-technologies` 变成 `boreas-technologies`。旧 slug 的 301 由
  `LEGACY_BRAND_SLUGS` 生成。

同时补上了第一批漏掉的一件事：**描述正文里的旧品牌名**。合并只改了 `manufacturer` 字段，
29,542 条产品的正文还写着 “manufactured by Micron Technology Inc.”，和自己的标题打架。
现在 `merge-manufacturers.mjs` 有了 1b 步，按别名表把正文里的旧拼写一起改掉（可重复执行）。

### 6.7 图片维度从“永远拿不到”变成真实信号

`scoreImage` 原来读 `Product.imageUrl` —— 719,342 行全是 null，等于 10 分的量程永远是 0；
而页面其实一直在用 `lib/product-image-resolver` 的封装族图片，OG 和 JSON-LD 里也是它。
现在按解析结果打分：精确图 10 / 高置信 6 / 中 4 / 低 2 / 没有 0。覆盖率实测 **604,143 行（84%）**
（高 416,784、中 155,342、低 32,017），剩下 16% 是封装信息差到无法归类的行——正好该扣分。

门槛随之 44 → 48（见 6.4 表的第二段），索引量保持在 54.4 万左右。

### 6.8 明显串号的料号

`node scripts/fix-misattributed-parts.mjs --apply`

5 条 `IS25*`（ISSI 的 SPI NOR flash 系列）挂在传感器厂 `Sensata`、LED 厂 `Enfis`、
射频被动件厂 `Johanson Technology` 和 `Texas Instruments` 名下——这些公司都不做这个料。
全部归回 ISSI；前三家因此没有产品了，品牌行一并删除（否则又是 0 产品页）。

### 6.9 重复判定：只比技术规格

第一版把“详细度相同 + 品牌不同 + 规格有差异”的 158 组全部保留。实际看下来，差异几乎全在
**合规与生命周期字段**上：`Product Status`（127 组）、`China RoHS Status`（99）、`REACH Status`（91）、
`US ECCN`（65）——这些是“某个渠道的挂牌属性”，不是硅本身的属性，同一颗料在两个渠道就是会不一样。
指纹改成只比技术字段（封装字段保留，因为封装不同就是不同的可订购料号）后：

- 待合并 1,703 → **1,816 组**，降索引并 301 的行 1,787 → **1,906**。
- 仍保留 **45 组**（技术规格真的对不上，需要人工判断）。

### 6.10 复查脚本

`npm run data:audit`（`scripts/audit-data-quality.mjs`）—— 只读，把上面每一类缺陷再查一遍，
有问题非零退出，可以挂在导入流程后面。**每次批量导入后跑一次。**

---

## 7. 决策记录与仍未处理

### 7.1 被收购品牌不合并（有意为之）

`Xilinx` / `Altera` / `Maxim Integrated` / `Linear Technology` / `Atmel` / `Micrel` / `Spansion` /
`Cypress Semiconductor` / `Freescale Semiconductor` / `Fairchild Semiconductor` /
`International Rectifier` / `Burr-Brown` / `Unitrode` / `IDT` / `Pericom` 各自保留品牌页 ——
停产件按老品牌名搜索，合并到收购方会丢长尾。理由与反例都写在 `manufacturer-canonical.js` 顶部。

### 7.2 哪些算“经销商”（已定）

`DISTRIBUTOR_BRANDS` = `Rochester Electronics`、`Flip Electronics`、`Waldom Electronics`、
`Micross Components`。判断标准：**只转卖别家的硅**。

明确排除（有自己品牌的产品，不能说人家“不是原厂”）：
`Prolabs`（自有品牌光模块）、`NTE Electronics`（NTE 品牌替换料）、`Quality Semiconductor`（QSI，
真正的 IC 厂，1998 年被 IDT 收购）、`Trenz Electronic` / `Beacon EmbeddedWorks`（自有模块）。

### 7.3 仍未处理（需要补数据或人工判断）

- **datasheet 覆盖率 383 / 719,342（0.05%）**：质量分里占 15 分，实际等于永远拿不到。
  这是数据采集问题，调分数解决不了 —— 要么接数据源，要么把这 15 分让给别的维度。
  暂时保留，因为它对那 383 行是**正确**的差异化信号。
  （图片维度已经在 6.7 解决：改成给页面真实显示的封装图打分。）
- **45 组料号重复**：技术规格真的不一致，需要人工确认是不是同一颗料。
  `node scripts/dedupe-part-numbers.mjs` 的 dry run 会把它们列出来。
- **116,775 行无价格**：补数据的活。
- **77 行无分类**：查过了，不是映射漏了 —— 这 77 行的 `specs` 里**根本没有 `Category` 字段**，
  feed 就没给。料号本身认得出来（`SS34` 肖特基、`AO3400A` MOSFET、`LPC2368` MCU、
  `IRF9540N` MOSFET、`AM27C010` EPROM），但按料号猜分类是没有依据的猜测，所以没动。
  要处理只能补 feed 或人工归类这 77 行。

---

## 8. 上线后的验证（本地生产构建实测）

`npm run build && npm start`，全部改动做完后逐条 curl：

| URL | 结果 |
|---|---|
| `/manufacturer/nexperia` / `skyworks` / `issi` | 200 |
| `/manufacturer/nexperia-usa-inc` | 308 → `/manufacturer/nexperia` |
| `/manufacturer/rohm` | 308 → `/manufacturer/rohm-semiconductor` |
| `/manufacturer/micron` | 308 → `/manufacturer/micron-technology` |
| `/manufacturer/skyworks-solutions` | 308 → `/manufacturer/skyworks` |
| `/manufacturer/ablic-inc` / `diodes-incorporated` / `infineon-technologies` | 308 → 新 slug |
| `/manufacturer/weidm-ller` | 308 → `/manufacturer/weidmuller` |
| `/manufacturer/bor-as-technologies` | 308 → `/manufacturer/boreas-technologies` |
| `/manufacturer/bandk-precision` | 308 → `/manufacturer/bk-precision` |
| `/manufacturer/mediatek` | 404（空壳品牌已删） |
| `/manufacturer/sensata-technologies` / `enfis` / `johanson-technology` | 404（串号料号归还 ISSI 后没产品了） |
| `/product/nexperia-usa-inc/74AHC132D%2C112` | 308 → `/product/nexperia/74AHC132D%2C112` |
| `/product/rochester-electronics/74AHC132D112` | 308 → `/product/nexperia/74AHC132D%2C112` |
| `/product/skyworks-solutions/SKY13351-378LF` | 308 → `/product/skyworks/…` |
| `/product/sensata-technologies/IS25LE512M-RMLE-TY` | 308 → `/product/issi/…` |
| `/manufacturers` | 200，`0 products` 卡片数 = **0** |
| `/sitemap/manufacturers` | **325** 条 `<loc>`，退休 / 重音旧 slug 出现次数 = **0** |
| Rochester 产品页 | 文案 “supplied by Rochester Electronics”，无 `This - component`，JSON-LD 不输出 `brand` |

`npm run data:audit`：

```
✅ 已知重复拼写下的产品行: 0
✅ 0 产品品牌页: 0
✅ 没有品牌行的产品品牌: 0
✅ FALLBACK_BRANDS 过期或无产品条目: 0
✅ 已合并重复行仍被索引: 0
✅ 重复链 (A→B→C): 0
✅ 经销商自称 manufactured by: 0
✅ 描述含 "This - component": 0
ℹ️  只差分隔符的重复组: 1,861（3,814 行，47 个仍各自出页面）
ℹ️  薄规格行: 76,463，其中被索引 6,994
```

最终库状态：**719,342 products / 325 brands / 544,422 indexable（门槛 48）**，
品牌行 slug 与名字 100% 对齐，无重复 slug。

### 8.1 期间发现并修掉的自身问题

做的过程中有三处是我自己改出来的、又被验证抓回来的，记下来避免重演：

1. 第一轮合并只改了 `manufacturer` 字段，29,542 条产品**正文里还是旧品牌名**（见 6.6）。
2. 改名后 `FALLBACK_BRANDS` 里的旧拼写会**复活 0 产品页**，前后踩了两次 —— 现在 audit 脚本
   专门查这一项。
3. 重音字符改 slug 转写后，`Manufacturer` 行里存的还是旧 slug，**sitemap 会输出一个立刻 301 的 URL**。
   merge 脚本现在有 2b 步，按 `manufacturerSlug(name)` 反查并修正所有漂移的 slug。

另外给厂商页加了一道兜底：**产品数为 0 就 404**。品牌页的解析有三条路径（品牌行、24 小时缓存的
DISTINCT、`FALLBACK_BRANDS`），任何一条过期都会渲染空页面 —— 与其逐条守，不如在出页面前查一次数量。

---

## 10. SEO 影响核查（全部改动做完后实测）

担心把站点搞坏是合理的 —— 这次动了 10 万条产品 URL。以下是逐项实测结果，不是估计。

### 10.1 没有坏页面

| 检查 | 结果 |
|---|---|
| 主路由（首页 / 分类 / 搜索 / 博客 / BOM / RFQ / robots.txt 等 13 条） | 全部 200 |
| 随机 40 个已收录产品页 | 40 个 200，canonical 全部与请求 URL 一致，无误发 noindex |
| **sitemap 里抽 96 条 URL（8 个分片）** | **0 条重定向，0 条非 200** —— sitemap 不指向任何会跳转的地址 |
| 重复料号页跳转 | 15 个抽样全部 1 跳到 200 |
| 最坏情况链路（旧品牌 slug + 重复料号） | 2 跳到 200（配置 301 → 页面 301），未出现 3 跳 |
| 所有产品都是重复行、会导致品牌页 404 的品牌 | 0 个 |

### 10.2 唯一真正丢掉的东西，已补回

`Sensata Technologies` / `Enfis` / `Johanson Technology` 三个品牌页，因为它们仅有的几颗
`IS25*` 料号是 feed 串号、被归还给 ISSI，品牌行随之删除 —— 这三个页面**原来是有内容、也在
sitemap 里的**，直接 404 会白丢权重。已加进 `LEGACY_BRAND_SLUGS`，现在 301 到
`/manufacturer/issi`（它们唯一的料号现在归属的品牌），产品 URL 同理。

另外 12 个品牌壳（`MediaTek`、`HiSilicon`、`Unknown` 等）**保持 404**：它们在任何拼写下
都从来没有过产品，把无内容 URL 重定向到不相关的页面会被判成 soft 404，还不如干净地 404。

### 10.3 一个必须知道的副作用：lastmod 大量刷新

改文案会改 `contentUpdatedAt`，也就是 sitemap 的 `<lastmod>`：

| 原因 | 行数 | 其中已收录 |
|---|---|---|
| 品牌改名 + `This - component` 修复 | 128,043 | 80,787 |
| 经销商文案修正 | 108,274 | 60,952 |
| 合计 | 236,317 | **141,739（占已收录的 26%）** |

这是**真实的内容变更**（正文里的品牌名和错误说法确实改了），所以刷新 lastmod 在语义上是对的，
不是伪造新鲜度。但后果要有预期：Google 会看到 14 万个页面同时声称"今天更新"，抓取预算会在
未来几周向这批页面倾斜，其它页面的抓取频率相应下降。这是一次性的。

如果想避免这种冲击，正确做法是**下次改文案时分批做**（比如每天一个品牌），而不是一次性全量。
已经发生的无法撤回。

### 10.4 可回退的部分

| 改动 | 能否回退 | 代价 |
|---|---|---|
| 料号去重 | 能：`node scripts/dedupe-part-numbers.mjs --reset --apply` 后重算分数 | 无 URL 损失 |
| 索引门槛 | 能：`node scripts/set-indexing-policy.mjs --threshold=NN` + 重算 | 无 |
| 品牌合并 / 改名 | 技术上能（翻转别名表再跑一遍），**但不建议** | 会再造成一次 10 万条 URL 变动，比不回退更糟 |
| 文案修改（品牌名、经销商措辞、占位符） | **不能**，是就地 replace，没有备份 | — |

---

## 11. 搜索变慢 / 搜不到：原因与修复

反馈"搜索出问题了"之后逐层量测的结果。**两个是我这次改出来的，两个是原本就有的设计缺陷**，
都已修掉。

### 11.1 我改出来的

**(a) 表膨胀，扫描成本翻倍。** 这次批量重写了约 23.6 万条描述、10.5 万条品牌值，并且给
71.9 万行算了两遍分数。每次 UPDATE 都写新版本、留下旧版本；脚本里跑的普通 `VACUUM` 只是把空间
标记为可复用，**不会还给磁盘**，表始终停在最高水位。而搜索恰好是全表扫描型查询
（三列 `ILIKE '%q%'`），成本直接按膨胀比例上升：

```
VACUUM FULL 前： 5,697 MB（heap 2,363 MB / 索引 3,332 MB），302,502 heap pages
VACUUM FULL 后： 1,901 MB（heap 1,219 MB / 索引   682 MB），156,028 heap pages
回收 3,796 MB（66.6%），索引部分膨胀最严重（4.9 倍）
```

新增 `scripts/compact-product-table.mjs`（默认只报告，`--apply` 才执行）。
**任何批量数据迁移之后都该跑一次**，日常导入不需要。注意它会拿 ACCESS EXCLUSIVE 锁，
本机 719K 行跑了 8.8 分钟，期间表不可用。

**(b) 用旧品牌名搜索返回 0 条。** 改名之后目录里不再有"Skyworks Solutions"这个字符串，
而印在元件上、用户会去搜的恰恰是这个全称：

```
改名后：Skyworks Solutions → 0    Infineon Technologies → 0    Micron Technology Inc → 0
修复后：Skyworks Solutions → 2001  Infineon Technologies → 2001  Micron Technology Inc → 2001
```

`canonicalNamesForQuery()` 把查询串按别名表反查（双向子串匹配，所以"Nexperia USA"这种
写一半的也能命中），把对应的规范品牌名加进搜索条件。

### 11.2 原本就有的（顺手修了）

**(c) 精确计数是最贵的一步。** 广义词要在全表上数一遍，没有提前退出：

| 查询阶段（q="ldo"，111,463 命中） | 耗时 |
|---|---|
| 精确 `count()` | **6,268 ms** |
| 取前 10 条结果 | 850 ms |
| 前缀匹配 | 91 ms |

而 `/search` 的分页上限是 `MAX_PAGES(100) × ITEMS_PER_PAGE(20) = 2,000`，任何比这大的数字
只是屏幕上的一行字。改成数到 2,001 就停，超过时显示"2,001+ results found"。

**(d) 描述匹配上的全局排序。** `description ILIKE '%regulator%'` 命中约 10 万行，
`ORDER BY stock DESC` 要把它们全排一遍：

```
description contains + order by stock   1,446 ms
description contains, 不排序                9 ms
```

搜索改成分层：①料号前缀 ②料号/品牌包含（这两层数据量小，照常在库里排序）
③描述包含 —— **不在库里排序**，取 300 条候选后在内存里按库存排，填满剩余槽位。

### 11.3 一个反直觉的坑：同一条 SQL，Prisma 比原生慢 140 倍

修 (b) 时把 `manufacturer = '<规范名>'` 直接 OR 进了文本条件里，结果
"Skyworks Solutions" 从 40 秒起步：

```
原生 SQL（字面量）  EXPLAIN ANALYZE ... LIMIT 2001      218 ms
Prisma findMany（参数化） 同一条件 take: 2001         31,372 ms
Prisma count() 同条件                                  289 ms
```

参数化查询让 Postgres 走了通用计划，拿不到 `'Skyworks'` 的选择率，于是放弃索引改成扫描。
**结论：低密度等值条件用 `count()`（走索引），高密度文本条件用带 `take` 的 `findMany`（能提前退出）。**
`countSearchMatches()` 现在按这个规则分开处理两半再相加。

### 11.4 修复后实测

| 查询 | 修复前 | 修复后（API） | 页面 |
|---|---|---|---|
| `ldo` | 10,300 ms | **213 ms** | 489 ms |
| `regulator` | ~4,750 ms | **280 ms** | 641 ms |
| `stm32` | 652 ms | **149 ms** | 277 ms |
| `Skyworks Solutions` | 0 结果 → 40,836 ms | **951 ms** | 180 ms |
| `Micron Technology Inc` | 0 结果 | **1,180 ms** | 177 ms |
| `xc7a100t` | 158 ms | **109 ms** | 240 ms |
| `/search?q=ldo&page=50` | — | — | **117 ms** |

分页翻到第 50 页、切换排序都在 150 ms 内。

> 测试时如果连续快速请求会撞到 30 次/分钟的限流（页面和 API 共用一个桶），
> 那时页面会返回 0 条结果 —— 这是限流不是故障，我自己压测时就被这个骗过一次。

---

## 12. 全站排查（架构层）与部署门禁

数据修完之后按面做了一轮系统排查。**没有发现新的功能缺陷**，但发现一个只会在生产环境暴露的
路由风险，已经做成部署时自动验证。

### 12.1 通过的检查

| 面 | 方法 | 结果 |
|---|---|---|
| SQL 注入 | 静态扫全部 `$queryRawUnsafe` / `$executeRawUnsafe` | 6 处全部用 `$1/$2` 参数占位符，无字符串拼接 |
| XSS | 扫 `dangerouslySetInnerHTML` | 仅用于后台常量图标 SVG 和 `JSON.stringify` 后的 JSON-LD |
| 鉴权 | 未登录访问 8 个 `/api/admin/*` GET + POST/DELETE | 全部 401；后台页面 307 跳登录 |
| 参数健壮性 | `page=0/-5/99999/abc`、非法 sort/order、引号型 payload、空字节、`limit=99999` | 14 组全部 200，无 500 |
| 结构化数据 | 解析各页面 JSON-LD | 3~5 块/页全部合法；产品页 `Product+BreadcrumbList+FAQPage`，厂商页 `Brand+ItemList` |
| Canonical | 分页页面 | `?page=3` 自我 canonical（不回指第 1 页），`/search` 为 `noindex, follow` |
| 表单校验 | 读 `/api/rfq` 校验分支 | 必填缺失→400、邮箱正则→400、BOM 10MB 上限、3 次/小时限流、垃圾内容分级 |
| robots.txt | 读路由 | 正确 Disallow `/admin/`、`/api/`、`/search` 及 `sort/order/status/mount/stock` 切面参数 |

### 12.2 发现的风险：编码斜杠 + 反向代理

**59,869 个料号含 `/`**（`PIC16F877A-I/P`、`TJA1028T/5V0/20:11` 等），它们的页面 URL 带 `%2F`：

```
/product/microchip/PIC16F877A-I%2FP
```

Next.js 自己能正确处理（本地实测 200）。**但 nginx 如果在 `location` 块里改写 URI，会先把
`%2F` 解成真斜杠，路由匹配不上，这 8% 的目录直接 404** —— 而且构建、首页健康检查、
本地测试全都发现不了。同类字符还有 `#`（41,249 个）、空格（10,952 个）、`+`（40,616 个）。

正确的 nginx 写法（README「Reverse proxy requirements」有完整说明）：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;   # 不要结尾斜杠，不要 rewrite
}
```

### 12.3 部署门禁

新增 `scripts/smoke-check.mjs`，`update.sh` 在设置了 `HEALTH_URL` 时自动执行，失败即中止部署。
测试目标从数据库现取（不硬编码料号，不会因为某个料号下架而失效）：

```
✅ homepage / sitemap index / brand sitemap shard        200
✅ part number with %2F      200   (PIC16F877A-I/P)
✅ part number with %23 (#)  200
✅ part number with space    200
✅ part number with %2B (+)  200
✅ retired brand slug        308 → /manufacturer/weidmuller
✅ canonical brand page      200
✅ duplicate part redirects  308 → /product/ablic/S-8424AAAFT-TB-G
```

失败时会直接打印 nginx 该怎么改。`SKIP_SMOKE=1` 可跳过。

---

## 13. 对照 Google 官方文档复核（2026-08）

拿几条关键判断去核对了搜索引擎官方文档，结果修正了一处**一直存在的结构化数据错误**，
并确认了两条风险的量级。

### 13.1 修复：无价商品输出了非法的 Offer（116,775 条，其中 10,815 条已收录）

Google 的 Product 文档写得很明确：`offers` 本身是可选的（`review` / `aggregateRating` /
`offers` 三选一即可获得富媒体资格），但**只要输出了 Offer 对象，`price`（或
`priceSpecification.price`）就是必填**。

而 `generateProductJsonLd()` 原来在无价时输出的正是一个只有 availability 和 seller、
**没有 price 的 Offer** —— 这不是"信息不全"，是**无效结构化数据**，Search Console 会按
"Missing field 'price'" 报错。

修复：无价时**完全不输出 `offers` 节点**。代价为零 —— 没有价格本来就拿不到价格富媒体结果；
而 `price: 0` 反而更糟，schema.org 里那表示"免费"，与 RFQ 询价是两回事。

### 13.2 确认：`%2F` 的风险比 nginx 更广

除了反向代理解码的问题，**CDN / WAF 层面对含 `%2F` 的路径直接返回 403 是常见的安全加固策略**
（用于拦截路径穿越类攻击）。也就是说即使 nginx 配对了，套一层 CDN 仍可能让这 59,869 个页面变成 403。

Googlebot 本身不会改写链接的编码形式（发现什么编码就抓什么编码），所以问题不在爬虫，
在中间层。`scripts/smoke-check.mjs` 走的是公网 URL，正好覆盖这整条链路。

### 13.3 确认：lastmod 的风险是"被判定为不可信"

Google 明确说明**会忽略它认为不可靠的 `lastmod`**，业界共识也是"只有内容真的变了才更新它"。

这次刷新的 141,739 条 lastmod **是真实的内容变更**（正文里的品牌名、经销商措辞确实改了），
所以信号本身诚实、没有造假。风险在于**集中度**：同一天大批量刷新，容易让 Google 降低对本站
lastmod 的整体信任度，进而在将来真正需要它时不再采信。

结论不变：已发生的无法撤回，**今后改文案必须分批**（每天一个品牌量级）。

### 13.4 确认：301 至少保留一年，别清表

Google 的建议是**站点迁移后 301 至少保留一年**，信号完成转移后即使撤掉也会保留；高价值页面
建议 2–3 年或长期保留。大站完整消化通常要 6–12 个月。

本次迁移了 104,524 条产品 URL，全部 301 由 `MANUFACTURER_ALIAS_GROUPS` 自动生成 ——
**这意味着"清理别名表"等价于"删除线上 301"**。已在
`src/lib/manufacturer-canonical.js` 顶部加了显式警告：最早可考虑精简的时间是 **2027-08**。

预期也要有：大规模 URL 变动后短期流量波动是正常的，恢复周期以月计，不是以天计。

> 来源：Google Search Central（Product 结构化数据、Crawl budget）、Search Engine Journal /
> Search Engine Roundtable（301 保留时长）、Yoast（lastmod）、Adobe Experience League（%2F 403）。
> 具体链接见交付说明。

---

## 14. 缓存失效缺失导致的冷启动惩罚

### 14.1 问题

`unstable_cache()` 的条目**只能靠标签清除**（`revalidateTag`），而**全项目没有一处调用它** ——
10 个标签全是声明了从不使用。`revalidatePath` 清的是渲染页面缓存，清不掉这些聚合结果。

后果是这些昂贵聚合的 TTL 只能设得很短（分类树和计数都是 300 秒），因为超时是唯一的刷新途径。
而一次未命中的代价很高，实测最大的一级分类：

| 查询 | 耗时 |
|---|---|
| 分类树 + 每个子分类计数（递归 CTE + GROUP BY） | 0.9 – 2.5 s |
| 子树产品总数 `count()` | ~0.9 s |
| **`/category/embedded` 整页冷启动** | **5.5 s**（热 61 ms） |

300 秒 TTL 意味着爬虫按目录抓取时，**每小时要撞上 12 次这个 5.5 秒**。

### 14.2 修复

1. `src/lib/revalidate.js` 新增 `revalidateDataCaches()`，一次清掉全部 10 个标签。
2. `POST /api/admin/revalidate` 支持 `{"dataCaches": true}`（只清聚合）
   和 `{"all": true}`（页面 + 聚合，原来只清页面）。
3. 有了主动清除手段，分类树和分类计数的 TTL 从 **300 秒提到 3600 秒**。
4. `merge-manufacturers.mjs` 结束时打印可直接执行的清缓存命令。

实测（新实例，应用缓存为空）：

| 页面 | 修复前冷启动 | 修复后冷启动 | 热 |
|---|---|---|---|
| `/category/embedded` | 5,507 ms | **307 ms** | 29 ms |
| `/category/power-management` | — | 1,959 ms | 19 ms |
| `/manufacturer/texas-instruments` | 598 ms | 43 ms | 19 ms |
| 首页 | 18 ms | 21 ms | 7 ms |

**代价要知道**：批量导入之后，分类页的数字最多会陈旧 1 小时，除非主动清：

```bash
curl -X POST https://fpgacenter.com/api/admin/revalidate \
     -H "Content-Type: application/json" -H "Cookie: <admin session>" \
     -d '{"all": true}'
```

### 14.3 顺带确认：FAQ 结构化数据已无富媒体价值

Google 在 2023 年 8 月把 FAQ 富媒体结果限制到权威政府/健康站点，**2026 年 5 月完全下线**
（连报表都撤了）。产品页上的 `FAQPage` 标记现在拿不到任何 SERP 展示。

但 Google 也说明**无用的结构化数据不会造成问题**，而且 FAQ 内容本身对用户和 AI 检索仍有价值，
所以**不动**：删除有风险（改渲染逻辑），保留零成本。

---

## 15. 测试工程视角的第二轮：4 个 bug + 1 个被推翻的假设

用等价类 / 边界值 / 状态迁移 / 幂等性 / 故障注入这几种方法各走一遍，而不是继续随机点页面。
**3 个 bug 是这次改造自己引入的。**

### 15.1 搜索"Inc"会把查询膨胀成 40 个品牌条件（本次引入，已修）

对 `canonicalNamesForQuery()` 做危险输入测试：

| 输入 | 命中品牌数 |
|---|---|
| `Skyworks Solutions` | 1 ✅ |
| `Inc` | **40** ⚠️ |
| `Corp` | **12** ⚠️ |
| `Ltd` | **7** ⚠️ |
| `Semiconductor` | **6** ⚠️ |

根因：子串匹配双向且无锚点，任何含 "Inc" 的别名都命中，然后每个都变成一个 `manufacturer =`
的 OR 分支。改成**锚定匹配**（必须从头匹配）+ 最多 3 个的上限；修复后这些通用词全部归零，
而所有旧品牌名回归用例保持有效。

### 15.2 去重胜出者不稳定，URL 会在 200/301 之间摆动（本次引入，已修）

胜出者排序里用了 `qualityScore` 做 tie-break，而它**每次导入后重算都会变**。实测当时状态：
1,816 个已合并的组里，**有 1 组重跑就会换胜出者**——表现为某页面这次是正文、下次变 301。

改成**粘性**：合并过的组保持原胜出者，除非挑战者有严格更多的真实规格（真数据改进，不是分数噪声）。

### 15.3 粘性修复当场引入的自引用（已修）

加粘性后 `losers: ranked.slice(1)` 就错了——粘性胜出者不是 `ranked[0]`，会被算进自己的
loser 列表，`duplicateOfId` 指向自己。改成按 id 排除。**修一个引一个，所以每步都要验证。**

### 15.4 后台改料号后重复关系不清除（原有，已修）

改料号 = 这行不再是原来那颗料，但两个方向的 `duplicateOfId` 都还留着：这行继续 301 到
不相干的料号，指向它的行继续 301 到一个已经变了身份的料号。改成双向清除，交给下次去重脚本重判。
（删除场景 schema 上已有 `onDelete: SetNull`，本来就对。）

### 15.5 被实测推翻的假设：数据库排序并不更快

我怀疑"按料号排序能走索引提前退出，不需要分页池"。实测：

| 排序 | ldo | regulator |
|---|---|---|
| `partNumber ASC` 第 1 页 | 744 ms | **5,088 ms** |
| `partNumber ASC` 第 50 页 | **13,370 ms** | 6,725 ms |
| `partNumber DESC` | 21 ms | 10 ms |
| `manufacturer ASC` | 8 ms | 15 ms |

数据库排序在 8ms 到 13 秒之间剧烈波动（取决于优化器选索引游走还是位图扫描），分页池恒定
~100ms。**假设被数据否定，保留原方案。** 未截断路径也确认无病态用例（4–14ms）。

### 15.6 故障注入：数据库不可达

| 路径 | 状态 | 评价 |
|---|---|---|
| `/`、`/manufacturers` | 200 | 降级渲染 ✅ |
| `/api/health` | 503 | 正确 ✅ |
| `robots.txt`、`sitemap.xml` | 200 | 有 try/catch ✅ |
| `/category`、`/search`、产品页 | 500 | 未降级 ⚠️ |

**信息泄露检查全部通过**：500 页面不含连接串、密码、Prisma 内部错误、文件路径或堆栈。

**但发现一个数据诚信问题**：降级时首页把写死的 `stock: 15000` / `minPrice: 2.85` 当**真实库存和价格**
展示。对一个卖现货的站点，这是客户可能据以询价的数字。已把 `FALLBACK_PARTS` 的库存价格清空，
现在渲染成 "Available on request" / "RFQ"——在任何状态下都为真。分类计数（146K 等）是近似值
且只在故障时出现，危害小得多，保留。

`/category`、`/search`、产品页返回 500 **没有改**：数据库真的挂了时，500 让 Google 知道
"临时故障、稍后重试"，比返回 200 配降级内容更安全（后者可能让降级页被收录）。

### 15.7 其它通过项

- **幂等性**：`merge-manufacturers`、`dedupe-part-numbers`、`fix-distributor-copy`、
  `fix-misattributed-parts` 连跑两次全部 no-op。
- **边界值**：API `limit=-1/0/1/25/26/1000` 全部正确钳制到 1–25；查询长度 2/3/100/101/300
  行为正确；Unicode（`电容`/`Ω`/`±5V`/`café`）无异常。
- **sitemap 分片越界**：`products-110/999/0/-1`、`nonsense` 全部 404，有效分片 200。
- **404 语义**：7 类不存在的资源全部真 404，无 200 空页。
- **数据不变量 9 项**：自引用、重复链、悬空指针、重复行被索引、品牌 slug/名重复、
  无品牌行的产品、索引与门槛一致性——全部为 0。

---

## 16. 第三轮：链接完整性、表单主路径、渲染残留

### 16.1 内部链接完整性（改名后最该查的一项）

从 14 个入口页收集 **654 条唯一内部链接**逐条请求：

```
❌ 失效 (4xx/5xx): 0
↪️  指向重定向: 0
```

59 个品牌改名之后，**没有任何站内链接指向旧 slug**——因为链接全部由数据库数据生成，没有硬编码。

> 测试自身的坑：第一版爬虫从 RSC flight payload 里提链接，报出一条
> `/manufacturer/allegro-micro` 失效。实际 href 是 `allegro-microsystems`，
> 是**流式 payload 在 `<script>` 分块处被截断**造成的假阳性。改成只解析真实
> `href="..."` 属性后复测干净。**测试工具本身也会说谎，报错要先证伪。**

### 16.2 询价表单：限流把合法请求挡在门外（原有，高业务影响，已修）

端到端跑 RFQ 提交路径时，7 个校验用例全部返回 **429 而不是 400**——顺藤摸下去发现：

**限流是"调用即消耗"的，校验失败的请求也计入每小时 3 次的配额。**

也就是说：访客邮箱格式输错 3 次，这一小时就**再也提交不了询价**了。而这在日志里看起来
完全正常（"429 = 成功拦截滥用"），在一个询价就是转化事件的站点上，这是直接丢单。

改成两级限流：

| 层 | 配额 | 何时消耗 |
|---|---|---|
| 防洪闸 `rfq-req` | 30 次/小时 | 请求进来就消耗（挡住 10MB multipart 灌包） |
| 提交配额 `rfq` | 3 次/小时 | **只在校验通过、即将成为线索时消耗** |

`/api/contact` 是同样的写法，一并改（40 / 5）。

修复后实测：

```
7 个校验分支 → 全部 400（不再吞配额）
正常提交 → 200，落库 1 条，status=new sourceChannel=direct
第 2、3 次 → 200      第 4、5 次 → 429  ✅ 正好 3 次/小时
测试数据已清理，残留 0 条
```

### 16.3 顺带修的 API 健壮性

`/api/rfq` 的 `parts` 只接受 **JSON 字符串**（表单走 multipart，字段天然是字符串）。
用 JSON body 传真数组会被 `JSON.parse` 转成 `"[object Object]"` 而拒绝——站内表单没问题，
但对任何 API 调用方都是坑。改成两种都接受。

### 16.4 产品页规格表渲染占位符（原有，已修）

渲染扫描发现产品页存在 `<td>-</td>` 行：供应商 feed 把整套字段名补齐、值填 `-`，
**规格表就把"Operating Temperature | -"这种行照原样渲染出来**。

76,463 个产品带 8 个以上这种行——页面看起来"有规格"，实际没有，与质量分已经学会忽略的
是同一批占位符。抽出共享的 `meaningfulSpecEntries()`，正文和表格用同一套判定：
占位行不渲染，全是占位符的产品干脆不渲染规格表。

修复后 14 类页面全部干净：无 `undefined` / `NaN` / `[object Object]` / `Invalid Date` /
占位符残留。

---

## 17. 第四轮：鉴权吊销缺口（重要）与静态审查

### 17.1 会话无法吊销（原有，严重，已改代码但未构建验证）

`verifyToken` 只校验 HMAC 签名和 24 小时过期，**从不回查数据库**。token 里同时带着
userId 和 role，所以在管理动作之后的最长 24 小时里：

| 管理动作 | 实际效果 |
|---|---|
| 停用账号 `isActive=false` | **不生效**，仍有完整权限 |
| 删除账号 | **不生效** |
| 降级角色（admin→viewer） | **不生效**，旧 role 随 token 走 |

最严重的一处：`/api/admin/users` 用 `getAdminSession` 裸判断 ——
**被停用的管理员可以用旧 cookie 把自己重新启用，或新建一个管理员账号**。
也就是说"停用被盗账号"这个操作等于没做。

修复：

- 新增 `resolveLiveSession()`：每次请求回查 `AdminUser` 的 `isActive` 与 `role`；
  **角色以数据库为准**，降级立即生效
- 遗留主管理员（`userId=0`，无用户行）豁免 —— 它的凭据就是主密码，轮换主密码即为吊销
- 数据库不可达时**失败关闭**（503）：无法确认调用者身份的管理接口，不能凭一个 cookie 就吐出客户 PII
- 三个守卫改为 async，47 处调用点加 `await`；`/api/admin/users` 的 4 处裸判断换成 `requireAdmin`

> **这轮改动未经构建验证** —— 安全分类器在改完之后拦住了命令执行。已用 Grep 逐条核对
> 全部 70 处出现（3 处定义、4 处注释、所有 import、47 处调用点）均正确，但仍需
> `npm run build` 确认。若报错，必然是漏掉的 `await`，错误会直接指到行号。
>
> 过程中我自己制造过一个错误：批量加 `await` 的正则把**函数定义**也匹配了，
> 生成了 `export async function await requireAuth(...)`。已修正。**批量正则改代码必须回读验证。**

### 17.2 限流器的多进程隐患（已加告警）

`.env` 里两行 `REDIS_URL` 都是注释掉的，走每进程内存计数。分析：`memCheck` 全同步、
无 `await`，**单进程内不存在竞态**（Node 事件循环不会打断同步函数）。但 PM2 若以 cluster
模式运行 N 个 worker，每个 worker 一份计数，**所有配额乘以 N**。

项目没有 `ecosystem.config.*`，当前是单实例 fork 模式所以正确。已加检测：发现 PM2 实例号
且无 Redis 时打印一次告警；README 补了这条部署约束。

### 17.3 静态审查通过的部分（无需修改）

- **BOM 上传**：大小上限、扩展名白名单、双扩展名拦截、magic byte 校验、私有目录
  （不在 `public/` 下）、随机文件名不含用户可控路径 —— 加固完整。
- **BOM 下载**：`path.basename` + 解析后目录前缀校验挡路径穿越；下载文件名
  `[^\w\s._-]→_` 防头注入；`attachment` + `nosniff` + `CSP default-src 'none'` + `no-store`。
- **邮件失败不丢单**：先落库、再 fire-and-forget 发信，`.catch` 齐全。
- **垃圾判定**：硬信号只有 3 个（honeypot / parts 无法解析 / 无有效料号），
  且执行顺序是"解析 → 校验 → 计配额 → 序列化 → 判定"，我改的"接受数组形式 parts"
  不会触发误判（`detectSpam` 拿到的始终是字符串）—— 特意回读确认过。
- **隐私保留期**：`purge-pii.mjs` 与隐私政策第 7 条一致（24 个月剥离 IP/UA/追踪数据、
  30 天删除硬垃圾）。政策承诺的"分析数据 26 个月"无需单独清理 —— 分析接口是从
  `RfqSubmission` 现算的，不存在独立留存。
- **`bom-download`** 早就内联做了 `isActive` 校验，说明这套设计原本就是有意的，
  只是没推广到其它路由；`resolveLiveSession()` 正是把它统一了。
