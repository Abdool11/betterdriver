// ─── TAG Website — Static Constants ──────────────────────────────────────────
// All static strings, URLs, and configuration values live here.
// Dynamic data (API responses, form submissions) is handled by Asif's API layer.

// ─── Brand ────────────────────────────────────────────────────────────────────
export const SITE_NAME = "Transport Action Group";
export const SITE_SHORT_NAME = "TAG";
export const SITE_TAGLINE = "Creating the enabling environment for green freight transformation";
export const SITE_DESCRIPTION =
  "Transport Action Group helps shape green freight transition through implementable Green Freight Action Plans designed in response to a Green Freight Strategy, strategic interventions, ecosystem alignment, and partner mobilisation — turning industry ambition into practical implementation momentum.";

// ─── Logo URLs ────────────────────────────────────────────────────────────────
export const LOGO_HIRES_URL = "/tag-logo.png";
export const LOGO_WITH_TEXT_URL = "/tag-logo.png";

// ─── External URLs ────────────────────────────────────────────────────────────
// All external URLs must come from process.env in production.
// These constants are fallbacks for static rendering only.
export const ECOSYSTEM_URLS = {
  zeroAfrica: process.env.NEXT_PUBLIC_ZERO_AFRICA_URL ?? "https://www.zeroafrica.org",
  gfa: process.env.NEXT_PUBLIC_GFA_URL ?? "https://www.greenfreightacademy.co.za",
  betterDriver: process.env.NEXT_PUBLIC_BETTERDRIVER_URL ?? "https://www.betterdriver.co.za",
};

// ─── Navigation ───────────────────────────────────────────────────────────────
export const NAV_LINKS = [
  { label: "What we do", href: "/services" },
  { label: "Green Freight", href: "/green-freight" },
  { label: "Electric Trucks", href: "/electric-truck" },
  { label: "TCO Calculator", href: "/tco-calculator" },
  { label: "Academy", href: "/academy" },
  { label: "Publications", href: "/books" },
  { label: "Ecosystem Partners", href: "/ecosystem-partners" },
] as const;

export const NAV_CTA = {
  label: "Partner with TAG",
  href: "/partner-with-tag",
} as const;

// ─── Hero Section ─────────────────────────────────────────────────────────────
export const HERO = {
  headline: "Creating the enabling environment for green freight transformation",
  supporting:
    "Transport Action Group helps shape green freight transition through implementable Green Freight Action Plans designed in response to a Green Freight Strategy, strategic interventions, ecosystem alignment, and partner mobilisation — turning industry ambition into practical implementation momentum.",
  ctaPrimary: { label: "Explore what we do", href: "/services" },
  ctaSecondary: { label: "Partner with TAG", href: "/partner-with-tag" },
  ctaTertiary: { label: "View Action Plan Pathways", href: "/green-freight" },
} as const;

// ─── Challenge Section ────────────────────────────────────────────────────────
export const CHALLENGE = {
  heading: "Green freight transformation needs more than good intentions",
  copy: "Many sectors recognise the need to improve freight efficiency, emissions performance, and transition readiness. But progress often stalls because the enabling environment is weak: fragmented stakeholders, limited coordination, unclear implementation pathways, insufficient funding visibility, and policy or ecosystem misalignment. Transformation needs structure, legitimacy, collaboration, and practical pathways.",
  fragmented: [
    "Fragmented stakeholders with no coordination",
    "Unclear implementation pathways",
    "Limited funding visibility",
    "Policy and ecosystem misalignment",
    "Ambition without structure",
  ],
  aligned: [
    "Coordinated stakeholder alignment",
    "Clear action plan pathways",
    "Funding-ready implementation platforms",
    "Policy-aligned ecosystem engagement",
    "Ambition converted to momentum",
  ],
} as const;

// ─── What TAG Does ────────────────────────────────────────────────────────────
export const WHAT_TAG_DOES = {
  heading: "From ambition to implementation support",
  supporting:
    "TAG helps shape the conditions for green freight transformation through practical frameworks, strategic interventions, and coordinated engagement across the ecosystem.",
  pillars: [
    {
      title: "Green Freight Action Plans",
      description:
        "Structured pathways to guide industry and national transformation — from diagnosis to implementation roadmap.",
      icon: "MapPin",
      href: "/green-freight",
    },
    {
      title: "Electric Truck Action Plans",
      description:
        "Strategic roadmaps to support zero-emission truck transition and implementation readiness across corridors and fleets.",
      icon: "Zap",
      href: "/electric-truck",
    },
    {
      title: "Targeted Strategic Workshops",
      description:
        "Focused interventions for industry bodies, shippers councils, procurement groups, and ecosystem stakeholders.",
      icon: "Users",
      href: "/services",
    },
    {
      title: "Implementation Support",
      description:
        "Practical guidance and advisory support to help organisations move from plan to execution with confidence.",
      icon: "ArrowRight",
      href: "/services",
    },
    {
      title: "Books and Practical Guidance",
      description:
        "Publications and frameworks that serve as implementation guides for industry practitioners and decision-makers.",
      icon: "BookOpen",
      href: "/books",
    },
    {
      title: "Ecosystem and Partner Mobilisation",
      description:
        "Bringing together collaborators, funders, and institutions to support practical progress at scale.",
      icon: "Globe",
      href: "/ecosystem-partners",
    },
  ],
} as const;

// ─── Who TAG Works With ───────────────────────────────────────────────────────
export const WHO_TAG_WORKS_WITH = {
  heading: "Built for the institutions and partners that shape the freight landscape",
  audiences: [
    {
      title: "Industry Bodies",
      description:
        "Develop coordinated pathways for sector transformation. TAG helps industry associations move from aspiration to structured action.",
      cta: "Explore collaboration",
      href: "/partner-with-tag",
    },
    {
      title: "DFIs and Donors",
      description:
        "Identify credible transition opportunities and practical implementation platforms. TAG provides the structure that makes investment viable.",
      cta: "See how TAG works",
      href: "/services",
    },
    {
      title: "Public-Sector Actors",
      description:
        "Support policy-aligned freight transition with implementation realism. TAG bridges policy intent and operational delivery.",
      cta: "View intervention pathways",
      href: "/services",
    },
    {
      title: "Shippers Councils and Procurement Bodies",
      description:
        "Advance greener freight through targeted engagement and procurement-aligned action. TAG facilitates the workshops that shift behaviour.",
      cta: "Explore collaboration",
      href: "/partner-with-tag",
    },
    {
      title: "Ecosystem Collaborators",
      description:
        "Partner on practical interventions, action plans, and implementation support. TAG is the convening platform for ecosystem alignment.",
      cta: "Partner with TAG",
      href: "/partner-with-tag",
    },
    {
      title: "Corridor and Regional Partners",
      description:
        "Build implementation momentum at corridor level. TAG supports regional freight transformation with practical frameworks and facilitation.",
      cta: "Start a conversation",
      href: "/contact",
    },
  ],
} as const;

// ─── Why This Matters ─────────────────────────────────────────────────────────
export const WHY_THIS_MATTERS = {
  heading: "The enabling environment determines the pace of change",
  copy: "Transformation does not scale when stakeholders remain disconnected and action pathways remain unclear. TAG helps build the visibility, alignment, and practical momentum needed to move green freight forward with credibility.",
  benefits: [
    { label: "Visibility", description: "Making transformation pathways clear and credible" },
    { label: "Coordination", description: "Aligning stakeholders around shared implementation logic" },
    { label: "Credibility", description: "Building the institutional legitimacy that attracts partners and funding" },
    { label: "Practical Pathways", description: "Turning ambition into structured, actionable plans" },
    { label: "Funding Readiness", description: "Creating the conditions that make DFI and donor investment viable" },
    { label: "Implementation Momentum", description: "Moving from intention to measurable progress" },
  ],
} as const;

// ─── Impact Strip ─────────────────────────────────────────────────────────────
// DATA REQUIREMENTS: Asif to implement /api/metrics endpoint
// Returns: { action_plans: number, workshops: number, partners: number, countries: number, last_updated: string, data_source: "live" | "demo" }
export const IMPACT_STRIP_FALLBACK = {
  workshops: 34,
  partners: 48,
  countries: 7,
  data_source: "demo" as const,
};

// ─── Publications ─────────────────────────────────────────────────────────────
// DATA REQUIREMENTS: Asif to implement /api/publications endpoint
// Static entries below are placeholders only — replace with live data
export const PUBLICATIONS_PLACEHOLDER = [
  {
    id: "1",
    title: "Green Freight Action Plan — Implementation Guide",
    description:
      "A practical framework for developing and implementing a Green Freight Action Plan at national or industry level.",
    category: "Action Plan",
    href: "/books",
  },
  {
    id: "2",
    title: "Electric Truck Transition — Strategic Roadmap",
    description:
      "A structured approach to planning and implementing electric truck transition across freight corridors.",
    category: "Electric Truck",
    href: "/books",
  },
  {
    id: "3",
    title: "Green Freight Procurement — Practical Guide",
    description:
      "How shippers and procurement bodies can embed green freight requirements into sourcing and contracting.",
    category: "Procurement",
    href: "/books",
  },
] as const;

// ─── Ecosystem Section ────────────────────────────────────────────────────────
export const ECOSYSTEM_SECTION = {
  heading: "Part of a wider transformation ecosystem",
  supporting:
    "TAG works alongside companion platforms that carry the enterprise capability and driver development work forward.",
  platforms: [
    {
      name: "GreenFreightAcademy",
      role: "Enterprise capability and performance engine",
      description:
        "Builds capability across drivers, managers, procurement teams, and transition leaders through scalable training, certification, and CPD.",
      href: ECOSYSTEM_URLS.gfa,
      external: true,
    },
    {
      name: "BetterDriver",
      role: "Human resource asset layer",
      description:
        "The driver-facing development platform for learning, certification, recognition, and professional growth.",
      href: ECOSYSTEM_URLS.betterDriver,
      external: true,
    },
    {
      name: "ZeroAfrica",
      role: "Sustainability knowledge platform",
      description:
        "The broader sustainability intelligence and knowledge platform that contextualises the green freight transformation journey.",
      href: ECOSYSTEM_URLS.zeroAfrica,
      external: true,
    },
  ],
} as const;

// ─── Contact / Enquiry Form ───────────────────────────────────────────────────
// DATA REQUIREMENTS: Asif to implement /api/submit-enquiry endpoint
// Table: enquiry_submissions (type: government | dfi | industry_body | fleet | partnership | other)
export const ENQUIRY_TYPES = [
  { value: "dfi", label: "DFI or Donor" },
  { value: "government", label: "Government or Public Sector" },
  { value: "industry_body", label: "Industry Body or Association" },
  { value: "fleet", label: "Fleet Operator or Transport Company" },
  { value: "partnership", label: "Ecosystem Partner or Collaborator" },
  { value: "other", label: "Other" },
] as const;

// ─── Footer ───────────────────────────────────────────────────────────────────
export const FOOTER_LINKS = [
  {
    heading: "What we do",
    links: [
      { label: "Green Freight Action Plans", href: "/green-freight" },
      { label: "Electric Trucks", href: "/electric-truck" },
      { label: "Strategic Workshops", href: "/services#workshops" },
      { label: "Implementation Support", href: "/services#implementation" },
    ],
  },
  {
    heading: "Knowledge",
    links: [
      { label: "Publications", href: "/books" },
      { label: "TCO Calculator", href: "/tco-calculator" },
      { label: "Academy", href: "/academy" },
    ],
  },
  {
    heading: "Ecosystem",
    links: [
      { label: "Ecosystem Partners", href: "/ecosystem-partners" },
      { label: "Partner with TAG", href: "/partner-with-tag" },
      { label: "GreenFreightAcademy", href: ECOSYSTEM_URLS.gfa },
      { label: "BetterDriver", href: ECOSYSTEM_URLS.betterDriver },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "About TAG", href: "/about" },
      { label: "ZeroAfrica", href: ECOSYSTEM_URLS.zeroAfrica },
    ],
  },
] as const;
