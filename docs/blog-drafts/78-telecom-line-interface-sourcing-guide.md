---
title: "Telecom Line Interfaces: Homologation Is Why You Cannot Just Change the SLIC"
slug: "telecom-line-interface-sourcing-guide"
status: "draft"
seoTitle: "Telecom Line Interface Sourcing: T1/E1 Framers, LIUs, SLICs, DAAs"
seoDesc: "4,124 telecom parts at 58% inactive, DS21xx framers 87% gone. Why type approval dominates substitution cost, plus ringing power, pulse-mask conformance and the MaxLinear LIU last-time buy."
seoKeywords: "T1 E1 framer sourcing, DS21Q354 replacement, XRT83SL30 last time buy, SLIC sourcing Si3226, LIU pulse mask G.703, telecom homologation FCC Part 68, DAA Si3068 obsolete, telecom SSR CPC7582"
tags: "telecom, T1, E1, framers, LIU, SLIC, DAA, homologation, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Video, Display & Telecom"
relatedProducts: "DS21Q354C1, DS3154N, XRT83SL30IV-F, XRT75VL00DIV-F, SI3068-B-FS, LE9500DBJC, CPC7582BB, PM8311A-FEI"
---

# Telecom Line Interfaces: Homologation Is Why You Cannot Just Change the SLIC

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: type approval, ringing and battery feed, pulse-mask conformance, framer register maps, protection coordination

---

**In every other category, a substitution is judged by whether the board still works. Here it is judged by whether the equipment is still legal to connect to a network.** A subscriber line interface circuit, a data access arrangement or a T1/E1 line interface unit sits at a regulated boundary: the port is type-approved against national requirements (TIA-968 in North America, EN 41003 and the ITU-T K-series surge tests elsewhere) and the approval names the design. Change the part and the port has to be re-tested and re-approved in every market the product ships to. That is why a telecom line interface with a two-dollar unit price can carry a five-figure substitution cost, and why our [telecom ICs category](/category/telecom-ics) behaves as it does: **4,124 part numbers with 2,410 no longer active (58%)**, with the Dallas T1/E1 framer line at 87% gone and demand that has not stopped.

## Key takeaways

- **Type approval, not price, dominates the substitution decision.** Re-homologation per market is the real cost.
- **`DS21…` framers are 205 of 236 inactive (87%)**, and MaxLinear's `XRT` line interface units are in last-time buy: the two most common paths out of a T1/E1 design are both closing.
- **A SLIC generates ringing at tens of volts RMS on top of −48 V battery.** Ring load capability is arithmetic, worked below, and a "compatible" SLIC can fail at 5 REN.
- **LIU compliance is a pulse-mask conformance test** (G.703 / T1.102), not a functional check: a substitution needs the transformer and line build-out re-verified.
- **Framer register maps are vendor-specific**, and the framer usually carries the signalling HDLC controller too, so the driver is part of the change.
- **Protection coordination is part of the design**: the primary protector, series resistance and the IC's own clamps are chosen together for K.20/K.21 surge.
- **Telecom solid-state relays must block ringing peak plus battery** — roughly 154 V before any surge allowance.

---

## What the category holds

**Vendors:** Microchip 964 part numbers, Rochester Electronics 779, Broadcom 513, Skyworks Solutions 446, Maxim Integrated 311, IXYS 267.

| Function | Prefixes here | Parts | Not active |
| --- | --- | ---: | ---: |
| **SLIC / subscriber line** | `SI32…` (Silicon Labs ProSLIC), `LE58…`, `LE95…` (Legerity → Microsemi) | 418 | 167 |
| **T1/E1/J1 framers** | `DS21…` (Dallas → Maxim) | 236 | **205 (87%)** |
| **Line interface units** | `XRT…` (Exar → MaxLinear) | — | last-time buy |
| **Zarlink/Mitel legacy** | `ZL5…`, `MT9…` | 186 | 138 (74%) |
| **IDT/Renesas TDM and sync** | `82V…` | 81 | 35 |
| **Telecom access switches / SSRs** | `TS11…`, `TS12…`, `CPC…` (IXYS) | — | mixed |
| **SONET/SDH and mappers** | `PM5…`, `PSB…`, `PEB…` | — | mixed |
| **Modem DAA** | `SI30…` | — | `SI3068-B-FS` obsolete |

Two observations. The Silicon Labs `SI32…` ProSLIC family at 165 of 402 inactive is the healthiest line here, which matters because it is also the most widely designed-in. And **Rochester Electronics at 779 part numbers is the second-largest supplier in the category**: the signature of equipment that is still in service and still being repaired.

## Homologation: the cost that dwarfs the part

A port that connects to the public network is approved as a design, and the approval enumerates the components in the protection and interface path.

| Region | Typical requirement |
| --- | --- |
| North America | FCC Part 68 / TIA-968 (now largely industry-administered), NRTL safety |
| Europe | EN 41003, ITU-T K.21 surge, plus EMC directives |
| ITU-T generally | K.20 (equipment ports), K.21 (customer premises), K.44 |
| Country-specific | National PTT/regulator requirements, still common outside the above |

What changes when the SLIC, DAA or LIU changes:

- **Surge and overvoltage tests are re-run**, because the IC's clamping structure is part of the coordinated protection.
- **Longitudinal balance, return loss and impedance masks** are re-measured against the national template.
- **Ringing and signalling behaviour** is re-verified.
- **Documentation and declarations are re-issued** per market.

So the honest framing for a telecom line interface is: the substitution is a re-certification project with a component change inside it. That inverts the usual arithmetic; an unattractive last-time-buy price is frequently the cheapest option, and the quantity should be sized against the product's whole remaining life per [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage). Where a redesign is unavoidable, budget the approval work first; the framework is [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts).

## SLICs: ringing power is arithmetic

A SLIC feeds DC loop current from a −48 V battery and generates ringing — typically tens of volts RMS at around 20 Hz superimposed on that battery. Its ring capability is quoted in REN (ringer equivalence number), and REN is a load, so it is calculable.

Taking 1 REN as approximately 6.93 kΩ of ringer impedance and a 75 V RMS ring signal:

```
5 REN load          = 6,930 Ω / 5 = 1,386 Ω
ring current        = 75 V / 1,386 Ω = 54 mA RMS
apparent ring power = 75 V × 54 mA  ≈ 4.1 W delivered to the load
```

That power comes out of the ring generator and the battery supply, and a portion is dissipated in the SLIC itself. So a replacement rated for 3 REN cannot serve a line specified for 5, and the failure is load-dependent: it works on a bench with one phone attached and fails at a customer site with several.

Also check, in order:

- **Battery feed current and its programmability.** Loop current is often resistor- or register-set; a different SLIC needs different values.
- **On-hook transmission and ring trip detection thresholds**, which determine whether off-hook is detected reliably during ringing.
- **Ringing waveform** — sinusoidal versus trapezoidal, and whether it is generated internally or by an external ring generator.
- **Thermal path.** A SLIC at 4 W of ring load in a small package with a poor thermal path shuts down; the same arithmetic as in [motor driver sourcing](/blog/motor-driver-sourcing-guide).
- **Pulse metering, line reversal and howler tone** support if the market requires them.

In our catalogue `LE9500DBJC` and `LE7920-1DJCT` (Legerity lineage, now Microsemi/Microchip) are obsolete, while the `SI32…` family remains the live path, but a Legerity-to-Silicon Labs move is a full interface redesign plus re-approval, not a footprint swap.

## T1/E1 line interface units: conformance, not function

An LIU's job is to put a pulse on a line whose shape must fit a template — the G.703 pulse mask for E1, the T1.102 template for T1 — measured at the line side of the transformer.

That makes the substitution a conformance question:

| Specification | Why a substitution disturbs it |
| --- | --- |
| **Pulse shape / mask** | Driver current and internal shaping differ; the mask is measured through *your* transformer |
| **Line build-out (LBO)** | Selectable attenuation settings for cable length; the settings and their values differ per part |
| **Return loss** | Depends on the LIU's output impedance and the transformer |
| **Jitter tolerance and transfer** (G.823/G.824) | The internal jitter attenuator's loop bandwidth and FIFO depth differ |
| **Clock recovery** | Lock range and behaviour on loss of signal |
| **Line coding** | AMI, B8ZS, HDB3 — and whether it is in the LIU or the framer |

The transformer is part of the interface. T1/E1 line transformers are specified with a turns ratio matched to the LIU's drive arrangement, so an LIU change frequently forces a magnetics change, and telecom magnetics have their own obsolescence problem, with the added difficulty that they are safety-critical isolation components.

In our catalogue the MaxLinear LIUs are in last-time buy (`XRT83SL30IV-F`, `XRT83L30IV-F`, `XRT75VL00DIV-F`, `XRT5997IVTR-F`) which is significant because Exar's `XRT` line was one of the main second sources when the Dallas parts went. **Both of the usual escape routes from a legacy T1/E1 design are now closing at once**, which makes this the clearest last-time-buy decision in the category.

## Framers: the register map is the driver

A framer handles the framing format, alarms, performance monitoring and usually an HDLC controller for the signalling channel. None of that is standardised at the register level.

What a framer substitution actually touches:

- **The device driver**, rewritten against a different register map.
- **Alarm and performance-monitor semantics**: the counters the network management system reads.
- **The HDLC channel** for common-channel signalling, if the framer provides it.
- **Elastic store / slip buffer behaviour**, which affects how the system handles clock differences.
- **The backplane interface** — H.100/H.110, or a proprietary TDM bus, and its clock and frame-sync arrangement.

In our catalogue `DS21Q354C1` (quad T1/E1 framer) and `DS3154N` (DS3/E3) are obsolete, and the `DS21…` prefix runs 205 of 236 inactive. `PM5326-FGI` and `PM5329-FGI` (PMC-Sierra lineage, now Microchip) are obsolete; `PM8311A-FEI` is active. The Infineon `PEB`/`PSB` parts — `PEB20525EV1.2`, `PEB2236NV2.1GIPAT-2`, `PSB21150FV1.4`, `PSB7100ZDW-A2` — appear as active through Rochester Electronics, which for legacy ISDN and TDM equipment is often the only source.

Where a framer is genuinely gone, the modern answer is frequently an FPGA: framing, HDLC and alarm logic are well-suited to programmable logic, and the LIU stays as the only analogue part. That converts a dead-end sourcing problem into an FPGA design task (see [how to choose the right FPGA](/blog/how-to-choose-right-fpga)) with the important caveat that **the LIU's conformance still governs the port's approval**.

## Protection coordination is part of the circuit

The IC, the series impedance and the primary protector are chosen as a set to pass surge testing. A telecom port typically has:

1. **Primary protection**: a gas discharge tube or solid-state protector at the connector.
2. **Series impedance** — PTC resistors or fusible resistors, which coordinate with the primary and limit follow current.
3. **Secondary protection** — clamping diodes or a dedicated protector matched to the IC's absolute maximum ratings.
4. **The IC's own on-chip clamps and process voltage rating.**

Substituting the IC changes the coordination. A replacement with lower absolute maximum ratings needs tighter secondary protection; one with a higher rating may leave the existing PTC oversized, which slows the response. Either way the surge test result changes, and that result is part of the approval.

This is also where counterfeit risk becomes a safety issue rather than a reliability one. A remarked SLIC or LIU with a lower process voltage rating passes a functional test and fails a surge event — after installation, on a line exposed to lightning-induced transients. Provenance controls matter more here than in almost any other category: see [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor) and [counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy).

## Telecom solid-state relays and access switches

IXYS accounts for 267 part numbers here, and they are optically coupled MOSFET relays used for line test access, ringing injection and metallic bypass: the parts that replaced mechanical relays in main distribution frames and line cards.

The specification that decides substitution is blocking voltage. It is calculable:

```
ringing 75 V RMS → peak = 75 × 1.414 ≈ 106 V
superimposed on −48 V battery       ≈ 154 V peak across an open contact
plus surge margin per the applicable K-series test
```

So a relay blocking 200 V has very little margin and one blocking 350-400 V is the normal choice. Substituting a lower-voltage part (easy to do, since general-purpose SSRs are cheap and plentiful) produces a device that works until the line rings while the contact is open.

Also check **on-resistance** (it appears in the loop and affects longitudinal balance), **isolation rating**, **LED drive current** and **turn-on/turn-off time** where the relay is used in a make-before-break sequence, which is the same distinction described in [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide).

`CPC7582BB` is obsolete in our catalogue; the `TS117`, `TS118` and `TS120` groups are mixed, with 9 of 16 and 10 of 12 inactive respectively.

## Sourcing notes

58% of the category is inactive (one of the highest rates we hold) and the reason is structural. Legacy TDM telephony is a shrinking network, so no vendor is investing, while the installed equipment keeps running because replacing a carrier's line cards is a capital project rather than a repair. That combination produces exactly what the data shows: parts largely gone, demand persistent, aftermarket significant.

Practical guidance:

- **Scrub for the Dallas/Maxim `DS21…`, Zarlink `ZL5…`/`MT9…` and Exar `XRT…` families first.** Between them they cover most legacy T1/E1 and TDM designs, and all three are heavily inactive or in last-time buy.
- **Check Rochester Electronics for the Infineon `PEB`/`PSB` ISDN and TDM parts** — 779 part numbers in this category come through that channel, and for the Siemens/Infineon lineage it is usually the only one.
- **Treat any last-time-buy notice here as final.** There is no successor generation to migrate to, unlike in a growing market.
- **`M86…` parts (NXP) are in last-time buy**, with some appearing from Flip Electronics and Rochester — another licensed-continuity route worth checking.

Incoming inspection should go beyond function:

- **Verify the process voltage rating**, not just operation: apply the rated maximum line voltage and confirm no conduction. This is what distinguishes a remarked part.
- **Measure the pulse shape against the mask** for LIUs, through the intended transformer.
- **Test ring generation at the rated REN load**, not into a light load.
- **Confirm register identification** and revision on framers, and exercise the alarm and performance counters the management system reads.
- **For SSRs, test blocking at full ringing-plus-battery peak.**

Package and traceability checks follow [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) and [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Type approval / homologation impact per market | Port not legal to connect |
| 2 | Protection coordination (primary, series, secondary) | Surge test failure |
| 3 | Process voltage rating vs line transients | Field failure after a lightning event |
| 4 | SLIC ring load capability in REN | Fails with several ringers attached |
| 5 | Battery feed current programming | Wrong loop current |
| 6 | Ring trip and on-hook detection thresholds | Off-hook missed during ringing |
| 7 | LIU pulse mask through your transformer | Conformance failure |
| 8 | Line build-out settings and values | Wrong line length compensation |
| 9 | Transformer turns ratio pairing | Mask and return loss fail |
| 10 | Jitter tolerance and transfer | G.823/G.824 non-conformance |
| 11 | Framer register map and driver | Software rewrite |
| 12 | HDLC / signalling channel provision | Signalling lost |
| 13 | Backplane TDM interface and clocking | No connectivity to the switch fabric |
| 14 | SSR blocking voltage vs ring + battery peak | Breakdown when the line rings |

## FAQ

### Why is changing a SLIC or LIU so expensive when the part is cheap?

Because the port is type-approved as a design, not as a collection of parts. Approval regimes such as TIA-968 in North America and EN 41003 with the ITU-T K-series surge tests elsewhere test the interface as built, and the IC's clamping structure is part of the coordinated protection that passes those tests. Changing it means re-running surge, balance, impedance and ringing tests and re-issuing declarations for every market the product ships to. The re-certification typically costs far more than the component, which is why an unattractive last-time-buy price is often the rational choice.

### How do I know whether a replacement SLIC can drive my line?

Work it from the ringer equivalence number. Taking 1 REN as roughly 6.93 kΩ, a 5 REN load is about 1,386 Ω, and a 75 V RMS ring signal into that is 54 mA RMS — around 4.1 W delivered, part of which is dissipated in the SLIC. So a part rated for 3 REN cannot serve a 5 REN line, and the failure is load-dependent: it will pass a bench test with a single phone and fail at a site with several ringers. Check the ring load rating, the thermal path in your package, and the battery feed programming method.

### What makes a T1/E1 LIU substitution risky?

It is a conformance component. The transmitted pulse must fit a template — the G.703 mask for E1, T1.102 for T1 — measured on the line side of the transformer, so the LIU, its line build-out settings and your specific transformer are tested together. A replacement changes driver current, internal shaping, return loss and the jitter attenuator's behaviour, and the transformer turns ratio may no longer match. None of that shows up as a functional failure: the link passes traffic while the port no longer conforms.

### Are framer registers standardised?

No. Framing formats are standardised but register maps are not, so `DS21Q354` and an `XRT84`-class part are not interchangeable from software's point of view. The framer also typically provides the HDLC controller for the signalling channel, the alarm and performance-monitoring counters that the network management system reads, and the elastic store behaviour that handles clock differences — all of which the driver and the management layer depend on. Budget a driver rewrite and management-plane re-testing with any framer change.

### Can an FPGA replace an obsolete framer?

Often yes. It is a used approach. Framing, line coding, HDLC and alarm logic map well onto programmable logic, and it removes a single-source dependency permanently. The important caveat is that it does not remove the analogue problem: the line interface unit still drives the line, and the port's approval depends on that pulse conformance. So an FPGA solves the digital half and leaves the LIU as the part you still have to source, which is where the current last-time-buy notices are.

### What blocking voltage does a telecom line relay need?

More than most general-purpose relays offer. Ringing at 75 V RMS peaks at about 106 V, and superimposed on a −48 V battery that is roughly 154 V across an open contact before any surge allowance is added. Parts rated at 350 to 400 V are the normal choice, and substituting a cheap 200 V device produces something that works until the line rings while the contact is open. Also check on-resistance, since it sits in the loop and affects longitudinal balance, and the isolation rating.

### Which telecom families are most at risk right now?

The Dallas/Maxim `DS21…` framers at 205 of 236 part numbers inactive, the Zarlink and Mitel `ZL5…` and `MT9…` lines at 138 of 186, and (most urgently) the MaxLinear `XRT…` line interface units, which are in last-time buy. That last one matters because the `XRT` family was a common second source when the Dallas parts went, so both escape routes from a legacy T1/E1 design are closing at once. The Silicon Labs `SI32…` ProSLIC family is the healthiest line in the category at 165 of 402 inactive.

### Why does counterfeit risk matter more in telecom interfaces?

Because the failure mode is a safety and compliance one rather than a functional one. A remarked SLIC or LIU built on a lower-voltage process will pass every functional test (it feeds loop current, it rings, it passes traffic) and then fail during a lightning-induced transient after installation, on a port whose approval assumed a specific voltage rating. Electrical inspection can catch it if you deliberately test the rated maximum line voltage for conduction, but provenance is the stronger control, and for network-connected equipment it is usually a contractual requirement anyway.

## Related reading

Physical layer and protection: [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide) for the general framework, [RS-485 transceiver sourcing](/blog/rs485-transceiver-sourcing-guide) for the industrial equivalent of line-side robustness, [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide) for switching-order and fault-protection concepts.

Digital side: [interface controller sourcing](/blog/interface-controller-sourcing-guide), [legacy video interface and display driver sourcing](/blog/video-display-interface-sourcing-guide) for the other half of this cluster, [how to choose the right FPGA](/blog/how-to-choose-right-fpga) where the framer moves into logic, and [clock generators and PLLs](/blog/clock-generator-pll-sourcing) for network synchronisation.

Procurement: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) (the decision this category forces most often) [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor), [counterfeit-avoidance procurement policy](/blog/counterfeit-avoidance-procurement-policy).

Send us the part number with the markets the product is approved in. If re-homologation is on the table we will tell you, because that usually decides between stock and redesign before any technical comparison starts.

[**Submit an RFQ**](/rfq) | [**Browse telecom ICs**](/category/telecom-ics) | [**Upload a BOM**](/bom)
