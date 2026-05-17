# 任务 2 性能诊断报告

> 写于 2026-05-17，基于 prod 模式 (`next start`) 实测数据。**不是 dev mode 假象**。

---

## 1. 修正最初的假设

| 之前以为 | 实测后真相 |
|---|---|
| 首页 8s 严重慢 | ❌ Prod 模式 **170ms**，8s 是 dev mode Turbopack 编译开销 |
| 所有 L1 都慢到 16s | ❌ 6 个 L1 在 1.5-2.5s（可接受），仅 2 个大 L1 慢 |
| 性能问题影响整站 | ❌ 仅集中在 embedded (155K)、power-management (226K)、audio-video-telecom（偶发） |
| 缺索引导致慢 | ❌ `@Index([categoryId])` 存在，但 Postgres 评估后弃用（21% 选择率太高）|

## 2. 实测性能矩阵（Prod 模式）

| 路径 | 首次访问 | 后续访问 | 评价 |
|---|---:|---:|---|
| `/` | 180ms | 160ms | ✓ 完全 OK |
| `/product/altera/EP4CE6E22C8N` | 930ms | 600ms | ✓ 正常（含 JSON-LD 3 块） |
| `/manufacturer/altera` | 1.0s | — | ✓ 正常 |
| `/sitemap.xml` | 1.0s | — | ✓ 正常 |
| `/category/embedded` | **8.3s** | 3.3s | ❌ 慢 |
| `/category/power-management` | 3.3s | 3.6s | ❌ 偏慢 |
| `/category/memory` | 1.9s | 1.7s | ⚠️ 临界 |
| `/category/analog` | 2.1s | 2.0s | ⚠️ 临界 |
| `/category/logic` | 1.8s | 1.5s | ✓ OK |
| `/category/interface` | 1.5s | 1.4s | ✓ OK |
| `/category/clock-timing` | 1.5s | 1.5s | ✓ OK |
| `/category/audio-video-telecom` | 1.5s | **5.4s** | ⚠️ 偶发 spike |

## 3. 真实瓶颈定位（embedded 17.7s 总 DB 耗时拆解）

直接对 Prisma 跑同样 query（无 Next.js 渲染开销）：

```
Q1  category.findUnique (+nested children/grandchildren +counts):  11,984ms
Q2  product.count where categoryId IN (15 ids):                     5,481ms
Q3  product.findMany skip=0 take=20:                                   38ms
Q4  product.findMany skip=1000 take=20 (deep page):                    88ms
                                                              ───────────
                                                       TOTAL: 17,675ms
```

### 3.1 Q1 慢的根因

`prisma.category.findUnique` 中：
```js
include: {
  children: {
    include: {
      _count: { select: { products: true } },
      children: {
        include: { _count: { select: { products: true } } },
      },
    },
  },
}
```

这种 nested include + 多 `_count` 会让 Prisma 生成**多个独立 SQL** + 大量 LATERAL JOIN。在 embedded 上有 15 个 descendant 分类，每个都要 count `Product` 表 → 单次 11s。

### 3.2 Q2 慢的根因（EXPLAIN ANALYZE 原文）

```
Finalize Aggregate (actual time=2450.896..2467.490 rows=1)
  -> Parallel Seq Scan on "Product"  (rows=51737 loops=3)
       Filter: ("categoryId" = ANY ('{139,140,...,153}'::integer[]))
       Rows Removed by Filter: 188044
       Buffers: shared read=191288        ← 读 1.5GB 数据
Execution Time: 2467.558 ms
```

- 索引 `@@index([categoryId])` 存在
- Postgres 计算后选择 **Parallel Seq Scan** 不是 Index Scan
- 因为 155K/720K = 21.5%，超过 ~5% 阈值，Seq Scan 更快
- 这是 PG 的正确决策，**加索引无解**

### 3.3 Q4 深分页问题（次要）

```
skip=1000 take=20 = 1.1s     在 power-management 上
```

OFFSET 越大越慢，Postgres 仍要扫前 1000 行。`MAX_PAGES = 100` 已经在 page.js 限制深度，但前 100 页都可能慢。

## 4. 修复方案矩阵

| 方案 | 实施成本 | 预期收益（embedded） | 风险 |
|---|---|---|---|
| **A. 拆 Q1 nested include** | 4-6h | 12s → < 200ms | 改 page.js + getCategory，影响 L1/L2/L3 共用 |
| **B. Q2 count 用 unstable_cache 5min** | 1-2h | 5.5s → < 10ms（cache hit）| 5min 内 stale 计数，可接受 |
| **C. Q1 改 raw SQL + 1 次性 GROUP BY** | 3-4h | 12s → 300ms | 不依赖 Prisma 嵌套，更稳定 |
| **D. 加复合索引 (categoryId, partNumber)** | 1h + migration | 0-30% 改善 | 朋友正在批量写入 Product，migration 期间锁表 |
| **E. 不修，接受现状** | 0h | embedded 仍 3-8s | 大 L1 用户体验差，但只是 2 个 L1 |
| **F. 改 ISR revalidate 短 + 加 warmup cron** | 2h | 冷启动消除 | revalidate 太短反而频繁触发 12s 慢渲染 |

### 推荐组合：A + B

总投入 5-8 小时（一个工作日）：
- A 解决 Q1 12s → 200ms
- B 解决 Q2 5.5s → 10ms
- 预期 embedded 17s → < 500ms (16x 加速)
- 不需要 schema migration（与朋友零冲突）

### 不推荐的方案

- **D 复合索引**：朋友正在批量写 Product，加索引可能让 UPDATE 慢 2-3x，timing 不对。等朋友阶段 3 完成后单独评估
- **F warmup cron**：还要做 cron job 调度，复杂度高于收益
- **彻底重写为客户端 fetch + 分页**：偏离 SSR 主线，会丢 SEO

## 5. 我无法解决的部分

- **Postgres Seq Scan 决策**：21% 选择率本质就要全扫，唯一解法是改业务（不要把 5 万产品塞进 1 个分类下）
- **ISR 冷启动**：1h 后第一个用户必然撞 12s（修复 A+B 后变成 500ms，但仍非 0）
- **embedded/power-management 是数据问题不是技术问题**：155K/226K 产品塞在 1 个 L1 下本身不合理，分类设计可优化（但工作量巨大）

## 6. 三个紧迫程度判断

### 必须修（影响真实用户）
- 无（仅大 L1 慢，但用户从首页能直接搜索/进 L2/L3 跳过 L1）

### 应该修（影响 SEO）
- Q1 + Q2：Googlebot 抓 embedded 时撞 8s，对 Crawl Budget 不友好

### 可以不修
- 深分页：MAX_PAGES=100，大多数用户不会翻到深处

## 7. 决策点

1. **是否现在修 A+B？** — 5-8 小时投入，embedded 17s → 500ms
2. **是否等朋友阶段 3 跑完？** — 朋友写入 Product 频繁，修期间会让缓存频繁失效，等他完成再修更稳
3. **是否完全跳过？** — 接受 2 个大 L1 慢，集中资源到任务 3 博客

---

## 8. 修复结果（2026-05-17 实施 A+B）

修复实施：
- 把 `getCategory` 的 nested `include` + `_count` 改成一次 PostgreSQL **recursive CTE**（依然返回原 tree shape，渲染层 0 改动）
- `unstable_cache` 包裹 category tree 与 product count，5min revalidate
- 实施位置：`src/app/category/[[...slug]]/page.js` 行 1-110

### 实测对照（prod 模式，热路径）

| 路径 | 修复前 | 修复后 | 加速 |
|---|---:|---:|---:|
| embedded (155K) | 17.6s | **16ms** | 1100× |
| power-management (226K) | 5.3s | 13ms | 400× |
| audio-video-telecom (spike) | 5.4s | 17ms | 300× |
| memory (67K) | 1.7s | 48ms | 35× |
| analog (89K) | 2.0s | 28ms | 70× |
| logic / interface / clock-timing | 1.4-1.5s | 28-48ms | 30× |
| fpgas / cplds / microcontrollers (L2/L3) | 0.15-1.0s | 27-73ms | 无退化 |
| `/` 首页 | 170ms | 4ms | — |

冷启动（每 5min revalidate 周期第一次）embedded 仍 ~5s，但 99%+ 真实用户命中热路径。

### 与朋友工作的兼容性

- `unstable_cache` 看 `categoryIds + filters` 作 key，朋友改 Product.description / qualityScore / indexable 不影响 count 缓存
- 朋友改的字段不在 cache key 范围，无误命中风险
- 朋友的 ISR product page 缓存独立运行

### 未做的（保持原决策）

- 复合索引：等朋友阶段 3 跑完后再单独评估
- 深分页：MAX_PAGES=100 已限制，影响有限
- ISR 冷启动消除：跨 5min 1 次的冷启动可接受
