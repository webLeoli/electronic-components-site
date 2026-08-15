# Blog content plan — topic clusters

Written 2026-08-02. Supersedes the ad-hoc list in `phase4-task3-blog-outlines.md`
for anything not yet published.

## Status — 2026-08-04

**80 articles in the database: 21 published, 59 drafts awaiting cover images.
215,200 words across twelve clusters. Target reached. Every one carries FAQPage structured
data. No uncategorised posts, no broken internal links, every
`relatedProducts` part number verified to exist in the catalogue.**

**The 80-article target is met.** What remains is publishing (cover images) and
the structural items at the end of this document.

> **Update 2026-08-11 — a second axis was opened.** Every article covered by this
> document answers a *procurement* question. A separate plan,
> `docs/blog-technical-content-plan.md`, covers design-engineering articles for
> the engineer who chooses the part rather than the buyer who finds it, and adds
> three additive blog categories (`fpga-design`, `hardware-design`,
> `industry-data`). Four articles are written under it (84 posts in the database
> now, still 21 published). **This document remains the authority on the sourcing
> clusters and on everything in the structural list below.**

| Blog category | Total | Published | Draft |
| --- | ---: | ---: | ---: |
| Interface & Logic Sourcing | 16 | 0 | 16 |
| Analog & Power Sourcing | 12 | 6 | 6 |
| FPGA & CPLD Sourcing | 11 | 7 | 4 |
| Obsolescence & Lifecycle | 8 | 3 | 5 |
| Data Converters & Signal Chain | 7 | 0 | 7 |
| MCU Sourcing & Alternatives | 6 | 3 | 3 |
| Memory Sourcing | 6 | 0 | 6 |
| Quality & Compliance | 4 | 1 | 3 |
| Timing & Clock Distribution | 4 | 0 | 4 |
| Processors, DSP & SoC | 3 | 0 | 3 |
| Video, Display & Telecom | 2 | 0 | 2 |
| Passives & Discretes | 1 | 1 | 0 |

**The writing is no longer the bottleneck — cover images are.** 59 of 80
articles are finished, verified and cross-linked, and are held as drafts only
because they have no cover image.

**Verifier state at completion: 80 posts, 0 errors.** The 63 remaining warnings
are 58 "links to a still-unpublished sibling" (unavoidable while 59 posts are
drafts, and harmless now that the renderer unwraps those links) and 5 published
articles from the original nine that carry only 4-5 FAQ entries against the
6-8 target — `eol-nrnd-obsolete-ic-lifecycle-explained`,
`idea-std-1010-counterfeit-detection-guide`,
`how-to-source-obsolete-electronic-components`,
`bom-scrubbing-lifecycle-risk-analysis` and
`gd32-vs-stm32-gd32f103-motor-control-alternatives`. They still emit valid
FAQPage; topping them up means editing published bodies, which is the one edit
class where the on-disk draft may have diverged from the live content, so it was
left as a deliberate, recorded decision rather than done blind.

**Before publishing anything, run `node scripts/verify-blog-content.mjs`.** It
replays the page's heading conversion and runs the real `extractFaqEntries`, so
FAQPage output can be confirmed while a post is still a draft (the live route
404s on drafts, so this is the only way to check). It also catches dead internal
links and unresolvable `relatedProducts`.

---

## The original assessment (2026-08-02)

Nine posts existed. Seven were published.

| Post | Words | H2s | Cluster |
| --- | ---: | ---: | --- |
| how-to-source-obsolete-electronic-components | 2,068 | 10 | Obsolescence |
| fpga-obsolescence-spartan-cyclone-end-of-life | 2,196 | 9 | Obsolescence |
| eol-nrnd-obsolete-ic-lifecycle-explained | 2,093 | 7 | Obsolescence |
| bom-scrubbing-lifecycle-risk-analysis | 1,959 | 9 | Obsolescence |
| idea-std-1010-counterfeit-detection-guide | 1,799 | 8 | Obsolescence |
| understanding-mlcc-capacitors-guide (draft) | 1,848 | **0** | Passives |
| gd32-vs-stm32-gd32f103-motor-control-alternatives (draft) | 1,668 | 8 | MCU |
| how-to-choose-right-fpga | **618** | 5 | FPGA |
| stm32f103-vs-stm32f407-comparison | **481** | **0** | MCU |

Five substantial articles form one real cluster (obsolescence sourcing). Two
published posts are thin — 618 and 481 words, the latter with no subheadings at
all. Two finished drafts have never been published.

### What the catalogue says the clusters should be

Content coverage is inverted against inventory. Measured 2026-08-02:

| Segment | Parts in catalogue | Articles today |
| --- | ---: | ---: |
| Microcontrollers | 101,457 | 2 (one 481 words) |
| Linear regulators (LDO) | 67,881 | 0 |
| Supervisors & reset ICs | 45,819 | 0 |
| DC-DC switching regulators | 36,234 | 0 |
| Clock generators / PLLs | 32,305 | 0 |
| Op-amps & instrumentation | 28,323 | 0 |
| Programmable logic (FPGA/CPLD) | 84,209 | 2 |
| Obsolete-status parts | 242,575 | 5 |

Analog and power together are ~178,000 parts with zero editorial coverage.

### Hub pages a cluster can point at

These already exist and are in the sitemap, so spokes have somewhere to send
authority — no new URL patterns are needed to build the clusters:

- `/fpga-sourcing/{xilinx-spartan-6, xilinx-spartan-3, xilinx-virtex-legacy,
  xilinx-7-series, altera-cyclone, altera-max-cpld, lattice-machxo-ecp,
  microchip-actel-proasic}`
- `/robotics-sourcing/fpga-logic`
- `/category/{...}` — 141 categories
- `/manufacturer/{...}` — 383 manufacturers
- `/quality`, `/bom`, `/rfq`

## The four clusters

Each spoke links to: its pillar, two sibling spokes, and the matching hub page.
The site already renders a "related posts" block from `categoryId`, so every
post must carry one — five did not until 2026-08-02.

### Cluster 1 — Obsolescence & lifecycle sourcing (5/11 done)

Pillar: `how-to-source-obsolete-electronic-components` (promote to pillar; add a
section index linking every spoke).

| # | Working title | Slug | Hub link |
| --- | --- | --- | --- |
| ✅ | EOL vs NRND vs Obsolete | eol-nrnd-obsolete-ic-lifecycle-explained | /category |
| ✅ | IDEA-STD-1010 inspection | idea-std-1010-counterfeit-detection-guide | /quality |
| ✅ | BOM scrubbing | bom-scrubbing-lifecycle-risk-analysis | /bom |
| ✅ | FPGA obsolescence | fpga-obsolescence-spartan-cyclone-end-of-life | /fpga-sourcing |
| ✅ | Last-Time Buy: How Much to Order and How to Store It | last-time-buy-quantity-and-storage | 2,619 words, draft |
| ✅ | Reading a PCN or PDN | pcn-pdn-discontinuation-notice-guide | 2,694 words, draft |
| ✅ | Authorised Aftermarket vs Independent Distribution | authorized-aftermarket-vs-independent-distributor | 2,345 words, draft |
| ~~4~~ | ~~Long-term storage: J-STD-033~~ | folded into the last-time-buy article | — |
| ✅ | Writing a Counterfeit-Avoidance Procurement Policy | counterfeit-avoidance-procurement-policy | → **Quality & Compliance** |
| ✅ | Date Codes and Lot Traceability | date-code-lot-traceability-explained | → **Quality & Compliance** |
| ✅ | Redesign or Re-source? | redesign-vs-resource-obsolete-parts | 2,400 words, draft |

The first two were filed under Quality & Compliance rather than Obsolescence,
which was the thinnest category (1 article) against a site that leads on
IDEA-1010 inspection and traceability. They are anchored to the same standards
the [/quality](/quality) page cites — AS5553, AS6081, AS6496, AS6171 and
IDEA-STD-1010 — so the content and the page now agree.

Note for #3: Rochester Electronics is the single largest source in the
catalogue at 106,452 parts, which makes the authorized-aftermarket model a
first-party topic rather than a generic one.

### Cluster 2 — FPGA & CPLD sourcing (4/9 done)

The site's core specialty. Before this batch the eight `/fpga-sourcing/*` hub
pages received **no editorial links at all**; the pillar now links all eight.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | How to Choose the Right FPGA — rewritten from a 618-word stub | how-to-choose-right-fpga | 2,889 | **live** |
| ✅ | FPGA Obsolescence: Planning for End-of-Life | fpga-obsolescence-spartan-cyclone-end-of-life | 2,155 | **live** |
| ✅ | Sourcing Xilinx Spartan-6 in 2026 | sourcing-xilinx-spartan-6-guide | 2,040 | draft |
| ✅ | Sourcing Altera Cyclone I to IV | sourcing-altera-cyclone-legacy | 2,156 | draft |
| ✅ | Altera MAX CPLD Replacement Paths | altera-max-cpld-replacement-paths | 2,373 | draft |
| ✅ | Lattice MachXO and ECP Sourcing | lattice-machxo-ecp-sourcing | 2,136 | draft |
| ✅ | Actel ProASIC and IGLOO Sourcing | actel-proasic-sourcing-guide | 2,420 | draft |
| ✅ | Sourcing Xilinx Spartan-3 in 2026 | sourcing-xilinx-spartan-3-legacy | 2,300 | draft |
| ✅ | Legacy Virtex Sourcing: Virtex-II, 4 and 5 | xilinx-virtex-legacy-sourcing | 2,320 | draft |
| ✅ | Xilinx 7 Series and Zynq-7000 Sourcing | xilinx-7-series-zynq-sourcing | 2,450 | draft |
| 8 | BGA reballing: when it is acceptable and when it is not | bga-reballing-risk-guide | — | /quality |
| 9 | Pairing an FPGA with the right configuration flash | fpga-configuration-flash-pairing | — | /category |

**All eight `/fpga-sourcing/*` hubs now have a dedicated spoke plus the pillar
link — two editorial links each, up from zero before this work started.**
Ten articles, ~23,300 words.

Every spoke follows the same repeatable shape, which is why they go quickly:

1. Lifecycle position of each generation in the family (they differ)
2. Part-number decode, with an availability table **per field** — this is the
   part that makes an article useful to a buyer rather than a reader
3. The family's specific migration blocker (5 V tolerance for MAX 7000,
   instant-on for Lattice, programme approval for Actel)
4. Counterfeit exposure characteristic of that family's packages and values
5. The toolchain version cliff
6. A migrate-or-last-time-buy decision table

### Cluster 3 — MCU sourcing & second sources (3/6 done)

Largest category in the catalogue (101,457 parts).

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | MCU Second-Sourcing: A Cross-Reference Guide That Survives Production (pillar) | mcu-second-source-cross-reference-guide | 2,896 | draft |
| ✅ | STM32F103 vs STM32F407 — rewritten from a 481-word stub | stm32f103-vs-stm32f407-comparison | 2,167 | **live** |
| ✅ | GD32 vs STM32 for motor control — linked into the cluster | gd32-vs-stm32-gd32f103-motor-control-alternatives | 1,733 | draft, ready |
| ✅ | AEC-Q100 vs Industrial Grade | aec-q100-vs-industrial-grade-mcu | 2,290 | draft |
| ✅ | Legacy 8-Bit MCU Sourcing: PIC, AVR, 8051 | legacy-8-bit-mcu-sourcing | 2,320 | draft |
| ✅ | Migrating Off an EOL Microcontroller | migrating-off-eol-microcontroller | 2,340 | draft |

**Cluster complete.** Note the substitution: the planned "Chinese MCU
alternates: CH32, GD32, AT32 compared" was **dropped** after checking the
catalogue — we hold 5 GD32, 2 CH32 and 1 APM32 part number, and the 194 "AT32"
matches are Atmel AT32UC3 devices, not Artery. An article on parts we cannot
supply generates traffic we cannot serve.

It was replaced with legacy 8-bit sourcing, which covers ~17,400 part numbers
we actually hold (PIC16 ~7,300, PIC18 ~2,965, MSP430 ~2,685, HC08/HCS08 ~1,333,
ATmega ~1,215, ATtiny ~802, AT89 ~463).

**Check catalogue depth before committing to a topic.** It is the difference
between an article that converts and one that ranks for queries we lose.

The pillar's "four kinds of MCU replacement" table is the piece the other
articles hang off; the GD32 piece is the worked example of the highest-risk
row (cross-vendor pin-compatible).

### The depth standard (set 2026-08-02)

Every new article follows this shape. It is written for extraction by
generative engines as much as for ranking.

1. **A bolded definition sentence** as the opening line — the direct answer to
   the title's implied question, quotable on its own.
2. **Key takeaways** block: 5-7 self-contained bullets, each meaningful without
   the article around it.
3. **A direct-answer sentence immediately under every H2**, before the
   explanation. Generative engines chunk by heading; a chunk that opens with
   context rather than an answer is not quotable.
4. **Data tables with concrete numbers.** Tables are the single most cited
   element type in AI answers.
5. **Worked arithmetic** — real formulas with real substituted values, not
   "calculate the dissipation".
6. **A FAQ section of 6-8 questions**, phrased the way people actually ask
   them. `extractFaqEntries` in `src/lib/blog-content.js` lifts these into
   FAQPage structured data automatically; no editor action needed.
7. Target **2,500-3,500 words**, 12+ H2/H3 headings, 4+ internal links.

### Cluster 4 — Analog & power second sourcing (5/6 written, awaiting images)

~178,000 parts with no coverage at all. Highest ratio of inventory to content.

Batch 1 is written and imported as drafts; they publish once cover images are
added. Each cites part numbers verified to exist in the catalogue.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | Analog and Power Second-Sourcing: A Procurement Guide (pillar) | analog-power-second-sourcing-guide | 3,201 | draft |
| ✅ | LDO Cross-Reference: What Actually Has to Match | ldo-cross-reference-guide | 2,900 | draft |
| ✅ | Replacing a Discontinued DC-DC Regulator | dc-dc-regulator-replacement-guide | 2,798 | draft |
| ✅ | Supervisor and Reset IC Selection: The Timing Nobody Checks | supervisor-reset-ic-selection-guide | 2,465 | draft |
| ✅ | Op-Amp Equivalents: The Specs That Bite | op-amp-equivalent-selection | 2,502 | draft |
| ✅ | Clock Generators and PLLs: Jitter, Output Format and Drop-In Risk | clock-generator-pll-sourcing | 2,695 | draft |

**Cluster complete.** ~16,600 words across six articles, covering ~210,000
catalogue parts that previously had no editorial content at all.

## Cluster 5 — Memory sourcing (3/6 done)

**66,014 part numbers across eight memory categories, and it had zero
editorial coverage** — the largest uncovered block on the site after the
FPGA work.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | Memory IC Sourcing (pillar) | memory-ic-sourcing-guide | 2,530 | draft |
| ✅ | SRAM Sourcing: Async, Sync and Battery-Backed | sram-sourcing-guide | 2,180 | draft |
| ✅ | Flash and EEPROM Sourcing | flash-eeprom-sourcing-guide | 2,400 | draft |
| ✅ | Legacy DRAM and SDRAM Sourcing | dram-sdram-legacy-sourcing | 2,240 | draft |
| ✅ | FIFO Memory: 70% Discontinued and Still Required | fifo-memory-sourcing | 2,180 | draft |
| ✅ | FRAM and MRAM: When EEPROM Endurance Runs Out | fram-mram-sourcing | 2,130 | draft |

**Cluster complete.** Six articles, ~13,700 words, covering 66,014 catalogue
parts that previously had none. Each spoke links its own `/category/*` hub
(sram, flash-memory, dram-sdram, fifo-memory, fram-mram) — all verified to
exist.

The obsolescence rates measured from the catalogue are the spine of this
cluster and are worth keeping current:

| Family | Parts | Discontinued | Rate |
| --- | ---: | ---: | ---: |
| SRAM | 17,613 | 9,121 | 52% |
| Flash Memory | 15,689 | 8,612 | 55% |
| DRAM & SDRAM | 10,061 | 5,241 | 52% |
| EEPROM | 9,653 | 2,962 | 31% |
| FIFO Memory | 4,136 | 2,899 | **70%** |
| FRAM & MRAM | 557 | 78 | 14% |

## Do not write: Passives

**The catalogue has essentially no passive components.** Measured 2026-08-03:
MLCC 26 parts, thick-film resistors 6, inductors 4, diodes 21, TVS 45,
crystals 29 — roughly 130 parts out of 719,342. This is an IC catalogue.

The `passives-sourcing` blog category exists because of one MLCC article
inherited from the original nine posts. **It should not be expanded.** Traffic
for resistor, inductor or capacitor queries lands on a catalogue that cannot
quote them.

This was nearly a wasted batch: Passives was recommended as "the thinnest blog
category" without checking inventory first — the exact mistake the Cluster 3
note warns about. Check catalogue depth before committing to a topic, every
time.

## Cluster 6 — Interface & Logic (5/8 done)

~34,000 part numbers across drivers, receivers, transceivers and logic buffers,
plus level shifters and interface controllers. Zero coverage before this batch.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | Interface and Transceiver Sourcing (pillar) | interface-transceiver-sourcing-guide | 2,420 | draft |
| ✅ | RS-485 Transceiver Sourcing | rs485-transceiver-sourcing-guide | 2,330 | draft |
| ✅ | CAN Transceiver Sourcing | can-transceiver-sourcing-guide | 2,270 | draft |
| ✅ | Level Shifter Selection | level-shifter-selection-guide | 2,120 | draft |
| ✅ | Logic Family Selection | logic-family-selection-guide | 2,240 | draft |
| ✅ | LVDS and High-Speed Differential Sourcing | lvds-sourcing-guide | 2,270 | draft |
| ✅ | Gate Driver Selection | gate-driver-selection-guide | 2,430 | draft |
| ✅ | LED Driver Sourcing | led-driver-sourcing-guide | 2,300 | draft |

**Cluster complete.** Eight articles, ~18,400 words, covering ~53,000 catalogue
parts across six categories that had no coverage at all.

Obsolescence rates measured 2026-08-03:

| Category | Parts | Discontinued |
| --- | ---: | ---: |
| Drivers, Receivers & Transceivers | 19,068 | 34% |
| Buffers, Drivers, Receivers & Transceivers | 15,272 | 33% |
| LED Drivers | 6,422 | 32% |
| Gate Drivers | 6,266 | 36% |
| Interface Controllers | 3,537 | **44%** |
| Translators & Level Shifters | 2,476 | **42%** |

## Cluster 7 — Data Converters & Signal Chain (6/6 done)

**53,736 part numbers across seven categories, and it had zero editorial
coverage** — the largest uncovered block left after the interface work. New
blog category `data-converter-sourcing` was added to
`scripts/restructure-blog-categories.mjs` (idempotent, so re-running it is
safe).

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | Data Converter Sourcing (pillar) | data-converter-sourcing-guide | 3,347 | draft |
| ✅ | ADC Sourcing: Architecture First | adc-sourcing-guide | 3,068 | draft |
| ✅ | DAC Sourcing: Output Structure | dac-sourcing-guide | 3,154 | draft |
| ✅ | Analog Switch and Multiplexer Selection | analog-switch-mux-sourcing-guide | 3,009 | draft |
| ✅ | Voltage References: Initial Accuracy | voltage-reference-selection-guide | 3,427 | draft |
| ✅ | Comparator Selection | comparator-selection-guide | 3,355 | draft |

**Cluster complete.** Six articles, ~19,360 words, 8 FAQ entries each,
12-14 H2/H3 per article, every `relatedProducts` part number verified to exist
in the catalogue. Each spoke links the pillar, two or more siblings, its own
`/category/*` hub and the established obsolescence articles.

Status rates measured 2026-08-04:

| Category | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| ADC | 14,838 | 4,946 | 33% |
| DAC | 11,852 | 3,342 | 28% |
| Analog Switches & Multiplexers | 9,895 | 4,380 | **44%** |
| Voltage References | 8,143 | 2,469 | 30% |
| Analog Comparators | 4,403 | 1,273 | 29% |
| ADC/DAC — Special Purpose | 2,524 | 933 | 37% |
| Analog Switches — Special Purpose | 2,081 | 933 | **45%** |

Analog switches are the worst-affected category on the whole site. The reason
is also the article's angle: the survivors are on low-voltage processes and
cannot take the ±15 V rails the originals ran on, so a pinout-compatible
replacement destroys the board.

Two things worth reusing from this batch:

- **The error-budget-in-LSBs framing** (reference tempco = 39 LSB at 16 bits)
  is the piece that makes the reference article the highest-value one, and it
  generalises to any precision-analog topic.
- **Pin-compatible resolution ladders are a genuine information-gain topic.**
  `ADS1115IRUGT` (16-bit) and `ADS1015IRUGR` (12-bit) are both in the catalogue,
  share footprint and register map, and the wrong one fits silently.

## Cluster 8 — Legacy 74xx / 4000-series logic (5/5 done)

**39,165 logic part numbers across seven categories, 13,430 inactive (34%).**
This is a spoke batch under the existing `logic-family-selection-guide` pillar,
so it sits in the Interface & Logic Sourcing category rather than a new one.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | Decoding a 74-Series Part Number | 74-series-logic-decode-guide | 3,022 | draft |
| ✅ | Sourcing Logic Gates and Inverters | gates-inverters-sourcing-guide | 2,765 | draft |
| ✅ | Flip-Flops, Latches and Registers | flip-flop-latch-register-sourcing-guide | 2,939 | draft |
| ✅ | Decoders, Multiplexers and Bus Switches | decoder-mux-bus-switch-sourcing-guide | 3,039 | draft |
| ✅ | Counters, Dividers and Shift Registers | counter-shift-register-sourcing-guide | 2,997 | draft |

**The family obsolescence census is the asset from this batch** and nobody else
publishes it. Measured 2026-08-04 across all logic categories:

| Family | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| `74AUP` | 857 | 74 | 9% |
| `74AHC` | 1,605 | 204 | 13% |
| `74LS` | 1,130 | 241 | 21% |
| `74LVC` | 2,546 | 526 | 21% |
| `74HC` | 6,359 | 1,888 | 30% |
| `74F` | 2,151 | 952 | 44% |
| `74AC` | 2,374 | 1,163 | 49% |
| `74ACT` | 1,249 | 650 | 52% |
| `74LCX` | 479 | 284 | 59% |
| `74LVT` | 345 | 205 | 59% |
| `74ABT` | 448 | 276 | 62% |
| `74BCT` | 90 | 66 | 73% |
| `74VCX` | 72 | 53 | 74% |

Two findings worth reusing: **the 1990s "advanced" middle families are the risk,
not the 1970s ones**, and **`74LS` at 21% is healthier than `74AC` at 49%**
because demand never stopped. Per-category rates: gates 27%, decoders/MUX 35%,
flip-flops 41%, latches 45%, counters 34%, shift registers 29%, and
**specialty logic 60%** — the worst, holding DDR module registers and ECL clock
parts with no second source at all.

Not yet written from this area: **specialty logic** (1,593 parts, 60%) — DDR
registered-DIMM address registers (`SSTVF16857AGT` obsolete,
`74SSTUBF32866BBFG8` last-time buy) and `MC100EP16`-family ECL clock receivers.

## Cluster 9 — Timing & Clock Distribution (4/4 done)

New category `timing-clock-sourcing`. Note `clock-generator-pll-sourcing`
(published, cluster 4) is the natural fifth member but was left in Analog &
Power to avoid changing a live `/blog?category=` value; it is cross-linked from
all four.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | 555 Timers and Delay ICs | 555-timer-delay-ic-sourcing-guide | 2,755 | draft |
| ✅ | Programmable Oscillators | programmable-oscillator-sourcing-guide | 3,051 | draft |
| ✅ | Real-Time Clocks | rtc-sourcing-guide | 3,104 | draft |
| ✅ | Clock Buffers and Fanout | clock-buffer-fanout-sourcing-guide | 2,916 | draft |

**The insight that reframed this cluster: the 3% obsolescence rate on
Programmable Timers & Oscillators is an artefact.** 21,332 of its 22,784 parts
are one vendor's factory-programmed configurations (Renesas/IDT `8N0Q…`), where
the part number encodes the burned-in frequency. A family-level availability
check is actively misleading here — only the exact configuration code counts.
Meanwhile the categories that look smaller are the dangerous ones:

| Category | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| Programmable Timers & Oscillators | 22,784 | 662 | 3% (but see above) |
| Clock Buffers & Drivers | 4,335 | 2,394 | **55%** |
| Real-Time Clocks | 2,073 | 1,171 | **55%** |

Other first-party findings from this batch: `ICS5xx` and `5V41xx` clock buffers
are **100% inactive** (31/31 and 6/6); `ICM72xx` programmable timers 62%;
Intersil `ISL12xx` RTCs 102 of 146. The RTC article's distinctive angle is that
**embedded-battery modules (`DS1743`, `DS1251`, `DS12885`) cannot be
stockpiled** — the internal lithium cell ages from the date code, which breaks
the usual last-time-buy arithmetic and makes date codes part of the
specification.

## Content corrections applied 2026-08-04

These were wrong on live pages, not stylistic preferences.

- **26,690 ADC and DAC product descriptions** opened with "is a switching
  converter" and told the reader to confirm "buck or boost topology" — the
  switching-regulator template, applied to the wrong two categories (22,886 of
  those pages are indexable). Fixed by `scripts/fix-converter-descriptions.mjs`.
- **33,337 more descriptions**: all 6,266 gate drivers said "combinational logic
  IC" with the logic review checklist, and all 28,323 op-amps said
  "instrumentation amplifier" — including `LM358DR`, `LM324` and the whole
  general-purpose `OPA`/`MCP60x` range. Fixed by
  `scripts/fix-description-category-mismatches.mjs`, which keeps an accurate
  noun for genuine instrumentation-amplifier families (`INA`, `AD62x`, `PGA`,
  `LT1167`…) and for isolated amplifiers (`HCPL`, `ACPL`, `ISO12x`).
  A probe for *mis-categorised* parts found only ~0.7% (202 of 28,323 in
  op-amps), so the category-driven noun is right for the rest.
- **`relatedProducts` backfilled** on the five published articles that had none,
  by `scripts/backfill-blog-related-products.mjs` (field only — it does not
  rewrite bodies, because the live bodies carry script fixes that may not be on
  disk).
- **Part numbers containing commas cannot go in `relatedProducts`.** The blog
  page splits that field on commas, so Nexperia-style numbers (`74HC14D,652`,
  `74AVCH2T45GF,115`) resolve as several unknown parts and vanish from the
  widget. Six drafts were corrected to comma-free equivalents;
  `verify-blog-content.mjs` now flags this pattern. Comma-containing numbers are
  still fine in article bodies.
- **8,264 descriptions in `application-specific-processors` said "is an
  application-specific processor"** and asked the reader to confirm "GPIO, SPI,
  I2C, UART, ADC peripherals, clock speed, Flash memory" — but **the category
  contains no processors**. Measured 2026-08-04: 6,474 part numbers match a
  clock/timing prefix (Skyworks Si53xx/Si52xx = 4,406 alone, IDT
  9DB/9FG/9UM/954/932, Microsemi ZL3xxx, Diodes PI6C, Cypress CY28xx), and the
  remainder is more of the same — IDTCV and IDT5T9xx clock buffers, DSC557 MEMS
  oscillators, DS1083/DS1181 programmable oscillators, MAX3679A fanout, 6V49061
  VCXOs, Abracon `AB-557-…` oscillators. **Four parts match any processor
  prefix.** 6,666 of these pages are indexable. Third rule in
  `scripts/fix-description-category-mismatches.mjs`.

  **Category renamed 2026-08-04, approved as name-and-seoTitle only:**

  | | Before | After |
  | --- | --- | --- |
  | Name (H1, breadcrumb, JSON-LD, RFQ link) | Application Specific Processors | **Clock Generators & Timing ICs** |
  | seoTitle (`<title>`) | Application Specific Processors | **Clock Generators, Buffers & Timing ICs** |
  | seoDesc | "…8,264 Application Specific Processors part numbers…" | "…8,264 clock generator, buffer and timing IC part numbers…" |
  | Slug / URL | `/category/application-specific-processors` | **unchanged** |
  | parentId, product membership | — | **unchanged** (verified: 8,264) |

  Done by `scripts/rename-clock-timing-category.mjs` (idempotent, `--dry-run`
  supported, refuses to run if the name is not what it expects).

  **`scripts/setup-categories.mjs` was updated in the same change** — it upserts
  by slug and overwrites `name`, so a re-run of that seed script would otherwise
  have silently reverted the rename. If you ever rename a product category, patch
  both places.

  **Two follow-ups still open, each needing its own decision:**

  1. **The slug still says `application-specific-processors`.** Changing it to
     something like `clock-timing-ics` is a URL change on 6,666 indexable pages'
     parent — needs redirects and a considered rollout.
  2. **The category still hangs off "Embedded & Programmable > Microcontrollers &
     Processors", while the site already has the right branch: "Clock & Timing >
     Clock Generation"** (which is where `clock-generators-plls` lives). Moving
     `parentId` fixes breadcrumbs, JSON-LD and navigation placement **without
     changing any URL** — this is the cheapest remaining improvement.
     Also worth considering: merging into `clock-generators-plls` (32,305 parts)
     or `clock-buffers-drivers` (4,335) instead of keeping a third clock category.

- **Cross-links to unpublished drafts no longer 404.**
  `src/app/blog/[slug]/page.js` now unwraps `/blog/<slug>` anchors whose target
  is not published, keeping the link text, and they become live links on the
  next revalidation after the target publishes. Publish order alone could not
  fix this: pillars and spokes link to each other in both directions, so
  whichever goes first would carry a broken link. This matters because
  `scripts/publish-next-blog.mjs` releases one draft per interval.

## Cluster 11 — Processors, DSP & SoC (4/4 done)

New category `processor-dsp-sourcing`, except the specialty-logic article which
belongs with Interface & Logic.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | Legacy Microprocessors | legacy-microprocessor-sourcing-guide | 3,439 | draft |
| ✅ | DSP Sourcing | dsp-sourcing-guide | 2,937 | draft |
| ✅ | SoCs and SoC FPGAs | soc-fpga-application-processor-sourcing-guide | 2,924 | draft |
| ✅ | Specialty Logic: DDR Registers and ECL | specialty-logic-ddr-ecl-sourcing-guide | 3,309 | draft |

| Category | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| Microprocessors (MPU) | 5,169 | 3,300 | **64%** — worst of any large category |
| DSP | 4,026 | 1,644 | 41% |
| System On Chip (SoC) | 4,779 | 645 | 13% — best of any processor category |
| Specialty Logic | 1,593 | 952 | 60% |

**Cluster complete.** Four articles, ~12,600 words. Family data behind them:

| Family | Parts | Not active | Note |
| --- | ---: | ---: | --- |
| `KMPC…` | 524 | **99%** | Freescale automotive PowerPC |
| `IDT79…` | 119 | **100%** | IDT MIPS — architecture finished here |
| `TS68…` | 30 | **100%** | Thomson 68000 |
| `SSTU…` / `SSTV…` | 105 / 73 | **98% / 97%** | DDR module registers |
| `MPC8…` | 1,217 | 77% | PowerQUICC / QorIQ |
| `Z80…` | 89 | 90% | — |
| `MSC…` | 128 | 82% | Freescale StarCore DSP |
| `ADSP-TS…` | 20 | 80% | ADI TigerSHARC |
| `XC7Z…` / `5CS…` | 127 / 139 | **8% / 4%** | Zynq-7000 / Cyclone V SoC |
| `N80…` | 27 | **0%** | Intel 80C186/188 — active via aftermarket |

Five findings that are the actual value of this batch:

- **Availability has little to do with silicon age.** `N80C188/TR` (1982 Intel
  embedded x86) is active while `MPC8313EZQAGDC` (twenty years newer) is
  obsolete. Aftermarket production follows installed-base demand.
- **`MPC8548E` vs `MPC8548`: the `E` is a security engine**, not a package code.
  Both active here, one from Freescale and one from Rochester.
- **Aftermarket part numbers carry appended codes.** 74% of part numbers ending
  `557` in our catalogue are Rochester's, 89% of those ending `2518`. **Search
  the OEM number as a prefix, not an exact string** — a "no stock anywhere"
  conclusion from an exact-match search is unreliable for legacy processors.
  Also search both `NXP` and `Freescale`: the merger left both names in the data.
- **`XPC` (Freescale) and `ES` (FPGA-SoC) are pre-production markers.** 86 `XPC`
  parts here, 64 inactive; `10AS066K3F35I2SGES` is an obsolete Arria 10
  engineering sample. Unqualified silicon reaching a purchasing system as "the
  same part, cheaper".
- **For DSPs the toolchain expires before the silicon.** Rochester supplies 37%
  of that category and some parts are *active*, so the usual answer is
  aftermarket material plus deliberate toolchain archival — not a redesign.
  This inverts the normal last-time-buy-versus-redesign logic.

### Remaining uncovered inventory, by size

Measured 2026-08-04. Everything in the earlier version of this table except
gates/inverters is now covered by clusters 6 and 7.

| Segment | Parts | Not active | Coverage |
| --- | ---: | ---: | --- |
| Programmable Timers & Oscillators | 22,784 | 3% | none |
| Gates & Inverters | 15,167 | 27% | none |
| DC-DC Switching Controllers | 11,167 | 30% | none |
| Signal Switches, MUX & Decoders | 8,283 | 35% | none |
| Specialized Power Management | 7,428 | 40% | none |
| Power Distribution Switches | 6,768 | 41% | none |
| Flip-Flops | 6,245 | 41% | none |
| Digital Potentiometers | 5,787 | **58%** | none |
| Battery Management ICs | 5,475 | 28% | none |
| Clock Buffers & Drivers | 4,335 | 55% | none |

Both of the first two candidates in the previous revision of this plan are now
written (clusters 8 and 9), as is the digital-potentiometer spoke — at 58%
inactive it was the highest obsolescence rate on the site, and it sits in
cluster 7 because a digipot competes with a DAC.

## Route to 80 articles

73 written, **7 to go**. Clusters 10 and 11 below are done. Ordered by
uncovered inventory × cluster coherence.
Check catalogue depth per topic before writing each one — that rule has already
saved one wasted batch (Passives) and reframed another (timers).

### Cluster 10 — Power management, second tier (6/6 done)

Written into the existing Analog & Power Sourcing category, which it doubles in
size. ~44,800 parts that had no editorial coverage.

| # | Title | Slug | Words | Status |
| --- | --- | --- | ---: | --- |
| ✅ | DC-DC Controllers | dc-dc-controller-sourcing-guide | 3,040 | draft |
| ✅ | Power Switches and Hot-Swap Controllers | power-switch-hot-swap-sourcing-guide | 3,078 | draft |
| ✅ | Specialised PMICs | specialized-pmic-sourcing-guide | 2,875 | draft |
| ✅ | Battery Chargers and Fuel Gauges | battery-charger-management-sourcing-guide | 3,224 | draft |
| ✅ | Offline Switchers | ac-dc-offline-switcher-sourcing-guide | 3,045 | draft |
| ✅ | Motor Drivers | motor-driver-sourcing-guide | 3,119 | draft |

| Category | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| DC-DC Switching Controllers | 11,167 | 3,350 | 30% |
| Power Distribution Switches | 6,768 | 2,800 | 41% |
| Hot Swap Controllers | 2,193 | 972 | 44% |
| Specialized Power Management | 7,428 | 2,984 | 40% |
| Battery Management | 5,475 | 1,548 | 28% |
| Battery Chargers | 3,176 | 723 | 23% |
| AC-DC Converters | 4,291 | 1,862 | 43% |
| Motor Drivers | 4,295 | 1,615 | 38% |

**Cluster complete.** Six articles, ~18,400 words. Family-level findings worth
keeping current — these are the numbers the articles are built on:

| Family | Parts | Not active | Note |
| --- | ---: | ---: | --- |
| `ISL65xx` (CPU VR controllers) | 365 | **78%** | Die with the socket generation — VID protocol has no other customer |
| `TNY3xx` | 19 | **100%** | Power Integrations' older integrated switchers |
| `NCP10xx` | 242 | 69% | onsemi offline controller consolidation |
| `TOP2xx` | 277 | 61% | — |
| `DS276x` (gauges) | 53 | **85%** | Highest in the battery categories |
| `MAX8xxx` (PMIC) | 155 | 55% | Maxim-into-ADI consolidation |
| `MIC20xx` (load switches) | 369 | 46% | Micrel-into-Microchip |
| `UDNxxxx` (motor) | 9 | **100%** | — |
| `DRV8xxx` (motor) | 373 | **1%** | The healthy migration target |
| `BQ25xx` (chargers) | 151 | **1%** | Ditto |

Three angles from this batch that generalise:

- **The reference-voltage trap.** A controller's internal reference sets V_OUT
  through the existing divider, so a 0.6 V part in an 0.8 V design silently
  regulates 3.3 V down to 2.48 V. Same shape as the `UC3842`/`UC3844`
  duty-cycle difference: identical pinout, incompatible behaviour.
- **Fault response as a suffix.** Latch-off versus auto-retry is one digit in an
  ordering code and changes system behaviour, not performance. Same for
  battery-protection latch versus recover.
- **Safety-consequence substitutions.** Charger float voltage (4.2 V vs 4.35 V)
  and offline-switcher drain rating (650 V vs 700 V) are the two places in the
  catalogue where getting a substitution wrong is an incident rather than a
  defect. Both articles state that plainly.

**Broad last-time-buy waves found while writing this batch** — worth a scrub
now: Infineon `BTT60xxx` automotive smart switches (the whole group), Analog
Devices `LTC4245`/`LTC4282`/`LTC4238` hot-swap, Intersil notebook chargers
(`ISL88731`, `ISL88733`, `ISL9520`, `ISL9230`, `ISL6251`), onsemi `NCP12xx`
offline controllers, and Freescale `MPC175xx` H-bridges.

### Does the Audio/Video/Telecom branch deserve articles? — measured 2026-08-04

Asked before writing the last five. Obsolescence by top-level branch, whole
catalogue:

| Branch | Parts | Not active |
| --- | ---: | ---: |
| Power Management | 226,194 | 28% |
| Embedded & Programmable | 155,261 | 39% |
| Analog & Mixed Signal | 88,936 | 35% |
| Memory | 67,120 | **49%** |
| Clock & Timing | 62,421 | 22% |
| Logic | 55,805 | 34% |
| Interface & Communication | 34,645 | 40% |
| **Audio, Video & Telecom** | **28,883** | **44%** |

So it is the *smallest* branch and the *second-most obsolete* — 16,056 indexable
pages with no editorial support. But 17,122 of those 28,883 parts are the two
grab-bag categories (`specialized-ics` 12,415 + `special-purpose-ics` 4,707)
that are not coherent topics. The genuinely audio/video/telecom part is ~11,761.

**Verdict per sub-area:**

- **Telecom ICs (4,124, 58% inactive) — write it.** T1/E1 framers, LIUs and
  SLICs sit in carrier and OEM equipment with 15-25 year lives whose owners
  cannot redesign; they must source. `DS21…` is 205 of 236 inactive, the
  MaxLinear `XRT…` LIUs are in last-time buy. This is the site's economics
  exactly.
- **Video & Display (4,321, 54-58%) — write it**, framed as legacy video
  interface, distribution and display drivers for industrial, CCTV, broadcast
  and medical equipment — not consumer TV. `TDA98…` is 40 of 40 inactive, the
  Renesas/Techwell `TW28xx` analogue-CCTV decoders are last-time buy, and
  `display-drivers` (1,251, 54%) connects to the industrial-HMI panel-bias point
  already made in the PMIC article.
- **Audio — skipped, deliberately.** Audio power amplifiers (4,065, in the
  Analog branch) are consumer commodity: the query space is dominated by design
  and hobbyist intent (`LM386` circuits), which is traffic that does not convert
  for an obsolete-sourcing business, and when a consumer codec dies the customer
  redesigns rather than paying a premium for old stock. The part of audio that
  *does* fit — telecom and industrial codecs such as `PEB2260` — belongs inside
  the telecom article, not in a separate piece. Note for later: the
  Cirrus/Wolfson `WM8xxx` group is heavily last-time buy (`WM8974`, `WM8750`,
  `WM8776`, `WM8988`, `WM8758`, `WM8978`, `WM8960`), so if audio is ever wanted,
  that is the angle with real news value.

**The freed slot goes to a first-party obsolescence data study** across all
719,342 parts — the branch table above plus per-category and per-manufacturer
breakdowns. Rationale: no competitor can publish it, it is the natural hub that
links all eleven clusters, its buyer intent is procurement-grade (lifecycle risk
→ BOM scrub → RFQ), and it is the most linkable asset the site can own. The
per-vendor angle is already visible in the data: the Renesas-owned Intersil/IDT
portfolio recurs in every cluster's last-time-buy list.

### Cluster 12 — Interface, video and telecom (5 articles)

**Revised after auditing what these categories actually hold** — the original
plan assumed the names were accurate and two of them were not. Verified
2026-08-04 by sampling part numbers at three points in each category:

| Topic | Categories | Parts | Not active | What is really in there |
| --- | --- | ---: | ---: | --- |
| Interface controllers | `interface-controllers-ic` | 3,537 | 45% | FTDI `FT2232/FT4232`, SiLabs `CP2102N`, Microchip `MCP2517FD` CAN-FD, ADI `ADIN2111` 10BASE-T1L, `FIDO5100` industrial Ethernet, NXP `PTN5100/PTN5150` USB-C, plus misfiled legacy Intel LAN and chipset parts |
| ~~Audio codecs and amplifiers~~ | ~~`audio-codecs` + `audio-amplifiers`~~ | 5,508 | 52% / 45% | **Dropped — see the fit assessment above.** Replaced by the catalogue-wide obsolescence data study |
| Video interface ICs | `video-processing` + `video-amplifiers` | 3,976 | 58% / 59% | ADI `AD812x/AD819x` crosspoints, NXP `TDA988x` HDMI transmitters and TV IF, `TMC2xxxx` legacy encoders |
| Telecom line interface | `telecom-ics` | 4,124 | 58% | IXYS solid-state relays and `TS117/TS118` access switches, Renesas `82V208x` T1/E1 framers, `82V3389` sync |
| PCIe switches and bridges | inside `specialized-ics` | — | — | Renesas/IDT `89HPES…` PCIe packet switches. **Count the subset before committing** |

**Do not write a "Specialized ICs" article as planned.** That category (12,415
parts) is a genuine grab-bag: Xilinx `XCMECH-…` *mechanical samples* (not
functional devices), ADSANTEC high-speed parts, ABLIC `HDL…`, IDT PCIe switches,
and a large block of Freescale MCU/MPU material via Rochester (`MC9S12…`,
`MCF51…` ColdFire, `MCIMX6…` i.MX 6). The coherent subsets are PCIe switches and
the misfiled processors — the rest has no shared topic and is better handled as
a taxonomy clean-up than as an article.

### Cluster 12 and gap-fills — all written 2026-08-04/05

| # | Title | Slug | Words | Category |
| --- | --- | --- | ---: | --- |
| ✅ | Interface Controllers | interface-controller-sourcing-guide | 3,408 | Interface & Logic |
| ✅ | PCIe Switches and Bridges | pcie-switch-bridge-sourcing-guide | 3,039 | Interface & Logic |
| ✅ | Telecom Line Interfaces | telecom-line-interface-sourcing-guide | 3,434 | Video, Display & Telecom |
| ✅ | Legacy Video and Display Drivers | video-display-interface-sourcing-guide | 3,082 | Video, Display & Telecom |
| ✅ | BGA Reballing | bga-reballing-risk-guide | 3,566 | Quality & Compliance |
| ✅ | FPGA Configuration Memory | fpga-configuration-flash-pairing | 3,332 | FPGA & CPLD |
| ✅ | **What 719,342 Part Numbers Say About IC Obsolescence** | ic-obsolescence-data-study | 3,772 | Obsolescence & Lifecycle |

The last one is the hub: it publishes the catalogue-wide measurement (34.4% of
719,342 part numbers not active), the branch, manufacturer, package and
100%-dead-family tables, a full method-and-limitations section, and it links to
every other cluster. Its headline finding — **Renesas holds 1,460 of the 5,178
last-time-buy part numbers and ROHM 727, so two vendors account for 42% of all
active EOL notices** — is the reason the Renesas/Intersil/IDT lineage kept
appearing in every single cluster's last-time-buy list while these articles were
being written.

Two further findings worth carrying forward: **obsolescence tracks acquisition
history rather than silicon age** (acquired portfolios — Micron 71%, Spansion
70%, Intersil 66%, onsemi 64%, Cypress 64%, Maxim 53% — against independents
still investing in catalogue lines: Torex 8%, ABLIC 8%, Linear 10%, Nisshinbo
10%), and **Rochester Electronics is the largest single supplier in the
catalogue** at 106,452 part numbers, 14.8% of everything listed.

### Superseded gap-fill list (2 articles, both now written)

- **BGA reballing: when it is acceptable and when it is not** — Cluster 2 item 8,
  points at `/quality`. Still the most-requested question we do not answer.
- **Pairing an FPGA with the right configuration flash** — Cluster 2 item 9.
- **Interface controllers (USB, Ethernet MAC/PHY, UART bridges)** —
  `interface-controllers-ic`, 3,537 parts at 44% inactive, currently uncovered.

### Structural items still open

- `understanding-mlcc-capacitors-guide` remains the one structurally broken
  article: 1,844 words, **zero H2 headings**, no FAQ, so no table of contents, no
  heading anchors and no FAQPage. It is unpublished; restructure before it goes
  live. (Do not expand the Passives category otherwise — see above.)
- Consider moving `clock-generator-pll-sourcing` into `timing-clock-sourcing`.
  It changes a live `/blog?category=` value, which is why it was left alone.

## Draft file format

Two metadata conventions are accepted by `scripts/import-blog-drafts.mjs`:

- **Top YAML frontmatter** (`--- … ---`) — preferred, and what to use for new
  articles. The importer strips it from the body.
- A trailing `## DB import metadata` block with a ```yaml fence — the original
  convention, still used by drafts 01-08.

Frontmatter wins when both are present. Recognised keys: `title`, `slug`,
`status`, `seoTitle`, `seoDesc`, `seoKeywords`, `tags`, `author`,
`readingTime`, `category`, `relatedProducts`, `coverImage`.

Re-importing never demotes a published post back to draft — the importer
preserves `status` and `publishedAt` on anything already live.

Inline images go in the body as plain `<img>` with `/uploads/…` paths.
`fetchpriority` and `decoding` survive sanitisation, so the hero image can be
marked as the LCP element.

Link structure built in batch 1: pillar → both spokes and five `/category/*`
hubs; each spoke → pillar, sibling spoke, its own category hub, plus the
existing `bom-scrubbing` and `eol-nrnd` articles. That gives the new cluster an
inbound path from the established one.

## Execution order

Ranked by (inventory covered) × (cluster completeness gain):

1. **Cluster 4 pillar + LDO + DC-DC** — 104K parts, zero competition internally
2. **Cluster 3 pillar + publish GD32 draft + expand STM32 stub** — 101K parts,
   turns two thin posts into a cluster
3. **Cluster 2 pillar rewrite + 3 series spokes** — feeds the existing
   `/fpga-sourcing/*` hub pages, which currently receive no editorial links
4. **Cluster 1 spokes 1-3** — extends the one cluster that already works
5. Remainder

## Categories (restructured 2026-08-02)

Format-based categories were replaced with topic-based ones so the on-page
related-posts block reinforces a cluster instead of mixing subjects. The four
original rows were renamed in place, so no post lost its category during the
move; `/blog?category=<old-slug>` degrades to the unfiltered list.

| Was | Now | Published posts |
| --- | --- | ---: |
| buying-guides | `obsolescence-sourcing` — Obsolescence & Lifecycle Sourcing | 3 |
| technical-tutorials | `fpga-cpld-sourcing` — FPGA & CPLD Sourcing | 2 |
| product-comparisons | `mcu-sourcing` — MCU Sourcing & Alternatives | 1 |
| industry-news | `analog-power-sourcing` — Analog & Power Sourcing | 0 (3 drafted) |
| (new) | `quality-compliance` — Quality & Compliance | 1 |
| (new) | `passives-sourcing` — Passives & Discretes | 0 (1 draft) |
| (new) | `memory-sourcing` — Memory Sourcing | 0 (6 drafts) |
| (new) | `interface-logic-sourcing` — Interface & Logic Sourcing | 0 (8 drafts) |
| (new) | `data-converter-sourcing` — Data Converters & Signal Chain | 0 (6 drafts) |

`scripts/restructure-blog-categories.mjs` performs the migration and is
idempotent. Draft files in `docs/blog-drafts/` declare the new names.

## Structural work, independent of writing

- [x] Strip writer scaffolding leaking into 5 published posts
      (`scripts/clean-blog-scaffolding.mjs`, and the importer now applies
      `stripDraftScaffolding` so it cannot recur)
- [x] Assign `categoryId` to the 6 posts that had none — this is also what
      switches on the related-posts block
- [x] Convert bold-text FAQ questions to H3 across the older drafts
      (`scripts/upgrade-faq-headings.mjs`, 26 questions in 5 files) — this is
      what makes `extractFaqEntries` see them and emit FAQPage
- [x] Remove third-party `www.rihoas.com` links from two articles. They were
      protocol-less (`href="www.rihoas.com"`), so they resolved as relative
      paths and 404'd, while pointing at an unrelated domain
- [ ] Give the 5 sourcing articles a `relatedProducts` list; they currently have
      none, so the strongest content has no path into the catalogue
- [ ] `how-to-choose-right-fpga` is the last thin published article (618 words,
      no FAQ) and is meant to be the Cluster 2 pillar — rewrite next
- [ ] **`understanding-mlcc-capacitors-guide` is the last structurally broken
      article**: 1,844 words with **zero H2 headings and no FAQ** — a single
      wall of text. It gets no table of contents, no heading anchors and no
      FAQPage. Needs restructuring before it is published.
- [ ] Decide whether blog categories stay format-based (Buying Guides /
      Product Comparisons / Technical Tutorials / Industry News) or become
      cluster-based. Format-based categories cut across clusters, so the
      related-posts block currently mixes unrelated topics. Changing them
      alters `/blog?category=` values — needs a decision before any rename.
