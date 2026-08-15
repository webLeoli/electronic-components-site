---
title: "Flip-Flops, Latches and Registers: The 374 and the 574 Are the Same Circuit With Different Pins"
slug: "flip-flop-latch-register-sourcing-guide"
status: "draft"
seoTitle: "Flip-Flop and Latch Sourcing: 374 vs 574 Pinout, Latch vs Register"
seoDesc: "6,245 flip-flops at 41% inactive and 2,642 latches at 45%. Why 374 and 574 are not footprint-compatible, latch versus edge-triggered, setup and hold, and bus-hold traps."
seoKeywords: "74HC374 vs 74HC574 pinout, flip flop sourcing, octal latch replacement, 74HC373 vs 374, transparent latch vs register, setup and hold time, 74FCT574 last time buy, obsolete flip flop"
tags: "flip-flops, latches, registers, 374, 574, setup and hold, bus hold, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "SN74ABT534ADW, SN74LV273APWG4, MM74HC574WMX, 74HC374DTR2G, 74LVC574ADTR2G, MC74LCX16374DTR2, SN74AC534DW, 74VHC574MX"
---

# Flip-Flops, Latches and Registers: The 374 and the 574 Are the Same Circuit With Different Pins

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: pinout variants, latch vs register, setup and hold, output structures, bus hold, obsolescence

---

**The `374` and the `574` are both octal D-type flip-flops with three-state outputs, identical truth tables and identical 20-pin packages, and their pins are arranged differently.** The `374` interleaves inputs and outputs down both sides; the `574` puts all eight inputs on one side and all eight outputs on the other, which is why board designers preferred it. Order the wrong one and it fits the footprint, powers up, and connects eight data lines to the wrong places. Our [flip-flops category](/category/flip-flops) holds 6,245 part numbers with **41% no longer active**, and the [latches category](/category/latches) 2,642 at **45%** (among the highest rates in the logic families) so this substitution comes up constantly.


<img src="/uploads/blog/flip-flop-latch-register-sourcing-guide.webp" alt="Octal D-type flip-flop register IC soldered onto a rugged industrial board" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **`374` and `574` are functionally identical and physically incompatible.** Check the pinout drawing, never the function number alone.
- **A latch (`373`) and a register (`374`) are different circuits.** The latch is transparent while enabled; the register samples on a clock edge.
- **`273` has a clear input and no three-state**; `374` has three-state and no clear. Substituting one for the other loses a function the board is using.
- **Inverting variants exist at `534` and `564`**, and which pinout each uses must be read from the datasheet, not inferred.
- **Setup and hold times differ across families** by enough to break a marginal timing path when a "faster" part is fitted.
- **`74FCT` registers are going last-time-buy at Renesas** — `74FCT574CTQG8`, `74FCT374ATQG8`, `74FCT162374ATPAG8` are in that state in our catalogue.
- **Wide versions (`16374`) are not drop-in for narrow ones.** The `16` prefix means 16 bits and a different package entirely.

---

## The function numbers, and what each actually does

Four numbers cover most octal storage, and they are not interchangeable.

| Function | Circuit | Enable behaviour | Outputs |
| --- | --- | --- | --- |
| `273` | Octal D flip-flop | Clock edge, **asynchronous clear** | Always driven |
| `373` | Octal transparent latch | **Level** — transparent while LE is high | Three-state |
| `374` | Octal D flip-flop | Clock edge | Three-state, interleaved pinout |
| `574` | Octal D flip-flop | Clock edge | Three-state, flow-through pinout |
| `534` / `564` | As above, **inverting outputs** | Clock edge | Three-state |
| `821` / `823` | 10-bit register | Clock edge | Three-state |
| `16374` / `16374A` | **16-bit** register | Clock edge | Three-state, 48-pin class |

Three substitution errors follow directly from this table.

Latch for register. A `373` is transparent: while the latch enable is asserted, the output follows the input continuously. A `374` samples only at the clock edge. Swap them and the data path either passes glitches straight through (register replaced by latch) or fails to capture data that was only valid during the enable window (latch replaced by register). **The symptom is data-dependent corruption, which looks like a signal integrity problem.**

Clear for three-state. `273` gives you an asynchronous clear and drives its outputs permanently. `374` gives you an output enable and no clear. A board that resets its register through the clear pin cannot use a `374`; a board that shares a bus cannot use a `273`.

**Width.** `MC74LCX16374DTR2` is in our catalogue and is a 16-bit device. The function number contains `16374`, not `374`. This trips automated cross-reference tools that match on substring.

## The pinout trap, in detail

Both the `374` and `574` are 20-pin devices with V_CC at pin 20, ground at pin 10, clock and output-enable in fixed positions, and the data pins in different orders.

| | `374` arrangement | `574` arrangement |
| --- | --- | --- |
| Data inputs | Interleaved with outputs along both sides | All on one side |
| Data outputs | Interleaved | All on the other side |
| Why it exists | Original TTL pin assignment | Designed for straight-through PCB routing |

The consequence for sourcing is simple and unforgiving: **a `574` in a `374` footprint connects each data input to the track intended for a different bit's output.** The board powers up. Nothing is damaged, because both pins are logic-level. The data is scrambled in a pattern that looks like a bus wiring fault.

And the inverting variants make it worse. The `534` and `564` numbers denote inverting-output versions of these registers, but which of the two pin arrangements each vendor uses on which number is not consistent enough to assume. `SN74ABT534ADW` and `SN74AC534DW` are both in our catalogue. **Read the pin configuration section of the datasheet for the specific part number you are buying**; this is the single highest-value check in this category.

## Latch versus flip-flop, and why it matters more than speed

A transparent latch is a wire when enabled; a flip-flop is a sample. The design consequence is what happens to input glitches.

| | Transparent latch (`373`) | Edge-triggered register (`374`/`574`) |
| --- | --- | --- |
| Output during enable | Follows input, including glitches | Unaffected until the next edge |
| Timing reference | Data must be stable before LE falls | Data must be stable around the clock edge |
| Typical use | Address demultiplexing, bus capture | Pipeline stages, synchronisation |
| Glitch behaviour | Passes them through | Rejects them between edges |

Address demultiplexing on legacy microprocessor buses is the classic latch application: the `8085`/`8086`-era practice of latching the low address byte from a multiplexed bus with a `373`. That circuit cannot be built from a `374`, because the capture must happen on the falling level of ALE, not on a clock edge with a fixed relationship to it.

## Setup, hold and the "faster part" hazard

Substituting a faster family changes setup and hold requirements, and hold time is the dangerous one.

Setup time is how long data must be stable before the clock edge; hold time is how long after. Faster families generally have shorter setup times (which helps) but their **hold requirements interact with the clock and data path delays on the existing board**.

Worked, for a register clocked at 20 MHz (50 ns period) whose data arrives 8 ns after the clock edge from a driver on the same board:

```
original part: hold time 2 ns   → data arriving 8 ns after the edge is fine
faster part:   hold time 1 ns   → still fine
BUT if the faster part also has a shorter internal clock-to-data delay,
the data source feeding the NEXT stage may now arrive too early for it
```

The general rule: **a faster register does not break its own timing, it breaks the timing of whatever it feeds.** On a synchronous bus with several registers of the same family, replacing one with a faster part shifts the relative arrival times. If the design has generous margin this is invisible; if it was tuned, it is not.

Also check:

- **Maximum clock frequency**, obviously, but it is rarely the constraint on a legacy board.
- **Clock input threshold and whether it is a Schmitt input.** A slow clock edge into a non-Schmitt clock input can double-clock. This is the same hysteresis question as in [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide).
- **Asynchronous clear/preset recovery time**, which is specified separately and often forgotten.

## Bus hold, power-up state and live insertion

Three properties of the output and input stages decide whether a register can be used on a shared bus.

**Bus hold** on inputs, present on `LVT`, `ALVC` and some `ABT` and `LVTH` parts, weakly latches an undriven input at its last level. Replacing a bus-hold part with one without it leaves inputs floating; replacing a plain part with a bus-hold one means external pull-downs must overcome a few hundred microamps of active drive. `74LVTH273MTCX` is obsolete in our catalogue and is exactly this class of part.

Power-up three-state. Bus-interface families intended for live insertion guarantee that outputs stay high-impedance while the supply ramps. General-purpose `HC` and `AHC` parts do not, so during power-up a `574` may briefly drive a bus that another card is using.

I_off (partial-power-down current). A part with a specified I_off draws no current through its I/O pins when its own supply is off, which is what allows a powered-down card to remain connected to a live bus. Without it, the I/O pins' protection diodes conduct into the unpowered rail — loading the bus and back-powering the dead card.

If the board is a hot-swappable module, these three specifications are the substitution, and general-purpose logic will not do. The related bus-switch case is covered in [decoders, multiplexers and bus switches](/blog/decoder-mux-bus-switch-sourcing-guide).

## Metastability, and what sourcing can and cannot fix

When an asynchronous signal is clocked into a flip-flop, there is always a window in which the output settles late or oscillates before resolving. It cannot be eliminated by part selection; it is managed by design — typically a two-stage synchroniser.

What part selection *does* affect:

- **Resolution time constant.** Faster families resolve metastable states faster, so a two-stage synchroniser built from `AHC` parts has a far better mean time between failures than one built from `HC` at the same clock rate.
- **Whether the synchroniser survives a substitution to a slower family.** Replacing a `74F` or `74AC` synchroniser with `74HC` at the same clock rate reduces the metastability margin: a genuine reliability regression that no functional test will detect.

This is worth stating in a substitution review because it is invisible: the board works, and the failure rate changes from once per century to once per month.

## Sourcing notes

41% of flip-flops and 45% of latches are inactive, and Rochester Electronics is the largest source at 2,474 parts in flip-flops alone, followed by Texas Instruments (1,939), onsemi (776) and Nexperia (333).

The families to watch, measured across our logic categories:

| Family | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| `74AHC` | 1,605 | 204 | 13% |
| `74LVC` | 2,546 | 526 | 21% |
| `74HC` | 6,359 | 1,888 | 30% |
| `74FCT` | 1,006 | 396 | 39% |
| `74AC` | 2,374 | 1,163 | 49% |
| `74LVT` | 345 | 205 | 59% |
| `74ABT` | 448 | 276 | 62% |

The Renesas last-time-buy list is the actionable item. In our catalogue `74FCT574CTQG8`, `74FCT374ATQG8`, `74FCT574CTSOG8`, `74FCT374CTQG8` and `74FCT162374ATPAG8` are all last-time buy, alongside onsemi's `MM74HC574WMX`, `74VHC273MX` and `74VHC574MX`. `74FCT` was the high-drive, fast CMOS bus register of choice on 1990s industrial designs. It is being wound down. **If your BOM has `FCT` registers, this is the year to decide quantities**: the method is in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

Obsolete but available as authorised aftermarket here: `74HC374DTR2G`, `74HC74DR2G`, `MC74VHC74DR2`, `74LVC574ADTR2G`, `CY74FCT821ATQCT`, `74ACT821SCX`, `MC100EL35DG`.

For incoming inspection, **clock the device through a known pattern rather than checking statically.** A remarked or wrong-function part frequently passes a continuity and power test and fails on the first pattern that distinguishes a latch from a register — hold the data stable, toggle the enable, and confirm the output does *not* follow it mid-cycle. Package-level checks are in [IDEA-STD-1010](/blog/idea-std-1010-counterfeit-detection-guide).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Pinout confirmed from the datasheet (`374` vs `574`) | Data lines scrambled |
| 2 | Latch (`373`) vs edge-triggered register (`374`) | Glitches pass through, or data never captured |
| 3 | Asynchronous clear present (`273`) | Reset path missing |
| 4 | Three-state output present | Bus contention, or no drive |
| 5 | Inverting vs non-inverting (`534`, `564`) | Data inverted |
| 6 | Width — `374` vs `16374` | Wrong package and pin count |
| 7 | Setup, hold and clock-to-output vs the rest of the bus | Timing shifted on downstream stages |
| 8 | Clock input hysteresis for slow edges | Double clocking |
| 9 | Bus hold present or absent | Floating inputs, or pull-downs overridden |
| 10 | Power-up three-state and I_off for live insertion | Bus corruption during insertion |
| 11 | Family resolution time in a synchroniser | Metastability failure rate rises |
| 12 | Drive current against bus loading | Levels not reached |

## FAQ

### What is the difference between a 74HC374 and a 74HC574?

Function, none — both are octal D-type flip-flops with three-state outputs and the same truth table. Pinout, everything. The `374` interleaves data inputs and outputs along both sides of the 20-pin package, following the original TTL assignment; the `574` places all eight inputs on one side and all eight outputs on the other so that PCB routing runs straight through. A `574` fitted into a `374` footprint fits mechanically and connects each data pin to the wrong track, producing scrambled data with no damage and no obvious cause.

### Can I use a 74HC373 latch in place of a 74HC374 register?

No. The `373` is a transparent latch: while its latch-enable input is asserted, the output follows the input continuously, including any glitches. The `374` samples the input only at a clock edge and holds it otherwise. Replacing a register with a latch lets input glitches propagate to the output during the enable window; replacing a latch with a register means data valid only during an enable level may never be captured. The failure is data-dependent and looks like signal integrity.

### What does the 273 have that the 374 does not?

An asynchronous clear input, and permanently driven outputs. The `273` is used where the register must be reset by hardware independently of the clock — for example held clear during power-up or by a watchdog. The `374` instead offers an output-enable for three-state bus sharing and has no clear. A board that relies on the clear cannot use a `374`, and a board that shares a bus cannot use a `273`, so the two are not alternates even though both are octal D registers.

### How do I know whether a 534 has the 374 or the 574 pinout?

Read the pin configuration diagram for the exact part number and vendor. The `534` and `564` numbers denote inverting-output versions of these octal registers, and the pin arrangement associated with each is not consistent enough across vendors and families to infer from the number. This is the one check in this category that repays the two minutes it takes: the failure mode (a register that fits, powers up and scrambles data) is expensive to diagnose in the field.

### Does fitting a faster flip-flop family risk anything?

Yes, on a tuned synchronous bus. A faster register has shorter setup and clock-to-output times, so data leaves it earlier than the original did. That does not break the register itself; it can break the hold-time requirement of whatever it feeds, because the next stage now sees data arriving sooner after the clock edge. On designs with generous margin this is invisible. On a bus where several registers of one family were chosen together, replacing one changes the relative arrival times, so check the receiving stage's hold specification too.

### Why would a substitution change the metastability failure rate?

Because the resolution time constant is a property of the flip-flop. When an asynchronous signal is clocked in, there is always a small window in which the output resolves late; how quickly it resolves depends on the family's internal gain and speed. A two-stage synchroniser built from a fast family may fail once in centuries at a given clock rate, while the same circuit built from a slower family at the same rate can fail far more often. No functional test detects this (the board works) so it belongs in the substitution review rather than in test.

### What are bus hold and I_off, and when do they matter?

Bus hold is a weak internal latch that keeps an undriven input at its last valid level, avoiding floating CMOS inputs. I_off is a guarantee that the device draws no current through its I/O pins while its own supply is off. Both matter on hot-swappable or partially powered systems: without I_off, a powered-down card's protection diodes load the live bus and back-power the dead card. Bus-interface families such as `LVT` and `ABT` specify them; general-purpose `HC` and `AHC` parts generally do not.

### Which register families are at end of life in your catalogue?

The `74FCT` line is the urgent one: `74FCT574CTQG8`, `74FCT374ATQG8`, `74FCT574CTSOG8`, `74FCT374CTQG8` and `74FCT162374ATPAG8` are all last-time buy, all Renesas, which inherited the IDT logic portfolio. `74VHC273MX`, `74VHC574MX` and `MM74HC574WMX` from onsemi are also last-time buy. Family-wide, `74ABT` runs 62% inactive and `74LVT` 59%, against 13% for `74AHC` and 21% for `74LVC`, so the migration target is usually `AHC`, `AHCT` or `LVC`.

## Related reading

[Decoding a 74-series part number](/blog/74-series-logic-decode-guide) has the family census and the lifecycle table behind these recommendations, and [logic family selection](/blog/logic-family-selection-guide) covers choosing a family. Sibling guides: [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide), [decoders, multiplexers and bus switches](/blog/decoder-mux-bus-switch-sourcing-guide), [counters, dividers and shift registers](/blog/counter-shift-register-sourcing-guide).

Lifecycle: [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) for the `FCT` decision, [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis), and [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

Send us the part number and we will confirm the pinout variant before anything ships; it is the check that saves the most rework in this category.

[**Submit an RFQ**](/rfq) | [**Browse flip-flops**](/category/flip-flops) | [**Browse latches**](/category/latches) | [**Upload a BOM**](/bom)
