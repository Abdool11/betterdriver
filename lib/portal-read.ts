export type CourseData = {
  programme: { title: string; progressPercent: number; totalModules: number; completedModules: number };
  modules: Array<{ id: string; name: string; status: "completed" | "available" | "locked"; locked: boolean; order: number; url?: string; downloadable?: boolean }>;
};

export const LEARNING_ERROR_MESSAGES: Record<string, string> = {
  DRIVER_NOT_FOUND: "Your driver profile could not be found. Please contact support.",
  DRIVER_LOOKUP: "Your driver profile is temporarily unavailable. Please retry.",
  ASSIGNMENT_LOOKUP: "Your training assignment could not be checked. Please retry.",
  LEARNING_ACCOUNT_PENDING: "Your learning account is still being prepared. Please contact your fleet manager.",
  COURSE_EMPTY: "Your assigned programme has no available learning activities. Please contact support.",
  MOODLE_CONFIG: "The learning connection is not configured. Please contact support.",
  MOODLE_COURSE_CONFIG: "Your programme connection is not configured. Please contact support.",
  MOODLE_HTTP: "The learning service returned an error. Please retry or contact support.",
  MOODLE_ACCESS: "The learning service could not authorise this progress check. Please contact support.",
  MOODLE_TIMEOUT: "The learning service took too long to respond. Please retry.",
  MOODLE_NETWORK: "The learning service could not be reached. Please retry.",
  MOODLE_JSON: "The learning service returned an unreadable response. Please contact support.",
  MOODLE_PAYLOAD: "Your learning progress could not be verified. Please contact support.",
  LEARNING_UNAVAILABLE: "Your learning information is temporarily unavailable. Please retry.",
};

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function count(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
export function isCourseData(value: unknown): value is CourseData {
  if (!object(value) || !object(value.programme) || !Array.isArray(value.modules)) return false;
  if (value.learningStatus !== "available" && value.learningStatus !== "not_assigned") return false;
  if ((value.learningStatus === "not_assigned") !== (value.modules.length === 0)) return false;
  const p = value.programme;
  if (typeof p.title !== "string" || !count(p.completedModules) || !count(p.totalModules) || p.completedModules > p.totalModules || !count(p.progressPercent) || p.progressPercent > 100) return false;
  if (p.totalModules > value.modules.length || p.progressPercent !== (p.totalModules > 0 ? Math.round(p.completedModules / p.totalModules * 100) : 0)) return false;
  if (value.modules.filter((module) => object(module) && module.status === "completed").length !== p.completedModules) return false;
  const ids = new Set<string>();
  return value.modules.every((module) => {
    if (!object(module) || typeof module.id !== "string" || !module.id || ids.has(module.id) || typeof module.name !== "string" || !["completed", "available", "locked"].includes(String(module.status)) || typeof module.locked !== "boolean" || !count(module.order) || module.order < 1 || (module.status === "locked") !== module.locked) return false;
    ids.add(module.id);
    return (module.url === undefined || typeof module.url === "string") && (module.downloadable === undefined || typeof module.downloadable === "boolean");
  });
}
export function isCpdData(value: unknown): value is { completed: number; records: Array<Record<string, unknown>> } {
  return object(value) && count(value.completed) && Array.isArray(value.records) && value.records.every((record) => object(record) && typeof record.id === "string" && typeof record.title === "string" && ["completed", "overdue", "urgent", "upcoming"].includes(String(record.status)));
}
export function isDashboardData(value: unknown): value is { stats: Record<string, unknown>; nextModule?: { id: string; name: string } | null } {
  if (!object(value) || !object(value.stats)) return false;
  const s = value.stats;
  if (!["available", "unavailable", "not_assigned"].includes(String(s.learningStatus))) return false;
  if (typeof s.programmeTitle !== "string" || typeof s.firstName !== "string") return false;
  if (!("nextModule" in value)) return false;
  if (s.learningStatus === "available" && (!count(s.completedModules) || !count(s.totalModules) || !count(s.progressPercent) || s.completedModules > s.totalModules || s.progressPercent > 100)) return false;
  if (s.learningStatus === "available" && count(s.completedModules) && count(s.totalModules) && s.completedModules < s.totalModules && value.nextModule == null) return false;
  if (s.learningStatus === "unavailable" && (s.progressPercent !== null || s.completedModules !== null || s.totalModules !== null || value.nextModule != null)) return false;
  if (s.learningStatus === "not_assigned" && (s.progressPercent !== 0 || s.completedModules !== 0 || s.totalModules !== 0 || value.nextModule != null)) return false;
  if (!["available", "unavailable"].includes(String(s.cpdStatus)) || !["available", "unavailable"].includes(String(s.bulletinStatus))) return false;
  if (s.cpdStatus === "available" && (typeof s.cpdDue !== "boolean" || !count(s.cpdOverdueCount) || !count(s.cpdUpcomingCount))) return false;
  if (s.cpdStatus === "available" && count(s.cpdOverdueCount) && count(s.cpdUpcomingCount) && s.cpdDue !== (s.cpdOverdueCount + s.cpdUpcomingCount > 0)) return false;
  if (s.bulletinStatus === "available" && !count(s.unreadBulletins)) return false;
  return value.nextModule == null || (object(value.nextModule) && typeof value.nextModule.id === "string" && Boolean(value.nextModule.id.trim()) && typeof value.nextModule.name === "string" && Boolean(value.nextModule.name.trim()));
}

export function learningErrorText(value: unknown, status?: number): string {
  const data = object(value) ? value : {};
  const code = typeof data.code === "string" && LEARNING_ERROR_MESSAGES[data.code] ? data.code : "LEARNING_UNAVAILABLE";
  const ref = typeof data.requestId === "string" && /^[a-f0-9-]{36}$/i.test(data.requestId) ? ` Support reference: ${data.requestId}.` : "";
  return `${LEARNING_ERROR_MESSAGES[code]}${status ? ` (${code}; HTTP ${status})` : ` (${code})`}${ref}`;
}

/** A deadline includes response headers AND JSON decoding. No automatic retries/writes. */
export async function readPortalJson<T>(url: string, signal: AbortSignal, validate: (data: unknown) => data is T, timeoutMs = 30000): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const request = (async () => {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (response.status === 401) {
      window.location.assign("/start");
      throw new Error("Your session has expired. Open your authorised driver link again.");
    }
    let data: unknown;
    try { data = await response.json(); } catch { throw new Error(`The portal returned an unreadable response (HTTP ${response.status}). Please retry.`); }
    if (!response.ok) throw new Error(learningErrorText(data, response.status));
    if (!validate(data)) throw new Error("The portal returned incomplete learning information. Please retry or contact support (PORTAL_PAYLOAD).");
    return data;
  })();
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new Error("The progress check timed out. Please retry (PORTAL_TIMEOUT).")); controller.abort(); }, timeoutMs);
  });
  try { return await Promise.race([request, deadline]); }
  finally { if (timer) clearTimeout(timer); signal.removeEventListener("abort", abort); controller.abort(); }
}
