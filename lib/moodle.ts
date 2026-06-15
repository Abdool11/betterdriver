/**
 * MOODLE INTEGRATION STUBS
 * ========================
 * BetterDriver uses Moodle as its LMS backend for the two driver programmes:
 *   1. Professional Truck Driver Programme
 *   2. Eco-Driver Training
 *
 * This file contains all the integration points between BD and Moodle.
 * Each function is marked with // MOODLE_STUB: and contains the exact
 * Moodle REST API call that Asif needs to implement.
 *
 * SETUP REQUIREMENTS (Asif):
 * --------------------------
 * 1. Enable Moodle Web Services:
 *    Site Admin → Plugins → Web Services → Enable web services → ON
 *    Site Admin → Plugins → Web Services → Enable protocols → REST → ON
 *
 * 2. Create a service token:
 *    Site Admin → Plugins → Web Services → Manage tokens → Add
 *    - User: a dedicated service account (e.g., bdservice@yourdomain.com)
 *    - Service: Create a custom service with the functions listed below
 *
 * 3. Required Moodle functions to enable on your service:
 *    - core_user_create_users
 *    - core_user_get_users_by_field
 *    - enrol_manual_enrol_users
 *    - core_course_get_courses
 *    - core_completion_get_course_completion_status
 *    - core_course_get_contents
 *    - gradereport_user_get_grade_items
 *
 * 4. Add to .env.local:
 *    MOODLE_URL=https://your-moodle-domain.com
 *    MOODLE_TOKEN=your_service_token_here
 *    MOODLE_DRIVER_PROGRAMME_COURSE_ID=1       # Course ID for Professional Truck Driver Programme
 *    MOODLE_ECO_DRIVER_COURSE_ID=2             # Course ID for Eco-Driver Training
 *
 * BASE URL PATTERN:
 *   {MOODLE_URL}/webservice/rest/server.php?wstoken={MOODLE_TOKEN}&moodlewsrestformat=json&wsfunction={FUNCTION}
 */

const MOODLE_URL = process.env.MOODLE_URL ?? "";
const MOODLE_TOKEN = process.env.MOODLE_TOKEN ?? "";

function checkMoodleConfig() {
  if (!MOODLE_URL || !MOODLE_TOKEN) {
    throw new Error(
      "[Moodle] Not configured — MOODLE_URL and/or MOODLE_TOKEN environment variables are missing."
    );
  }
}

/** Map BD programme slugs to Moodle course IDs */
export const MOODLE_COURSE_IDS: Record<string, number> = {
  "professional-truck-driver": parseInt(process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID ?? "0"),
  "eco-driver": parseInt(process.env.MOODLE_ECO_DRIVER_COURSE_ID ?? "0"),
  // Aliases used in the database and invitations
  "ptdp": parseInt(process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID ?? "0"),
  "p1": parseInt(process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID ?? "0"),
  "p2": parseInt(process.env.MOODLE_ECO_DRIVER_COURSE_ID ?? "0"),
};

/** Normalize a programme slug to a canonical Moodle key */
export function normalizeProgrammeSlug(slug: string): "professional-truck-driver" | "eco-driver" {
  const map: Record<string, "professional-truck-driver" | "eco-driver"> = {
    "ptdp": "professional-truck-driver",
    "p1": "professional-truck-driver",
    "professional-truck-driver": "professional-truck-driver",
    "eco-driver": "eco-driver",
    "p2": "eco-driver",
  };
  return map[slug] ?? "professional-truck-driver";
}

function moodleUrl(fn: string, params: Record<string, string | number> = {}): string {
  checkMoodleConfig();
  const base = `${MOODLE_URL}/webservice/rest/server.php`;
  const qs = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    moodlewsrestformat: "json",
    wsfunction: fn,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  return `${base}?${qs.toString()}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoodleUser {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
}

export interface MoodleEnrolment {
  courseid: number;
  userid: number;
  roleid: number; // 5 = student
}

export interface MoodleCompletionStatus {
  completed: boolean;
  completiongrade: number | null;
  completedmodules: number;
  totalmodules: number;
  progressPercent: number;
}

export interface MoodleModule {
  id: number;
  name: string;
  completionstate: number; // 0 = incomplete, 1 = complete
  url?: string;
}

// ─── User Management ──────────────────────────────────────────────────────────

/**
 * MOODLE_STUB: Provision a Moodle account for a newly activated driver.
 * Called from /api/activate when a driver completes activation.
 *
 * Moodle API: core_user_create_users
 * POST {MOODLE_URL}/webservice/rest/server.php
 * Body: wstoken, wsfunction=core_user_create_users, moodlewsrestformat=json,
 *       users[0][username], users[0][password], users[0][firstname],
 *       users[0][lastname], users[0][email]
 *
 * Returns: [{ id: number, username: string }]
 */
export async function moodleCreateUser(params: {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
}): Promise<{ id: number; username: string }> {
  checkMoodleConfig();
  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: "core_user_create_users",
    moodlewsrestformat: "json",
    "users[0][username]": params.username,
    "users[0][password]": params.password,
    "users[0][firstname]": params.firstname,
    "users[0][lastname]": params.lastname,
    "users[0][email]": params.email,
    "users[0][auth]": "manual",
  });
  const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (data.exception) {
    throw new Error(`[Moodle] moodleCreateUser failed: ${data.message}`);
  }
  return data[0] as { id: number; username: string };
}

/**
 * MOODLE_STUB: Look up a Moodle user by email address.
 * Used to check if a user already exists before creating.
 *
 * Moodle API: core_user_get_users_by_field
 * GET {MOODLE_URL}/webservice/rest/server.php?wsfunction=core_user_get_users_by_field&field=email&values[0]={email}
 */
export async function moodleGetUserByEmail(email: string): Promise<MoodleUser | null> {
  const url = moodleUrl("core_user_get_users_by_field", { field: "email", "values[0]": email });
  const res = await fetch(url);
  const data = await res.json();
  if (data.exception) {
    throw new Error(`[Moodle] moodleGetUserByEmail failed: ${data.message}`);
  }
  return data.length > 0 ? (data[0] as MoodleUser) : null;
}

// ─── Enrolment ────────────────────────────────────────────────────────────────

/**
 * MOODLE_STUB: Enrol a driver in a course when their training order is activated.
 * Called from GFA when a cohort campaign is activated (magic link dispatch).
 *
 * Moodle API: enrol_manual_enrol_users
 * POST body: enrolments[0][roleid]=5 (student), enrolments[0][userid], enrolments[0][courseid]
 *
 * NOTE: The enrolment plugin "Manual enrolments" must be enabled on the course in Moodle.
 */
export async function moodleEnrolUser(params: {
  moodleUserId: number;
  programmeSlug: "professional-truck-driver" | "eco-driver";
}): Promise<boolean> {
  checkMoodleConfig();
  const courseId = MOODLE_COURSE_IDS[params.programmeSlug];
  if (!courseId) {
    console.error(`[Moodle] No course ID configured for programme: ${params.programmeSlug}`);
    return false;
  }

  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: "enrol_manual_enrol_users",
    moodlewsrestformat: "json",
    "enrolments[0][roleid]": "5",
    "enrolments[0][userid]": String(params.moodleUserId),
    "enrolments[0][courseid]": String(courseId),
  });
  const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, { method: "POST", body });
  const data = await res.json();
  if (data && data.exception) {
    console.error(`[Moodle] moodleEnrolUser failed: ${data.message}`);
    return false;
  }
  return true;
}

// ─── Progress Tracking ────────────────────────────────────────────────────────

/**
 * MOODLE_STUB: Get a driver's course completion progress.
 * Called by /api/portal/dashboard to populate the portal home progress bar.
 *
 * Moodle API: core_completion_get_course_completion_status
 * GET ?wsfunction=core_completion_get_course_completion_status&courseid={courseId}&userid={userId}
 *
 * NOTE: Course completion tracking must be enabled in Moodle:
 *   Site Admin → Advanced features → Enable completion tracking → ON
 *   Course settings → Completion tracking → Enabled, control via completion and activity settings
 */
export async function moodleGetProgress(params: {
  moodleUserId: number;
  programmeSlug: "professional-truck-driver" | "eco-driver";
}): Promise<MoodleCompletionStatus> {
  const courseId = MOODLE_COURSE_IDS[params.programmeSlug];

  const url = moodleUrl("core_completion_get_course_completion_status", {
    courseid: courseId,
    userid: params.moodleUserId,
  });
  const res = await fetch(url);
  const data = await res.json();
  if (data.exception) {
    console.error(`[Moodle] moodleGetProgress failed: ${data.message}`);
    return { completed: false, completiongrade: null, completedmodules: 0, totalmodules: 0, progressPercent: 0 };
  }
  const status = data.completionstatus;
  const completions: { complete: boolean }[] = status.completions ?? [];
  const totalmodules = completions.length;
  const completedmodules = completions.filter((c) => c.complete).length;
  const progressPercent = totalmodules > 0 ? Math.round((completedmodules / totalmodules) * 100) : 0;
  return {
    completed: status.completed as boolean,
    completiongrade: null,
    completedmodules,
    totalmodules,
    progressPercent,
  };
}

/**
 * MOODLE_STUB: Get the list of modules/activities in a course with completion state.
 * Used by Driver University page to show module list with tick/untick.
 *
 * Moodle API: core_course_get_contents
 * GET ?wsfunction=core_course_get_contents&courseid={courseId}
 *
 * Returns course sections with modules. Each module has completionstate:
 *   0 = incomplete, 1 = complete, 2 = complete (pass), 3 = complete (fail)
 */
export async function moodleGetCourseModules(params: {
  moodleUserId: number;
  programmeSlug: "professional-truck-driver" | "eco-driver";
}): Promise<MoodleModule[]> {
  const courseId = MOODLE_COURSE_IDS[params.programmeSlug];

  const url = moodleUrl("core_course_get_contents", { courseid: courseId });
  const res = await fetch(url);
  const sections = await res.json();
  if (!Array.isArray(sections)) {
    console.error(`[Moodle] moodleGetCourseModules failed: ${sections?.message ?? "unexpected response"}`);
    return [];
  }
  const modules: MoodleModule[] = [];
  for (const section of sections) {
    for (const mod of section.modules ?? []) {
      modules.push({
        id: mod.id as number,
        name: mod.name as string,
        completionstate: (mod.completiondata?.state ?? 0) as number,
        url: mod.url as string | undefined,
      });
    }
  }
  return modules;
}

/**
 * MOODLE_STUB: Check if a driver has completed their course (for certificate generation).
 * Called by /api/portal/certificate to determine if certificate is ready.
 *
 * Moodle API: gradereport_user_get_grade_items
 * GET ?wsfunction=gradereport_user_get_grade_items&courseid={courseId}&userid={userId}
 */
export async function moodleIsCourseComplete(params: {
  moodleUserId: number;
  programmeSlug: "professional-truck-driver" | "eco-driver";
}): Promise<boolean> {
  const progress = await moodleGetProgress(params);
  return progress.completed;
}

// ─── SSO / Deep Link ──────────────────────────────────────────────────────────

/**
 * Generate a signed auto-login URL that a small PHP script on the Moodle server
 * can verify, then log the user in programmatically and redirect to the target
 * course module. This removes the need for the driver to manually log into Moodle.
 *
 * SETUP (Asif / Moodle admin):
 *   1. Copy docs/moodle-autologin.php to your Moodle server at:
 *      {moodle_root}/local/betterdriver/autologin.php
 *   2. Set the same secret in both places:
 *      - BetterDriver .env.local: MOODLE_AUTOLOGIN_SECRET=... (min 32 chars)
 *      - PHP script: $SHARED_SECRET = '...';
 *   3. In Moodle: Site Admin → Security → HTTP security → Allow frame embedding → ON
 *
 * The token is a short-lived JWT (5 minutes) signed with the shared secret.
 */
const AUTOLOGIN_SECRET = new TextEncoder().encode(
  process.env.MOODLE_AUTOLOGIN_SECRET ?? ""
);

export async function generateMoodleAutoLoginUrl(params: {
  moodleUserId: number;
  redirectUrl: string;
}): Promise<string | null> {
  if (!MOODLE_URL || !AUTOLOGIN_SECRET.byteLength) return null;

  const { SignJWT } = await import("jose");
  const token = await new SignJWT({
    uid: params.moodleUserId,
    redirect: params.redirectUrl,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(AUTOLOGIN_SECRET);

  const scriptUrl = `${MOODLE_URL}/local/betterdriver/autologin.php`;
  const qs = new URLSearchParams({ token, redirect: params.redirectUrl });
  return `${scriptUrl}?${qs.toString()}`;
}

export function moodleCourseUrl(programmeSlug: "professional-truck-driver" | "eco-driver"): string {
  const courseId = MOODLE_COURSE_IDS[programmeSlug];
  return `${MOODLE_URL}/course/view.php?id=${courseId}`;
}

// ─── CPD Modules ──────────────────────────────────────────────────────────────

/**
 * MOODLE_STUB: Enrol a driver in a CPD refresh module.
 * CPD modules are separate short courses in Moodle, pushed quarterly by GFA admin.
 *
 * Workflow:
 * 1. GFA admin creates a new CPD course in Moodle
 * 2. GFA admin triggers CPD push from GFA admin panel (calls this function for all active drivers)
 * 3. Drivers see the new CPD module in their BD portal CPD tab
 *
 * Implementation: Same as moodleEnrolUser but with a CPD course ID.
 * Store CPD course IDs in a separate table: cpd_modules (id, moodle_course_id, title, quarter, year)
 */
export async function moodleEnrolInCPD(params: {
  moodleUserId: number;
  cpdMoodleCourseId: number;
}): Promise<boolean> {
  checkMoodleConfig();
  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: "enrol_manual_enrol_users",
    moodlewsrestformat: "json",
    "enrolments[0][roleid]": "5",
    "enrolments[0][userid]": String(params.moodleUserId),
    "enrolments[0][courseid]": String(params.cpdMoodleCourseId),
  });
  const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, { method: "POST", body });
  const data = await res.json();
  if (data && data.exception) {
    console.error(`[Moodle] moodleEnrolInCPD failed: ${data.message}`);
    return false;
  }
  return true;
}
