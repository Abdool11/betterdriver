// Run from the repository root:
// node --experimental-strip-types tests/unit/moodle-driver-snapshot.test.mjs
// No dotenv, live credentials, database, HTML fetches, or real network are used.
import assert from "node:assert/strict";

// lib/moodle.ts captures configuration at import time: set fixtures FIRST.
process.env.MOODLE_URL = "https://moodle.example.test";
process.env.MOODLE_TOKEN = "test-only-placeholder";
process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID = "101";
process.env.MOODLE_ECO_DRIVER_COURSE_ID = "102";
process.env.MOODLE_AUTOLOGIN_SECRET = "";
process.env.BUNNY_CDN_HOSTNAME = "video.example.test";

const DRIVER_A = 7001;
const DRIVER_B = 7002;
const CONTENTS_API = "core_course_get_contents";
const ACTIVITY_API = "core_completion_get_activities_completion_status";
const requests = [];
const responsesByDriver = new Map();
let activityFailure = null;

function resource(id, name, tracking = 2) {
  return {
    id,
    instance: id,
    name,
    modname: "resource", // Never trigger page HTML or embedded media fetches.
    visible: 1,
    uservisible: true,
    visibleoncoursepage: 1,
    completion: tracking,
    // Deliberately misleading: the token user has completed EVERYTHING.
    completionstate: 1,
    completiondata: { state: 1, tracking, userid: 9999 },
    contents: [],
  };
}

const sections = [{
  id: 1,
  name: "Driver learning",
  modules: [
    resource(90, "Untracked reference before the lessons", 0),
    resource(10, "Lesson one"),
    resource(11, "Lesson two"),
    resource(12, "Lesson three"),
    resource(91, "Reference absent from activity statuses", 0),
  ],
}];

function driverStatuses(states) {
  return [
    { cmid: 90, state: 1, tracking: 0 }, // Even state 1 must not count untracked content.
    ...[10, 11, 12].map((cmid, index) => ({ cmid, state: states[index], tracking: 2 })),
    // Module 91 intentionally has no driver status; never fall back to token metadata.
  ];
}

responsesByDriver.set(DRIVER_A, driverStatuses([1, 0, 0]));
responsesByDriver.set(DRIVER_B, driverStatuses([0, 0, 0]));

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  // This replacement has NO pass-through to originalFetch, including on errors.
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  assert.equal(url.origin, "https://moodle.example.test", "Only the fake Moodle origin is allowed");
  assert.equal(url.pathname, "/webservice/rest/server.php", "Only REST fixture requests are allowed");
  assert.equal(init?.method ?? "GET", "GET", "Snapshot reads must not mutate Moodle");
  assert.equal(url.searchParams.get("wstoken"), "test-only-placeholder");
  assert.equal(url.searchParams.get("moodlewsrestformat"), "json");

  const fn = url.searchParams.get("wsfunction");
  const courseid = Number(url.searchParams.get("courseid"));
  const userid = Number(url.searchParams.get("userid"));
  assert.ok([101, 102].includes(courseid), "Use only fixture programme course IDs");
  requests.push({ fn, courseid, userid });

  if (fn === CONTENTS_API) {
    return Response.json(structuredClone(sections));
  }
  assert.equal(fn, ACTIVITY_API, "Unexpected fetch: HTML, other APIs, and fallback calls are forbidden");
  assert.ok(responsesByDriver.has(userid), "Activity completion must explicitly use the requested driver ID");
  if (activityFailure === "unavailable") {
    return Response.json({
      exception: "webservice_access_exception",
      errorcode: "accessexception",
      message: "Activity completion API unavailable in this test fixture",
    });
  }
  if (activityFailure === "malformed") {
    return Response.json({ warnings: [] });
  }
  if (activityFailure === "transport") {
    throw new Error("Mock activity completion transport failure");
  }
  return Response.json({ statuses: structuredClone(responsesByDriver.get(userid)) });
};

try {
  const {
    MOODLE_COURSE_IDS,
    moodleGetLearningSnapshot,
    getMoodleModuleDisplayState,
  } = await import("../../lib/moodle.ts");
  assert.equal(typeof moodleGetLearningSnapshot, "function");
  assert.equal(
    typeof getMoodleModuleDisplayState,
    "function",
    "Waiting for the main implementation: export getMoodleModuleDisplayState(module, modules, moduleIndex)",
  );
  assert.equal(MOODLE_COURSE_IDS["professional-truck-driver"], 101);
  assert.equal(MOODLE_COURSE_IDS["eco-driver"], 102);

  const read = (moodleUserId, programmeSlug = "professional-truck-driver") =>
    moodleGetLearningSnapshot({ moodleUserId, programmeSlug });
  const moduleById = (snapshot, id) => {
    const module = snapshot.modules.find((candidate) => candidate.id === id);
    assert.ok(module, `Fixture module ${id} must be in the actual snapshot`);
    return module;
  };
  const display = (snapshot, id) => {
    const index = snapshot.modules.findIndex((module) => module.id === id);
    assert.notEqual(index, -1);
    return getMoodleModuleDisplayState(snapshot.modules[index], snapshot.modules, index);
  };
  const assertProgress = (snapshot, completed, total, percent, finished = false) => {
    assert.equal(snapshot.completedModules, completed);
    assert.equal(snapshot.totalModules, total);
    assert.equal(snapshot.progressPercent, percent);
    assert.equal(snapshot.completed, finished);
  };

  // A has one real completion; token-user metadata must not complete later lessons.
  const snapshotA = await read(DRIVER_A);
  assert.equal(snapshotA.modules.length, 5);
  assertProgress(snapshotA, 1, 3, 33);
  assert.equal(moduleById(snapshotA, 11).completionstate, 0);
  assert.equal(moduleById(snapshotA, 12).completionstate, 0);
  assert.equal(display(snapshotA, 10), "completed");
  assert.equal(display(snapshotA, 11), "available", "Unlocked state 0 is available, never completed");
  assert.equal(display(snapshotA, 12), "locked", "A later incomplete lesson remains locked");
  assert.equal(moduleById(snapshotA, 90).completionTracked, false);
  assert.equal(moduleById(snapshotA, 91).completionTracked, false);
  assert.equal(moduleById(snapshotA, 91).completionstate, 0, "Missing driver status cannot inherit token completion");
  assert.equal(display(snapshotA, 90), "available", "Untracked state 1 is not a completed learning activity");

  // B must start from zero despite being read immediately after A on the same course.
  const snapshotB = await read(DRIVER_B);
  assertProgress(snapshotB, 0, 3, 0);
  for (const id of [10, 11, 12]) {
    assert.equal(moduleById(snapshotB, id).completionstate, 0);
  }
  assert.equal(display(snapshotB, 10), "available", "Untracked references must not block the first lesson");
  assert.equal(display(snapshotB, 11), "locked");
  assert.equal(display(snapshotB, 12), "locked");
  assert.equal(moduleById(snapshotA, 10).completionstate, 1, "Reading B must not mutate A's snapshot");

  // Moodle complete/pass (2) counts, but complete/fail (3) stays incomplete/retryable.
  responsesByDriver.set(DRIVER_A, driverStatuses([2, 3, 0]));
  const failedAttempt = await read(DRIVER_A);
  assertProgress(failedAttempt, 1, 3, 33);
  assert.equal(display(failedAttempt, 10), "completed", "State 2 counts as complete/pass");
  assert.equal(moduleById(failedAttempt, 11).completionstate, 3);
  assert.equal(display(failedAttempt, 11), "available", "State 3 must be retryable, not completed");
  assert.equal(display(failedAttempt, 12), "locked", "State 3 must keep the next lesson locked");

  // A new read after Moodle changes must unlock the next lesson, not reuse old states.
  const activityReadsBeforeRefresh = requests.filter(({ fn }) => fn === ACTIVITY_API).length;
  responsesByDriver.set(DRIVER_A, driverStatuses([2, 2, 0]));
  const refreshed = await read(DRIVER_A);
  assert.equal(
    requests.filter(({ fn }) => fn === ACTIVITY_API).length,
    activityReadsBeforeRefresh + 1,
    "Refreshing must re-read the driver-specific activity API",
  );
  assertProgress(refreshed, 2, 3, 67);
  assert.equal(display(refreshed, 11), "completed");
  assert.equal(display(refreshed, 12), "available", "A fresh completion response unlocks the next lesson");
  assert.equal(display(failedAttempt, 12), "locked", "Previously returned snapshots remain independent");

  // Untracked content must not prevent completion or inflate numerator/denominator.
  responsesByDriver.set(DRIVER_A, driverStatuses([2, 1, 2]));
  const finishedA = await read(DRIVER_A);
  assertProgress(finishedA, 3, 3, 100, true);
  assert.equal(display(finishedA, 12), "completed");
  const unchangedB = await read(DRIVER_B);
  assertProgress(unchangedB, 0, 3, 0);
  assert.equal(display(unchangedB, 10), "available");
  assert.equal(display(unchangedB, 11), "locked");

  // Exercise the second configured programme without relying on external config.
  const ecoB = await read(DRIVER_B, "eco-driver");
  assertProgress(ecoB, 0, 3, 0);
  assert.ok(requests.some(({ fn, courseid, userid }) =>
    fn === ACTIVITY_API && courseid === 102 && userid === DRIVER_B));
  assert.ok(requests.some(({ fn, courseid, userid }) =>
    fn === ACTIVITY_API && courseid === 101 && userid === DRIVER_A));

  // No successful snapshot (including token-user progress) is allowed on API failure.
  activityFailure = "unavailable";
  await assert.rejects(read(DRIVER_A), /Activity completion API unavailable/, "Unavailable activity API must reject");
  activityFailure = "malformed";
  await assert.rejects(read(DRIVER_B), /unexpected response/, "Missing statuses must reject, not become pretend success");
  activityFailure = "transport";
  await assert.rejects(read(DRIVER_A), /Mock activity completion transport failure/, "Transport failure must propagate");

  assert.ok(requests.every(({ fn }) => fn === CONTENTS_API || fn === ACTIVITY_API));
  console.log("BetterDriver driver-snapshot regressions passed: isolated drivers, display states 0/1/2/3, untracked counts, fresh unlock, both programmes, and API failures.");
} finally {
  globalThis.fetch = originalFetch;
}
