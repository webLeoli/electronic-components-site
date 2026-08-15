---
title: "Interface Controllers: The Host Driver Is Part of the Part Number"
slug: "interface-controller-sourcing-guide"
status: "draft"
seoTitle: "USB, Ethernet and CAN Interface Controller Sourcing Guide"
seoDesc: "3,537 interface controller parts at 45% inactive. Why a USB bridge substitution breaks the host driver, VID/PID and counterfeit FTDI risk, Ethernet PHY strapping, CAN FD, and dead legacy buses."
seoKeywords: "USB bridge sourcing, FT232R counterfeit driver, CP2102 vs FT232, Ethernet PHY RMII clock direction, KSZ8081 strapping, MCP2515 vs MCP2517FD CAN, PTN5100 last time buy, PCI CardBus obsolete"
tags: "interface controllers, USB, Ethernet PHY, CAN, USB-C, VID PID, counterfeit, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Interface & Logic Sourcing"
relatedProducts: "KSZ8895RQXI, LAN9252I/ML, MCP2518FDT-E/SLVAO, DS2484R+T, PTN5100ABSMP, PCI1410PGE, TSB12LV01APZ, USB2512A-AEZG-TR"
---

# Interface Controllers: The Host Driver Is Part of the Part Number

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: driver and VID/PID dependency, counterfeit USB bridges, Ethernet PHY strapping, CAN FD, dead buses

---

**In most categories a substitution has to satisfy the board. In this one it has to satisfy the host operating system as well.** A USB-to-serial bridge is chosen because a signed driver exists for it on every platform the product supports, and because the vendor and product identifiers it reports are the ones the customer's software looks for. Swap an FTDI bridge for a Silicon Labs one and the hardware works perfectly while every installed system stops recognising the device. Our [interface controllers category](/category/interface-controllers-ic) holds **3,537 part numbers with 1,599 no longer active (45%)**, and it contains a second hazard that is rarer elsewhere: **the most-counterfeited chips in the industry live here, and the host driver is what detects them.**

## Key takeaways

- **A USB bridge substitution is a software change.** The VID/PID pair, the driver, the INF or udev rules and any host software keyed to them all follow the chip.
- **Counterfeit USB-serial bridges are a documented, industry-wide problem**, and the vendor driver is the detector — with consequences for the end customer, not the supplier.
- **Ethernet PHY substitution turns on strapping and clock direction.** Both MAC and PHY configured to source the RMII reference clock means contention; neither means no link.
- **CAN controller and CAN transceiver are different parts**, and classic CAN controllers cannot do CAN FD.
- **USB hub power budgets are arithmetic**: a bus-powered 4-port hub cannot legitimately feed a 500 mA device.
- **Legacy bus bridges are simply gone** — PCI/CardBus (`PCI1410PGE`, `PCI4451GFN`, `PCI7612ZHK`) and FireWire (`TSB12LV01APZ`) are obsolete with no successors, because the buses are dead.
- **`SP…` prefixed parts are 46 of 47 inactive** and NXP's `PTN5100` USB-C PD controllers are in last-time buy.

---

## What the category holds, and where the risk is

**Vendors:** Microchip 1,036 part numbers, Rochester Electronics 650, Broadcom 547, Cypress 188, Texas Instruments 175, Maxim Integrated 124.

| Sub-family | Parts | Not active | Typical parts |
| --- | ---: | ---: | --- |
| `USB…` (hubs, controllers) | 353 | 131 | `USB2512A-AEZG-TR`, `USB2228-NU-03` |
| `KSZ…` (Ethernet) | 166 | 20 | `KSZ8895RQXI` |
| `LAN9…` (Ethernet, EtherCAT) | 157 | 15 | `LAN9252I/ML` |
| `MCP2…` (CAN, I²C, LIN) | 101 | **0** | `MCP2518FDT-E/SLVAO` |
| `MAX3…` | 57 | 30 | — |
| `MCP25…` (CAN) | 50 | **0** | — |
| `SP…` (Sipex/Exar lineage) | 47 | **46** | — |
| `FT2…` (FTDI) | 42 | 1 | `FT2232HL-REEL` |
| `DP83…` (TI Ethernet) | 41 | 19 | — |
| `CP21…` (Silicon Labs) | 37 | 20 | `CP2102N-A02-GQFN28R` |
| `SJA…` (NXP CAN) | 15 | 4 | — |
| `CYPD…` (Cypress USB-C) | 13 | **0** | `CYPD3178-24LQXQ` |
| `PTN5…` (NXP USB-C) | 10 | **7** | `PTN5100ABSMP` (last-time buy) |
| `PCA9…` (I²C) | 16 | 14 | — |

Read the extremes. The Microchip CAN and Ethernet families (`MCP2…`, `MCP25…`, `KSZ…`, `LAN9…`) are in excellent health — 0-12% inactive. The Sipex/Exar `SP…` lineage is 98% gone. USB-C Power Delivery is split: Cypress `CYPD` fully active, NXP `PTN5` 70% inactive with the survivors in last-time buy.

## The VID/PID and driver dependency

A USB device identifies itself with a 16-bit vendor ID and a 16-bit product ID, and the host uses that pair to select a driver. For a USB-to-serial bridge, that pair belongs to the bridge vendor.

What breaks when the bridge changes:

| Layer | Dependency |
| --- | --- |
| **Driver selection** | VID/PID → driver binding on Windows, macOS and Linux |
| **Installer / INF** | Windows driver packages enumerate specific VID/PID pairs |
| **udev rules** | Device naming and permissions on Linux keyed to VID/PID |
| **Host application** | Software that finds "our device" by VID/PID, or by the bridge's proprietary API |
| **Certification** | Windows driver signing applies to a specific package |
| **Custom descriptors** | Serial numbers, product strings, latency timers stored in the bridge's own configuration EEPROM |

So replacing `FT2232HL` with `CP2102N` (both excellent parts, both available) means: the driver changes, the installer changes, host software that opened the device by VID/PID stops finding it, and any use of the vendor's proprietary API (FTDI's D2XX, for instance) has to be rewritten against the other vendor's. A field product cannot be mixed across the two without shipping both drivers and handling both cases.

Two practical rules.

First, treat the USB bridge as a software-visible part, listed in the software configuration record alongside the firmware version. A purchasing substitution without a software review is not viable here.

Second, where a custom VID/PID or descriptor strings are programmed into the bridge's EEPROM, that programming step is part of manufacturing, and it must be reproduced with the replacement, using that vendor's tool. If nobody remembers the programming step, the replacement enumerates with default strings and the host software does not recognise it.

## Counterfeit USB bridges: the driver is the detector

USB-to-serial bridges are among the most heavily counterfeited semiconductors in the industry, because they are cheap, ubiquitous, sold in enormous volume through informal channels, and easy to clone functionally.

The dynamic that makes this a sourcing issue rather than a quality curiosity:

- **A cloned bridge usually works.** It enumerates, it moves bytes, it passes a functional test.
- **The vendor's driver can tell the difference**, because clones do not reproduce every internal detail. Vendors have historically used driver updates to detect non-genuine parts, and the consequences have ranged from refusing to operate to rendering the counterfeit device unusable.
- **The failure happens at the customer, after a routine operating-system update**, long after the board shipped and passed test.
- **The blast radius is every unit built with that lot**, not one board.

This is the strongest argument in the whole catalogue for authorised channels on a cheap part. A one-dollar saving on a bridge chip against a field recall triggered by a driver update is not a trade worth making. The channel distinction is in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor), and the inspection framework in [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) — though note that **for this specific failure mode, electrical inspection does not help.** What helps is provenance.

If you have inherited unknown-provenance bridges, the practical test is to install the vendor's current driver on a clean host and check that the device enumerates, reports the expected chip revision through the vendor's utility, and survives a driver update. That is a software test, not a bench test.

## Ethernet PHYs: strapping and clock direction

A PHY substitution is decided by four things, none of which is the data rate.

MAC interface generation. MII (16 signals), RMII (7 signals at 50 MHz), RGMII (12 signals, DDR), SGMII (a serialised differential pair), or RGMII with internal delay. **The MAC and PHY must agree**, and a PHY offering RMII cannot serve a MAC wired for MII without a redesign.

Reference clock direction. In RMII, the 50 MHz clock can be sourced by the MAC or by the PHY, and this is configured — sometimes by strap, sometimes by register. **If both ends are configured to drive it, they contend; if neither does, there is no link.** A replacement PHY whose default differs from the original's silently produces a dead interface.

Strapping. PHY address, auto-negotiation defaults, interface mode and clock direction are strapped on shared pins at reset, usually on the same pins used for LED drive or data lines, with the strap value latched at reset. **The same pin can strap differently on a different PHY**, so a footprint-compatible replacement can come up at the wrong PHY address, invisible to the MAC's MDIO scan.

Management interface and register map. Basic MII registers are standardised, but the vendor-specific registers that firmware uses for LED behaviour, cable diagnostics, energy-efficient Ethernet and interrupt configuration are not.

In our catalogue the healthy lines are Microchip's `KSZ…` (20 of 166 inactive) and `LAN9…` (15 of 157), which includes the industrial-Ethernet parts such as `LAN9252I/ML` for EtherCAT. TI's `DP83…` is 19 of 41 inactive. Legacy is gone: `LAN91C93I-ME` is obsolete, as are the Intel-era LAN and chipset parts also filed here.

Industrial Ethernet deserves a specific warning: parts like `LAN9252` implement a fieldbus protocol (EtherCAT) in hardware, and the slave's device description file, vendor ID and protocol stack are all tied to it. That is the same "companion chip" lock-in described in [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide); a substitution means re-certifying the fieldbus device.

## CAN: three separate parts, and FD is not backwards free

A CAN node is a controller plus a transceiver, and they are different devices.

| Function | Examples | Notes |
| --- | --- | --- |
| **Standalone controller** | `MCP2515` (classic), `MCP2517FD`/`MCP2518FD` (FD), `SJA1000` (legacy) | Talks SPI to the host; needs a transceiver |
| **Transceiver** | `MCP2551`, `TJA1050`-class | Physical layer only — see [CAN transceiver sourcing](/blog/can-transceiver-sourcing-guide) |
| **Integrated** | MCU with on-chip CAN | Controller inside the microcontroller |

Substitution rules that matter:

- **A classic CAN controller cannot do CAN FD.** If the bus carries FD frames, a classic controller sees them as errors and can disturb the bus by generating error frames. This is the trap when one node on an FD bus is replaced with an older part.
- **An FD-capable controller on a classic bus is fine**, provided it is configured for classic frames: a firmware setting, not automatic.
- **The SPI register map differs between generations.** `MCP2515` and `MCP2517FD` are not register-compatible, so the driver changes.
- **Oscillator requirements differ**, and CAN bit timing is derived from it: the controller's clock tolerance requirement is tighter than most people expect, which is why [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide) matters here.

In our catalogue the Microchip CAN families show **zero inactive parts** across 151 part numbers (`MCP2…` and `MCP25…`), while NXP's `SJA…` is 4 of 15 inactive. That makes CAN one of the easier interfaces to sustain — provided the FD generation question is handled deliberately.

## USB hubs: the power budget is arithmetic

A bus-powered hub cannot supply more than it receives, and the standard is explicit about the shares.

```
USB 2.0 upstream port supplies          500 mA
hub silicon consumption                ≈ 50 mA
remaining for downstream ports         ≈ 450 mA
4 downstream ports × 100 mA (1 unit load)  = 400 mA  → fits
1 downstream port at 500 mA                = 500 mA  → does not fit
```

So a bus-powered 4-port hub can legitimately offer only 100 mA per port, and a device downstream that needs 500 mA requires a self-powered hub with its own supply. When a hub is substituted, check:

- **Bus-powered versus self-powered support**, and whether the part manages port power switching.
- **Per-port current limiting and over-current reporting**, which may be internal or need external switches — see [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide).
- **Configuration method**: strap pins, an I²C/SMBus EEPROM, or a host-loaded configuration. `USB2512A-AEZG-TR` is obsolete in our catalogue and is from the generation where an external configuration EEPROM is common — **and a missing or differently-programmed EEPROM changes the descriptors the host sees.**
- **Port count and downstream port routing**, including whether one port is fixed as a peripheral.

## Legacy buses: nothing to substitute

Some parts here are unobtainable because the bus itself is finished.

| Part in our catalogue | What it was | Status |
| --- | --- | --- |
| `PCI1410PGE`, `PCI4451GFN`, `PCI7612ZHK`, `PCI6420GHK` | PCI-to-CardBus / PCMCIA controllers | obsolete |
| `TSB12LV01APZ`, `TSB43AB22APDTG4` | IEEE 1394 FireWire link layer | obsolete / active via aftermarket |
| `LAN91C93I-ME` | ISA/parallel-era Ethernet | obsolete |
| `PC87415VCG` | Legacy PC I/O | active via aftermarket |
| `CY7C63823-QXC` | Low-speed USB microcontroller | obsolete |

For these, the options are the authorised aftermarket, a last-time buy, or a redesign that removes the bus. Rochester Electronics supplies 650 part numbers in this category, and several of the parts above appear through that channel, which for a CardBus or FireWire interface is the only realistic path, since no vendor will build another.

Where the design is an embedded host rather than a peripheral, an FPGA can implement a legacy bus interface, which is the pattern described in [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide) and [how to choose the right FPGA](/blog/how-to-choose-right-fpga).

## Sourcing notes

What is in last-time buy in our catalogue: `PTN5100ABSMP` and `PTN5100BSMP` (NXP USB-C PD controllers), `PM5992B-FEI` (Microchip, PMC-Sierra lineage), plus a group of NXP `TEA19051`/`TEA19032` parts that are filed here but are actually power-supply controllers; a reminder to read what a part is rather than trusting the category.

Obsolete and frequently asked for: the PCI/CardBus bridges above, `USB2512A-AEZG-TR`, `PM5329-FGI`, `CY7C63823-QXC`.

Active and worth knowing: `KSZ8895RQXI` (5-port switch), `LAN9252I/ML` (EtherCAT slave), `MCP2518FDT-E/SLVAO` (CAN FD), `DS2484R+T` (1-Wire master), `CP2102N-A02-GQFN28R`, `FT2232HL-REEL`, `FT4232HQ-REEL`, `ADIN2111BCPZ` (10BASE-T1L), `FIDO5100BBCZ` (industrial Ethernet), `CYPD3178-24LQXQ` (USB-C PD).

Incoming inspection for this category is unusual: most of it is software.

- **Enumerate the device on a clean host** with the vendor's current driver, and confirm the VID/PID, chip revision and descriptor strings.
- **For bridges, run the vendor's own utility** — it reports the internal revision and, for genuine parts, matches expectations.
- **For PHYs, read the MDIO ID registers** and confirm the PHY address matches the strapping the board provides.
- **For CAN controllers, confirm the frame format** by exercising both classic and FD traffic if the bus uses FD.
- **For hubs, check the descriptors and per-port current limits**, not just that ports work.

Package-level checks per [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) still apply, but for counterfeit bridges provenance is the control, not inspection.

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | VID/PID pair and host driver availability | Device not recognised by installed systems |
| 2 | Vendor API dependency (D2XX-class) | Host software must be rewritten |
| 3 | Configuration EEPROM programming step | Default descriptors; host software fails |
| 4 | Provenance of USB bridges | Counterfeit bricked by a driver update, in the field |
| 5 | MAC interface generation (MII/RMII/RGMII/SGMII) | No interface |
| 6 | RMII reference clock direction | Contention, or no link |
| 7 | PHY strap mapping and default address | MDIO scan finds nothing |
| 8 | Vendor-specific PHY registers used by firmware | LED, EEE, diagnostics behaviour changes |
| 9 | Fieldbus protocol and device description (EtherCAT etc.) | Re-certification required |
| 10 | CAN classic vs FD, and register map | Error frames on the bus; driver rewrite |
| 11 | CAN clock tolerance and bit timing | Intermittent bus errors |
| 12 | Hub power budget and per-port limits | Downstream device browns out |
| 13 | Legacy bus availability at all | No path but redesign |

## FAQ

### Why can't I just swap an FTDI bridge for a Silicon Labs one?

Because the host identifies the device by its USB vendor and product IDs, and those belong to the bridge vendor. Changing the chip changes the VID/PID, so the operating system selects a different driver, the Windows INF or Linux udev rules no longer match, and any host application that located the device by VID/PID (or used the vendor's proprietary API such as FTDI's D2XX) stops working. Both parts are excellent and widely available; the incompatibility is entirely on the software side, which is why the bridge belongs in the software configuration record.

### How serious is the counterfeit USB-serial bridge problem?

Serious enough to be the main argument for buying these cheap parts through authorised channels. Cloned bridges typically work (they enumerate and move data, so they pass functional test) but the vendor's driver can distinguish them, and vendors have used driver updates to detect non-genuine devices, with outcomes ranging from refusing to operate to leaving the device unusable. The failure therefore appears at the end customer after a routine operating-system update, affects every unit built from that lot, and cannot be caught by electrical inspection. Provenance is the only effective control.

### What makes an Ethernet PHY substitution fail?

Usually strapping or clock direction rather than anything to do with speed. In RMII the 50 MHz reference clock may be sourced by the MAC or by the PHY, and if both are configured to drive it they contend, while if neither does there is no link at all. PHY address, interface mode and auto-negotiation defaults are strapped on shared pins at reset, and the same pin can mean something different on a replacement PHY, so the device can come up at an address the MAC's MDIO scan never queries. Check strap mapping, clock direction and the vendor-specific registers your firmware touches.

### Can a CAN FD controller replace a classic CAN controller?

Yes in that direction, provided firmware configures it for classic frames; it is not automatic. The reverse fails: a classic controller on a bus carrying CAN FD frames cannot decode them, treats them as errors and generates error frames, which disturbs traffic for every other node. Note also that register maps differ between generations, so `MCP2515` and `MCP2517FD` need different drivers, and CAN bit timing depends on a clock whose tolerance requirement is tighter than many designers assume.

### How many devices can a bus-powered USB hub support?

Four ports at one unit load each. An upstream USB 2.0 port supplies 500 mA, the hub silicon consumes roughly 50 mA, leaving about 450 mA, so four downstream ports at 100 mA fit and a single 500 mA device does not. Any downstream device drawing more than a unit load requires a self-powered hub with its own supply and, usually, per-port current limiting. When substituting a hub, check bus-powered versus self-powered support, how port power is switched and limited, and how the configuration is supplied — straps, an external EEPROM, or the host.

### What replaces an obsolete PCI-to-CardBus or FireWire controller?

Nothing, in the substitution sense — those buses are finished, and no vendor will build another controller for them. The realistic options are the authorised aftermarket, which supplies a number of these parts as original-die production (Rochester Electronics holds 650 part numbers in this category), a last-time buy sized to the product's remaining life, or a redesign that removes the bus. Where the design is an embedded host rather than a peripheral card, implementing the legacy bus interface in an FPGA is a used technique.

### Which interface families are healthiest for new designs?

Microchip's CAN and Ethernet lines. In our catalogue the `MCP2…` and `MCP25…` CAN families show zero inactive parts across 151 ordering codes, `KSZ…` Ethernet is 20 of 166 inactive and `LAN9…` 15 of 157. Cypress `CYPD` USB-C PD is fully active. The families to avoid are the Sipex/Exar `SP…` lineage at 46 of 47 inactive, NXP `PTN5…` USB-C at 7 of 10 with the rest in last-time buy, and anything tied to a legacy bus.

### How do I test an interface controller on incoming inspection?

Mostly in software. Enumerate the device on a clean host with the vendor's current driver and confirm the VID/PID, silicon revision and descriptor strings, and run the vendor's own utility where one exists. For a PHY, read the MDIO identifier registers and confirm the address matches the board's strapping. For a CAN controller, exercise the frame formats the bus actually uses. For a hub, check the descriptors and the per-port current limits rather than just confirming that ports pass data.

## Related reading

Physical-layer companions: [CAN transceiver sourcing](/blog/can-transceiver-sourcing-guide), [RS-485 transceiver sourcing](/blog/rs485-transceiver-sourcing-guide), [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide) for the cross-cutting framework, and [level shifter selection](/blog/level-shifter-selection-guide) where domains meet.

Adjacent: [PCIe switches and bridges](/blog/pcie-switch-bridge-sourcing-guide) for the fabric side, [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide) where the host bus is the problem, [programmable oscillator sourcing](/blog/programmable-oscillator-sourcing-guide) for CAN and Ethernet clock tolerance, [power switches and hot-swap controllers](/blog/power-switch-hot-swap-sourcing-guide) for USB port power.

Channel and inspection: [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor) (which matters more here than the low unit price suggests) and [IDEA-STD-1010 inspection](/blog/idea-std-1010-counterfeit-detection-guide).

Send us the part number and tell us which host operating systems have to keep working. In this category that constraint eliminates more candidates than the electrical specification does.

[**Submit an RFQ**](/rfq) | [**Browse interface controllers**](/category/interface-controllers-ic) | [**Upload a BOM**](/bom)
