---
title: "RS-485 vs CAN vs LVDS vs Industrial Ethernet: Choosing a Link Between Boards"
slug: "rs485-vs-can-vs-lvds-vs-ethernet-link"
status: "draft"
seoTitle: "RS-485 vs CAN vs LVDS vs Ethernet: Distance, Nodes and Availability"
seoDesc: "The transceiver you would copy from a 1998 schematic is the one that is gone: MAX485 is 47% obsolete and TJA1050 80%, while Ethernet PHYs measure 0%. Decision arithmetic for four link types."
seoKeywords: "RS-485 vs CAN bus, LVDS vs RS-485, industrial Ethernet vs fieldbus, RS-485 failsafe biasing calculation, CAN bit time distance, MAX485 obsolete, unit load RS-485, transceiver selection"
tags: "comparison, interface design, RS-485, CAN, LVDS, Ethernet, design for availability"
author: "FPGACenter Engineering Team"
readingTime: 17
category: "Interface & Logic Sourcing"
relatedProducts: "SN65HVD35DRG4, SN65HVD10DRG4, SN65HVD230QDR, DS90LV031ATMTC, KSZ8081MNXCA, KSZ8081MLXCA"
---

# RS-485 vs CAN vs LVDS vs Industrial Ethernet: Choosing a Link Between Boards

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~17 minutes
> **Topics**: the standard-versus-part longevity inversion, failsafe bias arithmetic, CAN bit time against distance, unit loads, ground offset as the real failure mode

---

**The longevity of an interface standard and the longevity of the part that implements it are different questions, and the answer inverts the usual assumption.** Measured on 2026-08-11: `MAX485` (the RS-485 transceiver most engineers can draw from memory) is **47% inactive**, `ADM485` 38%, `SP485` 42%. `TJA1050`, the CAN transceiver of a generation of designs, is **80% inactive**. Meanwhile the Ethernet PHYs that everyone treats as the fast-moving, disposable choice measure **0%**: `DP83848` 0%, `KSZ8081` 0%, `LAN8720` 0%, `DP83822` 0%.

"Use an old, simple interface because it will still be available" is true of the standard and false of the part you would copy from the old schematic. RS-485 is not going anywhere; the specific 1990s transceiver is.

We have sourcing guides for [RS-485](/blog/rs485-transceiver-sourcing-guide), [CAN](/blog/can-transceiver-sourcing-guide), [LVDS](/blog/lvds-sourcing-guide) and [interface controllers](/blog/interface-controller-sourcing-guide). This article answers the prior question: given two boards that must talk to each other, which of the four should carry the traffic? The decision is mostly arithmetic, and the arithmetic is below.

## Key takeaways

- **Distance × data rate is the first filter, and a hard physical limit** for CAN, because arbitration requires a signal to reach the furthest node within one bit time.
- **Ground potential difference decides more industrial designs than data rate does.** RS-485's common-mode range is roughly −7 V to +12 V; exceed it and the choice becomes isolated-or-nothing.
- **RS-485 needs failsafe biasing, and the calculation is four lines.** Without it the idle bus state is undefined and the receiver output is arbitrary.
- **Unit loads, not node count, set how many devices a bus can carry.** Standard receivers are 1 unit load with 32 allowed; 1/8-unit-load parts reach 256.
- **LVDS is a point-to-point or short multidrop technology, not a fieldbus.** No arbitration, no long cables, very low power.
- **Ethernet buys determinism only with a protocol layer that provides it**; plain switched Ethernet does not bound latency.
- **On availability, the modern generations win everywhere**: `THVD` 0%, `TJA1044` 0%, `TCAN` 2%, `SN65HVD2xx` 4%, against classic parts at 29-80%.

---

## The first filter: distance against data rate

Each technology has a physical envelope, and CAN's is the most constrained because of how it arbitrates.

| | RS-485 | CAN | LVDS | Industrial Ethernet |
| --- | --- | --- | --- | --- |
| Typical maximum distance | 1,200 m | 1,000 m at low rate | ~10 m | 100 m per segment |
| Typical maximum rate | 10-50 Mbit/s (short) | 1 Mbit/s (5-8 with CAN FD) | 655 Mbit/s+ | 100 Mbit/s-1 Gbit/s |
| Distance × rate coupled? | Yes, loosely | **Yes, strictly** | Yes | No — fixed segment length |
| Topology | Multipoint bus | Multipoint bus | Point-to-point / short multidrop | Star via switches |
| Arbitration | None (protocol above) | **In hardware** | None | Switch-mediated |
| Nodes | 32 unit loads | ~110 | 1 (or a few) | Per switch ports |
| Differential swing | ~1.5-5 V | ~2 V | **~350 mV** | ~1 V (100BASE-TX) |
| Power per driver | Tens of mW | Tens of mW | **~12 mW** | Hundreds of mW (PHY) |

### Why CAN's distance and rate are strictly coupled

CAN arbitration is destructive-free: several nodes may start transmitting, and the one sending a dominant bit wins while the others detect the collision *within the same bit*. That requires the signal to travel to the furthest node and back before the bit is sampled.

```
CAN at 1 Mbit/s → bit time = 1,000 ns
Sample point at ~75% of the bit    = 750 ns available

Cable propagation ≈ 5 ns/m
Round trip over 40 m               = 2 × 40 × 5 = 400 ns
Transceiver loop delay (typical)   ≈ 150-250 ns
                                     -----------
Total                              ≈ 550-650 ns   → fits inside 750 ns
```

At 80 m the round trip alone is 800 ns and arbitration breaks. **This is why the familiar table exists (1 Mbit/s at 40 m, 500 kbit/s at 100 m, 125 kbit/s at 500 m) and why it is a physical law rather than a convention.** It also means transceiver loop delay is a selection parameter on long buses, not a footnote.

### Why RS-485 is coupled only loosely

RS-485 has no hardware arbitration, so propagation delay does not have to fit inside a bit. Reflections still do:

```
RS-485 at 10 Mbit/s  → bit time = 100 ns
100 m cable, one way = 100 × 5 ns = 500 ns = 5 bit times
```

With propagation at five bit times, the line is a transmission line and behaves like one: both ends must be terminated, stubs must be short relative to the bit time, and a mid-bus tap is a reflection source. At 115.2 kbit/s the bit time is 8.7 µs, propagation is negligible, and much sloppier wiring works, which is why RS-485 has a reputation for being forgiving that only holds at low rates.

## The filter that decides most industrial designs: ground offset

Two boards in different enclosures, on different supplies, tens of metres apart, do not share a ground. The potential difference between them appears as a common-mode voltage at the receiver, and every technology has a limit:

| Technology | Approximate common-mode range |
| --- | --- |
| RS-485 | −7 V to +12 V |
| CAN | −12 V to +12 V (transceiver-dependent, often wider) |
| LVDS | ~0 V to 2.4 V — **very narrow** |
| Ethernet (magnetics) | **Galvanically isolated by the transformer** |

Exceed the range and the receiver's output is meaningless, or the transceiver is destroyed. In an industrial plant with motor drives, ground offsets of tens of volts and fast transients are ordinary, which produces three practical consequences:

1. **LVDS is disqualified for anything leaving a board or a chassis.** Its common-mode window is a fraction of a volt wide. LVDS is for board-to-board inside one enclosure over a short controlled path, where it is excellent, because 350 mV of swing at 3.5 mA is a fraction of the power and radiated noise of the alternatives.
2. **RS-485 and CAN need isolated transceivers, or a documented bonding scheme.** An isolated transceiver costs more and solves the problem completely. A non-isolated one plus a ground wire solves it as long as nothing in the plant changes.
3. **Ethernet gets isolation for free** because 100BASE-TX is transformer-coupled. This is an underrated argument in its favour. It is the reason Ethernet often survives environments where a fieldbus needed rework.

## RS-485 failsafe biasing: the calculation that gets skipped

When no driver is enabled, an RS-485 bus floats, and a floating differential input produces an arbitrary receiver output — typically noise interpreted as data. Failsafe biasing pulls the idle bus to a defined state.

The requirement is at least 200 mV of differential across the receiver inputs while idle. With both ends terminated in 120 Ω, the termination pair presents 60 Ω:

```
Required differential            = 200 mV
Termination (two 120 Ω in ||)    = 60 Ω
Bias current needed              = 200 mV / 60 Ω = 3.33 mA

Supply                           = 5 V
Voltage across bias resistors    = 5 V − 0.2 V = 4.8 V
Total bias resistance            = 4.8 V / 3.33 mA = 1.44 kΩ
Split as two resistors           = 720 Ω each (use 680 Ω)
```

So one 680 Ω resistor from the A line to 5 V and one from the B line to ground, once per bus — **not once per node**, which is the mistake that turns a correctly biased bus into an over-biased one when nodes are added.

Three things this calculation reveals:

- **Bias resistors load the bus.** Adding them reduces the differential the driver can produce, so a heavily biased bus with many nodes can fall below the receiver threshold at the far end.
- **Some modern transceivers have internal failsafe** that defines the output for an idle or open bus without external bias. On a new design that is the better answer. It is another reason not to copy the 1998 schematic.
- **A design with no bias may work on the bench** (a short cable and one talker rarely goes idle long enough to matter) and fail in the field where the bus is idle most of the time.

## Unit loads: how many nodes really fit

The "32 nodes" figure is not a node count. It is 32 unit loads, where one unit load is the standardised input impedance of a legacy receiver.

```
Standard receiver             = 1 unit load (~12 kΩ)
Bus budget                    = 32 unit loads
1/8 unit load transceiver     → 32 / 0.125 = 256 nodes
1/4 unit load transceiver     → 128 nodes
```

Mixing is allowed and additive: sixteen 1-unit-load nodes and sixty-four 1/4-unit-load nodes together consume 16 + 16 = 32 unit loads. **Check the unit-load rating when substituting a transceiver**, because a replacement with a heavier load silently reduces how many nodes the bus supports, and the symptom appears at the electrically furthest node under the worst combination of temperature and cable length.

## Determinism: what Ethernet does not give you

Plain switched Ethernet does not bound latency. A switch queues frames, and under contention the delay is unbounded in the general case. CAN, by contrast, bounds latency by message priority: the highest-priority message wins arbitration every time, so its worst-case latency is computable.

| Requirement | RS-485 | CAN | Ethernet |
| --- | --- | --- | --- |
| Bounded worst-case latency | Only with a deterministic protocol above it | **Yes, by design** | Only with TSN or an industrial protocol layer |
| Priority arbitration | No | **Yes, in hardware** | No (unless the protocol adds it) |
| Error containment | Protocol-dependent | **Node fault confinement in hardware** | Link-level only |
| Cost of determinism | A master-slave protocol | Free | A protocol stack and often specific silicon |

CAN's real advantage is not the wire; it is the fault confinement and priority arbitration in silicon, which is why it persists in machine control long after its data rate stopped being competitive. If your requirement is "the emergency stop message must arrive within a known time even when the bus is busy", CAN answers it with no software, and Ethernet answers it with a protocol layer and matched silicon.

## The decision table

| If the binding requirement is | Choose | Note |
| --- | --- | --- |
| Board-to-board, inside one enclosure, high rate | **LVDS** | Lowest power and emissions; never leaves the box |
| Bounded latency with priority, machine control | **CAN** | Check the distance-rate envelope first |
| Long cable, moderate rate, many nodes, simple | **RS-485** | Budget failsafe bias and unit loads |
| Ground offset beyond ±10 V | **Isolated RS-485/CAN, or Ethernet** | Ethernet is isolated by its magnetics |
| High bandwidth over 100 m, existing infrastructure | **Ethernet** | Add a protocol layer if determinism is needed |
| Several hundred nodes | **RS-485 with 1/8-unit-load parts** | 256 nodes; check far-end margin |
| Very low power per link | **LVDS** | ~12 mW per driver |
| Existing plant with a fieldbus already | **Match the fieldbus** | Interop beats theory |
| Fifteen-year availability, no other constraint | **Any — but choose a current-generation part** | The standard is safe; the 1990s part is not |

## What the catalogue says

Measured 2026-08-11. Within every technology, the current generation is dramatically healthier than the classic part.

| Family | Technology | Parts | Not active | In last-time buy |
| --- | --- | ---: | ---: | ---: |
| `THVD` | RS-485, current TI | 65 | **0%** | — |
| `LTC248x` | RS-485, Linear | 46 | 2% | — |
| `SN65HVD` | RS-485/CAN, TI | 397 | 9% | **23** |
| `ISL317x` | RS-485, Intersil | 60 | 13% | 1 |
| `SN75176` | RS-485, classic | 21 | 29% | 3 |
| `MAX487` | RS-485, low power | 27 | 37% | — |
| `ADM485` | RS-485, ADI classic | 55 | 38% | — |
| `SP485` | RS-485, Sipex/Exar | 24 | 42% | — |
| **`MAX485`** | **RS-485, the default** | 43 | **47%** | — |
| `TJA1044` | CAN, current NXP | 15 | **0%** | — |
| `MCP2562` | CAN, Microchip | 24 | **0%** | — |
| `TCAN` | CAN, current TI | 195 | 2% | — |
| `SN65HVD2xx` | CAN, TI | 96 | 4% | — |
| `TJA1042` | CAN, NXP | 20 | 20% | — |
| **`TJA1050`** | **CAN, the classic** | 15 | **80%** | — |
| `SN65LVDS` | LVDS, TI | 320 | 13% | — |
| `DS90LV` | LVDS, National heritage | 152 | 24% | — |
| `DS90C` | LVDS/serialiser | 270 | 24% | — |
| `SN75LVDS` | LVDS, older | 86 | 37% | — |
| `DP83848`, `DP83822` | Ethernet PHY, TI | 35 | **0%** | — |
| `KSZ8081`, `LAN8720` | Ethernet PHY, Microchip | 20 | **0%** | — |
| `KSZ8041` | Ethernet PHY, older | 28 | 21% | — |
| `LAN8742` | Ethernet PHY | 5 | 20% | — |

At category level, drivers/receivers/transceivers is 19,068 part numbers at 36% inactive, and interface controllers 3,537 at 45%.

Three conclusions.

1. **Specify the current generation, always.** `THVD` at 0% against `MAX485` at 47% is the same function in the same package, and the only cost of choosing correctly is looking it up.
2. **Ethernet PHYs are a better fifteen-year bet than legacy fieldbus transceivers.** That is the opposite of the usual assumption. It is measured rather than argued.
3. **The 23 `SN65HVD` ordering codes in last-time buy are a live warning** on an otherwise healthy family — pruning happens at ordering-code level, so check the code and not the family. The [August 2026 obsolescence watch](/blog/obsolescence-watch-2026-08) has the wider pattern; per-part status is on the [drivers, receivers and transceivers](/category/drivers-receivers-transceivers) pages, and an [RFQ](/rfq) confirms current availability.

## Frequently asked questions

### Is RS-485 a safer long-term choice than Ethernet?

As a standard, yes; as a part, measurably not. RS-485 will be specifiable indefinitely, but `MAX485` is 47% inactive, `ADM485` 38% and `SP485` 42%, while Ethernet PHYs such as `DP83848`, `KSZ8081` and `LAN8720` measure 0%. If you choose RS-485, choose a current-generation transceiver (`THVD` measures 0%) rather than the part on the legacy schematic.

### Why can't CAN run at 1 Mbit/s over 500 metres?

Because arbitration requires the signal to reach the furthest node and return before the bit is sampled. At 1 Mbit/s the bit is 1,000 ns and the sample point is around 750 ns; 500 m of cable is 2,500 ns one way. The limit is physical, not conventional, and transceiver loop delay counts toward the budget, which makes it a selection parameter on long buses.

### Do I need failsafe biasing on RS-485?

Yes, unless every transceiver on the bus has internal failsafe. An idle bus floats, and a floating differential input produces arbitrary receiver output. For a 5 V bus with two 120 Ω terminations, one 680 Ω resistor to the supply and one to ground (**once per bus, not per node**) provides the required 200 mV. Modern transceivers with internal failsafe remove the network and the mistakes that come with it.

### How many nodes can an RS-485 bus have?

Thirty-two unit loads, which is not the same as 32 nodes. With 1/8-unit-load transceivers the limit is 256, and mixed populations add up by load rather than by count. When substituting a transceiver, check its unit-load rating: a heavier load reduces the node budget and the symptom appears at the electrically furthest node under worst-case temperature and cable length.

### Can I use LVDS between two enclosures?

No. Its common-mode range is a fraction of a volt, so any realistic ground potential difference between enclosures puts the receiver outside its operating window or destroys it. LVDS is for board-to-board or backplane distances inside one chassis, where its 350 mV swing and roughly 12 mW per driver make it the lowest-power and lowest-emission option available.

### Does industrial Ethernet give me deterministic timing?

Only with a protocol layer that provides it. Plain switched Ethernet queues frames, so worst-case latency is unbounded under contention. CAN bounds it in hardware through priority arbitration, which is why it survives in machine control at data rates that stopped being competitive decades ago. If you need Ethernet's bandwidth and CAN's determinism, you are choosing a protocol and often specific silicon, not just a PHY.

### What replaces an obsolete MAX485?

A current-generation transceiver, and the substitution needs four checks: unit load rating, whether the replacement has internal failsafe (which may let you remove external bias), common-mode range, and enable-pin behaviour and polarity. Driver slew-rate limiting also differs between families and affects emissions, so a like-for-like swap can change EMC results even when the digital behaviour is identical.

### Which is best for a mixed system with both fast local links and long plant links?

Use each where it fits rather than forcing one everywhere: LVDS or a serialiser inside the chassis, and isolated RS-485, CAN or Ethernet leaving it. The common design error is extending a board-level interface out of the box to save a transceiver, which works until a ground offset or a transient appears. The transceiver is cheaper than the field failure.

## Sources

Availability figures are our own measurement across 719,342 catalogue part
numbers, dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`.
Electrical limits are from the standards and the primary application notes below.
**Common-mode range, unit load and slew-rate behaviour vary between transceivers
within the same standard** — confirm against the specific datasheet.

- **TIA/EIA-485-A.** Drivers must withstand a common-mode range of −7 V to +12 V;
  one unit load is a receiver input impedance of ≥12 kΩ, and the bus budget is
  32 unit loads. 1/8-unit-load receivers present ≈96 kΩ, allowing up to 256 nodes.
- Texas Instruments, *The RS-485 Design Guide* (SLLA272) — failsafe biasing,
  termination, stub length and node counting. [ti.com](https://www.ti.com/lit/pdf/slla272)
- Analog Devices, *AN-960: RS-485/RS-422 Circuit Implementation Guide* and
  *Guidelines for Proper Wiring of an RS-485 Network* — cable, grounding and
  isolation practice. [analog.com](https://www.analog.com/en/resources/app-notes/an-960.html)
- Renesas, *RS-485 Transceiver Tutorial* — unit loads and failsafe behaviour.
  [renesas.com](https://www.renesas.com/en/document/whp/rs-485-transceiver-tutorial)
- **ISO 11898** for CAN physical layer and bit timing. The distance-versus-rate
  envelope follows from the arbitration requirement plus cable propagation
  (≈5 ns/m) and transceiver loop delay, which is a datasheet parameter worth
  checking on long buses.
