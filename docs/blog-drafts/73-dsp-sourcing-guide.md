---
title: "DSP Sourcing: The Part Outlives the Compiler That Built Its Firmware"
slug: "dsp-sourcing-guide"
status: "draft"
seoTitle: "DSP Sourcing Guide: TMS320, SHARC, Blackfin, StarCore Availability"
seoDesc: "4,026 DSP part numbers at 41% inactive, and 37% of them supplied through Rochester. Toolchain obsolescence, on-chip ROM variants, boot modes, and why binary compatibility stops inside a family."
seoKeywords: "DSP sourcing, TMS320 obsolete, ADSP-2186 replacement, SHARC ADSP-21363 obsolete, Blackfin availability, StarCore MSC obsolete, DSP toolchain obsolescence, TNETV2685 last time buy"
tags: "DSP, TMS320, SHARC, Blackfin, StarCore, toolchain, boot mode, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 17
category: "Processors, DSP & SoC"
relatedProducts: "ADSP-2101BP-40, ADSP-BF561SBBCZ-6A, ADSP-21363BSQZ-1AA, ADSP-2186KSTZ-115, TMS320VC5506GHH, TMS320DM355DZCE135, TNETV2685ZUT9, TMS320DM648ZUT9"
---

# DSP Sourcing: The Part Outlives the Compiler That Built Its Firmware

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~17 minutes
> **Topics**: toolchain obsolescence, family binary compatibility, ROM variants, boot modes, availability data

---

**In most categories the part becomes unobtainable while the design lives on. In DSP the opposite happens often enough to be a planning assumption: the silicon is still available through the aftermarket, and the compiler, emulator and JTAG pod that built its firmware are not.** A 1990s fixed-point DSP with a hand-optimised assembly signal chain is worth nothing if the only toolchain that assembles it requires a parallel-port emulator and a 32-bit host OS. Our [DSP category](/category/dsp) holds **4,026 part numbers with 1,644 no longer active (41%)**, and notably, **Rochester Electronics supplies 1,474 of them, 37% of the category**, which is the highest aftermarket share of any processor category we hold. That is the shape of a market kept alive for equipment nobody wants to redesign.

## Key takeaways

- **Toolchain availability is a sourcing constraint**, not an IT problem. Check it before the part.
- **Binary compatibility stops inside families.** `C54x` and `C55x` are both "TMS320C5000" and their object code is not interchangeable.
- **On-chip ROM variants are mask-programmed parts.** A ROM-coded DSP has no substitute at all: the code is in the silicon.
- **Boot mode is set by straps and is device-specific.** A replacement with a different boot map does not start.
- **The aftermarket share is unusually high**: Rochester supplies 37% of this category, including active supply of `ADSP-2101BP-40`.
- **StarCore and TigerSHARC are effectively finished** — `MSC…` is 105 of 128 inactive, `ADSP-TS…` 16 of 20.
- **TI's video and VoIP DSPs are in last-time buy**: the whole `TNETV2685` group and `TMS320DM648ZUT9`.

---

## Availability, family by family

Measured 2026-08-04. The vendors: Rochester Electronics 1,474 part numbers, Texas Instruments 997, NXP Semiconductors 807, Analog Devices 503, Cirrus Logic 92, STMicroelectronics 59.

| Family prefix | What it is | Parts held | Not active | Rate |
| --- | --- | ---: | ---: | ---: |
| `TMS320C3…` | TI floating-point C3x | 14 | 13 | **93%** |
| `MSC…` | Freescale StarCore | 128 | 105 | **82%** |
| `ADSP-TS…` | ADI TigerSHARC | 20 | 16 | 80% |
| `TMS320VC…` | TI low-voltage C54x/C55x | 167 | 94 | 56% |
| `ADSP-21…` | ADI fixed-point 21xx and SHARC | 452 | 223 | 49% |
| `DSP56…` | Motorola/Freescale 56xxx | 40 | 20 | 50% |
| `TMS320C2…` | TI C2000 (control) | 38 | 18 | 47% |
| `TMS320C5…` | TI C5000 | 102 | 45 | 44% |
| `TMS320C6…` | TI C6000 | 432 | 178 | 41% |
| `ADSP-BF…` | ADI Blackfin | 212 | 66 | 31% |
| `SM320…` | TI space/military-grade | 42 | 8 | 19% |

What this table says about strategy:

The architectures that lost their platform are gone. StarCore (Freescale's DSP core for basestations) at 82% and TigerSHARC (ADI's multiprocessing DSP) at 80% both served markets that moved to SoCs and FPGAs. There is no migration inside those families: the families ended.

The mainstream families are healthier but not safe. `TMS320C6…` at 41% and `ADSP-21…` at 49% still contain live parts, but nearly half the ordering codes are dead, so a specific speed grade, package or temperature variant is a coin flip.

Blackfin at 31% is the most available of the older ADI lines, and `SM320…` (the space and military versions) at 19% reflects the long qualification tails of defence programmes.

## The toolchain is part of the bill of materials

This is the point that distinguishes DSP sourcing from processor sourcing. It is regularly missed until it blocks a build.

A legacy DSP firmware image depends on:

| Dependency | Typical failure after ten years |
| --- | --- |
| **Compiler / assembler version** | Licence server gone, or host OS unsupported; a newer compiler produces different code |
| **Linker command files and libraries** | Vendor library binaries built for an older ABI |
| **Emulator / JTAG hardware** | Parallel-port or ISA-card emulators with no modern driver |
| **IDE version** | Requires a 32-bit host, or an activation server that no longer exists |
| **Third-party DSP libraries** | Licensed per-seat, per-version, sometimes per-device |
| **Assembly hand-optimisation** | Tied to a specific pipeline; will not port to a successor core |

Two practical consequences.

First, before sourcing a legacy DSP, confirm you can still build its firmware. If you cannot, the part's availability is irrelevant, and if you can, the toolchain becomes an archival asset worth preserving deliberately: a virtual machine image with the IDE, licences, emulator drivers and a known-good build, snapshotted.

Second, this reverses the usual redesign logic. For most parts, redesign is expensive and last-time buy is cheap. For a DSP whose toolchain is already unsupported, **a redesign onto a modern device is sometimes the only path with a future**, even while the original part is still purchasable, because the next firmware change will be impossible otherwise.

## Binary compatibility ends inside families

The family name is marketing; the instruction set is the product.

| Marketing family | Cores inside it | Object-code compatible? |
| --- | --- | --- |
| TMS320C5000 | C54x, C55x | **No** — different pipelines and instruction encodings |
| TMS320C6000 | C62x (fixed), C67x (float), C64x, C64x+, C674x | Source-compatible in C; **not object-compatible across generations** |
| ADI 21xx / SHARC | ADSP-21xx (16-bit fixed), SHARC 213xx/214xx (32/40-bit float) | **No** — entirely different architectures |
| Blackfin | BF5xx variants | Largely compatible within the family |
| StarCore | SC140 and successors | Family ended |

So "we'll use a newer part in the same family" is a source-level port at minimum, with re-optimisation of any assembly, re-verification of numerical behaviour (fixed-point saturation and rounding differ), and re-measurement of cycle counts. In a real-time signal chain, cycle counts are a functional specification: an algorithm that fits in the sample period on one core may not on another with different memory latency, even at a higher clock rate.

Floating-point versus fixed-point is the sharpest version of this. Replacing a fixed-point DSP with a floating-point one changes numerical results (quantisation, overflow behaviour, filter coefficient scaling) in ways that are visible in the output of a control loop or an audio path.

## ROM-coded and mask-programmed variants

Some DSPs ship with the customer's firmware in on-chip mask ROM. It was a cost-reduction step for volume products: the code is in the silicon, and the part number is customer-specific.

A ROM-coded DSP has no substitute of any kind. You cannot buy the "same part" because the part contains your program. If the stock runs out, the options are:

1. **Move to the flash or RAM-based variant of the same device** and boot the code externally, which requires a boot flash, a boot mode strap change and board space.
2. **Re-source the ROM code** with the vendor, if the family still supports mask programming, which for a legacy family it usually does not.
3. **Redesign.**

The sourcing red flag is a part number that does not appear in any datasheet. In our catalogue `ADSP-ESP101M-003` is an example of a device whose ordering code does not follow the standard family pattern: the sort of part number that indicates a customer-specific or application-specific variant. **If a search returns nothing for a DSP part number on the vendor's site, check whether it is a ROM-coded variant before concluding it is a typo.**

Related: on parts with on-chip flash rather than ROM, check the **flash endurance and data-retention specification** if the application writes calibration data; a decade-old part reaching its retention limit is a real failure mode covered in [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide).

## Boot modes and the strapping trap

A DSP's boot behaviour is set by pin straps read at reset, and the encoding is device-specific.

Typical boot sources: internal ROM, external parallel flash, SPI flash, I²C EEPROM, host port (HPI), McBSP serial, or PCI. The strap encoding differs between family members, and between *revisions* in some cases.

Three substitution failures:

- **A replacement with a different strap map** boots from the wrong source, or does not boot at all. The board shows no activity and looks dead.
- **A replacement without the same boot source** — for instance no HPI, in a design where a host processor loads the DSP over the host port — has no path to get code in.
- **Boot ROM version differences** on the same device can change what image format is accepted (header fields, checksum requirements).

Check the reset configuration section of both datasheets side by side, and where the design uses a host-loaded boot, confirm the host interface is present and identical.

## Package and thermal realities

DSPs are among the more difficult packages to handle in legacy repair.

- **Fine-pitch BGA is the norm** for anything from the 2000s onward: `ADSP-BF561SBBCZ-6A`, `TMS320DM355DZCE135` and `TMS320DM335ZCE270` in our catalogue are all BGA-class parts.
- **PQFP and TQFP legacy parts** (`ADSP-2186KSTZ-115`, `ADSP-2185KST-115`, `TMS320VC5506GHH`) are easier to rework but are exactly the obsolete ones.
- **Lead-free versus leaded transitions** appear inside families: `ADSP-2186BST-133` and `ADSP-2186BSTZ-133` differ in the `Z`, which denotes the RoHS-compliant version. **Both appear as obsolete in our catalogue**, and mixing leaded and lead-free parts in one assembly has process consequences.
- **Thermal**: high-performance DSPs run hot enough that a speed-grade change requires thermal re-verification, and a BGA's thermal path depends on board vias, so a "same part, different assembly house" outcome is possible.

## Sourcing notes

The aftermarket share here is the story. Rochester Electronics supplies 1,474 of 4,026 part numbers (37%) and importantly some of them are **active**, not merely stocked: `ADSP-2101BP-40`, `ADSP-BF561SBBCZ-6A`, `TMS320DM355DZCE135`, `TMS320DM335ZCE270` and `ADSST-2189MBST-266` all appear as active through that channel in our data.

That matters because it changes the recommendation. For a 1990s ADI fixed-point DSP, the answer is usually not "redesign"; it is "buy original-die material from the authorised aftermarket and preserve the toolchain". The channel distinction is in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

What is in last-time buy in our catalogue is concentrated in TI's application-specific DSPs: the entire `TNETV2685` group (`TNETV2685ZUT9`, `TNETV2685ZUT7`, `TNETV2685ZUT5`, `TNETV2685VIDZUT9`, `TNETV2685VIDZUTA9`, `TNETV2685FIBZUT5`, `TNETV2685FIDZUT5`, `TNETV2685FIDZUTA9`, `TNETV2685VIDZUT7`) plus `TMS320DM648ZUT9`. These are VoIP and digital-video DSPs, and the suffix variants encode feature sets, so **each variant is its own last-time-buy decision**, not one decision for the family.

Obsolete and typical of enquiries: `ADSP-21363BSQZ-1AA` (SHARC), `ADSP-2186KSTZ-115`, `ADSP-2185KST-115`, `ADSP-2185NKST-320`, `ADSP-2187LBST-210`, `ADSP-2186BST-133`, `ADSP-BF514KSWZ-4F4`, `TMS320VC5506GHH`, `TMS320DM355CZCE270`.

Also worth noting: NXP holds 807 part numbers here, largely automotive audio and radio DSPs (`SAF4000EL/101S430K`, `SAF775CHN/N208ZAMP` are active in our catalogue). Those are application-specific parts with no cross-vendor equivalent, the same situation as the PMICs in [specialised PMIC sourcing](/blog/specialized-pmic-sourcing-guide).

Incoming inspection should go further than a JTAG ID read:

- **Read the device ID and silicon revision**, and compare against what the firmware was validated on.
- **Load and run the real firmware image**, not a generic test — feature variants within a family often share an ID.
- **Exercise the memory interfaces at rated speed**, since a downgraded speed grade passes at low clock.
- **Verify the boot mode actually used** rather than a convenient one.
- **X-ray BGA parts** for reballing evidence, and check date-code consistency per [date codes and lot traceability](/blog/date-code-lot-traceability-explained).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Toolchain, emulator and licences still usable | Firmware cannot be built at all |
| 2 | Core generation and object-code compatibility | Image will not run; port required |
| 3 | Fixed-point vs floating-point | Numerical behaviour changes |
| 4 | Cycle-count budget on the new core | Real-time deadline missed |
| 5 | ROM-coded vs flash/RAM-boot variant | No substitute exists |
| 6 | Boot mode strap encoding | Does not boot |
| 7 | Boot source present (HPI, SPI, McBSP, parallel) | No path to load code |
| 8 | On-chip memory sizes and mapping | Linker file and overlays break |
| 9 | Peripheral mix (McBSP, EMIF, video ports) | Interfaces missing |
| 10 | Speed grade and thermal design | Overheating or timing failure |
| 11 | Leaded vs lead-free (`Z` suffix) | Assembly process mismatch |
| 12 | Silicon revision vs validated firmware | Errata mismatch |
| 13 | Feature-suffix variants (`VID`, `FIB`, `FID`) | Wrong feature set |

## FAQ

### Why is the toolchain a sourcing problem for DSPs?

Because a legacy DSP firmware image depends on a specific compiler version, linker command files, vendor libraries, an IDE and often a JTAG emulator with parallel-port or ISA hardware. Ten years on, the licence server may be gone, the host OS unsupported and the emulator undriveable, so the part remains purchasable while the firmware becomes unbuildable. Check that you can still produce a byte-identical build before treating the part's availability as the constraint, and if you can, archive the whole environment as a virtual machine with licences and a known-good build.

### Are all TMS320C5000 devices code-compatible?

No. The C5000 label spans the C54x and C55x cores, which have different pipelines and instruction encodings, so object code does not transfer. The C6000 family is similar: C62x, C67x, C64x and C674x are source-compatible in C but not object-compatible across generations, and hand-written assembly optimised for one pipeline will not port. Any move within a family should be planned as a source-level port with re-verification of numerical behaviour and re-measurement of cycle counts.

### What happens if my DSP is ROM-coded?

There is no substitute, because the part contains your program in mask ROM. The realistic options are moving to the flash or RAM-boot variant of the same device and loading the code externally (which needs a boot device, a strap change and board space) asking the vendor whether the family still supports mask programming, which for legacy families it usually does not, or redesigning. A telltale sign is a part number that does not appear in any datasheet: before assuming a typo, check whether it is a customer-specific ROM variant.

### Why does a DSP that passes a JTAG ID check still fail to run firmware?

Because feature variants within a family frequently share a device ID. TI's application-specific DSPs are a clear example: the `TNETV2685` group in our catalogue has suffixes such as `VID`, `FIB` and `FID` that select feature sets, and a JTAG identification read cannot distinguish them. The only reliable incoming test is loading and running the actual firmware image and exercising the peripherals the product uses, at the clock rate it uses them at.

### Which DSP families are effectively finished?

Freescale StarCore (`MSC…`, 105 of 128 part numbers inactive), ADI TigerSHARC (`ADSP-TS…`, 16 of 20) and TI's floating-point C3x (`TMS320C3…`, 13 of 14). Those architectures served markets that migrated to SoCs and FPGAs, so there is no successor inside the family to migrate to. By contrast Blackfin runs 31% inactive, C6000 41% and the ADI 21xx/SHARC group 49% — dead ordering codes but live families.

### Is the aftermarket a real option for DSPs?

More than in most categories. Rochester Electronics supplies 1,474 of the 4,026 part numbers we hold (37%) and several are active rather than merely stocked, including `ADSP-2101BP-40`, `ADSP-BF561SBBCZ-6A`, `TMS320DM355DZCE135` and `ADSST-2189MBST-266`. For a 1990s fixed-point design the usual best answer is original-die aftermarket material plus deliberate preservation of the toolchain, rather than a redesign whose main cost is re-verifying a signal chain that already works.

### What should I check on a DSP boot-mode substitution?

Put the reset configuration tables of both devices side by side. Boot source encoding (internal ROM, parallel flash, SPI, I²C, host port, serial port) is strap-decoded and device-specific, and in some families it changes between silicon revisions. Confirm that the boot source your board uses exists on the replacement, that its strap encoding matches, and that the boot ROM accepts the same image format, since header fields and checksum requirements differ. A wrong strap map produces a board with no activity, which reads as a dead part.

### Does replacing a fixed-point DSP with a floating-point one carry risk?

Yes, numerical risk. Fixed-point code depends on saturation behaviour, rounding modes and coefficient scaling chosen for a specific word length; running the equivalent algorithm in floating point changes rounding and overflow behaviour, which shows up as different filter responses, different limit-cycle behaviour in control loops, and audible differences in audio paths. The change is often an improvement, but it is a change to the product's output and needs verification against the original signal chain rather than a functional pass/fail test.

## Related reading

The rest of this cluster: [legacy microprocessor sourcing](/blog/legacy-microprocessor-sourcing-guide), [SoC, FPGA-SoC and application processor sourcing](/blog/soc-fpga-application-processor-sourcing-guide), [specialty logic: DDR registers and ECL](/blog/specialty-logic-ddr-ecl-sourcing-guide).

The system around a DSP: [flash and EEPROM sourcing](/blog/flash-eeprom-sourcing-guide) for boot devices, [SRAM sourcing](/blog/sram-sourcing-guide) and [DRAM and SDRAM legacy sourcing](/blog/dram-sdram-legacy-sourcing) for external memory, [ADC sourcing](/blog/adc-sourcing-guide) and [DAC sourcing](/blog/dac-sourcing-guide) for the converters at each end of the signal chain, and [clock generators and PLLs](/blog/clock-generator-pll-sourcing) for the sample clock — whose jitter sets the achievable SNR.

Decisions: [redesign or re-source](/blog/redesign-vs-resource-obsolete-parts), [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage), [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number and tell us whether you can still build the firmware. If you cannot, we will say so rather than sell you silicon that cannot be programmed.

[**Submit an RFQ**](/rfq) | [**Browse DSPs**](/category/dsp) | [**Upload a BOM**](/bom)
