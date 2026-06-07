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
    priceLabel: "R75 per driver per month",
    priceMonthly: 75,
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
    priceLabel: "R75 per driver per month",
    priceMonthly: 75,
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

// ─── Mock Data — Portal Screens ───────────────────────────────────────────────
// TODO: Asif — replace all MOCK_* constants with live Supabase queries.
// These are used as fallback/demo data only. Remove [MOCK DATA] banners when live.

export const MOCK_DRIVER = {
  id: "drv_001",
  name: "Sipho Dlamini",
  email: "sipho.dlamini@example.com",
  mobile: "+27 82 555 0123",
  companyName: "Auto Carriers",
  profileCompletionPercent: 72,
  idNumber: "8501015001087",
  licenceNumber: "GP-2019-00445",
  licenceCode: "EC",
  pdpNumber: "PDP-2024-11234",
  pdpExpiry: "2027-03-15",
  currentEmployer: "Auto Carriers (Pty) Ltd",
  yearsExperience: 7,
  vehicleTypes: ["Interlink", "Rigid truck"],
};

export const MOCK_TASKS = [
  {
    id: "task_001",
    type: "module",
    status: "in-progress",
    title: "Module 4: Safe Following Distance",
    description: "Continue your Professional Truck Driver programme",
    programmeTitle: "Professional Truck Driver",
    priority: "normal",
    isOverdue: false,
    estimatedMinutes: 45,
    progressPercent: 58,
    dueLabel: undefined as string | undefined,
    actionLabel: "Resume module",
    actionHref: "/portal/course",
  },
  {
    id: "task_002",
    type: "cpd",
    status: "urgent",
    title: "Q1 CPD: Tyre Management in Hot Conditions",
    description: "Quarterly CPD due by 30 April 2026",
    programmeTitle: "Professional Truck Driver",
    priority: "urgent",
    dueDate: "2026-04-30",
    dueLabel: "30 Apr 2026",
    isOverdue: false,
    estimatedMinutes: 30,
    progressPercent: undefined as number | undefined,
    actionLabel: "Start CPD",
    actionHref: "/portal/cpd",
  },
  {
    id: "task_003",
    type: "refresh",
    status: "urgent",
    title: "Urgent Refresh: Load Securing Protocol Update",
    description: "Your company has requested an urgent CPD intervention",
    programmeTitle: "Professional Truck Driver",
    priority: "urgent",
    dueDate: "2026-04-20",
    dueLabel: "20 Apr 2026",
    isOverdue: false,
    estimatedMinutes: 20,
    progressPercent: undefined as number | undefined,
    actionLabel: "Start now",
    actionHref: "/portal/cpd",
  },
  {
    id: "task_004",
    type: "profile",
    status: "upcoming",
    title: "Complete your professional profile",
    description: "Your profile is 72% complete — add your PDP number and work history",
    priority: "normal",
    isOverdue: false,
    dueLabel: "No deadline",
    progressPercent: undefined as number | undefined,
    actionLabel: "Update profile",
    actionHref: "/portal/profile",
  },
];

export const MOCK_ENROLMENT = {
  id: "enr_001",
  programmeId: "professional-truck-driver",
  programmeTitle: "The Professional Truck Driver Programme",
  status: "in-progress",
  progressPercent: 58,
  currentModuleTitle: "Module 4: Safe Following Distance",
  startedAt: "2026-01-15",
  cpdCompletions: 1,
  nextCpdDueDate: "2026-04-30",
};

export const MOCK_MODULES = [
  { id: "m01", title: "Module 1: The Professional Driver Mindset", status: "completed", durationMinutes: 40 },
  { id: "m02", title: "Module 2: Vehicle Pre-Trip Inspection", status: "completed", durationMinutes: 50 },
  { id: "m03", title: "Module 3: Defensive Driving Principles", status: "completed", durationMinutes: 45 },
  { id: "m04", title: "Module 4: Safe Following Distance", status: "in-progress", durationMinutes: 45 },
  { id: "m05", title: "Module 5: Load Management and Weight Distribution", status: "upcoming", durationMinutes: 55 },
  { id: "m06", title: "Module 6: Fatigue Management", status: "upcoming", durationMinutes: 40 },
  { id: "m07", title: "Module 7: Emergency Procedures", status: "upcoming", durationMinutes: 50 },
  { id: "m08", title: "Module 8: Professionalism and Customer Interaction", status: "upcoming", durationMinutes: 35 },
];

export const MOCK_CPD_RECORDS = [
  {
    id: "cpd_001",
    title: "Q1 2026: Tyre Management in Hot Conditions",
    status: "upcoming",
    dueDate: "2026-04-30",
    programmeTitle: "Professional Truck Driver",
  },
  {
    id: "cpd_002",
    title: "Urgent Refresh: Load Securing Protocol Update",
    status: "urgent",
    dueDate: "2026-04-20",
    programmeTitle: "Professional Truck Driver",
  },
  {
    id: "cpd_003",
    title: "Q4 2025: Night Driving Safety",
    status: "completed",
    completedAt: "2025-12-18",
    completedOnTime: true,
    programmeTitle: "Professional Truck Driver",
  },
];

// ─── Registry Mock Data ───────────────────────────────────────────────────────
// TODO: Asif — replace with live Supabase query: SELECT drivers.name, certifications.* FROM certifications JOIN drivers ON drivers.id = certifications.driver_id WHERE certifications.status = 'active'
export const MOCK_REGISTRY = [
  { id: "r001", name: "Sipho Dlamini", certNumber: "BD-2026-00127", programme: "Professional Truck Driver", issuedDate: "Mar 2026", company: "Auto Carriers" },
  { id: "r002", name: "Thabo Nkosi", certNumber: "BD-2026-00128", programme: "Professional Truck Driver", issuedDate: "Mar 2026", company: "Auto Carriers" },
  { id: "r003", name: "Lungelo Mthembu", certNumber: "BD-2026-00129", programme: "Eco-Driver", issuedDate: "Feb 2026", company: "KDG Transport" },
  { id: "r004", name: "Bongani Zulu", certNumber: "BD-2026-00130", programme: "Professional Truck Driver", issuedDate: "Feb 2026", company: "KDG Transport" },
  { id: "r005", name: "Mandla Khumalo", certNumber: "BD-2026-00131", programme: "Professional Truck Driver", issuedDate: "Jan 2026", company: "Auto Carriers" },
  { id: "r006", name: "Nhlanhla Dube", certNumber: "BD-2026-00132", programme: "Eco-Driver", issuedDate: "Jan 2026", company: "Auto Carriers" },
  { id: "r007", name: "Siyanda Mhlongo", certNumber: "BD-2026-00133", programme: "Professional Truck Driver", issuedDate: "Dec 2025", company: "KDG Transport" },
  { id: "r008", name: "Thandolwethu Ngema", certNumber: "BD-2026-00134", programme: "Professional Truck Driver", issuedDate: "Dec 2025", company: "Auto Carriers" },
];

export const MOCK_CERTIFICATE = {
  id: "cert_001",
  driverName: "Sipho Dlamini",
  programmeName: "The Professional Truck Driver Programme",
  issuedDate: "1 March 2026",
  certNumber: "BD-2026-00127",
  verificationUrl: "https://betterdriver.co.za/verify/BD-2026-00127",
};

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
    question: "What does R75 per month actually include?",
    answer: "The R75 per driver per month covers the full training programme, all evaluations, your professional certification, and quarterly CPD sessions for as long as you remain subscribed. There are no hidden costs.",
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
