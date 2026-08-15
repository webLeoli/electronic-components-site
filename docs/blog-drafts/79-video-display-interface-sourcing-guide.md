---
title: "Legacy Video and Display Drivers: The Analogue CCTV Installed Base Is Still Buying"
slug: "video-display-interface-sourcing-guide"
status: "draft"
seoTitle: "Legacy Video Interface and Display Driver Sourcing Guide"
seoDesc: "3,976 video parts at 58-59% inactive and 1,251 display drivers at 54%. Sync separators, crosspoints, HDMI transmitters tied to HDCP, Techwell CCTV decoders in last-time buy, and VFD/LCD drivers."
seoKeywords: "video crosspoint sourcing, TDA9981 obsolete, HDMI transmitter HDCP key, TW2851 last time buy, analog CCTV decoder replacement, sync separator LM1881, display driver PCF2119, VFD driver MAX6921"
tags: "video, display drivers, crosspoint, HDMI, HDCP, CCTV, VFD, LCD, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Video, Display & Telecom"
relatedProducts: "TW2851-BB2-GR, TDA18220HN/C1K, LMH0002SQX/NOPB, EL1881CS-T7, ADV8005KBCZ-8B, FMS6203MTC1406X, MAX6921AWI/V+, PCF2119DU/2/2Z"
---

# Legacy Video and Display Drivers: The Analogue CCTV Installed Base Is Still Buying

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: sync separators and crosspoints, HDMI and HDCP keys, CCTV decoders, VFD and LCD drivers, obsolescence

---

**Analogue video was supposed to be finished a decade ago, and the part numbers say otherwise: the video categories in our catalogue run 58-59% inactive, and the parts still being asked for are the ones serving installed systems that were never converted.** Multi-channel CCTV decoders for coaxial camera plants, sync separators in broadcast monitoring, video crosspoints in industrial inspection, VFD and character-LCD drivers in machines whose front panel is the user interface. None of these applications is growing, and none of them is being redesigned either; the cameras are on the walls, the machine is on the factory floor, and the panel is behind glass. That combination is what produces a 58% obsolescence rate with live demand. It is worth knowing which specific families have already closed.

## Key takeaways

- **`TDA98…` is 40 of 40 inactive and `TDA99…` 41 of 47**: the NXP video IF and HDMI transmitter lines are effectively gone.
- **HDMI transmitters carry an HDCP key**, which makes them a licensing problem as well as a sourcing one.
- **The Techwell `TW28xx` multi-channel CCTV decoders are in last-time buy** (now Renesas): the standard part for 4-, 8- and 16-channel analogue DVRs.
- **Intersil video parts are the worst-affected line**: `ISL59…` is 75 of 83 inactive, `EL5…` 41 of 41.
- **Display drivers are 673 of 1,251 inactive (54%)**, and the Sanyo `LC75…` LCD driver family is largely obsolete.
- **A sync separator's slice level and a crosspoint's bandwidth are not interchangeable specifications** — details below.
- **Rochester Electronics is the largest supplier in both categories**, which is the signature of repair-driven demand.

---

## What is actually in these categories

Video processing (2,467 parts, 58% inactive) and video amplifiers (1,509, 59%), plus display drivers (1,251, 54%). Vendors for video: Rochester Electronics 414, NXP 273, Semtech 252, Texas Instruments 247, Skyworks 195, Renesas 178.

| Group | Prefixes | Parts | Not active |
| --- | --- | ---: | ---: |
| NXP video IF / HDMI transmitters | `TDA98…`, `TDA99…` | 87 | **81 (93%)** |
| Intersil video buffers and crosspoints | `ISL59…`, `EL5…` | 124 | **116 (94%)** |
| ADI crosspoints and buffers | `AD81…`, `AD82…` | 113 | 47 |
| ADI video decoders/encoders | `ADV7…` | 67 | 13 |
| TI video buffers and filters | `THS7…`, `LMH…` | 169 | 30 |
| Techwell CCTV decoders | `TW28…`, `TW29…` | — | **last-time buy** |
| Sanyo/onsemi LCD drivers | `LC75…`, `LC74…` | — | largely obsolete |

Read the two extremes. The TI `THS7…` video filter/buffer line at 2 of 46 inactive and `ADV7…` at 13 of 67 are healthy — these are the parts still shipping into current designs. The Intersil and NXP lines are 93-94% gone, and they are exactly what legacy equipment contains.

## HDMI transmitters: the key is the problem

An HDMI transmitter contains, or is provisioned with, HDCP keys, and those keys are licensed per device. That makes a substitution a licensing exercise:

- **Keys are provisioned by the vendor or by an authorised programmer**, tied to a licence agreement.
- **A replacement transmitter needs its own keys**, obtained under the same agreement, with a production programming step.
- **Keys from a different device generation may not satisfy current requirements**, so the substitution can force a jump to a newer HDCP revision, which the sink devices in the field may or may not accept.
- **Grey-market transmitters may carry keys that have been revoked**, which produces equipment that negotiates and then fails to display protected content.

In our catalogue `TDA9981AHL/15C181` and `TDA9984AHW/15/C130551` class parts appear as obsolete, and `TDA18220HN/C1K` (a silicon tuner) is obsolete while `TDA18250HN/C1557` and `TDA10028HN/C1518` remain available through Rochester Electronics.

The practical guidance: if a design uses an HDMI transmitter with provisioned keys, **treat the key supply as the constraint, not the silicon**, and where the equipment shows only local, unprotected content, check whether the HDCP path is needed at all. Removing an unnecessary protected path turns a licensing problem into an ordinary component choice.

## Sync separators and video timing

A sync separator extracts composite sync, burst gate and odd/even field information from a composite video signal, and its slice level determines whether it works on a degraded signal.

The specifications that matter in a substitution:

- **Slice level** — fixed fraction of sync amplitude versus adaptive. On a long coaxial run with attenuated sync, an adaptive part locks where a fixed one does not.
- **Input signal range and AC/DC coupling** requirements.
- **Standard support** — 525/60 and 625/50, plus whether it tolerates non-standard or VCR-sourced timing with unstable field rates.
- **Output set** — composite sync, horizontal, vertical, burst gate, odd/even, and back-porch clamp: designs use different subsets, and a replacement missing one output breaks the timing chain.
- **Behaviour on loss of signal**, which the system may use for camera-fault detection.

`EL1881CS-T7` is obsolete in our catalogue, and the `EL5…` prefix is 41 of 41 inactive. **For a CCTV or broadcast monitoring product built around one of these, the sync separator is often the single blocking part**, and because its outputs feed logic timing rather than a picture, a substitute with different output polarity or timing offsets requires the downstream logic to change too.

## Video crosspoints and buffers

A crosspoint switch routes N inputs to M outputs, and its specification is bandwidth, isolation and settling, not channel count alone.

| Specification | Why substitution disturbs it |
| --- | --- |
| **−3 dB bandwidth** | Must exceed the signal's requirement with margin; SD, HD and 3G-SDI differ by an order of magnitude |
| **0.1 dB flatness bandwidth** | The number that actually governs picture quality |
| **Crosstalk / off-isolation at frequency** | Falls with frequency; a "same" part can show visible ghosting |
| **Differential gain and phase** | Colour-critical in analogue composite systems |
| **Output drive and load** | Back-terminated 75 Ω doubles the required swing |
| **Gain configuration** | Unity-gain buffered versus gain-of-two output stages |

The 75 Ω back-termination point catches people. A video output driving a back-terminated 75 Ω line must produce twice the line amplitude internally, so a replacement with lower output swing or drive current cannot reach standard levels: the picture is dim or the sync amplitude falls below the receiver's slice level, which then looks like a sync problem rather than a level problem.

Active in our catalogue: `FMS6203MTC1406X` and `FMS6403MTC20X` (video filter/driver), `ADV8005KBCZ-8B`, `LMH6715MA`, `OPA692IDBVR`, `OPA360AIDCKR`, `AD8072ARMZ`. Obsolete: `ISL59886ISZ-T7`, `EL4332CS-T13`, `AD8013AN`, `AD8073JR`, `MAX9507ATE+`, `MAX9502GAAXK+T`, `BUF01901AIDRCR`. In last-time buy: `ISL59830IAZ-T7`, `ISL59110IEZ-T7`, `MAX453CSA+`, `MAX452ESA+`, `MAX454CPD+`, `LT1191CN8`, `LT1256CN`.

`LMH0002SQX/NOPB` is obsolete and worth calling out: an SDI cable driver, which puts it in broadcast infrastructure where equipment lifetimes are long and the signal standard is fixed by the plant.

## Analogue CCTV decoders: a large installed base with a closing supply

The Techwell `TW28xx` and `TW29xx` families decode multiple analogue camera inputs into digital video with time-division multiplexing: the standard silicon inside 4-, 8- and 16-channel analogue DVRs, and still present in a great many industrial, transport and building-security installations.

In our catalogue these are **last-time buy**: `TW2851-BB2-GR`, `TW2837-BB1-GR`, `TW2836-BA1-GR`, `TW2826-LA2-CR`, `TW2968-LA1-CR`. Techwell went to Intersil and then to Renesas, and the line is being wound down.

Why this matters more than the part count suggests:

- **The cameras are the investment**, not the recorder. A site with 32 coaxial cameras and existing cabling replaces the DVR, not the plant, so demand for multi-channel analogue decode continues long after the format stopped being specified for new work.
- **There is no drop-in successor.** Modern equivalents target HD analogue formats (AHD/TVI/CVI) with different decoders, or IP cameras, which is a whole-system change.
- **The decoder carries the audio and the multiplexing scheme**, so a substitution touches the recorder's capture pipeline and its firmware.

If a product line uses these, the last-time-buy quantity is effectively the product's remaining life — sized per [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage). This is one of the clearest cases in the catalogue where the decision cannot be deferred.

## Display drivers: 54% inactive, and the panel decides

Display drivers (1,251 parts, 673 inactive) split into several families that are not interchangeable at all, because each is matched to a display technology.

| Type | Examples here | Notes |
| --- | --- | --- |
| **Character LCD / segment drivers** | `PCF2119DU/2/2Z` (last-time buy), `PCA85162T` (obsolete), `MM5452VX/NOPB`, `MM5450YV-TR` (active) | Multiplex ratio, bias generation and character ROM matter |
| **VFD drivers** | `MAX6921AWI/V+` (active) | High-voltage outputs, typically 60-80 V |
| **LED display / digit drivers** | `CD4543BE`, `CD4056BE`, `MC74HC4511F` (active), `ICM7218A/B/C` (last-time buy) | Segment decode plus drive |
| **Sanyo/onsemi LCD controller-drivers** | `LC75827E-E`, `LC75853NE-E`, `LC75822WD-E`, `LC75808W-E` (all obsolete) | Panel-specific glass drivers |
| **DLP / projection controllers** | `DLPC6421AZPC` (last-time buy) | Bound to a specific DMD |

Three substitution rules specific to displays:

The character ROM is part of the part. A character LCD driver contains a font table, and a replacement with a different ROM shows different glyphs for the same codes — invisible in a functional test that only checks "the display lights up", obvious to a user reading an alarm message.

Bias generation and multiplex ratio are matched to the glass. LCD contrast depends on the drive voltage and bias scheme for the panel's multiplex ratio; a driver with a different bias arrangement produces ghosting or a washed-out display even when the interface works.

High-voltage drivers are a separate class. A VFD driver such as the `MAX6921` switches tens of volts; nothing in the LED-driver families replaces it.

And the same lesson as elsewhere in this cluster: the display driver's lifecycle is the panel's lifecycle. When the glass is discontinued, the driver has no other customer, the pairing problem also described for display-bias PMICs in [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide).

## Sourcing notes

Rochester Electronics is the largest supplier in the video category (414 part numbers) and in display drivers (268): the clearest possible indicator that this demand is repair and sustainment rather than new design.

Priorities if you own a legacy video product:

1. **Scrub for Intersil and Elantec video parts** (`ISL59…`, `EL5…`, `EL1881`, `EL4332`) — 94% inactive between them, and they are common in monitoring and inspection equipment.
2. **Scrub for NXP `TDA98…`/`TDA99…`** — 93% inactive, covering video IF, HDMI transmit and tuner functions.
3. **Decide the `TW28xx` last-time buy now** if you build multi-channel analogue video equipment.
4. **Check display drivers against panel availability** — if the glass is also going, the answer is a front-panel redesign, not a driver search.
5. **For SDI and broadcast paths**, check the whole signal chain: cable drivers, equalisers and reclockers tend to go together, and `LMH0002SQX/NOPB` being obsolete is a signal about that generation.

Incoming inspection for video parts should be measured, not observed:

- **Bandwidth and flatness** into the correct back-terminated load, not into a high-impedance probe.
- **Crosstalk between adjacent channels at the top of the signal band**, since this is where a remarked or downgraded part fails.
- **Sync separator lock on a deliberately attenuated and noisy signal**, not a clean generator output.
- **For display drivers, exercise the full character set or segment map** and compare against a known-good unit; this is what catches a different character ROM.
- **For HDMI transmitters, verify key provisioning and a full authentication handshake** with a real sink.

Package and traceability checks per [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) and [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | HDCP key provisioning and licence path | Cannot display protected content |
| 2 | Video standard support (525/60, 625/50, HD, SDI rate) | No lock or wrong timing |
| 3 | Sync separator slice level and output set | Fails on degraded signals; timing chain breaks |
| 4 | −3 dB **and** 0.1 dB flatness bandwidth | Soft or distorted picture |
| 5 | Crosstalk and off-isolation at signal frequency | Visible ghosting between channels |
| 6 | Output drive into back-terminated 75 Ω | Low level; sync below receiver slice |
| 7 | Gain configuration (unity vs ×2) | Wrong signal amplitude |
| 8 | Differential gain and phase | Colour errors in composite systems |
| 9 | Multi-channel decoder multiplexing scheme and audio | Capture pipeline and firmware change |
| 10 | Display driver character ROM | Wrong glyphs on the panel |
| 11 | LCD bias scheme and multiplex ratio | Ghosting or washed-out display |
| 12 | High-voltage capability for VFD | Cannot drive the tube |
| 13 | Panel availability alongside the driver | Driver search solves nothing |

## FAQ

### Why are HDMI transmitters harder to substitute than other interface parts?

Because they carry HDCP keys, which are licensed per device and provisioned by the vendor or an authorised programmer under a licence agreement. A replacement transmitter needs its own keys obtained through that agreement plus a production programming step, and keys from a different device generation may not meet current requirements, which can force a move to a newer HDCP revision that field sink devices may not accept. Grey-market parts may even carry revoked keys, producing equipment that authenticates and then refuses to display. Treat key supply as the constraint rather than the silicon.

### What should I check when replacing a sync separator?

Slice level first: a fixed-fraction slice fails on a long coaxial run where sync amplitude has been attenuated, while an adaptive part still locks. Then confirm which outputs the design uses — composite sync, horizontal, vertical, burst gate, odd/even field, back-porch clamp, because designs use different subsets and a missing output breaks the timing chain rather than degrading the picture. Also verify tolerance of non-standard timing if the source can be a VCR or an unsynchronised camera, and the behaviour on loss of signal if the system uses it for fault detection.

### Why does my replacement video buffer give a dim picture?

Most likely output swing into a back-terminated 75 Ω line. Standard video outputs use a series 75 Ω resistor to match the cable, which halves the delivered amplitude, so the buffer must produce twice the line level internally. A replacement with lower output swing or insufficient drive current cannot reach standard levels; the picture looks dim and, more confusingly, sync amplitude can fall below the receiving equipment's slice level so it presents as a sync fault. Check output voltage swing at the rated load current, not just bandwidth.

### What replaces a Techwell TW28xx multi-channel CCTV decoder?

Nothing directly, and that is the point of the last-time-buy notice. These parts decode several composite camera inputs with time-division multiplexing and were the standard silicon in analogue DVRs; the modern alternatives target HD analogue formats with different decoders, or IP cameras, both of which are whole-system changes. Meanwhile the installed base persists because the cameras and coaxial cabling are the investment, not the recorder. If you build this equipment, the last-time-buy quantity is effectively the product's remaining life.

### Are display drivers interchangeable if the interface matches?

No, for three reasons that a functional test misses. Character LCD drivers contain a font ROM, so a replacement with a different table displays different glyphs for the same codes: the display lights up and the alarm text is wrong. LCD bias generation and multiplex ratio are matched to the specific glass, so a different bias scheme produces ghosting or poor contrast. And high-voltage families such as VFD drivers, switching tens of volts, have no equivalent among LED or LCD drivers. Compare the full character map against a known-good unit.

### Which video families should I scrub for first?

The Intersil and Elantec lines — `ISL59…` at 75 of 83 inactive and `EL5…` at 41 of 41, plus `EL1881` sync separators and `EL4332` buffers, and the NXP `TDA98…`/`TDA99…` group at 81 of 87. Between them they cover a great deal of monitoring, inspection and broadcast-adjacent equipment. The healthy families, by contrast, are TI's `THS7…` at 2 of 46 inactive and ADI's `ADV7…` at 13 of 67, which is where a redesign should aim.

### Is legacy analogue video worth sourcing at all, or should customers just upgrade?

The decision belongs to whoever owns the installation, and the economics usually favour sustaining. In a building or transport site the cameras, conduit and coaxial cabling represent most of the capital, and converting to IP means re-cabling or adding encoders per camera. The same logic applies to industrial inspection systems built around specific optics and a frame grabber. That is why our catalogue shows 58% obsolescence in video with Rochester Electronics as the largest supplier: the demand is sustainment. It is real.

### What does incoming inspection need to measure on video parts?

Bandwidth and 0.1 dB flatness into the correct back-terminated load rather than into a high-impedance probe, and crosstalk between adjacent channels at the top of the signal band, since that is where a downgraded or remarked part fails while passing a basic test. Sync separators should be locked onto a deliberately attenuated and noisy signal, not a clean generator output. Display drivers should be exercised across the entire character set or segment map and compared against a known-good unit, which is the only reliable way to detect a different font ROM.

## Related reading

The rest of this cluster: [telecom line interface sourcing](/blog/telecom-line-interface-sourcing-guide), the same "installed base cannot be redesigned" economics with regulatory approval on top.

Signal-path neighbours: [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide) for the switching behaviour behind crosspoints, [op-amp equivalents](/blog/op-amp-equivalent-selection) for buffer specifications, [ADC sourcing](/blog/adc-sourcing-guide) where video is digitised, [LVDS and high-speed differential sourcing](/blog/lvds-sourcing-guide) for display and camera links.

System context: [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide) for display bias and the panel-lifecycle problem, [interface controller sourcing](/blog/interface-controller-sourcing-guide), [DSP sourcing](/blog/dsp-sourcing-guide) for the video DSPs in recorders.

Procurement: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number with the video standard and, for displays, the panel it drives. In this category the panel or the camera plant usually decides the answer before the semiconductor does.

[**Submit an RFQ**](/rfq) | [**Browse video ICs**](/category/video-processing) | [**Browse display drivers**](/category/display-drivers) | [**Upload a BOM**](/bom)
