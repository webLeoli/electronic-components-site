---
title: "Altera MAX CPLD Replacement Paths: MAX 3000, MAX 7000 and MAX II"
slug: "altera-max-cpld-replacement-paths"
status: "draft"
seoTitle: "Altera MAX CPLD Sourcing: MAX 7000, MAX 3000 & MAX II Guide"
seoDesc: "MAX 7000 and MAX 3000 are almost entirely obsolete. Decoding EPM part numbers, the 5V tolerance problem that blocks migration, Quartus version cliffs, and realistic replacement paths."
seoKeywords: "MAX 7000 obsolete, EPM7064, EPM3064, MAX II replacement, Altera CPLD sourcing, EPM240, 5V CPLD replacement, MAX 7000S alternative"
tags: "CPLD, Altera, Intel, MAX 7000, MAX 3000, MAX II, EPM, legacy sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "FPGA & CPLD Sourcing"
relatedProducts: "EPM7064SLC44-10N, EPM7128BTC144-10N, EPM7256SQC208-10N, EPM240T100C5N, EPM7064STC100-7N"
---

# Altera MAX CPLD Replacement Paths: MAX 3000, MAX 7000 and MAX II

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: MAX CPLD, EPM7000, MAX II, 5V tolerance, legacy sourcing

---

**The MAX 7000 family is one of the most thoroughly obsolete part families still in active demand.** Introduced in the 1990s, it became the default glue-logic and sequencing device for a generation of industrial, telecom and instrumentation boards, and a great many of those boards are still built today. Almost every MAX 7000 and MAX 3000 orderable part in circulation is marked obsolete, yet the parts remain findable. This guide covers what is realistically available, why the obvious migration to MAX II is blocked for a large fraction of designs, and what to do instead.


<img src="/uploads/blog/altera-max-cpld-replacement-paths.webp" alt="Legacy Altera MAX CPLD beside a modern replacement on an industrial PCB" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Essentially the entire MAX 7000 and MAX 3000 range is obsolete.** Of the ~950 MAX-family part numbers we cover, the EPM7xxx devices are almost uniformly discontinued — yet still obtainable through specialty and aftermarket channels.
- **5 V tolerance is the migration blocker.** MAX 7000S is a 5 V device; MAX II is 3.3 V core with limited tolerance. A design using 5 V logic cannot simply move.
- **A CPLD is chosen for instant-on behaviour**, not capacity, which is exactly why nothing modern is a drop-in.
- **Quartus II 13.0sp1 is the last toolchain** supporting MAX 3000 and MAX 7000. Modern Quartus Prime dropped them entirely.
- These are **low-value, high-pin-count parts in PLCC and QFP**, so counterfeit pressure is lower than for FPGAs and inspection is comparatively easy.
- For most sustaining cases, a **last-time-buy beats migration** — these devices store indefinitely and quantities are usually small.

---

## Why MAX CPLDs are still being bought

A CPLD does a job that nothing else does as cheaply: it is functional within microseconds of power-up, with no external configuration memory. That makes it the natural choice for power sequencing, reset supervision, boot-mode selection, bus arbitration and level translation — functions that must work *before* anything else on the board is alive.

Designs that used a MAX 7000 for that role in 1998 or 2008 still need something to do it today, and the surrounding board has usually not changed. This is why an obsolete 1990s CPLD generates steady sourcing requests decades later.

Our catalogue holds roughly 950 MAX-family part numbers. The pattern is stark:

| Family | Prefix | Era | Supply | Status today |
| --- | --- | --- | --- | --- |
| MAX 7000 / 7000S / 7000A / 7000B | EPM7 | 1990s–2000s | 5 V (S), 3.3 V (A), 2.5 V (B) | Obsolete |
| MAX 3000A | EPM3 | Late 1990s | 3.3 V | Obsolete |
| MAX II / IIZ | EPM240, EPM570, EPM1270, EPM2210 | 2004 onward | 3.3 V/2.5 V/1.8 V core | Mature, more obtainable |
| MAX V | 5M | 2010 onward | 3.3 V–1.8 V | Mature |

Representative parts we see requested (`EPM7064SLC44-10N`, `EPM7128BTC144-10N`, `EPM7256SQC208-10N`, `EPM7064STC100-7N`) are all obsolete, and all still sourceable.

## Decoding an EPM part number

```
EPM7128 B TC144 - 10 N
│       │ │       │   └── N = lead-free (RoHS)
│       │ │       └────── Speed grade: -5, -6, -7, -10, -15 (ns pin-to-pin; LOWER = FASTER)
│       │ └────────────── Package: TC144 = 144-pin TQFP; LC = PLCC, QC = PQFP, FC = FBGA
│       └──────────────── Family variant: (none) = 7000, S = 5V, A = 3.3V, AE, B = 2.5V
└─────────────────────── Device: MAX 7000, 128 macrocells
```

Two conventions catch people:

- **The speed grade is a propagation delay in nanoseconds, so lower is faster.** A `-5` part is faster than a `-10`. This is the same direction as Altera FPGAs but expressed in different units.
- **The letter after the density is the voltage family**. It is the single most important character in the string. `EPM7128S` and `EPM7128A` are not interchangeable — one is a 5 V part and the other 3.3 V.

Availability by field:

| Field | Easier to source | Harder to source |
| --- | --- | --- |
| Density | 64, 128 macrocells | 256, 512 macrocells |
| Package | PLCC44, TQFP100/144 | PQFP208, larger BGA |
| Speed | -10, -15 | -5, -6 |
| Voltage variant | S and A | B (2.5 V), AE |
| Temperature | Commercial | Industrial |

## The 5 V problem that blocks migration

This is the single reason MAX 7000 sourcing requests keep arriving instead of migration projects.

MAX 7000S runs from a 5 V supply with 5 V I/O. MAX II (the family Altera positioned as its successor) has a 3.3 V (or lower) core, and while its inputs tolerate a limited range, it is not a 5 V part. For a board where the CPLD sits between 5 V logic, drives 5 V loads, or is powered from the board's only 5 V rail, "migrate to MAX II" is not a substitution. It is:

- a new supply rail, or a regulator added to generate 3.3 V;
- level translation on every 5 V-facing signal;
- revised I/O drive analysis for anything the CPLD drives directly;
- a new footprint, since packages do not carry across.

For a two-layer industrial board built in 2002, that is a redesign of the whole power and I/O section to replace one glue-logic chip. It is almost never worth it, which is why the parts keep selling.

If the design is genuinely 3.3 V, migration is far more tractable: MAX 3000A to MAX II is a comparatively ordinary port, still requiring a new footprint and toolchain work but without the level-translation problem.

## The toolchain cliff

Quartus II 13.0sp1 is the last version that supports MAX 3000 and MAX 7000. Modern Quartus Prime releases removed them.

| Toolchain | MAX 3000 / 7000 | MAX II | MAX V |
| --- | --- | --- | --- |
| Quartus II 13.0sp1 | Yes | Yes | Yes |
| Quartus II 13.1 – 15.x | No | Yes | Yes |
| Quartus Prime (modern) | No | Limited/no | Yes |

Older still, MAX+PLUS II was the original tool for these devices and predates Quartus entirely. Some very old designs exist only as MAX+PLUS II projects.

The practical consequences repeat what applies across legacy programmable logic:

- **Archive the toolchain as a virtual machine image**, with the OS, the licence configuration and the project files together. Quartus II 13.0sp1 will not install cleanly on a current operating system.
- **Archive the programming file** (`.pof`), not just the source. Rebuilding a byte-identical output years later assumes an unchanged toolchain.
- **Source files may be in AHDL**, Altera's proprietary hardware description language, which nothing else reads. If a design must be ported, AHDL source is a translation exercise before it is a migration exercise.

That last point is specific to this generation and worth checking early: a MAX 7000 project written in AHDL rather than VHDL or Verilog carries a hidden porting cost that only becomes visible when someone opens the project.

## Counterfeit and quality risk

Risk here is lower than for legacy FPGAs, and inspection is easier. MAX CPLDs are low unit value, and the dominant packages (PLCC44, TQFP100/144, PQFP208) are leaded and fully visible, so visual inspection, lead-finish examination and marking-permanency tests are effective without X-ray or decapsulation.

What still occurs:

- **Recycled parts from scrapped boards**, cleaned and remarked. Lead condition and residual solder are usually detectable.
- **Speed-grade remarking**, e.g. a `-10` sold as a `-7`. Only found by testing.
- **Voltage-variant remarking**: an `A` part sold as an `S`. This one is dangerous, because fitting a 3.3 V part into a 5 V socket destroys it, and the failure looks like a bad board rather than a bad part.

A JTAG IDCODE read confirms device identity on parts that support it. For older MAX 7000 devices without JTAG, functional test in-circuit is the practical check.

Our [quality process](/quality) covers the applied procedure; [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide) covers the inspection categories.

## Replacement paths, ranked

Path 1: Buy the original. Almost always the correct first answer for a sustaining build. These parts are widely available through specialty distribution and aftermarket channels, they store indefinitely in tubes or trays, and the quantities involved in sustaining production are usually modest. Zero engineering cost, zero requalification.

Path 2: A different variant of the same device. If `EPM7128STC100-10N` is unobtainable, a different package or speed grade of the same density and voltage family may be available and requires only a footprint change, often accommodated on a board revision that was happening anyway.

Path 3: MAX II, if the design is 3.3 V. A genuine migration: new footprint, Quartus version change, re-verification. Tractable when the voltage situation permits.

Path 4: A modern small CPLD or FPGA from another vendor. Lattice MachXO2/XO3 devices occupy a similar niche with instant-on behaviour, and are worth considering when the design is being revised anyway. Full port: different toolchain, different primitives, different footprint. See [Lattice MachXO and ECP sourcing](/blog/lattice-machxo-ecp-sourcing).

Path 5: Replace with discrete logic or a small microcontroller. For simple functions (a handful of gates, a reset delay, a mode latch) the CPLD may be replaceable with jellybean logic or an MCU already on the board. Worth evaluating when the CPLD implements very little.

| Situation | Path |
| --- | --- |
| Sustaining build, stable design | 1 |
| Specific suffix gone, board revision available | 2 |
| 3.3 V design, long remaining life | 3 |
| Board being redesigned anyway | 4 |
| CPLD implements trivial logic | 5 |
| 5 V design, no board revision planned | 1 — migration is disproportionate |

## FAQ

### Is the Altera MAX 7000 obsolete?

Yes. The MAX 7000 family in all its variants (7000, 7000S, 7000A, 7000AE and 7000B) is discontinued, as is MAX 3000A. The parts nonetheless remain obtainable through specialty distribution and authorised aftermarket channels, and demand continues because an enormous installed base of industrial and telecom equipment uses them for glue logic and power sequencing. Availability should be checked per orderable part number rather than per family.

### What is the replacement for MAX 7000?

Altera positioned MAX II as the successor, but it is only a viable replacement for 3.3 V designs. MAX 7000S is a 5 V device while MAX II has a 3.3 V or lower core, so a design with 5 V logic around the CPLD needs a new supply rail, level translation on 5 V-facing signals, and a new footprint. For most sustaining situations, sourcing the original MAX 7000 part is far cheaper than that redesign.

### How do I read an EPM part number?

Take EPM7128BTC144-10N. EPM7128 identifies a MAX 7000 device with 128 macrocells, the B denotes the 2.5 V family variant, TC144 is a 144-pin TQFP package, -10 is the speed grade expressed as pin-to-pin propagation delay in nanoseconds, and N indicates lead-free construction. Two conventions matter: lower speed-grade numbers are faster, and the letter after the density identifies the voltage family, making EPM7128S and EPM7128A non-interchangeable.

### Can I replace a 5V MAX 7000S with a MAX II?

Not directly. MAX II is not a 5 V part, so any signal path where the CPLD interfaces with 5 V logic requires level translation, and a board powered only from 5 V needs a new 3.3 V rail. The packages also differ, so the footprint changes. This combination turns a single-component substitution into a redesign of the board's power and I/O sections, which is why sourcing the original part is usually the better answer.

### Which Quartus version supports MAX 7000?

Quartus II 13.0sp1 is the last release supporting MAX 3000 and MAX 7000; versions from 13.1 onward dropped them, and modern Quartus Prime does not include them at all. Very old designs may instead exist as MAX+PLUS II projects, which predate Quartus. Teams sustaining these designs should archive a virtual machine containing the correct tool version, its licence configuration and the project, along with the generated programming file.

### Are counterfeit MAX CPLDs a risk?

Lower risk than legacy FPGAs, because unit values are low and the common PLCC and QFP packages are leaded and fully inspectable without X-ray. The forms that do occur are recycled parts remarked as new, speed-grade remarking, and (most dangerously) voltage-variant remarking, where a 3.3 V A-suffix part is sold as a 5 V S-suffix part. That last case destroys the device on power-up and presents as a board fault rather than a part fault, so verifying the voltage variant on receipt is worthwhile.

### Should I migrate off MAX 7000 or buy remaining stock?

For a stable sustaining build, buy the stock. MAX CPLDs store indefinitely in tubes or trays, sustaining quantities are usually small, and the engineering cost of migration (particularly for 5 V designs) is disproportionate to the value of one glue-logic device. Migration makes sense when the board is being redesigned for other reasons, when the design is already 3.3 V and has a long remaining life, or when the frozen toolchain blocks changes the product requires.

### What does a CPLD do that an FPGA cannot?

A CPLD stores its configuration on-chip in non-volatile memory and is functional within microseconds of power-up without any external configuration device. An FPGA usually loads its bitstream from external memory at power-up, taking milliseconds or longer. That instant-on behaviour is why CPLDs handle power sequencing, reset control, boot-mode selection and bus arbitration — functions that must be working before the rest of the board comes alive.

## Related reading

The general selection framework, including why CPLDs and FPGAs are chosen for different reasons, is in [how to choose the right FPGA](/blog/how-to-choose-right-fpga). For the parallel legacy situations, see [sourcing Xilinx Spartan-6](/blog/sourcing-xilinx-spartan-6-guide) and [sourcing Altera Cyclone I to IV](/blog/sourcing-altera-cyclone-legacy). The wider lifecycle picture is in [FPGA obsolescence](/blog/fpga-obsolescence-spartan-cyclone-end-of-life).

Send the full orderable part number (density, voltage variant, package, speed grade) and we will come back with real availability and date codes across specialty and aftermarket channels.

[**Submit an RFQ**](/rfq) | [**MAX CPLD sourcing**](/fpga-sourcing/altera-max-cpld) | [**Upload a BOM**](/bom)
