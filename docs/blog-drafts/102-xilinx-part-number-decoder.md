---
title: "Xilinx Part Numbers Decoded: What Every Segment of XC7A35T-1CPG236C Means"
slug: "xilinx-part-number-decoder"
status: "draft"
seoTitle: "Xilinx Part Number Decoder: XC7A35T-1CPG236C Explained"
seoDesc: "Every character in a Xilinx part number is orderable information. Full decode of XC7A35T-1CPG236C, plus Spartan-6 and UltraScale examples and package codes."
seoKeywords: "xilinx part number decoder, xc7a35t meaning, xilinx part numbering, xilinx speed grade, xilinx package codes, xilinx temperature grade, XC7A35T-1CPG236C"
tags: "Xilinx, AMD, FPGA, part numbers, Artix-7, Spartan-6, UltraScale, sourcing"
author: "FPGACenter Sourcing Team"
priority: 1
readingTime: 14
category: "FPGA & CPLD Sourcing"
relatedProducts: "XC7A35T-1CPG236C, XC7A100T-2FGG484I, XC6SLX9-2TQG144C, XC7K325T-2FFG900C, XC7Z020-1CLG484C, XC95144XL-10TQG100C"
---

# Xilinx Part Numbers Decoded: What Every Segment of XC7A35T-1CPG236C Means

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~14 minutes
> **Topics**: Xilinx part numbering, speed grades, package codes, temperature grades, ES suffixes, procurement

---

**A Xilinx part number is not a name — it is a complete order specification, and every character in it is binding.** XC7A35T-1CPG236C tells you the vendor and product class, the silicon generation, the family, the logic capacity, whether the die carries serial transceivers, the timing bin it was tested into, the package construction and ball count, whether it is lead-free, and the junction temperature range it is guaranteed over. Misread any one of those segments and you can receive a part that is electrically real, entirely genuine, and still useless on your board. This guide decodes the classic Xilinx scheme segment by segment, works through a Spartan-6 and an UltraScale example, and finishes with the procurement rules and a quick-reference table you can keep next to your BOM.

## Key takeaways

- **Every segment of a Xilinx part number is orderable information.** Family, capacity, speed grade, package and temperature grade are all independent variants with independent stock and independent lifecycle status.
- **The digits after the family letter are a capacity designator, not an exact count.** XC7A35T has roughly 33,000 logic cells; the "35" is a rounded label.
- **A trailing T on the device name means serial transceivers are on the die.** Its absence, in families where both variants exist, means they are not — and no bitstream can add them.
- **Package letters name the construction family; the digits are the pin or ball count.** The G embedded in modern package codes (TQG, CPG, FGG) marks the part as lead-free.
- **Speed-grade numbers are family-relative and, on Xilinx FPGAs, higher is faster.** On the XC9500 CPLDs the number is a propagation delay in nanoseconds, so lower is faster — a trap inside a single vendor's catalog.
- **ES-suffixed devices are engineering samples**, not production silicon, and should never be accepted against a production purchase order.

---

## The worked example: XC7A35T-1CPG236C, segment by segment

Here is the full decode, then each segment in detail:

```
XC 7 A 35T - 1  CPG236  C
│  │ │ │     │  │       └── Temperature grade: C = commercial
│  │ │ │     │  └────────── Package: CP chip-scale BGA, G = lead-free, 236 balls
│  │ │ │     └───────────── Speed grade: -1 (slowest of -1 / -2 / -3)
│  │ │ └─────────────────── Capacity designator (~33k logic cells) + T = transceivers
│  │ └───────────────────── Family: A = Artix
│  └─────────────────────── Generation: 7 series
└────────────────────────── Prefix: XC = standard commercial product line
```

### XC — the product-line prefix

XC is the standard prefix on [Xilinx](/manufacturer/xilinx) commercial and industrial product lines, and it survived the AMD acquisition unchanged — devices shipping today under AMD branding still carry XC part numbers. Other prefixes exist and mean something materially different, which we cover in the prefix section below. For now: XC is what you will see on the overwhelming majority of parts in circulation.

### 7 — the generation

The digit immediately after the prefix identifies the silicon generation. In XC7A35T it is the 7 series (Artix-7, Kintex-7, Virtex-7, Spartan-7, and the Zynq-7000 SoCs, which use XC7Z numbers). Older schemes put the generation elsewhere — Spartan-6 parts read XC6S, Virtex-5 parts read XC5V — so the digit-then-letter versus letter-then-digit order flips between eras. Read the whole device field before assuming.

### A — the family letter

Within the 7 series, the letter after the generation digit selects the family: **S** = Spartan-7, **A** = Artix-7, **K** = Kintex-7, **V** = Virtex-7, **Z** = Zynq-7000. The family letter carries real engineering weight — it determines the transceiver type and count, the I/O architecture, and the price band. An XC7K325T (Kintex-7) and an XC7A35T (Artix-7) are not adjacent points on one scale; they are different products.

### 35T — capacity designator and transceiver indicator

The digits are a rounded capacity label. XC7A35T contains roughly 33,000 logic cells; XC7A100T contains roughly 100,000. Treat the number as a catalog position, not a datasheet value — always pull the exact resource counts from the family data sheet.

The trailing **T** indicates that the die carries multi-gigabit serial transceivers. In Artix-7 every production device is a T device, so the letter looks decorative there, but the distinction is live elsewhere: Spartan-7 devices carry no T because the family has no transceivers at all, and some older families offered parallel variants with and without them (Spartan-6 LX versus LXT, covered below). If your design uses PCIe, SATA or any SerDes-based interface, the T is not optional.

### -1 — speed grade

The number after the hyphen is the timing bin. For 7-series FPGAs the grades are **-1 (slowest), -2, and -3 (fastest)**; low-power variants with an L in the grade (such as -2L) exist in parts of the 7 series and trade static power against timing. Two rules matter for sourcing. First, the numbers are family-relative — a -2 in one family is not comparable to a -2 in another. Second, on Xilinx FPGAs higher is faster, which is the opposite of the Altera convention and the opposite of Xilinx's own XC9500 CPLDs, where the number is a pin-to-pin delay in nanoseconds. On an XC95144XL-10TQG100C, the -10 means 10 ns, and a -7.5 part is the faster one.

A slower-grade part cannot substitute for a faster-grade requirement. A faster grade can technically substitute downward, but it is a different line item at a different price, and your receiving inspection should treat it as a deviation to be approved, not a bonus.

### CPG236 — the package

Package codes have three readable pieces: the letters name the package construction family, an embedded **G** marks the part as lead-free (RoHS-compliant), and the trailing digits are the pin or ball count. CPG236 is a chip-scale BGA with 236 balls, lead-free. The same die is offered in other packages — the XC7A35T also ships in CSG324 and FGG484, among others — and those are different orderable parts with different footprints. There is no such thing as substituting across packages without a board respin.

### C — the temperature grade

The final letter is the temperature grade: **C** = commercial, **I** = industrial, **E** = extended, **Q** = automotive/extended. These are guaranteed junction temperature ranges, not ambient, and they are covered in their own section below because they are one of the two suffix positions most often mismatched at purchase.

## Second worked example: Spartan-6, XC6SLX9-2TQG144C

The Spartan-6 scheme is the same idea with the fields in a slightly different order:

```
XC 6S LX 9 - 2  TQG144  C
│  │  │  │   │  │       └── Temperature grade: C = commercial
│  │  │  │   │  └────────── Package: TQ thin QFP, G = lead-free, 144 pins
│  │  │  │   └───────────── Speed grade: -2 (Spartan-6's slowest standard grade)
│  │  │  │  └────────────── Capacity designator: ~9k logic cells
│  │  └──────────────────── Sub-family: LX = logic-optimized (LXT adds transceivers)
│  └─────────────────────── Generation + family: 6S = Spartan-6
└────────────────────────── Prefix: XC = standard commercial product line
```

Three things are worth noticing against the Artix-7 example. First, the generation and family are fused into one field (6S) rather than split. Second, the transceiver question is answered by the sub-family letters instead of a trailing T: **LX** devices have no transceivers, **LXT** devices do, and the two are not interchangeable even at identical logic capacity. Third, the speed-grade numbering demonstrates why grades are family-relative: Spartan-6's standard grades are -2 and -3 (with -3N and a low-power -1L on some devices), so -2 here is the slowest standard bin, whereas -2 in the 7 series is the middle one. A cross-reference that carries speed-grade numbers between families without re-deriving timing is wrong by construction.

TQG144 decodes the same way as before: TQ = thin quad flat pack, G = lead-free, 144 pins. QFP packages matter in the legacy market because they can be reworked without a BGA station, which keeps demand for parts like this alive long after the family went mature.

## Third worked example: UltraScale, XCKU040-2FFVA1156E

With UltraScale, the scheme changed shape:

```
XC KU 040 - 2  FFVA1156  E
│  │  │     │  │         └── Temperature grade: E = extended
│  │  │     │  └──────────── Package: FF flip-chip BGA + construction letters, 1156 balls
│  │  │     └─────────────── Speed grade: -2
│  │  └───────────────────── Capacity designator within the family
│  └──────────────────────── Family: KU = Kintex UltraScale
└─────────────────────────── Prefix: XC
```

The changes to register: the generation digit is gone, replaced by two family letters (**KU** = Kintex UltraScale, **VU** = Virtex UltraScale; UltraScale+ devices append a P to the device name, as in XCKU5P). The capacity designator became a zero-padded three-digit field. And the package codes grew extra letters — FFVA rather than FFG — which encode package construction details that vary across the portfolio; the reliable reading is still that FF-class codes are flip-chip BGAs and the trailing digits are the ball count, with the intermediate letters checked against the current AMD packaging documentation rather than guessed. The temperature letter at the end works as before; this example is an E (extended) grade.

The practical takeaway is that the classic decode habits transfer, but not blindly. When a part number does not parse the way a 7-series number would, stop and check the family's ordering-information page instead of forcing it.

## Prefix variants: XC, XA, XQ

The prefix is the segment buyers skip because it "never changes." It changes exactly when the stakes are highest:

| Prefix | Meaning | Procurement significance |
| --- | --- | --- |
| XC | Standard commercial product line | The default; covers commercial, extended and industrial temp grades |
| XA | Automotive-qualified (AEC-Q100 flow) | Qualified and documented for automotive use; not substitutable by XC in an automotive BOM |
| XQ | Defense-grade | Extended screening and support for defense applications; export-control considerations apply |
| XQR | Space-grade / radiation-tolerant | Specialty flow; a different market with different channels entirely |

An XA7A35T and an XC7A35T may share a die design, but they are different products with different qualification data, different traceability expectations and different prices. Substituting XC for XA to close a shortage is a qualification decision for the customer's quality organization, never a purchasing decision. In the other direction, XA and XQ parts occasionally surface in open-market stock at prices that look attractive against XC — treat provenance with proportionate suspicion.

## Temperature grades: C, I, E, Q

Xilinx temperature grades specify guaranteed **junction** temperature ranges. For the 7 series:

| Grade | Name | Junction temperature range (7 series) |
| --- | --- | --- |
| C | Commercial | 0 °C to +85 °C |
| E | Extended | 0 °C to +100 °C |
| I | Industrial | −40 °C to +100 °C |
| Q | Automotive / extended | −40 °C to +125 °C |

Two cautions. First, these are junction ranges, so the usable ambient range depends on your power dissipation and thermal design — a C-grade part in a sealed enclosure may effectively have far less margin than the label suggests. Second, the exact ranges are family-specific; verify against the data sheet for families outside the 7 series rather than assuming these numbers carry over.

For sourcing, the asymmetry matters: an I-grade part meets or exceeds the C-grade envelope, so I can substitute for C technically (at a price premium and with a paperwork deviation), but C can never substitute for I. Industrial-grade stock is consistently thinner than commercial, and it is the variant that disappears first when a family goes into decline — worth checking early via [FPGA sourcing](/fpga-sourcing) if your BOM specifies I-grade legacy parts.

## Package codes: reading TQG, CPG, CSG, FGG, FFG, FBG

The pattern is consistent: letters identify the package construction family, an embedded G marks lead-free, and the trailing digits are the pin or ball count.

| Code family | Construction | Example | Notes |
| --- | --- | --- | --- |
| TQG | Thin quad flat pack (leaded, perimeter pins) | TQG144 | Hand-reworkable; common on Spartan-6 and CPLDs |
| CPG | Chip-scale BGA | CPG236 | Compact wire-bond BGA class |
| CSG | Chip-scale BGA | CSG324 | Same class as CPG; specific geometry differs by code |
| FGG | Fine-pitch BGA (wire-bond) | FGG484 | The workhorse mid-range BGA code |
| FBG | Fine-pitch BGA (wire-bond variant) | FBG484 | Related construction; details differ by family |
| FFG | Flip-chip fine-pitch BGA | FFG900 | Used on larger, higher-performance devices |

Deliberately absent from that table: body dimensions and ball pitches. They vary across devices sharing a code family, and quoting a single number would be wrong somewhere. When the mechanical outline matters — and for a footprint it always does — pull the package drawing for the exact device from the vendor's packaging documentation.

One legacy trap: older, non-RoHS versions of the same packages exist without the G (TQ144 instead of TQG144). On long-lived designs and old stock, the leaded and lead-free versions are both real, both genuine, and not interchangeable under a RoHS-compliant process. The single letter G is the entire difference.

## ES and the suffixes that stop a shipment

**ES — engineering samples.** Devices from pre-production silicon carry an ES suffix appended to the part number (for example, an early XC7A35T-1CPG236C would have shipped as XC7A35T-1CPG236CES). ES parts may differ from production silicon in errata, timing and even functionality, and vendors do not warrant them for production. They surface on the open market decades after launch, sometimes with the ES conveniently omitted from the listing. Receiving inspection should check the physical marking, not the paperwork: an ES device offered against a production part number is a non-conformance regardless of how genuine the die is.

**G — lead-free.** Covered above, but worth repeating as a suffix trap because it hides mid-string inside the package code rather than dangling at the end where audits look.

**SCD and customer-specific numbers.** Defense and aerospace programs sometimes buy against source-control drawings with program-specific part numbers that wrap a standard device. If a part number does not parse against the standard scheme at all, that is one possible explanation — and a reason to ask for the underlying vendor part number before quoting.

## Why two "same" parts are not interchangeable in procurement

Engineers say "we use the 7A35T." Purchasing systems cannot. Consider what the catalog actually contains around that one die:

| Orderable part | What differs | Interchangeable with XC7A35T-1CPG236C? |
| --- | --- | --- |
| XC7A35T-2CPG236C | Speed grade -2 | Downward substitution only, as an approved deviation |
| XC7A35T-1CPG236I | Industrial temp | Technically exceeds C; separate line item, separate stock |
| XC7A35T-1CSG324C | 324-ball package | No — different footprint, board respin required |
| XC7A35T-1CPG236CES | Engineering sample | No — not production silicon |
| XA7A35T-1CPG236Q | Automotive qualified | No — different product line and qualification |

Every row is a genuine Xilinx product. Only one of them is the part on your BOM. This is why an RFQ that names only a family gets a family-level answer, and why the quotes that come back fastest are the ones that specify the complete orderable part number down to the final letter. It is also why availability claims need the same precision: "XC7A35T in stock" is compatible with your exact variant being unobtainable. When you check stock — including pasting a full part number into our [part search](/search) — check the full string, not the device name.

The lifecycle dimension compounds this. Vendors discontinue at the orderable-part level, not the family level. A family marked Active can have individual package or temperature variants already on last-time-buy, and the low-volume variants (industrial grades, less popular packages) go first. If your BOM lives on one of those variants, the family's healthy status on a lifecycle report is telling you nothing useful.

## Quick-reference table

| Segment | Position | Values and meaning |
| --- | --- | --- |
| Prefix | Start | XC = standard, XA = automotive, XQ = defense-grade, XQR = space |
| Generation / family | After prefix | 7A/7K/7V/7S/7Z = 7 series families; 6S = Spartan-6; 5V = Virtex-5; KU/VU = UltraScale (+P device suffix for UltraScale+) |
| Capacity | After family | Rounded designator (35 ≈ 33k logic cells); exact counts from the data sheet |
| T suffix | End of device name | Serial transceivers on die (where the family offers both variants) |
| Speed grade | After hyphen | -1 slowest → -3 fastest on 7-series FPGAs; family-relative; L variants = low power; XC9500 CPLDs use delay in ns (lower = faster) |
| Package | After speed | Letters = construction family (TQ, CP, CS, FG, FB, FF), G = lead-free, digits = pin/ball count |
| Temp grade | Final letter | C = 0–85 °C, E = 0–100 °C, I = −40–100 °C, Q = −40–125 °C (junction, 7 series) |
| ES | Appended | Engineering sample — not production silicon |

## FAQ

### What does the T in XC7A35T mean?

It indicates the die carries multi-gigabit serial transceivers. In Artix-7 all production devices are T devices, so the letter is uniform there, but in families offering both variants (Spartan-6 LX versus LXT) the presence or absence of transceivers is exactly this field. Transceivers are hard silicon: if the part does not have them, no amount of logic can create them.

### Is a -2 speed grade faster than a -1?

On Xilinx FPGAs, yes — higher numbers are faster bins, with -1 the slowest and -3 the fastest in the 7 series. But the numbers are family-relative, and on the XC9500 CPLD families the number is a propagation delay in nanoseconds, so lower is faster there. Never carry a speed-grade number across families, and never compare it against Altera numbering, which runs in the opposite direction.

### What is the difference between XC7A35T-1CPG236C and XC7A35T-1CPG236I?

Only the temperature grade: C is commercial (0 °C to +85 °C junction), I is industrial (−40 °C to +100 °C junction). They are separate orderable parts with separate stock and separate pricing. The I-grade exceeds the C-grade envelope, so it can substitute downward as an approved deviation; the reverse substitution is never acceptable.

### What does the G in CPG236 or TQG144 mean?

Lead-free (RoHS-compliant) assembly. The same packages existed historically without the G as leaded versions, and both are genuine parts. On legacy stock, verify which one you are being offered — the difference is invisible in most listings and decisive in a RoHS-compliant process.

### Are engineering-sample (ES) parts usable?

For lab bring-up, possibly. For production, no: ES silicon can differ from production in errata, timing and function, and it is not warranted for production use. ES devices offered against production part numbers are one of the recurring problems in open-market sourcing, which is why marking inspection matters more than paperwork.

## Sourcing help

We stock and source the full spread of Xilinx programmable logic, from XC9500 and Spartan-era legacy through the 7 series and UltraScale, including obsolete variants through authorized aftermarket and specialty channels. Send the complete orderable part number — prefix, device, speed grade, package and temperature grade — and we will respond with real availability against that exact string, with date codes and traceability, rather than a family-level answer.

[**Submit an RFQ**](/rfq) | [**FPGA sourcing hub**](/fpga-sourcing) | [**Xilinx catalog**](/manufacturer/xilinx)
