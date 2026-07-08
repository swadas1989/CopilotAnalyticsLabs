import { useEffect, useMemo, useState } from "react";
import { makeStyles, mergeClasses, shorthands } from "@fluentui/react-components";
import { ArrowLeft16Regular, ArrowRight16Regular } from "@fluentui/react-icons";
import { MicrosoftLogoWordmark } from "./App";
import {
  templates,
  templateTypeFilters,
  templatePageImpactFilters,
  pageImpactToTag,
} from "./data";
import type { TemplateTypeFilter, TemplatePageImpactFilter } from "./data";
import { logClick, logPageView, TelemetryEvents } from "./telemetry";

const TERMS_URL = "https://www.microsoft.com/en-us/legal/terms-of-use";
const PRIVACY_URL = "https://privacy.microsoft.com/en-us/privacystatement";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F8F9FC",
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    color: "#242424",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("16px", "48px"),
    backgroundColor: "#ffffff",
    ...shorthands.borderBottom("1px", "solid", "#EDEDED"),
    '@media (max-width: 600px)': {
      ...shorthands.padding("14px", "16px"),
    },
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  separator: {
    width: "1px",
    height: "20px",
    backgroundColor: "#D1D1D1",
  },
  brandTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#242424",
    whiteSpace: "nowrap",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#335CCC",
    textDecorationLine: "none",
    cursor: "pointer",
    ...shorthands.border("none"),
    backgroundColor: "transparent",
    ':hover': {
      textDecorationLine: "underline",
    },
  },
  hero: {
    background:
      "linear-gradient(113deg, rgba(240,231,255,0.7) 0%, rgba(255,255,255,1) 45%, rgba(228,243,255,0.9) 100%)",
    ...shorthands.padding("48px", "48px", "32px"),
    '@media (max-width: 600px)': {
      ...shorthands.padding("32px", "16px", "24px"),
    },
  },
  container: {
    width: "100%",
    maxWidth: "1200px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  eyebrow: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#7A49BB",
  },
  title: {
    margin: "8px 0 0",
    fontSize: "34px",
    lineHeight: "42px",
    fontWeight: 700,
    color: "#0E1726",
    '@media (max-width: 600px)': {
      fontSize: "26px",
      lineHeight: "34px",
    },
  },
  description: {
    margin: "12px 0 0",
    fontSize: "15px",
    lineHeight: "22px",
    color: "#424242",
    maxWidth: "760px",
  },
  body: {
    flex: 1,
    ...shorthands.padding("32px", "48px", "64px"),
    '@media (max-width: 600px)': {
      ...shorthands.padding("24px", "16px", "48px"),
    },
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "28px",
    rowGap: "16px",
    marginBottom: "40px",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  filterDivider: {
    width: "1px",
    height: "24px",
    backgroundColor: "#E0E0E0",
    '@media (max-width: 720px)': {
      display: "none",
    },
  },
  filterLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#616161",
    flexShrink: 0,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "13px",
    lineHeight: "18px",
    fontWeight: 500,
    color: "#424242",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    ...shorthands.padding("6px", "14px"),
    ...shorthands.borderRadius("999px"),
    ...shorthands.border("1px", "solid", "#E0E0E0"),
    ':hover': {
      backgroundColor: "#F5F5F5",
    },
  },
  chipActive: {
    color: "#ffffff",
    backgroundColor: "#335CCC",
    ...shorthands.border("1px", "solid", "#335CCC"),
    ':hover': {
      backgroundColor: "#294DAE",
    },
  },
  section: {
    marginBottom: "48px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    lineHeight: "28px",
    fontWeight: 700,
    color: "#0E1726",
  },
  sectionCount: {
    fontSize: "13px",
    color: "#8A8A8A",
    fontWeight: 500,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 2px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.overflow("hidden"),
    boxSizing: "border-box",
  },
  cardImage: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    display: "block",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    ...shorthands.padding("20px"),
    flex: 1,
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "11px",
    lineHeight: "16px",
    fontWeight: 600,
    ...shorthands.padding("2px", "8px"),
    ...shorthands.borderRadius("999px"),
    color: "#3B4A66",
    backgroundColor: "#EEF2FF",
  },
  tagType: {
    color: "#7A3EA6",
    backgroundColor: "#F5EAFE",
  },
  cardTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "22px",
    fontWeight: 600,
    color: "#0E1726",
  },
  cardDescription: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#616161",
    flex: 1,
  },
  cardButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    alignSelf: "flex-start",
    fontSize: "13px",
    fontWeight: 600,
    color: "#335CCC",
    textDecorationLine: "none",
    ...shorthands.padding("8px", "16px"),
    ...shorthands.borderRadius("8px"),
    ...shorthands.border("1px", "solid", "#D1D9F0"),
    backgroundColor: "#F5F8FF",
    ':hover': {
      backgroundColor: "#E9F0FF",
    },
  },
  empty: {
    ...shorthands.padding("48px", "0"),
    textAlign: "center",
    fontSize: "14px",
    color: "#616161",
  },
  footer: {
    backgroundColor: "#ffffff",
    ...shorthands.borderTop("1px", "solid", "#EDEDED"),
    ...shorthands.padding("32px", "48px"),
    '@media (max-width: 600px)': {
      ...shorthands.padding("24px", "16px"),
    },
  },
  footerContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "1200px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  footerLinks: {
    display: "flex",
    gap: "24px",
  },
  footerLink: {
    fontSize: "13px",
    color: "#616161",
    textDecorationLine: "none",
    ':hover': {
      textDecorationLine: "underline",
    },
  },
});

function goHome() {
  window.location.hash = "";
  window.scrollTo({ top: 0 });
}

export default function TemplatesPage() {
  const styles = useStyles();
  const [typeFilter, setTypeFilter] = useState<TemplateTypeFilter>("All");
  const [impactFilter, setImpactFilter] = useState<TemplatePageImpactFilter>("All");

  useEffect(() => {
    logPageView();
  }, []);

  const sections = useMemo(() => {
    const impactTag = pageImpactToTag(impactFilter);
    const filtered = templates.filter(
      (item) =>
        (typeFilter === "All" || item.type === typeFilter) &&
        (impactTag === null || item.impact.includes(impactTag)),
    );

    // "New and Popular" mirrors the home page logic: most recently added first, capped.
    const newAndPopular = [...filtered]
      .sort((a, b) => (b.addedOn ?? "").localeCompare(a.addedOn ?? ""))
      .slice(0, 3);

    return [
      { key: "new", title: "New and Popular", items: newAndPopular },
      {
        key: "abv",
        title: "AI Business Value templates",
        items: filtered.filter((item) => item.collections.includes("AI Business Value")),
      },
      {
        key: "m365",
        title: "Microsoft 365 templates",
        items: filtered.filter((item) => item.collections.includes("Microsoft 365")),
      },
    ];
  }, [typeFilter, impactFilter]);

  const hasResults = sections.some((section) => section.items.length > 0);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <MicrosoftLogoWordmark />
          <div className={styles.separator} />
          <span className={styles.brandTitle}>Copilot Analytics Labs</span>
        </div>
        <button className={styles.backLink} onClick={goHome}>
          <ArrowLeft16Regular fontSize={16} />
          Back to Labs
        </button>
      </nav>

      <header className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Template library</p>
          <h1 className={styles.title}>Browse all templates</h1>
          <p className={styles.description}>
            Production-ready dashboards for Copilot, GitHub Copilot, and business value analytics. Filter by
            product type and impact scope to find the right starting point.
          </p>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.container}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Type</span>
              <div className={styles.chipRow} role="group" aria-label="Filter by type">
                {templateTypeFilters.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={mergeClasses(styles.chip, typeFilter === cat && styles.chipActive)}
                    aria-pressed={typeFilter === cat}
                    onClick={() => setTypeFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterDivider} aria-hidden="true" />

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Impact</span>
              <div className={styles.chipRow} role="group" aria-label="Filter by impact">
                {templatePageImpactFilters.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={mergeClasses(styles.chip, impactFilter === cat && styles.chipActive)}
                    aria-pressed={impactFilter === cat}
                    onClick={() => setImpactFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!hasResults ? (
            <p className={styles.empty}>No templates match the selected filters.</p>
          ) : (
            sections
              .filter((section) => section.items.length > 0)
              .map((section) => (
                <section key={section.key} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <span className={styles.sectionCount}>{section.items.length}</span>
                  </div>
                  <div className={styles.grid}>
                    {section.items.map((item) => (
                      <article key={item.id} className={styles.card}>
                        {item.image ? <img className={styles.cardImage} src={item.image} alt="" /> : null}
                        <div className={styles.cardContent}>
                          <div className={styles.tagRow}>
                            <span className={mergeClasses(styles.tag, styles.tagType)}>{item.type}</span>
                            {item.impact.map((tag) => (
                              <span key={tag} className={styles.tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className={styles.cardTitle}>{item.title}</h3>
                          <p className={styles.cardDescription}>{item.description}</p>
                          <a
                            className={styles.cardButton}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => logClick(TelemetryEvents.TemplateViewClick, { template: item.id })}
                          >
                            View template
                            <ArrowRight16Regular fontSize={14} />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.brand}>
            <MicrosoftLogoWordmark />
            <div className={styles.separator} />
            <span className={styles.brandTitle}>Copilot Analytics Labs</span>
          </div>
          <div className={styles.footerLinks}>
            <a className={styles.footerLink} href={TERMS_URL} target="_blank" rel="noreferrer">
              Terms and Conditions
            </a>
            <a className={styles.footerLink} href={PRIVACY_URL} target="_blank" rel="noreferrer">
              Privacy Statement
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
