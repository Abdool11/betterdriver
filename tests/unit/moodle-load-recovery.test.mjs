// Run through the repository's esbuild-backed unit runner (extensionless TS imports).
// All requests use fake origins and a non-pass-through fetch; never use dotenv or live services.
import assert from "node:assert/strict";

process.env.MOODLE_URL = "https://moodle.example.test/lms";
process.env.MOODLE_TOKEN = "FAKE_SERVICE_SECRET_123";
process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID = "101";
process.env.MOODLE_ECO_DRIVER_COURSE_ID = "102";
process.env.MOODLE_AUTOLOGIN_SECRET = "";
process.env.BUNNY_CDN_HOSTNAME = "video.example.test";

const {
  moodleGetLearningSnapshot,
  moodleGetActivityCompletionStatuses,
  getMoodleModuleDisplayState,
  withMoodleToken,
  MOODLE_COURSE_IDS,
} = await import("../../lib/moodle.ts");
const {
  MoodleReadError,
  moodleReadJson,
  moodleReadOptionalText,
  MOODLE_CRITICAL_READ_TIMEOUT_MS,
  MOODLE_OPTIONAL_READ_TIMEOUT_MS,
  MOODLE_OPTIONAL_BODY_LIMIT_BYTES,
} = await import("../../lib/moodle-read.ts");

const CONTENTS = "core_course_get_contents";
const ACTIVITY = "core_completion_get_activities_completion_status";
const SECRET = "FAKE_SERVICE_SECRET_123";
const UPSTREAM_SECRET = "raw upstream https://moodle.example.test/?token=DO_NOT_LOG_THIS";
const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const originalConsole = { log: console.log, warn: console.warn, error: console.error, debug: console.debug };
const logs = [];
const requests = [];
const timerBudgets = [];
const liveTimers = new Set();
let checks = 0;
let accelerateDeadlines = false;
let contentsHandler;
let activityHandler;
let htmlHandler;
let sections;
let statuses;

function resource(id, tracking = 2, extras = {}) {
  return {
    id, instance: id + 1000, name: `Learning ${id}`, modname: "resource",
    visible: 1, uservisible: true, visibleoncoursepage: 1,
    completion: tracking, completionstate: 1,
    completiondata: { state: 1, tracking, userid: 9999 }, contents: [], ...extras,
  };
}
function reset() {
  requests.length = 0;
  sections = [{ id: 1, name: "Driver learning", modules: [resource(10), resource(11), resource(90, 0)] }];
  statuses = [{ cmid: 10, state: 2, tracking: 2 }, { cmid: 11, state: 3, tracking: 2 }];
  contentsHandler = () => Response.json(structuredClone(sections));
  activityHandler = () => Response.json({ statuses: structuredClone(statuses) });
  htmlHandler = () => { throw new Error("Unexpected optional HTML request; no real fetch permitted"); };
}
const read = () => moodleGetLearningSnapshot({ moodleUserId: 7001, programmeSlug: "professional-truck-driver" });
const readActivities = () => moodleGetActivityCompletionStatuses({ moodleUserId: 7001, programmeSlug: "professional-truck-driver" });
async function rejectsCode(promise, code, operation) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof MoodleReadError);
    assert.equal(error.code, code);
    if (operation) assert.equal(error.operation, operation);
    const printable = [String(error), error.stack, JSON.stringify(error)].join(" ");
    assert.ok(!printable.includes(SECRET));
    assert.ok(!printable.includes("DO_NOT_LOG_THIS"));
    assert.ok(!printable.includes("https://"));
    assert.equal(error.cause, undefined);
    return true;
  });
  checks++;
}
function hangingFetch(_url, init) {
  return new Promise((_, reject) => {
    assert.ok(init.signal instanceof AbortSignal);
    init.signal.addEventListener("abort", () => reject(new Error(UPSTREAM_SECRET)), { once: true });
  });
}
function hangingBody(init) {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      // Emulate fetch's response body being aborted by its original fetch signal.
      init.signal.addEventListener("abort", () => controller.error(new Error(UPSTREAM_SECRET)), { once: true });
    },
    cancel() { cancelled = true; },
  });
  return { response: new Response(stream), wasCancelled: () => cancelled };
}

globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  assert.equal(url.origin, "https://moodle.example.test", "External fetches are forbidden, including optional media");
  assert.equal(init?.method ?? "GET", "GET", "Read path cannot mutate Moodle");
  assert.equal(init?.redirect, "manual", "Authenticated requests must not forward tokens on redirects");
  assert.ok(init?.signal instanceof AbortSignal, "Every read must be actually abortable");
  requests.push({ url, init });
  if (url.pathname === "/lms/webservice/rest/server.php") {
    assert.equal(url.searchParams.get("wstoken"), SECRET);
    assert.equal(url.searchParams.get("courseid"), "101");
    const fn = url.searchParams.get("wsfunction");
    if (fn === CONTENTS) return contentsHandler(url, init);
    assert.equal(fn, ACTIVITY);
    assert.equal(url.searchParams.get("userid"), "7001");
    return activityHandler(url, init);
  }
  assert.equal(url.searchParams.get("token"), url.searchParams.get("token") === "FILE_TOKEN" ? "FILE_TOKEN" : SECRET);
  return htmlHandler(url, init);
};
globalThis.setTimeout = (callback, delay, ...args) => {
  timerBudgets.push(delay);
  const timer = originalSetTimeout(() => { liveTimers.delete(timer); callback(...args); }, accelerateDeadlines && delay >= 1500 ? 20 : delay);
  liveTimers.add(timer);
  return timer;
};
globalThis.clearTimeout = (timer) => { liveTimers.delete(timer); return originalClearTimeout(timer); };
for (const key of Object.keys(originalConsole)) console[key] = (...args) => logs.push({ key, args });

try {
  assert.equal(MOODLE_CRITICAL_READ_TIMEOUT_MS, 8000);
  assert.equal(MOODLE_OPTIONAL_READ_TIMEOUT_MS, 1500);
  assert.equal(MOODLE_OPTIONAL_BODY_LIMIT_BYTES, 512 * 1024);
  reset();
  let snapshot = await read();
  assert.deepEqual(snapshot.modules.map((module) => module.id), [10, 11, 90]);
  assert.equal(snapshot.completedModules, 1);
  assert.equal(snapshot.totalModules, 2);
  assert.equal(snapshot.progressPercent, 50);
  assert.equal(snapshot.completed, false);
  assert.equal(getMoodleModuleDisplayState(snapshot.modules[1], snapshot.modules, 1), "available", "State 3 is retryable");
  assert.equal(snapshot.modules[2].completionTracked, false, "Absent untracked status remains valid");
  assert.equal(liveTimers.size, 0, "Successful reads must clean up all deadline timers");
  checks++;

  // Preserve section order and stable non-quiz order, with each section's quiz last.
  reset();
  sections[0].modules = [resource(11, 2, { modname: "quiz" }), resource(10), resource(90, 0)];
  sections.push({ id: 2, name: "Next section", modules: [resource(12, 0)] });
  assert.deepEqual((await read()).modules.map((module) => module.id), [10, 90, 11, 12]);
  checks++;

  // HTTP errors cannot masquerade as valid Moodle payloads.
  for (const operation of [CONTENTS, ACTIVITY]) {
    reset();
    if (operation === CONTENTS) contentsHandler = () => Response.json(sections, { status: 500 });
    else activityHandler = () => Response.json({ statuses }, { status: 500 });
    await assert.rejects(read(), (error) => error instanceof MoodleReadError && error.code === "MOODLE_HTTP" && error.httpStatus === 500 && error.operation === operation);
    checks++;
  }
  reset();
  contentsHandler = () => new Response("<!doctype html>bad gateway token=DO_NOT_LOG_THIS", { status: 200 });
  await rejectsCode(read(), "MOODLE_JSON", CONTENTS);
  reset();
  activityHandler = () => { throw new Error(UPSTREAM_SECRET); };
  await rejectsCode(read(), "MOODLE_NETWORK", ACTIVITY);
  reset();
  activityHandler = () => Response.json({ exception: "webservice_access_exception", errorcode: "accessexception", message: UPSTREAM_SECRET });
  await assert.rejects(read(), (error) => {
    assert.equal(error.code, "MOODLE_ACCESS");
    assert.equal(error.exception, "webservice_access_exception");
    assert.equal(error.errorcode, "accessexception");
    assert.ok(!String(error).includes("raw upstream"));
    return true;
  });
  checks++;
  const unsafeError = new MoodleReadError("MOODLE_ACCESS", UPSTREAM_SECRET, { exception: UPSTREAM_SECRET, errorcode: "a".repeat(65), httpStatus: 999 });
  assert.equal(unsafeError.operation, "moodle_read");
  assert.equal(unsafeError.exception, undefined);
  assert.equal(unsafeError.errorcode, undefined);
  assert.equal(unsafeError.httpStatus, undefined);
  assert.ok(!JSON.stringify(unsafeError).includes("DO_NOT_LOG_THIS"));
  checks++;

  // Critical payload shape must reject safely, including null rows and duplicate IDs.
  for (const payload of [null, {}, { statuses: null }, { statuses: {} }, { statuses: [null] }, { statuses: ["bad"] }]) {
    reset(); activityHandler = () => Response.json(payload);
    await rejectsCode(read(), "MOODLE_PAYLOAD", ACTIVITY);
  }
  for (const patch of [
    { cmid: 0 }, { cmid: -1 }, { cmid: 1.5 }, { cmid: "10" }, { cmid: Number.MAX_SAFE_INTEGER + 1 },
    { state: undefined }, { state: "1" }, { state: 4 }, { state: -1 }, { state: 1.5 },
    { tracking: undefined }, { tracking: "2" }, { tracking: 3 }, { tracking: -1 }, { tracking: 0.5 },
  ]) {
    reset(); statuses[0] = { ...statuses[0], ...patch };
    await rejectsCode(read(), "MOODLE_PAYLOAD", ACTIVITY);
  }
  reset(); statuses.push({ ...statuses[0] });
  await rejectsCode(readActivities(), "MOODLE_PAYLOAD", ACTIVITY);
  reset(); statuses = statuses.filter((status) => status.cmid !== 11);
  await rejectsCode(read(), "MOODLE_PAYLOAD", ACTIVITY);
  reset(); statuses[1].tracking = 0;
  await rejectsCode(read(), "MOODLE_PAYLOAD", ACTIVITY);

  for (const payload of [null, {}, [null], [{ id: 1, name: "Learning" }], [{ id: 1, name: "Learning", modules: {} }], [{ id: "1", name: "Learning", modules: [] }]]) {
    reset(); contentsHandler = () => Response.json(payload);
    await rejectsCode(read(), "MOODLE_PAYLOAD", CONTENTS);
  }
  for (const patch of [{ id: 0 }, { id: "10" }, { name: null }, { name: " " }, { modname: null }, { completion: 3 }, { instance: "1" }]) {
    reset(); Object.assign(sections[0].modules[0], patch);
    await rejectsCode(read(), "MOODLE_PAYLOAD", CONTENTS);
  }
  reset(); sections[0].modules.push({ ...sections[0].modules[0] });
  await rejectsCode(read(), "MOODLE_PAYLOAD", CONTENTS);
  reset(); sections.push({ ...sections[0], modules: [] });
  await rejectsCode(read(), "MOODLE_PAYLOAD", CONTENTS);
  reset(); sections[0].modules = [resource(90, 0)]; statuses = [];
  snapshot = await read();
  assert.equal(snapshot.totalModules, 0, "Untracked-only content is a valid core snapshot");
  assert.equal(snapshot.completed, false);
  checks++;

  // Independent review: an omitted tracking field plus missing driver evidence
  // cannot shrink the denominator and make a partly evidenced course complete.
  reset();
  delete sections[0].modules[0].completion;
  statuses = [{ cmid: 11, state: 2, tracking: 2 }];
  await rejectsCode(read(), "MOODLE_PAYLOAD", ACTIVITY);
  reset();
  delete sections[0].modules[0].completion;
  statuses[0].tracking = 0;
  await rejectsCode(read(), "MOODLE_PAYLOAD", ACTIVITY);
  reset();
  delete sections[0].modules[0].completion;
  snapshot = await read();
  assert.equal(snapshot.totalModules, 2, "Positive authoritative tracking remains usable when structural tracking is omitted");
  assert.equal(snapshot.completed, false);
  checks++;

  // Every malformed optional file URL/content field must leave core learning usable.
  for (const fileurl of ["http://[", "javascript:alert(1)", "data:text/html,secret", "https://user:pass@example.test/file.mp4", "https://media.example.test/file.mp4?token=FILE_TOKEN", "//media.example.test/file.mp4?wstoken=FILE_TOKEN", 123, null, {}]) {
    reset(); sections[0].modules[0].contents = [{ type: "file", filename: "lesson.mp4", fileurl }];
    snapshot = await read();
    assert.equal(snapshot.modules[0].files[0].fileurl, undefined);
    assert.equal(snapshot.completedModules, 1);
    checks++;
  }
  reset(); sections[0].modules[0].contents = [null, "broken", { filename: 123, mimetype: {}, fileurl: "http://[" }];
  assert.equal((await read()).modules[0].files.length, 1);
  checks++;
  reset(); sections[0].modules[0].contents = { fileurl: "http://[" };
  assert.deepEqual((await read()).modules[0].files, []);
  checks++;
  for (const [path, expectedPath] of [["/pluginfile.php/lesson.mp4?token=FILE_TOKEN&x=1", "/pluginfile.php/lesson.mp4"], ["pluginfile.php/lesson.mp4?token=FILE_TOKEN&x=1", "/lms/pluginfile.php/lesson.mp4"]]) {
    reset(); sections[0].modules[0].contents = [{ type: "file", filename: "lesson.mp4", fileurl: path }];
    const videoUrl = new URL((await read()).modules[0].videoUrl);
    assert.equal(videoUrl.origin, "https://moodle.example.test");
    assert.equal(videoUrl.pathname, expectedPath);
    assert.equal(videoUrl.searchParams.get("token"), "FILE_TOKEN");
    assert.equal(videoUrl.searchParams.get("x"), "1");
    assert.equal(videoUrl.searchParams.get("forcedownload"), "1");
    checks++;
  }
  reset(); sections[0].modules[0].contents = [{ filename: "lesson.mp4", fileurl: "https://media.example.test/lesson.mp4?x=1" }];
  assert.equal(new URL((await read()).modules[0].videoUrl).searchParams.has("token"), false, "External direct video remains usable without a Moodle token");
  checks++;
  assert.throws(() => withMoodleToken("https://media.example.test/index.html"), (error) => error instanceof MoodleReadError && error.code === "MOODLE_ACCESS");
  assert.equal(new URL(withMoodleToken("/pluginfile.php/index.html?token=FILE_TOKEN&x=1")).searchParams.get("token"), "FILE_TOKEN");
  checks++;

  function pageFiles() {
    reset(); sections[0].modules[0].modname = "page";
    sections[0].modules[0].contents = [{ filename: "index.html", fileurl: "/pluginfile.php/index.html?x=1" }];
  }
  pageFiles();
  htmlHandler = () => new Response('<iframe src="https://iframe.mediadelivery.net/embed/123/aabb-ccdd"></iframe>');
  snapshot = await read();
  assert.equal(snapshot.modules[0].bunnyLibraryId, "123");
  assert.equal(snapshot.modules[0].bunnyVideoId, "aabb-ccdd");
  checks++;
  pageFiles();
  sections[0].modules[0].contents[0].fileurl = "https://media.example.test/index.html";
  assert.equal((await read()).completedModules, 1);
  assert.equal(requests.length, 2, "External HTML never receives the service token or a fetch");
  checks++;
  for (const fail of [
    () => { throw new Error(UPSTREAM_SECRET); },
    () => new Response(UPSTREAM_SECRET, { status: 500 }),
    () => new Response(null, { status: 302, headers: { location: `https://media.example.test/?token=${SECRET}` } }),
    () => new Response("x", { headers: { "content-length": String(MOODLE_OPTIONAL_BODY_LIMIT_BYTES + 1) } }),
    () => new Response("x".repeat(MOODLE_OPTIONAL_BODY_LIMIT_BYTES + 1)),
  ]) {
    pageFiles(); htmlHandler = fail;
    snapshot = await read();
    assert.equal(snapshot.completedModules, 1);
    assert.equal(snapshot.modules[0].bunnyVideoId, undefined);
    assert.equal(liveTimers.size, 0);
    checks++;
  }

  // Fixed critical deadlines are shortened by test-only timer instrumentation, not runtime configuration.
  accelerateDeadlines = true;
  reset(); contentsHandler = hangingFetch;
  await rejectsCode(read(), "MOODLE_TIMEOUT", CONTENTS);
  assert.ok(requests.find(({ url }) => url.searchParams.get("wsfunction") === CONTENTS).init.signal.aborted);
  reset(); activityHandler = (_url, init) => hangingBody(init).response;
  await rejectsCode(read(), "MOODLE_TIMEOUT", ACTIVITY);
  assert.ok(requests.find(({ url }) => url.searchParams.get("wsfunction") === ACTIVITY).init.signal.aborted);
  assert.ok(timerBudgets.includes(8000));
  pageFiles(); htmlHandler = hangingFetch;
  assert.equal((await read()).completedModules, 1, "Optional hanging headers cannot block core learning");
  assert.ok(requests.at(-1).init.signal.aborted);
  checks++;
  pageFiles(); htmlHandler = (_url, init) => hangingBody(init).response;
  assert.equal((await read()).completedModules, 1, "Optional hanging body cannot block core learning");
  assert.ok(requests.at(-1).init.signal.aborted);
  assert.ok(timerBudgets.includes(1500));
  checks++;
  // Many pages share parallel optional deadlines, never an unbounded all-page wait.
  reset();
  sections[0].modules = [10, 11, 12, 13, 14, 15].map((id) => resource(id, 0, { modname: "page", contents: [{ filename: "index.html", fileurl: `/pluginfile.php/${id}/index.html` }] }));
  statuses = [];
  htmlHandler = hangingFetch;
  assert.equal((await read()).modules.length, 6);
  assert.equal(requests.filter(({ url }) => url.pathname !== "/lms/webservice/rest/server.php").length, 6);
  assert.ok(requests.slice(2).every(({ init }) => init.signal.aborted));
  assert.equal(liveTimers.size, 0);
  checks++;

  // Direct optional helper timeout override covers a stalled body and actual abort.
  accelerateDeadlines = false;
  reset(); htmlHandler = (_url, init) => hangingBody(init).response;
  await rejectsCode(moodleReadOptionalText(withMoodleToken("/pluginfile.php/index.html"), "moodle_optional_html", 10), "MOODLE_TIMEOUT", "moodle_optional_html");
  assert.ok(requests.at(-1).init.signal.aborted);
  assert.equal(liveTimers.size, 0);
  reset(); htmlHandler = () => new Response(new ReadableStream({ pull() { throw new Error(UPSTREAM_SECRET); } }));
  await rejectsCode(moodleReadOptionalText(withMoodleToken("/pluginfile.php/index.html")), "MOODLE_NETWORK");
  assert.equal(liveTimers.size, 0);
  reset(); htmlHandler = () => new Response("x".repeat(MOODLE_OPTIONAL_BODY_LIMIT_BYTES + 1));
  await rejectsCode(moodleReadOptionalText(withMoodleToken("/pluginfile.php/index.html")), "MOODLE_PAYLOAD");
  assert.ok(requests.at(-1).init.signal.aborted);
  assert.equal(liveTimers.size, 0);

  reset();
  const savedId = MOODLE_COURSE_IDS["professional-truck-driver"];
  MOODLE_COURSE_IDS["professional-truck-driver"] = 0;
  try { await rejectsCode(read(), "MOODLE_COURSE_CONFIG", CONTENTS); }
  finally { MOODLE_COURSE_IDS["professional-truck-driver"] = savedId; }
  await rejectsCode(moodleGetActivityCompletionStatuses({ moodleUserId: 0, programmeSlug: "professional-truck-driver" }), "MOODLE_PAYLOAD", ACTIVITY);
  assert.equal(logs.length, 0, "Read/media paths must never log raw exceptions, media URLs, tokens, or upstream messages");
  assert.equal(liveTimers.size, 0, "Every success/failure/deadline must clean up timers");
  originalConsole.log(`BetterDriver Moodle load-recovery regressions passed (${checks} cases): bounded HTTP/body reads, strict core/status validation, media isolation, ordering/completion, real abort, timer cleanup and no secret logs.`);
} finally {
  globalThis.fetch = originalFetch;
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  for (const [key, fn] of Object.entries(originalConsole)) console[key] = fn;
  for (const timer of liveTimers) originalClearTimeout(timer);
}
