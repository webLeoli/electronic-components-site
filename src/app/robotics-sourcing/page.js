import Link from "next/link";
import { formatCount } from '@/lib/text';
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import {
  getSubsystems,
  getCachedSubsystemStats,
  formatPartsListed,
  MIN_COUNT_FOR_DISPLAY,
} from "@/lib/robotics-growth";

// ISR: regenerate at most hourly.
export const revalidate = 3600;

export const metadata = {
  title: "Chinese Component Alternatives for Robotics Design",
  // Keep under ~160 chars for full SERP display.
  description:
    "Source vetted Chinese alternatives for the FPGA, MCU, power, and analog parts in your robot BOM, with Western-to-Chinese cross-references and RFQ support.",
  alternates: { canonical: `${SITE_URL}/robotics-sourcing` },
  openGraph: {
    title: `Robotics Component Sourcing | ${SITE_NAME}`,
    description:
      "Cross-reference the Western parts in your robot design to vetted Chinese alternatives for FPGA, MCU, power, and analog - with RFQ and BOM support.",
    url: `${SITE_URL}/robotics-sourcing`,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} Robotics Sourcing`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Robotics Component Sourcing | ${SITE_NAME}`,
    description:
      "Vetted Chinese alternatives for the parts in your robot BOM, with RFQ support.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

function getLandingData() {
  return Promise.all(
    getSubsystems().map((subsystem) => getCachedSubsystemStats(subsystem.slug)),
  );
}


export default async function RoboticsSourcingPage() {
  const subsystems = await getLandingData();
  const totalAlternatives = subsystems.reduce((sum, s) => sum + s.available, 0);
  const liveCount = subsystems.filter((s) => s.live).length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Robotics Component Sourcing" },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Robotics Component Sourcing | ${SITE_NAME}`,
    url: `${SITE_URL}/robotics-sourcing`,
    description: metadata.description,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: subsystems.length,
      itemListElement: subsystems.map((s, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: s.title,
        ...(s.live ? { url: `${SITE_URL}/robotics-sourcing/${s.slug}` } : {}),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <section className="growth-hero">
        <div className="container growth-hero-grid">
          <div>
            <div className="eyebrow">Robotics BOM alternative sourcing</div>
            <h1>Chinese component alternatives for your robot design</h1>
            <p>
              Building a robot and need to de-risk a costly, constrained, or
              end-of-life part? We cross-reference the Western FPGAs, MCUs,
              power, and analog devices in your BOM to vetted Chinese functional
              alternatives - then verify stock, package, lead time, and MOQ by
              RFQ.
            </p>
            <form
              className="hero-search growth-search"
              action="/search"
              method="GET"
              role="search"
            >
              <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="input"
                type="search"
                name="q"
                placeholder="Search GW1N, GD32, SGM, MachXO2..."
              />
              <button type="submit" className="search-btn">
                Search Parts
              </button>
            </form>
            <div className="growth-hero-actions">
              <Link
                href="/rfq?category=Robotics%20Alternatives"
                className="btn btn-primary btn-lg"
              >
                Request a Cross-Reference
              </Link>
              <Link href="/bom" className="btn btn-secondary btn-lg">
                Upload Robot BOM
              </Link>
            </div>
          </div>

          <aside className="growth-scorecard">
            <div>
              <span>
                {totalAlternatives >= MIN_COUNT_FOR_DISPLAY
                  ? formatCount(totalAlternatives)
                  : "RFQ"}
              </span>
              <strong>Chinese alternative parts listed</strong>
            </div>
            <div>
              <span>{subsystems.length}</span>
              <strong>robot subsystems mapped</strong>
            </div>
            <div>
              <span>{liveCount}</span>
              <strong>cross-reference guides live</strong>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                Cross-reference by robot subsystem
              </h2>
              <p className="section-subtitle">
                Each subsystem maps the Western parts you design around to the
                Chinese alternatives we source.
              </p>
            </div>
          </div>

          <div className="series-grid">
            {subsystems.map((subsystem) =>
              subsystem.live ? (
                <Link
                  href={`/robotics-sourcing/${subsystem.slug}`}
                  key={subsystem.slug}
                  className="series-card"
                >
                  <span className="series-family">{subsystem.family}</span>
                  <h2>{subsystem.shortTitle}</h2>
                  <p>{subsystem.role}</p>
                  <div className="series-card-stats">
                    <span>{subsystem.chineseBrands.join(" / ")}</span>
                    <span>{formatPartsListed(subsystem.available)}</span>
                  </div>
                </Link>
              ) : (
                <Link
                  href={`/rfq?category=${encodeURIComponent(subsystem.shortTitle + " Alternatives")}`}
                  key={subsystem.slug}
                  className="series-card"
                  style={{ opacity: 0.92 }}
                >
                  <span className="series-family">{subsystem.family}</span>
                  <h2>{subsystem.shortTitle}</h2>
                  <p>{subsystem.role}</p>
                  <div className="series-card-stats">
                    <span>{subsystem.chineseBrands.join(" / ")}</span>
                    <span>Sourcing on request</span>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        className="section"
        style={{ background: "var(--color-bg-secondary)" }}
      >
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                How we de-risk a Chinese alternative
              </h2>
              <p className="section-subtitle">
                An alternative only helps if it survives your design review.
                Here is what we check first.
              </p>
            </div>
          </div>
          <div className="series-risk-grid">
            <div>
              <h3>Functional fit, not a blind swap</h3>
              <p>
                We map alternatives by function and package, then flag the
                parameters you must re-verify - logic-cell count, timing,
                voltage rails, I/O, and toolchain - against your specific
                design. A cross-reference is a starting point for evaluation,
                never a guaranteed drop-in.
              </p>
            </div>
            <div>
              <h3>Authenticity & documentation</h3>
              <p>
                We confirm manufacturer provenance, request English datasheets,
                and check date code, packaging, and RoHS status before any order
                commitment - the same lot-level diligence we apply to obsolete
                sourcing.
              </p>
            </div>
            <div>
              <h3>Compliance is your call</h3>
              <p>
                We source commercial and industrial-grade commodity components
                only. Confirming that a part and its end use comply with the
                export-control and import rules of your jurisdiction remains the
                buyer&apos;s responsibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="product-procurement-strip">
        <div>
          <strong>
            Have a robot BOM with parts you want to cost down or de-risk?
          </strong>
          <span>
            Send the BOM or a single part number and our sourcing team will
            return Chinese alternatives with availability and lead time.
          </span>
        </div>
        <div className="product-procurement-actions">
          <Link
            href="/rfq?category=Robotics%20Alternatives"
            className="btn btn-primary btn-sm"
          >
            Send RFQ
          </Link>
          <Link href="/bom" className="btn btn-secondary btn-sm">
            Upload BOM
          </Link>
        </div>
      </section>
    </>
  );
}
