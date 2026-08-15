---
title: "Decoding a 74-Series Part Number: Family, Function, Package and Which Families Are Dying"
slug: "74-series-logic-decode-guide"
status: "draft"
seoTitle: "74-Series Logic Part Number Decode and Family Obsolescence Rates"
seoDesc: "How to read SN74AHCT574PWR field by field, what each logic family actually changes, and measured obsolescence rates for 28 families across 39,165 catalogue parts."
seoKeywords: "74 series part number decode, logic family comparison, HC vs HCT, 74AC vs 74LS, 74LVC 5V tolerant, 74ABT obsolete, logic family obsolescence, SN74 prefix meaning, 4000 series vs 74HC"
tags: "74 series, logic families, part number decode, HC, HCT, AHC, LVC, obsolescence, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "Interface & Logic Sourcing"
relatedProducts: "SN74AHC86DBR, SN74LVC1GU04DBVT, CD40106BPWR, SN74ALVC08DGVR, 74VCX00MTC, MM74C00M, 74LCX14M, MC10EP01MNR4G"
---

# Decoding a 74-Series Part Number: Family, Function, Package and Which Families Are Dying

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: part-number fields, family selection, thresholds, drive, 5 V tolerance, measured obsolescence

---

**In a 74-series part number, the two or three letters between "74" and the function number are the only field that changes the electrical behaviour, and they are the field engineers most often treat as noise.** `SN74HCT574PWR` and `SN74AHC574PWR` differ by one letter, share a footprint and a truth table, and have different input thresholds, different drive current, different edge rates and (in our catalogue) obsolescence rates of 31% and 13% respectively. We hold **39,165 logic part numbers across seven categories, 13,430 of them no longer active (34%)**, and the inactive ones cluster by family in a pattern that is worth knowing before you specify a replacement.


<img src="/uploads/blog/74-series-logic-decode-guide.webp" alt="Classic 74-series logic chip in a SOIC package on an industrial PCB" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **The family letters decide thresholds, drive, speed and supply range.** The function number decides only the truth table.
- **`HC` and `HCT` are not interchangeable.** `HCT` has TTL-compatible input thresholds; `HC` does not, and a TTL driver at 2.4 V may not reach an `HC` input's threshold.
- **Obsolescence is family-specific and spans 9% to 74%** in our catalogue. `AUP` is 9% and `AHC` 13%; `BCT` is 73% and `VCX` 74%.
- **`74LS` is healthier than several 1990s CMOS families** at 21% inactive, because it never stopped being ordered.
- **4000-series and 74HC are not substitutes**: the 4000 series runs to 18 V, the `HC` family stops at 6 V.
- **A faster replacement is a design change.** `AC`-class edge rates on a board laid out for `LS` produce ground bounce and reflections that did not exist before.
- **Single-gate (`G`) parts are the modern rescue path** for a dead multi-gate package, at the cost of board rework.

---

## The five fields, read left to right

Take `SN74AHCT574PWR` apart:

| Field | Value | Meaning |
| --- | --- | --- |
| Vendor prefix | `SN` | Texas Instruments. Others: `MC`/`MC74` onsemi, `CD` (TI, ex-RCA), `HEF` Nexperia, `CY74` Cypress, `MM74` (TI, ex-National), `74` bare with a vendor suffix |
| Series | `74` | Commercial/industrial temperature. `54` is the military range of the same function |
| **Family** | **`AHCT`** | Advanced High-speed CMOS with TTL-compatible inputs |
| Function | `574` | Octal D-type flip-flop, 3-state, flow-through pinout |
| Package + shipping | `PWR` | TSSOP, tape and reel |

Two traps live in this string.

The family and the function are separate purchases. A `574` exists in `HC`, `HCT`, `AHC`, `AHCT`, `AC`, `ACT`, `LVC`, `LVT`, `ALVC`, `ABT`, `F`, `FCT`, `VHC` and `LCX`. They all latch eight bits. They do not all work in your circuit.

The suffix letters are vendor-specific and they include the temperature range. A `74HC00D` and a `74HC00N` differ only in package; `74HC00D-Q100` adds automotive qualification. In our catalogue `74HCT574PW-Q100,11` is the Nexperia automotive part and `SN74AHC86DBR` is a TI SOT-23-class device: the same field position means different things per vendor, so the package code is not portable across manufacturers.

## What each family actually changes

Five parameters distinguish the families, and only the first two cause outright failure.

| Family | Supply | Input thresholds | Drive (typ) | Notes |
| --- | --- | --- | --- | --- |
| **4000 / CD4000** | 3-18 V | CMOS, ratio of V_DD | ~1 mA | Slow, huge supply range, high noise immunity |
| **HC** | 2-6 V | CMOS (≈0.5 × V_CC) | 4 mA | The default CMOS workhorse |
| **HCT** | 4.5-5.5 V | **TTL** (≈1.4 V) | 4 mA | For driving from TTL/LS outputs |
| **AHC / AHCT** | 2-5.5 V | CMOS / TTL | 8 mA | ~3× faster than HC, same footprints |
| **LS** | 4.75-5.25 V | TTL | 8 mA sink | Bipolar, always sinks current |
| **ALS / AS / F** | 5 V | TTL | 20-64 mA | Fast bipolar, high power |
| **AC / ACT** | 2-6 V | CMOS / TTL | 24 mA | **Very fast edges** — ground bounce |
| **ABT / BCT / LVT** | 5 V / 3.3 V | TTL | 32-64 mA | BiCMOS bus interface, bus hold |
| **LVC / ALVC** | 1.65-3.6 V | CMOS | 24 mA | 3.3 V standard, inputs usually 5 V tolerant |
| **AUC / AUP** | 0.8-2.7 V | CMOS | 4-9 mA | Sub-2 V, low power, newest |
| **VHC / VHCT / LCX / VCX** | 2-5.5 V / 3.3 V | Mixed | 8-24 mA | 1990s "advanced" families, mostly consolidated away |

The `HC` versus `HCT` distinction is the classic field failure. At a 5 V supply an `HC` input needs roughly 3.15 V to register a high. An `LS` output guarantees only 2.4 V. Fit `74HC00` where `74HCT00` was and the circuit works on the bench with a signal generator and fails intermittently when driven by the real TTL device, over temperature. **This is not a marginal-timing problem, it is a threshold violation.**

The second outright failure is supply range. `MM74C00M` and `74VCX00MTC` are both in our catalogue and both are NAND gates; the first is a 3-15 V CMOS part, the second is a 2.5 V family device. There is no supply voltage at which both are in specification.

## Measured obsolescence, by family

This is the table to check before specifying a family for a design that must live ten years. All logic categories, measured 2026-08-04:

| Family | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `74AUP` | 857 | 74 | **9%** |
| `74AHC` | 1,605 | 204 | **13%** |
| `74AHCT` | 701 | 106 | 15% |
| `74CBTLV` | 267 | 47 | 18% |
| `74LS` | 1,130 | 241 | 21% |
| `74LVC` | 2,546 | 526 | 21% |
| `74CBT` | 763 | 212 | 28% |
| `74HC` | 6,359 | 1,888 | 30% |
| `74HCT` | 1,818 | 570 | 31% |
| `74AUC` | 182 | 67 | 37% |
| `74FCT` | 1,006 | 396 | 39% |
| `74F` | 2,151 | 952 | 44% |
| `74ALVC` | 338 | 153 | 45% |
| `74AC` | 2,374 | 1,163 | 49% |
| `74LVTH` | 169 | 83 | 49% |
| `74VHC` | 1,075 | 547 | 51% |
| `74ALS` | 766 | 396 | 52% |
| `74ACT` | 1,249 | 650 | 52% |
| `74FST` | 85 | 43 | 51% |
| `74LCX` | 479 | 284 | 59% |
| `74LVT` | 345 | 205 | 59% |
| `74AS` | 470 | 284 | 60% |
| `74VHCT` | 302 | 185 | 61% |
| `74ABT` | 448 | 276 | 62% |
| `74BCT` | 90 | 66 | **73%** |
| `74VCX` | 72 | 53 | **74%** |
| `CD4xxx` | 1,464 | 414 | 28% |

Three conclusions a buyer can act on:

The 1990s "advanced" CMOS families are the risk, not the 1970s ones. `VCX`, `BCT`, `ABT`, `AS`, `VHCT`, `LCX` and `LVT` all run 59-74% inactive. They were positioned between families that survived (`HC`/`AHC` below and `LVC`/`ALVC` above) and got squeezed out.

`74LS` at 21% is healthier than `74AC` at 49%. Counter-intuitive, and the reason is demand: `LS` remains in production because the installed base never stopped buying it, whereas `AC` and `ACT` were superseded by `AHC`/`AHCT` at lower power and adequate speed.

`AUP` and `AHC` are the families to design into new work, at 9% and 13%. If a legacy `HC` part is gone, `AHC` is usually the closest live equivalent — same thresholds, same footprints, faster.

## Substituting across families: what to check

Work down this list in order; the first three can destroy or falsify the circuit, the rest degrade it.

1. **Supply range.** 4000-series at 12 V or 15 V cannot be replaced by anything in the `HC`, `AHC`, `AC` or `LVC` families.
2. **Input threshold type (CMOS vs TTL).** Only `HCT`, `AHCT`, `ACT`, `VHCT` and the bipolar/BiCMOS families take TTL levels.
3. **5 V tolerance on inputs**, if 3.3 V logic must accept 5 V signals. `LVC` and `LCX` inputs are generally 5 V tolerant; `AUC` and `AUP` are not. **Verify per datasheet; it is a family characteristic, not a rule.**
4. **Drive current** against the actual load. Replacing an `ABT` part rated 64 mA with an `HC` part rated 4 mA on a loaded backplane will not switch it.
5. **Edge rate.** Faster is not safer. `AC`-class outputs on a 1980s board (long unterminated tracks, sparse decoupling, shared ground returns) produce ground bounce, overshoot and false triggering.
6. **Bus hold.** `LVT`, `ALVC` and some `ABT` parts hold an undriven input at its last state. Substituting a part without bus hold leaves inputs floating and oscillating; substituting one *with* bus hold means external pull-downs now fight an active circuit and may not win.
7. **Power-up 3-state and I_off** for live insertion. Bus-interface families designed for hot-swap guarantee high-impedance outputs during supply ramp and no current draw through powered-down pins. General-purpose logic guarantees neither, which is covered further in [decoders, multiplexers and bus switches](/blog/decoder-mux-bus-switch-sourcing-guide).
8. **Schmitt-trigger inputs**, which are a function property, not a family property — see [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide).
9. **Package and pinout.** The same function number in a different family shares the pinout; the same function in a different *width* does not. A `16374` is not a `374`.

## Worked example: replacing an obsolete octal buffer

A board uses `74ABT08D,112` — obsolete in our catalogue, `ABT` running 62% inactive overall. The signal is a 5 V backplane fanning out to eight loads with roughly 30 pF each and 47 Ω series termination.

```
required drive        ABT typical 32-64 mA
AHCT drive            8 mA        → insufficient for the terminated load
AC drive              24 mA       → adequate, but edge rate ~1 V/ns
FCT drive             48-64 mA    → closest match, 39% family inactive
```

The candidate order is therefore `FCT` first (electrically closest, still 61% active as a family), `AC`/`ACT` second with termination review, and `AHCT` only if the load is re-examined. **This is what "check drive before threshold before speed" looks like in practice** —. That is why the family census above is more useful than a stock search.

## The single-gate rescue

When a multi-gate package is gone, a single-gate part plus rework is often the only live path. The `G` families (`SN74LVC1G`, `SN74AHC1G`, `NC7S`/`NC7SV`, `74LVC2G`) put one or two gates in SOT-23, SC-70 or smaller.

We hold 339 `NC7S`-prefixed parts (77 inactive) and 786 `SN74LVC`-prefixed devices in gates and inverters alone. `SN74LVC1GU04DBVT` and `74LVC2G08GN,115` are both active here.

The trade-off is honest: you replace one 14-pin package with two to six small packages, which means a board revision or a flying-lead rework, and each has its own decoupling requirement. For a low-volume legacy repair it is frequently cheaper than any alternative, and unlike a broker purchase, the parts are current production. The decision framing is in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

## Where the supply comes from

Rochester Electronics is the largest single source of legacy logic in our catalogue — 5,995 parts in gates and inverters, 2,474 in flip-flops, 3,324 in signal switches and decoders. That is authorised aftermarket production of the original die, not equivalents, and for `74VHC00N`, `MM74C00M` or `74VCX86MTC` class parts it is usually the shortest route.

Also visible in the data: **Renesas appears repeatedly in last-time-buy status** — `74HC86FP-E`, `CD4081BHNSR`, `CD4081BKNSR` and `CD4081BDNSR` in gates, and a long list of `74FCT`/`74CBT` parts elsewhere. Renesas inherited the Integrated Device Technology and Intersil logic lines. It is currently pruning them. **If your BOM contains Renesas-branded 74-series logic, scrub it now**; the method is in [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis), and the notice to watch for is described in [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Supply voltage range | Out of specification or destroyed |
| 2 | Input threshold type (CMOS vs TTL) | Intermittent, temperature-dependent failure |
| 3 | 5 V tolerance on inputs | Input damage or clamping |
| 4 | Output drive against the real load | Levels never reach threshold |
| 5 | Edge rate vs board layout | Ground bounce, overshoot, false triggers |
| 6 | Bus hold present or absent | Floating inputs, or pull-downs overridden |
| 7 | Power-up 3-state and I_off | Bus contention during insertion |
| 8 | Schmitt input where the original had one | Multiple transitions on slow edges |
| 9 | Function number width (`374` vs `16374`) | Wrong pin count |
| 10 | Package suffix per vendor, not per position | Wrong footprint |
| 11 | Temperature series (`74` vs `54`) | Out of range at extremes |
| 12 | Family lifecycle rate | Solved today, obsolete next year |

## FAQ

### What do the letters in a 74-series part number mean?

They identify the logic family, which sets supply range, input thresholds, output drive, speed and power — everything except the truth table. In `SN74AHCT574PWR`, `SN` is the vendor prefix, `74` the commercial temperature series, `AHCT` the family (Advanced High-speed CMOS with TTL-compatible inputs), `574` the function (octal D flip-flop with flow-through pinout) and `PWR` the package and reel code. The same function exists in a dozen families that are not electrically interchangeable.

### Can I replace a 74HCT part with a 74HC part?

Not safely, if anything TTL drives it. `HCT` inputs switch near 1.4 V; `HC` inputs at a 5 V supply need roughly 3.15 V. A TTL or `LS` output guarantees only 2.4 V in the high state, which is below the `HC` threshold, so the circuit may appear to work at room temperature with a strong driver and fail intermittently in production. The reverse substitution (`HCT` where `HC` was) is generally safe, since `HCT` accepts CMOS levels too.

### Which logic families are most at risk of obsolescence?

Measured across 39,165 logic parts in our catalogue, the 1990s "advanced" families are worst: `74VCX` at 74% inactive, `74BCT` 73%, `74ABT` 62%, `74VHCT` 61%, `74AS` 60%, `74LCX` and `74LVT` both 59%. The safest are the newest low-voltage and the modern CMOS mainstream: `74AUP` at 9%, `74AHC` 13%, `74AHCT` 15%, then `74LVC` and `74LS` at 21%. Overall the logic categories run 34% inactive.

### Why is 74LS still available when newer families are not?

Because demand never stopped. `74LS` sits in an enormous installed base of industrial and military equipment that continues to order it, so vendors kept the lines running; our data shows 21% of `74LS` part numbers inactive against 49% for `74AC`. The newer families were displaced by even newer ones (`AC` and `ACT` by `AHC` and `AHCT`, which offer adequate speed at lower power) while `LS` had no such replacement in the sockets it occupies.

### Are 4000-series and 74HC parts interchangeable?

Only within 2 to 6 V, and only if speed and drive allow. The 4000 series operates from 3 V to 18 V, which is its main reason to exist, and `HC` stops at 6 V, so any 12 V or 15 V design excludes `HC` entirely. The 4000 series is also much slower and drives roughly a milliamp against `HC`'s four. Where a 4000-series part is genuinely at 5 V and lightly loaded, the `74HC` equivalent function usually works, but the part numbers do not correspond one-to-one.

### Is fitting a faster logic family a safe upgrade?

No. Faster families have faster output edges, and edge rate (not clock frequency) drives ground bounce, overshoot, crosstalk and radiated emissions. A board designed for `74LS` with long unterminated tracks, sparse decoupling and a shared ground return can fail with `74AC` parts fitted, through false triggering on adjacent inputs. If a faster family is the only live option, review termination and decoupling as part of the substitution rather than treating it as a like-for-like swap.

### What is bus hold and why does it matter for substitution?

Bus hold is a weak internal latch on an input that keeps it at its last valid level when nothing is driving it, present on families such as `LVT`, `ALVC` and some `ABT` parts. It matters in both directions. Replacing a bus-hold part with one without it leaves undriven inputs floating around the threshold, drawing current and oscillating. Replacing a non-bus-hold part with one that has it means any external pull-up or pull-down must now overcome an active circuit, typically a few hundred microamps, which a high-value resistor cannot do.

### How should I handle a discontinued multi-gate logic package?

Three routes, in order of cost. First check the authorised aftermarket — Rochester Electronics carries a large share of legacy logic as original-die production. Second, check whether the same function exists in a live family with compatible thresholds and drive; `AHC`/`AHCT` is often the answer for `HC`/`HCT`, and `LVC` for 3.3 V parts. Third, rebuild the function from single-gate `G`-family parts in SOT-23-class packages, accepting a board revision. The third option uses current production, which is the only one of the three with a guaranteed future.

## Related reading

The family-selection framework is in [logic family selection](/blog/logic-family-selection-guide), and this article is the part-number and lifecycle companion to it. Function-specific guides: [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide), [flip-flops, latches and registers](/blog/flip-flop-latch-register-sourcing-guide), [decoders, multiplexers and bus switches](/blog/decoder-mux-bus-switch-sourcing-guide), and [counters, dividers and shift registers](/blog/counter-shift-register-sourcing-guide).

Where logic meets other domains: [level shifter selection](/blog/level-shifter-selection-guide) for crossing supply domains, [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide) for driving cables rather than traces.

Lifecycle: [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis), [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide), [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number and we will tell you which families still carry that function, what changes electrically, and which of them we can actually supply.

[**Submit an RFQ**](/rfq) | [**Browse gates and inverters**](/category/gates-inverters) | [**Upload a BOM**](/bom)
