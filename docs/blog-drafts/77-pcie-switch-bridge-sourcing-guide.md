---
title: "PCIe Switches and Bridges: 94% of the Part Numbers Are Gone"
slug: "pcie-switch-bridge-sourcing-guide"
status: "draft"
seoTitle: "PCIe Switch and Bridge Sourcing: 89HPES, PEX, PI7C Availability"
seoDesc: "Of 848 IDT 89H-prefixed PCIe switch part numbers we hold, 795 are inactive. Lane and port configuration, EEPROM-defined topology, non-transparent bridging and what actually replaces one."
seoKeywords: "PCIe switch sourcing, 89HPES24T3G2 obsolete, IDT PCIe switch end of life, PEX8xxx replacement, PI7C9X bridge, non-transparent bridge NTB, PCIe switch EEPROM configuration, PCI to PCIe bridge"
tags: "PCIe, switches, bridges, non-transparent bridge, lanes, EEPROM configuration, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "89HPES24T3G2ZBALG8, 89HPES24NT3ZBBX8, 89HPES24T61ZCBX, 89HPES24T6G2ZBAL, 89HPES24T3G2ZCALGI, 89HPES24T3G2ZCAL, 89HPES24T3G2ZFALG, 89HPES24T3G2ZCALI"
---

# PCIe Switches and Bridges: 94% of the Part Numbers Are Gone

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: availability data, lane and port configuration, EEPROM topology, non-transparent bridging, replacement paths

---

**Of the 848 `89H`-prefixed PCIe switch part numbers in our catalogue, 795 are no longer active — 94%.** Narrowing to the `89HPES` family specifically, it is 289 of 304, or 95%. This is the highest obsolescence rate of any functional group we have documented, and it has a straightforward cause: PCIe switches were sold into server, storage and telecom platforms whose generations turn over every few years, and the vendors who made them were acquired. IDT's switch line went to Renesas; PLX's `PEX` line went to Avago and then Broadcom; Pericom's `PI7C` line went to Diodes. Each transition pruned the range. The result is that a mid-life industrial or instrumentation product built around a PCIe switch is one of the harder sourcing problems in this catalogue, and the replacement is never a drop-in, because the switch's port topology is part of the system architecture.

## Key takeaways

- **`89H` prefix: 848 part numbers, 795 inactive (94%). `89HPES`: 304 / 289 (95%). `PEX`: 12 / 11. `PI7C`: 132 / 49.**
- **The part number encodes the port and lane configuration**, and that configuration is a board-layout commitment, not a setting.
- **Topology is frequently defined in an external EEPROM.** A blank or differently-programmed EEPROM changes how the switch enumerates.
- **Non-transparent bridging is a different function from switching**, and firmware depends on which one is present.
- **Lane count is not the same as port count**, and the same silicon supports several partitions.
- **A PCIe switch substitution is a PCB and BIOS/firmware exercise**, so it should be costed as a redesign from the start.
- **PCI-to-PCIe bridges are a separate, equally exposed group** — they exist to keep legacy PCI cards alive, and they are going the same way.

---

## The availability data

Measured 2026-08-04. These parts sit in our [specialized ICs category](/category/specialized-ics) rather than in a switch-specific one, which is worth knowing when searching.

| Prefix | Vendor lineage | Parts held | Not active | Rate |
| --- | --- | ---: | ---: | ---: |
| `89H…` | IDT → Renesas | 848 | 795 | **94%** |
| `89HPES…` | IDT PCIe switches specifically | 304 | 289 | **95%** |
| `PEX…` | PLX → Avago → Broadcom | 12 | 11 | 92% |
| `PI7C…` | Pericom → Diodes | 132 | 49 | 37% |
| `XIO…` | — | 36 | 20 | 56% |

Two observations that change how you search.

The Pericom `PI7C` line at 37% is the healthiest. It is largely PCI and PCIe bridges rather than large fan-out switches — simpler parts with longer lives, because their application (keeping a legacy card or a small fan-out working) has not gone away.

The `PEX` sample in our catalogue is small (12 part numbers) and 92% inactive, which understates the family's size but matches the market experience: after the Broadcom acquisition, the PLX switch range narrowed sharply and moved upmarket, and the parts that remain are aimed at current server generations rather than at sustaining older designs.

## The part number is a topology

A PCIe switch's ordering code encodes how many ports it has and how the lanes are divided among them. In the IDT scheme, part numbers such as `89HPES24T3G2` decompose roughly as:

| Element | Meaning |
| --- | --- |
| `89HPES` | Family: PCI Express switch |
| `24` | Total lanes available |
| `T3` | Port configuration — number of ports and their type |
| `G2` | PCIe generation (Gen2) |
| `NT` (as in `89HPES24NT3`) | **Non-transparent bridging capability** |
| trailing letters | Package, temperature grade, packing |

Why this matters more than in most categories: the lane-to-port assignment determines the board's routing. A 24-lane switch configured as one x8 upstream plus two x8 downstream ports has different pin functions from the same silicon configured as one x4 upstream plus five x4 downstream. **The differential pairs are physically routed to specific balls**, so a different configuration is a different pinout even where the package matches.

In our catalogue the surviving active parts cluster around a few `89HPES24T3G2` variants — `89HPES24T3G2ZBALG8`, `89HPES24T3G2ZCALGI`, `89HPES24T3G2ZCAL`, `89HPES24T3G2ZFALG`, `89HPES24T3G2ZCALI`, while `89HPES24NT3ZBBX8`, `89HPES24T61ZCBX` and `89HPES24T6G2ZBAL` variants appear as inactive. **The differences between those codes are exactly the fields above**, which is why "the same switch, different suffix" is not a usable offer here.

## Topology in an EEPROM, and what happens when it is blank

Many PCIe switches read a serial EEPROM at power-up to set their port configuration, link widths, and various capability fields.

The EEPROM typically defines:

- **Port partitioning**, which lanes belong to which port.
- **Upstream port selection**, which determines which side faces the host.
- **Link width and speed limits per port.**
- **Vendor and device IDs, subsystem IDs and class codes** presented to the host.
- **Hot-plug and slot-capability settings.**
- **Sometimes non-transparent bridge window configuration.**

Three failure modes follow:

A blank EEPROM means the switch falls back to a strap-defined default, which is rarely the design's intended topology. The host enumerates *something* (often fewer ports, or the wrong upstream) and the system boots without the expected devices.

A differently-programmed EEPROM changes the IDs the host sees, so driver binding fails even though the link trains correctly. This is the same VID/PID-class dependency described in [interface controller sourcing](/blog/interface-controller-sourcing-guide), moved into the fabric.

The EEPROM image is a manufacturing artefact that is easy to lose. If the image and the programming step are not in the manufacturing documentation, a replacement switch cannot be configured, and this is the single most common reason a "we found stock" outcome still fails.

Practical measure: archive the EEPROM image, the programming tool and the switch's configuration report alongside the board's firmware. Verify against a known-good unit during incoming inspection by reading back the configuration space and comparing the enumerated topology, not just by checking that the link comes up.

## Transparent switching versus non-transparent bridging

These are different functions and firmware knows the difference.

| | Transparent switch | Non-transparent bridge (NTB) |
| --- | --- | --- |
| What the host sees | A PCIe switch with devices behind it; standard enumeration | **An endpoint**, with address translation windows |
| Purpose | Fan-out: one root port to several devices | Connecting two independent hosts / memory domains |
| Enumeration | Automatic, by the host's PCIe stack | Requires driver support to open windows |
| Typical use | Backplanes, add-in card fan-out | Redundant controllers, host-to-host links, storage failover |
| In the part number | `T` configurations | **`NT`** as in `89HPES24NT3` |

Substituting a transparent switch for an NTB part removes a function the software depends on: the address-translation windows that let one host see part of another's memory. The link may still train, so the failure looks like a driver problem rather than a wrong part.

Substituting an NTB part for a transparent one is usually workable if the NTB features are simply unused, but the default configuration must be checked: a port configured as non-transparent presents itself as an endpoint, and the host will not enumerate devices behind it.

Where a design uses NTB, treat the switch as unreplaceable without software involvement. Redundant-controller storage systems and dual-host telecom line cards are the common cases, and both are exactly the kind of long-life equipment that outlives its silicon.

## What actually replaces a PCIe switch

Four routes, and the honest answer is that none is quick.

1. Exact-configuration stock, including the aftermarket. Given a 94% inactive rate, the surviving ordering codes matter. Search the base family as a prefix rather than an exact string: the same technique that surfaces aftermarket material in [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide).

2. A different configuration of the same silicon, with a board revision. If a `24T3` is gone and a different partition of the same 24 lanes is available, the switch works, but the lanes land on different balls, so the PCB changes. On a multi-layer board with differential-pair routing and length matching, that is a real layout job, not a rework.

3. A modern switch from a current family. Available and usually more capable, but: different package and ball count, PCIe generation possibly higher (which raises signal-integrity requirements on an old board stack-up), different EEPROM format, and different vendor and device IDs, so BIOS and driver work follows. **This is the route most redesigns take**, and it should be scoped with signal integrity in the loop.

4. Eliminate the switch. Sometimes the fan-out exists because the host had too few root ports; a newer host may not need it. Sometimes a device behind the switch can move to a different interface entirely. This is the cheapest answer when it applies. It is worth checking first.

What does not work: treating this as a purchasing substitution. **Cost it as a redesign with layout and firmware from the beginning**; the framework is in [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), and if stock exists, size the buy properly per [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

## PCI-to-PCIe bridges: keeping legacy cards alive

A distinct group with a distinct purpose: letting a PCI or PCI-X card work in a PCIe system, or the reverse.

The Pericom `PI7C9X`-class parts in our catalogue serve this role, and at 37% inactive the family is in better health than the switches, because industrial and instrumentation equipment still contains PCI cards that nobody will redesign. Data-acquisition cards, motion controllers, frame grabbers and legacy fieldbus interfaces all fall into this category.

Sourcing notes specific to bridges:

- **Bus speed and width matter**: 32-bit versus 64-bit, 33 MHz versus 66 MHz versus PCI-X rates. A bridge that supports a lower rate constrains the whole segment.
- **Transparent versus non-transparent applies here too.**
- **Arbitration and interrupt mapping** are configured, and the mapping is what firmware expects.
- **They are frequently the last PCI-capable part in the design**, so when a bridge goes, the PCI cards go with it, which makes the bridge's lifecycle the product's lifecycle.

That last point is the one to raise with a product manager: a bridge in last-time buy is not a component problem, it is notice that the product's expansion architecture has an end date.

## Sourcing notes

These parts are filed in `specialized-ics` in our catalogue, a 12,415-part category that also contains mechanical samples, high-speed ADSANTEC parts and a block of Freescale processors, so a category-level browse is not an efficient way to find them. **Search by prefix**: `89HPES`, `89H`, `PEX8`, `PI7C9`.

Vendor context: Rochester Electronics holds 6,532 part numbers in that category overall and Renesas 1,297, which tells you where legacy switch supply comes from.

Incoming inspection for a PCIe switch is a system-level test:

- **Read the configuration space** and compare the enumerated port topology, link widths and IDs against a known-good unit. This verifies both the silicon variant and the EEPROM.
- **Train every link at the intended generation and width**, and check for correctable-error counters rising: a marginal part or a degraded package shows up as link retraining rather than as a hard failure.
- **Exercise NTB windows** if the design uses them.
- **X-ray the BGA** and check for reballing evidence; these are large, expensive BGAs and are attractive targets for recovery from scrapped boards. Package-level guidance is in [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) and lot consistency in [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

Recovered parts are a specific risk here. A switch pulled from a scrapped server, reballed and remarked, will often train links successfully at low speed and fail at rate or over temperature, which is why link-error counters belong in the inspection procedure rather than a simple "does it enumerate" check.

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Lane count **and** port partition (`24T3` vs `24T6`) | Differential pairs land on the wrong balls |
| 2 | PCIe generation (`G2`, `G3`) | Link speed and signal-integrity requirements change |
| 3 | Transparent vs non-transparent (`NT`) | Host cannot enumerate, or NTB windows missing |
| 4 | EEPROM image and programming step available | Switch enumerates the wrong topology |
| 5 | Vendor/device/subsystem IDs presented | Driver binding fails |
| 6 | Upstream port assignment | Host on the wrong side of the fabric |
| 7 | Hot-plug and slot capability settings | Hot-plug stops working |
| 8 | Package, ball count and height | Does not fit; heatsink clearance |
| 9 | Power rails and sequencing | No start |
| 10 | Reference clock architecture and spread spectrum | Link training failures |
| 11 | Board stack-up adequate for a higher generation | Marginal links, rising error counters |
| 12 | BIOS/firmware enumeration assumptions | Devices missing at boot |

## FAQ

### How bad is PCIe switch availability?

The worst we have measured. Of 848 `89H`-prefixed part numbers in our catalogue, 795 are no longer active (94%) and within the `89HPES` PCIe switch family specifically it is 289 of 304, or 95%. The cause is a combination of platform turnover, since these parts served server and storage generations that refresh every few years, and consolidation: IDT's line went to Renesas, PLX's `PEX` line to Avago and then Broadcom, and Pericom's `PI7C` line to Diodes, with each transition narrowing the range.

### What does 89HPES24T3G2 mean?

Reading it in pieces: `89HPES` is the PCI Express switch family, `24` is the total lane count, `T3` describes the port configuration (how many ports and of what type) and `G2` is the PCIe generation. An `NT` in that position, as in `89HPES24NT3`, indicates non-transparent bridging capability. The trailing letters cover package, temperature grade and packing. The port configuration field matters most, because it determines which lanes appear on which balls, so two codes differing only there have different effective pinouts.

### Why does my replacement switch enumerate the wrong number of ports?

Almost certainly the configuration EEPROM. Many PCIe switches read a serial EEPROM at power-up that defines port partitioning, the upstream port, link widths and speeds, and the vendor, device and subsystem IDs presented to the host. A blank EEPROM makes the switch fall back to a strap-defined default that is rarely the intended topology, and a differently-programmed one changes the IDs so driver binding fails even though links train. Archive the EEPROM image and its programming tool with the board's firmware.

### What is a non-transparent bridge and how do I know if I need one?

A non-transparent bridge presents itself to each host as an endpoint with address-translation windows, rather than as a switch with devices behind it, which is how two independent hosts or memory domains are connected. You need one if the design has two hosts, a redundant controller pair, or host-to-host communication over PCIe, and the software includes a driver that opens translation windows. Substituting a transparent switch removes that function while still training the link, so the failure looks like a driver fault rather than a wrong part.

### Can I use a modern PCIe switch to replace an obsolete one?

Usually yes, as a redesign rather than a substitution. Expect a different package and ball count, possibly a higher PCIe generation (which raises the signal-integrity demands on an older board stack-up) a different EEPROM format, and different vendor and device IDs requiring BIOS and driver work. It is the route most of these problems eventually take, and it should be scoped with a layout engineer and signal-integrity review from the start, not treated as a purchasing exercise.

### Are PCI-to-PCIe bridges also disappearing?

Less quickly. The Pericom `PI7C` lineage runs 37% inactive in our catalogue against 94% for the IDT switches, because these bridges exist to keep legacy PCI and PCI-X cards working in industrial and instrumentation equipment that nobody intends to redesign. When one does go end-of-life, though, the consequence is larger than a component swap: the bridge is often the last PCI-capable part in the design, so its lifecycle effectively sets an end date for the product's expansion architecture.

### What should incoming inspection check on a PCIe switch?

System-level behaviour, not continuity. Read the configuration space and compare the enumerated topology, link widths and IDs against a known-good unit — that single check verifies both the silicon variant and the EEPROM contents. Then train every link at the intended generation and width and watch the correctable-error counters, because a recovered, reballed or degraded part typically trains at low speed and fails at rate or over temperature. Exercise non-transparent bridge windows if the design uses them, and X-ray the BGA for reballing evidence.

### Why are recovered PCIe switches a particular risk?

Because they are large, expensive BGAs, which makes recovery from scrapped servers economically attractive, and because their failure mode is graceful. A reballed and remarked switch will often enumerate and pass a basic functional test at reduced link speed, then produce retraining events and correctable errors at full rate or at temperature — symptoms that look like a board signal-integrity problem rather than a counterfeit part. Link-error counters and full-rate training belong in the acceptance procedure for exactly this reason.

## Related reading

Adjacent interfaces: [interface controller sourcing](/blog/interface-controller-sourcing-guide) for USB, Ethernet and CAN controllers (including the legacy PCI and CardBus bridges that have already gone) and [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide) for the physical-layer framework.

High-speed context: [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide) for differential termination, [clock buffer and fanout sourcing](/blog/clock-buffer-fanout-sourcing-guide) for the reference-clock distribution PCIe depends on — including the HCSL format and the Pericom PCIe clock buffers currently in last-time buy.

Hosts and systems: [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide), [SoC, FPGA-SoC and application processor sourcing](/blog/soc-fpga-application-processor-sourcing-guide).

Decisions: [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), [IDEA-STD-1010 inspection](/blog/idea-std-1010-counterfeit-detection-guide).

Send us the full switch part number and, if you have it, the EEPROM configuration. Without the topology we cannot tell you whether a surviving ordering code is usable, and with it, we usually can.

[**Submit an RFQ**](/rfq) | [**Browse specialized ICs**](/category/specialized-ics) | [**Upload a BOM**](/bom)
