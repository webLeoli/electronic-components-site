---
title: "SRAM Sourcing: Async, Sync and the Battery-Backed Problem"
slug: "sram-sourcing-guide"
status: "draft"
seoTitle: "SRAM Sourcing Guide: Async vs Sync, Access Time, Retention"
seoDesc: "Half the SRAM part numbers in circulation are discontinued. Async versus sync, reading access-time grades, data-retention current in battery-backed designs, and what actually has to match."
seoKeywords: "SRAM sourcing, obsolete SRAM, asynchronous SRAM replacement, CY62128, IDT71V124, battery backed SRAM, data retention current, SRAM access time"
tags: "SRAM, memory, async SRAM, synchronous SRAM, battery backup, obsolescence, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Memory Sourcing"
relatedProducts: "CY62128EV30LL-45ZAXI, CY62147G30-45ZSXAT, CY7C006A-20AXC, IDT71V124SA15Y, MT58L32L32FT-10, R1LP0108ESA-5SI#B0"
---

# SRAM Sourcing: Async, Sync and the Battery-Backed Problem

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: SRAM, access time, data retention, battery backup, legacy sourcing

---

**Of the 17,613 SRAM part numbers in our catalogue, 9,121 are discontinued — 52%.** SRAM is the memory type most exposed to the economics described in [memory IC sourcing](/blog/memory-ic-sourcing-guide): it is sold by the bit, low densities are uneconomic to keep in production, and the low densities are exactly what industrial control, instrumentation and embedded systems use. This guide covers the async/sync split, how to read the specifications that determine compatibility, and the retention-current problem that catches battery-backed designs.

## Key takeaways

- **52% of SRAM part numbers are discontinued**. It is the *small* devices that go first.
- **Async and sync SRAM are different components**, not variants: the interface, not the array, is what differs.
- **Access-time grade is part of the orderable number** and a slower part produces data- and temperature-dependent read errors.
- **Data-retention current decides battery life**, and it varies by orders of magnitude between otherwise similar parts.
- **Low-power "L" and "LL" variants are separate parts** with different retention current and often different access times.
- **A full-array write/read test on receipt** is cheap and detects both density and speed remarking.

---

## Async versus sync: two different components

The array is the same idea; the interface is not.

| | Asynchronous SRAM | Synchronous SRAM |
| --- | --- | --- |
| Clock | None — access begins on address change | Clocked; registered address and data |
| Key spec | Access time (ns) | Clock frequency, latency, burst behaviour |
| Typical use | Microcontroller external memory, buffers, battery-backed state | Networking, test equipment, cache, FPGA companion memory |
| Substitution | Match access time and organisation | Match clock, latency mode, burst type, flow-through vs pipelined |
| Example | `CY62128EV30LL-45ZAXI` | `MT58L32L32FT-10`, `CY7C006A-20AXC` (dual-port) |

They are not interchangeable in either direction. A synchronous part in an asynchronous socket has nowhere to take its clock from; an asynchronous part in a synchronous design will not meet the controller's expectations.

Within synchronous SRAM there is a further split that catches people: **flow-through versus pipelined**. A pipelined device adds a register stage on the output, giving higher clock rates but an extra cycle of latency. Substituting one for the other changes the read timing by a full clock and requires a controller change.

Dual-port SRAM (`CY7C006A-20AXC` and similar) is another category again — two independent access ports with arbitration logic for simultaneous access to the same location. Used to pass data between two processors, and there is no single-port substitute.

## Reading the part number

```
CY62128 EV 30 LL - 45  ZAXI
│       │  │  │    │   └── Package and temperature grade
│       │  │  │    └────── Access time: 45 ns
│       │  │  └─────────── Power variant: L = low power, LL = very low power
│       │  └────────────── Voltage: 30 = 3.0 V range
│       └───────────────── Family/revision
└───────────────────────── Device: 1 Mb, organised 128K × 8
```

The fields that determine sourcing difficulty:

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Density | 1 Mb – 16 Mb | **Below 512 Kb**, and the very largest |
| Type | Async, single-port | Dual-port, sync burst, legacy pipelined |
| Access time | Mid grades (45–70 ns) | Fastest grades (10–20 ns) |
| Power variant | Standard | LL / ultra-low-retention variants |
| Voltage | 3.3 V | 5 V, and unusual dual-supply |
| Package | TSOP, SOJ | Legacy DIP, unusual BGA |

Note the density row. For most component types the largest parts are hardest to find; for SRAM it is the smallest, because a 256 Kb device is no longer worth a wafer to anybody.

## The battery-backed retention problem

This is where SRAM substitutions most often fail in the field rather than on the bench.

A large installed base of industrial equipment uses battery-backed SRAM to hold calibration data, configuration, run-hour counters and event logs across power cycles. The design was sized around a specific part's **data-retention current**: the current drawn at the minimum retention voltage with chip-select deasserted.

Retention current varies enormously:

| Class | Typical retention current | Battery life implication |
| --- | --- | --- |
| Standard SRAM | 10–100 µA | Months |
| Low power (L) | 1–10 µA | Years |
| Very low power (LL) | 0.1–2 µA | Product lifetime |

Substituting a standard part for an LL part can reduce backup life from years to weeks. The device works perfectly on the bench, passes every functional test, and then the field starts losing calibration data after the equipment sits in a warehouse over winter.

Three related checks:

- **Minimum data-retention voltage.** Typically well below the operating minimum, often around 1.5 V, and it determines how far the battery can discharge before data is lost.
- **Chip-select behaviour during power-down.** The part must be deselected before the supply falls, or it can draw operating current or corrupt data. This is what the supervisor circuit is for — see [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).
- **Data-retention current at temperature.** Leakage rises sharply with temperature, and the specification is usually given at 25 °C. A design stored at 60 °C draws considerably more.

Check when substituting: retention current at your storage temperature, minimum retention voltage, and whether the existing supervisor still deselects the part correctly.

## Access time and why a slower part is dangerous

Access-time grade is not a performance preference; it is a functional requirement.

In an asynchronous design, the processor or FPGA asserts an address and expects valid data within the access time. If the part is slower than the design assumed, the data sampled is whatever happened to be on the bus, which is frequently the previous value, making the error data-dependent and easy to miss in testing.

The failure characteristics make it particularly nasty:

- It is **temperature-dependent**, because access time degrades at high temperature.
- It is **pattern-dependent**, because the error only manifests when the new data differs from the old.
- It **passes a simple memory test** that writes and reads back slowly.

A slower substitute must be validated against the actual bus timing, not just functionally tested. Where the timing analysis is unavailable (common in legacy designs) the safe route is to match or beat the original grade.

## What else must match

| Item | Why |
| --- | --- |
| **Organisation** (depth × width) | ×8 and ×16 parts are different devices; byte enables differ |
| **Voltage** | 5 V, 3.3 V and lower; some parts have separate I/O supply |
| **Pinout** | Verify the drawing — same package does not mean same pinout |
| **Output enable / write enable timing** | Setup and hold relationships differ between families |
| **Bus contention behaviour** | How quickly outputs tri-state affects shared-bus designs |
| **Package** | Legacy DIP and SOJ are being rationalised out |

The general substitution framework, including the "going bigger is not free" problem with unused address pins, is in [memory IC sourcing](/blog/memory-ic-sourcing-guide).

## Where to buy discontinued SRAM

Authorised aftermarket is strong for this family. Parts such as `MT58L32L32FT-10` and `R1LP0108ESA-5SI#B0` in our catalogue come through Rochester Electronics — newly manufactured under licence, with full traceability and no requalification requirement. Because SRAM is discontinued for economic rather than technical reasons, these lines are good candidates for licensed continuation.

Check that channel before the open market, as set out in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Incoming test is unusually easy for SRAM, and should be mandatory on any non-franchised purchase:

1. **Write a pattern across the full address range and read it back.** Detects density remarking conclusively: a part remarked as twice its real capacity will alias.
2. **Test at rated access time**, not at a leisurely rate. Detects speed-grade remarking.
3. **Measure standby and retention current** if the design is battery-backed. Detects a standard part remarked as low-power.

That third check is specific to this family and worth adding, because a standard part sold as an LL variant passes both of the first two tests.

## FAQ

### Why is small-capacity SRAM harder to find than large?

Because memory is priced per bit and manufactured on whichever process is most economic. A wafer of 256 Kb SRAM costs a fab roughly the same to produce as a wafer of 16 Mb SRAM but is worth far less, so low densities are discontinued first regardless of demand. This is the opposite of most component categories, where the largest and most specialised parts are scarcest. That is why industrial and embedded designs using small SRAMs face obsolescence sooner than expected.

### What is the difference between asynchronous and synchronous SRAM?

Asynchronous SRAM has no clock: a read begins when the address changes and data is valid after the specified access time. Synchronous SRAM registers addresses and data against a clock and is specified by clock frequency, latency and burst behaviour. They are not interchangeable in either direction. Within synchronous parts there is a further split between flow-through and pipelined devices, which differ by a full clock cycle of read latency and require different controller configuration.

### What is data-retention current and why does it matter?

Data-retention current is what an SRAM draws at its minimum retention voltage with the chip deselected: the current a backup battery must supply to preserve data through a power outage. It varies by orders of magnitude: standard parts draw tens of microamps, low-power L variants single-digit microamps, and very-low-power LL variants a fraction of a microamp. Substituting a standard part for an LL part can cut backup life from years to weeks, and the fault only appears after equipment has been unpowered for an extended period.

### Can I use a faster SRAM than the original?

Generally yes. It is the safe direction. A part with a shorter access time will satisfy timing that was designed around a slower one. The costs are price and availability: the fastest grades are typically the hardest to source and command a premium. The unsafe direction is substituting a slower part, which produces read errors that are data-dependent and temperature-dependent and can pass a naive memory test.

### Why does a slower SRAM cause intermittent faults rather than obvious failures?

Because when data is not yet valid at the sampling instant, the bus frequently still holds the previous value. The error therefore only manifests when the new data differs from the old, making it pattern-dependent. It is also temperature-dependent, since access time degrades as the device heats. A simple write-then-read test performed at a leisurely rate will not reproduce it, which is why timing must be validated against the actual bus rather than functionally tested.

### How do I test incoming SRAM for counterfeits?

Three checks. Write a pattern across the entire address range and read it back, which conclusively detects density remarking because an undersized part will alias. Test at the rated access time rather than slowly, which detects speed-grade remarking. And if the design is battery-backed, measure standby and retention current, which detects a standard part remarked as a low-power variant — that last case passes both of the first two tests.

### Is dual-port SRAM replaceable with single-port?

No. Dual-port SRAM provides two independent access ports with internal arbitration so that two processors or subsystems can access the array simultaneously, with hardware handling contention for the same location. A single-port device cannot provide that, and replicating it externally requires arbitration logic and a redesign. Dual-port parts such as CY7C006A are a distinct category and must be replaced with another dual-port device.

### Is discontinued SRAM available through authorised aftermarket?

Frequently. Because SRAM is discontinued for economic rather than technical reasons (the fab wants the capacity for denser product) these lines are attractive candidates for licensed continuation by authorised aftermarket manufacturers. Several well-stocked legacy parts in our SRAM category come through this route, meaning newly manufactured devices with full traceability rather than open-market material, and no requalification requirement.

## Related reading

The family-level picture, including why memory obsoletes faster than other components and what has to match generally, is in [memory IC sourcing](/blog/memory-ic-sourcing-guide). For the non-volatile side, [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide). For the supervisor that protects a battery-backed part during power-down, [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide). For the channel decision, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number with your access time, organisation and retention-current requirements, and we will come back with what is genuinely compatible.

[**Submit an RFQ**](/rfq) | [**Browse SRAM**](/category/sram) | [**Upload a BOM**](/bom)
