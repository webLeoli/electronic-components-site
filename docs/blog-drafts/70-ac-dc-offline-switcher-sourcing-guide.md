---
title: "Offline Switchers: 700 V and 650 V Are Not the Same Part, and the Transformer Knows the Frequency"
slug: "ac-dc-offline-switcher-sourcing-guide"
status: "draft"
seoTitle: "AC-DC Offline Switcher Sourcing: TOPSwitch, TinySwitch, NCP10xx Replacement"
seoDesc: "43% of 4,291 offline switcher parts are inactive. Drain voltage margin arithmetic, why a frequency change saturates your transformer, EMI jitter, standby power and safety impact."
seoKeywords: "offline switcher sourcing, TOPSwitch obsolete, TinySwitch replacement, NCP1207 obsolete, 650V vs 700V MOSFET margin, flyback transformer frequency change, EMI frequency jitter, standby power 75mW"
tags: "AC-DC, offline switchers, flyback, TOPSwitch, TinySwitch, EMI, safety, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Analog & Power Sourcing"
relatedProducts: "TNY290PG, LNK364GN-TL, NCP1072STBT3G, NCP1076STAT3G, NCP1207APG, NCP1216D100R2G, NCP1011AP130G, L6699D"
---

# Offline Switchers: 700 V and 650 V Are Not the Same Part, and the Transformer Knows the Frequency

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: drain voltage margin, switching frequency and core flux, control modes, EMI, standby power, safety

---

**An offline switcher sits on the mains side of the isolation barrier, which makes every substitution a safety and compliance question before it is an electrical one.** Two parts from the same family with adjacent suffixes have different integrated MOSFETs and different current limits, so they support different output powers. A part with a 650 V drain rating replacing a 700 V one loses most of its margin at high line. And a part that switches at 66 kHz instead of 132 kHz roughly doubles the peak flux in a transformer that was wound for the higher frequency, which saturates the core. Our [AC-DC converters and offline switchers category](/category/ac-dc-converters) holds **4,291 part numbers with 1,862 no longer active (43%)**, and the classic families are the worst affected: `TOP2xx` is 61% inactive and `TNY3xx` is 100%.

## Key takeaways

- **In integrated-FET switchers the suffix encodes the MOSFET and current limit**, so it sets output power. `TNY274` and `TNY290` are not the same converter.
- **Drain voltage margin is arithmetic, not preference**: at 265 V AC input the drain sees roughly 575 V including the leakage spike, so 650 V leaves 12% margin and 700 V leaves 19%.
- **Switching frequency and the transformer are matched.** Halving the frequency roughly doubles peak flux density in the same core — straight into saturation.
- **Control mode is not substitutable**: ON/OFF cycle-skipping, fixed-frequency current mode and quasi-resonant valley switching need different feedback and different transformers.
- **Frequency jitter is an EMI feature.** Replacing a jittered part with a fixed-frequency one can fail conducted-emissions testing at a specific harmonic.
- **Standby power is regulated.** A replacement without burst-mode operation can exceed the no-load limits that the product was certified against.
- **onsemi's `NCP12xx` controller lines are in a broad wind-down** — `NCP1207`, `NCP1216`, `NCP1203`, `NCP1230`, `NCP1015`, `NCP1395` variants obsolete or last-time buy in our catalogue.

---

## Integrated FET or controller plus FET

Two architectures dominate, and they fail differently under substitution.

| | Integrated switcher | Controller + external MOSFET |
| --- | --- | --- |
| MOSFET | Inside, fixed by part number | Chosen separately |
| Power range | Fixed per suffix | Set by the FET and magnetics |
| Examples here | `TNY290PG`, `LNK364GN-TL`, `NCP1072STBT3G`, `NCP1076STAT3G`, `NCP1011AP130G` | `NCP1207APG`, `NCP1216D100R2G`, `L6699D`, `HR1001AGS` |
| Substitution risk | **Suffix = MOSFET and current limit** | FET and magnetics unchanged; controller behaviour changes |
| Thermal path | Through the package's source/drain pins | In the discrete FET |

In an integrated switcher, the family suffix is the power rating. The internal MOSFET's on-resistance and the internal current limit both scale with it, so a `TNY274` and a `TNY290` differ in deliverable output power by several times. A supplier offering "the same TinySwitch, different suffix" is offering a different converter: the same pattern as the configuration-coded parts described in [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide) and [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide).

There is a subtlety in the opposite direction too. Fitting a *larger* switcher than the design used gives a higher internal current limit, which means the transformer can be driven past its designed peak current before the part limits, so the core can saturate and the secondary rectifier can be over-stressed. **Bigger is not safer here.**

## Drain voltage margin, worked

The internal or external MOSFET sees the rectified line peak plus the reflected output voltage plus the leakage-inductance spike.

```
V_DS(peak) = V_IN(peak) + V_OR + V_spike
```

At the top of universal input, 265 V AC:

```
V_IN(peak)  = 265 × √2  ≈ 375 V
V_OR        (reflected output voltage, typical flyback)  ≈ 100 V
V_spike     (leakage inductance, clamped)                ≈ 100 V
------------------------------------------------------------
V_DS(peak)  ≈ 575 V
```

| MOSFET rating | Margin at 575 V | Percentage of rating used |
| --- | ---: | ---: |
| 650 V | 75 V | 88% |
| 700 V | 125 V | 82% |
| 725 V | 150 V | 79% |
| 800 V | 225 V | 72% |

Most designers hold V_DS(peak) below 80-85% of the rating to allow for line surges, load transients and component tolerance. On that basis a 650 V part is already marginal at 265 V AC input and a 700 V part is acceptable, so **replacing a 700 V switcher with a 650 V one deletes the margin the design was built on**, and the failure mode is a MOSFET that dies during a line surge months later.

The reverse substitution, a higher-voltage part in place of a lower one, is usually safe electrically but often comes with higher on-resistance for the same die area, which means more conduction loss and a hotter part.

## Switching frequency saturates the transformer

The transformer was designed for one frequency. Flux density scales inversely with it.

Peak flux density in the core is set by the volt-seconds applied per turn:

```
B_peak ∝ (V_IN × t_ON) / (N_P × A_e)
```

For the same input voltage and the same duty cycle, halving the frequency doubles `t_ON`, and therefore roughly doubles `B_peak`:

```
132 kHz part: t_ON(max) at 50% duty = 3.8 µs   → B_peak = B
 66 kHz part: t_ON(max) at 50% duty = 7.6 µs   → B_peak ≈ 2B
```

A core operating at 0.2 T saturates around 0.3-0.4 T, so doubling flux takes it past saturation: inductance collapses, primary current runs away to the current limit every cycle, and the part either shuts down or fails. The symptom is often described as "the new part gets very hot and the supply squeals".

So a frequency change requires a transformer change, which means new magnetics, a new safety evaluation of the transformer construction, and re-testing. Common family frequencies (66 kHz, 100 kHz, 132 kHz) look like a minor specification and are not.

Going the other way, a higher-frequency replacement in the same transformer reduces flux (safe from saturation) but increases core and switching losses and moves the EMI spectrum, which is the next problem.

## Control mode and the feedback path

Three control philosophies appear in this category and they need different circuits around them.

| Mode | How it regulates | What the board needs |
| --- | --- | --- |
| **ON/OFF cycle skipping** (TinySwitch class) | Enables or skips whole switching cycles based on an enable pin current | Optocoupler feeding the EN pin; **no error amplifier or compensation** |
| **Fixed-frequency current mode** (`NCP12xx`, `UC384x` class) | Peak current per cycle set by the feedback voltage | Optocoupler plus a TL431-class reference and compensation network |
| **Quasi-resonant / valley switching** (`NCP1207`, `NCP1337` class) | Switches when the transformer demagnetises; frequency varies with load | An auxiliary winding or drain sense for demagnetisation detection |
| **Primary-side regulation** | Infers output voltage from the bias winding | **No optocoupler**, but a tightly coupled bias winding |

Substitution consequences:

ON/OFF for fixed-frequency, or vice versa, changes the entire feedback network. A TinySwitch-class design has no compensation components to reuse; a current-mode design's TL431 and RC network has nothing to connect to on an EN pin.

Quasi-resonant parts need a demagnetisation signal. If the transformer has no auxiliary winding for it, the part cannot work. Conversely, replacing a QR part with a fixed-frequency one leaves the design switching into a non-zero drain voltage, raising both loss and EMI.

Primary-side regulation removes the optocoupler (attractive on cost) but requires the bias winding to track the output closely, which is a transformer specification, and it usually gives worse load regulation. A design certified with PSR cannot simply gain an optocoupler either, because the safety spacing for the opto has to exist on the board.

`L6699D` (resonant half-bridge controller) and `HR1001AGS` are examples of yet another topology class in this category (LLC resonant) where the transformer, the resonant capacitor and the controller form a matched set and none of them substitutes alone.

## EMI, standby power and the certification exposure

Two features that look optional are usually load-bearing for compliance.

Frequency jitter. Many modern switchers deliberately dither the switching frequency by a few percent to spread conducted-emissions energy across a band rather than concentrating it at harmonics. A replacement without jitter can put 6-10 dB more energy into a single harmonic — enough to fail EN 55032 or FCC Part 15 conducted emissions at a frequency the original design passed comfortably. **This is a test-house failure, not a bench failure**. It is expensive to discover late.

Standby power. No-load input power is regulated for external power supplies in most markets, with limits in the tens of milliwatts. Modern switchers achieve that with burst or sleep modes that stop switching almost entirely at no load. **A replacement without an equivalent low-power mode can miss the limit**, which means the product cannot carry the efficiency marking it was sold with.

Beyond those:

- **X-capacitor discharge**, required in some standards for safety, is a feature of some newer parts.
- **Output overvoltage protection behaviour** (latch-off versus auto-restart) has the same system consequences described in [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide), and here it interacts with safety: a latching OVP is often the protection of record against a failed feedback loop.
- **Brown-out and line overvoltage thresholds**, which prevent operation outside the rated input range.
- **Package creepage.** Power Integrations and others ship packages with a pin deliberately omitted to increase drain-to-secondary spacing. **A "same footprint" replacement in a conventional package can reduce creepage below the required clearance**, which is a safety non-conformance, not a performance issue.

Any substitution on the primary side should be reviewed against the safety file: the CB report or certification will reference the semiconductor's ratings, the transformer's construction and the clearances on the board.

## What is disappearing

| Family prefix | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `TNY3xx` | 19 | 19 | **100%** |
| `NCP10xx` | 242 | 167 | **69%** |
| `TOP2xx` | 277 | 170 | 61% |
| `TNY2xx` | 128 | 67 | 52% |
| `FSQ` | 46 | 24 | 52% |
| `ICE` | 211 | 94 | 45% |
| `LNK3xx` | 117 | 42 | 36% |
| `VIPER` | 155 | 49 | 32% |

Reading it:

The onsemi `NCP1xxx` controller lines are being consolidated hard. In our catalogue `NCP1207DR2`, `NCP1216D133R2`, `NCP1336ADR2G`, `NCP1050ST136T3`, `NCP1011AP130G` and `NCP1340B1DR2G` are obsolete, while `NCP1207APG`, `NCP1216D100R2G`, `NCP1230D100R2G`, `NCP1203P60G`, `NCP1015AP065G`, `NCP1395ADR2G`, `MC33364DR2G` and `FSL176MRTUDTU` are last-time buy. The active replacements (`NCP1072STBT3G`, `NCP1076STAT3G`, `NCP1361AABAYSNT1G`, `NCP1256BSN65T1G`) are different parts with different control schemes, not drop-ins.

`NCP1344BD1R2G` appears from Flip Electronics and `FSQ0765RSUDTU`, `KA5Q0740RTYDTU` from Rochester Electronics, so the authorised-aftermarket channel covers some of the Fairchild-lineage parts — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Power Integrations holds 1,236 part numbers here, the largest single share, and its older `TOP2xx` and `TNY2xx`/`TNY3xx` families are heavily inactive while `LNK3xx` is healthier. The migration path within the vendor generally exists, but as shown above, it involves a different frequency, a different control mode or a different MOSFET, so it involves the transformer.

Incoming inspection on primary-side parts is limited and should be honest about that. Useful checks: measure drain-source breakdown with a curve tracer or high-voltage tester at low current, confirm the internal current limit by observing peak primary current in a known circuit, verify the switching frequency and the presence of jitter, and check start-up and brown-out thresholds. **What cannot be verified on the bench is long-term avalanche ruggedness or the die's actual voltage grade under stress**, which is the main reason mains-side parts should come from authorised channels. Package inspection follows [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide), and lot consistency matters — see [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Integrated MOSFET rating and current limit (the suffix) | Insufficient power, or transformer over-driven |
| 2 | Drain-source voltage rating vs V_IN(peak) + V_OR + spike | MOSFET fails on a line surge |
| 3 | Switching frequency vs the existing transformer | Core saturation |
| 4 | Control mode (ON/OFF, current mode, QR, LLC, PSR) | Feedback network incompatible |
| 5 | Demagnetisation sense requirement | Part cannot switch |
| 6 | Optocoupler vs primary-side regulation | Missing feedback path |
| 7 | Frequency jitter present | Conducted-emissions failure |
| 8 | Burst/sleep mode and no-load power | Standby power limit exceeded |
| 9 | OVP behaviour: latch vs auto-restart | Protection of record changed |
| 10 | Brown-out and line OV thresholds | Operation outside rated input |
| 11 | Package creepage, including omitted pins | Safety clearance non-conformance |
| 12 | Thermal path in the actual package | Overtemperature at rated load |
| 13 | Safety file / certification impact | Product no longer certifiable as built |

## FAQ

### Does the suffix on a TinySwitch or TOPSwitch part number matter?

It is the most important field. In an integrated switcher the suffix selects the internal MOSFET's on-resistance and the internal current limit, which together set how much output power the part can deliver, so different suffixes in the same family are different converters, not packaging variants. Fitting a smaller one gives insufficient power; fitting a larger one raises the current limit so the transformer can be driven past its designed peak current, risking core saturation and secondary rectifier stress. Neither direction is safe by default.

### Can I use a 650 V switcher where a 700 V one was fitted?

Not at universal input. The drain sees the rectified line peak plus the reflected output voltage plus the leakage-inductance spike: at 265 V AC that is roughly 375 V + 100 V + 100 V ≈ 575 V. A 650 V part is then running at 88% of its rating with only 75 V of headroom for line surges and tolerances, where designers normally hold below 80-85%. A 700 V part leaves 125 V. The failure is not immediate — it appears as a MOSFET that dies during a surge event weeks or months later.

### Why does my supply overheat and squeal after changing the switcher?

Most likely the new part switches at a lower frequency and the transformer is saturating. Peak flux density scales with the volt-seconds per turn, so at the same input voltage and duty cycle, halving the frequency roughly doubles the flux — taking a core designed to run at 0.2 T well past its 0.3 to 0.4 T saturation point. Inductance collapses, primary current hits the limit every cycle, and the part runs hot while the magnetics make audible noise. A frequency change requires new magnetics, not just a new IC.

### Are ON/OFF and fixed-frequency switchers interchangeable?

No, because the feedback circuits have nothing in common. An ON/OFF cycle-skipping part regulates by enabling or skipping whole switching cycles based on current into an enable pin, so the design has no error amplifier and no compensation network. A fixed-frequency current-mode controller expects a feedback voltage derived from an optocoupler and a shunt reference with a compensation network. Swapping between them means redesigning the secondary-side sensing and the primary-side feedback entirely.

### What is frequency jitter for, and does it matter for substitution?

It spreads conducted-emissions energy across a band instead of concentrating it at switching harmonics, typically buying 6 to 10 dB at the peaks. It matters a great deal for substitution: a replacement without jitter can fail EN 55032 or FCC Part 15 conducted emissions at a harmonic the original design passed comfortably, and that failure appears at the test house rather than on the bench. If the original part jittered and the replacement does not, expect to revisit the input filter.

### Will a switcher substitution affect my safety certification?

Usually yes, and it should be checked before ordering. The certification file references the semiconductor's voltage ratings, the transformer's construction and the clearances on the board — all three of which a substitution can touch. Package creepage is a specific trap: some offline switchers ship in packages with a pin deliberately omitted to increase drain-to-secondary spacing, and a conventional package with the same footprint can reduce that clearance below what the standard requires. That is a non-conformance, not a performance degradation.

### Which offline switcher families are most affected by obsolescence?

The older integrated families and the onsemi controller lines. In our catalogue `TNY3xx` is 100% inactive across 19 part numbers, `NCP10xx` 69% of 242, `TOP2xx` 61% of 277 and `TNY2xx` 52% of 128, against `LNK3xx` at 36% and `VIPER` at 32%. Specific parts obsolete here include `NCP1207DR2`, `NCP1216D133R2`, `NCP1336ADR2G` and `NCP1011AP130G`, with `NCP1207APG`, `NCP1203P60G`, `NCP1015AP065G`, `NCP1230D100R2G`, `NCP1395ADR2G` and `FSL176MRTUDTU` in last-time buy.

### How much of an offline switcher can incoming inspection actually verify?

Less than most categories, which is itself an argument for buying through authorised channels. You can measure drain-source breakdown at low current, confirm the internal current limit by observing peak primary current in a known circuit, verify switching frequency and the presence of jitter, and check start-up and brown-out thresholds. What you cannot verify is avalanche ruggedness or how the die behaves under repeated high-voltage stress, which is precisely the property that fails months later on a counterfeit or downgraded part sitting on the mains side of the isolation barrier.

## Related reading

Cluster context: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) as the pillar, [DC-DC controller sourcing](/blog/dc-dc-controller-sourcing-guide) for the secondary-side and non-isolated stages, [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide), [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide), and [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide).

Adjacent: [gate driver selection](/blog/gate-driver-selection-guide) for controller-plus-FET designs, [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for what happens downstream at power-up, [date codes and lot traceability](/blog/date-code-lot-traceability-explained) and [IDEA-STD-1010 inspection](/blog/idea-std-1010-counterfeit-detection-guide) — both of which matter more on the mains side than anywhere else.

Send us the part number with your input voltage range, transformer frequency and output power, and we will filter for the parts that match the magnetics you already have.

[**Submit an RFQ**](/rfq) | [**Browse AC-DC converters**](/category/ac-dc-converters) | [**Upload a BOM**](/bom)
