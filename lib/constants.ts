// ─── BetterDriver — Static Constants ─────────────────────────────────────────
// All static strings, navigation config, and mock data for the BetterDriver frontend.
// TODO: Asif — replace MOCK_* constants with live Supabase/Moodle data.

export const SITE_NAME = "BetterDriver";
export const SITE_TAGLINE = "The driver development portal";
export const SITE_DESCRIPTION =
  "BetterDriver is where professional truck drivers enrol in training, complete programmes, earn certification, and build their professional record.";

// ─── Logo & Brand ─────────────────────────────────────────────────────────────
// TODO: Asif — replace with final BetterDriver logo CDN URL
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL ?? "/logo-betterdriver.png";
export const LOGO_ALT = "BetterDriver";

// ─── Navigation ───────────────────────────────────────────────────────────────
export const NAV_LINKS = [
  { label: "How it works", href: "/start" },
  { label: "Driver Registry", href: "/registry" },
  { label: "Help", href: "/help" },
];

export const NAV_CTA_PRIMARY = { label: "Log in", href: "/login" };
export const NAV_CTA_SECONDARY = { label: "Get started", href: "/start" };

// ─── External Links ───────────────────────────────────────────────────────────
export const EXTERNAL_LINKS = {
  gfa: process.env.NEXT_PUBLIC_GFA_URL ?? "https://greenfreightacademy.co.za",
  tag: process.env.NEXT_PUBLIC_TAG_URL ?? "https://transportactiongroup.com",
  zeroAfrica: process.env.NEXT_PUBLIC_ZERO_AFRICA_URL ?? "https://zeroafrica.org",
};

// ─── Programmes ───────────────────────────────────────────────────────────────
export const PROGRAMMES = [
  {
    id: "professional-truck-driver",
    title: "The Professional Truck Driver Programme",
    shortTitle: "Professional Truck Driver",
    audience: "Drivers",
    priceLabel: "R35 per driver per month",
    priceMonthly: 35,
    durationLabel: "12-month programme with quarterly CPD",
    hasCPD: true,
    tier: 1,
    slug: "professional-truck-driver",
    description:
      "A comprehensive development programme that builds professional driving capability, safety discipline, and operational professionalism.",
    summary: "Builds professional driving capability, safety discipline, and operational excellence over 12 months with quarterly CPD.",
    includes: ["8 training modules", "Quarterly CPD sessions", "Practical evaluations", "Professional certification", "Compliance reporting"],
  },
  {
    id: "eco-driver",
    title: "Eco-Driver Training",
    shortTitle: "Eco-Driver",
    audience: "Drivers",
    priceLabel: "R35 per driver per month",
    priceMonthly: 35,
    durationLabel: "12-month programme with quarterly CPD",
    hasCPD: true,
    tier: 1,
    slug: "eco-driver",
    description:
      "Practical eco-driving skills that reduce fuel consumption, lower emissions, and improve vehicle longevity.",
    summary: "Practical eco-driving skills that measurably reduce fuel consumption, lower emissions, and extend vehicle life.",
    includes: ["Fuel-efficient driving techniques", "Quarterly CPD sessions", "Fuel savings tracking", "Professional certification", "Compliance reporting"],
  },
  {
    id: "intro-green-freight",
    title: "Introduction to Green Freight",
    shortTitle: "Intro to Green Freight",
    audience: "All staff",
    priceLabel: "R1,000 per person",
    priceOnce: 1000,
    durationLabel: "Self-paced, approximately 4–6 hours",
    hasCPD: false,
    tier: 2,
    slug: "intro-green-freight",
    description:
      "A foundational programme that builds shared understanding of green freight principles across the business.",
    summary: "Builds shared understanding of green freight principles across all levels of the business in 4–6 hours.",
    includes: ["Self-paced online modules", "Green freight fundamentals", "Certificate of completion", "Team enrolment available"],
  },
  {
    id: "road-freight-manager",
    title: "Road Freight Manager Training",
    shortTitle: "Road Freight Manager",
    audience: "Managers",
    priceLabel: "R5,000 per person",
    priceOnce: 5000,
    durationLabel: "Structured programme — duration confirmed on enrolment",
    hasCPD: false,
    tier: 2,
    slug: "road-freight-manager",
    description:
      "Builds management capability for emissions reduction, profit improvement, and operational discipline in road freight.",
    summary: "Builds management capability for emissions reduction, profit improvement, and operational discipline across the road freight enterprise.",
    includes: ["Emissions reduction strategies", "Profit improvement frameworks", "Operational discipline tools", "Certificate of completion"],
  },
  {
    id: "electric-truck-transformation",
    title: "Electric Truck Transformation Training",
    shortTitle: "Electric Truck Transformation",
    audience: "Transition leaders",
    priceLabel: "R5,000 per person",
    priceOnce: 5000,
    durationLabel: "Structured programme — duration confirmed on enrolment",
    hasCPD: false,
    tier: 3,
    slug: "electric-truck-transformation",
    description:
      "Prepares companies for zero-emission truck transition through practical planning, TCO understanding, and implementation readiness.",
    summary: "Prepares your business for zero-emission truck transition with practical planning, TCO analysis, and implementation readiness.",
    includes: ["TCO and business case tools", "Infrastructure planning", "Driver and technician readiness", "Certificate of completion"],
  },
  {
    id: "green-freight-procurement",
    title: "Green Freight Procurement Training",
    shortTitle: "Green Freight Procurement",
    audience: "Procurement teams",
    priceLabel: "R5,000 per person",
    priceOnce: 5000,
    durationLabel: "Structured programme — duration confirmed on enrolment",
    hasCPD: false,
    tier: 3,
    slug: "green-freight-procurement",
    description:
      "Equips procurement teams to embed green freight requirements into supplier selection, contracts, and performance management.",
    summary: "Equips procurement teams to embed green freight criteria into supplier selection, contracts, and performance management.",
    includes: ["Green freight procurement criteria", "Supplier evaluation frameworks", "Contract embedding tools", "Certificate of completion"],
  },
];

// ─── Footer Links ─────────────────────────────────────────────────────────────
export const FOOTER_LINKS = {
  driver: [
    { label: "How it works", href: "/start" },
    { label: "Driver Registry", href: "/registry" },
    { label: "Help", href: "/help" },
  ],
  portal: [
    { label: "My Tasks", href: "/portal/tasks" },
    { label: "My Course", href: "/portal/course" },
    { label: "My Progress", href: "/portal/progress" },
    { label: "My Certificate", href: "/portal/certificate" },
    { label: "My Profile", href: "/portal/profile" },
  ],
  ecosystem: [
    { label: "GreenFreightAcademy", href: EXTERNAL_LINKS.gfa },
    { label: "Transport Action Group", href: EXTERNAL_LINKS.tag },
    { label: "ZeroAfrica", href: EXTERNAL_LINKS.zeroAfrica },
  ],
  legal: [] as { label: string; href: string }[],
};

// ─── Help Page FAQs ───────────────────────────────────────────────────────────
export const FAQS = [
  {
    question: "How do I get started?",
    answer: "You can enrol as an individual driver or ask your company to enrol you as part of a corporate campaign. Click 'Get started' in the top navigation to choose your path.",
  },
  {
    question: "What does R35 per month actually include?",
    answer: "The R35 per driver per month covers the full training programme, all evaluations, your professional certification, and quarterly CPD sessions for as long as you remain subscribed. There are no hidden costs.",
  },
  {
    question: "Can I do the training on my phone?",
    answer: "Yes. BetterDriver and the training platform are designed to work on any smartphone. You do not need a computer or special software.",
  },
  {
    question: "How long does the training take?",
    answer: "The Professional Truck Driver and Eco-Driver programmes run over 12 months with 8 modules and quarterly CPD sessions. Each module takes between 35 and 55 minutes. You can complete modules at your own pace.",
  },
  {
    question: "What is CPD and why do I need to do it?",
    answer: "CPD stands for Continuing Professional Development. It is short, regular training that keeps your skills current and your certification valid. Your company or the training team will notify you when a CPD session is due.",
  },
  {
    question: "How do I download my certificate?",
    answer: "Go to My Certificate in your portal. Once your programme is complete, a Download PDF button will appear. Your certificate is also listed in the public Driver Registry.",
  },
  {
    question: "What if my company is not enrolled — can I join as an individual?",
    answer: "Yes. Individual enrolment is available at the same price as corporate enrolment. You pay directly and your certificate belongs to you.",
  },
  {
    question: "I cannot log in. What should I do?",
    answer: "Make sure you are using the mobile number or email address you registered with. Use the 'Forgot password' link on the login screen. If you still cannot get in, contact us using the form on this page.",
  },
];
