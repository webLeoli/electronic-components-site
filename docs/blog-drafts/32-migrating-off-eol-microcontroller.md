---
title: "Migrating Off an EOL Microcontroller: A Project Plan, Not a Part Swap"
slug: "migrating-off-eol-microcontroller"
status: "draft"
seoTitle: "Migrating Off an EOL Microcontroller: Step-by-Step Plan"
seoDesc: "An MCU migration is a firmware, hardware, tooling and qualification project. How to scope it, the order that minimises risk, what to archive first, and how to decide whether to migrate at all."
seoKeywords: "EOL microcontroller migration, MCU migration plan, replace obsolete microcontroller, firmware port, MCU end of life, legacy firmware migration"
tags: "MCU, migration, EOL, obsolescence, firmware, project planning, procurement"
author: "FPGACenter Sourcing Team"
readingTime: 18
category: "MCU Sourcing & Alternatives"
relatedProducts: "STM32F103RBT6TR, PIC18F25Q43-I/SO, MSP430F1491IPM, MC9S08PT8VWJ"
---

# Migrating Off an EOL Microcontroller: A Project Plan, Not a Part Swap

> **Author**: FPGACenter Sourcing Team
> **Reading time**: ~18 minutes
> **Topics**: MCU migration, EOL, firmware port, project planning, risk sequencing

---

**Most MCU migrations are scoped as a component change and delivered as a product redevelopment.** The part is one line on the bill of materials, but the firmware depends on its peripherals, the board depends on its pinout and supplies, the factory depends on its programming tooling, and (if the product is certified) the approval depends on the whole configuration. This guide sets out how to scope the work honestly, what order to do it in so that risk falls early rather than late, and how to decide whether to migrate at all.

## Key takeaways

- **Decide whether to migrate before planning how.** A last-time buy or authorised aftermarket purchase avoids the entire project and is frequently cheaper.
- **Archive the existing build environment on day one**, before anything else. This is the cheapest step and the one that becomes impossible later.
- **Scope five workstreams**: firmware, hardware, tooling, test, and qualification. Teams routinely scope only the first two.
- **Do the hard part first.** Prove the riskiest peripheral on an evaluation board before committing to a board layout.
- **The unknown-unknowns live in undocumented behaviour** — code that works because of a timing coincidence or an erratum workaround.
- **Budget a pilot build and a temperature soak.** Migration defects are disproportionately intermittent and environmental.

---

## First: should you migrate at all?

Migration is one of four responses to an end-of-life notice. It is usually the most expensive.

| Option | Cost | When it wins |
| --- | --- | --- |
| Authorised aftermarket | Part price, possibly a premium | The line is continued — check this first, always |
| Last-time buy | Part price × quantity + storage | Stable design, predictable remaining life |
| Within-family substitution | Days to weeks of engineering | A pin-compatible successor exists in the same family |
| Cross-family migration | Weeks to months, plus board and requalification | Nothing else is available, or the product needs changes anyway |

Check the first row before doing anything else. A discontinued microcontroller continued in authorised production requires no engineering at all: the situation described in [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor), where in our catalogue Rochester Electronics alone covers 9,264 microcontroller part numbers.

If a last-time buy will cover remaining production and spares, [size it properly](/blog/last-time-buy-quantity-and-storage) and stop there. Migration makes sense when remaining product life is long, volumes are high, the design needs changes anyway, or the tooling has become the constraint.

## Day one: archive before you plan

Do this before scoping, before selecting a replacement, before anything. It costs a day and it becomes impossible once a machine is retired or a licence lapses.

| Artefact | Why |
| --- | --- |
| Virtual machine with OS, IDE, compiler, programmer driver | The only reliable way to rebuild the existing firmware later |
| Exact compiler version and optimisation settings | A different compiler version produces different timing |
| Compiled binary / hex file, per released version | So you can reproduce the shipping product without rebuilding |
| Configuration bits / fuse settings, written down explicitly | Frequently stored in project files rather than source, and easily lost |
| Programmer hardware, or a known-working equivalent | Discussed in [legacy 8-bit MCU sourcing](/blog/legacy-8-bit-mcu-sourcing) |
| Licence files and how they were tied | Node-locked licences fail silently on a new machine |
| Production test fixture and its software | Often older than the firmware and equally undocumented |

The reason this is first: for the entire migration you will need to compare new behaviour against old. If you cannot build and run the original, every difference you find is unattributable.

## Scoping: five workstreams

Teams routinely scope firmware and hardware, then discover the other three.

### 1. Firmware

- Peripheral driver rewrite for every peripheral used.
- Anything timing-dependent: bit-banged protocols, software delays, cycle-counted loops.
- Interrupt structure and priority model — these differ substantially across architectures.
- Startup, clock configuration, low-power mode entry and exit.
- Memory map assumptions, linker script, bootloader.
- Any assembly language, which does not port across architectures.

### 2. Hardware

- Pinout and package — almost always a new footprint.
- Supply rails and sequencing requirements.
- Reset and supervisor arrangement — see [supervisor and reset IC selection](/blog/supervisor-reset-ic-selection-guide).
- Crystal or oscillator drive requirements.
- Debug and programming connector.
- Any peripheral that moves from a hard block to software, or vice versa.

### 3. Tooling

- New IDE, compiler, debugger and programmer.
- Production programming: gang programmer support, ICT fixture changes, programming algorithm availability.
- Build system and continuous integration changes.
- Licence procurement, which can be a lead-time item.

### 4. Test

- Unit and integration tests that assumed the old peripheral behaviour.
- Production test fixture and its firmware.
- Any test that measures timing.

### 5. Qualification

- EMC re-test, if clock frequencies or edge rates change.
- Safety or regulatory requalification for certified products.
- Customer notification obligations — you may owe your customers a PCN of your own, which is the mirror image of [reading a PCN or PDN](/blog/pcn-pdn-discontinuation-notice-guide).

## Choosing the replacement

Selection criteria differ from a greenfield design, because compatibility with what exists outweighs capability.

Rank candidates on:

1. **Peripheral match** for the peripherals you actually use, at the level of behaviour rather than presence: the corner cases described in [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide).
2. **Same vendor and family if possible.** A within-family move preserves the toolchain, the HAL and most of the driver code.
3. **Package and pinout proximity**, which determines whether the board is revised or redesigned.
4. **Lifecycle position.** Do not migrate onto a part that is itself mature — you will be back here in five years. Check the family's introduction date, not just its current status.
5. **Headroom.** Take more flash, RAM and pins than you need. The cost difference is small and the alternative is doing this again.
6. **Availability of the exact orderable variant**, including temperature grade and package, not just the family.

Point 4 is the one most often got wrong. That is why some teams migrate twice in a decade.

## Sequencing: put the risk first

The order matters more than the effort estimate, because the goal is to discover the expensive surprise before you have committed to a board.

| Phase | Activity | Exit criterion |
| --- | --- | --- |
| **0** | Archive the old environment | Old firmware builds and runs from the archive |
| **1** | Errata and reference-manual diff | Written list of every behavioural difference |
| **2** | **Riskiest peripheral on an evaluation board** | The hard thing works, on real silicon |
| **3** | Full firmware port on the evaluation board | Application runs against real peripherals |
| **4** | Board design and layout | Schematic review against the port's findings |
| **5** | Prototype bring-up | Boots, all interfaces functional including error paths |
| **6** | Timing and analogue verification | Meets the original's measured behaviour |
| **7** | EMC and qualification | Passes, or deltas documented |
| **8** | Pilot build with temperature soak | No environmental or lot-dependent failures |

Phase 2 is the point of the sequence. Identify the single hardest thing: a USB stack, a motor-control timer configuration, an ADC accuracy requirement, a tight interrupt deadline, and prove it on an evaluation board before the board layout starts. If it is going to fail, it should fail in week two, not after a board spin.

## Where migrations actually go wrong

The predictable problems are handled by the reference-manual diff. The damage comes from the unpredictable ones.

Undocumented dependencies. Code that works because a peripheral happened to raise flags in a particular order, or because an interrupt happened to arrive after a DMA transfer completed. Nobody wrote this down; it works on the original and the new part reorders it.

Erratum workarounds that become bugs. Firmware contains a workaround for a silicon bug in the original. The replacement does not have that bug. The workaround now does something harmful or masks a real error. This is worth searching for explicitly — grep the codebase for comments mentioning errata.

Timing that was never a specification. A software delay loop calibrated by trial and error, a protocol that works because instruction timing happened to suit it, an ISR that completes in time because the flash cache happened to be warm.

Analogue calibration constants. Carried over from the old device and silently wrong: the ADC sampling-time problem described in [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide).

The production test fixture. Often older than the firmware, undocumented, maintained by someone who has left, and tightly coupled to the old device's debug interface.

Certification scope creep. A change intended as component-only turns out to require full requalification because the approval was granted against a specific configuration.

## Reducing the odds of doing this again

Three decisions during the migration reduce the chance of a repeat:

Abstract the hardware layer properly. If the driver code is now written against an internal interface rather than directly against registers, the next migration is substantially cheaper. This is the one opportunity you will get to introduce that boundary with a business case attached.

Remove timing dependencies. Move every software-timed operation onto a hardware timer. This is good practice regardless and eliminates a whole class of migration risk permanently.

Document the peripheral assumptions. Write down, as you discover them, which peripheral behaviours the firmware relies on. That document is the input to the next migration and it will not exist unless someone writes it during this one.

Choose a part with a long remaining life, and record why it was chosen. A note in the design file saying "selected 2026, family introduced 2023, expect 10+ years" is worth a great deal to whoever inherits it.

## FAQ

### Should I migrate off an EOL microcontroller or do a last-time buy?

Check for an authorised aftermarket source first, since a continued production line eliminates the decision entirely. Failing that, a last-time buy is usually cheaper when the design is stable, remaining production life is predictable and reasonably short, and inventory value is manageable. Migration becomes the better answer when remaining product life is long, volumes are high, the design needs changes anyway, or the programming tooling has become unobtainable: a constraint that can force migration even when parts are still available.

### How long does an MCU migration take?

A within-family move preserving the toolchain and most driver code can take a few weeks. A cross-vendor or cross-architecture migration is realistically a multi-month project spanning five workstreams: firmware, hardware, tooling, test and qualification, plus a board revision and a pilot build. Certified products add requalification, which can dominate the schedule. The largest variance comes from undocumented dependencies in the existing firmware rather than from the planned work.

### What should I do first when starting an MCU migration?

Archive the existing build environment before anything else: a virtual machine containing the operating system, IDE, exact compiler version, programmer drivers and licence configuration, plus the compiled binaries for each released version and the configuration-bit or fuse settings written down explicitly. Throughout the migration you will need to compare new behaviour against old, and if you cannot build and run the original, every difference you find becomes unattributable.

### What is the biggest risk in migrating a microcontroller?

Undocumented dependencies in the existing firmware. Code frequently works because a peripheral raised flags in a particular order, or because instruction timing happened to suit a bit-banged protocol, or because an interrupt arrived after a DMA transfer completed. None of this is written down, and the replacement silicon reorders it. A close second is an erratum workaround for a bug the new device does not have, where the workaround itself becomes harmful.

### How should I sequence an MCU migration project?

Put the risk first. After archiving the old environment and completing a reference-manual and errata diff, prove the single hardest peripheral on an evaluation board before starting board layout: a USB stack, a motor-control timer configuration, a tight interrupt deadline or an ADC accuracy requirement. Only then port the full firmware, design the board, bring up prototypes, verify timing and analogue behaviour, run qualification, and finish with a pilot build soaked across temperature.

### How do I choose a replacement microcontroller?

Rank on compatibility rather than capability. Prioritise peripheral behaviour matching for the peripherals you actually use, staying within the same vendor family where possible to preserve the toolchain and driver code. Then consider package and pinout proximity, which determines whether the board is revised or redesigned. Critically, check the candidate's lifecycle position (migrating onto a mature part means repeating the exercise in a few years) and take more flash, RAM and pins than you need, since the cost difference is small.

### Do I need to requalify after an MCU migration?

Almost certainly for a certified product, because approvals are granted against a specific configuration rather than a functional description. Even outside formal certification, budget EMC re-testing if clock frequencies or edge rates change. You may also owe your own customers a change notification, which is the mirror image of the supplier notices described in our PCN and PDN guide — treat that obligation as part of the project rather than an afterthought.

### How can I make the next migration easier?

Use this one to introduce a proper hardware abstraction layer, so driver code is written against an internal interface rather than directly against registers. Move every software-timed operation onto a hardware timer, which eliminates a whole class of migration risk permanently and is better practice anyway. Document the peripheral behaviours the firmware depends on as you discover them, and record why the replacement was chosen along with the family's introduction date, so whoever inherits the design knows what they are working with.

## Related reading

Before starting, read [authorised aftermarket vs independent distribution](/blog/authorized-aftermarket-vs-independent-distributor) and [last-time buy quantity and storage](/blog/last-time-buy-quantity-and-storage) — either may make migration unnecessary. For what actually has to match between two microcontrollers, [the MCU second-sourcing guide](/blog/mcu-second-source-cross-reference-guide). For the tooling problem specifically, [legacy 8-bit MCU sourcing](/blog/legacy-8-bit-mcu-sourcing). For qualification grades, [AEC-Q100 vs industrial grade](/blog/aec-q100-vs-industrial-grade-mcu).

Send us the discontinued part number before you commit to a migration — if the line is continued in authorised production, or a within-family successor exists, the project may not be necessary.

[**Submit an RFQ**](/rfq) | [**Browse microcontrollers**](/category/microcontrollers) | [**Upload a BOM**](/bom)
