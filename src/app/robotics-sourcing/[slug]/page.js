import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SITE_NAME,
  SITE_URL,
  productPath,
  getAvailabilityText,
  hasConfirmedStock,
} from "@/lib/seo";
import {
  getSubsystemBySlug,
  getCachedSubsystemStats,
  MIN_COUNT_FOR_DISPLAY,
} from "@/lib/robotics-growth";

// On-demand ISR: built on first hit, then revalidated hourly.
export const revalidate = 3600;

export async function generateStaticParams() {
  // Empty list = on-demand ISR: pages build on first request (no DB needed at
  // build time), then revalidate hourly. Same pattern as fpga-sourcing/[slug].
  // Only live subsystems have a real page; the rest route to RFQ from the hub.
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const subsystem = getSubsystemBySlug(slug);
  if (!subsystem || !subsystem.live)
    return { title: "Robotics Subsystem Not Found" };

  const description =
    subsystem.metaDescription ||
    `Cross-reference Western parts to ${subsystem.chineseBrands.join(" and ")} alternatives with RFQ support for stock, package, lead time, and MOQ.`;
  const canonical = `${SITE_URL}/robotics-sourcing/${subsystem.slug}`;

  return {
    title: subsystem.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${subsystem.title} | ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: subsystem.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${subsystem.title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

function statusLabel(status) {
  if (status === "eol") return "EOL";
  if (status === "nrnd") return "NRND";
  return (status || "active").toUpperCase();
}

export default async function RoboticsSubsystemPage({ params }) {
  const { slug } = await params;
  const base = getSubsystemBySlug(slug);
  if (!base || !base.live) notFound();

  const subsystem = await getCachedSubsystemStats(slug);
  if (!subsystem) notFound();
  const { available, samples, crossRefs } = subsystem;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Robotics Component Sourcing",
        item: `${SITE_URL}/robotics-sourcing`,
      },
      { "@type": "ListItem", position: 3, name: subsystem.shortTitle },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: subsystem.title,
    numberOfItems: available,
    itemListElement: samples.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.partNumber,
      url: `${SITE_URL}${productPath(product.partNumber, product.manufacturer)}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div
        className="container"
        style={{
          paddingTop: "var(--space-lg)",
          paddingBottom: "var(--space-3xl)",
        }}
      >
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">/</span>
          <Link href="/robotics-sourcing">Robotics Sourcing</Link>
          <span className="separator">/</span>
          <span style={{ color: "var(--color-text-primary)" }}>
            {subsystem.shortTitle}
          </span>
        </nav>

        <section className="series-detail-hero">
          <div>
            <span className="series-family">{subsystem.family}</span>
            <h1>{subsystem.title}</h1>
            <p>{subsystem.intro}</p>
            <div className="series-intent-row">
              {subsystem.keywords.split(",").map((term) => (
                <span key={term.trim()}>{term.trim()}</span>
              ))}
            </div>
          </div>
          <aside className="series-detail-card">
            <div>
              <strong>{subsystem.chineseBrands.join(" / ")}</strong>
              <span>alternative brands sourced</span>
            </div>
            <div>
              {available >= MIN_COUNT_FOR_DISPLAY ? (
                <>
                  <strong>{available.toLocaleString()}</strong>
                  <span>alternative parts listed</span>
                </>
              ) : (
                <>
                  <strong>RFQ</strong>
                  <span>stock confirmed on request</span>
                </>
              )}
            </div>
            <div>
              <strong>{crossRefs.length}</strong>
              <span>cross-reference families</span>
            </div>
            <Link
              href={`/rfq?category=${encodeURIComponent(subsystem.shortTitle + " Alternatives")}`}
              className="btn btn-primary"
            >
              Request a Cross-Reference
            </Link>
          </aside>
        </section>

        <section className="product-procurement-strip">
          <div>
            <strong>Send the Western part you want to replace.</strong>
            <span>
              {SITE_NAME} returns the closest{" "}
              {subsystem.chineseBrands.join(" / ")} alternative with the
              parameters you must re-verify, plus stock, lead time, and MOQ.
            </span>
          </div>
          <div className="product-procurement-actions">
            <Link
              href={`/rfq?category=${encodeURIComponent(subsystem.shortTitle + " Alternatives")}`}
              className="btn btn-primary btn-sm"
            >
              Send RFQ
            </Link>
            <Link href="/bom" className="btn btn-secondary btn-sm">
              Upload BOM
            </Link>
          </div>
        </section>

        <section className="section" style={{ paddingTop: "var(--space-2xl)" }}>
          <h2 className="section-title">Western to Chinese cross-reference</h2>
          <p
            className="section-subtitle"
            style={{ marginBottom: "var(--space-lg)" }}
          >
            Functional alternatives for new and cost-down robotics designs.
            These are evaluation starting points, not guaranteed drop-ins -
            always re-verify the flagged parameters against your design.
          </p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Western part (your design)</th>
                  <th>Chinese alternative (we source)</th>
                  <th>Robot application</th>
                  <th>What to re-verify</th>
                </tr>
              </thead>
              <tbody>
                {crossRefs.map((ref) => (
                  <tr key={ref.western}>
                    <td className="part-number">{ref.western}</td>
                    <td>
                      <strong>{ref.chinese}</strong>
                    </td>
                    <td style={{ maxWidth: "320px" }}>{ref.application}</td>
                    <td
                      style={{
                        maxWidth: "320px",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {ref.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {samples.length > 0 && (
          <section
            className="section"
            style={{ paddingTop: "var(--space-xl)" }}
          >
            <h2 className="section-title">
              {subsystem.chineseBrands.join(" / ")} parts in the catalog
            </h2>
            <p
              className="section-subtitle"
              style={{ marginBottom: "var(--space-lg)" }}
            >
              Alternative-side parts we already list. Final stock, lot, and
              price are confirmed by RFQ.
            </p>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Manufacturer</th>
                    <th>Description</th>
                    <th>Package</th>
                    <th>Availability</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((product) => (
                    <tr key={product.partNumber}>
                      <td className="part-number">
                        <Link href={product.href}>{product.partNumber}</Link>
                      </td>
                      <td>{product.manufacturer}</td>
                      <td
                        style={{
                          maxWidth: "320px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.description ||
                          `${product.partNumber} programmable logic device`}
                      </td>
                      <td>{product.packageType || "Confirm"}</td>
                      <td>
                        <span
                          className={
                            hasConfirmedStock(product)
                              ? "text-success"
                              : "text-muted"
                          }
                        >
                          {getAvailabilityText(product)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            product.status === "active"
                              ? "badge-success"
                              : product.status === "obsolete"
                                ? "badge-danger"
                                : product.status === "eol"
                                  ? "badge-warning"
                                  : "badge-info"
                          }`}
                        >
                          {statusLabel(product.status)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/rfq?part=${encodeURIComponent(product.partNumber)}`}
                          className="btn btn-outline btn-sm"
                        >
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="series-risk-section">
          <h2>Evaluating a Chinese FPGA alternative for robotics</h2>
          <div className="series-risk-grid">
            <div>
              <h3>Logic, timing, and DSP budget</h3>
              <p>
                Confirm logic-cell count, embedded memory, DSP/multiplier
                blocks, and that your control-loop timing closes in the target
                device before redesigning the board.
              </p>
            </div>
            <div>
              <h3>Toolchain and IP</h3>
              <p>
                Gowin and Anlogic ship their own design suites. Budget time to
                port constraints, IP cores, and timing closure - the RTL moves,
                the flow does not.
              </p>
            </div>
            <div>
              <h3>Supply and lifecycle</h3>
              <p>
                Ask for date code, packaging, English documentation, and a
                lifecycle signal so the alternative does not become the next
                obsolescence problem in your robot platform.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
