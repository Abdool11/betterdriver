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

/** Map BD programme slugs to Moodle course IDs */
export const MOODLE_COURSE_IDS: Record<string, number> = {
  "professional-truck-driver": parseInt(process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID ?? "0"),
  "eco-driver": parseInt(process.env.MOODLE_ECO_DRIVER_COURSE_ID ?? "0"),
};

function moodleUrl(fn: string, params: Record<string, string | number> = {}): string {
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
  // MOODLE_STUB: Replace this with the actual Moodle API call
  // Example implementation:
  //
  // const body = new URLSearchParams({
  //   wstoken: MOODLE_TOKEN,
  //   wsfunction: "core_user_create_users",
  //   moodlewsrestformat: "json",
  //   "users[0][username]": params.username,
  //   "users[0][password]": params.password,
  //   "users[0][firstname]": params.firstname,
  //   "users[0][lastname]": params.lastname,
  //   "users[0][email]": params.email,
  //   "users[0][auth]": "manual",
  // });
  // const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, {
  //   method: "POST",
  //   body,
  // });
  // const data = await res.json();
  // return data[0]; // { id, username }

  console.warn("[MOODLE_STUB] moodleCreateUser called — not yet implemented");
  return { id: 0, username: params.username };
}

/**
 * MOODLE_STUB: Look up a Moodle user by email address.
 * Used to check if a user already exists before creating.
 *
 * Moodle API: core_user_get_users_by_field
 * GET {MOODLE_URL}/webservice/rest/server.php?wsfunction=core_user_get_users_by_field&field=email&values[0]={email}
 */
export async function moodleGetUserByEmail(email: string): Promise<MoodleUser | null> {
  // MOODLE_STUB: Replace with actual Moodle API call
  // const url = moodleUrl("core_user_get_users_by_field", { field: "email", "values[0]": email });
  // const res = await fetch(url);
  // const data = await res.json();
  // return data.length > 0 ? data[0] : null;

  console.warn("[MOODLE_STUB] moodleGetUserByEmail called — not yet implemented");
  return null;
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
  const courseId = MOODLE_COURSE_IDS[params.programmeSlug];
  if (!courseId) {
    console.error(`[MOODLE_STUB] No course ID configured for programme: ${params.programmeSlug}`);
    return false;
  }

  // MOODLE_STUB: Replace with actual Moodle API call
  // const body = new URLSearchParams({
  //   wstoken: MOODLE_TOKEN,
  //   wsfunction: "enrol_manual_enrol_users",
  //   moodlewsrestformat: "json",
  //   "enrolments[0][roleid]": "5",
  //   "enrolments[0][userid]": String(params.moodleUserId),
  //   "enrolments[0][courseid]": String(courseId),
  // });
  // const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, { method: "POST", body });
  // const data = await res.json();
  // return !data.exception; // Moodle returns null on success, exception object on failure

  console.warn("[MOODLE_STUB] moodleEnrolUser called — not yet implemented");
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

  // MOODLE_STUB: Replace with actual Moodle API call
  // const url = moodleUrl("core_completion_get_course_completion_status", {
  //   courseid: courseId,
  //   userid: params.moodleUserId,
  // });
  // const res = await fetch(url);
  // const data = await res.json();
  // Parse data.completionstatus.completions array to count completed vs total activities

  console.warn("[MOODLE_STUB] moodleGetProgress called — not yet implemented");
  return {
    completed: false,
    completiongrade: null,
    completedmodules: 0,
    totalmodules: 12,
    progressPercent: 0,
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

  // MOODLE_STUB: Replace with actual Moodle API call
  // const url = moodleUrl("core_course_get_contents", { courseid: courseId });
  // const res = await fetch(url);
  // const sections = await res.json();
  // Flatten sections[].modules[] into a flat array of MoodleModule

  console.warn("[MOODLE_STUB] moodleGetCourseModules called — not yet implemented");
  return [];
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
 * MOODLE_STUB: Generate a direct deep-link URL into a specific Moodle course.
 * Used by Driver University to launch the actual Moodle course content.
 *
 * Two options for Asif:
 *
 * OPTION A — Moodle iframe embed (recommended for seamless UX):
 *   Embed the Moodle course page in an iframe within the BD portal.
 *   Requires Moodle to allow iframe embedding:
 *     Site Admin → Security → HTTP security → Allow frame embedding → ON
 *   URL: {MOODLE_URL}/course/view.php?id={courseId}
 *   The driver must be logged into Moodle — use the auto-login token approach below.
 *
 * OPTION B — Moodle auto-login token (for redirect):
 *   Generate a one-time auto-login token for the driver, then redirect to Moodle.
 *   Moodle API: auth_token_request_token (requires auth_token plugin)
 *   OR use the built-in ?logintoken= approach if Moodle version supports it.
 *
 * SIMPLEST APPROACH for Asif:
 *   Use Moodle's "Auto-login" feature with a shared secret:
 *   Site Admin → Plugins → Authentication → Manage authentication → Auto-login key
 *   Then construct: {MOODLE_URL}/login/token.php?username={username}&password={password}&service=moodle_mobile_app
 *   And redirect to: {MOODLE_URL}/course/view.php?id={courseId}
 */
export function moodleCourseUrl(programmeSlug: "professional-truck-driver" | "eco-driver"): string {
  const courseId = MOODLE_COURSE_IDS[programmeSlug];
  // MOODLE_STUB: Replace with actual course URL construction
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
  // MOODLE_STUB: Same implementation as moodleEnrolUser but with cpdMoodleCourseId
  console.warn("[MOODLE_STUB] moodleEnrolInCPD called — not yet implemented");
  return true;
}
