import prisma from "@/lib/db";
import { productPath } from "@/lib/seo";
import { unstable_cache } from "next/cache";
import { formatInt } from "@/lib/text";

// Robotics sourcing is a curated cross-reference layer: for each robot subsystem we
// pair the Western parts engineers design around with vetted Chinese functional
// alternatives we can source. Content is editorial (not a part-number prefix query
// like fpga-growth); we only touch the DB to surface real Chinese-brand parts that
// already live in the catalog so the "alternative" side links to genuine product pages.
//
// Launch discipline (SEO guardrail): a subsystem flips to live:true — and thereby
// becomes an indexable page in the sitemap — only when it has BOTH at least 3
// curated crossRefs AND enough catalog-listed alternative parts to clear
// MIN_COUNT_FOR_DISPLAY. Anything thinner ships as an RFQ stub from the hub, never
// as an indexable page. Do not mass-generate subsystems from this template: each
// live page must be individually researched editorial content, or the whole
// section reads as a doorway-page cluster to search engines.

const SUBSYSTEMS = [
  {
    slug: "fpga-logic",
    live: true,
    family: "Programmable logic",
    role: "Real-time motor control, encoder interfaces, sensor fusion, I/O expansion",
    title:
      "Chinese FPGA & CPLD Alternatives for Robotics Motion and Sensor Fusion",
    shortTitle: "FPGA / Programmable Logic",
    // Hand-written for SERP display: keep under ~160 chars or Google truncates it.
    metaDescription:
      "Cross-reference Lattice, Xilinx, and Altera FPGAs to vetted Gowin and Anlogic alternatives for robot motion control and sensor fusion, with RFQ support.",
    intro:
      "Programmable logic runs the hard-real-time core of a robot: closed-loop motor control, encoder and resolver interfaces, sensor fusion, and deterministic I/O. When a Western FPGA or CPLD is costly, constrained, or end-of-life, a vetted Chinese device can keep a robotics design on schedule and on budget.",
    // Western parts roboticists design around; many of these are already in our catalog.
    westernBrands: ["Lattice", "Xilinx", "AMD", "Altera", "Intel", "Microchip"],
    // Chinese alternatives we source. Counts/samples are pulled live from the catalog.
    chineseBrands: ["Gowin", "Anlogic"],
    keywords:
      "Gowin FPGA, Anlogic FPGA, Lattice MachXO alternative, Spartan-6 alternative, Chinese FPGA for robotics, motor control FPGA",
    // Each pair is framed as a functional alternative for NEW or cost-down designs,
    // never as a guaranteed drop-in. The robot-application note is the buyer hook.
    crossRefs: [
      {
        western: "Lattice MachXO2 / MachXO3",
        chinese: "Gowin GW1N (LittleBee)",
        application:
          "Instant-on glue logic, I/O expansion, and power-sequencing in compact robot control boards.",
        note: "Non-volatile, instant-on, small QFN/BGA footprints - the closest functional match to MachXO2 for new designs.",
      },
      {
        western: "Xilinx Spartan-6 (smaller densities)",
        chinese: "Gowin GW2A (Arora) / Anlogic EG4",
        application:
          "Multi-axis motor control loops, quadrature encoder decoding, and low-latency sensor fusion.",
        note: "DSP-capable logic fabric for control math; validate logic-cell count, transceivers, and timing against your design.",
      },
      {
        western: "Altera MAX / Xilinx CoolRunner CPLD",
        chinese: "Gowin GW1N (small density) / Anlogic",
        application:
          "Bus bridging, safety interlock logic, and board-level glue in actuator and gripper controllers.",
        note: "Functional CPLD-class replacement for new builds; confirm I/O count, voltage rails, and timing budget.",
      },
      {
        western: "Lattice ECP / ECP5",
        chinese: "Gowin GW2A / Anlogic EF (higher density)",
        application:
          "Vision pre-processing, LiDAR data paths, and high-bandwidth sensor aggregation.",
        note: "Higher-density fabric with memory and DSP blocks; verify SerDes, DDR support, and toolchain fit before committing.",
      },
    ],
  },
  // --- v1: planned subsystems below are not yet live. They surface on the hub as
  // "sourcing on request" entries that route to RFQ, and become full pages later. ---
  {
    slug: "control-mcu",
    live: false,
    family: "Microcontrollers",
    role: "Main control loop, motor PWM, comms, peripherals",
    title: "Chinese MCU Alternatives for Robotics Control",
    shortTitle: "Control MCU",
    intro:
      "Pin-compatible and functionally equivalent microcontrollers for the robot main loop and motor PWM - GigaDevice GD32 for STM32-class designs and WCH RISC-V for cost-down builds.",
    westernBrands: ["STMicroelectronics", "ST"],
    chineseBrands: ["GigaDevice", "WCH"],
    keywords: "GD32 STM32 alternative, WCH CH32V, Chinese MCU robotics",
    crossRefs: [],
  },
  {
    slug: "power-pmic",
    live: false,
    family: "Power management",
    role: "Rail regulation, motor supply, battery management",
    title: "Chinese Power Management Alternatives for Robotics",
    shortTitle: "Power / PMIC",
    intro:
      "LDOs, DC-DC converters, and PMICs from SGMICRO and Silergy as cost-down alternatives to TI and MPS parts across robot power rails.",
    westernBrands: ["Texas Instruments", "TI", "Monolithic Power"],
    chineseBrands: ["SG Micro", "Silergy"],
    keywords: "SGMICRO TI alternative, Silergy DC-DC, Chinese PMIC robotics",
    crossRefs: [],
  },
  {
    slug: "analog-interface",
    live: false,
    family: "Analog & interface",
    role: "Op-amps, CAN/RS-485 transceivers, signal conditioning",
    title: "Chinese Analog & Interface Alternatives for Robotics",
    shortTitle: "Analog / Interface",
    intro:
      "Op-amps and CAN / RS-485 transceivers from 3PEAK and Chipanalog as functional alternatives to TI and Maxim parts in robot signal chains and motor-network buses.",
    westernBrands: ["Texas Instruments", "TI", "Maxim"],
    chineseBrands: ["3PEAK", "Chipanalog"],
    keywords: "3PEAK TI alternative, Chinese CAN transceiver, RS-485 robotics",
    crossRefs: [],
  },
];

// Below this count a raw parts number reads as weakness rather than proof
// ("2 parts listed" undermines the page). UI must fall back to a qualitative
// "sourced on request" label instead of the number.
export const MIN_COUNT_FOR_DISPLAY = 10;

export function formatPartsListed(count) {
  if (count >= MIN_COUNT_FOR_DISPLAY)
    return `${formatInt(count)} parts listed`;
  return "Sourced on request";
}

export function getSubsystems() {
  return SUBSYSTEMS;
}

export function getLiveSubsystems() {
  return SUBSYSTEMS.filter((s) => s.live);
}

export function getSubsystemBySlug(slug) {
  return SUBSYSTEMS.find((s) => s.slug === slug) || null;
}

function chineseBrandWhere(subsystem) {
  return {
    AND: [
      { duplicateOfId: null },
      {
        OR: subsystem.chineseBrands.map((brand) => ({
          manufacturer: { contains: brand, mode: "insensitive" },
        })),
      },
    ],
  };
}

// Live catalog signal for a subsystem's Chinese-alternative side: how many of those
// brand's parts we already list, and a handful that link to real product pages.
export async function getSubsystemStats(subsystem) {
  const where = chineseBrandWhere(subsystem);
  const [available, samples] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: {
        partNumber: true,
        manufacturer: true,
        description: true,
        packageType: true,
        stock: true,
        minPrice: true,
        status: true,
        category: { select: { slug: true, name: true } },
      },
      orderBy: [
        { stock: "desc" },
        { qualityScore: "desc" },
        { partNumber: "asc" },
      ],
      take: 12,
    }),
  ]);

  return {
    ...subsystem,
    available,
    samples: samples.map((product) => ({
      ...product,
      href: productPath(product.partNumber, product.manufacturer),
    })),
  };
}

// Shared per-slug cache so the hub and detail pages hit the DB at most once per
// subsystem per hour despite both being force-dynamic. unstable_cache keys on the
// slug argument automatically.
export const getCachedSubsystemStats = unstable_cache(
  async (slug) => {
    const subsystem = getSubsystemBySlug(slug);
    return subsystem ? getSubsystemStats(subsystem) : null;
  },
  ["robotics-subsystem-stats"],
  { revalidate: 3600, tags: ["robotics-sourcing"] },
);
