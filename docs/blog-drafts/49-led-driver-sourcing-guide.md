---
title: "LED Driver Sourcing: Topology, Dimming and the Flicker Nobody Specified"
slug: "led-driver-sourcing-guide"
status: "draft"
seoTitle: "LED Driver Sourcing: Linear vs Switching, PWM & Analog Dimming"
seoDesc: "LED driver substitution changes brightness, colour and flicker. Topology, current accuracy, PWM vs analog dimming, dimming ratio, switching frequency and fault handling explained."
seoKeywords: "LED driver sourcing, constant current LED driver, PWM dimming, analog dimming, LED driver substitution, boost LED driver, MAX1576, LED flicker, dimming ratio"
tags: "LED driver, constant current, dimming, backlight, power, sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "AAT3177IWP-T1, MAX1576ETG+T, MAX1573ETE, PAM2803AAF095, SC445TETRT"
---

# LED Driver Sourcing: Topology, Dimming and the Flicker Nobody Specified

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: LED drivers, topology, current accuracy, dimming, flicker, fault handling

---

**An LED driver substitution changes what the product looks like, which makes it a marketing problem as well as an engineering one.** Current accuracy shifts brightness, channel matching shifts colour balance on multi-channel designs, and dimming method changes whether the display flickers on camera. None of these appear as a functional failure (the LEDs light) so they escape ordinary testing and are discovered by whoever reviews the first production units. LED drivers account for 6,422 part numbers in our catalogue at 32% discontinued, and this substitution comes up constantly in display and indicator designs.

## Key takeaways

- **Topology determines whether a substitution is even possible**: linear, buck, boost, buck-boost and charge pump need different external components.
- **Boost drivers must have Vout > Vin.** Substituting a boost for a buck in a design where the LED string voltage is below the supply produces no regulation.
- **Current accuracy sets brightness; channel matching sets colour.** A few percent mismatch is visible side by side.
- **PWM and analog dimming are not equivalent** — analog dimming shifts LED colour temperature, PWM does not.
- **PWM dimming frequency below about 1 kHz produces visible flicker on camera**, even when invisible to the eye.
- **Open- and short-LED fault behaviour differs**, and a boost driver with an open string can drive its output to destruction.

---

## Topology first

The topology determines the external components, so it determines whether a substitution is a part swap or a redesign.

| Topology | Requires | Vout vs Vin | Typical use |
| --- | --- | --- | --- |
| **Linear / ballast** | Resistor only | Vout < Vin | Indicators, low-power, low LED count |
| **Buck** | Inductor, diode/sync FET | Vout < Vin | High-current single strings from a higher rail |
| **Boost** | Inductor, diode | **Vout > Vin** | Series strings from a battery, backlights |
| **Buck-boost / SEPIC** | Inductor(s), diode | Either | Wide input range, e.g. battery across its discharge |
| **Charge pump** | Capacitors only | Fixed ratios | Small backlights, no inductor wanted |

Two directions of substitution that fail immediately:

- **Boost where the design needs buck.** A boost converter cannot regulate below its input; with Vin above the LED string voltage the output sits at Vin minus a diode drop and current is uncontrolled.
- **Charge pump where the design needs an inductive topology.** The board has no inductor footprint.

`PAM2803AAF095` is a typical inductive LED driver; `MAX1576ETG+T` and `MAX1573ETE` are charge-pump backlight drivers; `AAT3177IWP-T1` serves the small-display backlight role. **These are not interchangeable with one another** despite all being "LED drivers" of similar current capability.

## Current accuracy and channel matching

Two separate specifications, and they affect different things.

Absolute current accuracy (typically ±2% to ±10%) sets brightness. A 10% current difference is roughly a 10% luminous flux difference, which is noticeable when comparing a new unit against an old one but not usually objectionable on its own.

Channel-to-channel matching (typically ±1% to ±3%) sets uniformity. On a multi-channel backlight or an RGB indicator, mismatch between channels is directly visible as brightness variation across a display or as a colour shift.

RGB applications are the sensitive case. Colour balance depends on the ratio of the three channel currents. A driver with worse matching produces a visible tint difference between units, which for a product with a colour-critical display is a rejection.

**Check:** absolute accuracy for brightness continuity with existing production, and channel matching for uniformity and colour.

## Dimming: three methods that are not equivalent

| Method | How | Colour effect | Dimming ratio | Notes |
| --- | --- | --- | --- | --- |
| **PWM** | Switch full current on and off | **None** — colour stable | Very high (1000:1+) | Can flicker if frequency too low |
| **Analog** | Reduce the current | **Shifts colour temperature** | Limited (typically 10:1–100:1) | Silent, no flicker |
| **Hybrid** | Analog to a floor, PWM below | Partial shift | High | Vendor-specific behaviour |

The colour point matters. White LEDs are blue emitters with phosphor, and the conversion efficiency varies with drive current, so reducing current shifts the correlated colour temperature — typically warmer at low current. **A design that used PWM dimming and is substituted with an analog-dimming driver will change colour as it dims**, which for a display or a lighting product is a defect.

Dimming ratio is the ratio between maximum and minimum controllable brightness. PWM achieves very high ratios because the current is always either full or zero; analog is limited because at low currents the regulation loop loses accuracy. If a design specifies 1000:1 dimming, an analog-only driver cannot deliver it.

## The flicker problem

PWM dimming below roughly 1 kHz produces flicker that is invisible to the eye and obvious on camera.

Three thresholds worth knowing:

- **Below ~100 Hz** — visible flicker to many people, and a health concern in lighting applications.
- **~100 Hz to ~1 kHz** — generally invisible directly, but produces banding when filmed with a rolling-shutter camera, and can cause discomfort or headaches in some viewers.
- **Above a few kHz** — safe for camera and eye, but efficiency drops as switching and LED turn-on transitions become a larger fraction of the period, and the achievable dimming ratio falls.

A substitution that changes the PWM frequency changes the flicker behaviour. This matters far more than it used to: any product whose display might appear on video (instrumentation, medical equipment, automotive dashboards, machine HMIs) has a flicker requirement whether or not anyone wrote it down.

**Check:** the PWM frequency of both parts, whether it is fixed or externally set, and the intended viewing conditions.

## Fault handling

Open- and short-LED faults behave very differently by topology, and boost is the dangerous one.

Open LED on a boost driver. With the string open, the feedback loop sees no current, commands maximum duty cycle, and drives the output voltage up until something breaks down: the driver, the output capacitor, or the diode. **Overvoltage protection is therefore mandatory on boost LED drivers**, and its threshold must suit the string voltage plus margin.

Substituting a boost driver whose OVP threshold is higher than the original's, or absent, converts an open-LED fault from a detected condition into a destructive one.

Short LED. Reduces string voltage; the driver may or may not detect it. On multi-channel parts, a shorted channel can cause other channels to misbehave depending on the regulation scheme.

Thermal behaviour and current foldback also vary, and matter in enclosed products.

**Check:** OVP presence and threshold, open/short detection and reporting, and thermal protection behaviour.

## Other parameters

- **Switching frequency**, which sets inductor value and affects EMI: the same considerations as [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide).
- **Input voltage range**, particularly for battery designs where the range spans the discharge curve.
- **Maximum output current per channel and total**, including thermal derating in the actual package.
- **Control interface** — some drivers are controlled by a simple enable and analog input, others by I²C or a proprietary one-wire pulse-count protocol. **These are not interchangeable**: a one-wire-controlled driver replaced with an I²C part requires firmware and possibly a spare GPIO.
- **Startup and soft-start behaviour**, which affects inrush and visible turn-on ramp.
- **Quiescent and shutdown current**, for battery-powered products.

The control interface deserves emphasis. Small backlight drivers frequently use a pulse-count scheme on the enable pin — pulse it *n* times to select brightness level *n*. That is completely vendor-specific, and substituting a part with a different scheme or an I²C interface is a firmware change.

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Topology matches the board's external components | No regulation, or missing parts |
| 2 | Vout vs Vin relationship (boost cannot buck) | Uncontrolled current |
| 3 | Current accuracy vs existing production | Visible brightness step between units |
| 4 | Channel matching | Colour shift, uneven backlight |
| 5 | Dimming method (PWM vs analog) | Colour changes with brightness |
| 6 | Dimming ratio | Cannot reach specified minimum |
| 7 | PWM frequency | Camera flicker |
| 8 | OVP presence and threshold | **Destructive open-LED fault** |
| 9 | Control interface (enable, analog, I²C, one-wire) | Firmware change required |
| 10 | Switching frequency and EMC status | Emissions re-test |

## Sourcing notes

LED drivers are **6,422 part numbers at 32% discontinued**. The category churns because it tracks display and lighting technology, so parts designed around a specific backlight generation are retired when that generation passes.

Current parts include `AAT3177IWP-T1`, `PAM2803AAF095` and `MAX1576ETG+T`. `MAX1573ETE` comes through Rochester Electronics — authorised aftermarket, worth checking first for older backlight drivers. `SC445TETRT` carries **last-time-buy status**, which is a deadline: see [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) for sizing.

Verify substitutions visually, not only electrically. Put a new unit next to an existing one at several brightness levels, photograph both with a rolling-shutter camera to check flicker, and confirm colour at minimum dimming. Those three checks take an afternoon and catch what a bench measurement does not.

## FAQ

### Can I replace a buck LED driver with a boost one?

No. A boost converter can only produce an output voltage above its input, so if the LED string voltage is below the supply rail the loop cannot regulate and the output simply sits near the input voltage with uncontrolled current. Topology must match the relationship between the supply and the string voltage, and it also determines the external components: a boost design needs an inductor and diode that a linear or charge-pump board does not have.

### What is the difference between PWM and analog LED dimming?

PWM dimming switches the full drive current on and off rapidly, so the LED always operates at its rated current and the colour point stays constant, achieving very high dimming ratios. Analog dimming reduces the current itself, which is silent and flicker-free but shifts the correlated colour temperature of white LEDs (typically warmer at low current) and offers a much more limited dimming range because regulation accuracy degrades at low currents.

### Why does my LED display flicker on camera but not to the eye?

Because PWM dimming frequency below roughly 1 kHz is generally invisible directly but interacts with a rolling-shutter camera sensor to produce banding. Frequencies below about 100 Hz are visible to many people directly and are a health concern in lighting. If a substitution changed the driver's PWM frequency, flicker behaviour changes with it, which matters for any product whose display might be filmed, including instrumentation, medical equipment and vehicle dashboards.

### Why do LED colours look different after changing the driver?

Two possible causes. If the new driver uses analog rather than PWM dimming, white LEDs shift colour temperature as current is reduced, because phosphor conversion efficiency varies with drive current. Alternatively, on a multi-channel or RGB design, worse channel-to-channel current matching changes the ratio between channels, which directly changes the resulting colour. Channel matching of ±1% versus ±3% is visible when units are compared side by side.

### What happens if an LED string goes open circuit on a boost driver?

Without protection, the feedback loop sees no current, commands maximum duty cycle, and drives the output voltage upward until something breaks down — typically the driver, the output capacitor or the diode. Overvoltage protection is therefore essential on boost LED drivers, and its threshold must be set above the normal string voltage with margin but below the ratings of the surrounding components. A replacement with a higher or absent OVP threshold converts a detected fault into a destructive one.

### How do I check current accuracy matters for my design?

Compare absolute accuracy and channel matching separately. Absolute accuracy, typically ±2% to ±10%, determines brightness and matters mainly for consistency with units already in the field. Channel-to-channel matching, typically ±1% to ±3%, determines uniformity across a multi-channel backlight and colour balance in RGB applications, and is the specification that produces visible defects. For colour-critical displays, matching is the binding requirement.

### What is a one-wire LED driver interface?

A vendor-specific control scheme common in small backlight drivers, where the brightness level is selected by pulsing the enable pin a given number of times. It requires no extra pins and no bus, but the pulse timing and level mapping are entirely specific to the part. Substituting a driver that uses a different scheme, or one controlled over I²C, requires firmware changes and possibly an additional GPIO or bus connection.

### How should I verify an LED driver substitution?

Visually as well as electrically. Place a unit built with the new driver next to an existing one and compare brightness at several dimming levels, photograph both with a rolling-shutter camera to check for flicker banding, and check colour appearance at minimum brightness where analog dimming effects are strongest. Then confirm overvoltage protection by open-circuiting the string on a sacrificial board. These checks catch what bench measurements of current and efficiency do not.

## Related reading

The cross-cutting framework is in [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide). For the switching converter considerations that apply to inductive LED drivers, [replacing a discontinued DC-DC regulator](/blog/dc-dc-regulator-replacement-guide). Where a part carries last-time-buy status, [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), and for the channel decision, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number with your topology, string configuration and dimming requirements and we will come back with candidates that will look the same, not just measure the same.

[**Submit an RFQ**](/rfq) | [**Browse LED drivers**](/category/led-drivers) | [**Upload a BOM**](/bom)
