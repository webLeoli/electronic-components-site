# Blog content plan — the engineering axis

Written 2026-08-11. Companion to `blog-content-plan.md`, which covers the first
eighty articles and remains the authority on the sourcing clusters.

## Why a second axis

All eighty existing articles answer a **procurement** question: where do I find
this obsolete part, what has to match, is this distributor trustworthy. That
corpus is complete and internally consistent.

This axis answers a **design** question, for the engineer who chooses the part
before a buyer ever sees it.

**The trap to avoid, stated first.** A generic "FPGA timing closure tutorial"
competes with AMD's own UG906 and ten thousand blogs, offers no information gain,
and pulls design-intent traffic that does not convert for a sourcing business.
That is the same mistake in a new costume as the Passives batch
(`blog-content-plan.md`, "Do not write: Passives").

**The wedge that is both deeply technical and unavailable to anyone else:
design-for-availability.** Deep engineering content in which measured lifecycle
data is a first-class design input. Silicon vendors cannot write it — they want
the reader on their newest device. Independent blogs cannot write it — they have
no catalogue to measure. We have 719,342 measured part numbers.

Three findings from the measurement pass on 2026-08-11 show the shape:

- **An Artix-7 design from 2013 is still buildable, and its boot flash is not.**
  `XC7A` is 6% inactive across 240 part numbers; the `N25Q` serial flash that the
  reference designs paired with it is **93% inactive**, and `M25P` is 98%. The
  cheapest device on the board is what kills the BOM.
- **Availability tracks market position, not silicon age.** Arria V (`5AG`, 2011,
  high-end) is **56% inactive**; Cyclone V (`5CE`/`5CG`, same year, mid-range) is
  **0%**. High-end FPGAs die with their process node because their customers move
  on; mid-range parts live in industrial designs that keep re-ordering.
- **The vendor you can still buy DDR3 from is not the one you designed with.**
  Micron `MT41J` is 95% inactive and `MT41K` 61%, while ISSI `IS43` is 30%. The
  second source outlived the first source.

Each article must therefore carry a path into the catalogue (`relatedProducts`,
`/category/*` links, an RFQ route). Design-intent traffic converts only if the
article ends somewhere a part can be quoted.

## The four genres

They are **formats, not categories**. `restructure-blog-categories.mjs` explains
why format-based categories were abandoned in 2026-08: the related-posts block
selects by `categoryId`, so a "Technical Guides" category would sit an FPGA
article next to a power-supply one and reinforce nothing. Every article below is
filed by *subject*.

| Genre | What makes it different | Depth standard |
| --- | --- | --- |
| **Deep technical** (技术深度) | Protocol- and register-level mechanism. The reader could implement from it | 3,500-4,500 words, worked arithmetic, register/bit tables |
| **Engineer guide** (工程师指南) | A procedure with decision points and numbers to check against | 3,000-4,000 words, checklists with pass/fail criteria |
| **Evaluation** (方案评测) | Head-to-head with an explicit, weighted scoring model, availability as a scored criterion | 3,000-4,000 words, scoring table plus the arithmetic behind it |
| **Industry data** (行业资讯) | First-party measurement, dated, repeatable. Never a rewrite of someone else's press release | 2,500-3,500 words, method and limitations section required |

All seven rules of the depth standard in `blog-content-plan.md` still apply
(bolded definition sentence, key takeaways, direct answer under every H2, data
tables, worked arithmetic, 6-8 FAQ entries, 12+ headings). They are what makes
`extractFaqEntries` emit FAQPage, so they are not stylistic.

**On industry news specifically: never invent an event.** Anything presented as
news must be either first-party measurement from our own catalogue (dated and
reproducible via `scripts/measure-catalogue.mjs`) or an externally sourced fact
with the source named. A fabricated EOL notice is a liability, not content.

## New categories, added 2026-08-11

Additive only — no existing category was renamed and no existing URL changed.
Added to the `ADDITIONS` list in `scripts/restructure-blog-categories.mjs` rather
than created by hand, so a re-run of that script cannot drop them (the lesson
from `setup-categories.mjs` silently reverting a rename).

| Slug | Name | New URL |
| --- | --- | --- |
| `fpga-design` | FPGA Design & Integration | `/blog?category=fpga-design` |
| `hardware-design` | Hardware Design & Integration | `/blog?category=hardware-design` |
| `industry-data` | Industry Data & Obsolescence Watch | `/blog?category=industry-data` |

## Measurement tool

`scripts/measure-catalogue.mjs` — added with this batch. Modes: `categories`,
`vendors`, `packages`, `cat <slug>`, `prefix <p…>`, `prefixes <file.json>`,
`find <substr>`.

**Two measurement traps this batch hit, both now documented:**

1. **`find` is a substring match.** `find M25P` returns `IBM25PPC750CXEJR7012T`;
   `find XCF` returns `CY25100SXCF`. Use `prefix` for family census, and check the
   sampled part numbers by eye. The one genuine false positive left inside a
   prefix census is `XCF5206ECFT40` (a ColdFire MPU inside the `XCF` Platform
   Flash prefix) — 18 real Platform Flash part numbers, not 19.
2. **A prefix can span two families.** `LCMXO2` matches both MachXO2
   (`LCMXO2-1200ZE…`) and first-generation MachXO (`LCMXO2280C…`). Measured
   together they read 18% inactive, which is true of nothing. Split properly:

   | Family | Anchored pattern | Parts | Inactive |
   | --- | --- | ---: | ---: |
   | MachXO2 | `LCMXO2-` | 493 | **8%** |
   | MachXO (1st gen) | `LCMXO256/640/1200/2280` | 386 | **53%** |
   | MachXO3 | `LCMXO3L`/`LCMXO3D` | 285 | 5% |

   This is the same class of artefact as the Programmable Timers 3% rate. Always
   check whether a prefix is one family before quoting its rate.

## First-party data measured 2026-08-11

The evidence base for this batch. Re-measure before reusing — status changes.

### FPGA and CPLD families, by ordering-code count

| Family | Prefix | Parts | Inactive | Reading |
| --- | --- | ---: | ---: | --- |
| Kintex/Virtex UltraScale | `XCKU`/`XCVU` | 492 | **0%** | current |
| ECP5 | `LFE5U`/`LFE5UM` | 236 | **0%** | current |
| Cyclone V E / GX | `5CE`/`5CG` | 296 | **0%** | mid-range, healthy |
| Zynq UltraScale+ | `XCZU` | 521 | 1% | current |
| Spartan-7 | `XC7S` | 127 | 1% | current |
| Cyclone IV / III | `EP4C`/`EP3C` | 688 | 1% | long-lived mid-range |
| MAX 10 | `10M…` | 194 | 3-20% | varies by density |
| MachXO3 | `LCMXO3L/D` | 285 | 5% | current |
| Artix-7 / Kintex-7 / Virtex-7 | `XC7A`/`XC7K`/`XC7V` | 533 | 6% | healthy |
| Zynq-7000 | `XC7Z` | 127 | 8% | healthy |
| SmartFusion2 / IGLOO2 | `M2S`/`M2GL` | 1,307 | 8% | healthy |
| MachXO2 | `LCMXO2-` | 493 | 8% | healthy |
| Spartan-6 | `XC6S` | 398 | 16% | mid-life |
| Virtex-5 | `XC5V` | 333 | 17% | — |
| ProASIC3 | `A3P` | 771 | 30% | — |
| IGLOO nano | `AGLN` | 120 | 42% | — |
| MachXO 1st gen | `LCMXO2280` etc. | 386 | 53% | **replace** |
| **Arria V** | `5AG` | 607 | **56%** | **high-end, 2011** |
| LatticeXP2 | `LFXP2` | 190 | 60% | replace |
| Stratix I / II | `EP1S`/`EP2S` | 488 | 77-84% | gone |
| MAX 7000 | `EPM7` | 656 | 85% | gone |
| Spartan (classic) | `XCS` | 106 | **99%** | gone |
| Virtex-II / Pro | `XC2V` | 400 | **100%** | gone |
| Cyclone I | `EP1C` | 116 | **100%** | gone |

Category level: `fpgas` 24,901 parts at 46% inactive, `cplds` 4,639 at **66%** —
the CPLD is the most obsolete programmable-logic form factor on the site.

### Configuration memory — the finding that drives article 83

| Family | Prefix | Parts | Inactive | Last-time buy |
| --- | --- | ---: | ---: | ---: |
| ISSI serial NOR | `IS25LP` | 183 | **7%** | — |
| Micron (current) | `MT25Q` | 200 | 24% | 0 |
| Cypress/Infineon | `S25FL` | 1,167 | 37% | **21** |
| Microchip/SST | `SST25` | 204 | 36% | 4 |
| **Winbond** | `W25Q` | 1,224 | **54%** | **204** |
| Xilinx Platform Flash | `XCF` | 18 | 61% | 2 |
| Atmel DataFlash | `AT45DB` | 298 | 73% | — |
| Altera EPCQ | `EPCQ` | 11 | 82% | — |
| **Micron (legacy)** | `N25Q` | 293 | **93%** | — |
| **ST/Micron** | `M25P` | 222 | **98%** | — |
| **Altera EPCS** | `EPCS` | 8 | **100%** | — |

Against `XC7A` at 6%. **The FPGA outlives its boot device by a wide margin, and
both Altera dedicated configuration families are effectively finished.**

Platform Flash is also a clean worked example of aftermarket lineage: every
Xilinx-branded `XCF08PVOG48C`/`XCF16PVOG48C` is obsolete, while the
Rochester-branded `XCF08PVO48C` and `XCF16PVO48C` are active with stock.

### DRAM — the evidence for article 84

| Family | Prefix | Parts | Inactive | Note |
| --- | --- | ---: | ---: | --- |
| ISSI DDR3/DDR2/LPDDR | `IS43` | 1,052 | **30%** | the survivor |
| Micron DDR3L 1.35 V | `MT41K` | 278 | 61% | — |
| ISSI legacy | `IS42` | 1,030 | 62% | — |
| Micron LPDDR3/4 | `MT53` | 1,258 | 52% | 19 in last-time buy |
| Micron DDR2 | `MT47H` | 311 | 88% | — |
| Micron SDR | `MT48LC` | 462 | 91% | — |
| **Micron DDR3 1.5 V** | `MT41J` | 95 | **95%** | designed-in everywhere |
| Micron DDR | `MT46V` | 407 | 95% | — |

### The last-time-buy window — the evidence for article 86

5,178 part numbers, **5,177 of them with stock recorded**, 40,928,194 units.

| Manufacturer | LTB part numbers | Share |
| --- | ---: | ---: |
| Renesas | 1,460 | 28% |
| ROHM | 727 | 14% |
| Intersil (Renesas-owned) | 401 | 8% |
| Torex | 318 | 6% |
| onsemi | 270 | 5% |
| Winbond | 251 | 5% |

**The two concentrations mean opposite things, and that is the article's angle.**
ROHM's 727 are 725 `ML610Q` and `ML620Q` parts — one LAPIS MCU line being
retired, which affects few BOMs deeply. Renesas' 1,861 (including Intersil) span
MCUs (`R7F701`, `R5F521`, `R5F511`, `R5F523`, `R5F212`), clock generation
(`8T49N2`), IDT SRAM (`71V424`, `71V124`), IDT logic (`74FCT1`) and Intersil
analogue (`ISL327x`, `ISL284x`) — portfolio-wide pruning, which touches almost
every BOM shallowly. Winbond's 251 are `W25Q16/32/64/80/128` — serial NOR flash,
which is the boot-flash story again.

Also notable: **Torex, measured at only 8% inactive overall in the
`ic-obsolescence-data-study`, has 318 part numbers in last-time buy** (270 of them
`XC6224` LDOs) — the healthiest vendor in the catalogue is now pruning.

By category: `microcontrollers` 1,178, `sram` 384, `clock-generators-plls` 366,
`linear-regulators-ldo` 357, `flash-memory` 330. By *rate*, `ac-dc-converters`
leads at 2.8%.

## Batch A — written 2026-08-11

| # | Title | Slug | Genre | Category |
| --- | --- | --- | --- | --- |
| 83 | Your FPGA Will Outlive Its Boot Flash | `fpga-boot-flash-design-longevity` | Deep technical | FPGA Design & Integration |
| 84 | Designing a DDR3 Interface You Can Still Populate | `ddr3-interface-design-longevity` | Engineer guide | Hardware Design & Integration |
| 85 | FPGA Family Selection for a 15-Year Product Life | `fpga-family-selection-long-life` | Evaluation | FPGA Design & Integration |
| 86 | Obsolescence Watch, August 2026 | `obsolescence-watch-2026-08` | Industry data | Industry Data & Obsolescence Watch |

Article 86 is deliberately **not** a duplicate of `ic-obsolescence-data-study`
(draft 82). That one is the static catalogue-wide census; this one is the
recurring, dated report on the 5,178-part subset where a buyer can still act,
because a last-time-buy window closes and an obsolete part is already gone.

## Batch B — planned, in priority order

Ranked by (uniqueness of the first-party angle) × (size of the affected
inventory). Measure before writing each one — the rule has now saved two batches.

| # | Working title | Genre | Category | The first-party angle |
| --- | --- | --- | --- | --- |
| 87 | Choosing a Serial NOR Flash You Can Second-Source | Engineer guide | Hardware Design | SFDP as the portability contract; `W25Q` 204 LTB vs `IS25LP` 7% |
| 88 | CPLD Replacement Paths When the CPLD Category Is 66% Gone | Engineer guide | FPGA Design | `cplds` 4,639 at 66%; `EPM7` 85%; small-FPGA and logic-gate migration targets |
| 89 | SRAM vs FRAM vs MRAM vs EEPROM for Non-Volatile Logging | Evaluation | Memory Sourcing | `sram` 54% and 384 LTB vs `fram-mram` 14%; endurance arithmetic |
| 90 | Power Sequencing an FPGA Board With Parts That Stay Available | Engineer guide | Hardware Design | `supervisors-reset` 45,819 parts at 32%; sequencer vs discrete-supervisor trade |
| 91 | Reading a Crystal Oscillator Datasheet: Load Capacitance, Drive Level, Negative Resistance | Deep technical | Hardware Design | The design-error class behind most "the board does not boot" returns |
| 92 | Toolchain Archival: Keeping a Build Reproducible for Fifteen Years | Engineer guide | FPGA Design | ISE/Quartus version cliffs; the DSP finding that the toolchain expires first |
| 93 | SPI vs QSPI vs BPI vs JTAG Configuration: An Evaluation | Evaluation | FPGA Design | Config-time arithmetic against device availability per scheme |
| 94 | Level Translation Between 5 V Legacy and 1.8 V Logic | Deep technical | Hardware Design | `translators-level-shifters` 2,476 at 43%; 5 V-tolerance loss as a migration blocker |
| 95 | Obsolescence Watch, September 2026 | Industry data | Industry Data | The recurring report; track what moved out of the LTB window |
| 96 | Thermal Design for BGA FPGAs in Sealed Enclosures | Engineer guide | Hardware Design | Package census: BGA 42% vs QFN/DFN 23% |

## Publishing

Unchanged from `blog-content-plan.md`, and it is still the bottleneck: **59 of
the first 80 articles are finished and held as drafts only because they have no
cover image.** These four join that queue. `scripts/publish-next-blog.mjs`
releases one draft per interval via the `fpgacenter-blog-publisher` timer.

Run `node scripts/verify-blog-content.mjs <slug>` before publishing anything.
