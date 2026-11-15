import assert from "node:assert/strict";
import { readPortalJson, isCourseData, isDashboardData, learningErrorText } from "../../lib/portal-read.ts";

const original = globalThis.fetch;
const originalWindow = globalThis.window;
let redirected = "";
globalThis.window = { location: { assign: (url) => { redirected = url; } } };
const good = { learningStatus: "available", programme: { title: "Fixture programme", progressPercent: 50, totalModules: 2, completedModules: 1 }, modules: [
  { id: "1", name: "First", order: 1, status: "completed", locked: false },
  { id: "2", name: "Next", order: 2, status: "available", locked: false },
] };
let calls = 0, aborted = false;
const controller = new AbortController();
const jsonFetch = (payload, status = 200) => {
  globalThis.fetch = async (url, init) => {
    calls++; assert.equal(url, "/api/portal/course"); assert.equal(init.cache, "no-store"); assert.ok(init.signal instanceof AbortSignal);
    assert.equal(init.method, undefined, "Refresh cannot create a write request");
    return Response.json(payload, { status });
  };
};
try {
  jsonFetch(good);
  assert.deepEqual(await readPortalJson("/api/portal/course", controller.signal, isCourseData, 100), good);
  for (const payload of [{}, { error: "secret-marker" }, { ...good, modules: [] }, { ...good, modules: [good.modules[0]] }, { ...good, programme: { ...good.programme, progressPercent: 99 } }, { ...good, modules: [{ ...good.modules[0], status: "unexpected" }] }, { ...good, modules: [good.modules[0], good.modules[0]] }, { ...good, programme: { ...good.programme, completedModules: 5 } }]) {
    jsonFetch(payload);
    await assert.rejects(readPortalJson("/api/portal/course", controller.signal, isCourseData, 100), /PORTAL_PAYLOAD/);
  }
  const requestId = "c6983676-845e-4a19-822f-d5dde6f9614e";
  jsonFetch({ code: "MOODLE_ACCESS", requestId, error: "secret-marker https://evil.test/?token=secret-marker" }, 502);
  await assert.rejects(readPortalJson("/api/portal/course", controller.signal, isCourseData, 100), (err) => {
    assert.match(err.message, /MOODLE_ACCESS; HTTP 502/); assert.match(err.message, new RegExp(requestId)); assert.doesNotMatch(err.message, /secret-marker|evil/); return true;
  });
  jsonFetch({ code: "LEARNING_ACCOUNT_PENDING" }, 409);
  await assert.rejects(readPortalJson("/api/portal/course", controller.signal, isCourseData, 100), /still being prepared/);
  assert.doesNotMatch(learningErrorText({ code: "unknown-secret-marker", requestId: "secret-marker" }), /secret-marker/);
  jsonFetch({ error: "Unauthorized" }, 401);
  await assert.rejects(readPortalJson("/api/portal/course", controller.signal, isCourseData, 100), /session has expired/);
  assert.equal(redirected, "/start");
  globalThis.fetch = async (_url, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); });
  });
  await assert.rejects(readPortalJson("/api/portal/course", controller.signal, isCourseData, 20), /PORTAL_TIMEOUT/);
  assert.equal(aborted, true);
  globalThis.fetch = async (_url, init) => {
    init.signal.addEventListener("abort", () => { aborted = true; });
    return { ok: true, status: 200, json: () => new Promise(() => {}) };
  };
  await assert.rejects(readPortalJson("/api/portal/course", controller.signal, isCourseData, 20), /PORTAL_TIMEOUT/, "JSON body decoding is also bounded");
  jsonFetch(good);
  assert.deepEqual(await readPortalJson("/api/portal/course", controller.signal, isCourseData, 100), good, "Retry works after timeout");
  assert.equal(isDashboardData({}), false);
  assert.equal(isDashboardData({ stats: { firstName: "Fixture", programmeTitle: "P", learningStatus: "unavailable", progressPercent: null, completedModules: null, totalModules: null, cpdStatus: "unavailable", bulletinStatus: "unavailable" }, nextModule: null }), true);
  const dashboard = { stats: { firstName: "Fixture", programmeTitle: "P", learningStatus: "available", progressPercent: 0, completedModules: 0, totalModules: 3, cpdStatus: "available", cpdDue: false, cpdOverdueCount: 0, cpdUpcomingCount: 0, bulletinStatus: "available", unreadBulletins: 0 }, nextModule: { id: "1", name: "First" } };
  assert.equal(isDashboardData(dashboard), true);
  assert.equal(isDashboardData({ ...dashboard, nextModule: null }), false, "Outstanding learning requires next action evidence");
  const missingNext = structuredClone(dashboard); delete missingNext.nextModule;
  assert.equal(isDashboardData(missingNext), false);
  assert.equal(isDashboardData({ ...dashboard, stats: { ...dashboard.stats, cpdOverdueCount: 1 } }), false, "Positive overdue count cannot be up to date");
  assert.equal(isDashboardData({ ...dashboard, stats: { ...dashboard.stats, cpdOverdueCount: 1, cpdDue: true } }), true);
  assert.equal(isCourseData({ learningStatus: "not_assigned", programme: { title: "P", completedModules: 0, totalModules: 0, progressPercent: 0 }, modules: [] }), true);
  assert.ok(calls >= 9);
  console.log("BetterDriver portal-read regressions passed: safe classified errors, malformed success rejection, header/body timeout and abort, retry, 401 redirect, no write/network pass-through.");
} finally { globalThis.fetch = original; globalThis.window = originalWindow; }
