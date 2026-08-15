---
title: "Sourcing Logic Gates and Inverters: Schmitt, Unbuffered and the Oscillator That Stops"
slug: "gates-inverters-sourcing-guide"
status: "draft"
seoTitle: "Logic Gate and Inverter Sourcing: Schmitt vs Plain, Buffered vs Unbuffered"
seoDesc: "15,167 gate and inverter part numbers, 27% inactive. Why a buffered inverter kills a crystal oscillator, when Schmitt inputs are mandatory, and how to use single-gate parts as a rescue."
seoKeywords: "logic gate sourcing, inverter replacement, 74HCU04 unbuffered, SN74LVC1GU04, Schmitt trigger inverter, CD40106, 74HC14, single gate logic SOT-23, obsolete logic gate"
tags: "logic gates, inverters, Schmitt trigger, unbuffered, single gate, crystal oscillator, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "SN74LVC1GU04DBVT, CD40106BPWR, 74LCX14M, SN74AHC86DBR, SN74ALVC08DGVR, MM74C00M, MC74VHC08MELG, 74VHC00N"
---

# Sourcing Logic Gates and Inverters: Schmitt, Unbuffered and the Oscillator That Stops

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: buffered vs unbuffered, Schmitt inputs, drive, single-gate packages, 4000-series, sourcing

---

**Two properties of a logic gate never appear in the function number, and both of them stop circuits dead: whether the input has a Schmitt trigger, and whether the output stage is buffered.** A `74HC04` and a `74HCU04` are both hex inverters with the same pinout. Fit the buffered one into a crystal oscillator and the oscillator either fails to start or runs on an overtone. Fit a plain `74HC04` where a `74HC14` Schmitt inverter was and a slow input edge produces a burst of output transitions. Our [gates and inverters category](/category/gates-inverters) holds **15,167 part numbers with 4,157 no longer active (27%)**, and these two distinctions cause more failed substitutions in it than supply voltage does.


<img src="/uploads/blog/gates-inverters-sourcing-guide.webp" alt="Simple logic gate inverter IC placed next to a crystal oscillator circuit" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Unbuffered (`U`) gates are single-stage inverters used as linear amplifiers** in crystal oscillators. A buffered replacement has too much gain and phase shift, and the oscillator misbehaves.
- **Schmitt-trigger inputs are a function property**: `14`, `132`, `4093`, `40106`. Substituting a plain gate loses hysteresis and produces multiple transitions.
- **Single-gate `G` parts in SOT-23 and SC-70 are the practical rescue** when a 14-pin package is discontinued.
- **The 4000 series exists for supply range**, 3-18 V. Nothing in the `HC`/`AHC`/`LVC` families replaces a 12 V or 15 V 4000-series gate.
- **`74AHC` at 13% inactive is the healthiest home for a dead `74HC` function**, with the same thresholds and footprints.
- **ECL gates live in this category too** (`MC10EP01MNR4G`) and are a different discipline requiring termination.
- **Unused inputs must be tied**, and a substitution that changes gate count leaves inputs floating.

---

## Buffered versus unbuffered: the oscillator problem

An unbuffered gate has one inverting stage; a buffered gate has two or three in series. For digital switching the difference is invisible. For analogue use it is everything.

A Pierce crystal oscillator uses an inverter as a high-gain linear amplifier, biased into its transition region by a feedback resistor, with the crystal and two capacitors providing 180° of additional phase shift. The circuit needs:

- **Moderate gain** — enough to sustain oscillation, not so much that it saturates.
- **Predictable, single-stage phase shift.**
- **Stability when biased in the linear region.**

A buffered inverter has the gain of two or three cascaded stages. In the linear region that is enormous, and the extra stages add their own delay. The result is one of three symptoms, all of them intermittent enough to be blamed on the crystal:

| Symptom | Cause |
| --- | --- |
| Oscillator does not start | Excess phase shift; loop condition not met |
| Runs at an overtone, not the fundamental | High gain at the third overtone where the network still meets the phase condition |
| Starts only sometimes, or only when warm | Marginal loop gain with temperature |

The letter to look for is `U` immediately before the function number: `74HCU04`, and in single-gate form `SN74LVC1GU04DBVT`, which is active in our catalogue and is the modern answer for exactly this socket. Note the field order: `1G` (one gate) then `U` (unbuffered) then `04` (inverter).

Where the original is a `U` part, a non-`U` replacement is not a substitution. Where the original is buffered and someone offers you a `U` part, that is equally wrong in the other direction: an unbuffered gate driving a digital load has weaker drive and worse noise margin.

## Schmitt-trigger inputs

A Schmitt input has two thresholds, and the gap between them is what keeps a slow or noisy edge from producing multiple transitions. It is identified by the function number, not the family:

| Function | Device |
| --- | --- |
| `14` | Hex inverter with Schmitt inputs — `74HC14D,652`, `74LCX14M` |
| `132` | Quad 2-input NAND with Schmitt inputs |
| `4093` | Quad 2-input NAND Schmitt (4000 series) |
| `40106` | Hex inverting Schmitt — `CD40106BPWR` |
| `18`/`19` in some families | Schmitt buffers |

Where hysteresis is mandatory:

- **RC delay and power-on-reset circuits**, where the input crosses the threshold over milliseconds.
- **Switch and contact inputs**, where bounce and slow rise are guaranteed.
- **Long cable runs** picking up noise.
- **Any input driven from an open-collector output with a large pull-up**, because the rising edge is an RC exponential: the arithmetic is in [comparator selection](/blog/comparator-selection-guide).

A plain CMOS input driven slowly does two bad things: it produces multiple output transitions as noise takes the input back and forth across the single threshold, and it sits in the linear region drawing supply current through both output transistors. **Both effects are absent from a functional test with a fast signal generator**, which is why this substitution error escapes to production.

`74HC14D,652` is obsolete in our catalogue and `74LCX14M` — the 3.3 V `LCX` version — is also obsolete, `LCX` running 59% inactive as a family. `CD40106BPWR` is active. **For a 5 V Schmitt inverter the live paths are the `HC`/`AHC` families or the 4000-series `40106`**, and they differ in threshold placement, so the RC values around them may need review.

## Drive current, and what the old part was doing

Gate drive matters in three places, and only the third is obvious.

1. **Static loads** — pull-ups, LEDs, resistive dividers.
2. **Capacitive loads** — long tracks, multiple inputs, cable capacitance. Drive determines edge rate, and edge rate determines whether the receiving Schmitt threshold is crossed cleanly.
3. **Termination networks**, where the gate is expected to source or sink into a resistor to a rail.

Family drive ranges from about 1 mA (4000 series) through 4 mA (`HC`), 8 mA (`AHC`, `LS`), 24 mA (`AC`, `LVC`) to 64 mA on bus-interface families. **Replacing a 24 mA part with a 4 mA part into a terminated line does not produce a slower circuit; it produces one that never reaches a valid level.**

Worked, for a gate driving a 3.3 V line terminated with 220 Ω to ground:

```
required sink current = 3.3 V / 220 Ω = 15 mA
HC family (4 mA)      → cannot hold a valid low
LVC family (24 mA)    → adequate
```

## The 4000 series is about supply range

The 4000 series is not "old 74HC". It exists because it runs from 3 V to 18 V, and no modern high-speed CMOS family does.

| | CD4000 | 74HC |
| --- | --- | --- |
| Supply | 3-18 V | 2-6 V |
| Propagation delay at 5 V | ~90-150 ns | ~10-20 ns |
| Output drive | ~1 mA | 4 mA |
| Noise immunity | Very high (thresholds scale with V_DD) | High |
| Input protection | Robust | Standard |

We hold 1,464 `CD4xxx` parts with 414 inactive (28%), 507 `MC14xxx` and 283 `HEF4xxx`. Two sourcing notes:

A 12 V or 15 V 4000-series gate has no `HC` equivalent. If the original supply is above 6 V, the replacement must be another 4000-series part, a discrete solution, or a redesign that adds a level-shifted low-voltage rail. `MM74C00M` (the 74C family, 3-15 V) is active in our catalogue and is a useful bridge here, since it shares the 74-series function numbering with 4000-series supply range.

Renesas 4000-series parts are going last-time-buy. `CD4081BHNSR`, `CD4081BKNSR` and `CD4081BDNSR` are all in that state here. The TI-branded `CD4xxx` line remains broadly active.

## Single-gate packages as the rescue path

When the multi-gate package is dead, the modern answer is one gate per package.

| Series | Vendor lineage | Typical package |
| --- | --- | --- |
| `SN74LVC1G`, `SN74AHC1G`, `SN74LVC2G` | TI | SOT-23-5, SC-70, SON |
| `NC7S`, `NC7SV`, `NC7SZ` | Fairchild → onsemi | SC-70, SOT-353 |
| `74LVC1G`, `74AUP1G` | Nexperia | SC-70, X2SON |
| `MC74VHC1G` | onsemi | SOT-23-5 |

Our catalogue holds 339 `NC7S`-prefixed parts (77 inactive) and 786 `SN74LVC` parts (143 inactive) in this category. `74LVC2G08GN,115` and `SN74ALVC08DGVR` are active.

The trade-offs are real and worth stating to whoever approves the change:

- Six inverters become up to six packages, each needing its own decoupling capacitor.
- The board revision is unavoidable unless the rework is a flying-lead repair.
- Pin assignments differ between vendors' single-gate packages: the `NC7SZ` and `SN74LVC1G` pinouts are not identical in every function.
- On the positive side, these are current-production families: `AUP` runs 9% inactive and `AHC` 13%, so the fix has a future.

## ECL and specialty parts in the same category

Not everything filed under gates is CMOS. `MC10EP01MNR4G` is an ECL/PECL gate, and it belongs to a different design discipline entirely: differential signalling, termination to a defined voltage, and a DC path to ground on the outputs. Substituting a CMOS gate for it is not a levels problem, it is a topology problem; the termination requirements are covered in [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide).

The practical filter: **if the part number contains `10E`, `100E`, `EL` or `EP` and the supply is negative or the outputs are paired, stop and read the datasheet before treating it as logic.**

## Unused inputs, and the substitution that changes gate count

Every unused CMOS input must be tied to a rail, and a substitution that changes the package can create floating inputs nobody notices.

If a quad NAND had one gate unused with its inputs tied to V_CC, and the replacement is a triple-gate part plus a single-gate part, the tie may be omitted in the rework. A floating CMOS input drifts to the threshold, oscillates, and draws current through both output transistors — typically milliamps of unexplained supply current and intermittent noise on neighbouring signals.

This is also a good reason to check the original schematic during a substitution: **unused-input ties are the first thing lost in a rework.**

## Sourcing notes

27% of the category is inactive, and Rochester Electronics is the largest single supplier at 5,995 part numbers, followed by Texas Instruments (3,871), onsemi (2,318) and Nexperia (1,298).

Family-level rates measured across our logic categories put the risk clearly: `74VCX` 74% inactive, `74BCT` 73%, `74ABT` 62%, `74VHC` 51%, against `74AUP` 9%, `74AHC` 13% and `74LVC` 21%. The full table is in [decoding a 74-series part number](/blog/74-series-logic-decode-guide).

Currently obsolete but available through the authorised aftermarket here: `74VHC00N`, `74VCX86MTC`, `MC74VHC08MELG`, `74HCT2G02GD,125`, `74LVC2G04GF,132`, `74ABT08D,112`. In last-time buy: `74HC86FP-E` and the Renesas `CD4081B` variants.

For incoming inspection, logic is cheap enough that counterfeits are usually remarked lower-grade or wrong-family parts rather than empty packages. **Test the property the marking claims**: measure input threshold to distinguish `HC` from `HCT`, check for hysteresis to confirm a Schmitt part, and verify propagation delay against the family. Package-level inspection follows [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Buffered vs unbuffered (`U`) | Crystal oscillator fails or runs on an overtone |
| 2 | Schmitt input present (`14`, `132`, `4093`, `40106`) | Multiple transitions on slow edges |
| 3 | Supply range, especially above 6 V | Out of specification or destroyed |
| 4 | Input threshold type (CMOS vs TTL) | Intermittent threshold violation |
| 5 | Output drive against the real load | Never reaches a valid level |
| 6 | Edge rate against board layout | Ground bounce, false triggering |
| 7 | Gate count and unused-input ties | Floating inputs, supply current, noise |
| 8 | Single-gate pinout per vendor | Wrong connections after rework |
| 9 | 5 V tolerance if mixing domains | Input damage |
| 10 | ECL vs CMOS (`10E`, `EP`, `EL` prefixes) | Missing termination, no output |

## FAQ

### What does the U in 74HCU04 mean?

Unbuffered: the gate has a single inverting stage instead of the two or three cascaded stages of a normal buffered gate. It exists because an inverter used as the amplifier in a Pierce crystal oscillator must behave as a moderate-gain linear amplifier with predictable phase shift. A buffered inverter in that socket has far too much gain and extra delay, so the oscillator may fail to start, start only when warm, or run on the third overtone instead of the fundamental. For single-gate form, look for `1GU04` in the part number.

### Can I replace a 74HC14 with a 74HC04?

No. The `14` has Schmitt-trigger inputs with separate rising and falling thresholds; the `04` has a single threshold. Any input that crosses slowly — an RC power-on reset, a switch contact, a long cable, an open-collector line with a large pull-up — will produce multiple output transitions with the `04` fitted, and the input will also sit in the linear region drawing supply current through both output transistors. The failure does not appear in a bench test driven by a signal generator.

### How do I know whether a logic input has hysteresis?

From the function number rather than the family. The common Schmitt functions are `14` (hex inverter), `132` (quad NAND), `4093` (quad NAND in the 4000 series) and `40106` (hex inverting Schmitt); some families also offer Schmitt buffers at `18` or `19`. The family letters (`HC`, `AHC`, `LVC`) never indicate hysteresis. If the datasheet gives V_T+ and V_T− as separate parameters, the part is a Schmitt device.

### Are 4000-series and 74HC gates interchangeable?

Only if the supply is between 2 V and 6 V and the load is light. The 4000 series exists to run from 3 V to 18 V, which no high-speed CMOS family does, so a 12 V or 15 V design cannot use `HC` at all. The 4000 series is also five to ten times slower and drives roughly a milliamp against `HC`'s four milliamps. Where a 4000-series part genuinely runs at 5 V with a light load, the corresponding `74HC` function usually works, but the numbering does not map one-to-one.

### What is the best replacement for an obsolete 74HC gate?

Usually the `74AHC` equivalent of the same function. It shares the CMOS input thresholds, the footprints and the function numbering, runs roughly three times faster and drives 8 mA instead of 4 mA, and in our catalogue `74AHC` is only 13% inactive against 30% for `74HC`. Check the faster edges against the board layout before committing — if the design is old and lightly decoupled, the speed increase is not free.

### Can I use single-gate SOT-23 parts to replace a dead 14-pin package?

Yes, and for a legacy repair it is frequently the only path to current-production silicon. The cost is a board revision or flying-lead rework, one decoupling capacitor per package, and careful checking of pinouts, which differ between vendors' single-gate ranges. The benefit is that `74AUP` and `74AHC` single-gate families are among the healthiest in the catalogue at 9% and 13% inactive, so the repair is not immediately obsolete again.

### Why does my board draw extra current after a logic substitution?

Most often a floating CMOS input. Every unused input must be tied to a rail; if the substitution changed the gate count or the package, the tie is easily lost in the rework. A floating input drifts to the switching threshold, where both output transistors conduct simultaneously, drawing milliamps and often oscillating, which couples noise into neighbouring signals. Check every unused pin against the original schematic.

### Which gate families should I avoid designing in today?

The 1990s "advanced" middle families. In our catalogue `74VCX` runs 74% inactive, `74BCT` 73%, `74ABT` 62%, `74VHCT` 61%, `74LCX` and `74LVT` 59%, and `74VHC` 51%. They sat between the families that survived and were squeezed out from both sides. For new work the low-risk choices are `74AUP` (9% inactive), `74AHC`/`74AHCT` (13-15%) and `74LVC` (21%), plus the 4000 series where supply range demands it.

## Related reading

Start with [decoding a 74-series part number](/blog/74-series-logic-decode-guide) for the family census and lifecycle table, and [logic family selection](/blog/logic-family-selection-guide) for choosing a family in the first place. Sibling function guides: [flip-flops, latches and registers](/blog/flip-flop-latch-register-sourcing-guide), [decoders, multiplexers and bus switches](/blog/decoder-mux-bus-switch-sourcing-guide), [counters, dividers and shift registers](/blog/counter-shift-register-sourcing-guide).

Related domains: [comparator selection](/blog/comparator-selection-guide) for the RC-edge arithmetic behind Schmitt requirements, [clock generators and PLLs](/blog/clock-generator-pll-sourcing) where the oscillator is a product rather than a discrete circuit, and [level shifter selection](/blog/level-shifter-selection-guide) for mixed-voltage domains.

Send us the part number and tell us whether it sits in an oscillator or on a slow input, and we will filter for the `U` and Schmitt variants rather than just the function.

[**Submit an RFQ**](/rfq) | [**Browse gates and inverters**](/category/gates-inverters) | [**Upload a BOM**](/bom)
