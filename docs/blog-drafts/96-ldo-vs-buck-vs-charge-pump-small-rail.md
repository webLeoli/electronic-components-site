---
title: "LDO vs Buck vs Charge Pump for a Small Rail: The Number That Actually Decides"
slug: "ldo-vs-buck-vs-charge-pump-small-rail"
status: "draft"
seoTitle: "LDO vs Buck vs Charge Pump: The Thermal Ceiling Decides, Not Efficiency"
seoDesc: "A 500 mA LDO in SOT-23 is a 94 mA part at 85 °C ambient. The package and ambient set the real current limit, not the datasheet headline. With the arithmetic and measured availability."
seoKeywords: "LDO vs buck converter, charge pump selection, LDO thermal limit calculation, theta JA SOT-23, LDO maximum current ambient temperature, negative rail charge pump, LP2985 obsolete, TPS7A availability"
tags: "comparison, power design, LDO, buck converter, charge pump, thermal design"
author: "FPGACenter Engineering Team"
readingTime: 16
category: "Analog & Power Sourcing"
relatedProducts: "LP2985AIM5-2.5, TPS7A2025PDBVR, XC6206P332PR-G, XC6224A271NR-G, TPS62130ARGTR, LM2776DBVT, ICL7660CBA, LM2596SX-5.0"
---

# LDO vs Buck vs Charge Pump for a Small Rail: The Number That Actually Decides

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~16 minutes
> **Topics**: the thermal ceiling as the real current rating, efficiency arithmetic, where an LDO still wins, what charge pumps are for, availability by generation

---

**The current rating on an LDO's front page is a silicon limit. The package and the ambient temperature set the number you can actually use, often three to five times smaller.** A part sold as a 500 mA regulator, dropping 5 V to 3.3 V in a SOT-23-5 inside an enclosure at 85 °C, is a 94 mA part. Nothing on the datasheet's first page says so; the arithmetic is below and it takes four lines.

That is why "LDO or buck?" is usually settled by thermals rather than by efficiency, and why the answer changes when the same circuit moves from a bench to a sealed box. This article works all three options through the calculation, then adds the dimension a design guide normally leaves out: which of these parts you will still be able to buy.

Our [LDO cross-reference guide](/blog/ldo-cross-reference-guide) covers substituting one linear regulator for another, and the [DC-DC regulator replacement guide](/blog/dc-dc-regulator-replacement-guide) does the same for switchers. Neither answers the prior question of which topology the rail should use.

## Key takeaways

- LDO efficiency is fixed by physics at roughly `V_out / V_in`. At 12 V in and 3.3 V out that is 27%, and no part selection improves it.
- The binding constraint is usually the package, not the silicon. Work out the allowed dissipation from θJA, the maximum junction temperature and your worst-case ambient, then divide by the dropout to get the real current limit.
- A rail that works on the bench and fails in the enclosure is often this calculation, done at 25 °C instead of 85 °C.
- Rules of thumb worth keeping: below about 70% efficiency, or above 1-2 W of dissipation, use a switcher.
- The LDO still wins on noise, on PSRR at low frequency, on board area, on quiescent current, and on generating no EMI at all.
- A charge pump is the answer for a negative or bias rail at tens of milliamps where an inductor is unwelcome. Efficiency is around 70%, below an inductive design.
- Availability splits hard by generation: `LP298x` measures 51% inactive across 980 ordering codes while `TPS7A` measures 1% across 481. Every one of Torex's 270 `XC6224` codes is in a last-time-buy window.

---

## The three options

| | LDO | Buck converter | Charge pump |
| --- | --- | --- | --- |
| Efficiency | ≈ `V_out / V_in` | 80-95% | ~70% |
| Step direction | Down only, needs headroom | Down | Fixed ratios, can invert |
| Typical current | mA to a few A, thermally limited | Hundreds of mA to tens of A | Tens to low hundreds of mA |
| Output noise | Very low | Switching ripple at `f_sw` | Ripple at the pump frequency |
| Magnetics | None | **Inductor required** | None |
| EMI | None generated | Real, needs layout care | Modest |
| Board area | Smallest | Largest | Small |
| Quiescent current | µA-class parts available | Higher, though pulse-skipping helps | µA-class parts available |
| Layout sensitivity | Low | **High** | Low |

## Efficiency is arithmetic, not a specification

A linear regulator passes the full load current and drops the difference across a pass element, so its efficiency follows directly from the voltage ratio:

```
η ≈ V_out / V_in

5.0 V → 3.3 V    η ≈ 66%
12 V  → 3.3 V    η ≈ 27.5%
3.6 V → 3.3 V    η ≈ 92%
```

There is no LDO on the market that beats this, because the loss is the definition of how the part works. What varies between LDOs is quiescent current, dropout, noise and PSRR, none of which changes the ratio above.

The dissipation matters more than the percentage:

```
P = (V_in − V_out) × I_out

5.0 V → 3.3 V at 500 mA   P = 1.7 × 0.5 = 0.85 W
12 V  → 3.3 V at 500 mA   P = 8.7 × 0.5 = 4.35 W
```

A buck converter at 90% delivering the same 1.65 W of output power dissipates about 0.18 W in the first case. The useful heuristics, and they are consistent across vendor application notes: **if the efficiency falls below roughly 70%, or the dissipation exceeds 1-2 W, the rail wants a switcher.**

## The thermal ceiling: the calculation that decides

Dissipation only matters relative to what the package can shed. Turn it around and solve for current instead.

```
Allowed junction rise      = T_j(max) − T_a
Allowed dissipation        = (T_j(max) − T_a) / θJA
Allowed current            = allowed dissipation / (V_in − V_out)
```

Worked for a SOT-23-5 part, taking θJA at 250 °C/W and a 125 °C maximum junction temperature:

```
Enclosure at 85 °C:
  Allowed rise      = 125 − 85 = 40 °C
  Allowed P         = 40 / 250 = 0.16 W
  At 1.7 V dropout  → I = 0.16 / 1.7 = 94 mA

Bench at 25 °C:
  Allowed rise      = 125 − 25 = 100 °C
  Allowed P         = 100 / 250 = 0.40 W
  At 1.7 V dropout  → I = 0.40 / 1.7 = 235 mA
```

So the same part in the same circuit is a 235 mA regulator on your desk and a 94 mA regulator in the product. If the load draws 200 mA, the board passes every bench test and goes into thermal shutdown in the field, intermittently, as a function of ambient and enclosure airflow. That is one of the causes behind the symptom described in [the board does not boot](/blog/board-does-not-boot-diagnosis). It is the same class of fault as marginal oscillator start-up: real, temperature-dependent, and invisible at room temperature.

Three cautions on using this arithmetic honestly:

θJA is a property of the package on a specified test board, not of the package alone. Datasheet values assume a JEDEC board with a defined copper area. Your board will be worse if the thermal pad has no copper to spread into, and can be better with a generous pour. Published figures for SOT-23 land around 200-250 °C/W; take the number from the datasheet for the part you are fitting and treat it as optimistic unless your layout matches the test condition.

Use the worst-case ambient inside the enclosure, not the room. A sealed box with other dissipating parts runs well above room temperature, and the LDO sees that, plus its own rise.

Derate the junction temperature. Designing to exactly 125 °C leaves no margin for tolerance, aging or a hot spot. Many teams design to 105 °C or 110 °C, which tightens the current limit further.

## Where the LDO is still the right answer

Efficiency arguments have made the LDO unfashionable, and it remains correct in five situations.

Low noise, and specifically low noise where it matters. A switcher puts ripple at its switching frequency and harmonics onto the rail. For an ADC reference, a PLL supply, an RF front end or a precision amplifier, that ripple lands inside the signal band or aliases into it. An LDO generates none, and its PSRR attenuates what arrives from upstream. This is the reasoning behind the common two-stage arrangement: a buck to get close, then an LDO to clean up, accepting a small drop for a large noise improvement.

Small drop. At 3.6 V in and 3.3 V out the LDO is already 92% efficient, and a switcher's inductor, its layout constraints and its EMI buy almost nothing.

Small current. Below roughly 100 mA the dissipation is manageable at most input voltages and the LDO's area advantage dominates.

Nothing to radiate. In a design that must pass a tight emissions limit, or that sits next to a sensitive receiver, a topology with no switching node is a genuine simplification rather than a compromise.

Sleep current. Modern LDOs reach single-digit microamps of quiescent current, and for a rail that must stay up while a product sleeps, that can beat a switcher's own consumption even though the conversion is less efficient.

## Charge pumps: not a buck substitute

A charge pump moves energy with capacitors instead of an inductor, which restricts it to fixed ratios such as doubling, halving or inverting. It is not a general-purpose step-down.

Where it earns its place:

- **A negative rail from a positive supply.** This is the classic use, and the usual alternative is a transformer or a dedicated inverting topology. Vendor application notes on generating a negative supply treat the inverting charge pump as the default first answer.
- **Bias rails at tens of milliamps.** Sensor bias, DAC bias, amplifier bias, LCD bias. Current capability runs from tens of milliamps up to a few hundred on integrated parts.
- **Inductorless designs**, where height, magnetic coupling into a nearby sensor, or the inductor's own availability is the problem.

Efficiency sits around 70%, below an inductive converter's mid-80s to low-90s, and that is intrinsic to the charge-transfer mechanism. The compensating advantages are size, layout simplicity and the absence of a magnetic component.

One useful hybrid exists and is worth knowing: parts that combine an inverting charge pump with a low-noise LDO on the output, giving a clean positive and negative pair from a single positive input at a few hundred milliamps. For split-supply analogue front ends this replaces a much larger design.

## What the catalogue says

Measured 2026-08-11. The generational split is as sharp here as anywhere on the site.

| Family | Type | Part numbers | Not active | Last-time buy |
| --- | --- | ---: | ---: | ---: |
| `TPS7A` | LDO, current TI | 481 | **1%** | — |
| `XC6206` | LDO, Torex | 123 | **0%** | — |
| `TPS6213x` | Buck, current TI | 32 | **0%** | — |
| `LTC3406` | Buck, Linear | 28 | **0%** | — |
| `LM2776` | Charge pump, current TI | 6 | **0%** | — |
| `LM2596` | Buck, classic | 48 | 8% | — |
| `TPS60xx` | Charge pump | 152 | 10% | — |
| `LM1117` | LDO, classic | 102 | 19% | — |
| `AP2112` | LDO, Diodes | 20 | 20% | — |
| `LM2662` | Charge pump | 4 | 25% | — |
| `MIC5205` | LDO, Micrel heritage | 54 | 28% | — |
| `MC34063` | Buck, 1980s | 27 | 30% | — |
| `ICL7660` | Charge pump, classic | 63 | 35% | — |
| `ADP2108` | Buck, ADI | 24 | 38% | — |
| `MAX1044` | Charge pump, classic | 12 | 50% | — |
| **`LP298x`** | **LDO, National heritage** | 980 | **51%** | — |
| **`XC6224`** | **LDO, Torex** | 270 | **100%** | **270** |

At category level, linear regulators hold 67,881 part numbers at 21% inactive and switching regulators 36,234 at 25%.

Three things follow.

`LP2985` and its siblings were the default small LDO in a generation of designs, and 51% of that family's ordering codes are gone. `LP2985AIM5-2.5` is one of the obsolete ones. If it is on a bill of materials you still build, that line needs attention now rather than later, and the substitution checks in the [LDO cross-reference guide](/blog/ldo-cross-reference-guide) are the ones that matter: output voltage option, dropout at your current, enable polarity, and the output capacitor's ESR requirement, which is what makes a "drop-in" LDO oscillate.

Torex `XC6224` is the sharper warning. All 270 ordering codes we list are in a last-time-buy window, not a subset: an entire LDO family being retired by a vendor whose overall catalogue measures among the healthiest on the site. The wider pattern is in the [August 2026 obsolescence watch](/blog/obsolescence-watch-2026-08).

The classic charge pumps are the weakest group. `MAX1044` at 50% and `ICL7660` at 35% are the parts a legacy design is most likely to contain, and `ICL7660CBA` is obsolete. Current alternatives measure 0-10%.

## Choosing

| If the binding constraint is | Use | Note |
| --- | --- | --- |
| Dissipation above 1-2 W, or efficiency below ~70% | **Buck** | Run the thermal ceiling calculation to confirm |
| Load under ~100 mA with a small drop | **LDO** | Smallest area, no EMI |
| Noise on an ADC reference, PLL or RF rail | **LDO**, or buck then LDO | Two-stage costs a small drop for a large noise gain |
| A negative or bias rail at tens of mA | **Charge pump** | Or a charge-pump-plus-LDO hybrid for low noise |
| No inductor permitted (height, magnetics, availability) | **Charge pump** | Accept ~70% efficiency |
| Sleep rail that must stay up | **LDO** with µA quiescent current | Compare against the switcher's own consumption |
| Tight emissions limit, sensitive receiver nearby | **LDO** | No switching node to radiate |
| Wide input range, e.g. 9-36 V industrial | **Buck** | Linear dissipation is impossible across that range |
| Fifteen-year availability, either would work | **Current-generation part of either** | `TPS7A` 1% and `TPS6213x` 0% against `LP298x` 51% |

Per-part status is on the [linear regulator](/category/linear-regulators-ldo) and [DC-DC switching regulator](/category/dc-dc-switching-regulators) category pages, and an [RFQ](/rfq) will confirm a specific ordering code including aftermarket sources.

## Frequently asked questions

### Why can't I use the LDO's rated current?

Because the rating describes what the silicon can pass, and the package plus your ambient decide how much heat can leave. Compute the allowed dissipation as `(T_j(max) − T_a) / θJA`, then divide by the dropout voltage. A SOT-23-5 part at 250 °C/W in an 85 °C enclosure can shed about 0.16 W, which at a 1.7 V drop is 94 mA regardless of a 500 mA headline.

### Why does my regulator only overheat in the product, not on the bench?

The ambient changed, and the allowed dissipation scales with the difference between maximum junction temperature and ambient. The same part that can dissipate 0.40 W at 25 °C can only dissipate 0.16 W at 85 °C, so its usable current falls by about 60%. Always run the calculation at the worst-case ambient inside the enclosure, and remember the enclosure is hotter than the room because everything else in it is dissipating too.

### At what point should I switch from an LDO to a buck converter?

Two thresholds, either of which is sufficient: efficiency below roughly 70%, or dissipation above 1-2 W. The 5 V to 3.3 V case at 500 mA sits right at the boundary, dissipating 0.85 W at 66% efficiency, so it goes either way depending on the ambient and the package. At 12 V in the answer is unambiguous: 27% efficiency and 4.35 W is not a linear regulator's problem to solve.

### Is a buck plus an LDO wasteful?

No. It is standard practice for noise-critical rails. The buck does the large voltage step efficiently and the LDO removes its ripple, costing only the small drop across the LDO. For an ADC reference or a PLL supply the noise improvement is worth far more than the fraction of a percent of efficiency lost.

### Can a charge pump replace a buck converter?

Not generally. Charge pumps work at fixed ratios, deliver tens to a few hundred milliamps, and run around 70% efficient. They are the right answer for a negative rail, a bias rail, or a design where an inductor is unacceptable on grounds of height or magnetic coupling. For a general step-down at any real current, use a buck.

### What has to match when replacing an obsolete LDO?

Output voltage option, dropout at your actual load current, enable pin polarity and threshold, quiescent current if it matters, and the output capacitor requirement. That last one causes the most trouble: older parts often need a minimum ESR for loop stability while modern low-ESR ceramics can make them oscillate, and the reverse substitution can also destabilise. This is covered in detail in the [LDO cross-reference guide](/blog/ldo-cross-reference-guide).

### Which families are safest for a new design?

On measured availability, the current generations: `TPS7A` at 1% inactive and `XC6206` at 0% for linear rails, `TPS6213x` and `LTC3406` at 0% for buck, and `LM2776` at 0% for charge pumps. Avoid starting on `LP298x` at 51% inactive, `MAX1044` at 50%, or `ICL7660` at 35%. The `XC6224` case is a reminder to check at ordering-code level rather than trusting a vendor's overall reputation: all 270 of its codes are in a last-time-buy window.

### Does a bigger package solve the thermal problem?

It helps, within limits. Moving from SOT-23 to a package with an exposed thermal pad and real copper underneath can reduce θJA by several times, which multiplies the allowed current by the same factor. But at some point the dissipation itself is the problem: no package makes 4.35 W of linear loss sensible in a small enclosure, and the copper area that a low θJA depends on is board space you could have spent on an inductor.

## Sources

Availability figures are our own measurement across 719,342 catalogue part numbers,
dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`. Thermal and
efficiency behaviour is device- and layout-specific: **take θJA, maximum junction
temperature and dropout from the datasheet for the part you are fitting**, and treat
a datasheet θJA as optimistic unless your copper matches its test board.

- Texas Instruments, *Thermal Comparison of a DC-DC Converter in SOT23 and SOT563*
  (SLVAEB1) — package thermal resistance and how board construction changes it.
  [ti.com](https://www.ti.com/lit/an/slvaeb1a/slvaeb1a.pdf)
- Texas Instruments, *Generate Negative Power Supply from Positive Power Supply*
  (SPVA023) — inverting charge pump options and the charge-pump-plus-LDO
  arrangement for a low-noise negative rail. [ti.com](https://www.ti.com/lit/pdf/spva023)
- Texas Instruments, *The forgotten converter* (SLPY005) — charge-pump topology
  trade-offs, including the efficiency comparison against inductive designs.
  [ti.com](https://www.ti.com/lit/pdf/slpy005)
- `LM27762` datasheet: a worked example of the integrated charge-pump-plus-LDO
  approach, ±250 mA with sub-milliamp operating current.
  [ti.com](https://www.ti.com/lit/gpn/lm27762)
- JEDEC JESD51 series for the board and environment definitions that datasheet θJA
  figures are measured against. [jedec.org](https://www.jedec.org/)
