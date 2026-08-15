---
title: "Power Switches and Hot-Swap Controllers: Auto-Retry and Latch-Off Are Different Products"
slug: "power-switch-hot-swap-sourcing-guide"
status: "draft"
seoTitle: "Power Distribution Switch and Hot-Swap Controller Sourcing Guide"
seoDesc: "8,961 parts at 41-44% inactive. Fault response modes, inrush and MOSFET SOA arithmetic, reverse-current blocking, and the Infineon smart-switch and LTC hot-swap last-time buys."
seoKeywords: "power distribution switch sourcing, hot swap controller replacement, auto retry vs latch off, TPS2553, LTC4245 last time buy, MOSFET SOA inrush, smart high side switch BTT6030, eFuse sourcing"
tags: "power switches, eFuse, hot swap, current limit, inrush, SOA, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Analog & Power Sourcing"
relatedProducts: "TPS2553DRVT-1, TPS2064CDGN-2, MIC94041YFL-TR, TPS2053ADR, LTC4210-4CS6#TRPBF, LTC4245IG#TRPBF, LTC4282IUH#TRPBF, ADM1075-1ACPZ"
---

# Power Switches and Hot-Swap Controllers: Auto-Retry and Latch-Off Are Different Products

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: fault response, current limit accuracy, inrush and SOA, reverse blocking, telemetry, obsolescence

---

**Two power switches with the same current rating, package and pinout can respond to a short circuit in opposite ways, and the part number suffix is the only clue.** One latches off and stays off until it is power-cycled or reset. The other limits current, heats up, thermally shuts down, cools, and tries again — indefinitely. In a design where the downstream fault is a shorted connector on a customer's desk, latch-off is correct and auto-retry is a fire-risk conversation. In a design where the fault is a capacitor inrush that the current limit mistakes for a short, auto-retry is correct and latch-off means an unbootable product. Our [power distribution switches](/category/power-distribution-switches) category holds 6,768 parts at **41% inactive**, and [hot-swap controllers](/category/hot-swap-controllers) 2,193 at **44%**, so the substitution question is common and the suffix is easy to overlook.

## Key takeaways

- **Fault response (auto-retry, latch-off, or continuous current limit) is usually a suffix, not a separate datasheet.** Getting it wrong changes system behaviour, not just performance.
- **The MOSFET's safe operating area, not its R_DS(on), governs inrush.** A hot-swap controller that ramps the gate faster than the original will destroy a FET that was correctly chosen.
- **Current-limit accuracy is often ±20-30%**, so the limit must sit above worst-case load and below the connector and cable rating simultaneously.
- **Reverse-current blocking is a distinct feature.** Without it, a higher voltage downstream back-feeds the supply.
- **`MIC20xx` runs 170 of 369 inactive (46%)** while `TPS20xx`/`TPS22xx` sit at 15-21%: a clear migration direction.
- **Infineon's automotive smart high-side switches are in a broad last-time buy**: the whole `BTT60xxx` group in our catalogue.
- **Analog Devices is pruning the LTC hot-swap line**: `LTC4245`, `LTC4282` and `LTC4238` variants are last-time buy.

---

## Fault response is the first specification

Three behaviours exist and they are not interchangeable.

| Response | What happens on overload | Suits |
| --- | --- | --- |
| **Constant current limit** | Output current is held at the limit; the switch dissipates the difference until thermal shutdown | Loads with large inrush that must still start |
| **Auto-retry (auto-restart)** | Latches off, waits, retries; repeats indefinitely | Transient faults, hot-plug ports, consumer USB |
| **Latch-off** | Shuts down and stays off until enable is toggled or power cycled | Hard faults that must be reported, safety-relevant loads |

The failure modes of a wrong choice are asymmetric:

Latch-off replacing auto-retry turns a recoverable inrush into a dead product. A load with a large bulk capacitor can look like a short for the first milliseconds; if the current limit trips and the part latches, the rail never comes up and the board appears bricked. The symptom is often intermittent — it depends on how discharged the capacitors were.

Auto-retry replacing latch-off leaves a faulted output cycling. Every retry dumps current-limited energy into the fault. On a connector with a bent pin, that is repeated heating of a fault the system has no way to report. Where the original design deliberately latched (most protected loads in industrial and medical equipment) this is a functional safety regression. It is invisible in normal operation.

Fault-flag behaviour differs alongside it: open-drain versus push-pull, active-high versus active-low, and whether the flag asserts during current limiting or only after shutdown. If a supervisor or an FPGA watches that pin, the polarity is part of the design, the output-structure question covered in [comparator selection](/blog/comparator-selection-guide).

In our catalogue the suffix carries this: `TPS2553DRVT-1` and `TPS2064CDGN-2` are examples where the trailing digit selects the variant. **Read the ordering table, not the family datasheet header.**

## Inrush, SOA, and why a faster ramp destroys the FET

In a hot-swap controller with an external MOSFET, the controller ramps the gate slowly so the FET dissipates the inrush energy in its linear region. That is the function, and the FET was chosen for it.

Worked, for a 12 V card with 470 µF of bulk capacitance and a controlled 1 V/ms slew:

```
inrush current  = C × dV/dt = 470 µF × 1,000 V/s = 0.47 A
ramp duration   = 12 V / (1 V/ms) = 12 ms
FET dissipation ≈ V_DS(avg) × I = (12/2) × 0.47 = 2.8 W
energy in the FET = 2.8 W × 12 ms = 34 mJ
```

That 34 mJ must fall inside the FET's safe operating area for a 12 ms pulse, which is a different curve from its continuous rating and is often the binding constraint on the FET choice.

Now substitute a controller that ramps at 10 V/ms:

```
inrush current  = 470 µF × 10,000 V/s = 4.7 A
ramp duration   = 1.2 ms
FET dissipation ≈ 6 × 4.7 = 28 W for 1.2 ms → 34 mJ
```

The energy is the same, but **28 W for 1.2 ms is a completely different point on the SOA curve than 2.8 W for 12 ms**, and many FETs that pass the first fail the second. The FET does not fail immediately; it degrades, and the board comes back months later.

So a hot-swap controller substitution must preserve the gate ramp rate (set by an internal current source and an external gate capacitor on most parts) or the FET must be re-selected against its SOA. This is the single most expensive mistake in this category. It is not visible in a functional test, because the first insertion works.

Related checks:

- **Circuit-breaker timer** (the delay before a sustained overcurrent shuts down), which must be longer than the inrush ramp and shorter than the FET's SOA limit.
- **Whether the controller has a foldback or a fixed limit** during start-up.
- **Undervoltage and overvoltage lockout thresholds**, which determine when insertion is allowed at all.

## Current-limit accuracy is a system budget

A current limit specified at "1 A" is typically ±20% to ±30%, and both ends of that tolerance have to be acceptable:

```
nominal limit         1.0 A
tolerance             ±25%
worst-case low        0.75 A  → must still exceed the maximum load current
worst-case high       1.25 A  → must stay below the connector, cable and fuse rating
```

A load drawing 0.8 A peak will trip a "1 A" switch that happens to sit at the low end of its tolerance. That is why the original design may have used a 1.5 A part for a 0.8 A load, and why a "closer" replacement is not better.

For programmable-limit parts, the limit is set by an external resistor and the accuracy of the *setting* is separate from the accuracy of the *sense*. A replacement with the same resistor and a different internal constant gives a different limit: the same class of error as the feedback-reference trap described in [DC-DC controller sourcing](/blog/dc-dc-controller-sourcing-guide).

## Reverse current, back-feeding and body diodes

A plain N-channel or P-channel switch conducts backwards through the MOSFET body diode when the output is higher than the input. Three situations make that matter:

- **Two supplies OR'd onto one rail** — battery and adapter, redundant feeds.
- **A load with significant capacitance and another source downstream**, which back-feeds during power-down.
- **Hot-swap insertion into a live bus**, where the bus voltage exceeds the card's decaying rail.

Reverse-current blocking is a distinct feature (either back-to-back FETs or an active comparator that turns the switch off) and a switch without it cannot substitute for one with it. In our data, `AUIPS1021RTRL` and the `BTS`/`BTT` smart-switch families include protection features of this class, and the plain load switches such as `MIC94041YFL-TR` do not.

Also check **output discharge**: some load switches actively pull the output down when disabled, which a design may depend on for a defined off state, and others leave it floating.

## Integrated switch, eFuse, or controller plus FET

Three architectures cover this space, and moving between them is a board change.

| | Integrated load switch / eFuse | Hot-swap controller + external FET | Smart high-side switch |
| --- | --- | --- | --- |
| Current range | mA to a few A | A to tens of A | A to tens of A, automotive |
| FET | Internal | **External, chosen for SOA** | Internal, with protection |
| Diagnostics | Fault flag | Flag, sometimes I²C telemetry | Current sense output, fault flag |
| Typical parts here | `TPS2553`, `TPS2064`, `MIC94041`, `AP22xx`, `FPF` series | `LTC4210`, `LTC4223`, `LTC4245`, `ADM1075` | `BTS`/`BTT` (Infineon), `AUIPS` |
| Substitution risk | Suffix behaviour | **FET SOA and ramp rate** | Automotive qualification |

Telemetry is the modern differentiator and a firmware dependency. `LTC4282IUH#TRPBF` and `ADM1075-1ACPZ` provide current and voltage measurement over a serial bus with a register map that host software reads. A replacement without telemetry, or with a different register map, breaks the management software, not the power path. **That makes it an easy specification to miss when comparing power ratings.**

## What is disappearing, and where to migrate

| Family | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `TPS20xx` | 429 | 65 | 15% |
| `TPS22xx` | 299 | 63 | 21% |
| `AP22xx` | 83 | 1 | 1% |
| `SLG5xxx` | 95 | 1 | 1% |
| `FPF` | 151 | 34 | 23% |
| `MIC20xx` | 369 | **170** | **46%** |
| `NCP38xx` | 27 | 10 | 37% |
| `TPS24xx` (hot swap) | 62 | 0 | 0% |
| `UCC39xx` (hot swap) | 51 | 30 | 59% |

Reading it:

The Micrel `MIC20xx` line is the highest-risk family at 46%, following the Micrel-to-Microchip transition and subsequent rationalisation. The natural migration is to `TPS20xx`/`TPS22xx` or `AP22xx`, subject to the fault-response and current-limit checks above.

Infineon's automotive smart switches are in a broad last-time buy. Our catalogue shows `BTT60101EKAXUMA1`, `BTT60201EKAXUMA1`, `BTT60301EKAXUMA1`, `BTT60302EKAXUMA1`, `BTT60302EKBXUMA1`, `BTT60501EKAXUMA1`, `BTT60502EKAXUMA1` and `AUIPS2051LTR` all in that state, with `BTS50060-1TEA` and `TLE6228GPAUMA2` already obsolete. **For an automotive or industrial design using these, this is a decision that cannot be deferred**, because requalifying a replacement in an automotive product is a months-long exercise — see [AEC-Q100 vs industrial grade](/blog/aec-q100-vs-industrial-grade-mcu) for what that qualification actually means.

Analog Devices is pruning the LTC hot-swap range. `LTC4245IG#TRPBF`, `LTC4245IUHF#TRPBF`, `LTC4245CUHF#TRPBF`, `LTC4282IUH#TRPBF`, `LTC4282CUH#TRPBF`, `LTC4238CUFD#TRPBF` and `LTC4238HGN#TRPBF` are last-time buy; `LTC4227IUFD-1#PBF` is obsolete. These are multi-rail and telemetry-capable hot-swap parts used in AdvancedTCA, PCIe and server backplanes, and their replacements differ in register map, so the migration includes firmware.

Legacy PC-era switches are gone entirely: `TPS2221PWPR` and `TPS2206ADAPR` (PCMCIA/CardBus power switches) and `TPS2053ADR`, `TPS2053AD`, `LM3525MX-H` (USB port switches of that generation) are obsolete in our catalogue. The functions still exist in modern parts, but not with the same pinouts.

## Sourcing and inspection

Vendor spread is unusually wide here — STMicroelectronics 1,007, Texas Instruments 882, Microchip 723, Infineon 658, Rochester Electronics 653, Diodes 537 in the switch category; Linear Technology 610, Maxim 391, Intersil 383 in hot swap. That breadth is good news: for a general-purpose load switch there is usually a live alternative from another vendor, provided the behavioural checks are done.

Incoming inspection should test the fault behaviour, not just conduction:

- Measure R_DS(on) at rated current, and the current limit with a controlled load.
- **Force a sustained overload and observe what the part does** — latch, retry, or hold. This single test verifies the suffix.
- Check the fault flag's polarity and timing relative to shutdown.
- On hot-swap controllers, verify the gate ramp rate with a scope on the FET gate, because that is what protects the FET.
- Confirm reverse-blocking behaviour by driving the output above the input through a current-limited source.

Package and marking checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide), and lot consistency matters here because these parts sit in the supply path — see [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Fault response: latch-off, auto-retry, current limit | Dead product, or a fault that cycles forever |
| 2 | Fault flag polarity, structure and timing | Supervisor misreads the fault |
| 3 | Current-limit value **and tolerance band** | Nuisance trips, or connector overheating |
| 4 | Programmable-limit constant vs the existing resistor | Wrong limit |
| 5 | Gate ramp rate (hot swap) vs FET SOA | FET degrades and fails later |
| 6 | Circuit-breaker timer vs inrush duration | Trips on start-up, or too slow to protect |
| 7 | Reverse-current blocking present | Back-feeding through the body diode |
| 8 | Output discharge when disabled | Undefined off state |
| 9 | UVLO / OVLO thresholds | Insertion permitted at the wrong voltage |
| 10 | Telemetry presence and register map | Management software breaks |
| 11 | Thermal path and package (R_θJA) | Thermal shutdown at rated current |
| 12 | Automotive qualification, if applicable | Requalification required |

## FAQ

### What is the difference between auto-retry and latch-off power switches?

How they behave after an overcurrent fault. An auto-retry part shuts down, waits, and turns back on repeatedly for as long as the fault persists. A latch-off part shuts down and stays off until its enable pin is toggled or the supply is cycled. Auto-retry suits transient faults and hot-plug ports where the load must recover by itself; latch-off suits hard faults that must be reported and not repeatedly energised. The choice is usually encoded in a suffix digit rather than in separate datasheets, which is how it gets substituted by accident.

### Why did my board stop booting after fitting a "compatible" load switch?

Most likely you fitted a latch-off variant where an auto-retry or current-limiting one belonged. A load with substantial bulk capacitance looks like a short for the first milliseconds; if the current limit trips and the part latches, the rail never comes up. The symptom is often intermittent because it depends on how discharged the capacitors were at power-up. Check the suffix against the original ordering code and confirm the fault behaviour on a bench with a controlled overload.

### Why does a faster gate ramp destroy the MOSFET in a hot-swap circuit?

Because the FET's safe operating area is time-dependent, and the same inrush energy delivered faster is a different, harsher point on the curve. Charging 470 µF to 12 V at 1 V/ms puts about 2.8 W into the FET for 12 ms; at 10 V/ms it is roughly 28 W for 1.2 ms. The energy is the same 34 mJ, but many FETs that survive the first fail the second. The FET usually does not fail on the first insertion — it degrades, and returns as a field failure months later, which is why this substitution error is so expensive.

### How accurate is a current limit specification?

Typically ±20% to ±30% unless the datasheet says otherwise, and both extremes matter. A part nominally limiting at 1 A may trip at 0.75 A, which must still be above your maximum load, or allow 1.25 A, which must stay within the connector, cable and upstream fuse ratings. This is why a design with an 0.8 A load may legitimately use a 1.5 A switch, and why substituting a "closer" 1 A part is a downgrade rather than an optimisation.

### Do I need reverse-current blocking?

Only if the output can ever sit above the input, but that situation is more common than it looks. It occurs when two sources are OR'd onto a rail, when a downstream supply back-feeds during power-down, and when a card is inserted into a live bus while its own rail is still decaying. A plain switch conducts backwards through the MOSFET body diode in all three cases. Blocking is implemented either with back-to-back FETs or an active comparator, and a switch without it cannot replace one that has it.

### What is going end of life in this category?

Two significant groups. Infineon's automotive smart high-side switches are in a broad last-time buy: the whole `BTT60xxx` group in our catalogue plus `AUIPS2051LTR`, with `BTS50060-1TEA` and `TLE6228GPAUMA2` already obsolete. Analog Devices is pruning the LTC hot-swap line, with `LTC4245`, `LTC4282` and `LTC4238` variants last-time buy and `LTC4227IUFD-1#PBF` obsolete. Among general-purpose load switches, the Micrel `MIC20xx` family is the highest risk at 170 of 369 part numbers inactive.

### Can I replace a hot-swap controller with an integrated eFuse?

Sometimes. It is often an improvement, but it is a board change, not a substitution. An eFuse contains its own FET, so the external MOSFET, its gate capacitor and the sense resistor all come off the board, and the current rating is then fixed by the eFuse rather than by your FET choice. Check that the eFuse's current limit, ramp rate and fault behaviour match what the system needs, and note that most eFuses have lower current capability than a controller driving a well-chosen discrete FET.

### What should incoming inspection check on a power switch?

Fault behaviour above all. Apply a sustained overload and observe whether the part latches, retries or holds current — that single test verifies the suffix, which no marking inspection can. Then measure R_DS(on) at rated current, the actual current limit into a controlled load, and the fault flag's polarity and timing. On hot-swap controllers, scope the FET gate to confirm the ramp rate, since that is what protects the external MOSFET, and verify reverse-blocking by driving the output above the input from a current-limited source.

## Related reading

Cluster context: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) as the pillar, [DC-DC controller sourcing](/blog/dc-dc-controller-sourcing-guide), [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide), [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide), and [LDO cross-reference](/blog/ldo-cross-reference-guide).

Adjacent: [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) for the sequencing these switches implement, [gate driver selection](/blog/gate-driver-selection-guide) for external-FET drive, [AEC-Q100 vs industrial grade](/blog/aec-q100-vs-industrial-grade-mcu) for the automotive requalification question, and [flip-flops, latches and registers](/blog/flip-flop-latch-register-sourcing-guide) for the I_off and power-up three-state concepts that live insertion also depends on.

Send us the part number with the load's inrush capacitance and whether a fault must latch or recover, and we will filter the suffixes for you; that is where this category hides its incompatibilities.

[**Submit an RFQ**](/rfq) | [**Browse power distribution switches**](/category/power-distribution-switches) | [**Browse hot-swap controllers**](/category/hot-swap-controllers) | [**Upload a BOM**](/bom)
