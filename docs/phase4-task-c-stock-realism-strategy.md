# Task C: Stock Field Realism Strategy

> 设计文档（不实际改数据库）。涉及业务决策与诚信风险，需用户拍板后实施。

---

## 1. 现状（实测数据）

`Product.stock` 字段的实际分布（719,342 总数）：

| 区间 | 产品数 | 占比 |
|---|---:|---:|
| stock = 0 | 193 | 0.027% |
| stock 1-9 | 204 | 0.028% |
| stock 10-99 | 75,985 | 10.6% |
| stock 100-999 | 51,887 | 7.2% |
| **stock 1,000-9,999** | **442,853** | **61.6%** ← 主体 |
| **stock ≥ 10,000** | **148,220** | **20.6%** |
| stock NULL | 0 | 0% |

**按 lifecycle 状态拆**：

| Status | 总数 | stock > 0 | 比例 |
|---|---:|---:|---:|
| active | 471,587 | 471,415 | **99.96%** |
| obsolete | 242,575 | 242,555 | **99.99%** |
| eol | 0 | 0 | — |

**关键观察**：
- 242,575 个 obsolete 产品中 99.99% 声明 stock > 0
- 主体（61.6%）stock 在 1,000-9,999 区间
- 这是 seed 阶段的 mock 数据，不是真实库存

---

## 2. 风险分析

### 2.1 Schema.org / Google Shopping 风险

当前每个 `indexable=true` 产品页输出 JSON-LD：

```json
{
  "@type": "Product",
  "offers": {
    "@type": "AggregateOffer",
    "availability": "https://schema.org/InStock",  // ← 这行
    "lowPrice": ..., "highPrice": ..., "offerCount": 6
  }
}
```

Source: `src/lib/seo.js:131-156`。`availability` 字段根据 `product.stock > 0` 设置为 `InStock` 或 `OutOfStock`。

**风险**：
1. **Google Merchant Center 政策**禁止虚假库存信息。如果产品被 Google 抓取作为购物广告或 Knowledge Graph 收录，"InStock" 主张可被验证。99.99% obsolete 产品声明 InStock 是不诚信信号。
2. **Helpful-Content 算法**间接信号：网页声明与现实不符，间接降低 EEAT 评分
3. **用户投诉风险**：买家发现"显示有库存"但实际"submit RFQ"才能确认时，会产生差评

### 2.2 业务诚信风险

- 销售流程：用户看到 "2,445 In Stock"，提交订单或 RFQ，发现实际是询价 → 转化漏斗信任损失
- 行业声誉：specialty distributor 的核心资产是 trust，谎报库存毁这个

### 2.3 EEAT 风险

Google 在 2024 年的 spam policy 更新中加强了对 "fake reviews / fake inventory" 信号的识别。719K 产品全部 InStock 是 spam-like pattern。

---

## 3. 四个修复方案对比

### 方案 A：全部清零 + LimitedAvailability

把 stock 全部设为 0 或 NULL，schema 改为 `LimitedAvailability`。

**优点**：最诚实，零风险
**缺点**：
- 转化率会大幅下降（"In Stock" 是强心理信号）
- Google 看 100% LimitedAvailability 也不喜欢
- 对真有库存的部件不公平
**ROI**：低

### 方案 B：三档分级制（推荐）

按数据来源分三档：

| Tier | stock 字段 | schema.org availability | 用户可见标签 |
|---|---|---|---|
| **T1 Confirmed Stock** | 真实数字 | `InStock` | "In Stock: N units" |
| **T2 Sourceable** | NULL | `LimitedAvailability` | "Available on request" |
| **T3 EOL/Obsolete (no stock)** | 0 或 NULL | `Discontinued` or `LimitedAvailability` | "Discontinued — RFQ for sourcing" |

**判断规则**（用 lifecycle + 来源信号推断）：
- Active 状态 + (manufacturer in [authorized partners]) → 可能 T1
- 其他 Active → T2
- Obsolete / EOL → T3

但前提是有 "authorized partners" 数据。当前数据库没有。所以：

**初始保守版本**：
- Active + stock > 0 → 保留 stock，T1（**接受当前数据是估算值**，但只对 active 状态保留）
- Obsolete → 强制 stock = 0 (或 NULL)，T3（这是诚信底线）
- 短期内 99.99% obsolete 改为不显示 stock，长期接采购系统真实数据

**优点**：保留 active 产品的转化率，删除 obsolete 的诚信地雷
**缺点**：active 产品的 stock 仍是估算值（不是真实库存）
**ROI**：高 — 解决 99.99% 的 obsolete schema 风险

### 方案 C：按 lifecycle 全局策略

把所有 stock = 0 改写策略：
- Active 保留 stock，但加 `inventoryLevel` schema 字段表达"接近 N"
- Obsolete + EOL 直接 schema 用 `LimitedAvailability`，stock 字段保留但不展示

**优点**：技术上简单（schema 层切换）
**缺点**：数据库 stock 字段仍是假数据，未来对接真实库存时仍需大改
**ROI**：中

### 方案 D：渐进式真实化

分多个阶段：
- 阶段 D1（立即）：obsolete + EOL 强制 stock = NULL，schema `LimitedAvailability`
- 阶段 D2（1-3 月）：与采购侧对接，对 Top 1000 高频询价部件标真实库存
- 阶段 D3（6 月+）：API 集成真实库存系统
- 阶段 D4（长期）：所有 active 产品对接

**优点**：风险最小，逐步落地
**缺点**：D2/D3 需要采购侧介入，可能阻塞
**ROI**：高（如能推动 D2）

---

## 4. 推荐方案：方案 B 初始保守版本 + 后续向 D 演进

### 4.1 立即可执行的 P0 修复

```js
// 对所有 status IN ('obsolete', 'eol', 'nrnd') 的产品：
UPDATE "Product"
SET stock = NULL
WHERE status IN ('obsolete', 'eol', 'nrnd');
```

影响：242,575 obsolete 产品的 stock 字段被清空。

### 4.2 配套修改 generateProductJsonLd

`src/lib/seo.js:135` 当前逻辑：

```js
availability: product.stock > 0
  ? 'https://schema.org/InStock'
  : 'https://schema.org/OutOfStock',
```

改为：

```js
availability: (() => {
  if (product.stock != null && product.stock > 0) return 'https://schema.org/InStock';
  if (product.status === 'obsolete' || product.status === 'eol') return 'https://schema.org/Discontinued';
  if (product.status === 'nrnd') return 'https://schema.org/LimitedAvailability';
  return 'https://schema.org/LimitedAvailability';  // active + no stock = sourcing on request
})(),
```

### 4.3 配套修改产品页 UI

`src/app/product/[manufacturer]/[partNumber]/page.js:379-381` 当前：

```js
<span style={{ fontWeight: 600, color: product.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
  {product.stock > 0 ? `${product.stock.toLocaleString()} In Stock` : 'Out of Stock'}
</span>
```

改为：

```js
{product.stock != null && product.stock > 0
  ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{product.stock.toLocaleString()} In Stock</span>
  : product.status === 'obsolete' || product.status === 'eol'
    ? <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Discontinued — RFQ for sourcing</span>
    : <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Available on request</span>
}
```

### 4.4 影响评估

修复后产品分布：
- Active 471K 仍显示具体 stock 数 → 转化率不受影响
- Obsolete 242K 改显示 "Discontinued — RFQ for sourcing" → 更诚信，CTA 引导用户提交 RFQ
- 已 Indexable 525K 产品的 JSON-LD 中，242K obsolete 改为 `Discontinued`，符合 Google Shopping 政策

### 4.5 SEO 影响预期

**短期（4-8 周）**：
- Google 抓取更新后的 schema，`Discontinued` 信号会让 obsolete 产品在搜索结果中显示 "Discontinued" 标签 — 这实际上**对 obsolete sourcing 业务有利**（用户搜 obsolete 部件时看到 Discontinued 标签会更愿意点击）
- Google Shopping 不会再因 false InStock 投诉

**长期**：
- 站点 EEAT 信号增强
- 用户在产品页看到"RFQ for sourcing"更直接进入转化流程

### 4.6 不在本次范围

- 与采购系统对接（需采购侧介入）
- Active 产品的 stock 真实化（需 API 集成）
- 历史 RFQ 数据的库存校准

---

## 5. 待用户拍板的决策

1. **是否接受方案 B 初始保守版本？**（推荐）
2. **是否需要保留 obsolete 产品的 stock 数显示**（即使是估算）？如果保留，需要明确"估算"标注
3. **`Discontinued` schema 标签是否合适？** — 部分 obsolete 产品实际可寻源（FPGACenter 业务核心），用 `LimitedAvailability` 可能更准确（"limited but obtainable"）

---

## 6. 实施 checklist（拍板后）

- [ ] 备份当前 Product.stock 字段（JSONL，类似描述备份流程）
- [ ] 执行 SQL：`UPDATE Product SET stock = NULL WHERE status IN ('obsolete', 'eol', 'nrnd')`
- [ ] 改 `src/lib/seo.js:135` JSON-LD availability 逻辑
- [ ] 改 `src/app/product/[manufacturer]/[partNumber]/page.js:379` UI 显示
- [ ] 改 `src/app/category/[[...slug]]/page.js` 分类页表格（Stock 列）
- [ ] 改 `src/app/page.js` 首页 Popular Parts 表格的 Stock 列
- [ ] build + verify HTML 输出
- [ ] 监控 GSC 7 天，确认无 schema.org 投诉

预计实施工时：2-3 小时（含备份与验证）
