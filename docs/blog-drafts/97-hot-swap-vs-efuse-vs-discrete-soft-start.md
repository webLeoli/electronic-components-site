---
title: "Hot-Swap Controller vs eFuse vs Discrete Soft-Start: Where the Inrush Energy Goes"
slug: "hot-swap-vs-efuse-vs-discrete-soft-start"
status: "draft"
seoTitle: "Hot-Swap vs eFuse vs Discrete Soft-Start: SOA and the Inrush Arithmetic"
seoDesc: "A current-limited charge puts exactly the capacitor's stored energy into the FET, whatever the limit. Lowering the limit spreads it over longer time, which can move you further outside the SOA."
seoKeywords: "hot swap controller vs eFuse, inrush current SOA calculation, dV/dt control inrush, MOSFET safe operating area hot swap, LM5069-1 vs LM5069-2 latch auto retry, eFuse selection, LTC4238 last time buy"
tags: "comparison, power design, hot swap, eFuse, inrush, SOA, design for availability"
author: "FPGACenter Engineering Team"
readingTime: 16
category: "Analog & Power Sourcing"
relatedProducts: "LM5069MM-1, LM5069MM-2-TI, TPS2490DGSR, TPS2490DGSRG4, TPS259250DRCR, TPS2553DRVT-1, TPS26625DRCT, SLG59M1440V"
---

# Hot-Swap Controller vs eFuse vs Discrete Soft-Start: Where the Inrush Energy Goes

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~16 minutes
> **Topics**: the energy identity that governs inrush, why a lower current limit can be worse, fault response as an ordering-code digit, availability by vendor lineage

---

**When a series FET charges a bulk capacitor under current limit, the FET dissipates exactly the energy that ends up stored in the capacitor. The current limit does not change that total; it changes how long the FET takes to absorb it.** Since a MOSFET's safe operating area is time-dependent, turning the limit down to be gentle can move a design further outside the SOA rather than closer inside it. That single relationship decides most of the choice between the three ways of controlling inrush.

The three options are a hot-swap controller driving an external FET, an eFuse with the FET integrated, and a discrete soft-start built from a MOSFET and an RC network. They are usually compared on features. The arithmetic below compares them on what the silicon actually has to survive, and then on which of them you will still be able to buy: within the hot-swap controller category alone, availability by vendor lineage runs from 10% to 85% inactive.

## Key takeaways

- For a current-limited charge, FET dissipation over the ramp equals `½CV²` regardless of the current limit. Only the duration changes.
- Halving the current limit doubles the ramp time and halves the peak power. Whether that helps depends on the shape of the FET's SOA curve at that duration, so it must be checked rather than assumed.
- `I = C × dV/dt`, so gate slew control and current limiting are two ways of setting the same thing.
- Latch-off versus auto-retry is one digit in the ordering code. `LM5069-1` latches off after a fault; `LM5069-2` restarts at a fixed duty cycle. The parts are otherwise the same.
- eFuses integrate the FET, so the SOA is fixed and the design work disappears with it. Measured availability is excellent: `TPS259x`, `TPS255x`, `TPS26xx` and `TPS16xx` are all 0% inactive across 220 ordering codes.
- A discrete RC soft-start limits inrush and nothing else. No current limit, no fault flag, no retry, and the FET still has to survive the same energy.
- Vendor lineage dominates availability in this category: Linear Technology 10% inactive against Intersil 85% and Microchip 83%.
- `LTC4238` is a warning worth acting on: all twelve ordering codes we list are in a last-time-buy window.

---

## The three options

| | Hot-swap controller + external FET | eFuse | Discrete soft-start |
| --- | --- | --- | --- |
| Inrush control | Current limit or `dV/dt`, programmable | Programmable `dV/dt`, bounded | RC on the gate |
| Overcurrent protection | Yes, with timer | Yes, precise | **None** |
| SOA responsibility | **Yours** — you choose the FET | The vendor's, and fixed | **Yours**, with no help |
| Fault reporting | Yes | Yes | None |
| Latch-off / auto-retry | Ordering-code option | Ordering-code option | Not applicable |
| Reverse blocking | Some parts | Some parts | No |
| Current range | Highest, set by the FET | Bounded by the integrated FET | Set by the FET |
| Voltage range | Widest, up to hundreds of volts | Typically ≤ 60 V | Set by the FET |
| Part count | Controller, FET, sense resistor, passives | One IC plus two capacitors | FET, resistors, capacitor |
| Availability | **10-85% inactive, by lineage** | **0% inactive** | No IC to obsolete |

## The inrush arithmetic

Two equivalent ways to state the same constraint, and both appear in vendor application notes because different parts expose different controls.

By current limit. The controller holds the FET in its linear region so that load current stays at `I_LIM` while the output capacitor charges:

```
Ramp time    t = C × V_IN / I_LIM
Peak FET power  P = V_IN × I_LIM        (at the start, when the FET drops the full rail)
Average FET power over the ramp ≈ V_IN × I_LIM / 2
Energy into the FET  E = (V_IN × I_LIM / 2) × (C × V_IN / I_LIM) = ½ C V_IN²
```

The `I_LIM` terms cancel. That is the identity in the opening paragraph: **the FET absorbs the capacitor's stored energy, and the current limit only sets how quickly.**

By slew rate. Some parts control the gate so the output ramps at a chosen `dV/dt` instead, and the current follows:

```
I = C × dV/dt
```

Same physics, different knob. A part that gives you `dV/dt` and a part that gives you `I_LIM` are setting the same operating point through different registers or resistors.

Worked, for a 12 V rail feeding 1,000 µF of bulk capacitance:

```
E = ½ × 1000 µF × (12 V)² = 72 mJ         (fixed, whatever the limit)

At I_LIM = 1 A:
  t = 1000 µF × 12 / 1     = 12 ms
  peak P = 12 × 1          = 12 W

At I_LIM = 10 A:
  t = 1000 µF × 12 / 10    = 1.2 ms
  peak P = 12 × 10         = 120 W
```

Both cases put 72 mJ into the FET. One does it as 12 W for 12 ms, the other as 120 W for 1.2 ms.

## Why a lower current limit is not automatically safer

A MOSFET's safe operating area is a set of curves of allowed power against duration. At short durations the limit is roughly constant energy, because the die's thermal mass absorbs the pulse. At longer durations it approaches a constant-power limit set by the package's thermal resistance, because the heat has to leave.

That shape has a consequence people get wrong: **there is a worst duration, often in the milliseconds.** Turning the current limit down to be conservative lengthens the pulse, and if the new duration sits where the SOA curve has already flattened toward its steady-state power limit, the design is less safe rather than more.

The procedure that actually works:

1. Compute `E = ½CV²` for the worst-case bulk capacitance, including everything downstream that is not disconnected.
2. Choose a candidate `I_LIM`, then compute `t = CV/I_LIM` and `P_peak = V × I_LIM`.
3. Plot that point against the FET's SOA curve for the case temperature you will actually see, not 25 °C.
4. Repeat for two or three current limits and choose the point with the most margin, rather than the smallest current.
5. Check the same point against the controller's fault timer, so a legitimate start-up is not read as a fault.

Step three is the one that gets skipped, and step five is the one that produces a board that never finishes starting: a current limit low enough to keep the FET happy can take longer than the controller's overcurrent timeout, so the controller declares a fault every time power is applied.

Two further cautions. SOA curves are specified at a stated case temperature and derate with it, so a hot enclosure shrinks the region you were relying on. And repetitive events are not equivalent to single pulses: a board that is hot-plugged frequently, or an auto-retry part cycling into a fault, accumulates heating that single-pulse SOA does not describe.

## Fault response is an ordering-code digit

The clearest example in this category is one part number apart. `LM5069-1` latches off when it detects a fault and stays off until the host clears it. `LM5069-2` restarts automatically at a fixed duty cycle. Same function, same package, same pinout.

Which one you want is a system decision, not a performance one:

- **Latch-off** suits a design where a fault means something is broken and repeatedly energising it makes things worse. It needs a host that can notice and clear the latch.
- **Auto-retry** suits an unattended design where the fault may be transient, such as a connector being inserted slowly. It also means a genuinely shorted load will be re-energised forever at the retry duty cycle, which the FET's repetitive rating has to tolerate.

The sourcing consequence is the one to remember. A substitution that matches on every parameter and differs in this digit changes system behaviour rather than performance, and nothing in a parametric search will flag it. This is the same class of trap as a supervisor's threshold suffix, described in the [supervisor versus internal BOR comparison](/blog/supervisor-vs-internal-bor-vs-rc-reset), and it was one of the findings recorded when the [power switch and hot-swap sourcing guide](/blog/power-switch-hot-swap-sourcing-guide) was written.

## What an eFuse gives you, and what it takes away

An eFuse integrates the pass FET, the current sensing and the protection logic. What that removes is the entire SOA exercise above: the vendor has matched the FET to the protection behaviour, and you cannot get it wrong because you cannot change it.

What you accept in exchange:

- **A bounded operating envelope.** The integrated FET fixes the maximum current and voltage. Most parts sit at or below 60 V, and current ratings run from under an amp to the low tens.
- **No choice of FET.** If your load capacitance is unusually large, the ramp may exceed what the integrated device can absorb, and the answer is a different eFuse rather than a bigger FET.
- **Less visibility.** Some parts expose fault status and current monitoring; some do not.

For a 12 V or 24 V board with a few amps of load, the eFuse is usually the right answer now, and the availability data below is a large part of why.

## What a discrete soft-start does not do

An RC network on a MOSFET gate slows the turn-on and limits inrush. It is genuinely useful. It is not protection.

There is no current limit, so a shorted load pulls whatever the upstream supply can deliver. There is no fault flag, so nothing downstream learns that anything happened. There is no timer, so the distinction between a long legitimate ramp and a sustained fault does not exist. And the FET still has to survive the same `½CV²`, with the added difficulty that an RC ramp does not hold current constant, so the peak power is less predictable than under a real current limit.

Where it is defensible: a low-voltage, low-current rail with modest capacitance, downstream of protection that already exists, where the only goal is to stop a connector arcing or a supply drooping. It is also the only option with no obsolescence exposure at all, which is a real consideration for a design that must be buildable in twenty years.

## What the catalogue says

Measured 2026-08-11. `hot-swap-controllers` holds 2,193 part numbers at 44% inactive, and `power-distribution-switches` 6,768 at 41%. The interesting structure is inside those averages.

By vendor lineage, within hot-swap controllers:

| Manufacturer | Part numbers | Inactive | Rate |
| --- | ---: | ---: | ---: |
| Linear Technology | 610 | 63 | **10%** |
| Texas Instruments | 242 | 78 | 32% |
| Rochester Electronics | 270 | 100 | 37% |
| Maxim Integrated | 391 | 210 | 54% |
| Microchip | 199 | 165 | **83%** |
| Intersil | 383 | 326 | **85%** |

Same category, same function, and an 8.5× spread between the healthiest and the worst. Linear's range sits inside Analog Devices and is being maintained; Intersil's sits inside Renesas and is being pruned, consistent with the concentration measured in the [August 2026 obsolescence watch](/blog/obsolescence-watch-2026-08). **In this category, checking the lineage tells you more than checking the specification.**

By family:

| Family | Type | Part numbers | Inactive | Last-time buy |
| --- | --- | ---: | ---: | ---: |
| `TPS259x` | eFuse | 120 | **0%** | — |
| `TPS255x` | eFuse / load switch | 48 | **0%** | — |
| `TPS26xx` | eFuse | 44 | **0%** | — |
| `TPS16xx` | eFuse | 8 | **0%** | — |
| `TPS2490/1` | Hot-swap controller | 7 | **0%** | — |
| `LTC4211` | Hot-swap controller | 12 | **0%** | — |
| `ADM117x`, `ADM127x` | Hot-swap controller | 6 | **0%** | — |
| `LM5066` | Hot-swap controller | 8 | **0%** | — |
| `SLG59` | Load switch | 72 | 1% | — |
| `LTC4215` | Hot-swap controller | 19 | 5% | — |
| `LM5069` | Hot-swap controller | 9 | 22% | — |
| `MIC2005` | Load switch | 23 | 26% | — |
| `MIC2545` | Load switch | 18 | 33% | — |
| `MIC2591` | Hot-swap controller | 4 | 50% | — |
| `LTC4282` | Hot-swap controller | 6 | 67% | **4** |
| `LTC4245` | Hot-swap controller | 8 | 88% | **7** |
| **`LTC4238`** | **Hot-swap controller** | 12 | **100%** | **12** |
| `MAX5945` | PoE controller | 4 | **100%** | — |

Two conclusions.

The eFuse families are entirely healthy. 220 ordering codes across four TI families, none inactive. For a new design inside their voltage and current envelope, that is the strongest availability position in the whole comparison, and it comes with the SOA problem solved.

`LTC4238` is the item to act on. All twelve ordering codes are in a last-time-buy window, not merely obsolete, which means orders are still being accepted and will not be. `LTC4245` at 88% with seven codes in the window and `LTC4282` at 67% with four are the same story a step behind. These three were flagged as a last-time-buy wave when the [power switch and hot-swap guide](/blog/power-switch-hot-swap-sourcing-guide) was written, and they have moved further since. If any of them is on a bill of materials you still build, the quantity arithmetic in [last-time-buy quantity and storage](/blog/last-time-buy-quantity-and-storage) applies now.

A note on reading families here, because it caught us during measurement. The `AP22` prefix mixes Diodes Incorporated load switches with `AP2204` and `AP2210` **linear regulators**, so a rate quoted on that prefix describes neither. The same discipline applies as with MachXO2 and with Cypress synchronous versus dual-port SRAM: confirm what a prefix contains before quoting a number from it.

## Choosing

| If the binding constraint is | Use | Reason |
| --- | --- | --- |
| ≤ 60 V, up to ~10 A, standard bulk capacitance | **eFuse** | SOA solved by the vendor; 0% inactive across 220 codes |
| Above 60 V, or tens of amps | **Hot-swap controller + external FET** | Only option that scales; you own the SOA analysis |
| Very large bulk capacitance | **Controller + FET** | Lets you pick a FET with the SOA the ramp needs |
| Fault status must reach a host | **Either IC option** | A discrete soft-start reports nothing |
| Unattended equipment, transient faults expected | **Auto-retry ordering code** | Check the FET's repetitive rating |
| Fault means something is broken | **Latch-off ordering code** | Needs a host to clear it |
| Only stopping connector arc on a small rail | **Discrete soft-start** | Cheapest, and no part to obsolete |
| Must be buildable in twenty years with no IC risk | **Discrete soft-start**, if the function permits | No obsolescence exposure |
| Replacing an obsolete controller | **Check lineage first** | 10% inactive at Linear against 85% at Intersil |

Per-part status is on the [hot-swap controller](/category/hot-swap-controllers) and [power distribution switch](/category/power-distribution-switches) category pages. An [RFQ](/rfq) will confirm a specific ordering code, including aftermarket sources: Rochester Electronics holds 270 part numbers in this category, which is where some discontinued controllers remain available.

## Frequently asked questions

### Does lowering the current limit make the inrush safer?

Not necessarily, and this is the most useful thing in this article. The FET absorbs `½CV²` whatever the limit, so halving the limit halves the peak power and doubles the duration. A MOSFET's SOA is roughly constant-energy at short durations and constant-power at long ones, so a longer, gentler pulse can sit further outside the curve than a shorter, harder one. Plot two or three candidate limits against the SOA at your real case temperature and pick the one with margin.

### How do I calculate the inrush energy?

`E = ½ C V_IN²`, using the worst-case total bulk capacitance downstream of the switch. For a 12 V rail into 1,000 µF that is 72 mJ. Then choose a current limit and compute the duration as `t = C V_IN / I_LIM` and the peak power as `V_IN × I_LIM`, which for 1 A gives 12 ms at 12 W and for 10 A gives 1.2 ms at 120 W.

### Why does my board declare a fault every time it powers up?

The ramp is probably taking longer than the controller's overcurrent timer allows. A current limit chosen to protect the FET stretches the start-up, and if that exceeds the fault timeout the controller cannot distinguish a legitimate charge from a sustained overload. Check the ramp time against the timer, which is usually set by a capacitor, and adjust one or the other.

### What is the difference between an eFuse and a hot-swap controller?

The FET. An eFuse integrates it, so the vendor has matched device and protection and the SOA question does not arise, at the cost of a fixed current and voltage envelope, typically 60 V and below. A hot-swap controller drives a FET you choose, which scales to hundreds of volts and tens of amps and makes the SOA analysis your responsibility.

### Is a discrete RC soft-start ever acceptable?

For inrush only, on a low-voltage rail with modest capacitance, downstream of protection that already exists. It provides no current limit, no fault reporting and no timer, so a shorted load is limited only by the upstream supply. Its one unique advantage is that it contains no IC to go obsolete, which matters for a design with a very long build horizon.

### What has to match when replacing a hot-swap controller?

Current-limit setting method and range, `dV/dt` or timer programming, undervoltage and overvoltage thresholds, whether the part supports reverse blocking, and the fault-response option. That last one is the trap: `LM5069-1` latches off and `LM5069-2` auto-retries, and the difference is invisible to a parametric search while changing how the system behaves during a fault.

### Which families are safest for a new design?

The TI eFuse families measure 0% inactive across 220 ordering codes, and among controllers `TPS2490/1`, `LTC4211`, `LM5066` and the `ADM117x`/`ADM127x` parts also measure 0%. Avoid starting on `LTC4238`, `LTC4245` or `LTC4282`, all of which have ordering codes in a last-time-buy window right now, and check vendor lineage before trusting a category-level figure: Linear's range measures 10% inactive against Intersil's 85%.

### My controller is obsolete and the board cannot change. What are the options?

Search the base ordering code as a prefix rather than an exact string, and search the pre-merger vendor name as well as the current owner, since Linear, Intersil, Maxim and Micrel material now sits under different companies. Rochester Electronics holds 270 part numbers in this category at a 37% inactive rate, better than several original manufacturers, so the aftermarket is a real path. If nothing exists, a controller-plus-FET design is usually reproducible from a different vendor's part with a resistor value change, because the programming methods are conventional even where the parts are not interchangeable.

## Sources

Availability figures are our own measurement across 719,342 catalogue part numbers,
dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`. SOA curves,
fault timing and programming methods are device-specific: **take them from the
datasheet for the parts you are fitting**, and note that SOA is specified at a
stated case temperature and derates with it.

- Analog Devices, *Understanding, Using, and Selecting Hot-Swap Controllers* —
  inrush control, SOA and the external-FET selection process.
  [analog.com](https://www.analog.com/en/resources/technical-articles/understanding-using-and-selecting-hotswap-controllers.html)
- Texas Instruments, `TPS2490` and `LM5069` datasheets — programmable current limit
  and power limiting, and the `-1` versus `-2` latch-off/auto-retry distinction used
  as the worked example above. [ti.com](https://www.ti.com/product/LM5069)
- MOSFET manufacturer SOA curves for the specific device, at the case temperature
  your enclosure produces, plus any repetitive-pulse rating if the design retries.
