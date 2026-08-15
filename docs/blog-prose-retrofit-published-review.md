# Prose de-templating: proposed changes to the 21 published articles

Generated 2026-08-11 by `scripts/detemplate-blog-prose.mjs --published --report`.

Computed against the **database** content, not the on-disk drafts, because a
published body may have diverged from its draft. Applying writes to the
database directly and does not touch the draft files.

Changes are punctuation and the removal of `**` wrappers only. No claim, number,
part number, heading or link is altered.

| Slug | Em dash | Bold openers | Tics | "and it is" |
| --- | ---: | ---: | ---: | ---: |
| `how-to-choose-right-fpga` | 6.8→1.8 | 4.1→0.5 | 0.0→0.0 | 0.9→0.0 |
| `stm32f103-vs-stm32f407-comparison` | 11.1→3.1 | 3.7→0.6 | 0.0→0.0 | 0.0→0.0 |
| `understanding-mlcc-capacitors-guide` | 6.4→3.2 | 3.2→0.4 | 0.0→0.0 | 0.0→0.0 |
| `eol-nrnd-obsolete-ic-lifecycle-explained` | 6.6→3.8 | 8.8→0.5 | 0.0→0.0 | 0.0→0.0 |
| `idea-std-1010-counterfeit-detection-guide` | 1.8→0.6 | 16.2→0.6 | 0.0→0.0 | 0.0→0.0 |
| `how-to-source-obsolete-electronic-components` | 7.2→6.1 | 3.9→0.6 | 0.0→0.0 | 0.0→0.0 |
| `bom-scrubbing-lifecycle-risk-analysis` | 5.2→2.3 | 13.3→0.6 | 0.0→0.0 | 0.0→0.0 |
| `fpga-obsolescence-spartan-cyclone-end-of-life` | 7.0→3.0 | 9.0→0.5 | 0.0→0.0 | 0.0→0.0 |
| `gd32-vs-stm32-gd32f103-motor-control-alternatives` | 1.4→1.4 | 0.0→0.0 | 0.0→0.0 | 0.0→0.0 |
| `analog-power-second-sourcing-guide` | 7.3→2.3 | 5.7→0.4 | 0.0→0.0 | 0.4→0.0 |
| `ldo-cross-reference-guide` | 11.3→4.8 | 3.1→0.4 | 0.0→0.0 | 0.4→0.0 |
| `dc-dc-regulator-replacement-guide` | 7.5→1.5 | 3.5→0.5 | 0.0→0.0 | 0.0→0.0 |
| `supervisor-reset-ic-selection-guide` | 7.0→1.5 | 3.5→0.5 | 0.0→0.0 | 0.0→0.0 |
| `op-amp-equivalent-selection` | 7.1→2.0 | 4.6→0.5 | 0.0→0.0 | 0.0→0.0 |
| `clock-generator-pll-sourcing` | 9.8→5.6 | 5.2→0.5 | 0.0→0.0 | 0.0→0.0 |
| `mcu-second-source-cross-reference-guide` | 7.7→1.7 | 5.1→0.4 | 0.0→0.0 | 0.4→0.0 |
| `sourcing-xilinx-spartan-6-guide` | 10.6→4.4 | 4.4→0.6 | 0.0→0.0 | 0.6→0.0 |
| `sourcing-altera-cyclone-legacy` | 9.0→1.3 | 5.2→0.7 | 0.0→0.0 | 2.6→0.0 |
| `altera-max-cpld-replacement-paths` | 15.9→2.7 | 5.8→0.5 | 0.0→0.0 | 0.5→0.0 |
| `lattice-machxo-ecp-sourcing` | 7.6→3.2 | 5.7→0.6 | 0.0→0.0 | 0.0→0.0 |
| `actel-proasic-sourcing-guide` | 4.6→1.1 | 2.9→0.6 | 0.6→0.0 | 0.0→0.0 |

## Sample diffs

### `how-to-choose-right-fpga`

22 substitutions. First changes:

```diff
- **Choosing an FPGA on logic-cell count alone is the most common way an FPGA project goes wrong.** Logic capacity is rarely the binding constraint. I/O count, clock resources, hard blocks, package escape routing, toolchain licensing and — increasingly — whether the part will still exist in eight years all constrain the decision harder than LUTs do. This guide works through the constraints in the or
+ **Choosing an FPGA on logic-cell count alone is the most common way an FPGA project goes wrong.** Logic capacity is rarely the binding constraint. I/O count, clock resources, hard blocks, package escape routing, toolchain licensing and (increasingly) whether the part will still exist in eight years all constrain the decision harder than LUTs do. This guide works through the constraints in the orde

- - **Run out of I/O before you run out of logic.** Pin count, not logic cells, is the usual first wall — and it is the one that forces a package change and a board respin.
+ - **Run out of I/O before you run out of logic.** Pin count, not logic cells, is the usual first wall —. It is the one that forces a package change and a board respin.

- **Vendor selectors sort by logic capacity because it is the easiest number to index. It is seldom the number that decides.** Before opening any selector, write down six figures:
+ Vendor selectors sort by logic capacity because it is the easiest number to index. It is seldom the number that decides. Before opening any selector, write down six figures:
```

### `stm32f103-vs-stm32f407-comparison`

18 substitutions. First changes:

```diff
- - Both remain widely available in 2026, but **specific F407 orderable part numbers have gone obsolete** while the family continues — the part number matters more than the family.
+ - Both remain widely available in 2026, but **specific F407 orderable part numbers have gone obsolete** while the family continues: the part number matters more than the family.

- **The F103 is a Cortex-M3 at up to 72 MHz. The F407 is a Cortex-M4F at up to 168 MHz.** The clock ratio is 2.3×, but the useful ratio depends entirely on what the code does.
+ The F103 is a Cortex-M3 at up to 72 MHz. The F407 is a Cortex-M4F at up to 168 MHz. The clock ratio is 2.3×, but the useful ratio depends entirely on what the code does.

- **Core-Coupled Memory (CCM).** The F407's 64 KB of CCM RAM is attached directly to the core and is fast — but **DMA cannot access it**. Placing a DMA buffer in CCM produces a transfer that silently does nothing, or a hard fault, depending on configuration. This is one of the most common F407 mistakes, and it does not exist on the F103 because the F103 has no CCM.
+ Core-Coupled Memory (CCM). The F407's 64 KB of CCM RAM is attached directly to the core and is fast, but **DMA cannot access it**. Placing a DMA buffer in CCM produces a transfer that silently does nothing, or a hard fault, depending on configuration. This is one of the most common F407 mistakes, and it does not exist on the F103 because the F103 has no CCM.
```

### `understanding-mlcc-capacitors-guide`

17 substitutions. First changes:

```diff
- **A multilayer ceramic capacitor rarely delivers the capacitance printed on it.** Apply DC bias and a Class II MLCC can lose more than half its value; move to a temperature extreme and it loses more; leave it on a shelf and it slowly loses a little more still. None of this is a defect — it is how the dielectric works — but designs fail every day because the BOM says 10 µF and the circuit sees 4 µF
+ **A multilayer ceramic capacitor rarely delivers the capacitance printed on it.** Apply DC bias and a Class II MLCC can lose more than half its value; move to a temperature extreme and it loses more; leave it on a shelf and it slowly loses a little more still. None of this is a defect (it is how the dielectric works) but designs fail every day because the BOM says 10 µF and the circuit sees 4 µF. 

- - **Case size matters more than voltage rating** for bias performance — a larger case with the same nominal value derates far less.
+ - **Case size matters more than voltage rating** for bias performance: a larger case with the same nominal value derates far less.

- **An MLCC is a stack of ceramic dielectric layers interleaved with metal electrodes, fired into a monolithic block and terminated at each end.** Capacitance comes from the number of layers, their area and the dielectric constant of the ceramic.
+ An MLCC is a stack of ceramic dielectric layers interleaved with metal electrodes, fired into a monolithic block and terminated at each end. Capacitance comes from the number of layers, their area and the dielectric constant of the ceramic.
```

### `eol-nrnd-obsolete-ic-lifecycle-explained`

21 substitutions. First changes:

```diff
- The answer depends on which status the manufacturer assigned, what window they gave, and which inventory tier still holds the part. These five terms — **Active**, **NRND**, **Last-Time-Buy**, **EOL**, and **Obsolete** — are not interchangeable. Getting them wrong costs money in three predictable ways:
+ The answer depends on which status the manufacturer assigned, what window they gave, and which inventory tier still holds the part. These five terms (**Active**, **NRND**, **Last-Time-Buy**, **EOL**, and **Obsolete**) are not interchangeable. Getting them wrong costs money in three predictable ways:

- **Product Change Notices (PCNs) and Product Discontinuance Notices (PDNs)**. These are formal notifications, usually under the JESD48-D / IPC-1601 framework. They appear on the manufacturer's website and are pushed to authorized distributors. Major aggregators — SiliconExpert, Z2Data, IHS Markit (now Eaton TraceParts) — index them and flag affected designs.
+ **Product Change Notices (PCNs) and Product Discontinuance Notices (PDNs)**. These are formal notifications, usually under the JESD48-D / IPC-1601 framework. They appear on the manufacturer's website and are pushed to authorized distributors. Major aggregators (SiliconExpert, Z2Data, IHS Markit (now Eaton TraceParts)) index them and flag affected designs.

- **Datasheet headers**. Most major vendors update the lifecycle status banner on the datasheet itself. Microchip uses *Active / Mature / Last-Time-Buy / Obsolete*. Texas Instruments uses *Active / NRND / Last-Time-Buy / Obsolete*. ST uses *Active / NRND / EOL / Obsolete*. The exact words vary; the concepts overlap.
+ Datasheet headers. Most major vendors update the lifecycle status banner on the datasheet itself. Microchip uses *Active / Mature / Last-Time-Buy / Obsolete*. Texas Instruments uses *Active / NRND / Last-Time-Buy / Obsolete*. ST uses *Active / NRND / EOL / Obsolete*. The exact words vary; the concepts overlap.
```

### `idea-std-1010-counterfeit-detection-guide`

28 substitutions. First changes:

```diff
- **IDEA** stands for *Independent Distributors of Electronics Association*. It is an industry body that publishes inspection standards specifically designed for the independent and aftermarket distribution channel — the part of the supply chain that operates outside franchise/authorized distribution.
+ **IDEA** stands for *Independent Distributors of Electronics Association*. It is an industry body that publishes inspection standards specifically designed for the independent and aftermarket distribution channel: the part of the supply chain that operates outside franchise/authorized distribution.

- **IDEA-STD-1010** is IDEA's specification for visual and electrical inspection of electronic components. The current published version is **IDEA-STD-1010-B (2017)**, which expanded the protocol from earlier revisions to incorporate detection techniques developed in response to evolving counterfeit methods. It covers more than 100 distinct inspection checks across eight broad categories.
+ IDEA-STD-1010 is IDEA's specification for visual and electrical inspection of electronic components. The current published version is **IDEA-STD-1010-B (2017)**, which expanded the protocol from earlier revisions to incorporate detection techniques developed in response to evolving counterfeit methods. It covers more than 100 distinct inspection checks across eight broad categories.

- **1. External Visual Inspection.** The part is examined under low-power magnification (10×-40×) for surface anomalies: marking inconsistencies, residual paint or chemical wash marks, scratch patterns indicating remarking, package surface texture irregularities, and lead/pad oxidation patterns that don't match the claimed date code.
+ 1. External Visual Inspection. The part is examined under low-power magnification (10×-40×) for surface anomalies: marking inconsistencies, residual paint or chemical wash marks, scratch patterns indicating remarking, package surface texture irregularities, and lead/pad oxidation patterns that don't match the claimed date code.
```

### `how-to-source-obsolete-electronic-components`

16 substitutions. First changes:

```diff
- A 2018 SAE survey of aerospace and defense electronics buyers reported that the average bill of materials carried 8-15% of part numbers in some stage of lifecycle decline — NRND, end-of-life, or fully obsolete. Industrial control and medical electronics carry similar exposure: any product designed to ship for more than 5 years inevitably reaches a point where a meaningful share of its BOM is no lo
+ A 2018 SAE survey of aerospace and defense electronics buyers reported that the average bill of materials carried 8-15% of part numbers in some stage of lifecycle decline: NRND, end-of-life, or fully obsolete. Industrial control and medical electronics carry similar exposure: any product designed to ship for more than 5 years inevitably reaches a point where a meaningful share of its BOM is no lon

- The "just buy more" reflex — stockpiling parts whenever possible — is a partial answer but not a strategy. The right approach treats obsolescence as an inevitable lifecycle stage that can be planned for, not a crisis to be solved part by part.
+ The "just buy more" reflex (stockpiling parts whenever possible) is a partial answer but not a strategy. The right approach treats obsolescence as an inevitable lifecycle stage that can be planned for, not a crisis to be solved part by part.

- When a part is newly EOL'd, the first stop is always authorized distribution — Mouser, Digi-Key, Arrow, Avnet, Future Electronics, and the franchise distributors local to your region. These are the lowest-risk and lowest-cost sources. Counterfeit risk is essentially zero because franchise distributors source directly from the manufacturer under contract.
+ When a part is newly EOL'd, the first stop is always authorized distribution: Mouser, Digi-Key, Arrow, Avnet, Future Electronics, and the franchise distributors local to your region. These are the lowest-risk and lowest-cost sources. Counterfeit risk is essentially zero because franchise distributors source directly from the manufacturer under contract.
```

### `bom-scrubbing-lifecycle-risk-analysis`

27 substitutions. First changes:

```diff
- **2. Source diversity**. A part with only one manufacturer carries higher risk than the same part available from multiple sources. Single-source critical components are the single biggest avoidable supply chain risk in most BOMs.
+ 2. Source diversity. A part with only one manufacturer carries higher risk than the same part available from multiple sources. Single-source critical components are the single biggest avoidable supply chain risk in most BOMs.

- **3. Manufacturer corporate health**. Mergers and acquisitions routinely reshape lifecycle decisions. AMD's 2022 acquisition of Xilinx, Intel's 2015 acquisition (and 2024 partial spinout) of Altera, Renesas absorbing IDT and Intersil, and Microchip's serial acquisitions of Atmel and Microsemi all changed product roadmap decisions for hundreds of legacy parts. Manufacturer financial signals — quart
+ 3. Manufacturer corporate health. Mergers and acquisitions routinely reshape lifecycle decisions. AMD's 2022 acquisition of Xilinx, Intel's 2015 acquisition (and 2024 partial spinout) of Altera, Renesas absorbing IDT and Intersil, and Microchip's serial acquisitions of Atmel and Microsemi all changed product roadmap decisions for hundreds of legacy parts. Manufacturer financial signals (quarterly 

- **4. Geographic / geopolitical risk**. Where the part is fabbed, packaged, and tested matters. Concentration in a single geopolitical region creates exposure to export controls, tariffs, and disruption events. The 2020-2022 semiconductor supply crunch made this concrete for many teams that hadn't tracked geographic concentration previously.
+ 4. Geographic / geopolitical risk. Where the part is fabbed, packaged, and tested matters. Concentration in a single geopolitical region creates exposure to export controls, tariffs, and disruption events. The 2020-2022 semiconductor supply crunch made this concrete for many teams that hadn't tracked geographic concentration previously.
```

### `fpga-obsolescence-spartan-cyclone-end-of-life`

29 substitutions. First changes:

```diff
- The effect for engineers and procurement teams sustaining FPGA-based products is concrete: families that anchored designs from 2005-2015 are now in various stages of end-of-life. **Xilinx Spartan-3**, **Spartan-3E**, and **Virtex-II/Virtex-II Pro** have been formally discontinued for years. **Altera Cyclone II** has reached End-of-Life status. Other classic families — **Spartan-6**, **Cyclone IV**
+ The effect for engineers and procurement teams sustaining FPGA-based products is concrete: families that anchored designs from 2005-2015 are now in various stages of end-of-life. **Xilinx Spartan-3**, **Spartan-3E**, and **Virtex-II/Virtex-II Pro** have been formally discontinued for years. **Altera Cyclone II** has reached End-of-Life status. Other classic families (**Spartan-6**, **Cyclone IV**,

- **Layer 2: Tools no longer updated.** FPGA bitstream generation requires vendor-specific tools (Xilinx ISE for Spartan-3 through Virtex-6 era, Quartus II for older Altera, modern Vivado for 7-series and later Xilinx, Quartus Prime for newer Altera/Intel). Once a tool version is end-of-life, it doesn't get security patches, doesn't support new operating systems, and may stop working under modern OS
+ Layer 2: Tools no longer updated. FPGA bitstream generation requires vendor-specific tools (Xilinx ISE for Spartan-3 through Virtex-6 era, Quartus II for older Altera, modern Vivado for 7-series and later Xilinx, Quartus Prime for newer Altera/Intel). Once a tool version is end-of-life, it doesn't get security patches, doesn't support new operating systems, and may stop working under modern OS upd

- **Layer 3: Documentation archived.** As a family moves from Mature to NRND to EOL, the manufacturer's website progressively removes the part from active navigation. Datasheets and user guides eventually move to archive sections, then sometimes disappear entirely from the main site. For engineers debugging a legacy design 15-20 years after release, this is more of a problem than the silicon supply.
+ Layer 3: Documentation archived. As a family moves from Mature to NRND to EOL, the manufacturer's website progressively removes the part from active navigation. Datasheets and user guides eventually move to archive sections, then sometimes disappear entirely from the main site. For engineers debugging a legacy design 15-20 years after release, this is more of a problem than the silicon supply.
```

### `analog-power-second-sourcing-guide`

29 substitutions. First changes:

```diff
- **Analog second-sourcing is the process of qualifying a replacement for a discontinued analog or power management IC.** Unlike digital parts, analog devices are defined by *how well* they perform across temperature, load and supply variation — so two parts with identical headline specifications frequently behave differently in the same circuit. This guide covers what must match, what may differ, a
+ **Analog second-sourcing is the process of qualifying a replacement for a discontinued analog or power management IC.** Unlike digital parts, analog devices are defined by *how well* they perform across temperature, load and supply variation, so two parts with identical headline specifications frequently behave differently in the same circuit. This guide covers what must match, what may differ, an

- **Analog parts are harder to second-source than digital parts because their specification is statistical and environmental rather than functional.** A digital device is defined by what it does — an instruction set, a register map, a protocol. Two parts implementing the same function behave the same way, and when they do not, firmware fails loudly and immediately. An analog device is defined by how
+ Analog parts are harder to second-source than digital parts because their specification is statistical and environmental rather than functional. A digital device is defined by what it does: an instruction set, a register map, a protocol. Two parts implementing the same function behave the same way, and when they do not, firmware fails loudly and immediately. An analog device is defined by how well

- This matters commercially because analog is where the volume sits. In our catalogue, linear regulators, switching regulators, supervisors, op-amps and clock devices together account for roughly 210,000 part numbers — a larger population than microcontrollers.
+ This matters commercially because analog is where the volume sits. In our catalogue, linear regulators, switching regulators, supervisors, op-amps and clock devices together account for roughly 210,000 part numbers: a larger population than microcontrollers.
```

### `ldo-cross-reference-guide`

23 substitutions. First changes:

```diff
- ## 1. Output capacitor stability — the number one failure
+ ## 1. Output capacitor stability: the number one failure

- **A linear regulator is a feedback loop and the output capacitor sits inside it.** The regulator's internal compensation is designed around an assumed range of capacitance and equivalent series resistance. Move outside that range and phase margin collapses.
+ A linear regulator is a feedback loop and the output capacitor sits inside it. The regulator's internal compensation is designed around an assumed range of capacitance and equivalent series resistance. Move outside that range and phase margin collapses.

- A classic part and a modern part can share output voltage, current, dropout and package, and be listed as equivalents. Swapping one for the other without changing the output capacitor is the most common way an LDO substitution fails — and it typically fails *intermittently*, at temperature, on a fraction of units, which is the worst failure mode to debug.
+ A classic part and a modern part can share output voltage, current, dropout and package, and be listed as equivalents. Swapping one for the other without changing the output capacitor is the most common way an LDO substitution fails, and it typically fails *intermittently*, at temperature, on a fraction of units, which is the worst failure mode to debug.
```

### `dc-dc-regulator-replacement-guide`

18 substitutions. First changes:

```diff
- - If the analysis forces an inductor change plus a compensation change plus a capacitor change, it is a redesign — and a **last-time-buy is usually cheaper**.
+ - If the analysis forces an inductor change plus a compensation change plus a capacitor change, it is a redesign, and a **last-time-buy is usually cheaper**.

- **Four attributes narrow the field faster than anything else.** Characterise the incumbent properly before looking at replacements.
+ Four attributes narrow the field faster than anything else. Characterise the incumbent properly before looking at replacements.

- The synchronous/non-synchronous distinction deserves emphasis. A non-synchronous buck needs an external catch diode. Replacing a non-synchronous part with a synchronous one leaves an unnecessary diode on the board — usually harmless. The reverse leaves no freewheel path at all, which destroys the part on first switching cycle.
+ The synchronous/non-synchronous distinction deserves emphasis. A non-synchronous buck needs an external catch diode. Replacing a non-synchronous part with a synchronous one leaves an unnecessary diode on the board, usually harmless. The reverse leaves no freewheel path at all, which destroys the part on first switching cycle.
```

### `supervisor-reset-ic-selection-guide`

21 substitutions. First changes:

```diff
- - Watchdog behaviour is a functional difference, not a feature difference — a supervisor with a watchdog dropped into a socket that never services it will **reset the board continuously**.
+ - Watchdog behaviour is a functional difference, not a feature difference: a supervisor with a watchdog dropped into a socket that never services it will **reset the board continuously**.

- **A processor executing instructions from a supply below its minimum operating voltage does not fail cleanly.** It fetches corrupted instructions, writes corrupted data, and can leave non-volatile memory in an inconsistent state. The supervisor exists to make that impossible: it asserts reset while the rail is below threshold, and holds reset for a defined period *after* the rail becomes valid, gi
+ A processor executing instructions from a supply below its minimum operating voltage does not fail cleanly. It fetches corrupted instructions, writes corrupted data, and can leave non-volatile memory in an inconsistent state. The supervisor exists to make that impossible: it asserts reset while the rail is below threshold, and holds reset for a defined period *after* the rail becomes valid, giving

- Many devices combine two or three. That combination is exactly where substitutions go wrong, because a part offering a superset of functions is not automatically a safe replacement — an unserviced watchdog is a reset generator.
+ Many devices combine two or three. That combination is exactly where substitutions go wrong, because a part offering a superset of functions is not automatically a safe replacement: an unserviced watchdog is a reset generator.
```

### `op-amp-equivalent-selection`

21 substitutions. First changes:

```diff
- **An operational amplifier is not defined by what it does — every op-amp amplifies a difference — but by the conditions under which it continues to do so correctly.** Two amplifiers with the same supply range, the same gain-bandwidth product and the same package can behave completely differently in the same socket.
+ An operational amplifier is not defined by what it does (every op-amp amplifies a difference) but by the conditions under which it continues to do so correctly. Two amplifiers with the same supply range, the same gain-bandwidth product and the same package can behave completely differently in the same socket.

- ## 1. Stability at your gain — the decompensated trap
+ ## 1. Stability at your gain: the decompensated trap

- **Some high-speed amplifiers are deliberately "decompensated": they are stable only above a minimum closed-loop gain.** Drop one into a unity-gain buffer and it will oscillate immediately.
+ Some high-speed amplifiers are deliberately "decompensated": they are stable only above a minimum closed-loop gain. Drop one into a unity-gain buffer and it will oscillate immediately.
```

### `clock-generator-pll-sourcing`

20 substitutions. First changes:

```diff
- - LVPECL needs a **DC bias path to work at all** — usually a Thevenin network or emitter pull-downs. Dropping LVPECL into an LVDS footprint leaves the outputs unbiased.
+ - LVPECL needs a **DC bias path to work at all**, usually a Thevenin network or emitter pull-downs. Dropping LVPECL into an LVDS footprint leaves the outputs unbiased.

- **A clock is an interface, not just a signal.** When a regulator substitution fails you get instability or heat. When a clock substitution fails you get a link that does not train, a converter whose SNR is 6 dB worse than the datasheet, or a bus that works at room temperature and fails at 70 °C. All three look like problems somewhere else in the system, which is why clock substitutions consume so 
+ A clock is an interface, not just a signal. When a regulator substitution fails you get instability or heat. When a clock substitution fails you get a link that does not train, a converter whose SNR is 6 dB worse than the datasheet, or a bus that works at room temperature and fails at 70 °C. All three look like problems somewhere else in the system, which is why clock substitutions consume so much

- ## 1. Output format — a hard incompatibility
+ ## 1. Output format: a hard incompatibility
```

### `mcu-second-source-cross-reference-guide`

28 substitutions. First changes:

```diff
- **Microcontroller second-sourcing is the process of qualifying an alternative MCU for a design already in production.** The headline specifications — core, flash size, RAM, package — are the easy part and almost never the reason a substitution fails. Failures come from peripheral behaviour, flash wait states, ADC accuracy, startup timing and errata. This guide covers what has to match, in the orde
+ **Microcontroller second-sourcing is the process of qualifying an alternative MCU for a design already in production.** The headline specifications (core, flash size, RAM, package) are the easy part and almost never the reason a substitution fails. Failures come from peripheral behaviour, flash wait states, ADC accuracy, startup timing and errata. This guide covers what has to match, in the order 

- - Peripheral **corner cases** — I²C clock stretching, SPI NSS handling, UART framing on noise, DMA arbitration — are where firmware breaks, and they are rarely documented as differences.
+ - Peripheral **corner cases** (I²C clock stretching, SPI NSS handling, UART framing on noise, DMA arbitration) are where firmware breaks, and they are rarely documented as differences.

- **An analog part fails a substitution loudly and physically — it oscillates, or overheats. A microcontroller fails a substitution silently and conditionally.** The board boots, the application runs, and then a specific peripheral misbehaves under a specific condition that nobody tested.
+ An analog part fails a substitution loudly and physically — it oscillates, or overheats. A microcontroller fails a substitution silently and conditionally. The board boots, the application runs, and then a specific peripheral misbehaves under a specific condition that nobody tested.
```

### `sourcing-xilinx-spartan-6-guide`

19 substitutions. First changes:

```diff
- - **ISE 14.7 is the last toolchain that supports Spartan-6**, and it is frozen. Vivado never supported this family and never will.
+ - **ISE 14.7 is the last toolchain that supports Spartan-6**. It is frozen. Vivado never supported this family and never will.

- ## Decoding the part number — and why it decides availability
+ ## Decoding the part number, and why it decides availability

- **The suffix is the part.** A request for "XC6SLX9" cannot be quoted; a request for `XC6SLX9-2CPG196I` can.
+ The suffix is the part. A request for "XC6SLX9" cannot be quoted; a request for `XC6SLX9-2CPG196I` can.
```

### `sourcing-altera-cyclone-legacy`

23 substitutions. First changes:

```diff
- **The Cyclone line spans twenty years and four distinct generations, and they are in completely different places in their lifecycles.** Cyclone IV remains findable; Cyclone I and II are firmly legacy. Anyone sustaining a design built on any of them faces the same three problems: identifying the exact orderable variant, keeping a Quartus version that still supports the device, and remembering that 
+ **The Cyclone line spans twenty years and four distinct generations, and they are in completely different places in their lifecycles.** Cyclone IV remains findable; Cyclone I and II are firmly legacy. Anyone sustaining a design built on any of them faces the same three problems: identifying the exact orderable variant, keeping a Quartus version that still supports the device, and remembering that 

- **"Cyclone" covers devices introduced from 2002 to around 2009, and grouping them together is the first mistake.**
+ "Cyclone" covers devices introduced from 2002 to around 2009, and grouping them together is the first mistake.

- **A Cyclone FPGA is volatile: it loads its bitstream at power-up from an external device.** For most Cyclone designs that is an EPCS-series serial configuration flash, or a parallel flash driven by a microcontroller.
+ A Cyclone FPGA is volatile: it loads its bitstream at power-up from an external device. For most Cyclone designs that is an EPCS-series serial configuration flash, or a parallel flash driven by a microcontroller.
```

### `altera-max-cpld-replacement-paths`

37 substitutions. First changes:

```diff
- **The MAX 7000 family is one of the most thoroughly obsolete part families still in active demand.** Introduced in the 1990s, it became the default glue-logic and sequencing device for a generation of industrial, telecom and instrumentation boards — and a great many of those boards are still built today. Almost every MAX 7000 and MAX 3000 orderable part in circulation is marked obsolete, yet the p
+ **The MAX 7000 family is one of the most thoroughly obsolete part families still in active demand.** Introduced in the 1990s, it became the default glue-logic and sequencing device for a generation of industrial, telecom and instrumentation boards, and a great many of those boards are still built today. Almost every MAX 7000 and MAX 3000 orderable part in circulation is marked obsolete, yet the pa

- - **A CPLD is chosen for instant-on behaviour**, not capacity — which is exactly why nothing modern is a drop-in.
+ - **A CPLD is chosen for instant-on behaviour**, not capacity, which is exactly why nothing modern is a drop-in.

- **A CPLD does a job that nothing else does as cheaply: it is functional within microseconds of power-up, with no external configuration memory.** That makes it the natural choice for power sequencing, reset supervision, boot-mode selection, bus arbitration and level translation — functions that must work *before* anything else on the board is alive.
+ A CPLD does a job that nothing else does as cheaply: it is functional within microseconds of power-up, with no external configuration memory. That makes it the natural choice for power sequencing, reset supervision, boot-mode selection, bus arbitration and level translation — functions that must work *before* anything else on the board is alive.
```

### `lattice-machxo-ecp-sourcing`

15 substitutions. First changes:

```diff
- **Lattice devices are the most numerous programmable-logic parts in our catalogue — around 2,800 part numbers — and most people never think about them until one goes missing.** MachXO, ispMACH and the ECP families are bridging and control logic: the device that translates a bus, sequences the supplies, or glues an old interface to a new processor. They are rarely the headline component, which is e
+ **Lattice devices are the most numerous programmable-logic parts in our catalogue (around 2,800 part numbers) and most people never think about them until one goes missing.** MachXO, ispMACH and the ECP families are bridging and control logic: the device that translates a bus, sequences the supplies, or glues an old interface to a new processor. They are rarely the headline component, which is exa

- - **Around 2,800 Lattice part numbers**, the largest programmable-logic holding we have — and heavily weighted toward obsolete devices.
+ - **Around 2,800 Lattice part numbers**, the largest programmable-logic holding we have, and heavily weighted toward obsolete devices.

- **"Lattice" in a BOM could mean any of four quite different things**, and the sourcing exercise differs for each.
+ "Lattice" in a BOM could mean any of four quite different things, and the sourcing exercise differs for each.
```

### `actel-proasic-sourcing-guide`

11 substitutions. First changes:

```diff
- **Actel's flash-based FPGAs occupy a niche that SRAM FPGAs cannot fill: non-volatile, instant-on, single-chip, and inherently immune to configuration upset.** That combination is why they populate aerospace, defence, medical and long-life industrial designs — and why sourcing them is a different exercise from sourcing a Spartan or a Cyclone. The parts have outlived two corporate acquisitions (Acte
+ **Actel's flash-based FPGAs occupy a niche that SRAM FPGAs cannot fill: non-volatile, instant-on, single-chip, and inherently immune to configuration upset.** That combination is why they populate aerospace, defence, medical and long-life industrial designs, and why sourcing them is a different exercise from sourcing a Spartan or a Cyclone. The parts have outlived two corporate acquisitions (Actel

- - **Flash configuration is the whole point.** No external configuration memory, live in microseconds, and no configuration bitstream to be corrupted by a radiation event.
+ - **Flash configuration is the point.** No external configuration memory, live in microseconds, and no configuration bitstream to be corrupted by a radiation event.

- **Most FPGAs are SRAM-based: they hold their configuration in volatile memory and reload it from external flash at every power-up.** Actel's ProASIC and IGLOO families store configuration in on-chip flash instead. Four consequences follow, and each maps to a reason these parts get designed in:
+ Most FPGAs are SRAM-based: they hold their configuration in volatile memory and reload it from external flash at every power-up. Actel's ProASIC and IGLOO families store configuration in on-chip flash instead. Four consequences follow, and each maps to a reason these parts get designed in:
```
