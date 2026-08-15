---
title: "555 Timers and Delay ICs: The CMOS Version Is Not a Drop-In for the Bipolar One"
slug: "555-timer-delay-ic-sourcing-guide"
status: "draft"
seoTitle: "555 Timer Sourcing: Bipolar vs CMOS, NE555 vs TLC555 vs ICM7555"
seoDesc: "Why swapping an NE555 for a TLC555 changes drive current by 20x, how threshold bias current limits timing resistors, and what replaces the discontinued ICM7240 programmable timers."
seoKeywords: "555 timer sourcing, NE555 vs TLC555, ICM7555 replacement, LMC555, bipolar vs CMOS 555, ICM7240 obsolete, CD4541 timer, TPL5010 nano timer, 555 supply spike"
tags: "555 timer, NE555, TLC555, ICM7555, delay ICs, nano-power timers, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 15
category: "Timing & Clock Distribution"
relatedProducts: "ICM7555IBAZ, SA555DT, ICM7556IPDZ, ICM7242IPAZ, ICM7240IPE, ICM7242IBAZ-T, LTC6992CS6-1#TRPBF, DS1673S-5+T&R"
---

# 555 Timers and Delay ICs: The CMOS Version Is Not a Drop-In for the Bipolar One

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~15 minutes
> **Topics**: bipolar vs CMOS 555, drive current, threshold bias, supply spikes, programmable timers, nano-power replacements

---

**The `NE555` and the `TLC555` share a pinout, a function table and a set of timing equations, and they differ by a factor of twenty in output drive and a factor of thirty in supply current.** Which direction that matters depends on what the socket is doing: a bipolar 555 driving a relay coil cannot be replaced by a CMOS part, and a CMOS 555 in a battery-powered timer cannot be replaced by a bipolar one without changing the battery life calculation. Both substitutions "work" on a bench supply with a scope on the output. Meanwhile the genuinely obsolete parts in this space are not the 555 at all; they are the programmable counter/timers, where 28 of 45 `ICM72xx` part numbers in our catalogue are no longer active.

## Key takeaways

- **Bipolar 555 drives ~200 mA; CMOS versions drive 10-100 mA.** Relays, LEDs and small motors are the failure cases.
- **Bipolar 555 draws 3-10 mA of supply current; CMOS versions draw 100-250 µA.** In a battery design that is the entire budget.
- **Threshold input bias current limits the timing resistor.** Bipolar parts top out around 1 MΩ; CMOS parts allow tens of megohms, which is how long delays are built.
- **The bipolar 555 output stage produces a large supply current spike** on every transition. A CMOS replacement removes it, and a bipolar replacement in a CMOS design introduces it.
- **Timing is ratiometric to the supply**, so both types are supply-independent in the ideal case; the real differences are in leakage and bias.
- **The programmable timers are the obsolete ones**: `ICM7240IPE` and `ICM7242IBAZ-T` obsolete, `ICM7242IPAZ` and `ICM7556IPDZ` last-time buy.
- **For a new long-delay or wake-up function, nano-power system timers replace the 555 entirely** at microamp currents.

---

## The two families

Every 555 is one of two implementations, and the letters do not always tell you which.

| | Bipolar | CMOS |
| --- | --- | --- |
| Typical parts | `NE555`, `SA555`, `LM555`, `NE556` (dual) | `TLC555`, `LMC555`, `ICM7555`, `ICM7556` (dual) |
| Supply range | 4.5-16 V | 2-18 V, depending on part |
| Supply current (quiescent) | 3-10 mA | 100-250 µA |
| Output drive | ~200 mA source/sink | 10-100 mA |
| Threshold/trigger bias current | 100-250 nA | pA range |
| Practical maximum timing resistor | ~1 MΩ | tens of MΩ |
| Supply spike on switching | **Large** (up to ~400 mA transient) | Small |
| Minimum pulse width / max frequency | ~100 kHz typical | ~1-3 MHz typical |

The substitution risk runs in both directions, which is unusual and worth being explicit about:

CMOS replacing bipolar loses drive. A 555 directly driving a 12 V relay coil at 60 mA, an LED string, or a piezo sounder needs the bipolar output stage. Fit a `TLC555` and the relay chatters or does not pull in; the failure is load-dependent and may pass a no-load bench test.

Bipolar replacing CMOS costs current and injects noise. A battery-powered design built around a `TLC555` at 200 µA cannot absorb a `NE555` at 5 mA (that is a 25× increase in standby current) and the bipolar part's switching spike will appear on the rail, where it can upset an ADC or a radio in the same product.

In our catalogue `ICM7555IBAZ` is active, `SA555DT` (ST's bipolar version) is obsolete, and `ICM7556IPDZ` is last-time buy. The plain `NE555`, `LM555` and `TLC555` numbers remain widely available — 21 `NE555` variants, 28 `TLC555`, 16 `LMC555`.

## Timing arithmetic, and where it breaks

Both families use the same equations because the thresholds are ratios of the supply: 2/3 V_CC for the threshold comparator and 1/3 V_CC for the trigger.

Astable (oscillator) mode:

```
t_high = 0.693 × (R1 + R2) × C
t_low  = 0.693 × R2 × C
f      = 1.44 / ((R1 + 2·R2) × C)
```

With R1 = 10 kΩ, R2 = 100 kΩ, C = 1 µF:

```
f = 1.44 / ((10,000 + 200,000) × 1×10⁻⁶) = 1.44 / 0.21 = 6.86 Hz
duty = (R1 + R2) / (R1 + 2·R2) = 110/210 = 52.4%
```

Monostable (one-shot):

```
t = 1.1 × R × C
```

Now the part that decides which family you can use. For a long delay you want a large R and a modest C, because large capacitors leak. But the threshold pin's own bias current flows through R and shifts the effective threshold:

```
bipolar 555, threshold bias 250 nA, R = 10 MΩ
error voltage = 250 nA × 10 MΩ = 2.5 V
```

That is a 2.5 V offset on a threshold that sits at 3.33 V on a 5 V supply: the timer will not work at all. With R limited to 1 MΩ the error is 250 mV, which is a timing error of a few percent, and that is why bipolar 555 designs rarely exceed 1 MΩ.

A CMOS 555 has picoamp-level input current, so a 10 MΩ resistor contributes microvolts. **A long-delay circuit built around a CMOS 555 with a multi-megohm resistor cannot be converted to bipolar.** This is the single most common 555 substitution failure after drive current.

Two further practical notes:

- **Capacitor leakage and dielectric matter more than the timer** at long delays. An electrolytic with microamps of leakage swamps a picoamp input; use film or low-leakage types.
- **The control voltage pin (pin 5) shifts both thresholds.** If a design uses it for modulation, the replacement's internal divider impedance changes the modulation depth.

## The supply spike nobody decouples for

The bipolar 555's output stage conducts through both transistors briefly during each transition, drawing a current spike that can reach several hundred milliamps for tens of nanoseconds. On a shared rail this shows up as:

- **False triggering of the same 555** through its own control or trigger pins.
- **Corrupted ADC readings** if a converter samples on the same rail: the mechanism described in [data converter sourcing](/blog/data-converter-sourcing-guide).
- **Reset pulses** if a supervisor's threshold is close, which is exactly the marginal case discussed in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).

The standard mitigation is a 100 nF capacitor directly at pin 8, plus bulk capacitance nearby. **The sourcing consequence: a board that has run reliably with a CMOS 555 may not have that decoupling, so fitting a bipolar part introduces a fault that the original design never had to handle.**

## Programmable and long-interval timers

The parts that are genuinely disappearing are the programmable counter/timers, which combined an oscillator with a binary or decade divider chain so that one RC could produce delays of minutes to days.

| Part | Function | Status in our catalogue |
| --- | --- | --- |
| `ICM7240IPE` | Programmable binary counter/timer | obsolete |
| `ICM7242IBAZ-T` | Fixed 128-count timer/oscillator | obsolete |
| `ICM7242IPAZ` | Same, DIP | **last-time buy** |
| `ICM7556IPDZ` | Dual CMOS 555 | **last-time buy** |
| `CD4541` | Programmable timer, 4000 series | 18 variants, 4 inactive |

`ICM72xx` overall runs 28 of 45 part numbers inactive — **62%**, against essentially nothing inactive in the `TLC555` line. These are Intersil-lineage parts now under Renesas, and the pattern matches what we see across the Renesas analogue portfolio: the differentiated, low-volume parts go first.

Three replacement routes for a programmable timer, in increasing order of redesign:

1. **`CD4541`**, which is still available and does the same job for supply ranges up to 18 V. Note its own oscillator's frequency depends on the part's thresholds, so the RC values may need adjusting between vendors.
2. **A CMOS 555 plus a `CD4020`/`CD4040` ripple counter**, which is what the `ICM7240` was internally. The divider question is covered in [counters, dividers and shift registers](/blog/counter-shift-register-sourcing-guide).
3. **A nano-power system timer or a small microcontroller**, which is where new designs go.

## Nano-power timers: what replaces the 555 in new designs

For wake-up, watchdog and long-interval functions, a modern system timer draws single-digit microamps or less — two to three orders of magnitude below a bipolar 555 and still well below a CMOS one.

The `TPL5xxx` class in our catalogue shows 11 part numbers with **none inactive**, which is what a family in active investment looks like. Characteristics that differ from a 555:

- **Interval set by a resistor or by I²C**, in seconds to hours, with much better accuracy than an RC.
- **A dedicated "done" or handshake input**, so a microcontroller can confirm it woke up: a watchdog function the 555 cannot provide.
- **Push-pull CMOS output with modest drive**, so a load switch or MOSFET is needed for anything beyond logic.

Where the socket is a genuine RC oscillator or PWM generator rather than a delay, the silicon oscillator families are the modern answer — `LTC6992CS6-1#TRPBF` (voltage-controlled PWM), `LTC6905`, `LTC6930` and `LTC6908` are all active in our catalogue. Their trade-off against a crystal is accuracy, covered in [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide).

## Sourcing notes

The 555 itself is one of the safest parts in the catalogue, made by many vendors for fifty years. The risk sits in three places:

Package, not die. DIP-8 versions of everything are thinning out while SOIC and smaller packages continue. If a legacy board needs through-hole, check availability before assuming.

Vendor-specific behaviour within the same number. Bipolar 555s from different manufacturers differ measurably in trigger threshold hysteresis, minimum trigger pulse width and output saturation voltage. For a circuit that has been tuned (a pulse-stretcher near the minimum trigger width, for instance) a different vendor's `NE555` is a change, not a like-for-like.

Counterfeit and remarked parts. The 555 is cheap enough that fraud is usually a lower-grade or different-family die in the marking, and the easiest test distinguishes the families directly: **measure quiescent supply current with the output static.** A part marked `NE555` drawing 200 µA is a CMOS die; a part marked `TLC555` drawing 5 mA is bipolar. Add threshold-pin bias current if precision matters. Package-level inspection follows [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

For the timer/oscillator category as a whole (22,784 part numbers, only 662 inactive (3%)) the low rate is misleading, because 21,332 of those parts are one vendor's programmable oscillator configurations. That distinction is the subject of [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Bipolar or CMOS implementation | Drive or supply current wrong by 20-30× |
| 2 | Output current against the actual load | Relay does not pull in, LED dim |
| 3 | Quiescent supply current vs battery budget | Battery life collapses |
| 4 | Threshold bias current vs timing resistor value | Long-delay circuits do not run |
| 5 | Supply range, especially below 4.5 V | Bipolar part will not start |
| 6 | Maximum operating frequency | Oscillator fails at speed |
| 7 | Decoupling adequate for a bipolar output stage | False triggering, ADC noise, spurious resets |
| 8 | Control-voltage (pin 5) divider impedance | Modulation depth changes |
| 9 | Capacitor leakage at long intervals | Timing drift |
| 10 | Minimum trigger pulse width, vendor to vendor | One-shot misses triggers |
| 11 | Reset pin behaviour and threshold | Fails to reset, or resets spuriously |
| 12 | Package availability (DIP vs SOIC) | No through-hole option |

## FAQ

### Can I replace an NE555 with a TLC555?

Only if the load allows it. They share the pinout and the timing equations, but the bipolar `NE555` sources and sinks around 200 mA while CMOS versions manage 10 to 100 mA. Relays, LED strings, piezo sounders and small motors driven directly from the timer will fail with the CMOS part fitted, often intermittently. In exchange the CMOS part draws 100 to 250 µA instead of 3 to 10 mA and produces almost no supply spike, so for logic-level loads it is usually the better choice.

### Why does my long-delay 555 circuit stop working with a different part?

Because the threshold pin's bias current flows through your timing resistor. A bipolar 555 draws 100 to 250 nA there, so a 10 MΩ resistor develops up to 2.5 V of error — enough to prevent the threshold from ever being reached correctly. That is why bipolar designs rarely use resistors above about 1 MΩ. CMOS versions have picoamp input currents and work happily with tens of megohms, so a long-delay circuit designed around a CMOS part cannot be converted to bipolar.

### Is 555 timing affected by supply voltage?

In principle no, because the internal comparators are referenced to 2/3 and 1/3 of the supply, so the charge and discharge thresholds scale with it and cancel. In practice the second-order effects do vary: threshold bias current, output saturation voltage and the minimum trigger pulse width all shift with supply, and at low supply voltages a bipolar part may not start at all. For designs where the timing is a specification rather than an approximation, the supply range of the replacement matters.

### What causes the supply current spike on a bipolar 555?

The output stage conducts through both transistors briefly during each transition, drawing a transient that can reach several hundred milliamps for tens of nanoseconds. On a shared rail this couples into anything sensitive — it can retrigger the timer through its own control or trigger pins, corrupt an ADC sampling on the same supply, or trip a supervisor whose threshold is close. A 100 nF capacitor at the supply pin plus local bulk capacitance is the standard fix, and a board designed around a CMOS 555 may not have it.

### What replaces an obsolete ICM7240 programmable timer?

Three options. The `CD4541` programmable timer is still available and covers supply ranges to 18 V, though its RC frequency depends on the specific part's thresholds. Alternatively rebuild the function from a CMOS 555 plus a `CD4020` or `CD4040` ripple counter, which is essentially what the `ICM7240` contained. For a new design, a nano-power system timer of the `TPL5xxx` class gives better interval accuracy at microamp currents, along with a handshake input that lets a microcontroller confirm the wake-up.

### Are 555 timers from different manufacturers really interchangeable?

For most circuits yes, but not for tuned ones. Trigger threshold hysteresis, minimum trigger pulse width and output saturation voltage vary measurably between vendors' versions of the same number. A one-shot operating near the minimum trigger width, or a circuit relying on a particular saturation voltage to hold a load off, can behave differently. Where a design has been in production for years without change, treat a vendor swap as a change requiring test rather than an equivalent.

### How do I detect a remarked or wrong-family 555?

Measure the quiescent supply current with the output held static. A device marked `NE555` that draws a couple of hundred microamps contains a CMOS die; one marked `TLC555` drawing several milliamps is bipolar. Follow up with output drive into a resistive load and, if precision matters, threshold-pin bias current measured through a large resistor. These are simple bench tests that distinguish the families unambiguously, which is more than a visual inspection of the marking can do.

### Which timer parts in your catalogue are at end of life?

The programmable counter/timers. `ICM7240IPE` and `ICM7242IBAZ-T` are obsolete, `ICM7242IPAZ` and the dual `ICM7556IPDZ` are last-time buy, and the `ICM72xx` family overall runs 28 of 45 part numbers inactive — 62%. `SA555DT` from STMicroelectronics is obsolete. By contrast the `TLC555` line shows none inactive across 28 part numbers, and `TPL5xxx` nano-power timers none across 11. These are Intersil-lineage parts now inside Renesas, which is pruning its low-volume analogue ranges.

## Related reading

The rest of this cluster: [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide) for frequency sources, [real-time clock sourcing](/blog/rtc-sourcing-guide) for timekeeping, [clock buffer and fanout sourcing](/blog/clock-buffer-fanout-sourcing-guide) for distribution, and [clock generators and PLLs](/blog/clock-generator-pll-sourcing) for synthesis.

Where a timer is really a supervisor: [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide). Where it drives a load: [gate driver selection](/blog/gate-driver-selection-guide) and [LED driver sourcing](/blog/led-driver-sourcing-guide). For rebuilding a divider chain: [counters, dividers and shift registers](/blog/counter-shift-register-sourcing-guide).

Send us the part number with the load and the timing resistor value, and we will tell you whether the bipolar or CMOS version is the one your circuit actually needs.

[**Submit an RFQ**](/rfq) | [**Browse timers and oscillators**](/category/programmable-timers-oscillators) | [**Upload a BOM**](/bom)
