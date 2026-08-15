---
title: "Counters, Dividers and Shift Registers: Ripple Carry, Sync Clear and the Missing Output Latch"
slug: "counter-shift-register-sourcing-guide"
status: "draft"
seoTitle: "Counter and Shift Register Sourcing: 161 vs 163, 595 vs 164, CD4060"
seoDesc: "5,235 counter and shift-register parts at 32% inactive. Ripple versus synchronous counters, asynchronous versus synchronous clear, why a 164 cannot replace a 595, and the 594/597 last-time buy."
seoKeywords: "74HC595 replacement, 74HC164 vs 595, 74HC161 vs 163 clear, CD4060 oscillator divider, ripple counter glitch, 74HC594 last time buy, shift register sourcing, CD4024 obsolete"
tags: "counters, dividers, shift registers, 595, ripple carry, synchronous clear, CD4060, sourcing"
author: "FPGACenter Sourcing Team"
readingTime: 16
category: "Interface & Logic Sourcing"
relatedProducts: "74HC4060BQ115, MC74HC4040ADR2G, CD40193BE, CD4024BHSR, SN74LS164DR, SN74LV165APWR, MC74VHC594DTR2G, MM74HC589N"
---

# Counters, Dividers and Shift Registers: Ripple Carry, Sync Clear and the Missing Output Latch

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~16 minutes
> **Topics**: ripple vs synchronous counters, clear behaviour, output latches, cascading, drive limits

---

**Three pairs of parts in this category look interchangeable and are not: the `161` and the `163`, the `164` and the `595`, and any ripple counter against any synchronous one.** Each pair shares a pin count, a function description and often a footprint. The `161` clears asynchronously and the `163` clears on a clock edge. The `595` has an output register and the `164` does not, so a `164` shows every intermediate shift state on its pins. And a ripple counter's outputs change at different times, which turns any attempt to decode them into a glitch generator. Our [counters and dividers](/category/counters-dividers) and [shift registers](/category/shift-registers) categories hold 5,235 part numbers between them, **1,675 no longer active (32%)**, and the current last-time-buy list is concentrated in exactly the parts with the useful extra features.

## Key takeaways

- **`161` clears asynchronously, `163` clears synchronously.** Same pinout, different reset semantics.
- **Ripple counters do not change their outputs simultaneously.** Decoding across bits produces glitches as wide as the accumulated stage delay.
- **`CD4060` is a 14-stage divider with an oscillator inverter built in.** No `74HC` part replaces it; the closest is a divider plus an external oscillator.
- **The `595` has an output storage register and the `164` does not** — substituting the `164` makes every shift visible on the outputs.
- **`594`, `597` and `4094` are the value-added variants**, and they are the ones going last-time-buy: `74HC594DB,112`, `74HCT597DB,118`, `74HCT4094DB,118`, `MC74VHC594DTR2G`.
- **Package total current, not per-pin current, limits LED driving.** Eight outputs at 20 mA exceeds a `74HC595`'s ground-pin rating.
- **Cascade length does not limit shift clock frequency**: the serial path between two adjacent devices does.

---

## Ripple versus synchronous counters

In a ripple (asynchronous) counter each stage clocks the next, so the outputs settle in sequence. In a synchronous counter every flip-flop shares the clock, so all outputs change together. The distinction is invisible in the part description and decisive in use.

| | Ripple / asynchronous | Synchronous |
| --- | --- | --- |
| Clocking | Stage n clocks stage n+1 | All stages on one clock |
| Output skew | **Accumulates per stage** | Essentially none |
| Max frequency | Limited by first stage only | Limited by whole chain |
| Safe to decode? | **No** — glitches during transitions | Yes |
| Typical parts | `CD4020`, `CD4040`, `CD4060`, `CD4024`, `74HC4040` | `74HC161`, `74HC163`, `74HC191`, `74HC193`, `CD40193` |

Worked, for a 12-stage `74HC4040`-class ripple counter at 5 V with roughly 20 ns of delay per stage:

```
skew between Q1 and Q12 ≈ 11 stages × 20 ns = 220 ns
```

For 220 ns after each relevant clock edge, the output word is **not a valid count**; it is a mixture of the old and new values, passing through intermediate states. Feed that into a decoder and it will briefly assert outputs for addresses that never existed, which is the same mechanism described in [decoders, multiplexers and bus switches](/blog/decoder-mux-bus-switch-sourcing-guide).

Where a ripple counter is used as a simple frequency divider (take one output, ignore the rest) none of this matters, which is why they are still everywhere. The substitution risk runs one way: replacing a synchronous counter with a ripple counter in a decoded application introduces glitches that were never there. Replacing a ripple counter with a synchronous one is usually safe but changes the maximum frequency and requires the clock to reach every stage.

## The 161 and the 163

These two differ in one respect. It is the reset.

- **`161`: asynchronous clear.** Pull the clear pin low and the outputs go to zero immediately, regardless of the clock.
- **`163`: synchronous clear.** Pull the clear pin low and the outputs go to zero **on the next clock edge**.

In a design where the clear comes from a comparator, a decoder output or a state machine that asserts it for less than a clock period, the `163` may never see the clear at all. In a design that uses the clear to hold the counter at zero during reset (with no clock running) the `163` will not clear, because there is no edge.

We hold 13 `SN74HC161` variants (2 inactive) and 19 `SN74HC163` (5 inactive), plus `CD74AC163E` which is obsolete. **The pinouts match, so this substitution passes every mechanical check and fails on timing that depends on the source of the clear signal.**

The same distinction appears in the `190`/`191`/`192`/`193` up-down counter group, where load and clear behaviour vary by number, and in `CD40193BE` (active in our catalogue) versus its 74-series equivalents. **Read the clear and load rows of the function table, not the summary line.**

## CD4060: a divider with an oscillator inside

The `CD4060` is a 14-stage ripple counter plus the inverter and buffer needed to build an RC or crystal oscillator on-chip. That combination has no equivalent in the 74HC range, which is why the part is still in production forty years on — `74HC4060BQ,115` and `74HC4060BQ115` are both active in our catalogue.

Two sourcing consequences:

Replacing a `4060` requires two parts: a divider (`4040`, `4020`, `74HC4040`) plus an oscillator. And the oscillator has to be built from an **unbuffered** inverter, for the reasons set out in [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide); a buffered gate in that socket may not start or may run on an overtone.

The `4060`'s RC oscillator timing depends on the part's own thresholds, so even a like-for-like substitution between vendors can shift the frequency by a few percent. In a long-interval timer (the classic `4060` application) that is often acceptable; in anything that gates a measurement, it is not.

Related: `CD4024BHSR`, `CD4024BKMSR` and `CD4024BDMSR` (the 7-stage ripple counter) are all **last-time buy** in our catalogue, all Renesas. `CD40103BPWR` (presettable down counter) is obsolete.

## Shift registers: the output register is the point

The `595` and the `164` are both eight-bit serial-in, parallel-out shift registers. The `595` has a second register between the shift stages and the output pins; the `164` does not.

| | `164` | `595` | `594` | `597` | `4094` |
| --- | --- | --- | --- | --- | --- |
| Output storage register | **No** | Yes | Yes | Input-side storage | Yes |
| Separate output clock | No | Yes (`RCLK`) | Yes | Yes | Strobe |
| Three-state outputs | No | Yes (`OE`) | Yes | — | Yes |
| Separate shift-register reset | Reset clears all | Reset clears shift register | **Independent resets** | — | — |
| Direction | SIPO | SIPO | SIPO | **PISO** | SIPO |

Substituting a `164` for a `595` means every intermediate state appears on the outputs while the data shifts in. In practice:

- Driving **LEDs**, the display flickers or shows a running pattern during each update.
- Driving **relays or solenoids**, every device chatters through the shift.
- Driving **address or control lines**, downstream logic sees eight wrong values before the right one.

The fix is not firmware; the output register is hardware. `SN74LS164DR` and `74HCT164PW,112` are active in our catalogue, so the `164` is easy to obtain, which is exactly why it gets offered as an alternate for a `595`.

The `594` matters when the design resets the outputs independently of the shift register, and the `597` is the parallel-in, serial-out direction with input storage — used to sample many inputs simultaneously and read them back serially. Both are being wound down: `74HC594DB,112`, `74HCT594DB,112`, `74HCT597DB,118`, `74HCT4094DB,118` and `MC74VHC594DTR2G` are all last-time buy in our catalogue. **If a design depends on independent reset or on simultaneous input capture, those features are the substitution constraint**, and the quantity decision method is in [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage).

## Drive limits: the specification that burns 595s

A shift register's per-pin current rating is not the limit. The package's total supply and ground current is.

For a typical `74HC595`:

```
per-output continuous rating      ±6 mA
total V_CC / GND current rating   ±70 mA (package limit)

8 LEDs at 20 mA each            = 160 mA  → exceeds both
8 LEDs at 6 mA each             = 48 mA   → within the package limit
```

Eight LEDs at 20 mA cannot be driven from a `74HC595`, even though nothing in a superficial reading forbids 20 mA on one pin briefly. The correct parts are open-drain power shift registers (the `TPIC6x595` class), a separate driver such as a Darlington or MOSFET array, or current limiting that keeps the total within the package rating.

This matters for sourcing because **a "compatible" replacement with a lower total current rating will fail thermally in a circuit that was already at the edge**. Check the absolute maximum table, not just the logic specifications.

## Cascading and maximum clock frequency

Chain length does not limit the shift clock. The serial path between two adjacent devices does.

Each device in a chain has its own clock input, so the clock fans out in parallel rather than in series. The constraint is that the serial output of device n must be valid at the serial input of device n+1 before the next clock edge:

```
tPD(serial out) + tSU(serial in) < clock period

25 ns + 15 ns = 40 ns  → maximum 25 MHz, whether the chain is 2 or 20 devices long
```

What *does* degrade with chain length is the **clock and latch distribution**: twenty clock inputs plus track capacitance is a real load, and the edge rate at the far end may no longer be clean. That is a drive and layout question — see [decoding a 74-series part number](/blog/74-series-logic-decode-guide) for the family drive figures.

A slower family raises tPD and tSU together, so replacing `AHC` parts with `HC` in a long chain reduces the maximum shift rate. If the firmware clocks at a fixed rate with no margin check, this shows as occasional corrupted frames.

## Sourcing notes

Rochester Electronics dominates both categories (1,410 of 2,977 counter parts and 1,011 of 2,258 shift-register parts) followed by Texas Instruments, onsemi and Nexperia. That is the signature of a mature category kept alive by authorised aftermarket production, and it means the original die is generally obtainable.

Status rates measured 2026-08-04:

| Category | Parts | Not active | Rate |
| --- | ---: | ---: | ---: |
| Counters & Dividers | 2,977 | 1,009 | 34% |
| Shift Registers | 2,258 | 666 | 29% |
| Specialty Logic | 1,593 | 952 | **60%** |

Three things worth acting on:

The last-time-buy cluster is at Nexperia and Renesas. It is concentrated in the feature-rich variants: `74HC594DB,112`, `74HCT594DB,112`, `74HCT597DB,118`, `74HCT4094DB,118` (Nexperia), `MC74VHC594DTR2G` (onsemi), and `CD4024B` in three package variants (Renesas). Plain `595` and `164` parts remain widely available.

ECL dividers are quietly disappearing. `MC10EL32DTG` and `MC10EL33DTG` (divide-by-2 and divide-by-4 ECL prescalers) are obsolete in our catalogue, as is `MC100E137FNR2`. These sit in clock-distribution and instrumentation designs where nothing at the same jitter performance exists in CMOS; the alternatives are covered in [clock generators and PLLs](/blog/clock-generator-pll-sourcing).

Specialty logic at 60% inactive is the worst rate in the logic families, and it holds the parts with no second source at all: DDR memory-module registers (`SSTVF16857AGT` obsolete, `74SSTUBF32866BBFG8` last-time buy) and ECL clock receivers (`MC100EP16` family, most variants obsolete). If a design uses any of these, treat them as single-source, single-lifetime parts.

For incoming inspection, **clock the device through a full pattern and watch the outputs during the shift**, not just after it. That single test distinguishes a `595` from a `164`, a `161` from a `163` (assert clear with the clock stopped), and a synchronous counter from a ripple one (look for output skew on a fast scope).

## Substitution checklist

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | Ripple vs synchronous counter | Glitches when outputs are decoded |
| 2 | Clear: asynchronous (`161`) vs synchronous (`163`) | Reset never takes effect |
| 3 | Load behaviour on up/down counters | Preset ignored |
| 4 | Integrated oscillator (`CD4060`) | Missing oscillator function |
| 5 | Output storage register (`595` vs `164`) | Intermediate states visible on outputs |
| 6 | Independent shift/output reset (`594`) | Reset clears the wrong stage |
| 7 | Direction — SIPO vs PISO (`595` vs `597`/`165`) | Data flows the wrong way |
| 8 | Three-state outputs present | Bus contention |
| 9 | Per-pin **and total package** current | Thermal failure |
| 10 | tPD + tSU against the shift clock | Corrupted frames at speed |
| 11 | Clock/latch drive across a long cascade | Edge degradation at the far end |
| 12 | RC oscillator threshold differences between vendors | Frequency shift |

## FAQ

### What is the difference between a 74HC161 and a 74HC163?

The clear input. The `161` clears asynchronously: the outputs go to zero as soon as the clear pin is asserted, with no clock required. The `163` clears synchronously, so the outputs only go to zero on the next clock edge. The pinouts are identical, which makes the substitution mechanically invisible. It fails in two common situations: when the clear pulse is shorter than a clock period, and when the clear is used to hold the counter at zero while the clock is stopped.

### Why should I not decode the outputs of a ripple counter?

Because they do not change at the same time. In a ripple counter each stage clocks the next, so the delay accumulates — roughly 220 ns from first to last output on a twelve-stage CMOS part at 5 V. During that window the output word passes through intermediate values that were never a valid count, and a decoder will briefly assert the outputs corresponding to them. As a plain frequency divider, where you take one output and ignore the rest, a ripple counter is perfectly fine.

### What can replace a CD4060?

Two parts. The `CD4060` is a 14-stage ripple counter with the inverter and buffer for an on-chip RC or crystal oscillator, and no single `74HC` device provides both. The usual replacement is a `4040`, `4020` or `74HC4040` divider plus a separate oscillator built from an unbuffered inverter such as a `74HCU04` or `SN74LVC1GU04`. Note that the `4060`'s RC frequency depends on the part's own switching thresholds, so even a same-function part from a different vendor can shift the frequency by a few percent.

### Can a 74HC164 replace a 74HC595?

Only if nothing looks at the outputs during the shift. The `595` has a second register between the shift stages and the output pins, updated by a separate clock, so the outputs change once when you choose. The `164` connects the shift stages straight to the pins, so all eight intermediate states appear on the outputs during every update — visible as flicker on LEDs, chatter on relays, or eight wrong values on control lines. The output register is hardware and cannot be worked around in firmware.

### How many LEDs can a 74HC595 drive?

Fewer than most schematics assume, because the limit is the package's total supply and ground current, typically 70 mA, not the per-pin rating of 6 mA. Eight LEDs at 20 mA each need 160 mA through the ground pin, which exceeds the absolute maximum. Eight LEDs at 6 mA totals 48 mA and is within the rating. For real LED brightness, use a power shift register with open-drain outputs, or add an external driver array, and check the total-current row of any replacement's absolute maximum table.

### Does a long shift-register chain limit the clock frequency?

Not directly. Each device has its own clock input, so the clocks are in parallel, and the timing constraint is between two adjacent devices: the serial output propagation delay plus the next device's serial input setup time must fit inside one clock period. With 25 ns and 15 ns that is 40 ns, or 25 MHz, whether the chain is two devices or twenty. What does degrade with length is clock and latch distribution — twenty inputs plus track capacitance is a genuine load, and the far end may see a slow, ringing edge.

### Which counter and shift-register parts are at end of life?

The feature-rich variants. In our catalogue `74HC594DB,112`, `74HCT594DB,112`, `74HCT597DB,118` and `74HCT4094DB,118` from Nexperia and `MC74VHC594DTR2G` from onsemi are last-time buy, as are `CD4024BHSR`, `CD4024BKMSR` and `CD4024BDMSR` from Renesas. ECL prescalers `MC10EL32DTG` and `MC10EL33DTG` are obsolete. Plain `595`, `164` and `165` devices remain widely available from multiple manufacturers.

### Why is "specialty logic" so heavily discontinued?

Because it holds the parts that only ever had one customer type. Our specialty logic category runs 60% inactive across 1,593 part numbers, and what remains is DDR memory-module registers such as `SSTVF16857AGT` and `74SSTUBF32866BBFG8`, ECL clock receivers of the `MC100EP16` family, and odd functions such as adders and rate multipliers. When the memory generation or the clock architecture they served went away, so did the demand, and there is no cross-vendor second source for most of them.

## Related reading

[Decoding a 74-series part number](/blog/74-series-logic-decode-guide) for the family census and drive figures, and [logic family selection](/blog/logic-family-selection-guide) for the framework. Siblings: [sourcing logic gates and inverters](/blog/gates-inverters-sourcing-guide) (particularly the unbuffered-inverter section if you are rebuilding a `4060`) [flip-flops, latches and registers](/blog/flip-flop-latch-register-sourcing-guide), and [decoders, multiplexers and bus switches](/blog/decoder-mux-bus-switch-sourcing-guide).

Adjacent: [clock generators and PLLs](/blog/clock-generator-pll-sourcing) where the divider is part of a timing product, [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) for the `594`/`597`/`4094` decision.

Send us the part number and tell us whether anything decodes the outputs or watches them during a shift — that determines which alternates are real.

[**Submit an RFQ**](/rfq) | [**Browse counters**](/category/counters-dividers) | [**Browse shift registers**](/category/shift-registers) | [**Upload a BOM**](/bom)
