# 任务 3：5 篇支柱博客大纲

> 5 篇选题：1, 2, 3, 5, 8（已跳过 FPGA cross-reference 因技术风险高）
> 作者署名：FPGACenter Sourcing Team
> 目标：每篇 1500-2500 词，含 H2/H3 结构、内部链接、CTA、SEO 元数据

## 大纲标记约定

- 🤖 **AI 可独立完成**（公开知识、技术整理、行业标准）
- 👤 **必须你补**（业务案例、内部数据、客户故事、专家观点）
- 🔗 **内部链接 hook**（应链接到产品页 / 分类页 / 制造商页 / 其它博客）

每篇先给完整大纲与 SEO 元数据，等你审阅后我再写正文。

---

# 博客 #1：EOL vs NRND vs Obsolete — Understanding the IC Lifecycle

## SEO 元数据

- **slug**: `eol-nrnd-obsolete-ic-lifecycle-explained`
- **seoTitle**: `EOL vs NRND vs Obsolete: IC Lifecycle Status Explained` (54c)
- **seoDesc**: `Understand the difference between EOL, NRND, last-time-buy, and obsolete status in IC procurement. Decision framework + supplier red flags.` (143c)
- **seoKeywords**: `EOL NRND obsolete difference, IC lifecycle status, last-time-buy, end of life IC`
- **tags**: `EOL, NRND, obsolete, IC lifecycle, procurement, supply chain`
- **readingTime**: 8 分钟
- **目标搜索意图**: 教育/采购（"EOL vs NRND difference" 月搜索量估计 200-500）
- **难度等级**: 低（公开知识，难度低）

## H1
**EOL vs NRND vs Obsolete: A Procurement Guide to IC Lifecycle Status**

## H2 大纲

1. **Why IC lifecycle terminology matters (TL;DR)** 🤖
   - 3 段引子：解释为什么这套术语对采购/工程重要
   - 给出真实场景：BOM 里某个 part 标 NRND，团队该怎么反应？
   - 关键统计：典型 IC 生命周期 5-15 年（公开行业数据）

2. **The 5 lifecycle statuses explained** 🤖
   - 子目录：
     - **Active / In Production** — 标准状态，正常采购
     - **NRND (Not Recommended for New Designs)** — 来源：JEDEC JESD48
     - **Last-Time-Buy (LTB)** — 通常给 6-12 个月窗口
     - **End-of-Life (EOL)** — 已停产但 distributor 还有库存
     - **Obsolete** — 完全断货，需要 broker / NOS / aftermarket
   - 每个 status 给：定义、典型时间窗口、来自 manufacturer 的信号、采购建议
   - 表格对照（4 列：Status / Signal / Window / Action）

3. **How manufacturers signal these statuses** 🤖
   - PCN (Product Change Notice) — IPC-1601 标准
   - LCM / lifecycle bulletins — Microchip / TI / NXP 的官方页面引用
   - Distributor flags（Mouser/Digi-Key 在产品页的标识）
   - 反例：有些 manufacturer 跳过 NRND 直接 EOL

4. **The decision tree: what to do when you see each status** 🤖
   - 如果是 NRND → 评估替代或 last-time-buy
   - 如果是 LTB → 计算 lifetime supply（参考博客 #3 LTB 策略）🔗
   - 如果是 EOL → 找 authorized distributors first, then brokers
   - 如果是 Obsolete → 三条路：redesign / aftermarket sourcing / specialty distributor like FPGACenter 🔗

5. **Common pitfalls** (👤 业务案例)
   - 误判 NRND 为 obsolete → 浪费 redesign 预算
   - 错过 LTB 窗口 → 后续付 5-10× 溢价 ← **你的真实案例可填这里**
   - 信任假冒"new old stock" → 假冒 IC 风险（引博客 #2 IDEA-1010）🔗

6. **How FPGACenter handles obsolete sourcing** 🤖 + 👤
   - 我们的 4 步流程（你可以告诉我具体流程）
   - IDEA-1010 inspection 流程
   - traceability documentation

7. **FAQ** 🤖
   - Q: How long do most ICs stay in production?
   - Q: Is buying obsolete ICs always risky?
   - Q: Can I get authentic parts after EOL?
   - Q: What's the difference between EOL and obsolete?

## 内部链接

- 🔗 博客 #3 LTB 策略
- 🔗 博客 #2 IDEA-1010
- 🔗 `/category/cplds` (CPLDs 是 EOL/obsolete 高发分类)
- 🔗 `/rfq` CTA

## 需要你提供（最少版本）

- 1 个 NRND→错过 LTB 的客户案例（可匿名化）
- FPGACenter 的 obsolete sourcing 流程（4-5 步即可）

---

# 博客 #2：What is IDEA-STD-1010 and Why It Matters for Obsolete IC Procurement

## SEO 元数据

- **slug**: `idea-std-1010-counterfeit-detection-guide`
- **seoTitle**: `IDEA-STD-1010: The Counterfeit IC Inspection Standard Explained` (61c, 可能要缩)
- **seoDesc**: `IDEA-STD-1010-B is the industry inspection standard for counterfeit IC detection. Learn what it covers, who needs it, and how to verify suppliers comply.` (155c)
- **seoKeywords**: `IDEA-STD-1010, IDEA-1010, counterfeit IC detection, counterfeit component inspection`
- **tags**: `IDEA-1010, counterfeit detection, quality, compliance, supply chain`
- **readingTime**: 10 分钟
- **目标搜索意图**: 合规/质量（采购经理 + 质量工程师）
- **难度等级**: 中（标准公开但解释要准确）

## H1
**IDEA-STD-1010: The Industry Standard for Counterfeit IC Inspection**

## H2 大纲

1. **Why counterfeit ICs are a $billion+ problem** 🤖
   - 引数据：SIA / ERAI 公开年度报告数字
   - 引一两个公开案例（如 2010s 早期被披露的军工供应链 case）
   - 风险：电路板损坏、安全失效、品牌信誉

2. **What is IDEA and what is IDEA-STD-1010-B?** 🤖
   - IDEA = Independent Distributors of Electronics Association
   - 1010 = 视觉与电气检测协议
   - 最新版本 1010-B (2017)，含 100+ 检测项
   - 与 AS6081, AS6171 关系（IDEA 是基础协议，AS6081 偏向 ANSI/AS 标准）

3. **The 8 inspection categories under IDEA-1010** 🤖
   - External Visual Inspection
   - Marking Permanency Test
   - Material/Surface Analysis (XRF)
   - Hermeticity Test
   - Decapsulation / Die Inspection
   - Electrical Test
   - Tape & Reel / Packaging Verification
   - Documentation Review (CoC, traceability)
   - 每项展开 100-150 字 + 给 typical equipment

4. **Who needs IDEA-1010 compliance** 🤖
   - Aerospace / defense (mandatory via DFARS)
   - Medical (FDA implications)
   - Automotive (IATF 16949 alignment)
   - Industrial control / safety systems
   - 反面：consumer electronics 通常不需要这种深度

5. **What a compliant inspection looks like in practice** (👤 业务案例)
   - 步骤式说明（FPGACenter 自己的实施）
   - 引用具体设备（你们用什么 XRF / 显微镜？）← **需要你提供**
   - Sample inspection report 截图（如可以匿名公开）← **你提供**
   - Common red flags caught

6. **How to verify your supplier actually complies** 🤖
   - Audit checklist (5-7 项)
   - Ask for: certification copy, sample report, equipment list, technician training records
   - 注意 self-claimed vs ERAI-listed vs ISO 17025 lab-tested 的区别

7. **What IDEA-1010 does NOT cover** 🤖
   - 不是设计验证（function/parametric beyond datasheet)
   - 不是 reliability testing (那是 JESD22)
   - 不是 RoHS / REACH 合规
   - 解释 IDEA-1010 + 其他标准如何互补

8. **FAQ** 🤖
   - Q: Is IDEA-1010 the same as AS6081?
   - Q: How much does inspection add to part cost?
   - Q: Can I trust "IDEA-1010 inspected" claims?
   - Q: What if my distributor doesn't have IDEA-1010?

## 内部链接

- 🔗 博客 #1 EOL/obsolete
- 🔗 博客 #7 counterfeit IC supply chain（如未来扩展）
- 🔗 `/quality` 页（FPGACenter 质量页面）
- 🔗 `/about` 页（公司资质）

## 需要你提供

- FPGACenter 的实际 IDEA-1010 流程描述
- 用的检测设备（不必精确品牌，类型即可）
- 1 个真实的 inspection report 摘要（匿名）
- 可以的话：负责质量的工程师名字/title（强 EEAT 信号）

---

# 博客 #3：How to Source Obsolete Electronic Components — A Procurement Guide

## SEO 元数据

- **slug**: `how-to-source-obsolete-electronic-components`
- **seoTitle**: `How to Source Obsolete Electronic Components: A Buyer's Guide` (60c)
- **seoDesc**: `Five proven paths to sourcing obsolete ICs: authorized distributors, brokers, NOS, aftermarket, redesign. Decision framework + cost comparison.` (149c)
- **seoKeywords**: `obsolete electronic component sourcing, obsolete IC sourcing, hard-to-find component sourcing`
- **tags**: `obsolete sourcing, procurement, supply chain, EOL, NOS`
- **readingTime**: 12 分钟
- **目标搜索意图**: 高商业意图（采购总监 / 工程经理）
- **难度等级**: 中

## H1
**How to Source Obsolete Electronic Components: 5 Proven Paths**

## H2 大纲

1. **The cost of obsolescence in modern BOMs** 🤖
   - 数据：典型工业 BOM 5-10 年内 8-15% 部件会进入 EOL/obsolete
   - 真实成本：redesign vs sourcing premium vs project delay
   - "Just buy more" 的认知陷阱

2. **The 5 sourcing paths (with cost/risk tradeoffs)** 🤖

   表格：

   | Path | Lead Time | Cost vs Original | Risk | Best For |
   |---|---|---|---|---|
   | Authorized distributor stock | 1-7 days | 1.0× | 极低 | Recently EOL'd parts |
   | Manufacturer last-time-buy | 0-30 days | 1.0-1.2× | 低 | Pre-announced EOL |
   | Specialty distributor (NOS) | 1-4 weeks | 1.5-5× | 中 (需 IDEA-1010) | Discontinued > 2 years |
   | Aftermarket / authorized 2nd source | 4-12 weeks | 2-5× | 中 | Mil/aerospace parts |
   | Redesign / replacement | 3-12 months | varies | 项目风险 | 数量大 / 长期 |

3. **Path 1: Authorized distributors first** 🤖
   - Why this should be your first stop
   - Mouser / Digi-Key 的 inventory 实际持续多久
   - Hidden gem: manufacturer 自己的 distribution 通常保留 last-time-buy 窗口
   - Pitfall: 不要等到 0 库存才动手

4. **Path 2: Catching the last-time-buy window** 🤖
   - PCN 监控
   - 工具：Z2Data, IHS Markit, SiliconExpert
   - 关键问题：how much to stockpile? → 链接博客 #4 (LTB strategy) 🔗

5. **Path 3: Specialty distributors and NOS** 🤖 + 👤
   - 什么是 New Old Stock (NOS)
   - 如何评估 specialty distributor 的可信度（IDEA-1010 / ERAI listing / ISO 9001）
   - FPGACenter 的 NOS 库存战略 ← **你描述**
   - 案例：某个 Spartan-II FPGA 已停产 15+ 年但 NOS 仍可得 🔗

6. **Path 4: Aftermarket / authorized 2nd source** 🤖
   - Rochester Electronics 这类官方授权后市场厂的角色
   - 真正的 "wafer banked" vs 简单 die salvage 区别
   - 适用场景：military / aerospace 部件

7. **Path 5: Redesign (last resort)** 🤖
   - When it's cheaper than sourcing
   - 计算公式：sourcing premium × remaining BOM lifetime > redesign cost
   - 工具：Cross-reference tools, drop-in replacement databases

8. **Building a sourcing playbook for your team** 🤖
   - 4-step process: identify → search → verify → document
   - Vendor onboarding checklist
   - 何时引入 specialty distributor

9. **Case study: FPGACenter's typical obsolete sourcing flow** 👤 (必须你提供)
   - 1-2 个真实案例（脱敏）
   - 时间线、成本、最终交付

10. **FAQ** 🤖

## 内部链接

- 🔗 博客 #1 EOL/NRND/obsolete 定义
- 🔗 博客 #2 IDEA-1010
- 🔗 博客 #4 LTB 策略
- 🔗 `/manufacturer/altera`（典型 obsolete-heavy 品牌）
- 🔗 `/manufacturer/xilinx`
- 🔗 `/rfq` CTA

## 需要你提供

- 至少 1 个真实 sourcing case study
- FPGACenter 的 sourcing 流程（4 步即可，可与博客 #1 共享）

---

# 博客 #5：BOM Scrubbing — Identifying Lifecycle Risks Before They Hit Production

## SEO 元数据

- **slug**: `bom-scrubbing-lifecycle-risk-analysis`
- **seoTitle**: `BOM Scrubbing: How to Find Lifecycle Risks in Your BOM` (54c)
- **seoDesc**: `BOM scrubbing identifies EOL, NRND, and single-source parts before production. Step-by-step process + free checklist + tool comparison.` (140c)
- **seoKeywords**: `BOM scrubbing, BOM lifecycle analysis, BOM risk analysis, lifecycle status check`
- **tags**: `BOM, scrubbing, procurement, supply chain risk, EOL`
- **readingTime**: 10 分钟
- **目标搜索意图**: 工程+采购（NPI / sustaining engineer）
- **难度等级**: 中

## H1
**BOM Scrubbing: Catching Lifecycle Risks Before They Become Production Crises**

## H2 大纲

1. **What is BOM scrubbing and why every team should do it annually** 🤖
   - 定义：systematic lifecycle status review of every part in a BOM
   - 区分：one-off audit vs continuous monitoring
   - Cost of skipping: 真实数字（一个停产部件触发的成本）

2. **The 6 risk dimensions to check** 🤖
   - Lifecycle status (Active / NRND / LTB / EOL / Obsolete)
   - Source diversity (single vs multi-source)
   - Manufacturer health (financial signals, M&A risk → e.g. AMD/Xilinx, Renesas/IDT)
   - Geographic risk (fab location, geopolitical)
   - Spec change risk (PCN history)
   - Inventory depth (distributor stock vs demand rate)

3. **Step-by-step BOM scrubbing process** 🤖
   - Step 1: Normalize part numbers (MPN cleaning)
   - Step 2: Pull lifecycle data (manufacturer pages, SiliconExpert, Z2Data)
   - Step 3: Cross-check distributor stock
   - Step 4: Flag risks by severity
   - Step 5: Build mitigation plan per risk-flagged part
   - Step 6: Set up monitoring for ongoing changes

4. **Tools comparison** 🤖
   - Free: manufacturer websites + Octopart + manual
   - Mid-tier: Z2Data, SiliconExpert
   - Enterprise: IHS Markit, Eaton's TraceParts
   - 表格对比

5. **Common findings in real BOMs (and what to do)** (👤 业务案例)
   - 5-7 个典型 finding 类型（你的客户 BOM 里常见的问题）
   - 每个给：发现频率、风险等级、典型 mitigation
   - **需要你提供一些真实"BOM scrubbing 发现的惊喜"案例**

6. **Free BOM scrubbing checklist (downloadable / inline)** 🤖
   - 16-20 项 checklist，每项明确判断标准
   - 例：
     - [ ] Every part has at least 2 verified sources?
     - [ ] Any part NRND or beyond?
     - [ ] Any manufacturer recently acquired?
     - [ ] Distributor stock < 1 year of usage rate?

7. **How to build a "BOM health" dashboard** 🤖
   - 简单 KPI：% parts EOL, single-source count, mfr-concentration risk
   - 哪些指标值得 quarterly review

8. **When to call in specialty help** 🤖 + 👤
   - 红线信号：当 BOM 上有 >10% obsolete parts 时
   - FPGACenter 的 BOM analysis service ← **你确认有这服务吗？**

9. **FAQ** 🤖

## 内部链接

- 🔗 博客 #1 EOL/NRND
- 🔗 博客 #3 Sourcing paths
- 🔗 `/bom` 页（FPGACenter BOM 工具）

## 需要你提供

- 3-5 个真实 BOM scrubbing 发现案例（脱敏）
- FPGACenter 是否有正式 BOM analysis 服务？

---

# 博客 #8：FPGA Obsolescence — Planning for the End-of-Life of Classic Families

## SEO 元数据

- **slug**: `fpga-obsolescence-spartan-cyclone-end-of-life`
- **seoTitle**: `FPGA Obsolescence: Planning for Spartan & Cyclone EOL` (52c)
- **seoDesc**: `Classic FPGA families like Spartan-3 and Cyclone IV are entering end-of-life. Sourcing strategies, migration paths, and risk mitigation for legacy designs.` (159c)
- **seoKeywords**: `FPGA obsolescence, Spartan EOL, Cyclone EOL, legacy FPGA sourcing, FPGA end of life`
- **tags**: `FPGA, Xilinx, Altera, Spartan, Cyclone, EOL, obsolescence, legacy design`
- **readingTime**: 10 分钟
- **目标搜索意图**: 工程+采购（embedded engineer / sustaining）
- **难度等级**: 中

## H1
**FPGA Obsolescence: When Classic Spartan and Cyclone Families Go EOL**

## H2 大纲

1. **The FPGA obsolescence wave: what's happening now** 🤖
   - 客观事实：AMD 收购 Xilinx (2022) + Intel 收购 Altera (2015→spin-out 2024)
   - 影响：family lifecycle strategy 重置
   - 典型 EOL'd / NRND families（基于公开信息）：
     - Xilinx Spartan-3 (公开 EOL)
     - Xilinx Virtex-II (obsolete since ~2010s)
     - Altera Cyclone II (EOL)
     - 标注**这些信息要严格核对官方页面**，避免技术错误

2. **What "FPGA obsolescence" actually means** 🤖
   - 不只是 wafer 停产 — 还包括：
     - Configuration tools (ISE, Quartus 旧版本) 不再更新
     - Programming hardware 兼容性
     - Documentation 归档
   - 三层 EOL：silicon / tools / documentation

3. **Sourcing strategies for classic FPGAs** 🤖
   - Path A: Specialty distributors with NOS (FPGACenter 等) 🔗
   - Path B: Authorized aftermarket (Rochester for some Altera/Xilinx parts)
   - Path C: Tool emulation (有些情况能用新工具编程旧 silicon)
   - Path D: Counterfeit avoidance（这些是 high-risk targets for counterfeiting）

4. **Migration paths when sourcing isn't viable** 🤖
   - In-family upgrade (Spartan-3 → Spartan-6 → Spartan-7)
   - Cross-vendor migration (Xilinx → Lattice equivalent, Altera → Microchip)
   - 警告：这些不是 drop-in replacement，需要 RTL 重新综合

5. **Programming and configuration challenges** 🤖
   - 旧 FPGA 需要老版本工具链：ISE 14.7 是 Spartan-3 最后支持版本
   - 编程器兼容性：JTAG cable 在新 Windows 上的 driver 问题
   - Bitstream 备份：long-term archival

6. **Real-world case: sustaining a Spartan-3-based design** (👤 业务案例)
   - 你或你客户的真实案例
   - 时间线、决策、成本
   - **如果没有真实案例，用公开行业案例（如某些工业设备 OEM 公开的 sustaining 故事）**

7. **What FPGACenter stocks for legacy FPGA needs** 🤖 + 👤
   - 真实数据：从产品库取的 Spartan/Cyclone 部分库存数字
   - 链接到 FPGA 分类页 🔗
   - IDEA-1010 inspection 对旧 FPGA 尤其重要

8. **Best practices for FPGA-heavy designs** 🤖
   - 设计早期就考虑 lifecycle risk
   - Footprint compatibility 设计（pin-compatible families）
   - Lifetime buy 决策框架（链接博客 #3）🔗

9. **FAQ** 🤖
   - Q: Are Spartan-3 still being manufactured?
   - Q: Can I get IDEA-1010 inspected Cyclone IV?
   - Q: How do I program an obsolete FPGA without old tools?
   - Q: What's the typical lead time for Virtex-II?

## 内部链接

- 🔗 博客 #1 EOL/NRND
- 🔗 博客 #2 IDEA-1010
- 🔗 博客 #3 Sourcing paths
- 🔗 `/manufacturer/altera`
- 🔗 `/manufacturer/xilinx`
- 🔗 `/category/fpgas`
- 🔗 `/rfq`

## 需要你提供

- 1 个真实 legacy FPGA sustaining 案例（或可用公开 case study）
- FPGACenter 实际能 source 的最老 FPGA family（数据从产品表查也可以）

## 风险注意

- 这篇技术成分高，**所有具体型号 EOL 状态必须核对** 官方 PCN
- 不能臆测 family 之间的兼容关系

---

# 跨博客共享资源

## 通用 CTA 段落（每篇结尾用）

```
---
**Need help sourcing obsolete or hard-to-find components?**
FPGACenter specializes in [Obsolete IC | FPGA | …topic-specific…] sourcing, with
IDEA-1010 inspection, full traceability, and no minimum order quantity.
[Submit an RFQ →](/rfq) | [Browse our inventory →](/category)
```

## 作者署名（每篇底部）

```
**Author**: FPGACenter Sourcing Team
**Last reviewed**: 2026-05-17
**About the team**: Our sourcing engineers and quality team have over [N] years
combined experience in obsolete IC procurement, FPGA selection, and counterfeit
detection. Learn more on [our about page](/about).
```
👤 **需要你提供**：about 页面是否有团队照片？团队总经验年数？

## 发布节奏建议

- 1 篇/周，5 周内完成
- 顺序：#1 → #2 → #3 → #5 → #8
- 这样基础概念先于深度操作博客发布，内部链接更自然

---

# 我需要你回答的问题

1. **业务案例**：你能提供几个真实案例？还是用公开行业案例兜底？
2. **about 页面**：现在已有公司资料 + 团队照片吗？
3. **FPGACenter 实际服务**：有正式 "BOM analysis" 服务吗？还是 case-by-case?
4. **IDEA-1010 实施细节**：有具体设备 / 流程文档吗？
5. **发布节奏**：每周 1 篇，还是 5 篇一次性发完？

回答后我开始按 #1 → #2 → #3 → #5 → #8 顺序写正文。
