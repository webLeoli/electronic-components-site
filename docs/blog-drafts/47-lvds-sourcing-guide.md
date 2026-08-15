---
title: "LVDS and High-Speed Differential Sourcing: Termination Is the Spec"
slug: "lvds-sourcing-guide"
status: "draft"
seoTitle: "LVDS Sourcing Guide: LVDS vs M-LVDS vs LVPECL vs CML"
seoDesc: "LVDS, M-LVDS, LVPECL and CML differ in common mode, swing and termination and are not interchangeable. Driver vs receiver vs transceiver, failsafe, skew, and substitution checks."
seoKeywords: "LVDS sourcing, DS90LV031, SN65LVDS, M-LVDS, LVPECL termination, LVDS vs CML, LVDS failsafe, differential signalling substitution, SerDes"
tags: "LVDS, M-LVDS, LVPECL, CML, differential, high speed, interface, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "DS90LV031ATMTC, DS90LV018ATM/NOPB, SN65LVDS19DRFT, SN65MLVD200AD, MC100EP16VADTG, DS90CP22M-8/NOPB"
---

# LVDS and High-Speed Differential Sourcing: Termination Is the Spec

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: LVDS, M-LVDS, LVPECL, CML, termination, skew, differential signalling

---

**Four differential signalling standards share the same two-pin appearance and almost nothing else.** LVDS, M-LVDS, LVPECL and CML differ in common-mode voltage, differential swing, output structure and (decisively) the termination network they require. Dropping one into another's footprint produces anything from degraded margin to no output at all, and the board gives no clue which. Add roughly 1,100 LVDS parts and 1,280 LVPECL parts in our catalogue, many of them legacy, and this becomes a routine sourcing question with a non-routine answer.

## Key takeaways

- **Termination is a property of the standard, not the board.** LVDS needs 100 Ω across the pair; LVPECL needs a DC path to ground; CML is usually terminated to VCC.
- **LVPECL without its bias network does nothing**: the outputs are emitter followers and simply sit undefined.
- **M-LVDS is not LVDS.** It is the multipoint variant with larger swing and different loading, for bus topologies rather than point-to-point.
- **Driver, receiver and transceiver are separate devices** and the part number does not always make it obvious.
- **Failsafe behaviour on an open or undriven input** varies, exactly as it does for [RS-485](/blog/rs485-transceiver-sourcing-guide).
- **Skew specifications matter for parallel links** — channel-to-channel and part-to-part.

---

## Four standards, four termination networks

| Standard | Typical common mode | Differential swing | Termination | Bias requirement |
| --- | --- | --- | --- | --- |
| **LVDS** | ~1.2 V | ~350 mV | 100 Ω across the pair at the receiver | Self-biased |
| **M-LVDS** | ~1.0–1.2 V | ~500–600 mV | 100 Ω at **both ends** of the bus | Self-biased |
| **LVPECL** | ~VCC − 1.3 V | ~800 mV | 50 Ω to VCC−2 V, or Thevenin equivalent | **Requires DC path to ground** |
| **CML** | ~VCC − 0.2 V | ~400–800 mV | 50 Ω to VCC, often on-die | Usually internal |

The LVPECL row is where boards die quietly. LVPECL outputs are emitter followers: they source current but need a resistive path to ground to establish their operating point. An LVDS footprint provides a 100 Ω differential resistor and no ground path, so an LVPECL part fitted there produces outputs sitting at an undefined level. It is not a marginal-signal problem — there is no signal.

The usual LVPECL terminations are either 150 Ω from each output to ground (with AC coupling if the receiver's common mode differs), or a Thevenin network of two resistors per leg presenting 50 Ω to an effective VCC−2 V.

**CML** is common in SerDes and optical module interfaces and frequently has on-die termination, which means the board may have no external resistors at all, and a part expecting external termination will not work there.

## LVDS versus M-LVDS

These are frequently confused because the names differ by one letter and the function looks identical.

| | LVDS (TIA/EIA-644) | M-LVDS (TIA/EIA-899) |
| --- | --- | --- |
| Topology | Point-to-point, or one driver to few receivers | Multipoint bus, many drivers and receivers |
| Swing | ~350 mV | ~500–600 mV (drives a doubly-terminated bus) |
| Termination | 100 Ω at the receiver | 100 Ω at **both** ends |
| Driver | Not designed for bus contention | Designed for hot-swap and contention |
| Failsafe | Varies | Type-1 or Type-2 receiver thresholds |
| Typical use | Display links, FPGA-to-FPGA, clock distribution | Backplanes, multipoint control buses |

Substituting LVDS for M-LVDS on a bus fails because the LVDS driver cannot pull a doubly-terminated 50 Ω load to adequate swing. Substituting M-LVDS for LVDS point-to-point usually works electrically but wastes power and may overdrive.

M-LVDS receiver types matter too. Type-1 has a threshold near zero for maximum sensitivity; Type-2 has an offset threshold that provides a defined output when the bus is idle: the same failsafe trade-off described for [RS-485](/blog/rs485-transceiver-sourcing-guide). Substituting Type-1 for Type-2 loses the idle-bus guarantee.

## Driver, receiver, transceiver — read the part number carefully

The function is not always obvious from the number, and getting it wrong is an immediate non-function.

Within the DS90 family alone:

- `DS90LV031ATMTC` — quad **driver** (LVTTL in, LVDS out)
- `DS90LV018ATM/NOPB` — single **receiver** (LVDS in, LVTTL out)
- `DS90CP22M-8/NOPB`: a **crosspoint switch**, a different function entirely

A "032" is conventionally the receiver counterpart to a "031" driver, and similar pairings run through the family, but conventions are not universal across vendors. **Check the functional block diagram, not the number pattern.**

Similarly `SN65LVDS1DBVRG4` is a single driver while `SN65LVDS19DRFT` is a different configuration. Channel count and direction both live in the number.

## What else has to match

Data rate and edge rate. LVDS parts are specified to a maximum signalling rate. Substituting a faster part is usually safe electrically but produces faster edges, which increases emissions and reflection sensitivity: the same EMC consideration described in [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide).

**Skew.** Two specifications matter for parallel links:
- **Channel-to-channel skew** within one device, which limits how wide a synchronous parallel bus can be.
- **Part-to-part skew**, which matters when a clock and data come from separate packages.

A replacement with worse skew narrows the sampling window and can break a link that had little margin.

Propagation delay, which affects overall latency budgets in pipelined systems.

Failsafe on open, shorted or terminated-but-undriven inputs. Receivers differ in whether they guarantee a defined output. On a hot-swappable backplane this is not optional.

Supply voltage. 3.3 V is conventional for LVDS, but 2.5 V and dual-supply parts exist.

Enable behaviour and power-down state, particularly whether outputs go high-impedance or to a defined level.

## LVPECL and the legacy clock-distribution problem

LVPECL survives mainly in clock distribution, where its low jitter and fast edges remain valuable. Our catalogue holds roughly 1,280 parts by prefix: the MC100EP family being the classic lineage, with parts such as `MC100EP16VADTG` current and `MC100EP16VSDTG` already discontinued.

Two sourcing-relevant points:

The supply variants are distinct products. PECL (5 V), LVPECL (3.3 V) and ECL (negative supply) share signalling concepts but not supplies. A part number that looks similar may be a different supply variant entirely.

Translation parts exist and are their own category. LVPECL-to-LVDS, LVDS-to-LVPECL and similar translators are specific devices; you cannot make one from a plain buffer of either type.

For the jitter considerations that usually drive LVPECL selection, see [clock generators and PLLs](/blog/clock-generator-pll-sourcing).

## Sourcing notes

Within the Drivers, Receivers & Transceivers category (19,068 parts, 34% discontinued) the differential families are well represented and heavily weighted toward legacy.

Authorised aftermarket is significant here. `DS90LV031ATMTC` in our catalogue comes through Rochester Electronics, which is typical for the older National Semiconductor DS90 lineage now under TI. For a legacy display link or backplane, checking that channel first frequently resolves the problem without any engineering — see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Incoming testing should verify differential output amplitude and common-mode voltage into the correct termination, not into an oscilloscope's 50 Ω input, which is itself a termination and will give misleading results for LVDS. Confirm receiver threshold and, where specified, failsafe behaviour with inputs open.

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Signalling standard matches the board's termination | No output, or unusable levels |
| 2 | LVPECL bias path present | Outputs sit undefined |
| 3 | LVDS vs M-LVDS for the topology | Driver cannot pull a doubly-terminated bus |
| 4 | M-LVDS receiver type (1 or 2) | Loss of idle-bus failsafe |
| 5 | Driver / receiver / transceiver function | Signal flows the wrong way |
| 6 | Channel count and mapping | Pinout mismatch |
| 7 | Maximum data rate and edge rate | EMC, or link too slow |
| 8 | Channel-to-channel and part-to-part skew | Narrowed sampling window |
| 9 | Failsafe on open inputs | Undefined output on hot-swap |
| 10 | Supply voltage and enable behaviour | Marginal or contention |

## FAQ

### Can I replace an LVDS part with LVPECL?

No, not without changing the termination. LVPECL outputs are emitter followers requiring a DC current path to ground — typically 150 Ω per leg to ground or a Thevenin network equivalent to 50 Ω into VCC minus 2 V. An LVDS footprint provides a 100 Ω differential resistor across the pair and no path to ground, so an LVPECL device fitted there produces outputs sitting at an undefined level with no usable signal. The common-mode voltages also differ substantially.

### What is the difference between LVDS and M-LVDS?

LVDS is point-to-point signalling with roughly 350 mV swing terminated once at the receiver. M-LVDS is the multipoint variant with a larger swing, around 500 to 600 mV, designed to drive a bus terminated at both ends and to survive contention and hot-swap. Substituting LVDS onto an M-LVDS bus fails because the driver cannot achieve adequate swing into the doubly-terminated load. M-LVDS also defines two receiver types with different threshold offsets.

### What are M-LVDS Type-1 and Type-2 receivers?

Type-1 receivers have a switching threshold near zero volts differential, giving maximum sensitivity. Type-2 receivers have a deliberately offset threshold so that an idle or undriven bus produces a defined output state: the multipoint equivalent of failsafe biasing in RS-485. Substituting a Type-1 part where a Type-2 was used removes the idle-bus guarantee, so receivers may output random data when no driver is active.

### How do I tell whether an LVDS part is a driver or a receiver?

Read the functional block diagram rather than inferring from the number. Within the DS90 family, DS90LV031 is a quad driver taking LVTTL in and producing LVDS out, while DS90LV018 is a single receiver doing the reverse, and DS90CP22 is a crosspoint switch, a different function altogether. Conventions such as 031 pairing with 032 exist within families but are not consistent across vendors.

### Does LVDS need termination at both ends?

Point-to-point LVDS requires a single 100 Ω termination across the pair at the receiver end, matching the differential impedance of the transmission line. M-LVDS, being a multipoint bus, requires 100 Ω termination at both physical ends of the bus. Adding a second termination to a point-to-point LVDS link halves the effective load impedance and reduces the received swing.

### Why does skew matter when substituting an LVDS part?

Because it consumes the sampling window on parallel links. Channel-to-channel skew within one device limits how wide a synchronous parallel bus can run, and part-to-part skew matters where clock and data originate from separate packages. A replacement with worse skew specifications narrows the window available to the receiver, which can break a link that previously had adequate but not generous margin.

### How should I measure LVDS signals during incoming inspection?

Into the correct termination, not into an oscilloscope's 50 Ω input. A scope input presents its own termination that does not match the LVDS network, so measurements taken that way misrepresent both amplitude and common-mode voltage. Verify differential output amplitude and common mode across a proper 100 Ω load, confirm the receiver switching threshold, and where the datasheet specifies failsafe behaviour, test it with the inputs left open.

### Is LVPECL still used and is it available?

Yes, primarily in clock distribution where its low jitter and fast edges remain valuable. Our catalogue holds roughly 1,280 parts by prefix, dominated by the MC100EP lineage, with a mix of active and discontinued devices. Note that PECL at 5 V, LVPECL at 3.3 V and ECL on a negative supply are distinct product variants despite similar naming, so the supply arrangement must be confirmed rather than assumed from the part number.

## Related reading

The cross-cutting framework is in [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide). For the failsafe and common-mode concepts in a multipoint context, [RS-485 transceiver sourcing](/blog/rs485-transceiver-sourcing-guide). Where LVPECL is being used for clocking, [clock generators and PLLs](/blog/clock-generator-pll-sourcing) covers the jitter specifications that usually drive the choice. For the channel decision, [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number with your topology, termination and data rate and we will come back with candidates that match the standard, not just the pinout.

[**Submit an RFQ**](/rfq) | [**Browse transceivers**](/category/drivers-receivers-transceivers) | [**Upload a BOM**](/bom)
