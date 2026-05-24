// ─── TAG Website — TypeScript Interfaces ─────────────────────────────────────
// All data shapes for the TAG website.
// These interfaces define what Asif's API layer must return.

// ─── Metrics (Academy Impact Strip) ──────────────────────────────────────────
export interface TagMetrics {
  action_plans: number;
  workshops: number;
  partners: number;
  countries: number;
  last_updated: string; // ISO8601
  data_source: "live" | "demo";
}

// ─── Publication ──────────────────────────────────────────────────────────────
export interface Publication {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image_url?: string;
  download_url?: string;
  href: string;
  published_at?: string; // ISO8601
}

// ─── Enquiry Form ─────────────────────────────────────────────────────────────
export type EnquiryType =
  | "dfi"
  | "government"
  | "industry_body"
  | "fleet"
  | "partnership"
  | "other";

export interface EnquiryFormData {
  organisation_name: string;
  organisation_role: string; // role/type of organisation
  contact_name: string;
  email: string;
  mobile?: string; // optional
  fleet_size?: string; // optional — not compulsory
  nature_of_enquiry: string;
  enquiry_type: EnquiryType;
}

export interface EnquirySubmissionResult {
  success: boolean;
  message: string;
  reference_id?: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface NavSection {
  heading: string;
  links: NavLink[];
}

// ─── Ecosystem Platform ───────────────────────────────────────────────────────
export interface EcosystemPlatform {
  name: string;
  role: string;
  description: string;
  href: string;
  external: boolean;
}

// ─── Workshop / Event ─────────────────────────────────────────────────────────
// DATA REQUIREMENTS: Asif to implement /api/events endpoint
export interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string; // ISO8601
  location: string;
  type: "workshop" | "webinar" | "conference" | "intervention";
  status: "upcoming" | "completed" | "cancelled";
  registration_url?: string;
}

// ─── Knowledge Hub Article ────────────────────────────────────────────────────
// DATA REQUIREMENTS: Asif to implement /api/articles endpoint
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string; // ISO8601
  author?: string;
  cover_image_url?: string;
  href: string;
}

// ─── Partner ──────────────────────────────────────────────────────────────────
// DATA REQUIREMENTS: Asif to implement /api/partners endpoint
export interface Partner {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  type: "dfi" | "industry_body" | "government" | "technology" | "academic" | "ngo";
}
