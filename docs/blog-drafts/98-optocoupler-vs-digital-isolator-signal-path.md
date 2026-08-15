---
title: "Optocoupler vs Digital Isolator for an Industrial Signal Path: Wear-Out and Availability Are Different Questions"
slug: "optocoupler-vs-digital-isolator-signal-path"
status: "draft"
seoTitle: "Optocoupler vs Digital Isolator: LED Wear-Out vs Measured Availability"
seoDesc: "An optocoupler has a wear-out mechanism a CMOS isolator does not. But a current optocoupler family measures 4% obsolete against 75% for one digital isolator family — technology is not the predictor."
seoKeywords: "optocoupler vs digital isolator, CTR degradation LED aging, optocoupler wear out mechanism, HCPL obsolete replacement, ADuM availability, isolated amplifier selection, CMTI forward current trade-off"
tags: "comparison, isolation, optocoupler, digital isolator, reliability, design for availability"
author: "FPGACenter Engineering Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "ACPL-C87AT-000E, ACPL-C79A-000E, HCPL-7510-500E, ADUM7702BRWZ-RL7, ADUM4070ARIZ, AMC1305M25DWR, ISO1211DR, ISO7330FCDW"
---

# Optocoupler vs Digital Isolator for an Industrial Signal Path: Wear-Out and Availability Are Different Questions

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~16 minutes
> **Topics**: CTR degradation as a design-life constraint, the forward-current trade-off, why technology does not predict availability, what to check on a substitution

---

**An optocoupler contains a wear-out mechanism that a CMOS isolator does not, and that is a design-life argument rather than a sourcing one.** The two get conflated constantly, usually in the direction of "digital isolators are replacing optocouplers, so optocouplers are dying." Measured across our catalogue on 2026-08-11, that inference is wrong: Broadcom's current `ACPL-` optocoupler range is **4% inactive** across 57 ordering codes, while the Skyworks `Si82xx` isolated-driver family is **75% inactive** across 24. A digital isolator family can be far less available than an optocoupler family.

So there are two questions, they have different answers, and they need to be asked separately. Will the part still meet its specification after fifteen years in your enclosure? And will you still be able to buy it? This article does the first with the physics and the second with the measurement.

## Key takeaways

- The optocoupler's wear-out mechanism is real: LED light output falls with time and temperature, current transfer ratio falls with it, and eventually the output stage no longer switches.
- CTR degradation depends partly on LED forward current, which creates a direct trade-off: more drive current gives better common-mode transient immunity and shorter LED life.
- Design the input drive for end-of-life CTR, not the datasheet's initial value. Published guidance puts typical degradation at up to about 10% over 30 field years, with automotive qualification requiring no more than 20% at 125 °C.
- CMOS isolators have no equivalent wear-out mechanism, plus tighter input thresholds and better parametric stability over temperature.
- **Technology does not predict availability.** `ACPL-` optocouplers measure 4% inactive; `Si82xx` digital isolators measure 75%. Generation and vendor commitment predict it.
- The legacy optocoupler families are the ones being pruned: `HCPL-` 36% inactive, Toshiba `TLP` 37%.
- Isolated amplifiers are the healthiest group we hold: `AMC13x` 0% inactive across 74 codes.
- A substitution has to match creepage and clearance, isolation rating, CMTI, propagation delay and its skew, and the safety approvals the certificate names.

---

## What actually wears out

An optocoupler transfers a signal by turning current into light and light back into current. The emitter is an LED, and an LED's light output for a given forward current falls over its life. Published work on the mechanism attributes it to degradation inside the emitter that reduces luminous efficiency, and it accelerates with junction temperature.

The parameter that carries the effect into your circuit is current transfer ratio: output current divided by input current. As light output falls, CTR falls. The failure is not sudden. The output stage keeps switching until CTR has fallen far enough that the available output current no longer drives the load to a valid level, and then the channel stops working, in the field, years after qualification.

Three consequences for design.

CTR already has a wide initial tolerance, often specified as a range rather than a value, and the degradation is on top of that. A design that works with a typical part can fail with a part at the bottom of the distribution after aging.

Design for end-of-life CTR. Take the minimum initial CTR, apply the degradation you expect over the service life at your junction temperature, and check that the output still meets the load with margin. Published figures put typical degradation at no more than about 10% over 30 field years for common LED types, with automotive requirements demanding no more than a 20% drop at 125 °C — useful anchors, but the number that matters is the one in the datasheet for the part you are fitting, because vendors differ.

Junction temperature is a design variable you control. The LED's own dissipation adds to ambient, so a lower forward current means a cooler LED and slower degradation. Which leads directly to the trade-off nobody puts on the front page.

## The forward-current trade-off

Common-mode transient immunity is a measure of how large a fast common-mode step the isolator can reject without producing a false output. For an optocoupler, higher LED drive current gives more output-stage margin against that disturbance, so CMTI improves with drive.

And LED degradation rate rises with forward current.

```
More forward current  →  better CMTI, shorter LED life
Less forward current  →  longer LED life, worse CMTI
```

This is a genuine engineering trade with no free direction. It is specific to the optocoupler. On an industrial board with a motor drive nearby, the common-mode steps are large and CMTI is not optional, which pushes drive current up and life down. A CMOS isolator sidesteps the whole trade because its immunity comes from the barrier and receiver design rather than from how hard you drive an emitter.

Two practical notes. Vendor guidance is to select the forward-current operating range with the light-output degradation in mind, which means the drive resistor is a reliability component, not just a level-setting one. And if the input is driven from a logic output whose voltage varies, the current varies with it, so the range has to be checked at both supply extremes.

## Where the CMOS isolator wins, and where it does not

CMOS isolators pass the signal across a capacitive or magnetic barrier with driver and receiver circuits on each side. What that buys:

- No LED, so no light-output degradation and no CTR to drift.
- Tight input thresholds, because the input is a logic input rather than a current-driven diode.
- Better parametric stability across temperature and supply.
- Higher data rates and tighter propagation-delay skew, which matters when several channels must stay aligned.
- Multiple channels per package, often bidirectional.

What it does not buy:

- **Freedom from the availability question.** `Si82xx` at 75% inactive is the counterexample that makes this article's point.
- **A drop-in footprint.** Some parts are marketed as optocoupler replacements in the same package, and those are genuinely convenient; most are not pin-compatible with a 4- or 6-pin optocoupler.
- **Indifference to layout.** A capacitive or magnetic barrier lives in an electromagnetic environment, and the supply bypassing and layout guidance in the datasheet is not decoration.
- **The same certificate.** Isolation ratings and safety approvals are per-part, and the approvals your certificate names are the ones you need.

## What the catalogue says

Measured 2026-08-11. These are the isolation families we hold in quantity; the parts sit across several product categories because a device is filed by function rather than by isolation, so `HCPL-7510` is with the amplifiers and `ISO1211` with specialised ICs.

| Family | Technology | Part numbers | Not active |
| --- | --- | ---: | ---: |
| `AMC13x` (TI) | Isolated amplifier, CMOS | 74 | **0%** |
| `ISO7xxx` (TI) | Digital isolator | 2 | **0%** |
| `ADuM` (ADI) | Digital isolator, incl. isolated power | 65 | **2%** |
| `ACPL-` (Broadcom) | Optocoupler, current range | 57 | **4%** |
| `ISO12x` (TI) | Isolated digital input | 25 | 4% |
| `HCPL-` (Avago/Broadcom) | Optocoupler, legacy range | 78 | **36%** |
| `TLP` (Toshiba) | Photocoupler / isolated amplifier | 27 | 37% |
| **`Si82xx` (Skyworks)** | **Isolated driver, CMOS** | 24 | **75%** |

Read the table by technology and it says nothing coherent: the healthiest and one of the worst are both CMOS, and an optocoupler range sits between them at 4%. Read it by generation. It is obvious. `HCPL-` is the older Avago range; `ACPL-` is what Broadcom sells now. `Si82xx` is an earlier Skyworks generation. `AMC13x` and `ADuM` are current.

The rule this supports is the one to take away: check the ordering code's status, not the technology's reputation. A vendor's marketing position on optocouplers versus digital isolators tells you what they want to sell, not what you can buy in eight years.

Two things worth adding for anyone maintaining an older board.

This catalogue has essentially no jellybean optocouplers. `4N25`, `4N35`, `PC827`, `TLP18x`, `MOC30xx` and `SFH61x` return no parts, and `PC817` returns one. If a design needs a generic 4-pin phototransistor optocoupler, that is a distribution purchase rather than a specialist-sourcing one. It is not a part class we can quote depth on. What we hold is the isolation IC space: isolated amplifiers, isolated gate drivers, digital isolators, isolated digital inputs.

A prefix warning, because it nearly reached this article. `EL817` looks like the Everlight optocoupler of the same name. In our catalogue it matches 59 Intersil/Elantec `EL817x` **operational amplifiers**, filed under op-amps. A rate quoted on that prefix describes an amplifier family, not an optocoupler. Confirm what a prefix contains before quoting it: the same discipline that separated MachXO2 from MachXO and Cypress synchronous SRAM from dual-port.

## What to match on a substitution

Whether you are replacing an obsolete `HCPL-` part with a current `ACPL-` one, or moving from an optocoupler to a CMOS isolator, the same list applies. The first two are the ones that turn a substitution into a compliance problem rather than an engineering one.

1. **Isolation rating and the standard it is stated against.** Working voltage, transient rating and the test conditions. A number without its standard is not comparable.
2. **Safety approvals your certificate names.** If the product's file cites a specific component approval, the replacement needs the equivalent, and this is a documentation question with a lead time. Re-certification cost is the reason this ranks above performance, as set out in [the same EOL notice from five desks](/blog/same-eol-notice-five-desks).
3. **Creepage and clearance, on the part and on your board.** The package dimensions and the pad layout both contribute, so a physically smaller replacement can fail the spacing your design relied on.
4. **CMTI**, in the units and test conditions the original used.
5. **Propagation delay and, for multi-channel paths, delay skew.** An optocoupler's delay varies with drive current and temperature far more than a CMOS isolator's.
6. **Input drive**: current-driven diode versus logic-level input. This changes the upstream circuit, not just the isolator.
7. **Output structure**: open-collector, push-pull, or a differential output on an isolated amplifier. An open-collector output needs a pull-up whose value affects both speed and levels.
8. **Supply arrangement.** Some parts need a supply on both sides, which is why isolated-power variants exist; an optocoupler needs none on the input side.

Point 6 is the one that catches teams moving away from optocouplers. The drive circuit was designed to produce a forward current through a resistor, and a logic-input isolator wants a voltage. The isolator is a one-line BOM change and the drive circuit is a schematic change.

For the procurement side of these families, [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide) covers the wider category and [gate driver selection](/blog/gate-driver-selection-guide) covers the isolated-drive case specifically. Current status by part number is on the [op-amps](/category/op-amps) and [special-purpose ADC/DAC](/category/adc-dac-special) category pages, where most of these devices are filed, and an [RFQ](/rfq) will confirm a specific ordering code.

## Choosing

| If the binding constraint is | Choose | Reason |
| --- | --- | --- |
| Fifteen-year service life at high ambient | **CMOS isolator** | No LED to degrade; CTR drift is the optocoupler's wear-out path |
| Large common-mode transients and long life | **CMOS isolator** | Removes the CMTI-versus-LED-life trade entirely |
| Multi-channel with tight delay skew | **CMOS isolator** | Optocoupler delay varies with drive and temperature |
| Existing certificate names an optocoupler approval | **Current optocoupler** (`ACPL-`) | Avoids re-certification; measures 4% inactive |
| No supply available on the input side | **Optocoupler** | A diode needs no local rail |
| Isolated current or voltage sensing | **Isolated amplifier** (`AMC13x`) | 0% inactive, purpose-built for the job |
| Isolated digital input from 24 V field wiring | **Isolated digital input** (`ISO12x`) | Handles the field-side levels directly |
| Isolation plus power across the barrier | **Isolated-power digital isolator** (`ADuM` isoPower) | One part instead of a transformer plus isolator |
| Replacing an obsolete `HCPL-` part | **`ACPL-` equivalent first** | Same vendor lineage, current range, 4% inactive |
| Fifteen-year availability, either would work | **Check the ordering code** | Technology is not the predictor; 4% versus 75% proves it |

## Frequently asked questions

### Do optocouplers really wear out?

Yes, through the emitter. LED light output for a given forward current falls with time and accelerates with junction temperature, and current transfer ratio falls with it. The failure mode is gradual: the channel keeps working until CTR has dropped far enough that the output no longer reaches a valid level for the load, which can be years after qualification. CMOS isolators have no equivalent mechanism.

### How much CTR degradation should I design for?

Take the figure from the datasheet for the part you are fitting, at your junction temperature and service life, and apply it to the **minimum** initial CTR rather than the typical. Published anchors put typical degradation at up to roughly 10% over 30 field years for common LED types, and automotive qualification requires no more than a 20% drop at 125 °C. The point is to check the output current still drives the load at end of life, with margin.

### Why does more LED current make things worse?

It does both. Higher forward current improves common-mode transient immunity, because the output stage has more margin against a disturbance, and it accelerates light-output degradation, because the LED runs hotter and harder. That trade has no free direction, so the drive resistor is a reliability component. Choose the current from the CMTI you need and then check the resulting life, or move to a CMOS isolator where the trade does not exist.

### Are optocouplers being discontinued?

Not as a technology, and the measurement is clear about it. Broadcom's current `ACPL-` range is 4% inactive across 57 ordering codes, healthier than the `Si82xx` CMOS isolated-driver family at 75%. What is being pruned is the older generation: `HCPL-` at 36% and Toshiba `TLP` at 37%. Check the ordering code rather than reasoning from the technology.

### Is a digital isolator a drop-in replacement for an optocoupler?

Rarely, and the reason is usually the input rather than the footprint. An optocoupler input is a diode driven with current through a resistor; a CMOS isolator input is a logic input that wants a voltage, so the upstream circuit changes. Some parts are sold specifically as optocoupler replacements in compatible packages and are genuinely convenient, but check the input drive, the supply arrangement, the output structure and the isolation approvals before assuming.

### What is the highest-availability isolation part class you hold?

Isolated amplifiers. `AMC13x` measures 0% inactive across 74 ordering codes, and they are purpose-built for isolated current and voltage sensing in motor drives and power conversion. `ADuM` digital isolators at 2% and `ACPL-` optocouplers at 4% are close behind.

### Can I buy generic 4-pin optocouplers here?

Not with any depth. `4N25`, `4N35`, `PC827`, `TLP18x`, `MOC30xx` and `SFH61x` return no parts in our catalogue and `PC817` returns one, because those are broad-line distribution commodities rather than specialist-sourcing items. What we hold is the isolation IC space: isolated amplifiers, isolated gate drivers, digital isolators and isolated digital inputs, including obsolete `HCPL-` parts where aftermarket supply exists.

### What matters most when a certified product needs an isolator substitution?

The safety approvals named in the certificate, ahead of every electrical parameter. If the file cites a specific component approval, the replacement needs the equivalent approval and the documentation to prove it, which has a lead time measured in weeks and sometimes a re-test. Establish that constraint before shortlisting on performance, because it can eliminate every candidate that looked attractive electrically.

## Sources

Availability figures are our own measurement across 719,342 catalogue part numbers,
dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`. Degradation
rates, CMTI and isolation ratings are device-specific: **take them from the datasheet
and the component's safety approval, not from a category generalisation.**

- Texas Instruments, *Improve Your System Performance by Replacing Optocouplers with
  Digital Isolators* (SLLA526): the wear-out argument and the parametric comparison,
  from a vendor selling the replacement.
  [ti.com](https://www.ti.com/lit/wp/slla526d/slla526d.pdf)
- Skyworks / Silicon Labs, *Isolator vs. Optocoupler Technology*: CMTI, threshold
  stability and the absence of a CMOS wear-out mechanism.
  [skyworksinc.com](https://www.skyworksinc.com/-/media/Skyworks/SL/documents/public/white-papers/isolator-vs-optocoupler-technology.pdf)
- Analog Devices, *Digital Isolators Simplify Design and Ensure System Reliability* —
  barrier construction and channel-matching behaviour.
  [analog.com](https://www.analog.com/en/resources/technical-articles/digital-isolators-simplify-design-and-ensure-system-reliability.html)
- *CTR degradation and ageing problem of optocouplers*: the mechanism behind
  luminous-efficiency loss and its temperature dependence.
- *Gauging LED lifetime in optocouplers*: the forward-current versus service-life
  trade-off, and why the drive resistor is a reliability choice.
  [machinedesign.com](https://www.machinedesign.com/news/article/21829690/gauging-led-lifetime-in-optocouplers)
- **IEC 60747-5-5** for optocoupler safety ratings, and the component approvals your
  own product certificate names.
