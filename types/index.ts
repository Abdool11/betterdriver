// ─── BetterDriver — TypeScript Interfaces ─────────────────────────────────────
// All data shapes used across the BetterDriver frontend.
// TODO: Asif to validate these against Supabase schema and Moodle API responses.

export interface Driver {
  id: string;
  name: string;
  email: string;
  mobile: string;
  licenceNumber?: string;
  pdpNumber?: string;
  companyName?: string;
  companyId?: string;
  profileCompletionPercent: number;
  joinedAt: string; // ISO8601
}

export interface Programme {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  audience: string;
  priceLabel: string;
  priceMonthly?: number; // ZAR, for subscription programmes
  priceOnce?: number;    // ZAR, for once-off programmes
  durationLabel: string;
  hasCPD: boolean;
  tier: 1 | 2 | 3;
  slug: string;
}

export interface Module {
  id: string;
  programmeId: string;
  title: string;
  description: string;
  durationMinutes: number;
  order: number;
  type: "video" | "reading" | "quiz" | "assessment";
}

export interface Enrolment {
  id: string;
  programmeId: string;
  programmeTitle: string;
  status: "enrolled" | "in-progress" | "certified" | "cpd-active";
  progressPercent: number;
  currentModuleId?: string;
  currentModuleTitle?: string;
  startedAt?: string; // ISO8601
  completedAt?: string; // ISO8601
  certificateUrl?: string;
  cpdCompletions: number;
  nextCpdDueDate?: string; // ISO8601
  lastActivityAt?: string; // ISO8601
}

export interface Task {
  id: string;
  type: "module" | "quiz" | "cpd" | "refresh" | "profile" | "assessment";
  title: string;
  description: string;
  programmeId?: string;
  programmeTitle?: string;
  moduleId?: string;
  priority: "urgent" | "normal" | "upcoming";
  dueDate?: string; // ISO8601
  isOverdue: boolean;
  estimatedMinutes?: number;
  actionLabel: string;
  actionHref: string;
}

export interface Certificate {
  id: string;
  driverId: string;
  driverName: string;
  programmeId: string;
  programmeTitle: string;
  issuedAt: string; // ISO8601
  expiresAt?: string; // ISO8601
  certificateNumber: string;
  downloadUrl?: string;
  verificationUrl: string;
}

export interface CPDRecord {
  id: string;
  title: string;
  description: string;
  completedAt?: string; // ISO8601
  dueDate?: string; // ISO8601
  status: "completed" | "upcoming" | "overdue" | "urgent";
  completedOnTime?: boolean;
  programmeId: string;
  programmeTitle: string;
}

export interface ProfileSection {
  id: "personal" | "licence" | "employment";
  title: string;
  completionPercent: number;
  fields: ProfileField[];
}

export interface ProfileField {
  key: string;
  label: string;
  value?: string;
  type: "text" | "date" | "select" | "tel" | "email";
  required: boolean;
  options?: string[];
}

export interface RegistryEntry {
  id: string;
  driverName: string;
  certificateNumber: string;
  programmeTitle: string;
  issuedAt: string; // ISO8601
  verificationUrl: string;
}

export interface EnquiryFormData {
  organisationName: string;
  organisationRole: string;
  name: string;
  email: string;
  mobile: string;
  fleetSize?: string;
  message: string;
  type: "individual" | "fleet-company" | "general";
}
