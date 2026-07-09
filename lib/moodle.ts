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
 *    - mod_quiz_get_quizzes_by_courses   (native quiz player)
 *    - mod_quiz_get_user_attempts        (native quiz player)
 *    - mod_quiz_start_attempt            (native quiz player)
 *    - mod_quiz_get_attempt_data         (native quiz player)
 *    - mod_quiz_process_attempt          (native quiz player)
 *    - mod_quiz_get_attempt_review       (native quiz player)
 *    - core_completion_update_activity_completion_status_manually
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

export const MOODLE_URL = process.env.MOODLE_URL ?? "";
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

export interface MoodleFile {
  type: string; // e.g. "file" | "url"
  filename: string;
  fileurl?: string;
  filesize?: number;
  mimetype?: string;
  content?: string;
}

export interface MoodleModule {
  id: number;
  name: string;
  modname: string; // e.g. "scorm", "page", "url", "resource"
  instance: number;
  completionstate: number; // 0 = incomplete, 1 = complete
  url?: string;
  files?: MoodleFile[];
  bunnyVideoId?: string;
  bunnyLibraryId?: string;
  videoUrl?: string; // direct video file URL (not Bunny) for native playback
}

/** Return the best on-disk file for a module (prefer video, fallback to first file). */
export function pickMoodleDownloadFile(files: MoodleFile[] | undefined): MoodleFile | undefined {
  if (!files || files.length === 0) return undefined;
  const onDisk = files.filter((f) => f.type === "file" && f.fileurl);
  if (onDisk.length === 0) return undefined;
  const video = onDisk.find(
    (f) => f.mimetype?.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi|m4v)(\?|$)/i.test(f.filename)
  );
  return video ?? onDisk[0];
}

/** Check whether a URL points to a video file we can play natively. */
export function isVideoFileUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  const hasVideoExtension = /\.(mp4|webm|mov|mkv|avi|m4v|ogv)(\?|#|$)/i.test(lower);
  const hasVideoMimeHint = /[?&](mime=video|format=video)/i.test(url);
  return hasVideoExtension || hasVideoMimeHint;
}

/** Extract Bunny Stream iframe embed URL from Moodle page HTML. */
export function extractBunnyEmbedUrl(html: string): { libraryId: string; videoId: string } | null {
  const match = html.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i);
  if (!match) return null;
  return { libraryId: match[1], videoId: match[2] };
}

/** Build the direct Bunny CDN MP4 URL from video metadata. */
export function getBunnyVideoUrl(videoId: string): string {
  const hostname = process.env.BUNNY_CDN_HOSTNAME ?? "vz-dbdd6b8d-c35.b-cdn.net";
  return `https://${hostname}/${videoId}/play_720p.mp4`;
}

function ensureDownloadUrl(fileurl: string): string {
  let absolute = fileurl;
  if (absolute.startsWith("/")) {
    absolute = `${MOODLE_URL.replace(/\/$/, "")}${absolute}`;
  }
  const url = new URL(absolute);
  url.searchParams.set("forcedownload", "1");
  return url.toString();
}

/** Append the Moodle web service token to a pluginfile URL for server-side fetches.
 *  If the URL already contains a token (e.g. returned by core_course_get_contents),
 *  keep it — it is the user-specific token Moodle generated for that file.
 */
export function withMoodleToken(fileurl: string): string {
  const url = new URL(fileurl);
  if (!url.searchParams.get("token")) {
    checkMoodleConfig();
    url.searchParams.set("token", MOODLE_TOKEN);
  }
  return url.toString();
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
 * MOODLE_STUB: Mark a course module as complete (or incomplete) for a user.
 * Called from /api/portal/progress when the driver finishes a video or quiz.
 *
 * Moodle API: core_completion_update_activity_completion_status_manually
 * POST body: cmid, userid, completed (1 or 0)
 *
 * NOTE: The activity in Moodle must have completion tracking enabled and
 *       allow manual completion marking.
 */
export async function moodleUpdateModuleCompletion(params: {
  moodleUserId: number;
  cmid: number;
  completed: boolean;
}): Promise<boolean> {
  checkMoodleConfig();
  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: "core_completion_update_activity_completion_status_manually",
    moodlewsrestformat: "json",
    cmid: String(params.cmid),
    userid: String(params.moodleUserId),
    completed: params.completed ? "1" : "0",
  });
  const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, { method: "POST", body });
  const data = await res.json();
  if (data && data.exception) {
    console.error(`[Moodle] moodleUpdateModuleCompletion failed: ${data.message}`);
    return false;
  }
  return true;
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
    const sectionModules = (section.modules ?? []).slice().sort((a: any, b: any) => {
      const aIsQuiz = (a.modname ?? "") === "quiz";
      const bIsQuiz = (b.modname ?? "") === "quiz";
      if (aIsQuiz && !bIsQuiz) return 1;
      if (!aIsQuiz && bIsQuiz) return -1;
      return 0;
    });
    for (const mod of sectionModules) {
      // Skip modules that are hidden, not visible to the user, not shown on the
      // course page, or are internal Moodle types (e.g. question bank) that
      // should not appear as learning activities in the BetterDriver portal.
      if (mod.visible === 0) continue;
      if (mod.uservisible === false) continue;
      if (mod.visibleoncoursepage === 0) continue;
      if ((mod.modname ?? "") === "qbank") continue;

      const rawFiles: unknown[] = mod.contents ?? [];
      const files: MoodleFile[] = rawFiles.map((content: any) => ({
        type: (content.type ?? "file") as string,
        filename: (content.filename ?? "") as string,
        fileurl: content.fileurl
          ? ensureDownloadUrl(content.fileurl as string)
          : undefined,
        filesize: (content.filesize as number | undefined) ?? undefined,
        mimetype: (content.mimetype as string | undefined) ?? undefined,
        content: (content.content as string | undefined) ?? undefined,
      }));

      // Detect direct video files for native playback
      const videoFile = files.find(
        (f) => f.type === "file" && f.fileurl && isVideoFileUrl(f.fileurl)
      );

      modules.push({
        id: mod.id as number,
        name: mod.name as string,
        modname: (mod.modname ?? "page") as string,
        instance: (mod.instance ?? mod.id) as number,
        completionstate: (mod.completiondata?.state ?? 0) as number,
        url: (mod.url as string | undefined) || undefined,
        files,
        videoUrl: videoFile?.fileurl,
      });
    }
  }

  // Debug: log all modules with their types
  console.log(`[Moodle] Course ${courseId} modules:`, modules.map((m) => ({ id: m.id, name: m.name, modname: m.modname, bunnyVideoId: m.bunnyVideoId, videoUrl: m.videoUrl })));

  // Fetch Bunny embed data for page modules in parallel and detect Bunny URLs in url modules
  await Promise.all(
    modules
      .filter((m) => m.modname === "page" || m.modname === "url")
      .map(async (mod) => {
        // For URL modules, the external URL itself may be a Bunny embed or direct video
        if (mod.modname === "url" && mod.url) {
          const urlLower = mod.url.toLowerCase();
          if (urlLower.includes("iframe.mediadelivery.net")) {
            const bunny = extractBunnyEmbedUrl(mod.url);
            if (bunny) {
              mod.bunnyLibraryId = bunny.libraryId;
              mod.bunnyVideoId = bunny.videoId;
            }
          } else if (isVideoFileUrl(mod.url)) {
            mod.videoUrl = mod.url;
          }
          return;
        }

        const htmlFile = (mod.files ?? []).find((f) => f.filename === "index.html" && f.fileurl);
        if (!htmlFile?.fileurl) return;

        const htmlUrl = withMoodleToken(htmlFile.fileurl);
        try {
          const htmlRes = await fetch(htmlUrl);
          if (htmlRes.ok) {
            const html = await htmlRes.text();
            const bunny = extractBunnyEmbedUrl(html);
            if (bunny) {
              mod.bunnyLibraryId = bunny.libraryId;
              mod.bunnyVideoId = bunny.videoId;
            }
          }
        } catch (err) {
          console.error(`[Moodle] Failed to fetch HTML for module ${mod.id}:`, err);
        }
      })
  );

  return modules;
}

// ─── Quiz Support ─────────────────────────────────────────────────────────────

export interface MoodleQuiz {
  id: number;
  coursemodule: number;
  name: string;
  intro?: string;
  grade: number;
  sumgrades: number;
  gradepass: number;
  attemptallowed: number;
}

export interface MoodleQuizAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  state: "inprogress" | "finished" | "overdue" | "abandoned";
  sumgrades: number | null;
  timestart: number;
  timefinish: number | null;
}

export interface MoodleQuizQuestion {
  slot: number;
  type: string; // e.g. "multichoice", "truefalse", "shortanswer"
  page: number;
  html: string; // question text HTML
  sequencecheck: number;
  options?: {
    answers?: { id: number; text: string; fraction: number }[];
  };
}

export interface MoodleQuizAttemptData {
  attempt: MoodleQuizAttempt;
  questions: MoodleQuizQuestion[];
}

/**
 * Fetch quiz metadata for a given course-module ID.
 * Moodle API: mod_quiz_get_quizzes_by_courses
 */
export async function moodleGetQuizForModule(cmid: number): Promise<MoodleQuiz | null> {
  const url = moodleUrl("mod_quiz_get_quizzes_by_courses", {});
  const res = await fetch(url);
  const data = await res.json();
  if (data.exception) {
    console.error(`[Moodle] mod_quiz_get_quizzes_by_courses failed: ${data.message}`);
    return null;
  }
  const quizzes: MoodleQuiz[] = (data.quizzes ?? []);
  console.log(`[Moodle] mod_quiz_get_quizzes_by_courses returned ${quizzes.length} quizzes. Looking for cmid=${cmid}`);
  // Moodle returns coursemodule as a string; coerce to number for comparison
  const quiz = quizzes.find((q) => Number(q.coursemodule) === cmid) ?? null;
  if (!quiz) {
    console.warn(`[Moodle] No quiz found with coursemodule=${cmid}. Available coursemodules: ${quizzes.map((q) => q.coursemodule).join(", ")}`);
  }
  return quiz;
}

/**
 * Get a user's attempts on a specific quiz.
 * Moodle API: mod_quiz_get_user_attempts
 */
export async function moodleGetQuizAttempts(
  quizId: number,
  userId: number
): Promise<MoodleQuizAttempt[]> {
  const url = moodleUrl("mod_quiz_get_user_attempts", { quizid: quizId, userid: userId });
  const res = await fetch(url);
  const data = await res.json();
  if (data.exception) {
    console.error(`[Moodle] mod_quiz_get_user_attempts failed: ${data.message}`);
    return [];
  }
  return (data.attempts ?? []) as MoodleQuizAttempt[];
}

/**
 * Start a new quiz attempt for the current user.
 * Moodle API: mod_quiz_start_attempt
 */
export async function moodleStartQuizAttempt(quizId: number): Promise<MoodleQuizAttempt | null> {
  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: "mod_quiz_start_attempt",
    moodlewsrestformat: "json",
    quizid: String(quizId),
    forcenew: "1",
  });
  const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, { method: "POST", body });
  const data = await res.json();
  if (data.exception) {
    console.error(`[Moodle] mod_quiz_start_attempt failed: ${data.message}`);
    return null;
  }
  const attempt = (data.attempt ?? null) as MoodleQuizAttempt | null;
  return attempt;
}

/**
 * Parse answer choices from Moodle question HTML.
 * Moodle embeds radio/checkbox inputs with labels in the question HTML.
 * This is a fallback for when the API doesn't return structured options.
 */
function parseChoicesFromHtml(html: string): { id: number; text: string; fraction: number }[] {
  const answers: { id: number; text: string; fraction: number }[] = [];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match all radio/checkbox inputs whose name contains "_answer"
  // Moodle format (legacy): <input type="radio" name="q123:1_answer" value="0" id="q123:1_answer0" />
  //                           <label for="q123:1_answer0">Option text</label>
  // Moodle format (modern):  <input type="radio" ... value="0" id="q123:1_answer0"
  //                           aria-labelledby="q123:1_answer0_label" />
  //                           <div id="q123:1_answer0_label" ...><span>a. </span>
  //                             <div class="flex-fill">Option text</div></div>
  const inputRegex = /<input[^>]*type=["'](?:radio|checkbox)["'][^>]*name=["'][^"']*_answer["'][^>]*>/gi;
  const inputs = html.match(inputRegex) || [];

  for (const inputTag of inputs) {
    const valueMatch = inputTag.match(/value=["'](-?\d+)["']/i);
    if (!valueMatch) continue;
    const value = parseInt(valueMatch[1], 10);
    // value -1 is Moodle's "Clear my choice" control, not a real answer
    if (value < 0) continue;

    let labelText = "";

    // Modern Moodle: the answer text lives in the element referenced by aria-labelledby
    const labelledBy = inputTag.match(/aria-labelledby=["']([^"']+)["']/i);
    if (labelledBy) {
      const lblId = labelledBy[1];
      const blockMatch = html.match(
        new RegExp(`<[^>]*id=["']${esc(lblId)}["'][^>]*>([\\s\\S]*?)</(?:div|label)>`, "i")
      );
      if (blockMatch) {
        const block = blockMatch[1];
        // Prefer the dedicated answer-text node (.flex-fill), else use the whole block
        const flex = block.match(
          /<div[^>]*class=["'][^"']*flex-fill[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
        );
        labelText = (flex ? flex[1] : block).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      }
    }

    // Legacy Moodle: <label for="inputId">Option text</label>
    if (!labelText) {
      const idMatch = inputTag.match(/id=["']([^"']+)["']/i);
      if (idMatch) {
        const labelRegex = new RegExp(
          `<label[^>]*for=["']${esc(idMatch[1])}["'][^>]*>(.*?)</label>`,
          "is"
        );
        const labelMatch = html.match(labelRegex);
        if (labelMatch) {
          labelText = labelMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        }
      }
    }

    // Fallback: input wrapped inside a <label>...</label>
    if (!labelText) {
      const escapedInput = esc(inputTag);
      const wrapMatch = html.match(new RegExp(`<label[^>]*>\\s*${escapedInput}(.*?)</label>`, "is"));
      if (wrapMatch) {
        labelText = wrapMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      }
    }

    // Strip a leading answer bullet like "a. " if still present
    labelText = labelText.replace(/^[a-z]\.\s*/i, "").trim();

    if (labelText) {
      answers.push({ id: value, text: labelText, fraction: 0 });
    }
  }

  return answers;
}

/**
 * Fetch questions for an in-progress attempt.
 * Moodle API: mod_quiz_get_attempt_data
 */
export async function moodleGetAttemptData(
  attemptId: number,
  page = 0
): Promise<MoodleQuizAttemptData | null> {
  const url = moodleUrl("mod_quiz_get_attempt_data", { attemptid: attemptId, page });
  const res = await fetch(url);
  const data = await res.json();
  if (data.exception) {
    console.error(`[Moodle] mod_quiz_get_attempt_data failed: ${data.message}`);
    return null;
  }

  const attempt = (data.attempt ?? null) as MoodleQuizAttempt | null;
  if (!attempt) return null;

  const rawQuestions: any[] = data.questions ?? [];

  // Debug: log raw question data from Moodle so we can see actual types and options
  console.log(`[Moodle] mod_quiz_get_attempt_data returned ${rawQuestions.length} questions:`,
    rawQuestions.map((q) => ({
      slot: q.slot,
      type: q.type,
      qtype: q.qtype,
      hasOptions: !!q.options,
      optionsKeys: q.options ? Object.keys(q.options) : [],
      answersCount: q.options?.answers?.length ?? 0,
      firstAnswerKeys: q.options?.answers?.[0] ? Object.keys(q.options.answers[0]) : [],
    }))
  );

  const questions: MoodleQuizQuestion[] = rawQuestions.map((q) => {
    // Moodle may return the question type under "type" or "qtype" depending on version
    let type = (q.type ?? q.qtype ?? "") as string;
    const html = (q.html ?? "") as string;

    // If type is missing or empty, try to infer from HTML content
    if (!type) {
      if (/<textarea[^>]*name=["'][^"']*_answer["']/i.test(html)) {
        type = "essay";
      } else if (/<input[^>]*type=["'](?:radio|checkbox)["'][^>]*name=["'][^"']*_answer["']/i.test(html)) {
        type = "multichoice";
      } else if (/<select[^>]*name=["'][^"']*_answer["']/i.test(html)) {
        type = "multichoice";
      }
    }

    // Parse options from the Moodle API response.
    // Some Moodle versions return options as a JSON-encoded string.
    let rawOptions = q.options;
    if (typeof rawOptions === "string") {
      try {
        rawOptions = JSON.parse(rawOptions);
      } catch {
        rawOptions = undefined;
      }
    }

    // Question types that have selectable choices (radio buttons / checkboxes)
    const isChoiceType = type === "multichoice" || type === "truefalse";

    if (isChoiceType) {
      // Try to extract answers from the API options first.
      // Moodle uses "answer" as the field name for answer text, not "text".
      let answers = ((rawOptions?.answers ?? []) as any[]).map((a, idx) => ({
        id: (a.id ?? a.choice ?? idx) as number,
        text: (a.answer ?? a.text ?? "") as string,
        fraction: (a.fraction ?? 0) as number,
      }));

      // Fallback: if no answers came from the API, parse them from the HTML.
      // Moodle embeds radio/checkbox inputs with labels in the question HTML.
      if (answers.length === 0) {
        answers = parseChoicesFromHtml(html);
      }

      return {
        slot: q.slot as number,
        type,
        page: q.page as number,
        html,
        sequencecheck: (q.sequencecheck ?? 0) as number,
        options: answers.length > 0 ? { answers } : undefined,
      };
    }

    return {
      slot: q.slot as number,
      type,
      page: q.page as number,
      html,
      sequencecheck: (q.sequencecheck ?? 0) as number,
      options: undefined,
    };
  });

  return { attempt, questions };
}

/**
 * Save answers for a quiz attempt.
 * Moodle API: mod_quiz_process_attempt
 */
export async function moodleProcessQuizAttempt(
  attemptId: number,
  answers: Record<number, string | number>,
  sequenceChecks: Record<number, number> = {}
): Promise<void> {
  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: "mod_quiz_process_attempt",
    moodlewsrestformat: "json",
    attemptid: String(attemptId),
  });

  let idx = 0;
  for (const [slot, value] of Object.entries(answers)) {
    const slotNum = parseInt(slot, 10);
    const seq = sequenceChecks[slotNum] ?? 1;
    body.append(`data[${idx}][name]`, `q${attemptId}:${slot}_:sequencecheck`);
    body.append(`data[${idx}][value]`, String(seq));
    idx++;
    body.append(`data[${idx}][name]`, `q${attemptId}:${slot}_answer`);
    body.append(`data[${idx}][value]`, String(value));
    idx++;
  }

  const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, { method: "POST", body });
  const data = await res.json();
  if (data && data.exception) {
    throw new Error(`[Moodle] mod_quiz_process_attempt failed: ${data.message}`);
  }
}

/**
 * Finish (submit) a quiz attempt.
 * Moodle API: mod_quiz_process_attempt with finishattempt=1
 */
export async function moodleSubmitQuizAttempt(attemptId: number): Promise<MoodleQuizAttempt | null> {
  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: "mod_quiz_process_attempt",
    moodlewsrestformat: "json",
    attemptid: String(attemptId),
    finishattempt: "1",
  });

  const res = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, { method: "POST", body });
  const data = await res.json();
  if (data && data.exception) {
    console.error(`[Moodle] mod_quiz_process_attempt (finish) failed: ${data.message}`);
    return null;
  }
  // Moodle returns the updated attempt object directly or nested
  const attempt = (data.attempt ?? data) as MoodleQuizAttempt | null;
  return attempt;
}

/**
 * Review a finished attempt to see score / feedback.
 * Moodle API: mod_quiz_get_attempt_review
 */
export async function moodleGetAttemptReview(attemptId: number): Promise<{
  attempt: MoodleQuizAttempt;
  grade: number | null;
  questionTypes: string[];
  questions: {
    slot: number;
    type: string;
    state: string;
    mark: number | null;
    maxmark: number | null;
  }[];
} | null> {
  const url = moodleUrl("mod_quiz_get_attempt_review", { attemptid: attemptId });
  const res = await fetch(url);
  const data = await res.json();
  if (data.exception) {
    console.error(`[Moodle] mod_quiz_get_attempt_review failed: ${data.message}`);
    return null;
  }
  const attempt = (data.attempt ?? null) as MoodleQuizAttempt | null;
  const gradeRaw = data.grade;
  const grade: number | null =
    gradeRaw == null
      ? null
      : typeof gradeRaw === "number"
      ? gradeRaw
      : parseFloat(String(gradeRaw));
  if (!attempt) return null;

  const toNum = (v: any): number | null =>
    v == null ? null : typeof v === "number" ? v : parseFloat(String(v));

  const rawQuestions: any[] = Array.isArray(data.questions) ? data.questions : [];
  const questions = rawQuestions.map((q) => ({
    slot: Number(q.slot),
    type: String(q.type ?? q.qtype ?? ""),
    state: String(q.state ?? ""),
    mark: toNum(q.mark),
    maxmark: toNum(q.maxmark),
  }));

  const questionTypes: string[] = questions.map((q) => q.type).filter(Boolean);
  return { attempt, grade: isNaN(grade as number) ? null : grade, questionTypes, questions };
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

// ─── CPD Modules ──────────────────────────────────────────────────────────────

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
