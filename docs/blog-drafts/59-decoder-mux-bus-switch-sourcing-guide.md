---
title: "Decoders, Multiplexers and Bus Switches: A FET Switch Is Not a Buffer"
slug: "decoder-mux-bus-switch-sourcing-guide"
status: "draft"
seoTitle: "Decoder, Multiplexer and Bus Switch Sourcing: CBT, CBTD, FST Substitution"
seoDesc: "8,283 parts at 35% inactive. Bus switches versus buffers, the CBTD diode that does your level translation, decoder glitches in chip-select paths, and latching decoders."
seoKeywords: "bus switch sourcing, SN74CBT3245 replacement, CBTD diode level shift, 74HC138 decoder, 74HC151 multiplexer, 74CBTLV last time buy, FST bus switch, hot swap bus switch, decoder glitch"
tags: "decoders, multiplexers, bus switches, CBT, CBTD, FST, chip select, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "SN74CBT3125DBQR, SN74CBTD3861DWR, SN74CBTR16861DGVR, 74VHC138FT, SN74LVC1G19DCK3, 74CBTLV3862QG8, QS32XVH245Q2G, 74LCX138MTC"
---

# Decoders, Multiplexers and Bus Switches: A FET Switch Is Not a Buffer

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: bus switches vs buffers, the CBTD diode, decoder glitches, latching decoders, hot swap

---

**A bus switch and a bus buffer occupy the same place in a schematic and do opposite things.** A buffer receives a signal and regenerates it, with drive strength, a direction, and a propagation delay of its own. A bus switch is a pair of FETs that connects one net to another — bidirectional, no drive, no direction pin, and a "propagation delay" that is really just the RC of the switch resistance and the load capacitance. Substituting one for the other changes the electrical behaviour of the bus, not just its timing. Our [signal switches, MUX and decoders category](/category/signal-switches-mux-decoders) holds 8,283 part numbers with 2,918 no longer active (**35%**) and the bus-switch families are where the last-time-buy notices are landing.


<img src="/uploads/blog/decoder-mux-bus-switch-sourcing-guide.webp" alt="Bus switch FET IC managing multiple high-speed signal lanes on a dark blue PCB" width="1200" height="630" fetchpriority="high" />

## Key takeaways

- **Bus switches do not buffer.** No drive, no direction control, no regeneration: the driver on one side must drive the total capacitance on both.
- **The `D` in `CBTD` is a series diode** that drops a 5 V signal to roughly 3.3 V. Replace a `CBTD` with a plain `CBT` and 5 V lands directly on 3.3 V inputs.
- **`137` is a `138` with an address latch.** Substituting the `138` loses the latch the board relied on.
- **Decoders glitch during address transitions.** In a write-enable path that is a double write; in a chip-select path it is usually harmless.
- **Decoder propagation delay comes out of the memory access budget**, and family choice moves it by 15 ns.
- **`74CBTLV` and `74FST` parts are going last-time-buy at Renesas** — `74CBTLV3862QG8`, `74FST6800QG8`, `QS32XVH245Q2G` in our catalogue.
- **Hot-swap bus switches are a distinct product class** with power-up three-state and I_off guarantees.

---

## Bus switch versus buffer: the substitution that changes the circuit

A bus switch is an analogue pass element used on digital signals. Its specification sheet looks nothing like a buffer's.

| | Bus switch (`CBT`, `FST`, `PI3`, `QS32`) | Bus buffer (`245`, `244`, `ABT`, `LVT`) |
| --- | --- | --- |
| Signal path | Bidirectional FET, typically 4-8 Ω on | Unidirectional amplifier per bit |
| Direction control | **None needed** | Required (`DIR` pin) |
| Drive strength | None — passes what it is given | 24-64 mA |
| "Propagation delay" | ~0.25 ns, effectively the RC | 3-10 ns of real logic delay |
| Signal regeneration | No — edge degradation accumulates | Yes — clean edges out |
| Level translation | Only via the `D` diode variants | Yes, if supplies allow |
| Total load seen by driver | **Both sides in parallel** | One side only |

Three practical consequences:

Replacing a bus switch with a buffer requires a direction signal that does not exist. On a bidirectional data bus, the board has no `DIR` net, and the buffer will drive against whichever side is trying to talk. Contention, not corruption.

Replacing a buffer with a bus switch removes drive. The original driver now sees the capacitance of both bus segments plus the switch. Edges slow down; setup times fail at speed; and a driver sized for one segment may not switch two.

Bus switches are chosen for zero added delay. In a memory or backplane path where the timing budget is already spent, a switch adds 0.25 ns and a buffer adds 5 ns. That is often the entire reason the design used one, so a substitution to a buffer can fail timing that nothing else in the change touches.

`CBT3861PW,118` and `SN74CBT3125DBQR` are active in our catalogue; `SN74CBTR16861DGVR` is obsolete. Note the `R` in `CBTR` — that family variant includes series damping resistors in the switch path, which changes the RC and is deliberate, not an accident of process.

## The CBTD diode: level translation you may not know you have

The `D` variants of the `CBT` family put a diode in series with the switch, so a 5 V input arrives on the other side about one diode drop lower — roughly 3.3 to 4 V, which is safe for a 3.3 V input with 5 V-tolerant clamping.

This makes `CBTD` parts a cheap 5 V-to-3.3 V translator for bus signals, with no supply, no direction pin and no added delay. It also makes them a trap:

- **Replace `SN74CBTD3861DWR` with `SN74CBT3861` and the diode is gone.** The full 5 V now appears on the 3.3 V side. Whether that destroys anything depends on the receiver's tolerance, but it is out of specification either way.
- **The translation is one-directional in effect.** The diode drops signals travelling from the 5 V side; travelling the other way, a 3.3 V signal loses a diode drop too, which may fall below the 5 V device's input threshold.
- **`SN74CBTD3861DWR` is obsolete** in our catalogue while the non-diode `CBT3861PW,118` is active: the exact pairing that invites this mistake.

If a board mixes 5 V and 3.3 V logic through a bus switch, establish whether the translation lives in the part number before substituting. Where it does and the part is gone, the alternatives are a proper translator (see [level shifter selection](/blog/level-shifter-selection-guide)) or an external series diode network, which brings its own leakage and threshold shifts.

## Decoders: enables, latches and glitches

The `138` family has three enables and they are not all the same polarity, which is a common wiring error after substitution: two active-low and one active-high on the classic part. A candidate with different enable polarity fits the footprint and never selects anything.

| Function | Device | Notable property |
| --- | --- | --- |
| `138` | 3-to-8 decoder | Three enables, mixed polarity |
| `139` | Dual 2-to-4 decoder | Two independent halves |
| `137` | 3-to-8 decoder **with address latch** | Latch on the address inputs |
| `154` | 4-to-16 decoder | 24-pin |
| `4514` / `4515` | 4-to-16 with latch (4000 series) | High supply range |

The `137` is the one that catches people. It is a `138` with a transparent latch on the address inputs, used where the address is only valid for part of a cycle — exactly the multiplexed-bus situation described in [flip-flops, latches and registers](/blog/flip-flop-latch-register-sourcing-guide). Fitting a `138` in its place means the decoder follows the address continuously, so it selects spurious devices while the address is changing. `74HC137DB,112` is last-time buy in our catalogue.

Decoder glitches are real and usually benign. When several address bits change at once, internal path delays mean the decoder briefly asserts outputs corresponding to intermediate address states. On a chip-select line into an SRAM this normally does nothing, because the memory needs the select asserted for a minimum time. On a **write-enable or strobe** line it can produce an extra write to the wrong address. If the original design gated the decoder with an enable timed to avoid this, the substitution must preserve that enable's polarity and delay.

## Decoder delay in the memory access budget

A decoder sits in series with the address path, so its propagation delay is subtracted from the memory access time available.

Worked, for a 70 ns SRAM in a 100 ns processor cycle with 10 ns of address setup and 8 ns of data setup at the processor:

```
cycle budget                       100 ns
address setup on the board          10 ns
decoder propagation delay            ? 
SRAM access time                    70 ns
data setup at the processor           8 ns
--------------------------------------------
available for the decoder = 100 − 10 − 70 − 8 = 12 ns
```

| Decoder family | Typical tPD at 5 V | Fits the 12 ns budget? |
| --- | ---: | --- |
| `74AHC138` | ~6 ns | Yes, with margin |
| `74HC138` | ~20 ns | **No** |
| `74LS138` | ~12 ns | Marginal |
| `CD4514` | ~150 ns | No |

This is why a legacy board may use `LS` or `F` parts in the address path and `HC` everywhere else, and why "upgrading" a decoder to a 4000-series part with a better supply range breaks the memory interface. Our catalogue holds only 10 `SN74LS138` variants (1 inactive) and 31 `SN74HC138` (4 inactive), so the live options here are narrow; `74VHC138FT` is active, `74LCX138MTC` and `74VHC138N` are obsolete.

## Multiplexers: three-state, inversion and channel count

The mux function numbers encode output structure and polarity, and the differences are one bit wide but total:

| Function | Device |
| --- | --- |
| `151` | 8-to-1 mux, complementary outputs |
| `251` | 8-to-1 mux, **three-state** output |
| `153` | Dual 4-to-1 mux |
| `157` | Quad 2-to-1 mux, non-inverting |
| `158` | Quad 2-to-1 mux, **inverting** |
| `257` | Quad 2-to-1 mux, three-state |

`157` for `158` inverts every bit. `SN74AHC157PWRG4` is obsolete in our catalogue, `74LVC257ADB,112` is active, and `NC7SV158L6X` (the single-gate inverting version) is obsolete. When a `158` is unavailable, the honest answer is often a `157` plus an inverter, which changes the delay budget and adds a package; alternatively check whether the downstream logic can absorb the inversion.

Single-gate decoders and muxes exist too. `SN74LVC1G19DCK3` is a 1-of-2 decoder in a tiny package and is active — useful for rebuilding a small piece of a dead larger part, as described in [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide).

## Hot-swap and live-insertion switches

Bus switches designed for live insertion are a separate product class, and the specifications that matter are the ones general-purpose logic omits:

- **Power-up three-state**, so the switch is open while its supply ramps.
- **I_off**, so a powered-down card does not load or back-power the live bus through its protection diodes.
- **Precharge resistors** on some families, which bias the disconnected bus pins to a mid-level so that inserting a card produces a smaller charge transient on the live bus.

`QS32XVH245Q2G` in our catalogue is this class of part and is **last-time buy**, as is `74FST6800QG8`. Both come through Renesas, which inherited the Quality Semiconductor, IDT and Pericom switch portfolios and is pruning them.

Substituting a plain bus switch into a hot-swap socket removes protections that only fail during insertion: the least reproducible test condition there is. If the module is field-replaceable, treat these three specifications as mandatory.

## Sourcing notes

35% of the category is inactive. Rochester Electronics is the largest source at 3,324 part numbers, then Texas Instruments (2,167), onsemi (888), Diodes Incorporated (326) and Nexperia (325).

Family rates from our logic census:

| Family | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| `74CBTLV` | 267 | 47 | 18% |
| `74CBT` | 763 | 212 | 28% |
| `74FST` | 85 | 43 | 51% |
| `74LCX` | 479 | 284 | 59% |
| `PI3` (Pericom prefix) | 184 | 107 | 58% |

The Pericom `PI3` line at 58% inactive is the one to check first if your BOM uses it — Pericom went to Diodes Incorporated, and the overlapping switch ranges were rationalised. `SN74CBT` at 28% remains the healthiest bus-switch family we hold.

The Renesas last-time-buy list in this category is long: `74CBTLV3862QG8`, `74FST6800QG8`, `QS32XVH245Q2G`, plus telecom-lineage parts such as `72V8981JG8` and `728985JG`. **A single scrub of Renesas-branded switch and interface logic will catch most of the exposure** — see [BOM scrubbing](/blog/bom-scrubbing-lifecycle-risk-analysis).

For incoming inspection: **measure the on-resistance of a bus switch**, because it is the one parameter a remarked part will not match, and confirm the presence or absence of the series diode by comparing input and output levels with a DC input. For decoders and muxes, walk the full address or select range rather than spot-checking one channel.

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Bus switch vs buffer | Missing direction control, or missing drive |
| 2 | Series diode (`CBTD`) present or absent | 5 V on a 3.3 V input, or lost threshold margin |
| 3 | Series damping resistors (`CBTR`) | Edge and reflection behaviour changes |
| 4 | On-resistance against total bus capacitance | Slow edges, failed setup times |
| 5 | Address latch present (`137` vs `138`) | Spurious selects during address transitions |
| 6 | Enable count and polarity | Never selects, or always selects |
| 7 | Decoder propagation delay in the access budget | Memory timing violated |
| 8 | Inverting vs non-inverting (`157` vs `158`) | Every bit inverted |
| 9 | Three-state output present (`151` vs `251`) | Bus contention |
| 10 | Power-up three-state and I_off for live insertion | Bus corruption on insertion |
| 11 | Precharge behaviour on hot-swap parts | Large transient on the live bus |
| 12 | Width (`3245` vs `16245`) | Wrong package |

## FAQ

### What is the difference between a bus switch and a bus buffer?

A bus buffer receives a signal and regenerates it with its own drive strength and a direction control pin, adding several nanoseconds of real propagation delay. A bus switch is a bidirectional pair of FETs with a few ohms of on-resistance: it connects two nets, needs no direction pin, adds essentially no delay, and provides no drive at all. Because the switch does not buffer, the original driver must charge the capacitance of both bus segments. Substituting one for the other changes the bus electrically, not just its timing.

### What does the D mean in SN74CBTD3861?

A diode in series with each switch path, which drops a 5 V input to roughly 3.3 to 4 V on the other side. It turns the bus switch into a passive 5 V-to-3.3 V translator with no supply, no direction control and no added delay. Substituting a plain `CBT` part removes the diode and puts the full 5 V onto the 3.3 V side. Note that the drop applies in both directions, so a 3.3 V signal travelling toward the 5 V side also loses a diode drop and may fall below that device's input threshold.

### Why does my decoder briefly select the wrong output?

Because internal path delays differ between address bits. When several address inputs change at once, the decoder passes through intermediate states and briefly asserts the outputs corresponding to them. On a chip-select line this is normally harmless, since the memory requires the select to be asserted for a minimum period. On a write-enable or strobe line it can cause a spurious write to the wrong address, which is why such designs gate the decoder with an enable timed to avoid the transition window: a detail any substitution must preserve.

### Can I replace a 74HC137 with a 74HC138?

Not if the board relies on the latch. The `137` is a 3-to-8 decoder with a transparent latch on its address inputs, used where the address is valid only during part of a cycle, as on a multiplexed processor bus. A `138` decodes continuously, so during address transitions it will select devices that were never addressed. If the `137` is unavailable, the equivalent function is a `373`-class latch feeding a `138`, which costs a package and some delay.

### How much delay can a decoder add before memory timing fails?

Work it from the cycle. In a 100 ns cycle with 10 ns of address setup, a 70 ns SRAM and 8 ns of data setup at the processor, only 12 ns remains for the decoder. A `74AHC138` at around 6 ns fits comfortably, a `74LS138` at about 12 ns is marginal, a `74HC138` at roughly 20 ns does not fit, and a 4000-series `4514` at over 100 ns is out of the question. This is why legacy boards often mix a fast family in the address path with slower logic elsewhere.

### Are 157 and 158 multiplexers interchangeable?

No: the `158` inverts its outputs and the `157` does not. Everything else about them matches, which is what makes the substitution tempting and the result confusing: every bit through the mux comes out complemented. If only the `157` is available, the options are adding an inverter stage, which costs a package and some delay, or checking whether the receiving logic can absorb the inversion, for example by rewriting a lookup table or reassigning polarity in a CPLD.

### What makes a bus switch suitable for hot swap?

Three specifications. Power-up three-state keeps the switch open while its own supply ramps, so it cannot connect two buses before the card is ready. I_off guarantees that no current flows through the I/O pins when the device's supply is off, which prevents a powered-down card from loading or back-powering the live bus through its protection diodes. Some families add precharge resistors that bias the disconnected pins to a mid-level, reducing the charge transient when the card is inserted. General-purpose switches provide none of these.

### Which switch and decoder families are being discontinued?

The Renesas-owned lines. In our catalogue `74CBTLV3862QG8`, `74FST6800QG8` and the hot-swap `QS32XVH245Q2G` are all last-time buy, along with telecom-lineage parts such as `72V8981JG8`. `74FST` runs 51% inactive as a family and the Pericom `PI3` prefix 58%, following the Pericom-to-Diodes transition. The healthiest bus-switch family we hold is `SN74CBT` at 28% inactive, with `74CBTLV` at 18% — though several individual `CBTLV` part numbers are the ones going last-time buy.

## Related reading

[Decoding a 74-series part number](/blog/74-series-logic-decode-guide) for the family census, [logic family selection](/blog/logic-family-selection-guide) for the framework. Siblings: [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide), [flip-flops, latches and registers](/blog/flip-flop-latch-register-sourcing-guide), [counters, dividers and shift registers](/blog/counter-shift-register-sourcing-guide).

Crossing domains: [level shifter selection](/blog/level-shifter-selection-guide) when the translation must be active, [analog switch and multiplexer selection](/blog/analog-switch-mux-sourcing-guide) for the analogue equivalents of these parts (the specifications are entirely different) and [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide) when the bus leaves the board.

Send us the part number with the two supply voltages on either side of the switch, and we will tell you whether your original part was doing level translation you did not know about.

[**Submit an RFQ**](/rfq) | [**Browse switches, MUX and decoders**](/category/signal-switches-mux-decoders) | [**Upload a BOM**](/bom)
