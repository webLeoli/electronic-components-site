# Content architecture to 300+ articles — the information-gain engine

Written 2026-08-11. Sits above `blog-content-plan.md` (the 80 sourcing articles)
and `blog-technical-content-plan.md` (the engineering axis). Those two say *what*
to write next. This one says *how to keep finding topics that are worth writing*
once the obvious subjects are all covered.

## The problem this solves

After 84 articles, every part family in the catalogue with meaningful inventory
has a guide. Writing an 85th single-subject guide means either covering a family
we cannot supply (the Passives mistake) or duplicating one we already covered
(worse — it splits our own ranking).

**The corpus has a shape, and the shape is the opportunity.** Measured against the
84 existing articles:

- **Almost every article is single-subject.** It explains A. Nothing explains
  A against B, even where the catalogue proves they compete for the same design
  slot. `digital-potentiometer-sourcing-guide` and `dac-sourcing-guide` both
  exist; the note in `blog-content-plan.md` that "a digipot competes with a DAC"
  was never turned into the article that says so.
- **Almost every article is written from one desk.** The procurement desk. The
  same EOL notice looks completely different to a firmware engineer archiving a
  toolchain, a manufacturing engineer re-qualifying a programming step, and a
  field-service engineer with a ten-year spares obligation.
- **Almost every article treats one variable.** The interactions are unwritten:
  temperature against refresh overhead, moisture sensitivity against reballing,
  a date code against a lithium cell's shelf life.
- **Every article is organised by component.** Engineers search by *symptom*.
  Nobody arrives at work knowing they have a configuration-flash problem; they
  arrive knowing the board does not boot.

**Four excellent engineers given the same board produce four different accounts of
it, and all four are correct.** That is not a problem to resolve — it is the
supply of unique content. Each account is an article nobody else wrote, because
everyone else wrote the datasheet summary.

## The four patterns

Each pattern is a repeatable way to generate a topic with genuine information
gain. A candidate topic must pass the **gap test**: if the reader could get the
same answer by reading two existing articles back to back, the article adds
nothing — unless it resolves a *conflict* or supplies a *decision rule* that
neither contains.

### Pattern 1 — Comparison (A vs B, where A and B both exist and the comparison does not)

**Rule: the two subjects must compete for the same design slot, and the article
must end in a decision rule, not a feature table.**

The information gain is the *crossover point*: the specific condition at which
the answer changes. "A digipot is better below X and a DAC above X, and here is X
with the arithmetic" is content that neither single-subject article can contain,
because the crossover only exists in the comparison.

Anti-pattern: a table of specifications with no recommendation. That is a
datasheet summary with two columns.

### Pattern 2 — Perspective (the same subject from a different desk)

**Rule: name the desk, adopt its actual constraints and success criteria, and
reach a conclusion the other desks would argue with.**

The eight desks we can write from credibly:

| Desk | Success criterion | What it notices that others miss |
| --- | --- | --- |
| Design engineer | The circuit meets spec with margin | Parametric compatibility, not availability |
| Firmware engineer | The image builds and boots on any qualified unit | Toolchain horizon, register-level device differences |
| Manufacturing / test engineer | Yield, cycle time, first-pass pass rate | Programming, MSL, panelisation, test coverage |
| Quality / incoming inspection | Nothing counterfeit or degraded enters | Date codes, packaging, marking, traceability |
| Reliability engineer | It survives the warranty at the P95 corner | Derating, storage aging, thermal cycling |
| Compliance engineer | The certificate is defensible | Grade qualification, documentation, change control |
| Field service | Repairable for the service life | Spares depth, repairability, interchangeability |
| Programme / cost owner | Total cost across the product life | Cost of obsolescence events, requalification cost |

**The strongest articles in this pattern put several desks in conflict and
adjudicate.** Design wants the newest part; procurement wants the one with three
sources; compliance wants the one already on a certificate; field service wants
the one that will exist in 2041. Those four cannot all win, and the article that
says which one should win, and why, is unique by construction.

### Pattern 3 — Cross-domain interaction (A × B)

**Rule: the article must quantify an interaction, not describe two things.**

Temperature is the richest second variable in this catalogue because it changes
*different* things in every domain: DRAM refresh overhead doubles, LDO dropout
worsens, flash retention and endurance trade against each other, crystals drift,
electrolytics age, and an RTC's embedded lithium cell depletes from its date code
rather than from installation. An article on temperature alone is generic; an
article on **temperature × a specific domain, with the arithmetic**, is not.

### Pattern 4 — Symptom-first (from the failure back to the cause)

**Rule: organise by what the engineer observes, then cut across every component
domain that can produce that observation, with a discrimination procedure.**

This is the pattern with the largest gap between search demand and available
content, and the one that cross-links the entire corpus naturally: a single
"board does not boot" article legitimately links to configuration flash, power
sequencing, supervisors, clocks and counterfeit inspection.

The discipline that makes it work is **discrimination** — each candidate cause
needs a test that rules it in or out, ideally one that takes minutes. A list of
possible causes without discriminating tests is not diagnosis, it is a table of
contents.

## Guardrails

Volume at this scale has two failure modes, and both are self-inflicted.

**1. Cannibalisation.** Two articles competing for one query split the signal and
both rank worse than one would have. **Every new article must declare the primary
query intent it owns, and it must not already be owned.** Keep the register in
this document (below) and check it before writing. This is why the enumerated
roadmap exists rather than a list of themes.

**2. Thin content by dilution.** 300 articles at the current depth standard is
roughly 900,000 words that must all be worth reading. The depth standard in
`blog-content-plan.md` is the floor, not the target, and the verifier enforces the
mechanical part of it. **An article that cannot clear the gap test should not be
written at all** — the roadmap below is deliberately shorter than the number of
cells the matrix could generate, because most cells fail the test.

**3. Never invent data.** Every measured figure comes from
`scripts/measure-catalogue.mjs`, dated. Every external fact is sourced. A
fabricated crossover point is worse than no article.

**4. Catalogue data alone is not sufficient, and this rule was added on
2026-08-11 after the first eleven articles.** Our catalogue is authoritative for
one thing only: **what we list and what status we hold against it.** It is not
authoritative for anything else, and two failure modes follow:

- **Our `status` field can lag or disagree with the manufacturer.** It is sourced
  at ingest, so a part we call active may have had a notice issued since. Always
  frame status as a dated snapshot and say so in the article.
- **Datasheet-level technical claims are not in our data at all.** Register bit
  positions, timing parameters, endurance ratings, standard limits and toolchain
  support horizons come from outside. Writing them from memory is how a credible
  article acquires an error that destroys its credibility.

**Therefore: every article separates two kinds of claim and sources each
differently.**

| Claim type | Source | How it appears |
| --- | --- | --- |
| Availability, obsolescence rate, part counts, vendor concentration | Our catalogue, via `measure-catalogue.mjs` | Dated, with the population stated |
| Register bits, timings, endurance, standard limits, toolchain support | Primary external source — JEDEC/IEC/TIA standard, vendor app note or datasheet | Named in a **Sources** section, with the caveat that device specifics vary |

**Every article gets a `## Sources` section at the end.** It states which figures
are first-party measurement, names the external primary sources, and tells the
reader to confirm device-specific parameters against the datasheet for the exact
ordering code. This is not decoration — it is what makes a technical claim
checkable, and it is the difference between an article an engineer trusts and one
they verify elsewhere and then stop reading.

## House style, and the fingerprint problem

Added 2026-08-11 after a measurement showed that articles 83-94 had drifted into a
detectable rhythm. Ninety-odd articles sharing one mechanical cadence is a
site-level risk, not a per-article blemish.

**First, two things that were checked and are not problems**, recorded so nobody
re-investigates them:

- **There is no hidden marker of any kind in the content.** All 91 draft files were
  scanned for zero-width characters (U+200B/200C/200D/2060), byte-order marks,
  soft hyphens, directional marks, variation selectors, Unicode tag characters and
  Cyrillic/Greek homoglyphs substituted into Latin words. Zero hits. The only
  non-ASCII letters present are Ω, μ and τ, used as engineering notation, and they
  appear in the pre-2026-08-11 articles too.
- **The writer-facing header block never reaches the site.** The
  `> **Author** / **Reading time** / **Topics**` blockquote, the leading `#` H1 and
  the frontmatter are all removed by `stripDraftScaffolding()` in
  `src/lib/blog-content.js` at import time. Verified: 0 of 92 posts in the database
  contain it. It is draft-file scaffolding only, and the page renders its own `<h1>`
  from `post.title`. Leave it in the drafts; it is useful while writing.

**What is a real problem** is prose cadence. Measured per 1,000 words across the
12 articles written 2026-08-11 against the 79 written earlier:

| Marker | Articles 83-94 | Articles 01-82 | Limit from now on |
| --- | ---: | ---: | ---: |
| Paragraphs opening with a bolded sentence | **7.43** | 5.80 | **≤ 3.0** |
| Em dashes | **10.02** | 8.87 | **≤ 6.0** |
| H2 immediately followed by a bolded sentence | 1.88 | 1.61 | **≤ 0.8** |
| "and it is" | **0.97** | 0.32 | ≤ 0.3 |
| "is the whole" | 0.13 | 0.04 | 0 |
| "stated plainly", "the useful part" | 0.05 | **0.00** | **0** |

**The key structural insight, because it resolves a real conflict.** Rule 3 of the
depth standard requires a direct-answer sentence immediately under every H2, and
that rule is why generative engines can quote the article. It is *not* the source
of the mechanical feel. The uniform **bold** wrapper around that sentence is.

So: **keep answer-first structure, drop the automatic bolding.** Semantics stay,
the visual tell goes. Reserve bold for the two or three claims per article that
genuinely carry it.

Further rules, all cheap to follow:

1. **Vary H2 grammar.** Not every heading is a noun phrase. Use a question, an
   imperative, a plain statement. Three noun-phrase headings in a row is a smell.
2. **Vary paragraph length on purpose.** Include one-sentence paragraphs and
   five-sentence ones. Uniform three-sentence blocks read as generated.
3. **Prefer a comma, colon, semicolon or parentheses to an em dash.** Em dashes are
   the single strongest surface marker; two or three per article is plenty.
4. **Never open consecutive sections with the same sentence shape.** If one starts
   with a definition, start the next with a number, a case, or a question.
5. **Cut summary sentences that restate the paragraph above.** They are filler and
   they are characteristic.
6. **Do not remove** `## Key takeaways` or the FAQ H3 questions. `extractFaqEntries`
   depends on the H3s and the verifier reports zero FAQ entries as an error; they
   are a documented product requirement, not style.
7. **Read the first sentence of every section in sequence before finishing.** If
   they sound like a list of theses, rewrite half of them.

**A caution about overcorrecting, learned immediately.** Article 95 was written to
these limits and measured at **zero** em dashes and zero bolded paragraph openers.
That clears the targets, but a corpus in which no article ever uses an em dash is
just a different uniformity, and a more conspicuous one, because natural technical
prose uses a few. **The targets are ceilings, not quotas to drive to zero.** Aim
for a spread across articles: some with four em dashes, some with none, decided by
the sentence rather than by the budget.

Measured result for article 95 against the limits:

| Marker | 83-94 | Article 95 | Limit |
| --- | ---: | ---: | ---: |
| Bolded paragraph openers | 7.43 | **0.00** | ≤ 3.0 |
| Em dashes | 10.02 | **0.00** | ≤ 6.0 |
| H2 followed by bolded sentence | 1.88 | **0.00** | ≤ 0.8 |
| "and it is" | 0.97 | 0.00 | ≤ 0.3 |
| Tic phrases | 0.23 | **0.00** | 0 |

The structural requirements survived the rewrite intact: 10 H2, 8 H3, 8 FAQ
entries, 0 verifier errors. Answer-first paragraphs were kept and simply not
bolded, which was the whole hypothesis.

### Retrofit completed 2026-08-11

Articles 83-94 were brought inside the limits by
`scripts/detemplate-blog-prose.mjs` (531 substitutions) plus four hand edits.
93 posts, 0 verifier errors; every FAQ count, heading count and link survived,
because the script only ever removes a `**` wrapper or swaps punctuation.

| File | Em dash | Bold openers | Tics | "and it is" |
| --- | ---: | ---: | ---: | ---: |
| 83 | 3.0 | 0.3 | 0 | 0 |
| 84 | 3.1 | 0.3 | 0 | 0 |
| 85 | 0.9 | 0.4 | 0 | 0 |
| 86 | **6.3** | 0.5 | 0 | 0 |
| 87 | 0.5 | 0.5 | 0 | 0 |
| 88 | 3.9 | 0.5 | 0 | 0 |
| 89 | 1.9 | 0.5 | 0 | 0 |
| 90 | 3.9 | 0.4 | 0 | 0 |
| 91 | 1.9 | 0.5 | 0 | 0 |
| 92 | 3.0 | 1.0 | 0 | 0 |
| 93 | 4.7 | 0.5 | 0 | 0 |
| 94 | 3.5 | 0.5 | 0 | 0 |
| 95 | 0.0 | 0.0 | 0 | 0 |

Article 86 sits at 6.3 against a 6.0 ceiling. Left as an accepted exception: it is
a statistics report, where "725 of 727 — 99.7% — are two families" is the natural
form, and grinding it down would be the overcorrection warned about above. The
spread across the set (0.0 to 6.3) is the point; a uniform floor would be a new
fingerprint.

**A measurement-validity correction, made during the retrofit and worth keeping.**
The first pass counted every em dash in the body, which put three files over the
ceiling and would have driven a rewrite of correct typography. Three contexts are
structural, not prose habit, and are now excluded from the metric:

- **Heading separators**: `## Stage 1 — Power, measured properly`.
- **List-item labels**: `1. **Read the status pins** — two minutes, partitions everything.`
- **Table cells**, where `—` means "no data".

Article 89 read 7.1 before the correction and 1.9 after; its "excess" was six
`## Stage N — …` headings. Measure the thing you actually mean to measure, which is
the same discipline this document applies to catalogue data.

### Unpublished drafts 24-82 retrofitted 2026-08-11

59 files, 2,017 script substitutions plus six hand edits. Every tic and every
"and it is" is now zero across the draft corpus. 93 posts, 0 verifier errors.

| Group | Em dash | Bold openers |
| --- | ---: | ---: |
| 72 drafts, rewritten | **3.20** | **0.47** |
| 21 published, not yet applied | 7.98 | 5.59 |

Three drafts sit marginally over the 6.0 em-dash ceiling and are accepted
exceptions: 53 (6.7), 81 (6.4), 86 (6.3). The spread across the set matters more
than the ceiling; a uniform floor would be a new fingerprint.

### Two more metric corrections, both found by reviewing output

The pattern from the first retrofit repeated twice more. **Both times the metric
was wrong, not the prose**, and acting on the bad metric would have damaged
correct formatting.

1. **Italic list labels.** `- *Spartan-3 family* — Formally discontinued years ago`
   is a definition list. `fpga-obsolescence-spartan-cyclone-end-of-life` measured
   10.0 em dashes after transform and 3.5 once italic labels joined bold and code
   labels in the exclusion. Its "excess" was thirteen family entries.
2. **Bold field labels.** A bold span followed immediately by a colon is a label,
   not a declarative opener:

   ```
   **What it means**: the manufacturer has announced…
   **Typical signal**: no special flag on the datasheet header.
   **Procurement action**: standard sourcing, normal lead times.
   ```

   The older articles use runs of these as a pseudo-table. The first version of the
   script stripped the emphasis and flattened the structure. **Caught in the
   published-post report before anything was applied** — which is what that
   review step is for. The transform now skips `**…**:` and the metric excludes it.

   Exposure was confined to the published set: 23 such lines in article 01, five in
   03, two in 23, one in 22, and none in 24-82, whose colon-led lines are prose
   lead-ins rather than label blocks. Verified separately that no draft file
   contains an unbolded trailing `Author:`/`Last reviewed:` signature and that no
   post in the database leaks scaffolding — `stripDraftScaffolding()` matches on
   the bold, so stripping it would have leaked the signature into a live body.

### Published articles retrofitted 2026-08-11 — corpus complete

Applied to the database with `--published --apply` after review. 20 of 21 changed;
`gd32-vs-stm32-gd32f103-motor-control-alternatives` needed nothing.

**Backup taken first**: `docs/blog-published-content-backup-2026-08-11.json` holds
all 21 bodies as they were, keyed by id and slug. This was a live-content edit, so
it is reversible.

Final state, whole corpus, against the limits (6.0 / 3.0 / 0 / 0.3):

| Group | n | Em dash | Bold openers | Tics | "and it is" |
| --- | ---: | ---: | ---: | ---: | ---: |
| **All posts** | 93 | **3.12** | **0.47** | **0** | **0** |
| Published | 21 | 2.86 | 0.50 | 0 | 0 |
| Drafts | 72 | 3.19 | 0.47 | 0 | 0 |

93 posts, 0 verifier errors. **FAQ extraction unchanged on every published
article**: the five that warn on FAQ count (`eol-nrnd`, `idea-std-1010`,
`how-to-source-obsolete`, `bom-scrubbing`, `gd32-vs-stm32`) are exactly the five
`blog-content-plan.md` already records as carrying 4-5 entries against the 6-8
target. No regression.

`how-to-source-obsolete-electronic-components` finishes at 6.1 against a 6.0
ceiling, joining drafts 53 (6.7), 81 (6.4) and 86 (6.3) as accepted exceptions.

**Draft files 01-23 were transformed too** (443 substitutions, files only, no
re-import). The database is authoritative for a published body, so the edit was
applied there; had the draft files been left alone they would still carry the old
prose, and any future re-import would silently revert this work. Aligning them
removes that trap. It does not resolve the older divergence
`blog-content-plan.md` warns about — a published body may still differ from its
draft in other ways — so **re-importing a published article remains something to
do deliberately, not casually.**

### Two more measurement corrections

Both found while preparing the published pass, and both would have caused damage if
acted on directly.

1. **Bold labels followed by a dash.** `**Stage 1: Identify** — quarterly BOM
   scrub…` is a definition-list entry. Counting it inflated
   `how-to-source-obsolete-electronic-components` and the four `Stage N` lines were
   most of its apparent excess.
2. **A missing word boundary in the metric.** `/and it is /` matches inside "the
   integration b**and it is** specified over", which reported a tic in
   `clock-generator-pll-sourcing` that does not exist. The transform rules carry a
   leading space and were never affected, so nothing was miswritten — but the
   metric had been over-reporting since the first pass. Now `/\band it is /`.

That is four metric corrections across this work (heading dashes, italic labels,
bold labels, word boundary) against zero cases where the prose was actually the
problem the metric claimed. **When a marker count looks too high, suspect the
count first.**

### Verification pass, 2026-08-11

The highest-risk technical assertions in articles 83-93 were checked against
external primary sources. **All held**, which is reassuring but not a reason to
skip the check in future:

| Claim | Verdict |
| --- | --- |
| Quad-enable bit: Winbond SR-2, Spansion CR bit 1, Micron has no QE bit | **Confirmed** |
| SFDP quad-enable requirement is in Basic Flash Parameter Table DWORD 15 | **Confirmed** — bits [22:20], JESD216B |
| `tRFC` by density: 1 Gb 110 ns, 2 Gb 160 ns, 4 Gb 260 ns, 8 Gb 350 ns | **Confirmed** (512 Mb is 90 ns) |
| `tREFI` 7.8 µs, halving to 3.9 µs above 85 °C | **Confirmed** |
| Speed grades `-125` = 1600 MT/s, `-107` = 1866 MT/s | **Confirmed** (11-11-11 and 13-13-13) |
| DDR3 x16 row address bits by density (A12/A13/A14) | **Confirmed by derivation** — 8 banks × 1,024 columns × rows |
| Vivado does not target CPLDs or Spartan-6; ISE 14.7 is the last release | **Confirmed** |
| RS-485: −7 V to +12 V common mode, 32 unit loads, 1 UL = 12 kΩ, 1/8 UL → 256 nodes | **Confirmed** |
| Endurance: EEPROM 10^6, FRAM 10^14-10^15, MRAM 10^16 | **Confirmed and corrected** — article 88 had understated MRAM |

**Two corrections were applied as a result**, both to article 88: MRAM endurance
raised to Everspin's specified 10^16, and an internal inconsistency fixed where
the `seoDesc` said 48-100%/0-29% differently from the body. **Cross-checking found
an internal inconsistency that no external source was needed to catch** — worth
remembering that the verification pass is also a re-read.

One measurement was also sharpened: Torex `XC6224` is not "270 of 318 codes" in
last-time buy, it is **270 of 270 — the entire family, 100%**, which is a stronger
statement than article 86 makes.

## Roadmap to 300+

84 written. The waves below enumerate 237 more, each with the pattern it uses and
the specific gap it fills. Order within a wave is by (information gain) ×
(inventory affected). **Measure the catalogue before writing each one.**

### Wave 2 — Comparisons across existing subjects (68 articles)

Both sides already have a single-subject article; the comparison does not exist.

| # | Title | Competing for | The gain |
| ---: | --- | --- | --- |
| 87 | Digital Potentiometer vs DAC vs PWM-and-filter for analogue trim | An adjustable voltage | Crossover on resolution, drift, cost; digipots are 58% inactive vs DAC 28% |
| 88 | Non-volatile logging: battery-backed SRAM vs EEPROM vs FRAM vs MRAM vs NOR flash | Retained data | Endurance-per-write arithmetic; FRAM/MRAM 14% inactive vs SRAM 54%, flash 57% |
| 89 | Comparator vs op-amp vs ADC threshold for level detection | A threshold decision | Propagation delay vs flexibility; when an op-amp as comparator is wrong |
| 90 | RS-485 vs CAN vs LVDS vs industrial Ethernet for a machine link | A cable between boards | Distance × nodes × determinism decision surface |
| 91 | LDO vs buck vs charge pump for a small rail | A derived voltage | Efficiency vs noise vs BOM crossover with worked numbers |
| 92 | Supervisor IC vs MCU brown-out detect vs discrete RC reset | Reliable reset | Where internal BOR is legitimately sufficient and where it is not |
| 93 | CPLD vs small FPGA vs 74-series logic vs GAL for glue logic | Board glue | `cplds` 66% inactive reframes the default answer |
| 94 | Integrated motor driver vs gate driver plus discrete FETs | Motor drive | Thermal and current crossover; second-source depth on each side |
| 95 | 555 timer vs RTC vs programmable oscillator vs MCU timer | Time | Accuracy-per-cost ladder and the retention question |
| 96 | Analog switch vs bus switch vs relay vs solid-state relay | Signal routing | On-resistance, isolation, and the ±15 V rail problem |
| 97 | Internal ADC reference vs external voltage reference | Conversion accuracy | Error-budget-in-LSBs framing from the reference article, generalised |
| 98 | FIFO IC vs dual-port SRAM vs FPGA block RAM for domain crossing | Rate matching | FIFOs 73% inactive makes the migration question urgent |
| 99 | Level shifter vs bus transceiver vs open-drain plus pull-up | Voltage translation | Direction control and the 5 V tolerance loss |
| 100 | Aftermarket manufacture vs die banking vs emulation vs redesign | Continuity of supply | Four continuity strategies, cost and risk compared |
| 101 | BGA reballing vs re-tinning vs replacement vs redesign | A solderability problem | Extends the reballing article into a decision surface |
| 102 | Discrete MCU plus FPGA vs SoC FPGA vs MCU with programmable logic | Mixed control and logic | Partitioning decision with availability per option |
| 103 | Flash vs EEPROM for configuration storage under power loss | Surviving a brownout | Write-atomicity and page-erase exposure |
| 104 | Crystal vs MEMS oscillator vs crystal oscillator module vs silicon clock | A frequency reference | Shock, aging, drift and lead-time compared |
| 105 | Optocoupler vs digital isolator vs transformer coupling | Galvanic isolation | Aging of the LED is the argument nobody makes |
| 106 | Hot-swap controller vs eFuse vs polyfuse vs discrete soft-start | Inrush and fault protection | 44% inactive on hot-swap changes the default |
| 107 | Watchdog: internal vs external vs windowed vs none | Recovering from a hang | Failure-mode coverage of each option |
| 108 | Linear vs switching pre-regulator ahead of an LDO | Low-noise rail | Two-stage arithmetic and thermal split |
| 109 | Buck-boost vs SEPIC vs boost-plus-LDO for a battery rail | Rail across battery range | Efficiency across discharge curve |
| 110 | Shunt vs Hall-effect vs current-sense-amplifier current measurement | Current measurement | Accuracy vs isolation vs bandwidth |
| 111 | Thermistor vs RTD vs digital temperature sensor vs diode | Temperature measurement | Calibration burden compared |
| 112 | Parallel NOR vs serial NOR vs NAND for code storage | Code storage | Boot latency and XIP capability |
| 113 | SPI vs QSPI vs BPI vs JTAG FPGA configuration | Getting a bitstream in | Configuration-time arithmetic against device availability |
| 114 | On-chip termination vs external series vs parallel termination | Signal integrity | When ODT is not enough |
| 115 | Isolated vs non-isolated CAN and RS-485 front ends | Field bus robustness | Ground-loop failure economics |
| 116 | Discrete logic vs microcontroller for a state machine | Simple sequencing | The 74-series census makes this a real choice again |
| 117 | Fixed vs adjustable vs sequenced multi-rail regulation | FPGA/SoC power | Rail-count management |
| 118 | Push-pull vs open-drain vs differential signalling for a short link | Board-to-board | Noise and speed crossover |
| 119 | Op-amp vs instrumentation amp vs difference amp | Differential measurement | The mis-categorisation the description fix uncovered |
| 120 | SAR vs delta-sigma vs pipeline vs flash ADC architecture | Conversion | Architecture-first framing; existing ADC article is sourcing-led |
| 121 | Voltage-mode vs current-mode vs hysteretic control | Converter control loop | Compensation burden compared |
| 122 | Trench vs planar vs SiC vs GaN switch selection | Power switching | Availability of each technology tier |
| 123 | Battery charger IC vs PMIC vs discrete charging | Battery management | Safety-consequence framing from the charger article |
| 124 | Rail-to-rail vs standard input/output op-amps | Signal range | Where rail-to-rail is a liability |
| 125 | Ceramic vs tantalum vs polymer vs electrolytic bulk capacitance | Bulk decoupling | Aging and ESR interaction (catalogue-light: cite, do not sell) |
| 126 | Single-ended vs differential clock distribution | Clock fanout | 55% inactive on clock buffers reframes it |
| 127 | Zero-delay buffer vs PLL vs jitter cleaner | Clock conditioning | Jitter budget arithmetic |
| 128 | Hardware vs software CRC vs ECC for memory integrity | Data integrity | Coverage vs cost |
| 129 | Internal flash vs external flash MCU architectures | Code and data | Second-source consequences of each |
| 130 | Ethernet PHY vs MAC-PHY vs switch for a two-port node | Networking | 45% inactive on interface controllers |
| 131 | USB bridge vs native USB MCU vs UART-only | Host connectivity | FTDI/SiLabs availability vs integration |
| 132 | Two x8 DRAM devices vs one x16 | Memory width | Footprint and migration consequences |
| 133 | Registered vs unbuffered vs on-board DRAM | Memory topology | Specialty logic 60% inactive is the hidden cost |
| 134 | Internal vs external FPGA configuration memory | Boot | Instant-on families vs external NOR |
| 135 | Reflow vs selective vs hand soldering for legacy parts | Assembly of old stock | Interacts with reballing and MSL |
| 136 | Full BOM scrub vs targeted vendor-lineage scrub | Finding lifecycle risk | Renesas 36% concentration makes targeted scrubbing rational |
| 137 | Buy-and-hold vs redesign-now vs dual-source-now | Responding to an EOL notice | Net-present-cost comparison |
| 138 | Authorised distributor vs aftermarket manufacturer vs broker vs OEM excess | Where to buy legacy | Extends the authorised-vs-independent article to four channels |
| 139 | AS6081 vs AS5553 vs AS6171 vs IDEA-STD-1010 inspection regimes | Counterfeit assurance | The standards are compared nowhere |
| 140 | X-ray vs decapsulation vs XRF vs electrical test for authentication | Detecting a fake | Cost per part vs confidence |
| 141 | Tape-and-reel vs tray vs tube vs bulk for long-term storage | Storing a last-time buy | MSL and reflow consequences |
| 142 | Nitrogen cabinet vs dry pack vs vacuum seal | Storage of stocked die | J-STD-033 arithmetic |
| 143 | Commercial vs industrial vs automotive vs military grade | Grade selection | What each grade actually changes, availability per grade |
| 144 | AEC-Q100 vs IEC 61508 vs DO-254 qualification burdens | Certification | Requalification cost on substitution |
| 145 | Second-source-at-design vs qualify-on-demand | Supply strategy | Cost of readiness vs cost of panic |
| 146 | Firmware abstraction vs hardware compatibility for substitutability | Designing for change | SFDP-style discovery generalised |
| 147 | One large FPGA vs two small FPGAs | Partitioning | Availability of large devices is worse |
| 148 | Soft-core vs hard-core processor in an FPGA | Embedded processing | Toolchain longevity differs sharply |
| 149 | Bitstream encryption vs authentication vs physical security | Design protection | Flash-based families' advantage |
| 150 | Vendor IP vs open-source IP vs in-house RTL | Building blocks | Fifteen-year maintainability |
| 151 | JTAG vs SWD vs in-system programming in production | Programming | Cycle time vs coverage |
| 152 | Boundary scan vs flying probe vs functional test | Test strategy | Coverage of BGA joints |
| 153 | Conformal coating vs potting vs sealed enclosure | Environmental protection | Repairability trade |
| 154 | Repair vs replace vs remanufacture for a field failure | Service strategy | Spares depth from the catalogue |

### Wave 3 — Perspective articles (58 articles)

The same subject, from a desk that has not been heard from. Working titles; each
must reach a conclusion the other desks would dispute.

| # | Subject already covered | New desk | Working title |
| ---: | --- | --- | --- |
| 155 | An EOL notice | Five desks in conflict | The Same EOL Notice From Five Desks |
| 156 | Obsolete FPGA | Firmware | Archiving a Toolchain You Will Need in 2041 |
| 157 | Obsolete FPGA | Manufacturing | Re-qualifying a Programming Step After a Device Change |
| 158 | Obsolete FPGA | Reliability | What Ten Years in a Warehouse Does to a Device |
| 159 | Counterfeit risk | Design | Designing So a Counterfeit Cannot Pass Your Test |
| 160 | Counterfeit risk | Manufacturing | Catching a Fake on the Line, Not at Goods-In |
| 161 | BGA reballing | Reliability | Joint Reliability After Rework, Quantified |
| 162 | Legacy DRAM | Firmware | Porting a Memory Controller to a New Vendor |
| 163 | LDO substitution | Reliability | Stability Margin After a "Drop-In" LDO Change |
| 164 | MCU migration | Firmware | The Peripheral Differences That Break a Port |
| 165 | MCU migration | Compliance | Requalifying a Certified Product After an MCU Change |
| 166 | Last-time buy | Programme / cost | The Net Present Cost of Buying Ten Years of Stock |
| 167 | Last-time buy | Reliability | Shelf Life as a Specification |
| 168 | Date codes | Design | When a Date Code Belongs in the Schematic |
| 169 | RTC selection | Field service | Servicing a Product Whose Clock Cannot Be Replaced |
| 170 | Power sequencing | Manufacturing | Sequencing Faults That Only Appear at Panel Level |
| 171 | Clock distribution | Reliability | Jitter Degradation Over Service Life |
| 172 | Analog switch obsolescence | Design | Designing an Analogue Path That Survives Process Migration |
| 173 | Op-amp substitution | Compliance | Substitutions That Invalidate a Safety Argument |
| 174 | FPGA configuration | Field service | Field-Updating a Product With No Second Image |
| 175 | Serial flash | Manufacturing | Programming Throughput and Its Hidden Failures |
| 176 | Memory obsolescence | Programme / cost | Budgeting for a Memory Generation Turnover |
| 177 | Interface transceivers | Field service | Diagnosing a Bus From the Cabinet Door |
| 178 | Level shifting | Design | Losing 5 V Tolerance and Not Noticing |
| 179 | Motor drivers | Reliability | Thermal Cycling in a Motor Drive Stage |
| 180 | Battery charging | Compliance | The Float-Voltage Substitution as a Safety Case |
| 181 | Offline switchers | Reliability | Creepage, Clearance and a 650 V Substitution |
| 182 | Voltage references | Design | An Error Budget That Survives Twenty Degrees |
| 183 | ADC selection | Firmware | Calibration Code That Outlives the Converter |
| 184 | Logic families | Manufacturing | Mixed-Family Boards and Their Test Escapes |
| 185 | 74-series | Field service | Repairing a Board Whose Logic Is 60% Gone |
| 186 | PCIe switches | Firmware | Enumeration Differences Between Switch Generations |
| 187 | Telecom LIU | Programme / cost | Supporting Carrier Equipment for Twenty-Five Years |
| 188 | Video decoders | Field service | Keeping an Analogue CCTV Estate Alive |
| 189 | SoC FPGA | Firmware | A Boot Chain Across Two Processors |
| 190 | DSP | Programme / cost | When Toolchain Archival Beats Redesign |
| 191 | Legacy MPU | Reliability | Running 1990s Silicon in a 2040 Product |
| 192 | Quality standards | Programme / cost | What an Inspection Regime Actually Costs Per Part |
| 193 | BOM scrubbing | Design | Scrubbing at Schematic Review, Not at Release |
| 194 | Distribution channels | Quality | What Each Channel Can and Cannot Evidence |
| 195 | Aftermarket parts | Design | Designing for Aftermarket Suffix Variation |
| 196 | Storage | Manufacturing | Baking, MSL and the Cost of Getting It Wrong |
| 197 | Grade selection | Programme / cost | Paying for Industrial Grade You Do Not Need |
| 198 | FPGA selection | Programme / cost | Cost Per Logic Cell Is the Wrong Metric |
| 199 | Config memory | Quality | Incoming Inspection for Programmed Devices |
| 200 | DDR interface | Manufacturing | Yield Loss From a Marginal Memory Interface |
| 201 | Supervisors | Field service | Nuisance Resets and How to Prove Their Cause |
| 202 | Gate drivers | Design | Dead Time as a Sourcing Constraint |
| 203 | Isolation | Compliance | Re-certifying After an Isolator Change |
| 204 | Comparators | Design | Hysteresis You Did Not Specify |
| 205 | Digital potentiometers | Reliability | Wiper Drift and End-of-Life Behaviour |
| 206 | LED drivers | Field service | Replacing a Driver in an Installed Luminaire |
| 207 | Hot swap | Reliability | Repeated Insertion and Contact Degradation |
| 208 | Specialty logic | Design | Designing Out an ECL Clock Tree |
| 209 | FRAM/MRAM | Programme / cost | Paying a Premium for Endurance You Can Prove |
| 210 | Interface controllers | Compliance | USB and Ethernet Certification After a Bridge Change |
| 211 | Programmable oscillators | Manufacturing | Factory-Programmed Parts and Their Ordering Trap |
| 212 | Whole catalogue | Quality | A Goods-In Procedure Written From 719,342 Parts |

### Wave 4 — Cross-domain interactions (38 articles)

Each quantifies an interaction. Titles state both variables.

| # | Interaction | Working title |
| ---: | --- | --- |
| 213 | Temperature × DRAM | Refresh Overhead Above 85 °C, Quantified |
| 214 | Temperature × flash | Retention Against Endurance at Temperature |
| 215 | Temperature × LDO | Dropout, Thermal Foldback and the Hot Corner |
| 216 | Temperature × crystals | Drift, Aging and the Frequency Budget |
| 217 | Temperature × op-amps | Offset Drift as an Error Budget Line |
| 218 | Temperature × batteries | Coin Cell Depletion in a Sealed Product |
| 219 | Time × RTC lithium cells | Why a Date Code Is Part of the Specification |
| 220 | Time × solderability | Storage Aging and Re-tinning Decisions |
| 221 | Time × electrolytics | Shelf Life of Stocked Assemblies |
| 222 | Humidity × packages | MSL, Baking and Popcorning |
| 223 | Humidity × storage | Dry Storage Arithmetic for a Ten-Year Buy |
| 224 | Vibration × BGA | Solder Joint Fatigue Under Field Vibration |
| 225 | Radiation × FPGA | Single-Event Upsets and Configuration Choice |
| 226 | Voltage × logic families | 5 V Tolerance Loss Across a Migration |
| 227 | Voltage × analogue switches | The ±15 V Rail Problem, Quantified |
| 228 | Package × obsolescence | Why DIP Is 48% Gone and QFN 23% |
| 229 | Package × thermal | Thermal Resistance and Substitution |
| 230 | Density × timing | How a Density Change Alters Memory Timing |
| 231 | Speed grade × availability | Buying Faster Than You Need |
| 232 | Grade × availability | Industrial Grade Is a Smaller Population |
| 233 | Acquisition history × lifecycle | Predicting EOL From Corporate Events |
| 234 | Process node × longevity | Why Newer Silicon Sometimes Dies First |
| 235 | Market position × longevity | Mid-Range Versus High-End, Measured |
| 236 | Volume × second sourcing | When Low Volume Makes You the Only Customer |
| 237 | Toolchain × silicon lifecycle | Which Expires First, and What to Do |
| 238 | Firmware × device revision | Silicon Errata Across a Substitution |
| 239 | Test coverage × obsolescence | Testing for a Part You Cannot Buy Again |
| 240 | Certification × substitution | The Change That Needs a New Certificate |
| 241 | Cost × lifecycle risk | The Cheapest Part With the Shortest Life |
| 242 | Lead time × design freeze | Designing Around a 52-Week Part |
| 243 | Counterfeit risk × scarcity | Fake Rates Rise With Price |
| 244 | Counterfeit risk × package | Which Packages Are Easiest to Fake |
| 245 | Reballing × MSL × date code | Three Interacting Constraints on Rework |
| 246 | Moisture × reflow × legacy parts | Assembling Twenty-Year-Old Stock |
| 247 | Refresh × bandwidth × temperature | A Memory Budget That Holds at 95 °C |
| 248 | Jitter × bit error rate | Clock Quality as a Link Budget |
| 249 | Power sequencing × configuration | Rails, Order and a Failed Boot |
| 250 | Decoupling × package inductance | Where the Loop Actually Closes |

### Wave 5 — Symptom-first diagnosis (32 articles)

Organised by observation, cutting across every domain that can produce it. Each
needs a discriminating test per candidate cause.

| # | Symptom | Working title |
| ---: | --- | --- |
| 251 | Board does not boot | A Systematic Diagnosis Across Power, Reset, Clock and Configuration |
| 252 | Boots intermittently | Marginal Timing and Supply Ramp Dependence |
| 253 | Works cold, fails hot | Finding the Temperature-Dependent Cause |
| 254 | Works hot, fails cold | The Less Common Direction, and Why |
| 255 | Works on bench, fails in production | Panel, Fixture and Programming Differences |
| 256 | Passed ICT, failed at customer | Test Escape Analysis |
| 257 | Fails after months in field | Aging, Retention and Wear-Out |
| 258 | Fails only in one enclosure | Thermal and EMC Coupling |
| 259 | Random resets | Discriminating Brown-Out, Watchdog and Noise |
| 260 | Memory corruption under load | Refresh, Timing and ECC Evidence |
| 261 | Configuration fails occasionally | Flash, Rails and CRC Evidence |
| 262 | Slow boot | Configuration Mode and Clock Rate |
| 263 | Bus errors on a long cable | Termination, Common Mode and Failsafe |
| 264 | Communication works one way | Direction Control and Level Shifting |
| 265 | Rail sags under load | Compensation, Current Limit and Layout |
| 266 | Rail oscillates | Output Capacitance and Stability Margin |
| 267 | Regulator runs hot | Thermal Path and the Wrong Substitution |
| 268 | Clock jitter out of specification | Source, Buffer and Supply Coupling |
| 269 | ADC readings noisy | Reference, Layout and Aliasing |
| 270 | ADC readings offset | Reference Accuracy and Input Bias |
| 271 | Motor stage overheats | Dead Time, Switching Loss and Drive Strength |
| 272 | Battery does not charge fully | Float Voltage and Termination Logic |
| 273 | Product fails EMC after a part change | Which Substitutions Move Emissions |
| 274 | Device draws excess quiescent current | Leakage, Protection Diodes and Unpowered Buses |
| 275 | Part marking looks wrong | A Discrimination Procedure |
| 276 | Parts arrived with mixed date codes | What It Means and When It Matters |
| 277 | Yield dropped after a lot change | Lot Traceability as a Diagnostic Tool |
| 278 | Programming fails on some units | Protection Bits and Register Defaults |
| 279 | Device reads back different data | Address Mode and Endianness |
| 280 | Solder joints fail on rework | Reballing, Alloy and Profile |
| 281 | Field returns show no fault found | Intermittent Cause Hunting |
| 282 | Two identical boards behave differently | Silicon Revision and Errata |

### Wave 6 — Decision context (29 articles)

The same choice under a different governing constraint. The constraint changes
the answer, which is the gain.

| # | Constraint | Working title |
| ---: | --- | --- |
| 283 | Lowest unit cost | Part Selection When Cost Governs, and What It Costs Later |
| 284 | Fifteen-year life | Selection When Longevity Governs |
| 285 | Automotive qualification | Selection Under AEC-Q |
| 286 | Functional safety | Selection Under IEC 61508 |
| 287 | Medical | Selection Under Design Control |
| 288 | Radiation environment | Selection for Upset Tolerance |
| 289 | Sealed / no service access | Selection When Nothing Can Be Replaced |
| 290 | Very low volume | Selection at 100 Units a Year |
| 291 | Very high volume | Selection at a Million Units |
| 292 | Existing certificate | Selection That Avoids Recertification |
| 293 | Legacy interface required | Selection Constrained by an Old Bus |
| 294 | Extreme temperature | Selection for −40 to +125 °C |
| 295 | Battery-powered | Selection Under a Microamp Budget |
| 296 | High EMC requirement | Selection for Emissions Headroom |
| 297 | Export-controlled product | Selection Under Supply Restrictions |
| 298 | Single-source acceptable | When One Source Is a Rational Choice |
| 299 | Rapid prototype to production | Selection That Survives the Transition |
| 300 | Repair-driven | Selection for a Product Already in the Field |
| 301 | Drop-in replacement mandated | Selection With No Layout Change Allowed |
| 302 | Firmware frozen | Selection With No Software Change Allowed |
| 303 | Contract manufacturer constraints | Selection Around an Assembler's Capability |
| 304 | Multi-region compliance | Selection Across Three Regulatory Regimes |
| 305 | Obsolescence already announced | Selection Under a Deadline |
| 306 | Counterfeit-exposed market | Selection for Verifiability |
| 307 | No test access | Selection for Testability |
| 308 | Long lead times | Selection Under Allocation |
| 309 | Second source mandatory | Selection Where Dual Source Is a Requirement |
| 310 | Toolchain must be open | Selection for Archivability |
| 311 | Mixed legacy and new | Selection for a Board Spanning Two Eras |

### Wave 7 — Recurring first-party data (12 per year, ongoing)

Monthly obsolescence watch plus quarterly deep measurements. The value compounds:
a series shows *direction*, which a single census cannot. Numbered from 312.

Quarterly themes: vendor-lineage tracking, package-level migration, category
turnover, last-time-buy window closure rates.

## Query-intent register

**Before writing any article, add its primary query intent here and confirm no
existing article owns it.** This is the anti-cannibalisation control. Recorded
per batch; see the per-wave tables above for the gap each article fills, and
`blog-content-plan.md` plus `blog-technical-content-plan.md` for the 84 already
written.

## Numbering convention

**Two different numbers, do not confuse them.**

- **Roadmap ID** — the number in the wave tables above. A stable topic identifier.
- **Draft file number** — the `NN-` prefix on the file in `docs/blog-drafts/`. This
  is the **publish queue position**: `scripts/publish-next-blog.mjs` sorts
  filenames numerically and releases the lowest-numbered unpublished draft.

File numbers are therefore assigned **sequentially in writing order**, regardless
of which wave the topic came from. Naming a file after its roadmap ID would leave
gaps that later insert new drafts ahead of already-queued ones and silently
reorder the publishing schedule.

## Batch C — written 2026-08-11

| File | Roadmap ID | Title | Pattern |
| ---: | ---: | --- | --- |
| 87 | 87 | Digital Potentiometer vs DAC vs PWM-and-Filter | Comparison |
| 88 | 88 | Non-Volatile Logging: Five Technologies Compared | Comparison |
| 89 | 251 | The Board Does Not Boot | Symptom-first |
| 90 | 155 | The Same EOL Notice From Five Desks | Perspective |

All four verified with 0 errors: 2,762-3,336 words, 7-8 FAQ entries, 15-27
headings each. 88 posts in the database, 21 published.

**Findings from Batch C worth carrying into later waves:**

- **The availability inversion is a repeatable article shape.** In the
  non-volatile memory comparison, the historically cheapest option
  (battery-backed SRAM, 48-100% inactive by family) is the one you can no longer
  buy, while the "expensive" options (FRAM 6-29%, MRAM 0%) are healthy. Look for
  this inversion in every comparison — it is usually there, and it is always
  information gain, because cost-ranked comparisons are what everyone else writes.
- **Lineage beats technology, and it is measurable at family level.** Microchip's
  own `24LC` EEPROM is 2% inactive; the Atmel-heritage `AT24C` is 68%. Same
  technology, same packages, 34× apart. This generalises to any commodity part
  from a vendor that has made acquisitions.
- **The ratio-versus-value distinction** (digipot vs DAC) is the template for
  comparison articles: find the *architectural* difference, not the specification
  difference, because the architectural one decides and nobody writes it down.
- **Symptom-first articles need a partitioning measurement**, not a list of
  causes. "Read the status pins first — it splits the problem four ways" is what
  makes the article usable; a ranked list of possible causes is a table of
  contents. Every article in Wave 5 needs its own equivalent first cut.
- **Perspective articles need an adjudication rule.** Five correct-but-conflicting
  views are only useful if the article says who wins and why. Ranking by
  irreversibility worked here and should generalise across Wave 3.

## Batch I — written 2026-08-11 (Wave 2)

| File | Roadmap ID | Title | Pattern |
| ---: | ---: | --- | --- |
| 99 | 96 (re-scoped) | Routing a Signal: Analog Switch vs Bus Switch vs Relay | Comparison |

2,930 words, 20 headings, 8 FAQ entries, 0 errors. Style: em dash 2.3, bolded
openers 0.5, tics 0, "and it is" 0. **97 posts in the corpus, 0 verifier errors.**

The article's core is four error terms that conflict with each other, with the
arithmetic for each. The one that carries it: charge injection is `ΔV = Q/C`, so
20 pC into a 100 pF hold capacitor is 200 mV — **2,621 LSB at 16 bits on a 5 V
reference** — and even a 1 pC ultra-low part still gives 131 LSB. That makes the hold
capacitor sized by charge injection rather than by droop, which is the opposite of
how it is usually taught.

Availability inside one functional category runs **0% (`TMUXxxxx`) to 87%
(`ISL43xx`)**, the same Intersil-inside-Renesas effect measured in hot-swap
controllers. The `±15 V` process story makes this the rare case where the design
hazard and the sourcing hazard are the same fact: the parts that tolerate
instrumentation rails are the ones being pruned, and a pin-compatible low-voltage
replacement is destroyed on power-up.

**Re-scoped on the depth check.** The planned four-way including solid-state relays
could not be written: `CPC17xx`, `LH15xx` and `ASSR` return zero parts, and the
`TS117`/`TS118` IXYS parts are telecom access switches rather than general SSRs.
Relays and SSRs are electromechanical, not ICs. The article says so plainly and
covers when a relay is genuinely correct without pretending to supply one — which is
better than quietly omitting the option a reader may need.

### Traps seven and eight, and a rule-ordering bug

- **`MAX349` matches `MAX3490`**, an RS-485 transceiver, alongside the `MAX349`
  multiplexer.
- **`MAX4066` matches `MAX40662`**, an amplifier, alongside the `MAX4066` switch.

Both caught by printing sample part numbers with their categories, which is now the
standing habit after any prefix census.

**A rule-ordering bug in the style script, found in this article's own output.** The
tic patterns were case-sensitive, so a sentence-initial "Stated plainly," was not
removed — and the sentence-splitting rule then cut it into the fragment "Stated
plainly." A tic that survives detection can be *damaged* by a later rule rather than
merely missed. Fixed: tic matching is now case-insensitive, and the corpus was
re-scanned with the corrected metric (no further instances). That is a seventh
measurement correction, and again the prose was not the problem the metric claimed.

## Batch H — written 2026-08-11 (Wave 2)

| File | Roadmap ID | Title | Pattern |
| ---: | ---: | --- | --- |
| 98 | 105 (re-scoped) | Optocoupler vs Digital Isolator for an Industrial Signal Path | Comparison |

2,770 words, 17 headings, 8 FAQ entries, 0 errors. Style: em dash 0.9, bolded
openers 0.4, tics 0, "and it is" 0.

**The finding contradicts the industry narrative, which is what makes it worth
publishing.** Every vendor white paper frames this as "digital isolators replace
optocouplers", so the inference everyone draws is that optocouplers are dying.
Measured, that is false:

| Family | Technology | Codes | Inactive |
| --- | --- | ---: | ---: |
| `AMC13x` | CMOS isolated amp | 74 | **0%** |
| `ADuM` | CMOS digital isolator | 65 | 2% |
| `ACPL-` | **Optocoupler**, current | 57 | **4%** |
| `HCPL-` | Optocoupler, legacy | 78 | 36% |
| `TLP` | Optocoupler | 27 | 37% |
| **`Si82xx`** | **CMOS isolated driver** | 24 | **75%** |

A current optocoupler range at 4% is far healthier than a CMOS isolator family at
75%. **Generation and vendor commitment predict availability; technology does not.**
The article separates the two questions explicitly — the wear-out mechanism (LED
light output falls, CTR falls with it, and forward current trades CMTI against LED
life) is a design-life argument, and availability is a separate measurement.

Sourced externally per the rule: TI SLLA526, the Skyworks/Silicon Labs isolator
white paper, ADI's digital-isolator article, the CTR-ageing literature, and
IEC 60747-5-5 for the safety ratings that dominate a certified substitution.

### Sixth prefix trap, caught before publication

**`EL817` is not the Everlight optocoupler here.** It matches 59 Intersil/Elantec
`EL817x` **operational amplifiers**, filed under op-amps. The previous batch note had
recorded "EL817 97% inactive" as optocoupler evidence; that figure describes an
amplifier family and has been removed. Running list of traps: MachXO2 versus MachXO,
`XCF` versus ColdFire, Cypress synchronous versus dual-port SRAM, `M25P` versus IBM
PowerPC, `AP22` load switches versus `AP2204` LDOs, and now `EL817`.

**Every one of these was caught by looking at sample part numbers and their
categories rather than trusting the count.** The habit that finds them: after any
prefix census, print two or three actual part numbers with their category and read
them.

## Batch G — written 2026-08-11 (Wave 2)

| File | Roadmap ID | Title | Pattern |
| ---: | ---: | --- | --- |
| 97 | 106 | Hot-Swap Controller vs eFuse vs Discrete Soft-Start | Comparison |

3,356 words, 19 headings, 8 FAQ entries, 0 errors. Style: em dash 0.8, bolded
openers 0.4, tics 0, "and it is" 0.

The information-gain angle is an identity rather than a table: **for a
current-limited charge the FET absorbs `½CV²` regardless of the current limit, so
turning the limit down only spreads the same energy over a longer time.** Because
SOA is roughly constant-energy at short durations and constant-power at long ones,
a gentler limit can be *less* safe. No vendor guide frames it that way; each is
selling one of the three options.

Also reused the "fault response is an ordering-code digit" finding from cluster 10
with a confirmed example: `LM5069-1` latches off, `LM5069-2` auto-retries, same
part otherwise.

**The strongest availability finding yet on vendor lineage.** Within
`hot-swap-controllers`, one category and one function: Linear Technology 610 codes
at **10%** inactive against Intersil 383 at **85%** and Microchip 199 at 83% — an
8.5× spread. Linear's range sits inside Analog Devices and is maintained; Intersil's
sits inside Renesas and is being pruned. Meanwhile the TI eFuse families
(`TPS259x`, `TPS255x`, `TPS26xx`, `TPS16xx`) are **0% inactive across 220 codes**.
And `LTC4238` has all twelve of its codes in a last-time-buy window.

### A topic re-scoped by the depth check, and a fifth prefix trap

**The planned optocoupler-versus-digital-isolator comparison (roadmap 105) cannot be
written as scoped.** The catalogue holds essentially no jellybean optocouplers:
`4N25`, `4N35`, `PC827`, `TLP18x`, `MOC30xx` and `SFH61x` all return **zero** parts,
and `PC817` returns one. What we do hold is the isolation *ICs* — `HCPL` 79 codes at
35% inactive, `ACPL` 57 at 4%, `ADuM` 65 at 2%, `AMC13x` 74 at 0%, `ISO12x` 25 at
4%. Writing the generic comparison would pull design traffic toward a part class we
cannot quote, which is the Passives mistake again.

**Re-scope to "isolated signal paths in industrial and power designs": isolated gate
drivers, isolated amplifiers and digital isolators, with LED aging and CTR drift as
the migration driver from `HCPL` to `ACPL`/`ADuM`.** That version is backed by ~300
catalogue parts and has a genuine first-party angle in the 35% versus 2-4% split.

Fifth prefix trap for the list: **`AP22` mixes Diodes load switches with `AP2204` and
`AP2210` linear regulators**, so any rate quoted on that prefix describes neither.
Joins MachXO2/MachXO, `XCF` versus ColdFire, Cypress synchronous versus dual-port
SRAM, and `M25P` versus IBM PowerPC.

## Batch F — written 2026-08-11 (Wave 2, first article written to the new limits)

| File | Roadmap ID | Title | Pattern |
| ---: | ---: | --- | --- |
| 96 | 91 | LDO vs Buck vs Charge Pump for a Small Rail | Comparison |

3,018 words, 18 headings, 8 FAQ entries, 0 verifier errors. Style: em dash 1.4,
bolded openers 0.5, tics 0, "and it is" 0.

**Run the style script even when writing to the limits deliberately.** This article
was written with the house style in mind and still offered seven substitutions on
the first check: three consecutive bolded declaratives introducing a list of
cautions, plus two `, and it is` constructions. The habit is stronger than the
intention, so the check is not optional. Two of the script's outputs were then hand
polished, because "It helps. It is bounded." is worse prose than "It helps, within
limits" — the script gets the marker down, and a human still has to read the result.

The information-gain angle: **the thermal ceiling, not efficiency, is what decides
between the three topologies**, and it is computable. A SOT-23-5 LDO dropping 5 V to
3.3 V is a 235 mA part at 25 °C and a 94 mA part at 85 °C, so the same design passes
on the bench and thermally shuts down in the enclosure. That connects the topology
choice to the symptom-first diagnosis article, and no vendor selection guide frames
it this way because each vendor is selling one of the three.

Externally sourced per the rule above: TI SLVAEB1 (package thermal resistance),
SPVA023 (negative-rail charge pumps), SLPY005 (charge-pump trade-offs), the LM27762
datasheet, and JEDEC JESD51 for what a datasheet θJA is actually measured against.

## Batch D — written 2026-08-11 (Wave 2)

| File | Roadmap ID | Title | Pattern |
| ---: | ---: | --- | --- |
| 91 | 89 | Comparator vs Op-Amp vs ADC Threshold | Comparison |
| 92 | 90 | RS-485 vs CAN vs LVDS vs Industrial Ethernet | Comparison |
| 93 | 93 | Glue Logic: CPLD vs Small FPGA vs 74-Series vs GAL | Comparison |

Verified 0 errors: 2,639-2,990 words, 8 FAQ entries each, 19-20 headings.
91 posts in the database, 21 published.

**Findings from Batch D:**

- **Standard longevity and part longevity are different questions, and the answer
  inverts the usual assumption.** `MAX485` is 47% inactive and `TJA1050` 80%, while
  Ethernet PHYs (`DP83848`, `KSZ8081`, `LAN8720`) measure **0%**. "Use an old simple
  interface because it will still be available" is true of RS-485 the standard and
  false of the RS-485 part on the legacy schematic. **This is a reusable article
  shape**: separate the standard from the silicon and measure both.
- **Availability can be excellent while the toolchain is dead, and that decides.**
  CoolRunner-II (`XC2C`) is 12% inactive against `EPM3` at 98% — the only healthy
  CPLD family — and it is still the wrong choice for a new design because ISE is
  discontinued and Vivado does not target CPLDs. Same inversion as Spartan-6 in
  article 85. **Always check the toolchain axis on a family that measures well.**
- **The acquired-line rule from Batch C runs both directions, and the honest
  finding is that it is not predictable.** In EEPROM, Microchip kept its own `24LC`
  (2%) and pruned Atmel's `AT24C` (68%). In PLDs, Lattice's originator `GAL22V10`
  is 92% inactive while Microchip's Atmel-heritage `ATF22V10C` codes are **active**.
  Do not generalise the direction from corporate history — measure the family, and
  then measure the ordering code, because active codes exist inside pruned families
  (`ATF22V10` as a family is 72% inactive).
- **Commodity analogue outlives specialty analogue.** Comparators: `LM339` 14% and
  `LM2903` 13% against `MAX944` **64%**, `MAX999` 38%, `ADCMP` 36%. The intuition
  that old jellybean parts are the risky ones is backwards — small specialised
  ordering-code populations prune hardest. Expect this in every analogue comparison.
- **Population size governs whether a rate means anything.** `PALCE` reads 2%
  inactive across 41 part numbers and supports no conclusion. State the population
  next to every rate, and say so when it is too small.
- **The forgotten option is often the healthiest.** Single-gate logic
  (`SN74AUP1G`, 6% inactive) beats every programmable part in the glue-logic
  comparison on availability, static current, cost and area. Comparison articles
  should always ask what the reader has not considered, not just adjudicate the
  two options they named.
