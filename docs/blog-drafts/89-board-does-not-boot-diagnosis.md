---
title: "The Board Does Not Boot: A Systematic Diagnosis Across Power, Reset, Clock and Configuration"
slug: "board-does-not-boot-diagnosis"
status: "draft"
seoTitle: "Board Does Not Boot: Systematic Diagnosis With Discriminating Tests"
seoDesc: "One probe on the FPGA's status pin splits the problem space four ways. A discrimination procedure across power sequencing, reset timing, oscillator start-up and configuration memory."
seoKeywords: "FPGA does not configure, board does not boot diagnosis, DONE pin never asserts, INIT_B low, power sequencing fault, oscillator does not start, configuration CRC error, brownout reset loop"
tags: "diagnosis, troubleshooting, FPGA, power sequencing, configuration, hardware bring-up"
author: "FPGACenter Engineering Team"
readingTime: 18
category: "Hardware Design & Integration"
relatedProducts: "W25Q16JWZPIQ, IS25LP128-JKLE-TR, XC7A15T-3FTG256E, N25Q128A23BSF40G, M25P40-VMN6, XCF16PVO48C, EPCS16SI8N, 10M02SCU169A7G"
---

# The Board Does Not Boot: A Systematic Diagnosis Across Power, Reset, Clock and Configuration

> **Author**: FPGACenter Engineering Team
> **Reading time**: ~18 minutes
> **Topics**: partitioning the problem in one measurement, discriminating tests per cause, the tests that create the fault they look for, counterfeit and rework as candidate causes

---

**Nobody arrives at work knowing they have a configuration-flash problem. They arrive knowing the board does not boot.** Every article on this site is organised by component, which is useful once you know which component is at fault and useless before that. This one is organised by the observation, and its purpose is to get from "dead board" to "named cause" in a defined number of measurements rather than by substitution and hope.

The single most valuable thing in it is the first measurement, because **one probe on the FPGA's status pins partitions the entire problem space into four disjoint regions**, and each region has a different set of candidate causes. Teams routinely spend a day in the wrong region.

The procedure assumes an FPGA or SoC board with external configuration memory. It maps directly onto an MCU board with internal flash: the stages are the same, and the notes say where they differ.

## Key takeaways

- **Read the status pins first.** `INIT_B`/`nSTATUS` and `DONE`/`CONF_DONE` split the fault into never-started, started-and-failed, loaded-but-not-running, or intermittent. Everything else follows from which one you have.
- **A multimeter cannot clear a power rail.** It averages. A rail that oscillates, sags under load, or comes up in the wrong order reads correct on a meter and is the most common cause in this list.
- **Probing a crystal can start or stop it.** The probe's capacitance changes the load, so the test can create or mask the fault. Probe the buffered output instead.
- **Two of the most common configuration faults are not electrical**: a serial flash whose pin 7 defaults to `RESET#` rather than `HOLD#`, and one that powers up in 4-byte address mode when the FPGA issues 3-byte reads.
- **Read the device ID registers.** The flash's JEDEC ID and the FPGA's JTAG `IDCODE` are two cheap reads that detect a wrong, remarked or counterfeit part in seconds.
- **Symptoms that depend on temperature, supply ramp rate or board position are timing-margin or mechanical faults**, not logic faults, and they need a different class of test.
- **A repeated reset is a different fault from no reset**, and telling them apart takes one scope capture.

---

## Stage zero: partition the problem

Two pins, one scope capture, four possible answers. Trigger on the input supply rising and capture the supply, the reset or status pin, and the configuration-done pin together.

| What you see | The fault is in | Skip to |
| --- | --- | --- |
| `INIT_B`/`nSTATUS` never releases (stays low) | Power, reset or the device's own initialisation | Stage 1 and 2 |
| Status releases, `DONE`/`CONF_DONE` never asserts | The configuration data path: clock, flash, bitstream | Stage 3 and 4 |
| `DONE` asserts, application does not run | Post-configuration: application clock, external memory, firmware | Stage 5 |
| Status/`DONE` cycle repeatedly | A brownout or watchdog loop | Stage 6 |

On an MCU board the equivalent partition is: does the reset pin release, and does the first instruction fetch appear on the bus or on a debug interface? If the debugger cannot connect at all, you are in stages 1-2. If it connects and the core is halted at the reset vector, you are in stages 3-4.

This measurement costs two minutes. It is the difference between a targeted investigation and a search. **Do it before changing anything**, because substituting parts destroys the evidence of which region you were in.

## Stage 1 — Power, measured properly

A rail that a meter says is 3.30 V can still be the cause. Three failure modes are invisible to a meter and all three are common.

### 1a. Sequencing

Multi-rail devices specify an order and sometimes a maximum time between rails. Capture every rail on one trigger, not one at a time.

| Discriminating test | Rules in | Rules out |
| --- | --- | --- |
| All rails on one scope trigger, from cold | Wrong order, excessive skew, a rail that never comes up | Sequencing entirely, if order and skew are inside specification |

Sequencing faults are strongly load- and temperature-dependent, which is why a board that fails in the field passes on the bench: the bench supply ramps slowly and the enclosure is cold. Reproduce with the real supply, at temperature, from a genuine cold start, not from a warm reset.

### 1b. Stability under load

A rail can be correct at idle and collapse when the device begins drawing configuration current. Serial flash erase and program operations also draw current in bursts.

Test: scope the rail with the device actually attempting to boot, AC-coupled, at high sensitivity. Look for sag coincident with the status pin's behaviour and for oscillation. A rail that oscillates is a compensation or output-capacitance problem — see [DC-DC controller sourcing](/blog/dc-dc-controller-sourcing-guide) for why a substituted controller changes loop stability, and the [LDO cross-reference guide](/blog/ldo-cross-reference-guide) for the capacitor-stability requirement that makes a "drop-in" LDO unstable.

### 1c. The wrong voltage, correctly regulated

A substituted regulator with a different internal reference produces a wrong output through the existing feedback divider. A 0.6 V-reference part in a design built around 0.8 V regulates a 3.3 V rail to about 2.48 V, and every measurement says the regulator is working correctly, because it is. This is the reference-voltage trap recorded in the [DC-DC controller guide](/blog/dc-dc-controller-sourcing-guide). It is the most-missed cause on a board that used to work and now does not after a BOM change.

Test: compare every rail against the schematic's intended value, not against "looks about right". Then check whether any regulator on the board was substituted.

## Stage 2 — Reset and supervisor timing

The question is not whether reset works. It is whether reset releases after the rails are valid and before the device gives up waiting.

| Cause | Discriminating test |
| --- | --- |
| Supervisor threshold too high for the actual rail | Measure the rail at which reset releases; compare with the supervisor's threshold code |
| Supervisor timeout too short — reset releases before rails are stable | Measure time from last rail valid to reset release |
| **A substituted supervisor with a different threshold** | Read the marking; compare against schematic. Threshold is a suffix character |
| Reset stretched by an RC that is too long | Measure the release time against the device's maximum |
| No pull-up, or reset driven by an unpowered device | Check the driver's own rail |

The substituted-supervisor case deserves emphasis because it is common and silent: threshold voltage is encoded in the ordering code, so a functionally identical part with a different suffix holds the board in reset on a rail that is perfectly healthy, or releases it too early on a rail that is not yet stable. The [supervisor and reset IC selection guide](/blog/supervisor-reset-ic-selection-guide) covers the timing nobody checks; this is what it looks like when nobody checked.

An MCU with internal brown-out detection has the same failure in a different place: the BOR threshold is a configuration fuse, and a device that arrives with a different factory default, or a corrupted option byte, holds itself in reset.

## Stage 3: The clock

Test the clock without touching the crystal. A 10:1 probe adds several picofarads across a resonator whose specified load capacitance may be 8-12 pF. That is enough to stop a marginal oscillator, or to start one that was not running.

| Cause | Discriminating test |
| --- | --- |
| Oscillator not starting | Probe the device's **buffered clock output** or a divided-down output, never the crystal pins |
| Wrong load capacitors | Compute the required value from the crystal's specified load; compare with fitted parts |
| Insufficient negative resistance / drive level | Substitute a clock oscillator module driving the input; if it boots, the resonator circuit is the fault |
| Wrong frequency fitted | Measure at the buffered output |
| A configuration clock that is too fast for the flash | Compare the configuration clock rate against the flash's rated frequency for the read mode in use |

The substitute-an-oscillator-module test is the cleanest discriminator in this whole article: it replaces the entire resonator circuit with a known-good driven clock in one step. If the board boots, stop looking at the flash.

Marginal oscillator start-up is strongly temperature-dependent, which puts it high on the list for any board that fails cold and works warm.

## Stage 4 — Configuration memory and the data path

You are here because status released and `DONE` never asserted, which means the device tried to load a bitstream and did not get a valid one.

### 4a. Is there activity at all?

Scope `CS#`, `CLK` and one data line during the configuration window.

| What you see | Meaning |
| --- | --- |
| No clock, no chip select | The device is not attempting the configuration mode you expect — check mode pins |
| Clock and chip select, no data returned | The flash is not responding — go to 4b |
| Clock, chip select, data returned, `DONE` still low | Data is wrong, not absent — go to 4c |

Mode-pin errors belong in the first row and are common on a first build: the configuration mode is set by strapping pins, and a mis-strapped board waits for a scheme nobody is providing.

### 4b. The flash is not responding

Four causes, all covered in detail in the [configuration flash design article](/blog/fpga-boot-flash-design-longevity), each with a fast test:

| Cause | Discriminating test |
| --- | --- |
| **Pin 7 held in `RESET#`** | Measure pin 7. If it is tied or driven low and the device's default assigns `RESET#`, the flash is held in reset and will never answer |
| Power-up timing — flash not ready when first read arrives | Measure time from rail valid to first `CS#` falling edge; compare against the flash's power-up specification |
| Block protection asserted | Read the status register over the bus with the device held in reset |
| Wrong or dead device | Read the JEDEC ID (`0x9F`) and compare against the datasheet |

The pin 7 case is the one that looks most like a dead board, because there is no partial behaviour: the flash simply does not respond, and nothing on the board is measurably faulty.

### 4c. Data comes back and configuration still fails

| Cause | Discriminating test |
| --- | --- |
| **Flash powers up in 4-byte address mode** while the device issues 3-byte reads | Read back from a known address over the bus; check whether returned data matches the image at that offset or at a shifted offset |
| Quad mode expected but not enabled — or the reverse | Compare configuration time against the expected value; a 4× slow boot means single-bit mode |
| Bitstream programmed at the wrong offset, or for the wrong device | Read the bitstream's device ID field back from flash |
| Image corrupt — CRC failure | Most devices signal a CRC error distinctly from a timeout; read the error status |
| Continuous-read mode bits latched | Power-cycle and issue a mode-reset sequence before the first read |

Discriminating a CRC failure from a timeout is important and easy, because they point in opposite directions: a CRC failure means data arrived and was wrong (offset, corruption, wrong image), while a timeout means data did not arrive (flash, clock, pin 7).

## Stage 5 — `DONE` asserted and nothing runs

Configuration succeeded. The fault is now in the application, and the two dominant causes are the application clock and external memory.

| Cause | Discriminating test |
| --- | --- |
| Application PLL not locking | Read the lock status; check the input clock is what the constraint expects |
| External DRAM not calibrating | Read the memory controller's calibration/training status |
| **DRAM timings inherited from a different vendor after a substitution** | Compare the controller's configured `tRFC`/`CL` against the fitted device's datasheet |
| Reset held by a downstream device | Check every reset consumer's own rail |
| Bank voltage wrong for the I/O standard in the bitstream | Compare bank rails against the constraint file |

The inherited-timings case is the one that produces a board which trains successfully and then corrupts data under load. A discrete DRAM has no SPD, so timings are compiled in, and a vendor change requires re-parameterising: the argument set out in the [DDR3 interface guide](/blog/ddr3-interface-design-longevity).

## Stage 6 — It cycles repeatedly

A repeated reset is a fault with a feedback loop, and there are only four plausible loops.

| Loop | Discriminating test |
| --- | --- |
| Brownout: boot current pulls a rail below the supervisor threshold | Capture the rail and reset together — the rail dips, then reset asserts |
| Watchdog: firmware fails to service it | Disable the watchdog or extend the timeout; if it stops cycling, this is it |
| Inrush: upstream protection trips | Capture the input rail; look for the upstream device's fault behaviour |
| Configuration retry: device retries a failed load | The device's error pin or status distinguishes retry from reset |

The brownout loop is by far the most common. It is a power-sizing fault, not a logic fault: configuration and application start-up draw more current than idle, and a supply sized for idle collapses at exactly the wrong moment. It is also strongly temperature-dependent, so it appears in the field and not on the bench.

## The causes that are not electrical

Two candidate causes sit outside the stages above and both are cheap to test.

### A wrong, remarked or counterfeit part

Read the ID registers. It takes seconds. It is definitive. The serial flash returns a JEDEC manufacturer and device ID to opcode `0x9F`; the FPGA returns a JTAG `IDCODE`. A device whose marking and ID disagree is remarked. A device whose ID does not match the schematic is the wrong part.

This matters more than it used to on legacy boards, because scarcity raises counterfeit rates and legacy configuration memory is exactly the kind of low-value, high-scarcity part that gets remarked. Our [IDEA-STD-1010 inspection guide](/blog/idea-std-1010-counterfeit-detection-guide) covers the physical inspection, [date codes and lot traceability](/blog/date-code-lot-traceability-explained) covers the paperwork, and the [quality page](/quality) sets out what we verify on incoming legacy parts.

### A mechanical or joint fault

Symptoms that correlate with board flex, position, temperature cycling or a knock are mechanical. An open or intermittent BGA joint is the usual cause. It is common after rework.

| Discriminating test | Notes |
| --- | --- |
| Boundary scan on the affected pins | Detects opens without disassembly, if the design supports it |
| X-ray | Definitive for voids and bridges under a BGA |
| Freeze spray / gentle flex while running | Locates the region, but is not proof |

If the board has been reballed, joint integrity after rework is a live question rather than a remote one — see [BGA reballing risk](/blog/bga-reballing-risk-guide).

## The order to work in

Ranked by (probability) × (cheapness of test). This ordering is the article's practical content.

1. **Read the status pins** — two minutes, partitions everything.
2. **Capture all rails on one trigger, from cold** — catches sequencing, sag, oscillation and the wrong-reference substitution.
3. **Read the device IDs** — catches wrong and remarked parts.
4. **Measure reset release against rail valid** — catches supervisor threshold and timing.
5. **Substitute a driven clock** — eliminates the entire resonator circuit in one step.
6. **Measure pin 7 on the configuration flash** — catches the fault that looks like a dead board.
7. **Compare configuration time against expectation** — catches quad-mode and address-mode faults.
8. **Distinguish CRC failure from timeout** — points the remaining search in the right direction.
9. **Then, and only then, start substituting parts.**

Steps 1 to 8 cost under an hour and identify most faults. **Substitution before step 1 destroys the evidence that would have made steps 2-8 unnecessary.**

## Frequently asked questions

### What is the single most common cause of a board that does not boot?

Power — specifically sequencing, sag under boot current, or a rail at the wrong voltage after a regulator substitution. It is also the cause most often cleared incorrectly, because a multimeter averages and reports a healthy voltage on a rail that is oscillating or collapsing at the moment the device needs it. Capture every rail on one scope trigger from a genuine cold start before looking anywhere else.

### Why should I not probe the crystal?

Because the probe's capacitance changes the oscillator's load and can stop a working circuit or start a marginal one: the test creates or masks the fault it is looking for. Probe a buffered clock output instead, and if you need to eliminate the resonator entirely, drive the input from a clock oscillator module. That single substitution is the cleanest discriminating test in the procedure.

### The DONE pin never asserts. Where do I start?

Scope `CS#`, `CLK` and a data line during the configuration window to establish whether the flash is silent or answering wrongly. Silent points at pin 7 held in reset, power-up timing, block protection or a dead device. Answering wrongly points at address mode, bitstream offset, wrong image or corruption. Those are two different investigations and one measurement separates them.

### How do I tell a brownout reset loop from a watchdog loop?

Capture the rail and the reset pin together. In a brownout loop the rail dips first and reset follows; in a watchdog loop the rail is steady throughout. Extending or disabling the watchdog timeout confirms it. The distinction matters because a brownout loop is a power-sizing problem and a watchdog loop is a firmware problem.

### The board works on the bench and fails in the product. What changed?

Usually supply ramp rate, temperature, or load — all three of which affect sequencing and oscillator start-up. Bench supplies ramp slowly and benches are room temperature; enclosures are hot or cold and their supplies ramp fast. Reproduce with the real supply from a cold start at both temperature extremes; if the fault appears, it is a margin fault and belongs in stages 1 to 3.

### Could a counterfeit part cause this, and how would I know?

Yes, and two register reads will tell you. Read the serial flash's JEDEC ID with opcode `0x9F` and the FPGA's JTAG `IDCODE`, then compare against the datasheets and the schematic. A marking that disagrees with the ID means the part was remarked. Legacy configuration memory is a high-risk category because it is scarce and low-value, which is the combination that attracts remarking.

### Nothing in this list explains it. What now?

Recheck stage zero, because the region is probably wrong. The most common reason a systematic procedure fails is that the initial partition was made from a warm restart rather than a cold start, or from a board that had already been modified. Reproduce the original failure on an unmodified board from cold, capture the status pins, and re-enter the procedure at the region that capture indicates.

### Does this procedure work for an MCU board?

Yes: the stages are identical and two of them move. The configuration data path becomes internal flash plus option bytes, so stage 4 is replaced by "can the debugger connect and is the core halted at the reset vector". The supervisor becomes the internal brown-out detector, whose threshold is a configuration fuse rather than an ordering-code suffix, but it fails in exactly the same way, by holding a healthy board in reset.
