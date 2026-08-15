---
title: "Gate Driver Selection: Peak Current, Dead Time and the Bootstrap Trap"
slug: "gate-driver-selection-guide"
status: "draft"
seoTitle: "Gate Driver Selection & Substitution: Peak Current, Dead Time"
seoDesc: "Gate driver substitution destroys FETs when it goes wrong. Peak source/sink current, propagation delay matching, dead time, bootstrap refresh, UVLO and negative transients explained."
seoKeywords: "gate driver selection, half bridge driver, bootstrap gate driver, dead time, TC4427, LM5109, gate driver UVLO, isolated gate driver, MOSFET driver substitution"
tags: "gate driver, MOSFET, IGBT, half bridge, bootstrap, dead time, power, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Interface & Logic Sourcing"
relatedProducts: "TC4427EOA, NCP81071BDR2G, LM5109BMAX, DGD0636MS28-13, MC33151PG"
---

# Gate Driver Selection: Peak Current, Dead Time and the Bootstrap Trap

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: gate drivers, peak current, dead time, bootstrap, UVLO, shoot-through

---

**A gate driver substitution that goes wrong does not produce a subtle fault — it destroys the power stage.** Shoot-through in a half bridge is a direct short across the DC bus lasting until something fails, and it takes microseconds. The parameters that prevent it — dead time, propagation delay matching, undervoltage lockout, negative-transient tolerance — are exactly the ones a headline comparison omits. Gate drivers account for 6,266 part numbers in our catalogue with 36% discontinued, so this substitution comes up regularly and deserves care.

## Key takeaways

- **Peak source and sink current set switching speed and loss**, and are frequently asymmetric — sink is usually stronger.
- **Dead time is either internal, externally programmed, or absent.** Substituting an internally-dead-timed part for one without it changes the timing the controller expects.
- **Propagation delay matching between channels matters more than absolute delay** in a half bridge.
- **Bootstrap high-side supplies need a refresh cycle**: a driver cannot hold the high side on indefinitely, which constrains maximum duty cycle.
- **UVLO thresholds differ between MOSFET and IGBT drivers**, and a wrong threshold lets a device conduct partially enhanced.
- **Negative VS transient tolerance is a real specification** on half-bridge drivers and a common cause of unexplained failures.

---

## Driver types, and picking the right class

| Type | Typical use | Key characteristic |
| --- | --- | --- |
| **Low-side only** | Buck low-side, synchronous rectifiers, solenoids | Simple, ground-referenced |
| **Dual low-side** | Two independent channels | Channels may be inverting/non-inverting |
| **Half-bridge (bootstrap)** | Buck, half/full bridge, motor drive | High side floats on the switch node |
| **Half-bridge (isolated supply)** | High-voltage, high duty cycle | Needs an isolated bias supply |
| **Isolated (optical / magnetic / capacitive)** | Mains-referenced, IGBT, traction | Galvanic barrier, safety rating |
| **Level-shift high-voltage** | Offline SMPS, motor drive | Rated to hundreds of volts |

Representative parts in our catalogue: `TC4427EOA` (dual low-side), `NCP81071BDR2G` (high-speed low-side), `LM5109BMAX` (half-bridge, now discontinued), `DGD0636MS28-13`, and `MC33151PG` through authorised aftermarket.

Substituting across classes is a redesign. A low-side driver cannot replace a half-bridge driver, and a bootstrap half-bridge driver cannot replace one with an isolated supply if the duty cycle demands it.

## 1. Peak current: what it actually determines

Peak source and sink current set how fast the gate charge moves, and therefore switching time and switching loss.

The relationship is approximate but useful:

```
t_switch ≈ Q_g / I_peak
```

For a MOSFET with 30 nC total gate charge driven by a 2 A driver:

```
t ≈ 30e-9 / 2 = 15 ns
```

Halve the driver current and switching time doubles, which roughly doubles switching loss at the same frequency. At 500 kHz that can be the difference between a warm FET and a failed one.

Three details that matter:

- **Source and sink are usually asymmetric.** Sink current is typically stronger, because turning off fast matters more for avoiding shoot-through than turning on fast.
- **The rating is peak, into a specified load, at a specified supply.** Real current is limited by the driver's output impedance plus any external gate resistor.
- **More is not automatically better.** Faster edges mean higher dV/dt, which increases EMI and can induce false turn-on in the opposite device through Miller capacitance.

**Check:** peak source and sink current of both parts, against the gate charge of the actual FET and the switching frequency.

## 2. Dead time and shoot-through

In a half bridge, if both devices conduct simultaneously the DC bus is shorted. Dead time (the enforced gap between one turning off and the other turning on) prevents it.

Three arrangements exist:

| Arrangement | Where dead time comes from | Substitution risk |
| --- | --- | --- |
| **Internal, fixed** | Built into the driver | Replacement with different value changes timing |
| **Internal, programmable** | Set by a resistor on a DT pin | Replacement without the pin loses the setting |
| **None** | Controller must provide it | **Replacement with internal dead time adds delay** |

The dangerous direction is removing it. A design whose controller emits complementary PWM with no dead time, relying entirely on the driver, will shoot through if the replacement driver lacks internal dead time.

The subtler direction is also real: adding internal dead time to a design where the controller already provides it produces *more* dead time than intended, which increases output distortion in motor drives and reduces achievable duty cycle.

Also check cross-conduction protection — some drivers actively prevent both outputs being high regardless of input, which is a separate feature from dead time.

## 3. Propagation delay and matching

**Absolute propagation delay affects control loop timing; delay *matching* between the two channels affects whether the bridge survives.**

If the high-side channel is 20 ns slower to turn off than the low-side is to turn on, the effective dead time is reduced by 20 ns. Where the design's dead time margin is small, a driver with worse matching eats it.

Datasheets specify:
- **Propagation delay** for each channel, turn-on and turn-off.
- **Delay matching** between channels, which is the number to compare.

A replacement with the same nominal delay but worse matching is a real risk.

## 4. The bootstrap trap

A bootstrap high-side supply is charged only while the low side is on. The bootstrap capacitor is refilled through a diode from the low-side supply during each low-side conduction period.

Consequences that catch people:

- **There is a maximum duty cycle.** If the low side never turns on, the bootstrap capacitor never recharges, the high-side supply collapses, and the high-side device stops being driven properly — partially enhanced, dissipating heavily. **100% duty cycle is impossible with a bootstrap supply.**
- **There is a minimum switching frequency.** At very low frequencies the capacitor discharges through the driver's quiescent current between refreshes.
- **Startup requires an initial charge cycle.** Some designs need the low side pulsed before the high side can be used.
- **The bootstrap diode matters** — its reverse recovery and voltage rating are part of the design, and some drivers integrate it while others do not. **Substituting a driver with an integrated bootstrap diode for one without leaves the high side unsupplied.**

Where the application needs high or 100% duty cycle, an isolated bias supply or a charge-pump driver is required, not a bootstrap part.

## 5. UVLO thresholds

Undervoltage lockout prevents the driver from operating when its supply is too low to fully enhance the power device.

The threshold is matched to the device technology:

| Device | Typical UVLO |
| --- | --- |
| Standard MOSFET (10 V gate) | ~8–9 V |
| Logic-level MOSFET (4.5 V gate) | ~4 V |
| IGBT (15 V gate) | ~12 V |
| GaN | Device-specific, often tight window |

A driver with a lower UVLO than the design requires will allow the power device to conduct while only partially enhanced — high RDS(on), high dissipation, and thermal failure. This is a substitution hazard whenever the replacement targets a different device technology. It is easy to miss because the driver works fine at nominal supply.

GaN deserves separate mention: gate voltage windows are narrow and the maximum is close to the operating value, so a driver not specified for GaN can destroy the device.

## 6. Negative VS transients

On a half bridge, the switch node can swing below ground during commutation because of parasitic inductance in the power loop. The driver's VS pin sees that negative excursion.

Drivers specify a tolerance — for example −5 V for 500 ns. Exceeding it can cause the level-shift circuitry to malfunction, producing missed or spurious pulses, which in a bridge means shoot-through.

This is a frequent cause of "unexplained" gate driver and FET failures. It is layout-dependent, so a driver substitution with lower negative-transient tolerance can fail on a board that worked with the original.

## 7. Input logic and other details

- **Input threshold** — CMOS or TTL, and whether it is referenced to VDD or a separate VDDI on parts with a logic-side supply.
- **Inverting versus non-inverting**, and whether the two channels differ. Getting this wrong is immediate and destructive.
- **Enable and shutdown pin** behaviour and its state during power-up.
- **Input filtering** for noise immunity, which varies.
- **Output stage structure** — whether separate source and sink pins are provided for independent gate resistor control.

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Driver class (low-side, half-bridge, isolated) | Wrong topology entirely |
| 2 | Peak source and sink current vs gate charge | Slow switching, excess loss |
| 3 | Dead time: internal, programmable or absent | **Shoot-through** |
| 4 | Cross-conduction protection presence | Shoot-through under fault |
| 5 | Propagation delay matching between channels | Reduced effective dead time |
| 6 | Bootstrap vs isolated supply, and max duty cycle | High side collapses at high duty |
| 7 | Integrated bootstrap diode present or not | High side unsupplied |
| 8 | UVLO threshold vs device technology | Partially enhanced device, thermal failure |
| 9 | Negative VS transient tolerance | Spurious pulses, shoot-through |
| 10 | Inverting/non-inverting and enable polarity | Immediate destruction |

Items 3, 9 and 10 destroy hardware. They deserve verification before power is applied, not after.

## Sourcing notes

Gate drivers are **6,266 part numbers at 36% discontinued** in our catalogue. `LM5109BMAX` is an example of a half-bridge part already gone, while `TC4427EOA`, `NCP81071BDR2G` and `DGD0636MS28-13` remain current. `MC33151PG` comes through Rochester Electronics, which is typical for the older Motorola/ON lineage.

Because a gate driver failure destroys the power stage, **bench verification before a production build is not optional**. At minimum: confirm dead time on a scope with both gate signals captured, confirm UVLO by ramping the supply, and confirm the bootstrap refreshes at maximum intended duty cycle.

For the wider decision on whether to substitute at all, see [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts); for the channel, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## FAQ

### What peak current does a gate driver need?

Enough to move the power device's gate charge in the desired switching time, approximated by switching time equals gate charge divided by peak current. A MOSFET with 30 nC of gate charge driven at 2 A switches in roughly 15 ns. Halving the drive current doubles switching time and roughly doubles switching loss at the same frequency. Note that source and sink currents are usually asymmetric, with sink typically stronger because fast turn-off matters more for avoiding shoot-through.

### What is dead time and why does it matter for substitution?

Dead time is the enforced gap between one device in a half bridge turning off and the other turning on, preventing both from conducting simultaneously and shorting the DC bus. It may be fixed internally in the driver, programmable via a resistor, or absent entirely with the controller responsible. The dangerous substitution is fitting a driver without internal dead time into a design whose controller emits complementary PWM and relies on the driver to provide it: the result is shoot-through.

### Why can't a bootstrap gate driver run at 100% duty cycle?

Because the bootstrap capacitor that supplies the high-side driver is recharged only while the low-side device is conducting. If the low side never turns on, the capacitor is never refilled, the high-side supply decays, and the high-side device ends up only partially enhanced — conducting with high resistance and dissipating heavily. Applications requiring very high or continuous duty cycle need an isolated bias supply or a charge-pump driver instead.

### What happens if the UVLO threshold is wrong?

The driver will operate at a supply voltage too low to fully enhance the power device, so the device conducts with high on-resistance and dissipates heavily, typically failing thermally. UVLO thresholds are matched to device technology — around 8 to 9 V for standard MOSFETs, 4 V for logic-level parts, 12 V for IGBTs. A substitution targeting a different technology can easily bring the wrong threshold, and the fault is invisible at nominal supply voltage.

### What are negative VS transients and why do they destroy gate drivers?

During commutation in a half bridge, parasitic inductance in the power loop causes the switch node to swing below ground, and the driver's VS pin sees that excursion. Drivers specify a tolerance, such as −5 V for 500 ns. Exceeding it can disrupt the internal level-shift circuitry, producing missed or spurious output pulses, which in a bridge means shoot-through. Because the magnitude depends on layout, a replacement with lower tolerance can fail on a board where the original worked.

### Does propagation delay matching matter more than absolute delay?

For a half bridge, yes. Absolute delay affects control loop timing, but mismatch between the two channels directly consumes dead time: if the high side turns off 20 ns later than specified relative to the low side turning on, effective dead time shrinks by 20 ns. A replacement with the same nominal propagation delay but worse channel-to-channel matching can therefore be significantly more dangerous.

### Can I use a stronger gate driver than the original?

Only with attention to the consequences. Faster switching reduces switching loss but increases dV/dt, which raises conducted and radiated emissions and can induce false turn-on in the opposite device through Miller capacitance in a bridge. If the design passed EMC with the original driver, a substantially stronger replacement invalidates that result. Where more current is available than needed, an external gate resistor can moderate it.

### Do I need an isolated gate driver?

Where the power stage is referenced to a hazardous voltage, where safety standards require galvanic separation, or where the common-mode voltage between control and power sides exceeds what a level-shift driver tolerates. Isolated drivers are common in mains-referenced converters, IGBT traction inverters and battery systems. They require a supply on each side of the barrier, have a different pinout, and carry an isolation voltage rating, so they are not interchangeable with level-shift parts.

## Related reading

The cross-cutting framework for interface parts is in [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide). Where the power stage itself is being resourced, [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide) covers the surrounding converter considerations. For the substitute-or-buy decision, [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

Send us the part number with your gate charge, switching frequency and topology, and we will come back with candidates that will not take the power stage with them.

[**Submit an RFQ**](/rfq) | [**Browse gate drivers**](/category/gate-drivers) | [**Upload a BOM**](/bom)
