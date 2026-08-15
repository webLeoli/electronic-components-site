---
title: "Motor Drivers: Decay Mode Changes the Sound of the Machine"
slug: "motor-driver-sourcing-guide"
status: "draft"
seoTitle: "Motor Driver Sourcing: Decay Modes, Bipolar vs MOSFET Bridges, Current Limits"
seoDesc: "4,295 motor driver parts at 38% inactive. Why L298 and a MOSFET bridge are not equivalent, how decay mode changes noise and accuracy, and the Freescale H-bridge wind-down."
seoKeywords: "motor driver sourcing, L298 replacement MOSFET bridge, stepper decay mode mixed slow fast, DRV8825 sourcing, MPC17529 last time buy, H bridge thermal RDSon, stall detection, current chopping"
tags: "motor drivers, H-bridge, stepper, BLDC, decay mode, current chopping, thermal, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Analog & Power Sourcing"
relatedProducts: "DRV8824PWP, DRV8711DCP, STSPIN820, A3981KLPTR-T, A4955KLPTR-T, VNH5050ATR-E, MPC17529EJ, LM628N-8/NOPB"
---

# Motor Drivers: Decay Mode Changes the Sound of the Machine

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: decay modes, bipolar vs MOSFET bridges, current regulation, thermal limits, interfaces, obsolescence

---

**Two stepper drivers with the same current rating, microstepping resolution and step/direction interface can make a machine sound and feel completely different, because of how they let current decay during the off portion of each chopping cycle.** Slow decay is quiet and smooth at low speed but loses current regulation at high step rates; fast decay controls current tightly and produces audible whine and more ripple heating; mixed decay is a compromise whose crossover point differs between parts. On a production machine that has been tuned and signed off, a substitution that changes decay behaviour changes vibration, noise and positional accuracy — none of which appears on a datasheet comparison. Our [motor drivers category](/category/motor-drivers) holds **4,295 part numbers with 1,615 no longer active (38%)**, and the modern integrated families are healthy while the 1990s bipolar and Freescale H-bridge lines are not.

## Key takeaways

- **Decay mode is a behavioural specification.** Slow, fast and mixed decay change audible noise, vibration and current accuracy at speed.
- **`L298`-class bipolar bridges drop about 2 V; a MOSFET bridge drops a few hundred millivolts.** Replacing one changes motor current, torque and thermals at once.
- **Thermal resistance decides the real current rating** — worked below, a bridge that is fine with its pad soldered thermally shuts down without it.
- **Integrated-FET driver, gate driver plus external FETs, and smart automotive bridge are three different architectures.**
- **Current-regulation method matters**: fixed off-time chopping, fixed frequency PWM, or none at all (voltage drive).
- **Freescale/NXP `MPC175xx` H-bridges are in last-time buy** — `MPC17529EJ`, `MPC17531ATEP`, `MPC17510AEJ` and variants in our catalogue.
- **`DRV8xxx` is the healthiest family we hold** at 4 of 373 inactive (1%), which makes it the usual migration target.
- **Motion controllers such as `LM628` are gone**, and their function moves into firmware.

---

## Decay mode, and why the machine sounds different

A current-controlled driver chops: it drives current up to the target, then turns off part of the bridge and lets the current decay before driving again. How it turns off is the decay mode.

| Mode | Bridge state during off-time | Current decays | Consequence |
| --- | --- | --- | --- |
| **Slow decay** (brake) | Both low-side FETs on, motor shorted | Slowly, through the winding and FETs | Quiet, smooth at low speed; **poor regulation at high step rates** |
| **Fast decay** | Bridge reversed, current forced back to the supply | Rapidly | Tight regulation; **audible whine, more ripple heating** |
| **Mixed decay** | Slow for part of the off-time, then fast | In two phases | Compromise; **crossover point differs per part** |

In a stepper application the practical differences are:

- At **low speed and fine microstepping**, slow decay produces less audible noise and less ripple current, but the current can fail to reach the commanded value on falling steps, distorting the microstep waveform and causing positional error.
- At **high step rates**, slow decay cannot bring current down fast enough between steps, so the motor loses torque and may stall in a way that looks like a mechanical problem.
- **Fast decay** regulates well but injects ripple back into the supply and makes the machine whine at the chopping frequency.

So a substitution that changes the default or available decay modes changes machine behaviour, and the effect is most visible in exactly the applications where it matters most — 3D printers, pick-and-place heads, medical pumps, scanning stages. If the original design selected a mode by strapping a pin or writing a register, confirm the replacement offers the same mode with the same timing.

Related: **blanking time and off-time** (the fixed period after each drive pulse before current is re-sensed) affect minimum achievable current and audible behaviour. Two parts with the same decay modes and different off-times behave differently at low current.

## Bipolar bridge versus MOSFET bridge

The `L293`/`L298` generation used bipolar Darlington outputs with roughly a 2 V total drop; modern MOSFET bridges drop a few hundred millivolts. Substituting is usually an upgrade and always a change.

Worked, for a 24 V supply driving a motor whose winding resistance is 10 Ω, with the driver in voltage mode:

```
L298-class bridge:   I = (24 − 2.0) / 10 = 2.20 A
MOSFET bridge, R_DS(on) total 0.5 Ω:
                     I = 24 / (10 + 0.5) = 2.29 A
```

Only 4% more current, but the loss distribution changes completely:

```
L298-class:  P_driver = 2.0 V × 2.20 A = 4.4 W  in the driver
MOSFET:      P_driver = 2.29² × 0.5   = 2.6 W  in the driver
```

And in a current-regulated design the effect is larger, because the driver's voltage drop no longer limits current: the regulation loop does, so the motor may now receive its full commanded current where previously it was starved. **Torque increases, which is usually welcome, and heating increases with it, which may not be.**

Three checks when replacing a bipolar bridge:

- **The sense resistor value and the reference voltage**, which set the regulated current. A different driver's sense scaling gives a different current for the same resistor.
- **Flyback diodes.** The `L293D` includes them; the `L293` does not, and a MOSFET bridge relies on the FET body diodes. If the board has external diodes chosen for the old part, they may now be redundant or wrongly sized.
- **Minimum supply voltage.** MOSFET bridges usually work at lower supply voltages than Darlington ones: an advantage, unless the design relied on the drop for something.

## The thermal rating is the real current rating

A motor driver's headline current is a silicon capability; the package decides what you get.

Worked, for an H-bridge with 0.5 Ω total on-resistance (high-side plus low-side) at 1.5 A RMS:

```
P = I² × R = 1.5² × 0.5 = 1.125 W

with thermal pad soldered:     R_θJA = 40 °C/W → ΔT = 45 °C
without pad connection:        R_θJA = 100 °C/W → ΔT = 112 °C
```

At 25 °C ambient the second case reaches a 137 °C junction and will hit thermal shutdown under any additional load or ambient rise. The part is not defective; the board is not providing the thermal path the datasheet assumed.

This matters for substitution in two ways:

A replacement in a different package (`PowerPAD` versus plain TSSOP, DFN with an exposed pad versus SOIC) has a different thermal resistance, so the same nameplate current is not the same delivered current.

A replacement with higher on-resistance raises dissipation as the square of current. A driver with 0.8 Ω instead of 0.5 Ω dissipates 1.8 W instead of 1.125 W at the same current: a 60% increase, which is often the difference between working and cycling on thermal shutdown.

Also check the **peak versus RMS versus continuous rating convention**, which varies by vendor: some quote peak per phase, some RMS per bridge, and comparing across conventions overstates or understates capability by up to a factor of two.

## Three architectures, three substitution risks

| | Integrated FET driver | Gate driver + external FETs | Smart automotive bridge |
| --- | --- | --- | --- |
| Current range | Up to a few amps | Tens of amps | Amps to tens of amps |
| FET choice | Internal | **Yours, and it must match the driver** | Internal |
| Examples here | `DRV8824PWP`, `STSPIN820`, `A4955KLPTR-T` | `DRV8711DCP`, `A3981KLPTR-T` | `VNH5050ATR-E`, `TLE`/`BTS` families |
| Diagnostics | Fault pin, sometimes SPI | SPI status registers | Current sense output, fault flag |
| Substitution risk | Package thermal, decay modes | **Gate drive vs FET charge, dead time** | Automotive qualification |

Moving between architectures is a redesign. Replacing an integrated driver with a gate-driver-plus-FETs solution adds four to six FETs, gate resistors and a layout constraint; the reverse removes the ability to scale current. And on the gate-driver path, the drive current versus FET gate charge relationship and the dead-time provision are exactly the issues set out in [gate driver selection](/blog/gate-driver-selection-guide) — including the point that removing dead time causes shoot-through, which in a motor bridge means a shorted supply.

## Interface and protection: the firmware-visible parts

Motor drivers present one of several control interfaces, and they are not compatible.

| Interface | What the host provides | Substitution impact |
| --- | --- | --- |
| **Step / direction** | Two pins, one pulse per microstep | Microstep resolution and pin strapping must match |
| **PWM / phase (or IN1/IN2)** | Direct bridge control | Host must generate commutation |
| **Parallel logic (`ENABLE`, `PHASE`)** | Simple, no current control | — |
| **SPI** | Register configuration and diagnostics | **Register map is a firmware dependency** |
| **Hall / sensorless BLDC** | Commutation from sensors or back-EMF | Sensor arrangement must match |

Microstepping resolution is set by pins or registers, and the available set differs: 1/16 and 1/32 are common, 1/256 is not universal. A replacement with a coarser maximum changes motion smoothness; one with a different pin encoding changes the strapping.

Protection features are also firmware-visible:

- **Overcurrent and short-circuit protection**, latching or auto-retry: the same distinction as in [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide).
- **Stall detection / back-EMF monitoring** on some parts, which if present may be the machine's only load-fault detection.
- **Open-load detection**, used to detect a disconnected motor.
- **Thermal warning versus thermal shutdown**: a warning flag lets firmware reduce duty before the driver cuts out; without it the machine simply stops.

Charge pump requirements matter on N-channel high-side designs: the part needs a bootstrap or charge-pump capacitor, and its value affects minimum duty cycle and low-speed behaviour.

## Sourcing notes

Vendor spread: Texas Instruments 568 part numbers, Rochester Electronics 534, onsemi 532, Allegro MicroSystems 375, ROHM 331, Microchip 217.

| Family prefix | Parts held | Not active | Rate |
| --- | ---: | ---: | ---: |
| `DRV8xxx` | 373 | 4 | **1%** |
| `A498x` (Allegro) | 14 | 0 | 0% |
| `TB67xxx` (Toshiba) | 72 | 1 | 1% |
| `LMD18xxx` | 7 | 0 | 0% |
| `L293` | 14 | 4 | 29% |
| `MC33xxx` | 73 | 38 | 52% |
| `UDNxxxx` | 9 | 9 | **100%** |

Three things worth acting on:

The modern integrated families are in good health (`DRV8xxx` at 1% inactive, Allegro and Toshiba equivalents similar) which makes migration straightforward provided the behavioural checks above are done.

The Freescale/NXP `MPC175xx` H-bridge line is in last-time buy: `MPC17529EJ`, `MPC17529EJR2`, `MPC17531ATEP`, `MPC17531ATEJ`, `MPC17510AEJ` and `MPC17510AEJR2` in our catalogue. These are small dual H-bridges used in cameras, drives and portable mechanisms, and there is no pin-compatible replacement; the migration is to a modern integrated driver with a different footprint. `TLE71851EXUMA1` and `TDA21801XUMA1` from Infineon and `TMCC160-LC` from Trinamic are also last-time buy.

Motion controllers have effectively disappeared. `LM628N-8/NOPB` is obsolete in our catalogue: a dedicated PID motion-control processor that took position commands over a parallel bus. `MC3PHACVFAE`, a three-phase motor-control processor, is also obsolete. **The function did not move to another IC; it moved into firmware on the host microcontroller**, which is a genuine redesign with control-loop work. That path is the same one described in [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller).

Also obsolete here: `MC33887VW`, `NCV7513BFTR2G`, `LB1909MC-BH`, `TLE52062SAKSA1`, `LV8804V-TLM-H`, `LV8807QA-MH`, `LV8281VR-TLM-H`; the onsemi/Sanyo `LV8xxx` group in particular is heavily affected.

Incoming inspection should exercise the bridge, not just power it:

- Measure on-resistance high-side and low-side at rated current.
- Verify current regulation at two setpoints against the sense resistor.
- **Confirm the decay mode behaviour on a scope across the winding**; this is the property most likely to differ and the least likely to be documented on a broker's paperwork.
- Check fault behaviour under a deliberate short: does it latch or retry.
- Verify thermal shutdown and recovery, and whether a warning flag precedes it.

Package-level checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Decay modes available and default | Machine noise, vibration and accuracy change |
| 2 | Blanking and off-time | Minimum current and low-speed behaviour change |
| 3 | Bipolar vs MOSFET output stage | Motor current, torque and thermals all shift |
| 4 | Sense resistor scaling and reference | Wrong regulated current |
| 5 | On-resistance and package thermal resistance | Thermal shutdown under load |
| 6 | Peak vs RMS vs continuous rating convention | Capability over- or under-stated |
| 7 | Architecture: integrated FET, gate driver, smart bridge | Board redesign required |
| 8 | Gate drive and dead time (external-FET parts) | Shoot-through — shorted supply |
| 9 | Interface: step/dir, PWM, SPI, Hall | Host cannot control the driver |
| 10 | Microstep resolution set and pin encoding | Motion smoothness, wrong strapping |
| 11 | Charge pump / bootstrap capacitor requirement | Poor low-speed or high-duty operation |
| 12 | Protection: latch vs retry, stall and open-load detection | Fault detection silently lost |
| 13 | Flyback diodes internal or external | Over-voltage on switch-off |
| 14 | Automotive qualification, if applicable | Requalification required |

## FAQ

### What is decay mode and why does it change how a machine sounds?

Decay mode is how a current-regulated driver turns off the bridge between chopping pulses. Slow decay shorts the winding through both low-side devices, so current falls gently — quiet and smooth at low speed, but too slow to follow falling microsteps at high step rates. Fast decay reverses the bridge and pushes current back to the supply, regulating tightly but producing audible whine and extra ripple heating. Mixed decay does both in sequence, with a crossover point that differs between parts. A substitution that changes the available or default mode changes vibration, noise and positional accuracy.

### Can I replace an L298 with a modern MOSFET H-bridge?

Usually yes, and usually as an improvement, but not as a like-for-like. The `L298`-class bipolar bridge drops about 2 V total, while a MOSFET bridge drops a few hundred millivolts, so in a voltage-driven design the motor receives more voltage and in a current-regulated design it can now actually reach the commanded current. Torque rises and so does heating. Also check the sense resistor scaling for the new driver, whether flyback diodes are internal or external (the `L293D` has them and the `L293` does not) and the new part's minimum supply voltage.

### Why does my motor driver hit thermal shutdown at less than its rated current?

Because the rating assumes a thermal path the board may not provide. An H-bridge with 0.5 Ω total on-resistance at 1.5 A dissipates 1.125 W; with the exposed pad properly soldered at 40 °C/W that is a 45 °C rise, but with a poor pad connection at 100 °C/W it is 112 °C, which reaches shutdown at any reasonable ambient. Check both the package's thermal resistance and whether your board implements the datasheet's recommended copper area and vias. A replacement in a different package changes the answer even at identical silicon.

### How do I compare current ratings between motor drivers?

Normalise the convention first, because vendors differ: some quote peak current per phase, some RMS per bridge, some continuous with a stated thermal condition. Comparing across conventions can overstate or understate capability by nearly a factor of two. Then work the thermal arithmetic for your own package and board — dissipation is I²R through the total on-resistance, and a driver with 0.8 Ω instead of 0.5 Ω dissipates 60% more at the same current, which is often the difference between operating and cycling on thermal shutdown.

### What replaces an obsolete LM628 motion controller?

Firmware on the host, not another chip. The `LM628` was a dedicated PID motion-control processor accepting position and velocity commands over a parallel bus, and the function has migrated into microcontroller firmware and FPGA logic rather than into a successor part. `MC3PHACVFAE`, the three-phase motor-control processor, is obsolete for the same reason. The replacement is therefore a control-loop implementation with encoder handling, trajectory generation and tuning: a genuine redesign, and one worth scoping properly rather than treating as a sourcing problem.

### Which motor driver families are at end of life?

The Freescale/NXP `MPC175xx` small H-bridges are in last-time buy (`MPC17529EJ`, `MPC17531ATEP`, `MPC17510AEJ` and their tape-and-reel variants) with no pin-compatible replacement, so migration means a new footprint. `TLE71851EXUMA1`, `TDA21801XUMA1` and Trinamic's `TMCC160-LC` are also last-time buy. Obsolete in our catalogue: `MC33887VW`, `NCV7513BFTR2G`, `LB1909MC-BH`, `TLE52062SAKSA1` and much of the onsemi/Sanyo `LV8xxx` group. By contrast `DRV8xxx` runs 1% inactive across 373 part numbers.

### Do I need to match microstepping resolution exactly?

You need to match what the machine's firmware and motion profile assume. Microstep resolution is set by strapping pins or registers, and the available set differs between parts — 1/16 and 1/32 are near-universal, 1/128 and 1/256 are not. A coarser maximum makes motion less smooth at low speed and changes the pulse rate needed for a given velocity; a different pin encoding means the same strapping selects a different resolution, which silently rescales every move the controller commands.

### What should incoming inspection check on a motor driver?

Exercise it rather than just powering it. Measure high-side and low-side on-resistance at rated current, verify current regulation at two setpoints against the actual sense resistor, and scope the current waveform across a winding to confirm the decay behaviour; that is the property most likely to differ from the original and least likely to be documented by a broker. Then force a short to check whether protection latches or retries, and confirm thermal shutdown and recovery, including whether a warning flag precedes it.

## Related reading

Cluster context: [analog and power second-sourcing](/blog/analog-power-second-sourcing-guide) as the pillar, [DC-DC controller sourcing](/blog/dc-dc-controller-sourcing-guide), [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide), [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide), [battery chargers and fuel gauges](/blog/battery-charger-management-sourcing-guide), and [AC-DC offline switchers](/blog/ac-dc-offline-switcher-sourcing-guide).

Adjacent: [gate driver selection](/blog/gate-driver-selection-guide) for external-FET bridges and the dead-time question, [migrating off an EOL microcontroller](/blog/migrating-off-eol-microcontroller) where the motion control moves into firmware, [AEC-Q100 vs industrial grade](/blog/aec-q100-vs-industrial-grade-mcu) for automotive bridges.

Send us the part number with the decay mode the machine was tuned with and the sense resistor value, and we will filter for parts that behave the same rather than just parts that fit.

[**Submit an RFQ**](/rfq) | [**Browse motor drivers**](/category/motor-drivers) | [**Upload a BOM**](/bom)
