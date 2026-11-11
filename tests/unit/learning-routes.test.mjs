// Run: node tests/run-learning-tests.mjs learning-routes
// Actual route + actual Moodle snapshot + actual next/server. No dotenv or live IO.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspect } from "node:util";

const root = process.env.BD_LEARNING_REPO_ROOT ?? process.cwd();
const VERSION = "bd-learning-read.v1";
const TOKEN = "route-fixture-token-never-log";
const EMAIL = "private.driver@route-fixture.test";
const MOBILE = "+27821234567";
const PRIVATE = `upstream private data ${TOKEN} ${EMAIL} ${MOBILE}`;
const MOODLE_ORIGIN = "https://moodle.example.test";
const CONTENTS_API = "core_course_get_contents";
const ACTIVITY_API = "core_completion_get_activities_completion_status";
const ENROL_API = "enrol_manual_enrol_users";
const DRIVER_A = 7001;
const DRIVER_B = 7002;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fixtureKey = "__bdLearningRouteFixture";

// Configuration is captured by real Moodle code when the route is loaded.
// Overwrite even fixture env supplied by the runner. Never load an env file.
process.env.MOODLE_URL = MOODLE_ORIGIN;
process.env.MOODLE_TOKEN = TOKEN;
process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID = "101";
process.env.MOODLE_ECO_DRIVER_COURSE_ID = "102";
process.env.MOODLE_AUTOLOGIN_SECRET = "";
process.env.BUNNY_CDN_HOSTNAME = "video.example.test";
for (const key of Object.keys(process.env)) {
  if (/SUPABASE|JWT_SECRET|AUTH_SECRET|DATABASE_URL|SERVICE_ROLE/i.test(key)) delete process.env[key];
}

function resource(id, completion = 2) {
  return {
    id, instance: id, name: `Lesson ${id}`, modname: "resource",
    visible: 1, uservisible: true, visibleoncoursepage: 1, completion,
    url: `${MOODLE_ORIGIN}/mod/resource/view.php?id=${id}`,
    // The service-token user completed EVERYTHING; the driver did not.
    completionstate: 1, completiondata: { state: 1, tracking: completion, userid: 9999 },
    contents: [],
  };
}
function sections() {
  return [{ id: 1, name: "Scoped fixture course", modules: [resource(10), resource(11), resource(12)] }];
}
function statuses(states) {
  return [10, 11, 12].map((cmid, i) => ({ cmid, state: states[i], tracking: 2 }));
}
function fixture(options = {}) {
  const driverId = options.driverId ?? "driver-A";
  const moodleId = driverId === "driver-B" ? DRIVER_B : DRIVER_A;
  const f = {
    session: { driverId, firstName: "Session first", lastName: "Session last", moodleUserId: 9999, programmeSlug: "p2" },
    driver: { id: driverId, first_name: "Fixture first", last_name: "Fixture last", email: EMAIL, mobile: MOBILE, moodle_user_id: moodleId, company_id: `company-${driverId}` },
    enrolment: { id: `enrolment-${driverId}`, programme_slug: "ptdp", status: "active", progress_percent: 99, modules_completed: 99, completed_at: null },
    sections: sections(),
    statuses: statuses(driverId === "driver-B" ? [0, 0, 0] : [1, 0, 0]),
    queries: [], writes: [], requests: [], logs: [], violations: [],
    errors: {}, throws: {}, failure: null, failureApi: ACTIVITY_API,
    ...options,
  };
  f.db = { from: (table) => queryProxy(f, table) };
  return f;
}
function queryProxy(f, table) {
  const query = { table, calls: [], write: null };
  let evaluation;
  const proxy = new Proxy({}, {
    get(_target, method) {
      if (method === "then") {
        return (onFulfilled, onRejected) => {
          evaluation ??= Promise.resolve().then(() => answerQuery(f, query)).catch((error) => {
            if (error instanceof assert.AssertionError || (!Object.values(f.throws).includes(error))) f.violations.push(error.stack ?? error.message);
            throw error;
          });
          return evaluation.then(onFulfilled, onRejected);
        };
      }
      if (["select", "eq", "in", "order", "limit", "single", "maybeSingle", "not", "update", "abortSignal"].includes(method)) {
        return (...args) => {
          if (method === "abortSignal") {
            assert.ok(args[0] instanceof AbortSignal, "Read deadline passes an actual AbortSignal");
            query.calls.push([method]);
            return proxy;
          }
          query.calls.push([method, ...args]);
          if (method === "update") query.write = structuredClone(args[0]);
          return proxy;
        };
      }
      f.violations.push(`Unexpected Supabase boundary operation: ${String(method)}`);
      throw new Error(`Unexpected Supabase boundary operation: ${String(method)}`);
    },
  });
  return proxy;
}
function hasCall(query, method, ...args) {
  return query.calls.some(([name, ...actual]) => name === method && JSON.stringify(actual) === JSON.stringify(args));
}
function answerQuery(f, query) {
  f.queries.push(structuredClone(query));
  const scope = (column, id) => assert.ok(hasCall(query, "eq", column, id), `${query.table} must be scoped by ${column}=${id}`);
  if (query.write) {
    assert.equal(query.table, "enrolments", "Existing summary writes only; no driver provisioning in these fixtures");
    assert.ok(f.enrolment);
    scope("id", f.enrolment.id);
    f.writes.push(structuredClone(query));
    if (f.throws.summary) throw f.throws.summary;
    return { data: null, error: f.errors.summary ?? null };
  }
  switch (query.table) {
    case "drivers": scope("id", f.session.driverId); break;
    case "enrolments":
      scope("driver_id", f.session.driverId);
      assert.ok(query.calls.some(([method, column, values]) => method === "in" && column === "status" && Array.isArray(values) && values.includes("active")));
      assert.ok(hasCall(query, "order", "created_at", { ascending: false }));
      assert.ok(hasCall(query, "limit", 1));
      assert.ok(hasCall(query, "maybeSingle"));
      break;
    case "driver_cpd_participation": scope("driver_id", f.session.driverId); break;
    case "bulletins":
      scope("company_id", f.driver.company_id);
      scope("status", "disseminated");
      break;
    case "driver_bulletin_interactions":
      scope("driver_id", f.session.driverId);
      assert.ok(hasCall(query, "not", "read_at", "is", null));
      assert.ok(hasCall(query, "in", "bulletin_id", ["bulletin-1", "bulletin-2"]));
      break;
    default: throw new Error(`Unexpected table: ${query.table}`);
  }
  if (f.throws[query.table]) throw f.throws[query.table];
  if (f.errors[query.table]) return { data: null, error: f.errors[query.table] };
  const rows = {
    drivers: f.driver,
    enrolments: f.enrolment,
    driver_cpd_participation: [
      { completed_at: null, cpd_modules: { due_date: "2000-01-01T00:00:00Z" } },
      { completed_at: "2000-01-01T00:00:00Z", cpd_modules: { due_date: "2000-01-01T00:00:00Z" } },
    ],
    bulletins: [{ id: "bulletin-1" }, { id: "bulletin-2" }],
    driver_bulletin_interactions: [{ bulletin_id: "bulletin-1" }],
  };
  return { data: structuredClone(rows[query.table]), error: null };
}

async function fakeFetch(input, init = {}) {
  const f = globalThis[fixtureKey];
  try {
    assert.ok(f, "A route fixture is required; real network fallback is forbidden");
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    assert.equal(url.origin, MOODLE_ORIGIN, "Only fixture Moodle origin allowed; no real network");
    const method = init.method ?? "GET";
    if (url.pathname === "/pluginfile.php/optional/index.html") {
      assert.equal(method, "GET");
      f.requests.push({ fn: "optional_html", method });
      assert.equal(url.searchParams.get("token"), TOKEN);
      throw new Error(PRIVATE);
    }
    assert.equal(url.pathname, "/webservice/rest/server.php", "No other endpoint is allowed");
    const params = method === "POST" ? new URLSearchParams(init.body) : url.searchParams;
    const fn = params.get("wsfunction");
    assert.equal(params.get("wstoken"), TOKEN);
    assert.equal(params.get("moodlewsrestformat"), "json");
    const expectedCourse = ["p2", "eco-driver"].includes(f.enrolment?.programme_slug) ? 102 : 101;
    if (method === "POST") {
      // Preserve the dashboard's EXISTING enrolment check; this POST is only a
      // captured fixture response, never a real mutation or provisioning call.
      assert.equal(fn, ENROL_API);
      assert.equal(params.get("enrolments[0][roleid]"), "5");
      assert.equal(Number(params.get("enrolments[0][userid]")), f.driver.moodle_user_id);
      assert.equal(Number(params.get("enrolments[0][courseid]")), expectedCourse);
      f.requests.push({ fn, method, courseid: expectedCourse, userid: f.driver.moodle_user_id });
      return Response.json(null);
    }
    assert.equal(method, "GET");
    assert.ok([CONTENTS_API, ACTIVITY_API].includes(fn), `Unexpected Moodle API ${fn}`);
    assert.equal(Number(params.get("courseid")), expectedCourse);
    if (fn === ACTIVITY_API) {
      assert.equal(Number(params.get("userid")), f.driver.moodle_user_id, "Authenticated driver's DB Moodle ID, never session/token metadata");
      assert.ok([DRIVER_A, DRIVER_B].includes(Number(params.get("userid"))));
    }
    f.requests.push({ fn, method, courseid: expectedCourse, userid: Number(params.get("userid")) });
    if (fn === f.failureApi) {
      if (f.failure === "http") return Response.json(fn === CONTENTS_API ? f.sections : { statuses: f.statuses }, { status: 500 });
      if (f.failure === "access") return Response.json({ exception: "webservice_access_exception", errorcode: "accessexception", message: PRIVATE, debuginfo: `${MOODLE_ORIGIN}/?wstoken=${TOKEN}` });
      if (f.failure === "network") throw new Error(`${PRIVATE} ${MOODLE_ORIGIN}/?wstoken=${TOKEN}`);
      if (f.failure === "json") return new Response(`<html>${PRIVATE}</html>`, { status: 200 });
      if (f.failure === "payload") return Response.json({ warnings: [], message: PRIVATE });
      if (f.failure === "missing_tracked") return Response.json({ statuses: f.statuses.filter((s) => s.cmid !== 11) });
      if (f.failure === "timeout") {
        assert.ok(init.signal, "Real critical reads must supply an abort signal");
        return new Promise((_resolve, reject) => {
          const abort = () => reject(new Error(PRIVATE));
          if (init.signal.aborted) abort();
          else init.signal.addEventListener("abort", abort, { once: true });
        });
      }
    }
    return Response.json(structuredClone(fn === CONTENTS_API ? f.sections : { statuses: f.statuses }));
  } catch (error) {
    // Moodle intentionally normalizes transport exceptions. Record assertion
    // failures separately so strict fixture violations cannot look like a pass.
    if (error instanceof assert.AssertionError) f?.violations.push(error.message);
    throw error;
  }
}

const boundaryPlugin = {
  name: "session-and-supabase-boundaries-only",
  setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/(auth|supabase)$/ }, ({ path }) => ({ path, namespace: "learning-fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "learning-fixture" }, ({ path }) => ({
      loader: "js",
      contents: path.endsWith("/auth")
        ? `export async function getSession() { const f = globalThis.${fixtureKey}; if (f.sessionThrow) throw f.sessionThrow; return f.session; }`
        : `export const supabaseAdmin = { from(table) { const f = globalThis.${fixtureKey}; try { return f.db.from(table); } catch (error) { f.violations.push(error.stack); throw error; } } };`,
    }));
  },
};

function assertSafe(value) {
  const text = typeof value === "string" ? value : inspect(value, { depth: 10 });
  for (const secret of [TOKEN, EMAIL, MOBILE, PRIVATE, "wstoken=", "token="]) {
    assert.ok(!text.includes(secret), `Private upstream data must not be disclosed: ${secret}`);
  }
}
function assertError(result, status, code) {
  assert.equal(result.response.status, status);
  assert.equal(result.body.version, VERSION);
  assert.equal(result.body.code, code);
  assert.match(result.body.requestId, UUID);
  assert.equal(typeof result.body.error, "string");
  assert.ok(result.body.error.length > 0);
  assert.deepEqual(Object.keys(result.body).sort(), ["code", "error", "requestId", "version"]);
  assertSafe(result.body);
  assert.ok(result.f.logs.some((entry) => entry.some((part) => part && typeof part === "object" && part.code === code && part.requestId === result.body.requestId)), "Safe diagnostics correlate with the response request ID");
}
function assertUnavailable(result, code) {
  assert.equal(result.response.status, 200, "Dashboard remains usable when learning alone is unavailable");
  assert.equal(result.body.version, VERSION);
  const { stats, nextModule } = result.body;
  assert.equal(stats.learningStatus, "unavailable");
  for (const key of ["progressPercent", "completedModules", "totalModules"]) assert.equal(stats[key], null, `${key} unknown is null, never zero or stale DB progress`);
  assert.equal(nextModule, null);
  assert.equal(stats.certificateReady, false);
  assert.equal(stats.certificatePendingGfa, false);
  assert.equal(stats.learningError.code, code);
  assert.match(stats.learningError.requestId, UUID);
  assertSafe(stats.learningError);
  assert.equal(result.f.writes.length, 0, "Unavailable learning must never overwrite the DB summary");
  assert.ok(result.f.logs.some((entry) => entry.some((part) => part && typeof part === "object" && part.code === code && part.requestId === stats.learningError.requestId)));
}

const cache = resolve(root, "node_modules/.cache/bd-learning-tests");
await mkdir(cache, { recursive: true });
const output = await mkdtemp(resolve(cache, "routes-"));
const originalFetch = globalThis.fetch;
const originalConsole = Object.fromEntries(["error", "warn", "log", "info", "debug"].map((method) => [method, console[method]]));
const oldFixture = globalThis[fixtureKey];
let passed = 0;
const failures = [];
const uiFixtures = {};
try {
  const routes = {};
  for (const name of ["course", "dashboard"]) {
    const outfile = resolve(output, `${name}.cjs`);
    const result = await build({
      entryPoints: [resolve(root, `app/api/portal/${name}/route.ts`)],
      outfile, absWorkingDir: root, tsconfig: resolve(root, "tsconfig.json"),
      bundle: true, platform: "node", format: "cjs", packages: "external", target: "node18",
      plugins: [boundaryPlugin], metafile: true, logLevel: "silent",
    });
    const bundled = Object.keys(result.metafile.inputs).map((path) => path.replaceAll("\\", "/"));
    assert.ok(bundled.some((path) => path.endsWith("lib/moodle.ts")), "Actual Moodle implementation must be bundled, not mocked/externalized");
    assert.ok(!bundled.some((path) => /(?:^|\/)lib\/(auth|supabase)\.ts$/.test(path)), "Do not evaluate real credential-bearing boundaries");
    const imports = Object.values(result.metafile.outputs).flatMap((value) => value.imports);
    assert.ok(imports.some((entry) => entry.path === "next/server" && entry.external), "Use actual next/server dependency");
    assert.ok(!imports.some((entry) => entry.path.startsWith("@/")), "All internal aliases must resolve using the root tsconfig");
    routes[name] = createRequire(resolve(root, "package.json"))(outfile);
    assert.equal(typeof routes[name].GET, "function");
  }
  globalThis.fetch = fakeFetch;
  for (const method of Object.keys(originalConsole)) {
    console[method] = (...args) => globalThis[fixtureKey]?.logs.push(args);
  }
  async function invoke(name, options = {}) {
    const f = fixture(options);
    globalThis[fixtureKey] = f;
    const response = await routes[name].GET(new Request(`https://portal.example.test/api/portal/${name}`));
    assert.ok(response instanceof Response, "Real NextResponse must be a Response");
    const body = await response.json();
    assert.deepEqual(f.violations, [], "Every fetch must meet the strict no-network fixture contract");
    assertSafe(f.logs);
    if (response.status !== 401) assert.match(response.headers.get("cache-control") ?? "", /private.*no-store/);
    if (name === "course") {
      assert.equal(f.writes.length, 0, "Course endpoint is strictly read-only");
      assert.ok(f.requests.every(({ method }) => method === "GET"));
    }
    return { response, body, f };
  }
  async function test(name, callback) {
    try {
      await callback();
      passed++;
      originalConsole.log(`  PASS ${name}`);
    } catch (error) {
      failures.push(name);
      originalConsole.error(`  FAIL ${name}\n${error.stack ?? error}`);
    }
  }

  for (const route of ["course", "dashboard"]) {
    await test(`${route}: unauthorized never reads DB or Moodle`, async () => {
      const result = await invoke(route, { session: null });
      assert.equal(result.response.status, 401);
      assert.deepEqual(result.body, { error: "Unauthorized" });
      assert.equal(result.f.queries.length, 0);
      assert.equal(result.f.requests.length, 0);
    });
    for (const [name, options, status, code] of [
      ["missing driver", { driver: null }, 404, "DRIVER_NOT_FOUND"],
      ["PostgREST missing driver", { driver: null, errors: { drivers: { code: "PGRST116", message: PRIVATE } } }, 404, "DRIVER_NOT_FOUND"],
      ["driver database error", { errors: { drivers: { code: "08006", message: PRIVATE } } }, 503, "DRIVER_LOOKUP"],
      ["driver lookup throws", { throws: { drivers: new Error(PRIVATE) } }, 503, "DRIVER_LOOKUP"],
      ["assignment database error", { errors: { enrolments: { code: "08006", message: PRIVATE } } }, 503, "ASSIGNMENT_LOOKUP"],
      ["assignment lookup throws", { throws: { enrolments: new Error(PRIVATE) } }, 503, "ASSIGNMENT_LOOKUP"],
    ]) {
      await test(`${route}: ${name}`, async () => {
        const result = await invoke(route, options);
        assertError(result, status, code);
        assert.equal(result.f.requests.length, 0);
        assert.equal(result.f.writes.length, 0);
      });
    }
    await test(`${route}: no assignment is honest empty success`, async () => {
      const result = await invoke(route, { enrolment: null });
      assert.equal(result.response.status, 200);
      assert.equal(result.body.version, VERSION);
      const stats = route === "course" ? result.body.programme : result.body.stats;
      assert.equal(route === "course" ? result.body.learningStatus : stats.learningStatus, "not_assigned");
      assert.equal(stats.progressPercent, 0);
      assert.equal(stats.completedModules, 0);
      assert.equal(stats.totalModules, 0);
      if (route === "course") assert.deepEqual(result.body.modules, []);
      else assert.equal(result.body.nextModule, null);
      assert.equal(result.f.requests.length, 0);
      assert.equal(result.f.writes.length, 0);
    });
  }

  await test("course: absent Moodle account is 409 rather than fabricated modules", async () => {
    const f = fixture();
    const result = await invoke("course", { driver: { ...f.driver, moodle_user_id: null } });
    assertError(result, 409, "LEARNING_ACCOUNT_PENDING");
    assert.equal(result.f.requests.length, 0);
  });
  await test("dashboard: account pending stays unavailable without provisioning fixtures", async () => {
    const f = fixture();
    const result = await invoke("dashboard", { driver: { ...f.driver, email: null, moodle_user_id: null } });
    assertUnavailable(result, "LEARNING_ACCOUNT_PENDING");
    assert.equal(result.f.requests.length, 0);
  });

  for (const [driverId, completed, percent, display, nextId] of [
    ["driver-A", 1, 33, ["completed", "available", "locked"], "11"],
    ["driver-B", 0, 0, ["available", "locked", "locked"], "10"],
  ]) {
    await test(`course/dashboard: ${driverId} uses DB user, not token/session metadata`, async () => {
      const course = await invoke("course", { driverId });
      const dashboard = await invoke("dashboard", { driverId });
      assert.equal(course.response.status, 200);
      assert.equal(dashboard.response.status, 200);
      assert.equal(course.body.version, VERSION);
      if (driverId === "driver-A") {
        uiFixtures.course = course.body;
        uiFixtures.dashboard = dashboard.body;
      }
      assert.equal(dashboard.body.version, VERSION);
      assert.equal(course.body.learningStatus, "available");
      assert.deepEqual(course.body.modules.map((m) => m.id), ["10", "11", "12"]);
      assert.deepEqual(course.body.modules.map((m) => m.status), display);
      assert.deepEqual(course.body.modules.map((m) => m.locked), display.map((state) => state === "locked"));
      assert.deepEqual(course.body.modules.map((m) => m.order), [1, 2, 3]);
      for (const stats of [course.body.programme, dashboard.body.stats]) {
        assert.equal(stats.completedModules, completed);
        assert.equal(stats.totalModules, 3);
        assert.equal(stats.progressPercent, percent);
      }
      assert.equal(dashboard.body.stats.learningStatus, "available");
      assert.equal(dashboard.body.stats.learningError, null);
      assert.equal(dashboard.body.nextModule.id, nextId);
      assert.equal(dashboard.body.stats.certificateReady, false);
      assert.equal(dashboard.body.stats.certificatePendingGfa, false);
      assert.equal(dashboard.body.stats.cpdStatus, "available");
      assert.equal(dashboard.body.stats.bulletinStatus, "available");
      assert.equal(dashboard.body.stats.cpdDue, true);
      assert.equal(dashboard.body.stats.cpdOverdueCount, 1);
      assert.equal(dashboard.body.stats.cpdUpcomingCount, 0);
      assert.equal(dashboard.body.stats.unreadBulletins, 1);
      assert.equal(dashboard.f.writes.length, 1, "Only actual available snapshot updates the existing summary");
      const write = dashboard.f.writes[0];
      assert.equal(write.write.progress_percent, percent);
      assert.equal(write.write.modules_completed, completed);
      assert.equal(write.write.completed_at, null);
      assert.equal(dashboard.f.requests.filter(({ fn }) => fn === ENROL_API).length, 1);
      for (const result of [course, dashboard]) {
        assert.equal(result.f.requests.filter(({ fn }) => fn === ACTIVITY_API).length, 1);
        assert.equal(result.f.requests.filter(({ fn }) => fn === CONTENTS_API).length, 1);
        assert.ok(result.f.requests.every(({ courseid }) => courseid === 101));
      }
    });
  }
  await test("course/dashboard: second assigned programme uses course 102", async () => {
    const f = fixture({ driverId: "driver-B" });
    for (const route of ["course", "dashboard"]) {
      const result = await invoke(route, { driverId: "driver-B", enrolment: { ...f.enrolment, programme_slug: "p2" } });
      assert.equal(result.response.status, 200);
      assert.ok(result.f.requests.every(({ courseid }) => courseid === 102));
      const stats = route === "course" ? result.body.programme : result.body.stats;
      assert.equal(stats.totalModules, 3);
      assert.equal(stats.completedModules, 0);
      assert.equal(stats.progressPercent, 0);
      assert.equal(route === "course" ? stats.title : stats.programmeTitle, "Eco-Driver Training");
    }
  });
  await test("course/dashboard: failed quiz remains retryable, never complete", async () => {
    const course = await invoke("course", { statuses: statuses([2, 3, 0]) });
    const dashboard = await invoke("dashboard", { statuses: statuses([2, 3, 0]) });
    assert.deepEqual(course.body.modules.map((m) => m.status), ["completed", "available", "locked"]);
    assert.equal(course.body.programme.completedModules, 1);
    assert.equal(dashboard.body.stats.completedModules, 1);
    assert.equal(dashboard.body.nextModule.id, "11");
    assert.equal(dashboard.body.stats.certificatePendingGfa, false);
  });
  await test("dashboard: fully complete snapshot still cannot issue a certificate", async () => {
    const result = await invoke("dashboard", { statuses: statuses([1, 2, 1]) });
    assert.equal(result.body.stats.progressPercent, 100);
    assert.equal(result.body.stats.completedModules, 3);
    assert.equal(result.body.stats.certificatePendingGfa, true);
    assert.equal(result.body.stats.certificateReady, false);
    assert.equal(result.body.nextModule, null);
    assert.equal(typeof result.f.writes[0].write.completed_at, "string");
  });

  const criticalCases = [
    ["HTTP 500 despite valid course array", "http", CONTENTS_API, "MOODLE_HTTP"],
    ["HTTP 500 despite valid statuses", "http", ACTIVITY_API, "MOODLE_HTTP"],
    ["access exception with private upstream message", "access", ACTIVITY_API, "MOODLE_ACCESS"],
    ["transport exception with token URL", "network", ACTIVITY_API, "MOODLE_NETWORK"],
    ["non-JSON critical response", "json", CONTENTS_API, "MOODLE_JSON"],
    ["missing status envelope", "payload", ACTIVITY_API, "MOODLE_PAYLOAD"],
    ["missing tracked driver status", "missing_tracked", ACTIVITY_API, "MOODLE_PAYLOAD"],
    ["aborted critical deadline", "timeout", ACTIVITY_API, "MOODLE_TIMEOUT"],
  ];
  for (const [name, failure, failureApi, code] of criticalCases) {
    for (const route of ["course", "dashboard"]) {
      await test(`${route}: ${name}`, async () => {
        const result = await invoke(route, { failure, failureApi });
        if (route === "course") assertError(result, 502, code);
        else {
          assertUnavailable(result, code);
          assert.equal(result.body.stats.cpdStatus, "available", "Learning failure does not hide successful independent reads");
          assert.equal(result.body.stats.bulletinStatus, "available");
        }
        if (failure === "access") {
          if (route === "course") {
            uiFixtures.courseError = result.body;
            uiFixtures.courseErrorStatus = result.response.status;
          } else uiFixtures.dashboardUnavailable = result.body;
        }
      });
    }
  }
  for (const route of ["course", "dashboard"]) {
    await test(`${route}: successful empty assigned course fails closed`, async () => {
      const result = await invoke(route, { sections: [], statuses: [] });
      if (route === "course") assertError(result, 502, "COURSE_EMPTY");
      else assertUnavailable(result, "COURSE_EMPTY");
    });
    await test(`${route}: malformed optional metadata does not destroy core progress`, async () => {
      const optional = sections();
      optional[0].modules[0].contents = [null, { type: "file", filename: 42, fileurl: {}, filesize: "bad" }];
      optional[0].modules[1].contents = { unexpected: "not an array" };
      const result = await invoke(route, { sections: optional });
      assert.equal(result.response.status, 200);
      const stats = route === "course" ? result.body.programme : result.body.stats;
      assert.equal(stats.completedModules, 1);
      assert.equal(stats.totalModules, 3);
      assert.equal(stats.progressPercent, 33);
    });
    await test(`${route}: optional HTML transport failure remains 200 core`, async () => {
      const optional = sections();
      optional[0].modules[0].modname = "page";
      optional[0].modules[0].contents = [{ type: "file", filename: "index.html", fileurl: `${MOODLE_ORIGIN}/pluginfile.php/optional/index.html` }];
      const result = await invoke(route, { sections: optional });
      assert.equal(result.response.status, 200);
      const stats = route === "course" ? result.body.programme : result.body.stats;
      assert.equal(stats.completedModules, 1);
      assert.equal(stats.totalModules, 3);
      assert.equal(result.f.requests.filter(({ fn }) => fn === "optional_html").length, 1);
    });
  }

  for (const table of ["driver_cpd_participation", "bulletins", "driver_bulletin_interactions"]) {
    for (const kind of ["errors", "throws"]) {
      await test(`dashboard: ${table} ${kind} cannot masquerade as zero`, async () => {
        const error = kind === "errors" ? { code: "08006", message: PRIVATE } : new Error(PRIVATE);
        const result = await invoke("dashboard", { [kind]: { [table]: error } });
        assert.equal(result.response.status, 200);
        assert.equal(result.body.stats.learningStatus, "available");
        assert.equal(result.body.stats.progressPercent, 33);
        if (table === "driver_cpd_participation") {
          assert.equal(result.body.stats.cpdStatus, "unavailable");
          assert.equal(result.body.stats.cpdDue, null);
          assert.equal(result.body.stats.cpdOverdueCount, null);
          assert.equal(result.body.stats.cpdUpcomingCount, null);
          assert.equal(result.body.stats.bulletinStatus, "available");
          assert.equal(result.body.stats.unreadBulletins, 1);
        } else {
          assert.equal(result.body.stats.bulletinStatus, "unavailable");
          assert.equal(result.body.stats.unreadBulletins, null);
          assert.equal(result.body.stats.cpdStatus, "available");
          assert.equal(result.body.stats.cpdOverdueCount, 1);
        }
      });
    }
  }
  await test("course: safe correlated support IDs are fresh per failure", async () => {
    const first = await invoke("course", { failure: "network" });
    const second = await invoke("course", { failure: "network" });
    assertError(first, 502, "MOODLE_NETWORK");
    assertError(second, 502, "MOODLE_NETWORK");
    assert.notEqual(first.body.requestId, second.body.requestId);
  });
} finally {
  globalThis.fetch = originalFetch;
  for (const [method, original] of Object.entries(originalConsole)) console[method] = original;
  if (oldFixture === undefined) delete globalThis[fixtureKey];
  else globalThis[fixtureKey] = oldFixture;
  await rm(output, { recursive: true, force: true });
}
console.log(`BetterDriver learning route regressions: ${passed} passed, ${failures.length} failed.`);
assert.equal(failures.length, 0, `Failed route regressions: ${failures.join("; ")}`);
// Only publish route-produced UI fixtures after every regression passes.
assert.ok(uiFixtures.course && uiFixtures.dashboard && uiFixtures.courseError && uiFixtures.dashboardUnavailable);
await writeFile(resolve(cache, "ui-fixtures.json"), `${JSON.stringify(uiFixtures, null, 2)}\n`);
console.log("Actual route UI fixtures: node_modules/.cache/bd-learning-tests/ui-fixtures.json");
