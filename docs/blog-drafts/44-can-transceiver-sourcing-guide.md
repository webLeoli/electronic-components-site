---
title: "CAN Transceiver Sourcing: Classic, FD, Fault-Tolerant and Isolated"
slug: "can-transceiver-sourcing-guide"
status: "draft"
seoTitle: "CAN Transceiver Sourcing: CAN FD, SIC, Fault-Tolerant Guide"
seoDesc: "CAN transceiver substitution: why CAN FD needs loop-delay-rated parts, TXD dominant timeout, split termination, low-speed fault-tolerant CAN, and automotive qualification."
seoKeywords: "CAN transceiver, TJA1050 replacement, SN65HVD230, MCP2551 substitute, CAN FD transceiver, fault tolerant CAN, ISO 11898, CAN SIC, isolated CAN"
tags: "CAN, CAN FD, transceiver, automotive, industrial bus, ISO 11898, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "SN65HVD230QDR, THVD1510DR, MAX487ECSA+T"
---

# CAN Transceiver Sourcing: Classic, FD, Fault-Tolerant and Isolated

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: CAN, CAN FD, fault-tolerant CAN, loop delay, TXD timeout, automotive

---

**A CAN transceiver that works perfectly at 500 kbps can make a CAN FD network unusable at 2 Mbps, and nothing in the classic datasheet tells you so.** Classic CAN transceivers were never specified for the loop-delay symmetry that CAN FD's faster data phase depends on, so substituting one into an FD network produces bit errors that scale with data rate. That is the single most consequential distinction in this family, and it sits alongside several others — fault-tolerant low-speed CAN, TXD dominant timeout, split termination and automotive qualification — that make apparently equivalent parts non-interchangeable.

## Key takeaways

- **CAN FD requires transceivers specified for loop-delay symmetry.** A classic transceiver may work at arbitration speed and fail in the data phase.
- **Low-speed fault-tolerant CAN is a different physical layer**, not a slower version of high-speed CAN. Different signalling, different termination.
- **TXD dominant timeout protects the bus from a stuck controller** — its presence and duration differ, and adding one can break a design that deliberately holds dominant.
- **Split termination needs a transceiver with a VSPLIT pin.** Substituting a part without one leaves the network unbiased.
- **Automotive-qualified variants are separate part numbers** with the change-control obligations described in [AEC-Q100](/blog/aec-q100-vs-industrial-grade-mcu).
- **Isolated CAN is a distinct product class** with different pinout, supplies and safety rating.

---

## The physical layers under one name

"CAN" covers three incompatible physical layers, and confusing them is the first sourcing hazard.

| Layer | Standard | Speed | Wiring | Typical use |
| --- | --- | --- | --- | --- |
| **High-speed CAN** | ISO 11898-2 | ≤ 1 Mbps (classic), ≤ 8 Mbps (FD data phase) | Twisted pair, 120 Ω both ends | Powertrain, industrial, most everything |
| **Low-speed fault-tolerant** | ISO 11898-3 | ≤ 125 kbps | Twisted pair, distributed termination | Body electronics, comfort systems |
| **Single-wire CAN** | SAE J2411 | ≤ 33 kbps | One wire plus ground | Legacy automotive body |

Low-speed fault-tolerant CAN continues to operate with one wire broken or shorted: the receiver switches to single-ended mode. That capability is the point of the physical layer and it requires a specific transceiver type. A high-speed transceiver dropped into a fault-tolerant network will not work at all: the termination scheme and signalling levels differ.

This distinction matters because part numbering does not always make it obvious, and both types appear in automotive bills of material.

## CAN FD: the loop-delay problem

This is the parameter that turns a working substitution into an intermittent network fault.

Classic CAN runs the whole frame at one bit rate, typically 500 kbps. CAN FD keeps arbitration at that rate but switches to a much higher rate (2, 5 or 8 Mbps) for the data field. At those speeds the transceiver's own propagation delay becomes a significant fraction of a bit time, and more importantly, **any asymmetry between the dominant-to-recessive and recessive-to-dominant delays eats directly into the sampling margin**.

Classic transceivers were never specified for this. A part rated for 1 Mbps classic CAN may have a loop-delay asymmetry that is entirely harmless at 500 kbps and destroys the eye at 5 Mbps.

The consequences of substituting a classic part into an FD network:

- **Arbitration works** (it runs at the slower rate) so the node appears on the bus.
- **Data-phase bit errors** appear as the data rate rises, producing error frames and retransmissions.
- **It gets worse with bus load and temperature**, so a lightly loaded bench network can look fine.

**Check:** whether the part is explicitly specified for CAN FD, and at what data rate. Look for a loop-delay symmetry specification. If the datasheet does not mention CAN FD, assume it is not qualified for it.

**CAN SIC** (Signal Improvement Capability) is the further step — transceivers that actively shape the recessive edge to suppress ringing, allowing higher FD data rates on imperfect topologies. A SIC part can generally replace a standard FD part; the reverse may not hold on a network that was only viable because of SIC.

## TXD dominant timeout

A protection feature whose presence or absence changes behaviour.

If the controller's TXD line becomes stuck low, the transceiver drives the bus dominant permanently and no other node can transmit: a single failure takes down the whole network. TXD dominant timeout detects this and releases the bus after a defined period.

Two substitution hazards, in both directions:

- **Original had it, replacement does not**: a stuck controller now takes out the bus. A reliability regression rather than a functional failure.
- **Original lacked it, replacement has it** — any design that deliberately holds dominant for longer than the timeout will now be interrupted. This is unusual but occurs in test modes and some diagnostic protocols.

Timeout durations vary between parts, typically from hundreds of microseconds to tens of milliseconds. Where the design relies on the specific duration, check it.

## Split termination and VSPLIT

Split termination improves the network's common-mode stability: instead of a single 120 Ω resistor at each end, two 60 Ω resistors in series with the midpoint capacitively coupled to ground, and often biased to half the supply.

Transceivers intended for this provide a **VSPLIT pin** that outputs a stable half-supply reference to bias that midpoint. A substitute without a VSPLIT pin leaves the midpoint unbiased, which degrades common-mode behaviour and can worsen emissions.

**Check:** whether the board uses split termination and whether the replacement provides the bias output.

## Standby, sleep and wake behaviour

Automotive CAN transceivers implement low-power modes with wake-up capability, and the details vary substantially.

- **Standby versus sleep**, with different current consumption and different wake sources.
- **Bus wake-up** — whether bus activity wakes the transceiver, and whether a specific wake pattern is required.
- **Local wake-up** via a dedicated pin.
- **INH output** to control an external regulator, present on some parts.
- **Wake-up reporting** — how the transceiver signals to the controller that it woke and why.

A substitution that changes any of these breaks the power-management behaviour of an ECU, which typically manifests as either failure to wake or excessive quiescent current: the latter discovered as flat batteries in the field.

## Other parameters

| Item | Why it matters |
| --- | --- |
| **Supply arrangement** | 5 V, 3.3 V, or dual-supply with separate VIO for the logic side |
| **Logic-side VIO** | A 5 V transceiver driven by a 3.3 V controller needs a VIO pin or level shifting |
| **Common-mode range** | Ground offsets between ECUs; typically ±12 V or wider |
| **Bus fault protection** | Survival of shorts to battery or ground — automotive requires this |
| **ESD rating** | Bus pins connect to vehicle or plant wiring |
| **Node loading** | Affects maximum node count, as with [RS-485](/blog/rs485-transceiver-sourcing-guide) |
| **AEC-Q100 grade** | Separate part number, separate supply — see [AEC-Q100 vs industrial](/blog/aec-q100-vs-industrial-grade-mcu) |

The VIO point catches people frequently. Many classic 5 V CAN transceivers have no separate logic-side supply, so a 3.3 V microcontroller may not meet the TXD input-high threshold reliably, and the RXD output may exceed the controller's input rating.

## Isolated CAN

A separate product class, used where ECUs sit on different ground references or where safety isolation is required — common in industrial CAN, battery management, and charging infrastructure.

An isolated transceiver contains a galvanic barrier, needs a supply on both sides (often with an integrated or external isolated DC-DC), has a different pinout, and carries an isolation voltage rating. **It is not a drop-in for a non-isolated part in either direction.**

## Sourcing notes

Roughly 370 CAN transceiver part numbers appear in our catalogue by prefix, within the broader Drivers/Receivers/Transceivers category of 19,068 parts at 34% discontinued.

`SN65HVD230QDR` is a widely used 3.3 V high-speed device and remains current. The NXP TJA family and Microchip MCP255x series are the other common lineages; older members of both have been superseded, and where a specific variant has gone, authorised aftermarket is worth checking before the open market — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Incoming test should verify differential output levels into the specified load, recessive and dominant thresholds, and (for FD-rated parts) loop delay and its symmetry, which is the specification a remarked classic part cannot meet.

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Physical layer: high-speed, fault-tolerant or single-wire | Does not communicate at all |
| 2 | CAN FD rating and loop-delay symmetry | Data-phase bit errors that scale with rate |
| 3 | CAN SIC, if the topology depends on it | Ringing limits achievable data rate |
| 4 | TXD dominant timeout presence and duration | Bus lockup, or interrupted deliberate dominant |
| 5 | VSPLIT pin, if split termination is used | Unbiased midpoint, worse common mode |
| 6 | Standby/sleep modes and wake behaviour | ECU fails to wake, or drains the battery |
| 7 | VIO / logic-side supply arrangement | Marginal thresholds with a 3.3 V controller |
| 8 | Bus fault protection and ESD rating | Field failures on vehicle wiring |
| 9 | AEC-Q100 grade, if required | Contractual non-compliance |
| 10 | Isolated vs non-isolated | Different part class entirely |

## FAQ

### Can I use a classic CAN transceiver in a CAN FD network?

Generally not safely. Classic transceivers were never specified for loop-delay symmetry, which becomes critical once the data phase runs at 2 Mbps or faster. Arbitration still works because it runs at the slower rate, so the node appears on the bus, but data-phase bit errors appear and worsen with data rate, bus load and temperature. Check whether the datasheet explicitly specifies CAN FD operation and states a loop-delay symmetry figure; if it does not mention FD, assume it is not qualified.

### What is CAN SIC and do I need it?

Signal Improvement Capability transceivers actively shape the recessive edge to suppress ringing caused by stubs and imperfect topology, allowing higher CAN FD data rates on networks that would otherwise be limited. A SIC part can generally replace a standard FD transceiver. The reverse is not always true: a network that only achieves its data rate because of SIC will degrade if a standard FD part is substituted.

### What is the difference between high-speed CAN and low-speed fault-tolerant CAN?

They are different physical layers, not speed grades of one. High-speed CAN, ISO 11898-2, uses a twisted pair terminated with 120 Ω at each end and runs up to 1 Mbps classic or faster with FD. Low-speed fault-tolerant CAN, ISO 11898-3, runs up to 125 kbps with distributed termination and continues operating with one wire broken or shorted by switching to single-ended reception. Their transceivers are not interchangeable in either direction.

### What is TXD dominant timeout and why does it matter?

It is a protection feature that releases the bus if the controller's TXD line becomes stuck low. Without it, a single failed controller drives the bus dominant permanently and prevents every other node from transmitting. Substituting a part without the timeout into a design that had one is a reliability regression; substituting one with a timeout into a design that deliberately holds dominant longer than the timeout (which occurs in some test and diagnostic modes) will interrupt that behaviour. Timeout durations also vary between parts.

### What is the VSPLIT pin on a CAN transceiver?

It provides a stable half-supply reference used to bias the midpoint of a split termination network, where two 60 Ω resistors replace the single 120 Ω terminator with the midpoint capacitively coupled to ground. This improves common-mode stability and emissions. If the board implements split termination and the replacement transceiver has no VSPLIT output, the midpoint is left unbiased, degrading common-mode behaviour.

### Why does my 3.3 V microcontroller have trouble driving a 5 V CAN transceiver?

Because many classic 5 V CAN transceivers have no separate logic-side supply pin, so their TXD input threshold is referenced to 5 V and a 3.3 V logic high may not reliably exceed it. The RXD output can also swing to 5 V and exceed the controller's input rating. Parts with a VIO pin solve this by referencing the logic side to the controller's supply; without one, level shifting is required.

### Are automotive CAN transceivers different from industrial ones?

The physical layer is the same, but automotive parts are AEC-Q100 qualified, which is a stress-test and change-control regime rather than merely a temperature rating. They also more commonly implement sophisticated low-power and wake-up behaviour, bus fault protection against shorts to battery voltage, and higher ESD ratings. Automotive variants are separate orderable part numbers with independent supply and typically longer production lifetimes.

### When do I need an isolated CAN transceiver?

Where nodes sit on different ground references beyond what the common-mode range tolerates, or where safety requires galvanic separation — common in industrial CAN, battery management systems and charging infrastructure. An isolated transceiver contains a galvanic barrier, requires a supply on each side of it, has a different pinout, and carries an isolation voltage rating. It is a distinct product class and not interchangeable with a non-isolated part.

## Related reading

The cross-cutting framework is in [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide), and the closest relative is [RS-485 transceiver sourcing](/blog/rs485-transceiver-sourcing-guide), which shares the unit-load and common-mode concerns. For automotive qualification, [AEC-Q100 vs industrial grade](/blog/aec-q100-vs-industrial-grade-mcu). For logic-side voltage mismatches, [level shifter selection](/blog/level-shifter-selection-guide).

Send us the part number with your data rate, topology and qualification requirements and we will come back with parts that will actually run the network.

[**Submit an RFQ**](/rfq) | [**Browse transceivers**](/category/drivers-receivers-transceivers) | [**Upload a BOM**](/bom)
