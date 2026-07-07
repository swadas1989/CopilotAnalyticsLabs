import { useEffect, useMemo, useRef, useState } from "react";
import { makeStyles, mergeClasses, shorthands } from "@fluentui/react-components";
import {
  ArrowRight16Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  CompassNorthwest24Regular,
  DataBarVerticalAscending24Regular,
  DataTrending24Regular,
  DocumentBulletList24Regular,
  Eye16Regular,
  HatGraduation24Regular,
  PersonFeedback20Regular,
  Sparkle24Regular,
  Star16Filled,
  Toolbox24Regular,
} from "@fluentui/react-icons";
import { research, resources, templates, templateImpactFilters } from "./data";
import type { TemplateImpactFilter } from "./data";
import { logClick, logPageView, TelemetryEvents } from "./telemetry";
import { VoteBar } from "./VoteBar";

const VIVA_INSIGHTS_URL = "https://analysis.insights.cloud.microsoft/";
const WHATS_COMING_URL = "https://www.microsoft.com/en-us/microsoft-365/roadmap?filters=Microsoft%20Viva";
const FEEDBACK_URL = "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR0To00bktq1Ilw6hJ9BCmj5UNTg1QzM4UUs1SzNFM08yUFhVTlJDSDlWUC4u";
const TERMS_URL = "https://www.microsoft.com/en-us/legal/terms-of-use";
const PRIVACY_URL = "https://privacy.microsoft.com/en-us/privacystatement";


const sectionTabs = [
  { id: "whats-new", label: "What's new" },
  { id: "templates", label: "Templates" },
  { id: "sample-code", label: "Sample code" },
  { id: "research", label: "Research & Playbooks" },
  { id: "product-roadmap", label: "Roadmap" },
] as const;

// Maximum number of "What's new" cards to show per type.
const MAX_FEATURED_PER_KIND = 3;

type FeaturedKind = "Template" | "Research" | "Playbook";

const featuredToneByKind: Record<FeaturedKind, "green" | "teal" | "purple"> = {
  Template: "green",
  Research: "teal",
  Playbook: "purple",
};

interface FeaturedItem {
  id: string;
  sourceId: string;
  kind: FeaturedKind;
  tone: "green" | "teal" | "purple";
  title: string;
  description: string;
  url: string;
  addedOn?: string;
}

// Turns an ISO date into a friendly relative string (e.g. "2 days ago").
function formatRelativeDate(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffDays = Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

// Most recently added items grouped by type, newest first, capped per type.
function buildFeaturedItems(): FeaturedItem[] {
  const byDateDesc = (a: { addedOn?: string }, b: { addedOn?: string }) =>
    (b.addedOn ?? "").localeCompare(a.addedOn ?? "");

  const groups: { kind: FeaturedKind; items: { id: string; title: string; description: string; url: string; addedOn?: string }[] }[] = [
    { kind: "Template", items: templates },
    { kind: "Research", items: research.filter((item) => item.kind === "Research") },
    { kind: "Playbook", items: research.filter((item) => item.kind === "Playbook") },
  ];

  return groups
    .flatMap(({ kind, items }) =>
      [...items]
        .sort(byDateDesc)
        .slice(0, MAX_FEATURED_PER_KIND)
        .map<FeaturedItem>((item) => ({
          id: `${kind}-${item.id}`,
          sourceId: item.id,
          kind,
          tone: featuredToneByKind[kind],
          title: item.title,
          description: item.description,
          url: item.url,
          addedOn: item.addedOn,
        })),
    )
    .sort(byDateDesc);
}

const heroValues = [
  {
    label: "Build",
    title: "Build with ready-to-use assets",
    description: "Templates, code, and prompts to plug into your own data.",
    Icon: Toolbox24Regular,
    color: "#3F6CE9",
    gradient: "linear-gradient(96.15deg, #764FF5 12.38%, #3F6CE9 39.4%, #20BBC6 96.13%)",
  },
  {
    label: "Learn",
    title: "Learn from proven deployments",
    description: "Playbooks, research, and demos from real customer rollouts.",
    Icon: HatGraduation24Regular,
    color: "#C8641E",
    gradient: "linear-gradient(94.04deg, #FFB900 -54.86%, #F4364B 94.97%)",
  },
  {
    label: "Explore",
    title: "See what's new and next",
    description: "A preview of latest drops and upcoming capabilities.",
    Icon: CompassNorthwest24Regular,
    color: "#7A49BB",
    gradient: "linear-gradient(90.37deg, #FFB3BA -94.19%, #8560C5 99.51%)",
  },
];

const templateOrder = [
  "aio-dashboard",
  "cowork-value-estimator",
  "github-copilot-impact-org",
  "ai-business-value",
  "m365-copilot-personal",
  "m365-app-usage",
  "superuser-impact",
];

const templateMeta: Record<
  string,
  {
    featured?: boolean;
    badges?: { text: string; tone: "green" | "rose" }[];
    stats?: { value: string; label: string }[];
  }
> = {
  "aio-dashboard": {
    featured: true,
    badges: [{ text: "Featured", tone: "green" }],
    stats: [
      { value: "—", label: "Stars" },
      { value: "—", label: "Watching" },
    ],
  },
  "cowork-value-estimator": {
    badges: [{ text: "Featured", tone: "green" }],
  },
  "m365-copilot-personal": {},
};

const resourceMeta: Record<
  string,
  {
    featured?: boolean;
    badges?: { text: string; tone: "green" | "blue" }[];
    accent: string;
    color: string;
  }
> = {
  "viva-insights-essentials": {
    featured: true,
    badges: [
      { text: "Featured", tone: "green" },
      { text: "Starter kit", tone: "blue" },
    ],
    accent: "linear-gradient(135deg, #FFF2D8 0%, #EAE6FF 100%)",
    color: "#7A4CE3",
  },
  "advanced-analytics": {
    accent: "linear-gradient(135deg, #F2EAFF 0%, #FFF3DA 100%)",
    color: "#7A4CE3",
  },
  "copilot-analytics": {
    accent: "linear-gradient(135deg, #FFF1F7 0%, #EAF8FF 100%)",
    color: "#E35BA3",
  },
  "frontier-analytics": {
    accent: "linear-gradient(135deg, #EAF5FF 0%, #FFF0D6 100%)",
    color: "#3F6CE9",
  },
  "network-analysis": {
    accent: "linear-gradient(135deg, #FFF7DF 0%, #E8F5FF 100%)",
    color: "#2976A8",
  },
};

const researchOrder = [
  "adoption-playbook",
  "getting-started-custom-analysis",
  "work-trend-index-2026",
  "cowork-value-estimator",
  "copilot-advanced-analytics",
];

const researchTags: Record<string, { text: string; tone: string }[]> = {
  "adoption-playbook": [
    { text: "Adoption", tone: "green" },
    { text: "Org wide", tone: "purple" },
  ],
  "getting-started-custom-analysis": [
    { text: "Methodology", tone: "rose" },
    { text: "Org wide", tone: "purple" },
  ],
  "work-trend-index-2026": [
    { text: "Research", tone: "teal" },
    { text: "Industry wide", tone: "amber" },
  ],
  "cowork-value-estimator": [
    { text: "Methodology", tone: "rose" },
    { text: "Cowork", tone: "teal" },
  ],
  "copilot-advanced-analytics": [
    { text: "Impact", tone: "blue" },
    { text: "Advanced", tone: "slate" },
  ],
};

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  details?: string[];
}

const roadmapItems: RoadmapItem[] = [
  {
    id: "agent-analytics",
    title: "Agent Analytics",
    description:
      "Comprehensive analytics for AI agents — dashboards, metrics, lifecycle management, and augmented capacity insights.",
    icon: DataTrending24Regular,
    details: [
      "Agent 365 Dashboard",
      "Agent metrics in advanced reporting",
      "Lifecycle, sharing & promotion",
      "Augmented capacity & AI teammates",
    ],
  },
  {
    id: "value-and-roi",
    title: "Value and ROI",
    description:
      "Quantify and communicate the business value and return on investment of AI across your organization.",
    icon: DataBarVerticalAscending24Regular,
    details: [
      "Copilot credits & consumption metrics",
      "Task & intent analytics",
      "Inferred satisfaction & impact",
      "Deeper Cowork & Work IQ measurement",
    ],
  },
  {
    id: "insights-agent",
    title: "Insights Agent",
    description:
      "AI-powered agent that surfaces proactive insights and recommendations from your analytics data.",
    icon: Sparkle24Regular,
    details: [
      "Insights Agent — General Availability",
      "Intelligent summaries",
      "Build-your-own custom dashboards",
    ],
  },
  {
    id: "trust-access-foundation",
    title: "Trust, Access and Foundation",
    description:
      "Foundational capabilities for security, governance, access control, and trust across the analytics platform.",
    icon: DocumentBulletList24Regular,
    details: [
      "Identified user-level export",
      "Programmatic export via Fabric",
      "Scoped CDB/ADB partitions, flexible time ranges, tenant metric customization and GM/CXO access fixes",
    ],
  },
];

const filterCategories = [
  "Featured",
  "AI impact",
  "Org-wide",
  "Individual",
  "Manager",
  "Industry",
] as const;

type FilterCategory = (typeof filterCategories)[number];

const codeCategory: Record<string, FilterCategory> = {
  "viva-insights-essentials": "AI impact",
  "advanced-analytics": "AI impact",
  "copilot-analytics": "AI impact",
  "frontier-analytics": "Org-wide",
  "network-analysis": "Org-wide",
};

const VIEW_ALL_CODE_URL = "https://microsoft.github.io/viva-insights-sample-code/";
const VIEW_ALL_RESEARCH_URL = "https://adoption.microsoft.com/en-us/copilot/";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    width: "100%",
    maxWidth: "1440px",
    ...shorthands.margin("0", "auto"),
    backgroundColor: "#ffffff",
    color: "#242424",
    fontFamily: '"Segoe UI", "Segoe UI Web (West European)", system-ui, sans-serif',
  },
  nav: {
    position: "sticky",
    top: "0",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "48px",
    backgroundColor: "#ffffff",
    ...shorthands.padding("0", "56px"),
    boxShadow: "0 1px 0 rgba(0, 0, 0, 0.08)",
    '@media (max-width: 1200px)': {
      ...shorthands.padding("0", "80px"),
    },
    '@media (max-width: 600px)': {
      height: "auto",
      flexDirection: "column",
      alignItems: "stretch",
      ...shorthands.padding("8px", "16px"),
      gap: "4px",
    },
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minHeight: "48px",
    color: "#424242",
    ...shorthands.padding("0", "8px", "1px"),
  },
  separator: {
    width: "1px",
    height: "16px",
    backgroundColor: "#C8C8C8",
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    color: "#424242",
    whiteSpace: "nowrap",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minHeight: "48px",
    ...shorthands.padding("0", "40px"),
    '@media (max-width: 600px)': {
      ...shorthands.padding("0"),
      justifyContent: "flex-start",
      overflowX: "auto",
      gap: "12px",
      minHeight: "36px",
    },
  },
  navLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#242424",
    fontSize: "14px",
    lineHeight: "20px",
    textDecorationLine: "none",
    whiteSpace: "nowrap",
    ':hover': {
      color: "#0E1726",
    },
  },
  navIconOnly: {
    width: "28px",
    height: "28px",
    justifyContent: "center",
    ...shorthands.borderRadius("999px"),
    ':hover': {
      backgroundColor: "#F5F5F5",
    },
  },
  hero: {
    position: "relative",
    minHeight: "auto",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    '@media (max-width: 600px)': {
      minHeight: "auto",
    },
  },
  heroRibbon: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.svg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    '@media (max-width: 600px)': {
      opacity: 0.5,
    },
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "812px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "40px",
    ...shorthands.padding("48px", "0", "56px"),
    '@media (max-width: 1200px)': {
      maxWidth: "100%",
      ...shorthands.padding("48px", "80px", "56px"),
    },
    '@media (max-width: 600px)': {
      ...shorthands.padding("40px", "16px", "36px"),
      gap: "24px",
    },
  },
  heroHeader: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    textAlign: "center",
  },
  heroTitle: {
    margin: 0,
    maxWidth: "730px",
    fontSize: "40px",
    lineHeight: "56px",
    fontWeight: 600,
    color: "#0E1726",
    whiteSpace: "nowrap",
    '@media (max-width: 600px)': {
      fontSize: "26px",
      lineHeight: "34px",
      whiteSpace: "normal",
    },
  },
  heroSubtitle: {
    margin: 0,
    maxWidth: "610px",
    fontSize: "16px",
    lineHeight: "22px",
    color: "#424242",
    '@media (max-width: 600px)': {
      fontSize: "14px",
      lineHeight: "20px",
      whiteSpace: "normal",
    },
  },
  valuesShell: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    ...shorthands.borderRadius("24px"),
    backgroundColor: "rgba(210, 225, 255, 0.5)",
    ...shorthands.padding("10px"),
    boxSizing: "border-box",
    '@media (max-width: 600px)': {
      ...shorthands.borderRadius("16px"),
      ...shorthands.padding("8px"),
    },
  },
  valuesPanel: {
    width: "100%",
    maxWidth: "896px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    backgroundColor: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(10px)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("24px"),
    boxSizing: "border-box",
    overflow: "hidden",
    '@media (max-width: 600px)': {
      ...shorthands.padding("16px"),
      gap: "16px",
    },
  },
  valuesGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "24px",
    '@media (max-width: 900px)': {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: "1fr",
      gap: "20px",
    },
  },
  valueCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  },
  valueIcon: {
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius("20px"),
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)",
    '@media (max-width: 600px)': {
      width: "48px",
      height: "48px",
      ...shorthands.borderRadius("14px"),
    },
  },
  valueTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 600,
    color: "#000000",
    whiteSpace: "normal",
    '@media (max-width: 600px)': {
      fontSize: "14px",
      lineHeight: "20px",
    },
  },
  valueDescription: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#616161",
    display: "-webkit-box",
    WebkitLineClamp: "3",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    '@media (max-width: 600px)': {
      WebkitLineClamp: "4",
      fontSize: "13px",
      lineHeight: "18px",
    },
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "32px",
    backgroundColor: "#335CCC",
    color: "#ffffff",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    textDecorationLine: "none",
    ...shorthands.padding("6px", "12px"),
    ...shorthands.borderRadius("4px"),
    ...shorthands.border("none"),
    ':hover': {
      backgroundColor: "#294DAE",
    },
    '@media (max-width: 600px)': {
      minHeight: "44px",
      ...shorthands.padding("10px", "16px"),
    },
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "32px",
    backgroundColor: "#ffffff",
    color: "#242424",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    textDecorationLine: "none",
    ...shorthands.padding("5px", "12px"),
    ...shorthands.borderRadius("4px"),
    ...shorthands.border("1px", "solid", "#D1D1D1"),
    ':hover': {
      backgroundColor: "#F7F7F7",
    },
    '@media (max-width: 600px)': {
      minHeight: "44px",
      ...shorthands.padding("10px", "16px"),
    },
  },
  tabsShell: {
    position: "sticky",
    top: "48px",
    zIndex: 90,
    backgroundColor: "#ffffff",
    boxShadow: "0px 0px 2px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.14)",
    '@media (max-width: 600px)': {
      top: "96px",
    },
  },
  tabsRail: {
    display: "none",
  },
  tabsList: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    maxWidth: "928px",
    marginLeft: "auto",
    marginRight: "auto",
    ...shorthands.padding("4px", "0", "0"),
    '@media (max-width: 1200px)': {
      ...shorthands.padding("4px", "80px", "0"),
      maxWidth: "100%",
    },
    '@media (max-width: 600px)': {
      ...shorthands.padding("4px", "16px", "0"),
      gap: "8px",
      overflowX: "auto",
    },
  },
  tabButton: {
    position: "relative",
    height: "44px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "transparent",
    color: "#424242",
    fontSize: "14px",
    lineHeight: "20px",
    fontFamily: '"Segoe UI", "Segoe UI Web (West European)", system-ui, sans-serif',
    ...shorthands.padding("12px", "10px"),
    ...shorthands.borderStyle("none"),
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tabButtonActive: {
    color: "#242424",
    fontWeight: 600,
    ':after': {
      content: '""',
      position: "absolute",
      left: "0",
      right: "0",
      bottom: "0",
      height: "3px",
      ...shorthands.borderRadius("999px"),
      background: "linear-gradient(137deg, #764FF5 13%, #3F6CE9 43%, #20BBC6 100%)",
    },
  },
  section: {
    ...shorthands.padding("64px", "256px"),
    '@media (max-width: 1200px)': {
      ...shorthands.padding("64px", "80px"),
    },
    '@media (max-width: 600px)': {
      ...shorthands.padding("36px", "16px"),
    },
  },
  sectionTemplateBg: {
    background:
      "linear-gradient(113deg, rgba(240,231,255,0.7) 0%, rgba(255,255,255,1) 40%, rgba(228,243,255,0.9) 100%)",
  },
  sectionCodeBg: {
    background:
      "linear-gradient(113deg, rgba(248,230,255,0.7) 0%, rgba(255,255,255,1) 48%, rgba(255,245,214,0.85) 100%)",
  },
  sectionResearchBg: {
    background:
      "linear-gradient(180deg, rgba(255,252,244,1) 0%, rgba(250,247,237,1) 100%)",
  },
  sectionContent: {
    width: "100%",
    maxWidth: "928px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "48px",
    '@media (max-width: 600px)': {
      gap: "32px",
    },
  },
  sectionTitleArea: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  eyebrow: {
    width: "fit-content",
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    backgroundImage: "linear-gradient(137deg, #764FF5 13%, #3F6CE9 43%, #20BBC6 100%)",
    color: "transparent",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sectionHeadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    '@media (max-width: 600px)': {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },
  sectionHeading: {
    margin: 0,
    fontSize: "32px",
    lineHeight: "40px",
    fontWeight: 600,
    color: "#0E1726",
    letterSpacing: "-0.02em",
    '@media (max-width: 600px)': {
      fontSize: "28px",
      lineHeight: "34px",
    },
  },
  sectionDescription: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "22px",
    color: "#242424",
    maxWidth: "760px",
    '@media (max-width: 600px)': {
      fontSize: "14px",
      lineHeight: "20px",
    },
  },
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "24px",
    '@media (max-width: 900px)': {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: "1fr",
    },
  },
  templateCard: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 2px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("24px"),
    boxSizing: "border-box",
    '@media (max-width: 600px)': {
      minHeight: "auto",
      ...shorthands.padding("16px"),
      gap: "16px",
    },
  },
  templateCardFeatured: {
    gridColumn: "span 2",
    flexDirection: "row",
    alignItems: "stretch",
    '@media (max-width: 900px)': {
      gridColumn: "span 2",
    },
    '@media (max-width: 600px)': {
      gridColumn: "span 1",
      flexDirection: "column",
    },
  },
  templateCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    minWidth: 0,
  },
  templateCardImage: {
    width: "100%",
    height: "92px",
    objectFit: "cover",
    display: "block",
    backgroundColor: "#F5F5F5",
    ...shorthands.borderRadius("12px"),
  },
  templateCardImageFeatured: {
    width: "42%",
    height: "auto",
    minHeight: "268px",
    alignSelf: "stretch",
    '@media (max-width: 600px)': {
      width: "100%",
      minHeight: "180px",
    },
  },
  templateBody: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "16px",
    flex: 1,
  },
  statsDivider: {
    width: "100%",
    height: "0.5px",
    backgroundColor: "#E0E0E0",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  badgeRowFeatured: {
    gap: "16px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    ...shorthands.padding("4px", "6px"),
    ...shorthands.borderRadius("100px"),
  },
  badgeGreen: {
    color: "#0E700E",
    backgroundColor: "#F1FAF1",
  },
  badgeRose: {
    color: "#B33A55",
    backgroundColor: "#FDEBF1",
  },
  badgeBlue: {
    color: "#0F6CBD",
    backgroundColor: "#EBF3FC",
  },
  templateTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 600,
    color: "#000000",
  },
  templateDescription: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "18px",
    color: "#616161",
  },
  statsRow: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  statBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statValue: {
    fontSize: "20px",
    lineHeight: "24px",
    fontWeight: 600,
    color: "#0E1726",
  },
  statLabel: {
    fontSize: "12px",
    lineHeight: "16px",
    color: "#616161",
  },
  codeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gridTemplateRows: "1fr 1fr 1fr",
    gap: "20px",
    '@media (max-width: 600px)': {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "auto",
    },
  },
  codeCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 2px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("24px"),
    boxSizing: "border-box",
    '@media (max-width: 600px)': {
      flexDirection: "column",
      alignItems: "flex-start",
      ...shorthands.padding("16px"),
      gap: "12px",
    },
  },
  codeCardFeatured: {
    gridRow: "span 2",
    flexDirection: "column",
    alignItems: "flex-start",
    ...shorthands.padding("24px"),
    gap: "16px",
    '@media (max-width: 600px)': {
      height: "auto",
    },
  },
  codeArt: {
    flexShrink: 0,
    width: "128px",
    height: "128px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius("14px"),
    '@media (max-width: 600px)': {
      width: "80px",
      height: "80px",
    },
  },
  codeArtFeatured: {
    width: "128px",
    height: "128px",
    '@media (max-width: 600px)': {
      width: "96px",
      height: "96px",
    },
  },
  codeCardBody: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "12px",
    flex: 1,
    alignSelf: "stretch",
  },
  codeCardBodyFeatured: {
    gap: "16px",
  },
  codeTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 600,
    color: "#000000",
  },
  codeDescription: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "18px",
    color: "#616161",
  },
  researchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gridAutoRows: "1fr",
    gap: "16px",
    '@media (max-width: 900px)': {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: "1fr",
    },
  },
  researchCard: {
    minHeight: "146px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 2px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("20px", "16px", "16px", "20px"),
    textDecorationLine: "none",
    '@media (max-width: 600px)': {
      minHeight: "auto",
      ...shorthands.padding("16px"),
      gap: "12px",
    },
  },
  researchTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 600,
    color: "#000000",
  },
  researchDescription: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "18px",
    color: "#424242",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "20px",
    fontSize: "11px",
    lineHeight: "14px",
    fontWeight: 500,
    ...shorthands.padding("3px", "8px"),
    ...shorthands.borderRadius("999px"),
  },
  tagGreen: {
    color: "#2D6C2E",
    backgroundColor: "#EAF6E8",
  },
  tagPurple: {
    color: "#7A49BB",
    backgroundColor: "#F4EAFD",
  },
  tagRose: {
    color: "#BE4A63",
    backgroundColor: "#FDECEF",
  },
  tagTeal: {
    color: "#2A7D86",
    backgroundColor: "#E8F8FA",
  },
  tagAmber: {
    color: "#A86A1E",
    backgroundColor: "#FFF2DE",
  },
  tagBlue: {
    color: "#2F69E8",
    backgroundColor: "#EAF2FF",
  },
  tagOrange: {
    color: "#D56A16",
    backgroundColor: "#FFF0E2",
  },
  tagSlate: {
    color: "#5E6A7B",
    backgroundColor: "#EFF2F6",
  },
  sectionRoadmapBg: {
    background:
      "linear-gradient(113deg, rgba(228,243,255,0.7) 0%, rgba(255,255,255,1) 40%, rgba(240,231,255,0.9) 100%)",
  },
  roadmapGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gridAutoRows: "1fr",
    gap: "16px",
    '@media (max-width: 600px)': {
      gridTemplateColumns: "1fr",
    },
  },
  roadmapCard: {
    minHeight: "146px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 2px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("20px", "16px", "16px", "20px"),
    textDecorationLine: "none",
    cursor: "pointer",
    transitionProperty: "box-shadow, transform",
    transitionDuration: "0.2s",
    ':hover': {
      boxShadow: "0 0 2px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.10)",
      transform: "translateY(-2px)",
    },
    '@media (max-width: 600px)': {
      minHeight: "auto",
      ...shorthands.padding("16px"),
      gap: "12px",
    },
  },
  roadmapCardIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    ...shorthands.borderRadius("10px"),
    backgroundColor: "#F0EBFF",
    color: "#5E4BD8",
  },
  roadmapTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 600,
    color: "#000000",
  },
  roadmapDescription: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "18px",
    color: "#424242",
  },
  roadmapLinks: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  roadmapLink: {
    color: "#335CCC",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    textDecorationLine: "none",
    ':hover': {
      textDecorationLine: "underline",
    },
  },
  roadmapDetailOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  roadmapDetailPanel: {
    backgroundColor: "#ffffff",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("32px"),
    maxWidth: "480px",
    width: "90%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
    position: "relative",
  },
  roadmapDetailClose: {
    position: "absolute",
    top: "16px",
    right: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    ...shorthands.borderRadius("8px"),
    backgroundColor: "transparent",
    ...shorthands.border("none"),
    cursor: "pointer",
    color: "#424242",
    ':hover': {
      backgroundColor: "#F5F5F5",
    },
  },
  roadmapDetailTitle: {
    margin: 0,
    fontSize: "20px",
    lineHeight: "28px",
    fontWeight: 600,
    color: "#000000",
    marginBottom: "16px",
  },
  roadmapDetailList: {
    margin: 0,
    ...shorthands.padding("0", "0", "0", "20px"),
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  roadmapDetailListItem: {
    fontSize: "14px",
    lineHeight: "20px",
    color: "#424242",
  },
  footer: {
    backgroundColor: "#ffffff",
    boxShadow: "0 -1px 0 rgba(0,0,0,0.08)",
    ...shorthands.padding("24px", "256px"),
    '@media (max-width: 1200px)': {
      ...shorthands.padding("24px", "80px"),
    },
    '@media (max-width: 600px)': {
      ...shorthands.padding("24px", "16px"),
    },
  },
  footerContent: {
    maxWidth: "928px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#424242",
    flexWrap: "wrap",
  },
  footerDisclaimer: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#616161",
    maxWidth: "1120px",
  },
  footerLinks: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  footerLink: {
    color: "#335CCC",
    fontSize: "12px",
    lineHeight: "16px",
    textDecorationLine: "none",
    ':hover': {
      textDecorationLine: "underline",
    },
  },
  heroValuesRow: {
    width: "100%",
    maxWidth: "812px",
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    '@media (max-width: 700px)': {
      flexDirection: "column",
      gap: "24px",
      alignItems: "center",
    },
  },
  heroValueItem: {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "254.67px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  },
  heroValueLabelRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  heroIconBuild: {
    '& path': {
      fill: "url(#heroGradBuild)",
    },
  },
  heroIconLearn: {
    '& path': {
      fill: "url(#heroGradLearn)",
    },
  },
  heroIconExplore: {
    '& path': {
      fill: "url(#heroGradExplore)",
    },
  },
  heroValueLabel: {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  heroValueTitle: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    color: "#000000",
  },
  heroValueDescription: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    color: "#242424",
  },
  viewAllLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#335CCC",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    textDecorationLine: "none",
    whiteSpace: "nowrap",
    ':hover': {
      textDecorationLine: "underline",
    },
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
  emptyState: {
    ...shorthands.padding("40px", "0"),
    textAlign: "center",
    fontSize: "14px",
    lineHeight: "20px",
    color: "#616161",
  },
  researchLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 340px) 1fr",
    gap: "48px",
    '@media (max-width: 900px)': {
      gridTemplateColumns: "1fr",
      gap: "24px",
    },
  },
  researchIntro: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  researchIntroBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    ...shorthands.borderLeft("2px", "solid", "#E0E0E0"),
    ...shorthands.padding("0", "0", "0", "16px"),
  },
  researchIntroLabel: {
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#0E1726",
  },
  researchIntroText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    color: "#616161",
  },
  researchList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  roadmapTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    ...shorthands.borderBottom("1px", "solid", "#E0E0E0"),
  },
  roadmapTab: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    color: "#424242",
    fontSize: "14px",
    lineHeight: "20px",
    fontFamily: '"Segoe UI", "Segoe UI Web (West European)", system-ui, sans-serif',
    cursor: "pointer",
    ...shorthands.padding("10px", "14px"),
    ...shorthands.border("none"),
    ...shorthands.borderBottom("2px", "solid", "transparent"),
    marginBottom: "-1px",
    ':hover': {
      color: "#0E1726",
    },
  },
  roadmapTabActive: {
    color: "#0E1726",
    fontWeight: 600,
    ...shorthands.borderBottom("2px", "solid", "#335CCC"),
  },
  roadmapTabDescription: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "20px",
    color: "#424242",
    maxWidth: "760px",
  },
  roadmapDetailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    '@media (max-width: 900px)': {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: "1fr",
    },
  },
  roadmapDetailCard: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 2px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("20px"),
    boxSizing: "border-box",
  },
  sectionWhatsNewBg: {
    background:
      "linear-gradient(113deg, rgba(255,244,232,0.8) 0%, rgba(255,255,255,1) 45%, rgba(240,231,255,0.7) 100%)",
  },
  featuredRow: {
    display: "flex",
    gap: "20px",
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    scrollPaddingInline: "2px",
    // Vertical padding keeps card shadows from being clipped by the scroll overflow;
    // trailing inline padding lets the final card scroll fully into view.
    ...shorthands.padding("16px", "24px", "20px", "2px"),
    scrollbarWidth: "none",
    '::-webkit-scrollbar': {
      display: "none",
    },
  },
  featuredCard: {
    flex: "0 0 320px",
    scrollSnapAlign: "start",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 2px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("20px"),
    boxSizing: "border-box",
    '@media (max-width: 600px)': {
      flex: "0 0 82%",
    },
  },
  featuredTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "22px",
    fontWeight: 600,
    color: "#0E1726",
  },
  featuredDescription: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "18px",
    color: "#616161",
    display: "-webkit-box",
    WebkitLineClamp: "3",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    flex: 1,
  },
  featuredFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4px",
  },
  featuredDate: {
    fontSize: "12px",
    lineHeight: "16px",
    color: "#616161",
  },
  featuredArrow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    color: "#335CCC",
    backgroundColor: "#EEF2FF",
    ...shorthands.borderRadius("999px"),
    ...shorthands.border("none"),
    textDecorationLine: "none",
    cursor: "pointer",
    ':hover': {
      backgroundColor: "#E0E7FF",
    },
  },
  featuredNav: {
    display: "flex",
    gap: "8px",
  },
  featuredNavButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    color: "#424242",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    ...shorthands.borderRadius("999px"),
    ...shorthands.border("1px", "solid", "#D1D1D1"),
    ':hover': {
      backgroundColor: "#F5F5F5",
    },
  },
});

export function MicrosoftLogoWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="0" y="0" width="7.3" height="7.3" fill="#F25022" />
        <rect x="8.7" y="0" width="7.3" height="7.3" fill="#7FBA00" />
        <rect x="0" y="8.7" width="7.3" height="7.3" fill="#00A4EF" />
        <rect x="8.7" y="8.7" width="7.3" height="7.3" fill="#FFB900" />
      </svg>
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#424242", whiteSpace: "nowrap" }}>
        Microsoft
      </span>
    </div>
  );
}

function App() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<(typeof sectionTabs)[number]["id"]>("whats-new");
  const [ghStats, setGhStats] = useState<{ stars: string; forks: string; watchers: string }>({ stars: "—", forks: "—", watchers: "—" });
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<TemplateImpactFilter>("Featured");
  const [codeFilter, setCodeFilter] = useState<FilterCategory>("Featured");
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<string>(roadmapItems[0].id);

  useEffect(() => {
    logPageView();
  }, []);

  useEffect(() => {
    fetch("https://api.github.com/repos/microsoft/AI-in-One-Dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count != null) {
          setGhStats({
            stars: String(data.stargazers_count),
            forks: String(data.forks_count),
            watchers: String(data.subscribers_count),
          });
        }
      })
      .catch(() => {});
  }, []);

  const orderedTemplates = useMemo(() => {
    const map = new Map(templates.map((item) => [item.id, item]));
    return templateOrder.map((id) => map.get(id)).filter(Boolean) as typeof templates;
  }, []);

  const orderedResearch = useMemo(() => {
    const map = new Map(research.map((item) => [item.id, item]));
    return researchOrder.map((id) => map.get(id)).filter(Boolean) as typeof research;
  }, []);

  const visibleTemplates = useMemo(
    () =>
      templateFilter === "Featured"
        ? orderedTemplates
        : orderedTemplates.filter((item) => item.impact.includes(templateFilter)),
    [orderedTemplates, templateFilter],
  );

  const visibleResources = useMemo(
    () =>
      codeFilter === "Featured"
        ? resources
        : resources.filter((item) => codeCategory[item.id] === codeFilter),
    [codeFilter],
  );

  const activeRoadmap = roadmapItems.find((item) => item.id === activeRoadmapTab) ?? roadmapItems[0];

  const featuredItems = useMemo(() => buildFeaturedItems(), []);

  const featuredRowRef = useRef<HTMLDivElement>(null);
  const scrollFeatured = (dir: number) => {
    featuredRowRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            // Prefer the element closer to the top of the viewport
            return a.boundingClientRect.top - b.boundingClientRect.top;
          })[0];

        if (visible?.target.id) {
          setActiveTab(visible.target.id as (typeof sectionTabs)[number]["id"]);
          logClick(TelemetryEvents.SectionView, { section: visible.target.id });
        }
      },
      {
        rootMargin: "-10% 0px -60% 0px",
        threshold: [0.05, 0.2, 0.35, 0.5],
      },
    );

    sectionTabs.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: (typeof sectionTabs)[number]["id"]) => {
    setActiveTab(sectionId);
    logClick(TelemetryEvents.TabClick, { tab: sectionId });
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <MicrosoftLogoWordmark />
          <div className={styles.separator} />
          <span className={styles.brandTitle}>Copilot Analytics Labs</span>
        </div>

        <div className={styles.navLinks}>
          <a className={styles.navLink} href={VIVA_INSIGHTS_URL} target="_blank" rel="noreferrer">
            <img src={`${import.meta.env.BASE_URL}images/VI.svg`} alt="" width="20" height="20" aria-hidden="true" />
            <span>Viva Insights</span>
          </a>
          <a className={styles.navLink} href={WHATS_COMING_URL} target="_blank" rel="noreferrer">
            <span>Viva Roadmap</span>
          </a>
          <a className={styles.navLink} href={FEEDBACK_URL} target="_blank" rel="noreferrer">
            <span>Feedback</span>
          </a>
          <button
            className={mergeClasses(styles.navLink, styles.navIconOnly)}
            onClick={() => setShowContactDialog(true)}
            aria-label="Contact us"
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <PersonFeedback20Regular fontSize={16} />
          </button>
        </div>
      </nav>

      {showContactDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowContactDialog(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              textAlign: "center",
              fontFamily: '"Segoe UI", system-ui, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <PersonFeedback20Regular style={{ fontSize: "32px", color: "#6264A7", marginBottom: "12px" }} />
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 600, color: "#242424" }}>
              Contact Us
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px", lineHeight: "20px", color: "#616161" }}>
              For further questions and doubts — Please drop a mail to{" "}
              <a href="mailto:CopilotAnalyticsLabs@microsoft.com" style={{ color: "#0078D4", textDecoration: "none" }}>
                CopilotAnalyticsLabs@microsoft.com
              </a>
            </p>
            <button
              onClick={() => setShowContactDialog(false)}
              style={{
                padding: "8px 24px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ffffff",
                backgroundColor: "#0078D4",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <header className={styles.hero}>
        <div className={styles.heroRibbon} />
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <h1 className={styles.heroTitle}>Frontier analytics for Copilot and agents</h1>
            <p className={styles.heroSubtitle}>
              Guided templates, sample code, and playbooks grounded in real customer deployments - helping you design and deploy analytics beyond what's available in Viva Insights today.
            </p>
          </div>

          <div className={styles.heroValuesRow}>
            <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="heroGradBuild" x1="0" y1="0" x2="1" y2="0.1">
                  <stop offset="0.1238" stopColor="#764FF5" />
                  <stop offset="0.394" stopColor="#3F6CE9" />
                  <stop offset="0.9613" stopColor="#20BBC6" />
                </linearGradient>
                <linearGradient id="heroGradLearn" x1="0" y1="0" x2="1" y2="0.05">
                  <stop offset="0" stopColor="#FFB900" />
                  <stop offset="1" stopColor="#F4364B" />
                </linearGradient>
                <linearGradient id="heroGradExplore" x1="0" y1="0" x2="1" y2="0.05">
                  <stop offset="0" stopColor="#FFB3BA" />
                  <stop offset="1" stopColor="#8560C5" />
                </linearGradient>
              </defs>
            </svg>
            {heroValues.map(({ label, title, description, Icon, gradient }) => {
              const iconGradientClass = {
                Build: styles.heroIconBuild,
                Learn: styles.heroIconLearn,
                Explore: styles.heroIconExplore,
              }[label];
              return (
                <div key={label} className={styles.heroValueItem}>
                  <div className={styles.heroValueLabelRow}>
                    <Icon fontSize={20} className={iconGradientClass} />
                    <span
                      className={styles.heroValueLabel}
                      style={{
                        backgroundImage: gradient,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <h2 className={styles.heroValueTitle}>{title}</h2>
                  <p className={styles.heroValueDescription}>{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className={styles.tabsShell}>
        <div className={styles.tabsList} role="tablist" aria-label="Sections">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={mergeClasses(styles.tabButton, activeTab === tab.id && styles.tabButtonActive)}
              onClick={() => scrollToSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.tabsRail} />
      </div>

      <section id="whats-new" className={mergeClasses(styles.section, styles.sectionWhatsNewBg)}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionTitleArea}>
            <p className={styles.eyebrow}>Featured</p>
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>See what's new and popular in labs</h2>
            </div>
            <p className={styles.sectionDescription}>
              Newly added resources containing templates, sample code, research, and playbooks.
            </p>
          </div>

          <div className={styles.featuredRow} ref={featuredRowRef}>
            {featuredItems.map((item) => (
              <article key={item.id} className={styles.featuredCard}>
                <div className={styles.badgeRow}>
                  <span
                    className={mergeClasses(
                      styles.tag,
                      item.tone === "green" && styles.tagGreen,
                      item.tone === "teal" && styles.tagTeal,
                      item.tone === "purple" && styles.tagPurple,
                    )}
                  >
                    {item.kind}
                  </span>
                </div>
                <h3 className={styles.featuredTitle}>{item.title}</h3>
                <p className={styles.featuredDescription}>{item.description}</p>
                <div className={styles.featuredFooter}>
                  <span className={styles.featuredDate}>{formatRelativeDate(item.addedOn)}</span>
                  <a
                    className={styles.featuredArrow}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${item.title}`}
                    onClick={() => logClick(TelemetryEvents.TemplateViewClick, { template: item.sourceId })}
                  >
                    <ArrowRight16Regular fontSize={16} />
                  </a>
                </div>
                <VoteBar cardId={item.sourceId} />
              </article>
            ))}
          </div>

          <div className={styles.featuredNav}>
            <button type="button" className={styles.featuredNavButton} aria-label="Scroll previous" onClick={() => scrollFeatured(-1)}>
              <ChevronLeft20Regular fontSize={18} />
            </button>
            <button type="button" className={styles.featuredNavButton} aria-label="Scroll next" onClick={() => scrollFeatured(1)}>
              <ChevronRight20Regular fontSize={18} />
            </button>
          </div>
        </div>
      </section>

      <section id="templates" className={mergeClasses(styles.section, styles.sectionTemplateBg)}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionTitleArea}>
            <p className={styles.eyebrow}>Template library</p>
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>Pick a template, start building</h2>
              <a className={styles.viewAllLink} href={`${import.meta.env.BASE_URL}#/templates`} target="_blank" rel="noreferrer" onClick={() => logClick(TelemetryEvents.TabClick, { tab: "view-all-templates" })}>
                View all templates
                <ArrowRight16Regular fontSize={14} />
              </a>
            </div>
            <p className={styles.sectionDescription}>
              Production-ready templates for dashboards across adoption, usage, impact, and business value, combining Viva Insights with broader organizational signals.
            </p>
          </div>

          <div className={styles.chipRow} role="tablist" aria-label="Filter templates">
            {templateImpactFilters.map((cat) => (
              <button
                key={cat}
                type="button"
                className={mergeClasses(styles.chip, templateFilter === cat && styles.chipActive)}
                aria-pressed={templateFilter === cat}
                onClick={() => setTemplateFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {visibleTemplates.length === 0 ? (
            <p className={styles.emptyState}>More templates are coming to this category soon.</p>
          ) : (
          <div className={styles.templateGrid}>
            {visibleTemplates.map((item) => {
              const meta = templateMeta[item.id] ?? {};
              const isFeatured = Boolean(meta.featured);

              return (
                <article
                  key={item.id}
                  className={mergeClasses(styles.templateCard, isFeatured && styles.templateCardFeatured)}
                >
                  {!isFeatured && item.image ? (
                    <img className={styles.templateCardImage} src={item.image} alt="" />
                  ) : null}

                  <div className={styles.templateCardContent}>
                    {meta.badges?.length ? (
                      <div className={styles.badgeRow}>
                        {meta.badges.map((badge) => (
                          <span
                            key={badge.text}
                            className={mergeClasses(
                              styles.badge,
                              badge.tone === "green" ? styles.badgeGreen : styles.badgeRose,
                            )}
                          >
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className={styles.templateBody}>
                      <div className={styles.templateCardContent}>
                        <h3 className={styles.templateTitle}>{item.title}</h3>
                        <p className={styles.templateDescription}>{item.description}</p>
                      </div>

                      {meta.stats?.length ? (
                        <>
                          <div className={styles.statsDivider} />
                          <div className={styles.statsRow}>
                            {meta.stats.map((stat) => {
                              let value = stat.value;
                              if (item.id === "aio-dashboard") {
                                if (stat.label === "Stars") value = ghStats.stars;
                                else if (stat.label === "Watching") value = ghStats.watchers;
                              }
                              return (
                                <div key={stat.label} className={styles.statBlock}>
                                  <span className={styles.statValue}>
                                    {stat.label === "Stars" && <Star16Filled fontSize={14} style={{ color: "#EAA300", marginRight: 4 }} />}
                                    {stat.label === "Watching" && <Eye16Regular fontSize={14} style={{ marginRight: 4 }} />}
                                    {value}
                                  </span>
                                  <span className={styles.statLabel}>{stat.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : null}

                      <div>
                        <a className={styles.secondaryButton} href={item.url} target="_blank" rel="noreferrer" onClick={() => logClick(TelemetryEvents.TemplateViewClick, { template: item.id })}>
                          View template
                        </a>
                      </div>
                      <VoteBar cardId={item.id} />
                    </div>
                  </div>

                  {isFeatured && item.image ? (
                    <img
                      className={mergeClasses(styles.templateCardImage, styles.templateCardImageFeatured)}
                      src={item.image}
                      alt=""
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
          )}
        </div>
      </section>

      <section id="sample-code" className={mergeClasses(styles.section, styles.sectionCodeBg)}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionTitleArea}>
            <p className={styles.eyebrow}>Sample code</p>
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>Grab the code, make it yours</h2>
              <a className={styles.viewAllLink} href={VIEW_ALL_CODE_URL} target="_blank" rel="noreferrer">
                View all codes
                <ArrowRight16Regular fontSize={14} />
              </a>
            </div>
            <p className={styles.sectionDescription}>
              Reusable scripts, prompt libraries, and analytical methods for Python, R, and Power BI - adaptable to your organization's data.
            </p>
          </div>

          <div className={styles.chipRow} role="tablist" aria-label="Filter sample code">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={mergeClasses(styles.chip, codeFilter === cat && styles.chipActive)}
                aria-pressed={codeFilter === cat}
                onClick={() => setCodeFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {visibleResources.length === 0 ? (
            <p className={styles.emptyState}>More sample code is coming to this category soon.</p>
          ) : (
          <div className={styles.codeGrid}>
            {visibleResources.map((item) => {
              const Icon = item.icon ?? DocumentBulletList24Regular;
              const meta = resourceMeta[item.id];
              const isFeatured = Boolean(meta?.featured);

              return (
                <article key={item.id} className={mergeClasses(styles.codeCard, isFeatured && styles.codeCardFeatured)}>
                  <div
                    className={mergeClasses(styles.codeArt, isFeatured && styles.codeArtFeatured)}
                  >
                    {item.image ? (
                      <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <Icon />
                    )}
                  </div>

                  <div className={mergeClasses(styles.codeCardBody, isFeatured && styles.codeCardBodyFeatured)}>
                    {meta?.badges?.length ? (
                      <div className={mergeClasses(styles.badgeRow, isFeatured && styles.badgeRowFeatured)}>
                        {meta.badges.map((badge) => (
                          <span
                            key={badge.text}
                            className={mergeClasses(
                              styles.badge,
                              badge.tone === "green" ? styles.badgeGreen : styles.badgeBlue,
                            )}
                          >
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className={styles.templateCardContent}>
                      <h3 className={styles.codeTitle}>{item.title}</h3>
                      <p className={styles.codeDescription}>{item.description}</p>
                    </div>

                    <div>
                      <a className={styles.secondaryButton} href={item.url} target="_blank" rel="noreferrer" onClick={() => logClick(TelemetryEvents.CodeViewClick, { resource: item.id })}>
                        View code
                      </a>
                    </div>
                    <VoteBar cardId={item.id} />
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </div>
      </section>

      <section id="research" className={mergeClasses(styles.section, styles.sectionResearchBg)}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionTitleArea}>
            <p className={styles.eyebrow}>Research and playbooks</p>
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>Examples from around the world</h2>
            </div>
            <p className={styles.sectionDescription}>
              Adoption playbooks, analytical methods, and deployment research inspired by real enterprise Copilot rollouts.
            </p>
          </div>

          <div className={styles.researchLayout}>
            <div className={styles.researchIntro}>
              <div className={styles.researchIntroBlock}>
                <span className={styles.researchIntroLabel}>Research</span>
                <p className={styles.researchIntroText}>
                  Insights from orgs leading AI adoption — methodology guides and research from real enterprise rollouts, so you don't start from scratch.
                </p>
                <a className={styles.viewAllLink} href={VIEW_ALL_RESEARCH_URL} target="_blank" rel="noreferrer">
                  View all research reports
                  <ArrowRight16Regular fontSize={14} />
                </a>
              </div>
              <div className={styles.researchIntroBlock}>
                <span className={styles.researchIntroLabel}>Playbooks</span>
                <p className={styles.researchIntroText}>
                  Strategies already in play — proven approaches and tactical guides drawn from enterprise Copilot deployments.
                </p>
              </div>
            </div>

            <div className={styles.researchList}>
              {orderedResearch.map((item) => (
              <article key={item.id} className={styles.researchCard}>
                <div className={styles.badgeRow}>
                  {(researchTags[item.id] ?? []).map((tag) => (
                    <span
                      key={tag.text}
                      className={mergeClasses(
                        styles.tag,
                        tag.tone === "green" && styles.tagGreen,
                        tag.tone === "purple" && styles.tagPurple,
                        tag.tone === "rose" && styles.tagRose,
                        tag.tone === "teal" && styles.tagTeal,
                        tag.tone === "amber" && styles.tagAmber,
                        tag.tone === "blue" && styles.tagBlue,
                        tag.tone === "orange" && styles.tagOrange,
                        tag.tone === "slate" && styles.tagSlate,
                      )}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>
                <div className={styles.templateCardContent} style={{ flex: 1 }}>
                  <h3 className={styles.researchTitle}>{item.title}</h3>
                  <p className={styles.researchDescription}>{item.description}</p>
                </div>
                <a className={styles.secondaryButton} href={item.url} target="_blank" rel="noreferrer" style={{ marginTop: "auto" }} onClick={() => logClick(TelemetryEvents.ResearchViewClick, { research: item.id })}>
                  View report
                </a>
                <VoteBar cardId={item.id} />
              </article>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product-roadmap" className={mergeClasses(styles.section, styles.sectionRoadmapBg)}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionTitleArea}>
            <p className={styles.eyebrow}>Product roadmap</p>
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>What's next for Copilot Analytics</h2>
            </div>
            <p className={styles.sectionDescription}>
              Upcoming capabilities and investments shaping the future of AI-powered analytics.
            </p>
          </div>

          <div className={styles.roadmapTabs} role="tablist" aria-label="Roadmap categories">
            {roadmapItems.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeRoadmapTab === item.id}
                className={mergeClasses(styles.roadmapTab, activeRoadmapTab === item.id && styles.roadmapTabActive)}
                onClick={() => { setActiveRoadmapTab(item.id); logClick(TelemetryEvents.TabClick, { tab: `roadmap-${item.id}` }); }}
              >
                <item.icon />
                {item.title}
              </button>
            ))}
          </div>

          <p className={styles.roadmapTabDescription}>{activeRoadmap.description}</p>

          <div className={styles.roadmapDetailGrid}>
            {(activeRoadmap.details ?? []).map((detail) => (
              <article key={detail} className={styles.roadmapDetailCard}>
                <div className={styles.roadmapCardIcon}>
                  <activeRoadmap.icon />
                </div>
                <h3 className={styles.roadmapTitle}>{detail}</h3>
              </article>
            ))}
          </div>

          <div className={styles.roadmapLinks}>
            <a className={styles.roadmapLink} href="https://www.microsoft.com/en-us/microsoft-365/roadmap?filters=Microsoft%20Viva" target="_blank" rel="noreferrer">
              For detailed roadmap — click here ↗
            </a>
            <a className={styles.roadmapLink} href="https://forms.microsoft.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR0To00bktq1Ilw6hJ9BCmj5UODhQNTBPUkI2NUlRQU9VUzI0WkNPUTJSSi4u" target="_blank" rel="noreferrer">
              Product roadmap feedback ↗
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <MicrosoftLogoWordmark />
            <div className={styles.separator} />
            <span className={styles.brandTitle}>Copilot Analytics Labs</span>
          </div>

          <p className={styles.footerDisclaimer}>
            Disclaimer: The materials on this page are provided as-is, without warranty of any kind, including merchantability or fitness for a particular purpose. Microsoft will not provide any support for these materials.
          </p>

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

export default App;
