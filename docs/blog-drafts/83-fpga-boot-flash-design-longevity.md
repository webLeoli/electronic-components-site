---
title: "Your FPGA Will Outlive Its Boot Flash: Designing a Configuration Chain That Survives Substitution"
slug: "fpga-boot-flash-design-longevity"
status: "draft"
seoTitle: "FPGA Boot Flash Design: Making Serial NOR Substitutable"
seoDesc: "Artix-7 is 6% obsolete; the N25Q flash it boots from is 93%. The eight register-level differences that stop one serial NOR flash dropping into another — and how to design around them."
seoKeywords: "FPGA configuration flash, serial NOR flash substitution, quad enable bit, SFDP JESD216, 4-byte addressing, FPGA boot flash obsolete, N25Q replacement, W25Q last time buy, golden image fallback"
tags: "FPGA design, configuration memory, serial NOR flash, design for availability, SFDP, second sourcing"
author: "FPGACenter Engineering Team"
readingTime: 19
category: "FPGA Design & Integration"
relatedProducts: "N25Q128A23BSF40G, M25P40-VMN6, W25Q64FVSSBQ, W25Q16JWZPIQ, IS25LP128-JKLE-TR, S25FL256LAGBHN033, XCF16PVO48C, EPCS16SI8N"
---

# Your FPGA Will Outlive Its Boot Flash: Designing a Configuration Chain That Survives Substitution

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~19 minutes
> **Topics**: serial NOR flash substitution at register level, SFDP, configuration-time arithmetic, golden-image fallback, design-for-availability

---

**The most likely reason a working FPGA design becomes unbuildable is not the FPGA; it is the two-dollar serial flash next to it.** Measured across our catalogue on 2026-08-11, Xilinx `XC7A` (Artix-7) ordering codes are 6% inactive, while the Micron `N25Q` serial NOR flash that the reference designs of that era paired with it is **93% inactive** and the older ST/Micron `M25P` family is **98%**. The programmable logic is fine. The boot device is gone.

This article is about the gap between "any SPI flash will do" and what actually happens when you try to substitute one. There are eight specific, register-level differences between serial NOR devices that are otherwise pin-compatible and functionally identical, and at least three of them will silently prevent an FPGA from configuring. It closes with the design rules that make the swap a purchasing decision rather than a board respin.

## Key takeaways

- **The boot flash is the shortest-lived component in a typical FPGA design.** `N25Q` 93% inactive, `M25P` 98%, Atmel `AT45DB` 73%, against Artix-7 at 6%.
- **Both dedicated FPGA configuration families are finished.** Altera `EPCS` is 100% inactive and `EPCQ` 82%; Xilinx Platform Flash `XCF` is 61%. Generic serial NOR is now the only configuration memory with a future.
- **Quad-mode enable is the number-one substitution failure.** The bit lives in a different register, at a different offset, in a different volatility class on each vendor's parts. A design that hard-codes one vendor's sequence will not boot from another's device.
- **Pin 7 on an 8-pin quad device is `IO3`/`HOLD#`/`RESET#`, and which one it defaults to is vendor- and register-dependent.** Tie it low expecting `HOLD#` and a replacement that defaults to `RESET#` is held in reset forever.
- **Above 128 Mbit you enter 3-byte versus 4-byte addressing**, and an FPGA's hard-wired boot logic usually issues 3-byte reads only.
- **SFDP (JESD216) is the portability contract.** A device that publishes a Basic Flash Parameter Table tells your loader its erase geometry, read opcodes, dummy-cycle counts and quad-enable method at run time. Make it a purchasing requirement.
- **Design a golden image plus fallback from the start.** It is what converts "the flash changed" from a field-return event into a software task.

---

## What the catalogue says about configuration memory

Configuration memory is obsoleting several times faster than the FPGAs it serves. Ordering-code counts and status measured 2026-08-11:

| Family | Prefix | Part numbers | Not active | In last-time buy |
| --- | --- | ---: | ---: | ---: |
| ISSI serial NOR | `IS25LP` | 183 | **7%** | — |
| Micron, current | `MT25Q` | 200 | 24% | — |
| Microchip / SST | `SST25` | 204 | 36% | 4 |
| Cypress / Infineon | `S25FL` | 1,167 | 37% | **21** |
| **Winbond** | `W25Q` | 1,224 | **54%** | **204** |
| Xilinx Platform Flash | `XCF` | 18 | 61% | 2 |
| Atmel DataFlash | `AT45DB` | 298 | 73% | — |
| Altera | `EPCQ` | 11 | 82% | — |
| **Micron, legacy** | `N25Q` | 293 | **93%** | — |
| **ST / Micron** | `M25P` | 222 | **98%** | — |
| **Altera** | `EPCS` | 8 | **100%** | — |

Compare that with the programmable logic on the same board: `XC7A` 6%, `XC7S` 1%, `XC7Z` 8%, `5CE`/`5CG` 0%, `LFE5U` 0%, `LCMXO3L` 5%.

Three conclusions follow directly.

Do not design in a dedicated configuration device. `EPCS` is 100% inactive across every ordering code we list, and `EPCQ` is 82%. These parts had exactly one customer (the FPGA vendor's own configuration controller) and when that vendor moved to generic quad SPI, the family had no other market to fall back on. A general-purpose serial NOR flash is sold into thousands of designs, which is precisely why it survives longer.

Winbond's 204 last-time-buy part numbers are the live warning. `W25Q` is the default choice in a large share of current designs, and 204 of its ordering codes are in an end-of-life window right now, concentrated in `W25Q16`, `W25Q32`, `W25Q64`, `W25Q80` and `W25Q128`: the exact densities used for FPGA configuration. That is not the family disappearing; it is specific ordering codes, packages and temperature grades being pruned. It is also the difference between a part you can still order and one you cannot, which is what [last-time-buy quantity and storage](/blog/last-time-buy-quantity-and-storage) is about.

Aftermarket lineage keeps some legacy paths open. Xilinx Platform Flash is a clean example: every Xilinx-branded `XCF08PVOG48C` and `XCF16PVOG48C` in our catalogue is obsolete, while the Rochester Electronics-branded `XCF08PVO48C` and `XCF16PVO48C` are active with stock. If you are maintaining a Virtex-4 or Spartan-3 board you cannot redesign, search the base number as a prefix rather than an exact string, the point made at length in the [IC obsolescence data study](/blog/ic-obsolescence-data-study).

## Why "pin-compatible serial NOR" is not the same as interchangeable

Serial NOR flash devices share a package, a pinout and the first four opcodes, and diverge everywhere that matters for booting an FPGA. The JEDEC-common subset is small: `0x03` read, `0x02` page program, `0x05` read status, `0x06` write enable, `0xD8` block erase, `0x9F` read ID. Everything an FPGA actually uses for fast configuration sits outside it.

### 1. The quad-enable bit is in a different place on every vendor's parts

Quad-mode configuration reads four bits per clock instead of one, so this is not optional; it is the difference between a 100 ms boot and a 400 ms boot. But `IO2` and `IO3` are multiplexed with `WP#` and `HOLD#`, so the device must be told to repurpose those pins, and the mechanism is not standardised:

| Vendor family | Where the quad-enable bit lives | Volatility |
| --- | --- | --- |
| Winbond `W25Q` | Status Register 2, bit 1 (`QE`, sometimes numbered S9) | Non-volatile, written via `0x31` or a two-byte `0x01` |
| Cypress/Infineon `S25FL` | Configuration Register 1, bit 1 | Non-volatile, written as the second byte of `0x01` |
| ISSI `IS25LP`, Macronix `MX25L` | Status Register, bit 6 | Non-volatile |
| Micron `N25Q`, `MT25Q` | No `QE` bit at all — protocol is selected in the Enhanced Volatile Configuration Register | Volatile, resets every power cycle |

Read that last row twice. **Micron parts have no quad-enable bit to set, and their protocol selection reverts on every power-on**, while a Winbond part remembers the setting in non-volatile storage. A loader written against one behaves incorrectly against the other in both directions: hard-code the Winbond sequence and the Micron part ignores an unknown register write; hard-code the Micron sequence and the Winbond part never leaves single-bit mode.

Worse, this interacts with factory defaults. A device can arrive with `QE` already set or already clear depending on the ordering code: the trailing letters of `W25Q64FVSSBQ` versus `W25Q64FVSSIQ`-style suffixes encode exactly this class of factory option. **A "same part, different suffix" substitution can change the power-on quad state.**

### 2. Dummy cycles and mode bits differ per opcode and per device

A fast read command sends an opcode, an address, then a number of idle clock cycles before data appears, so the device's internal array access can complete. That count is not fixed:

- `0x0B` fast read, single-bit: typically 8 dummy cycles.
- `0x6B` fast read quad output: typically 8, but configurable on several families.
- `0xEB` fast read quad I/O: this is where it breaks. Some devices expect 6 dummy cycles, some 10, and several implement **mode bits**; a byte clocked in after the address whose value determines whether the *next* transaction may skip the opcode entirely.

The mode-bit mechanism is a genuine bricking hazard. If the mode bits latch a "continuous read" state, the device stops expecting a command byte at the start of the next transaction. A loader that then issues a normal opcode is interpreted as an address. The device appears dead, the FPGA never configures, and nothing is measurably wrong with the hardware.

### 3. Above 128 Mbit, addressing changes width

A three-byte address reaches 2^24 bytes — 16 MB, or 128 Mbit. Beyond that, devices support either a mode switch (`0xB7` to enter 4-byte addressing, `0xE9` to exit) or a parallel set of four-byte-address opcodes (`0x13`, `0x0C`, `0x6C`, `0xEC`).

An FPGA's hard boot logic is fixed silicon and typically issues 3-byte reads only. A 256 Mbit device therefore has to power up in 3-byte mode and present the bitstream inside its bottom 16 MB. Most do. But the power-on default is a non-volatile configuration bit on several families, which means **a factory-programmed option (or a previous program cycle in your own factory) can leave a replacement device powering up in 4-byte mode, where the FPGA's 3-byte read lands at the wrong address.**

### 4. Erase granularity is not universal

Almost every current device offers 4 KB sector erase (`0x20`) alongside 64 KB block erase (`0xD8`). "Almost" is doing real work in that sentence: the original `M25P` family (the 98%-inactive one at the top of this article) offers **only** 64 KB sector erase. Any design storing calibration constants, serial numbers or an update counter in a 4 KB region has a hidden dependency on erase geometry, and it will not survive a swap onto a device with coarser granularity without a flash-layout change.

### 5. Pin 7 is `IO3`, `HOLD#` **and** `RESET#`

On an 8-pin serial NOR device, pin 7 carries `IO3` in quad mode and, in single-bit mode, either `HOLD#` or `RESET#` depending on a configuration bit — bit 7 of Status Register 3 on Winbond parts, and equivalent bits elsewhere.

This is the failure that looks like a dead board. A design that ties pin 7 low because it read "HOLD#, active low, tie inactive… low" in the wrong column, or that drives it from a GPIO expecting hold semantics, will hold a replacement device in permanent reset if that device's default assigns `RESET#`. There is no error, no partial configuration and no status to read: the flash simply never answers.

### 6. The voltage is in the suffix

`W25Q16JWZPIQ` and a 3.3 V `W25Q…JV…` part differ by one letter in the middle of the ordering code, and that letter is the supply rail: the `JW` series is a 1.8 V device, the `JV` series 3.3 V. Both exist in our catalogue, in the same package, with the same density.

A 1.8 V flash on a 3.3 V rail is destroyed. A 3.3 V flash on a 1.8 V rail does not respond. Neither failure is subtle, but both are easy to order, because the part numbers sort next to each other in a distributor search and the family name is identical. **Voltage is not a package option; treat the rail as part of the part number.**

### 7. Power-up timing versus the FPGA's configuration start

Two flash parameters matter and are rarely checked during substitution: the delay from supply valid to the first chip-select being accepted, and the power-up write-inhibit window during which the device ignores commands.

The FPGA releases its own reset and begins issuing configuration reads on its own schedule. If the replacement flash needs longer to become ready than the original did, the first read is lost. On a good day this fails cleanly and the FPGA retries or asserts its error pin. On a bad day it reads a partial response, computes a bitstream CRC failure, and the board boots intermittently as a function of supply ramp rate and temperature: the single worst class of field fault to diagnose.

Compare the flash's ready timing against the FPGA's configuration start window on paper before you buy the substitute, and if the margin is thin, use the FPGA's configuration delay setting rather than hoping.

### 8. Block-protection defaults

Devices ship with block-protect bits, a status-register protection scheme, and sometimes one-time-programmable lock bits. A replacement that arrives with protection asserted will read correctly and refuse to program, which surfaces as a production-line failure at the flash-programming step rather than a design fault. Any production programmer must clear protection explicitly rather than assuming a clear default.

## SFDP: the one mechanism that makes this tractable

Serial Flash Discoverable Parameters (JEDEC JESD216) is a read-only table inside the flash that describes the flash. It is the closest thing to a portability contract that this device class has.

Issue opcode `0x5A` with a 3-byte address and one dummy byte, and a compliant device returns a header beginning with the ASCII signature `SFDP` (`0x50444653` little-endian) at offset zero. The header points at a Basic Flash Parameter Table that publishes, in machine-readable form:

| What SFDP tells you | Why it matters for a substitution |
| --- | --- |
| Density in bits | Confirms you got the part you ordered |
| Number of address bytes, and whether 3/4-byte modes are supported | Resolves difference 3 above at run time |
| Supported erase types with their opcodes and sizes | Resolves difference 4 — you discover whether 4 KB erase exists |
| Fast-read opcodes with their mode-clock and dummy-clock counts | Resolves difference 2 without a per-part table in your firmware |
| The quad-enable requirement, as an enumerated method code | Resolves difference 1 — the table names which register-and-bit sequence this device needs |

A loader, a production programmer or a soft-core bootloader that reads SFDP and adapts is substitution-tolerant by construction. One that carries a hard-coded table of part numbers must be re-released for every new device, and it will be, because the device that is available in eight years is not the one you qualified.

Make SFDP a line item in the component specification, alongside density and voltage. Nearly every device introduced in the last decade implements it; several of the obsolete families at the top of this article do not, which is another reason not to design a new board around them.

## Sizing the flash: the arithmetic

Size the configuration flash from the bitstream, then double it, then round up to the next standard density. The doubling is not padding; it is the second image that makes a failed field update recoverable.

Work an example with an Artix-7 device whose uncompressed bitstream is approximately 30.6 Mbit (check the configuration-array table in your device's configuration user guide for the exact figure; it is a fixed property of the die, not of your design):

```
Bitstream                       30.6 Mbit
Golden image + update image     61.2 Mbit
Non-volatile data, headers      ~1 Mbit
                                ---------
Requirement                     ~62.2 Mbit  ->  128 Mbit device
```

A 64 Mbit device does not fit two uncompressed images. This is exactly how designs end up on 128 Mbit parts. That is why the `W25Q128` and `S25FL128` ordering codes appear so often, and why 204 `W25Q` codes being in last-time buy matters.

Now the configuration time, which is what the quad-mode discussion was for:

```
Quad output read at 66 MHz  = 66 MHz x 4 bits = 264 Mbit/s
30.6 Mbit / 264 Mbit/s      = 116 ms

Single-bit read at 66 MHz   = 66 Mbit/s
30.6 Mbit / 66 Mbit/s       = 464 ms
```

A failed quad-enable sequence does not stop the board booting — it makes it boot four times slower. That is the version of this bug that escapes the lab, passes every functional test, and fails a customer's power-on-to-ready specification two years later. If your product has a boot-time requirement, measure the configuration time on every new flash source and treat a change as a defect.

Compression changes the numerator, not the method. Bitstream compression is data-dependent, so budget the uncompressed figure unless you are prepared to re-measure worst case on every RTL change.

## Designing a configuration chain that survives substitution

Nine decisions, all made at schematic time, that decide whether a flash change is a purchasing task or a board respin.

1. **Use generic quad serial NOR, not a dedicated configuration device.** The data at the top of this article is the argument: `EPCS` 100% inactive, `EPCQ` 82%, `XCF` 61%, against a general-purpose serial NOR market that has multiple active suppliers.
2. **Specify SFDP compliance in the component specification**, not just density and voltage.
3. **Choose a density with a second source at the same density in the same package.** From current data, 128 Mbit in 8-SOIC 208 mil and 16-SOIC has the deepest active supply across `MT25Q`, `IS25LP`, `S25FL` and `W25Q`. Check before committing: [flash memory](/category/flash-memory) status changes.
4. **Route pin 7 as a real signal, not a tie.** Give it a pull-up and a test point, or drive it from a pin you can reconfigure in firmware. This single decision defuses difference 5 entirely.
5. **Stay at or below 128 Mbit if the FPGA's hard boot logic only issues 3-byte addresses**, or verify that every candidate replacement powers up in 3-byte mode by default.
6. **Do not depend on 4 KB erase granularity unless you have verified it across all candidates.** Align non-volatile data to 64 KB boundaries and you inherit compatibility with the coarsest device.
7. **Make the loader read SFDP and adapt** — erase opcode, read opcode, dummy count, quad-enable method. A hard-coded part-number table is a maintenance liability with a known expiry date.
8. **Design golden-image fallback in silicon terms**, using the FPGA's multi-image boot and configuration watchdog: a corrupt or failed update reloads the known-good image at a fixed address. Without it, a flash change that alters programming behaviour turns into field returns.
9. **Keep a programming file per qualified flash source and version it with the bitstream.** The bitstream is device-specific; the flash image is device- *and* flash-specific once protection bits and configuration registers are involved.

## Where this leaves a board you cannot redesign

If the board is already built, the order of attack is: aftermarket, then substitution, then loader change, then respin.

Look for the original number under an aftermarket brand first: the Platform Flash example above shows the same base number active under Rochester while the OEM-branded code is obsolete. Search as a prefix, not an exact match, and search both the pre-merger and post-merger vendor names; the merger history is why the same die appears under Numonyx, Micron and ST names for `M25P`, and Spansion, Cypress and Infineon for `S25FL`.

If substitution is unavoidable, the eight differences above are the checklist, and the three that most often stop a board booting are quad-enable, pin 7 and power-up timing — in that order.

If the loader is in your control, changing it is far cheaper than a respin, which is the main argument for putting the boot chain in soft logic or firmware rather than relying purely on hard configuration logic.

For the procurement side of the same problem — how to buy legacy configuration memory, what to ask a distributor and how to inspect what arrives — see [FPGA configuration memory pairing](/blog/fpga-configuration-flash-pairing) and [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide). For the family-level picture on the FPGA itself, [FPGA obsolescence planning](/blog/fpga-obsolescence-spartan-cyclone-end-of-life) has the lifecycle data, and our [quality and inspection policy](/quality) covers what we verify on incoming legacy memory.

## Frequently asked questions

### Can I just drop any 128 Mbit SPI flash in place of an obsolete N25Q?

No, not without checking four things: quad-enable method, pin 7 default function, power-up address mode and power-up timing. Mechanically and for basic single-bit reads it will usually work. The failures appear in quad mode, in boot timing and at the production programming step. Read SFDP from the candidate device and compare it against the original before you commit.

### Why are the dedicated FPGA configuration devices so much more obsolete than ordinary flash?

Because they had one customer. `EPCS` and `EPCQ` existed to serve Altera's configuration controller, and Xilinx `XCF` to serve Xilinx's. When both vendors moved to generic quad SPI, those product lines had no other market. General-purpose serial NOR is sold into consumer, automotive, industrial and networking designs simultaneously, so the same die keeps paying for itself. Our measurement is `EPCS` 100% inactive and `EPCQ` 82%, against `IS25LP` at 7%.

### What is SFDP and do I really need it?

SFDP is a JEDEC-standard table inside the flash that publishes its own geometry, opcodes and timing, readable with opcode `0x5A`. You need it if you want your loader or production programmer to work with a device you have not qualified yet, which is the situation every long-lived product eventually reaches. Without SFDP, substitution requires a firmware release; with it, substitution is a purchasing decision.

### How much configuration flash should I specify?

Twice the uncompressed bitstream, plus space for non-volatile data, rounded up to the next standard density. For a ~30 Mbit bitstream that means a 128 Mbit device, because two images plus headers exceed 64 Mbit. Specifying exactly one image's worth is what makes a field update unrecoverable.

### Does a failed quad-enable stop the FPGA from configuring?

Usually not — it makes configuration about four times slower, which is worse. At 66 MHz, quad output read delivers 264 Mbit/s against 66 Mbit/s for single-bit, so a 30.6 Mbit bitstream takes roughly 116 ms instead of 464 ms. The board works, passes functional test, and fails a power-on-to-ready specification later.

### Why does pin 7 cause so much trouble?

Because it carries three functions (`IO3` in quad mode, and either `HOLD#` or `RESET#` in single-bit mode) and which of the latter two is active depends on a configuration bit whose default varies by device. A board that ties pin 7 low is safe with a `HOLD#` default and permanently reset with a `RESET#` default. Route it as a signal with a pull-up and a test point rather than tying it.

### The obsolete part number is unavailable at every distributor. Is it really gone?

Not necessarily — exact-match searching is unreliable for legacy parts. Aftermarket manufacturers append or alter suffix codes, so the base number may be active under a different brand: our catalogue lists Xilinx-branded `XCF16PVOG48C` as obsolete and Rochester-branded `XCF16PVO48C` as active with stock. Search the base number as a prefix, and search legacy vendor names as well as the current owner's. [Submit an RFQ](/rfq) with the base number and we will search the aftermarket lineage.

### Is 1.8 V or 3.3 V flash the safer long-term choice?

Match the rail your FPGA's configuration bank uses, and then check second-source depth at that voltage. 3.3 V serial NOR currently has the broader active supply in the densities used for configuration, but a 1.8 V configuration bank cannot drive a 3.3 V device. The mistake to avoid is treating the voltage letter in the ordering code as a package option — `W25Q16JWZPIQ` at 1.8 V and its 3.3 V sibling differ by one character and are not interchangeable.

## Sources

Availability figures are our own measurement across 719,342 catalogue part
numbers, dated 2026-08-11 and reproducible with `scripts/measure-catalogue.mjs`.
Register-level behaviour is from the primary sources below. **Always confirm
against the datasheet for the specific ordering code**: the whole argument of
this article is that these details differ between devices that look identical.

- JEDEC **JESD216** (Serial Flash Discoverable Parameters). The quad-enable
  requirement is enumerated in the Basic Flash Parameter Table, **DWORD 15,
  bits [22:20]**; this is the field that lets a loader select the correct
  enable sequence at run time. [jedec.org](https://www.jedec.org/)
- Microchip, *Setting the Quad Enable (QE) Bit* — documents that the procedure is
  manufacturer-specific, can differ between models from one manufacturer, and
  should be resolved by reading SFDP first.
  [onlinedocs.microchip.com](https://onlinedocs.microchip.com/oxy/GUID-E30F5C0E-B46C-49CA-8983-4D5259D78215-en-US-1/GUID-FDFA7EAE-6053-494F-958A-7D3BFC7DA4C3.html)
- The Linux/U-Boot `spi-nor` driver's SFDP parsing and per-vendor quad-enable
  routines are a useful cross-check on real-device behaviour, including devices
  that report a reserved quad-enable code rather than "no QE bit".
  [github.com/u-boot](https://github.com/trini/u-boot/blob/master/drivers/mtd/spi/spi-nor-core.c)
- Your FPGA's configuration user guide, for bitstream size, configuration clock
  rates and the multi-image/fallback mechanism.
