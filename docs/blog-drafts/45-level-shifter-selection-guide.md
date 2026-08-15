---
title: "Level Shifter Selection: Why the Auto-Direction Part Broke Your I²C Bus"
slug: "level-shifter-selection-guide"
status: "draft"
seoTitle: "Level Shifter Selection Guide: Direction, I2C and Drive"
seoDesc: "Level translators fail in specific, repeatable ways. Direction-controlled vs auto-sensing vs open-drain, why TXB parts break I2C, drive strength, and choosing for your bus."
seoKeywords: "level shifter, level translator, TXB0104, TXS0104, LSF0102, I2C level shifter, voltage translator selection, auto direction level shifter, open drain translator"
tags: "level shifter, translator, I2C, logic, interface, sourcing, obsolescence"
author: "FPGACenter Sourcing Team"
readingTime: 15
category: "Interface & Logic Sourcing"
relatedProducts: "SN74LVC2T45QDCURQ1, SN74AVC2T45DCURE4, SN74AVC2T45DCURG4, SN65ELT23DR, TXB0106PWR, TXU0304QPWRQ1, SN74LVC16T245DLR, SN65ELT21DGK"
---

# Level Shifter Selection: Why the Auto-Direction Part Broke Your I²C Bus

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~15 minutes
> **Topics**: level translators, direction control, I²C, open-drain, drive strength

---

**Level shifters cause more head-scratching per square millimetre than any other component on a board.** They look trivial (two supplies, some channels, translate between them) and they fail in ways that look like bus faults, firmware bugs or noise problems. The single most common failure is putting an auto-direction push-pull translator on an open-drain bus like I²C, where it either locks up or works unreliably at certain speeds. Level shifters are also disproportionately obsolete: 42% of the 2,476 parts in this category are discontinued. This guide covers the three architectures, which one your bus needs, and what to check when substituting.

## Key takeaways

- **Three architectures, and they are not interchangeable**: direction-controlled, auto-sensing push-pull, and open-drain/pass-FET.
- **I²C needs an open-drain-compatible translator.** A push-pull auto-direction part on I²C is the classic failure.
- **Auto-direction parts have a minimum edge-rate requirement** — they need a real transition to detect, so slow or heavily loaded signals confuse them.
- **Drive strength matters.** Auto-direction devices use a weak one-shot then a weak hold, so they cannot drive significant capacitance.
- **42% of level shifters are discontinued**: a high rate for a category still widely designed in.
- **Direction-controlled parts are the safest substitution** where a direction signal exists.

---

## The three architectures

Choosing the wrong architecture is the root of nearly every level-shifter problem.

| Architecture | Example family | Direction | Drive | Suits |
| --- | --- | --- | --- | --- |
| **Direction-controlled** | LVC2T45, AVC2T45 | Explicit DIR pin | Full push-pull | SPI, UART, any bus with a known direction |
| **Auto-sensing push-pull** | TXB series | Detected from edges | Weak one-shot + hold | Push-pull signals only, light loads |
| **Open-drain / pass-FET** | TXS series, LSF series, PCA96xx | Bidirectional inherently | Passive or assisted pull-up | **I²C, SMBus, 1-Wire, any open-drain bus** |

### Direction-controlled

The most predictable and the best default when a direction signal is available. A DIR pin selects which side drives; outputs are full push-pull with proper drive strength. Parts such as `SN74LVC2T45QDCURQ1` and `74AVCH2T45GF` are the mainstream devices.

The requirement is that something must drive DIR correctly. For SPI this is trivial — MOSI and SCK are always one direction, MISO always the other, so DIR is tied. For a bidirectional bus without a direction signal, you need something else.

### Auto-sensing push-pull

Convenient and frequently misapplied. These parts detect an edge on either side and briefly drive hard in that direction, then fall back to a weak hold. That "one-shot" behaviour is what lets them work bidirectionally without a direction pin.

The consequences:

- **They can only drive light loads.** The weak hold cannot pull a capacitive line, so total load capacitance is limited, often to around 70 pF.
- **They need a real edge to detect.** A slowly rising signal, or one heavily loaded, may not trigger the one-shot cleanly.
- **They fight external drivers.** Because the part actively drives both sides, an external open-drain device pulling low is opposed by the translator's weak high, which is exactly the I²C problem.

### Open-drain / pass-FET

The architecture I²C requires. These devices either use a single pass FET per channel with pull-ups on both sides, or actively assist the falling edge while remaining open-drain in nature.

Because they never drive high, they cannot fight an open-drain device pulling the line low. Pull-up resistors on each side set the logic high, and the translator passes the low through.

## The I²C failure, specifically

Putting a TXB-class auto-direction push-pull translator on I²C is the most common level-shifter mistake, and its symptoms are misleading.

What happens:

1. An I²C device pulls SDA low.
2. The translator's one-shot sees the falling edge and drives the other side low — correct so far.
3. The device releases SDA, expecting the pull-up to bring it high.
4. But the translator is now weakly holding low on that side, and the pull-up must overcome it, or the translator's own one-shot may misfire.
5. On clock stretching, where a slave holds SCL low for an extended period, the interaction gets worse.

Symptoms reported: bus lockups, ACK failures, behaviour that depends on bus speed, and faults that appear only when a particular device is on the bus. **These read as protocol or firmware problems, which is why the diagnosis takes so long.**

The fix is architectural, not parametric: an open-drain-compatible translator, or discrete MOSFET translation, which for two signals is cheap and completely predictable.

## Choosing by bus type

| Bus | Architecture needed | Notes |
| --- | --- | --- |
| **I²C, SMBus, PMBus** | Open-drain / pass-FET | Never a push-pull auto-direction part |
| **1-Wire** | Open-drain | Same reasoning |
| **SPI** | Direction-controlled | DIR can be tied per signal |
| **UART** | Direction-controlled | One channel each way |
| **Push-pull GPIO, light load** | Auto-sensing acceptable | Watch total capacitance |
| **Clock or high-speed** | Direction-controlled, adequate bandwidth | Check propagation delay and skew |
| **Open-drain interrupt / reset** | Open-drain | Push-pull would fight a wired-OR net |

That last row catches people. **Reset and interrupt lines are frequently wired-OR with multiple open-drain drivers**, exactly as described in [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide). A push-pull translator on such a net creates contention.

## What else to check

Supply range and sequencing. Translators have two supplies (VCCA, VCCB) and often a required relationship — some specify that one must not exceed the other, or that both must be present before signals are applied. Getting this wrong can forward-bias internal structures.

Output enable behaviour. Most parts have an OE pin, and the state during power-up matters. If OE floats, outputs may be enabled during sequencing.

Propagation delay and skew. For a clocked bus, delay through the translator eats setup and hold margin, and channel-to-channel skew matters for parallel buses.

Maximum data rate, which for auto-direction parts is substantially lower than for direction-controlled ones.

Channel count and pinout. 1, 2, 4 and 8 channel parts exist; pinouts are not consistent across vendors even at the same channel count.

Partial power-down (Ioff). Whether the part tolerates one side being powered while the other is not — important where the translator crosses a domain that can be shut down independently.

## Substituting a level shifter

| # | Item | Failure if wrong |
| --- | --- | --- |
| 1 | **Architecture matches the bus type** | I²C lockups, contention on wired-OR nets |
| 2 | Direction control availability and polarity | Wrong-way translation |
| 3 | Drive strength vs load capacitance | Weak edges, marginal timing |
| 4 | Supply range and required VCCA/VCCB relationship | Damage or unreliable operation |
| 5 | OE polarity and power-up state | Contention during sequencing |
| 6 | Propagation delay and skew | Setup/hold violations |
| 7 | Maximum data rate | Link too slow |
| 8 | Partial power-down tolerance | Leakage into an unpowered domain |
| 9 | Channel count and pinout verified | Does not fit |

Item 1 dominates. Get the architecture right and most of the rest is routine; get it wrong and no amount of parametric matching helps.

## Sourcing notes

42% of the 2,476 parts in Translators & Level Shifters are discontinued: a high rate for a category still actively designed in. The explanation is churn rather than decline: vendors introduce improved families and retire older ones quickly, so a part specified five years ago may already be superseded while its function is entirely current.

Current parts include `SN74LVC2T45QDCURQ1` and `74AVCH2T45GF,115`; `SN74AVC2T45DCURE4` illustrates how quickly variants within a family go. `SN65ELT23DR` and `SN65ELT21DGK` serve the ECL-to-LVTTL translation niche, which is a different and much more specialised job.

Because the function is generic and the architectures are well defined, **substitution here is usually easier than in most categories once the architecture is right** — there are many candidates. Check authorised aftermarket for older parts, per [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor).

## FAQ

### Why does my I²C bus stop working after adding a level shifter?

Almost certainly because the translator is an auto-direction push-pull type rather than an open-drain-compatible one. I²C devices communicate by pulling the line low and releasing it for a pull-up resistor to bring high. A push-pull translator actively drives both directions, so it fights devices on the bus and its edge-detection one-shot misfires — producing lockups, ACK failures and behaviour that varies with bus speed. The fix is an open-drain or pass-FET translator, or discrete MOSFET translation.

### What is the difference between TXB and TXS type level shifters?

They represent the two auto-direction approaches. TXB-class devices are push-pull with edge detection: they briefly drive hard in the detected direction, then hold weakly. They suit push-pull signals with light loading and are unsuitable for open-drain buses. TXS-class devices are designed for open-drain operation, assisting the falling edge while never driving high, so they work with I²C and similar buses where devices communicate by pulling low.

### When should I use a direction-controlled level shifter?

Whenever a direction signal exists or can be inferred, which covers most cases. Direction-controlled translators provide full push-pull drive in the selected direction and behave predictably, so they handle capacitive loads and higher data rates that auto-direction parts cannot. For SPI the direction is fixed per signal, so the DIR pin can simply be tied; for UART, one channel goes each way. They are the safest default.

### Why can't auto-direction level shifters drive much capacitance?

Because of how the edge detection works. The device drives hard only for a brief one-shot period after detecting a transition, then falls back to a weak hold to allow the other side to take control. That weak hold cannot charge or discharge significant capacitance, so total load is typically limited to around 70 pF. Exceeding it produces slow edges and, on a bidirectional line, can prevent the one-shot from triggering cleanly on the next transition.

### Can I use a level shifter on a reset or interrupt line?

Only an open-drain-compatible one. Reset and interrupt nets are frequently wired-OR with several open-drain drivers plus a single pull-up, exactly like an I²C bus. A push-pull translator on such a net actively drives high and contends with any device pulling low, which can create damaging current and unpredictable behaviour. Check whether the net has multiple drivers before selecting the architecture.

### What supply sequencing do level shifters require?

It varies and must be checked. Translators have two supplies, VCCA and VCCB, and some specify a required relationship — for example that one must not exceed the other by more than a stated margin, or that both must be present before signals are applied to either side. Violating the requirement can forward-bias internal protection structures. Also check whether the part tolerates partial power-down, where one side is powered and the other is not.

### Why are so many level shifters discontinued?

Because the category churns rather than declines. Vendors introduce improved families with better drive, lower voltage operation or wider supply range, and retire older parts relatively quickly, so 42% of the level-shifter part numbers we cover are discontinued even though the function is entirely current. The practical consequence is that a part specified a few years ago may already be superseded, but replacements are usually plentiful once the correct architecture is identified.

### Is discrete MOSFET level translation still a valid approach?

Yes, and for a small number of open-drain signals it is often the best answer. A single N-channel MOSFET with pull-ups on both sides translates a bidirectional open-drain line predictably, costs very little, and has no obsolescence risk of its own. It is the classic I²C translation circuit and remains appropriate where channel count is low and the bus speed is moderate.

## Related reading

The cross-cutting framework for interface parts is in [interface and transceiver sourcing](/blog/interface-transceiver-sourcing-guide). For choosing the logic family behind the translator, [logic family selection](/blog/logic-family-selection-guide). Where the net in question is a reset or supervisor output, [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide) explains the wired-OR arrangement that makes architecture choice critical.

Send us the part number with your bus type, load capacitance and supply voltages and we will come back with candidates of the right architecture.

[**Submit an RFQ**](/rfq) | [**Browse translators & level shifters**](/category/translators-level-shifters) | [**Upload a BOM**](/bom)
