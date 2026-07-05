/**
 * Playwright script: visits ALL quiz modules and interacts with each.
 * Opens a visible browser so the user can watch.
 */
import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (match) env[match[1]] = match[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = env.BD_JWT_SECRET ?? env.JWT_SECRET ?? "bd-dev-secret-change-in-production";
const BASE_URL = "http://localhost:3000";

const QUIZZES = [
  { cmid: "285", name: "Module 1 Quiz - Highway Heroes" },
  { cmid: "291", name: "Module 2 Quiz - Know Your Machine" },
  { cmid: "286", name: "Module 3 Quiz - Driver First" },
  { cmid: "287", name: "Module 4 Quiz - Mastering the Road" },
  { cmid: "288", name: "Module 5 Quiz - Smart Driving" },
  { cmid: "289", name: "Module 6 Quiz - The Business of Freight" },
  { cmid: "290", name: "Module 7 Quiz - The Professional in Me" },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, first_name, last_name, email, moodle_user_id, language_preference")
    .not("moodle_user_id", "is", null)
    .limit(1);
  const driver = drivers[0];
  console.log("Using driver:", driver.id, driver.first_name, driver.last_name);

  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({
    driverId: driver.id,
    email: driver.email ?? "test@test.com",
    firstName: driver.first_name ?? "Test",
    lastName: driver.last_name ?? "Driver",
    role: "driver",
    languagePreference: driver.language_preference ?? "en",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addCookies([
    { name: "bd_session", value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax", secure: false },
    { name: "bd_lang", value: "en", domain: "localhost", path: "/", httpOnly: false, sameSite: "Lax", secure: false },
  ]);

  const page = await context.newPage();
  page.on("console", (msg) => {
    const t = msg.text();
    if (t.includes("[MODULE_PAGE]") || t.includes("[QUIZ"))
      console.log("[BROWSER]", t.slice(0, 150));
  });

  // Start at portal dashboard so user sees the journey
  console.log("\n=== Portal Dashboard ===");
  await page.goto(BASE_URL + "/portal", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "screenshots/00-dashboard.png", fullPage: true });

  // Learning page
  console.log("\n=== Learning Page ===");
  await page.goto(BASE_URL + "/portal/learning", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "screenshots/00-learning.png", fullPage: true });

  for (let qi = 0; qi < QUIZZES.length; qi++) {
    const quiz = QUIZZES[qi];
    const url = BASE_URL + "/portal/module/" + quiz.cmid;
    const sep = "=".repeat(60);
    console.log("\n" + sep);
    console.log("Quiz " + (qi + 1) + "/" + QUIZZES.length + ": " + quiz.name);
    console.log("URL: " + url);
    console.log(sep);

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: "screenshots/q" + (qi + 1) + "-01-loaded.png", fullPage: true });

    // Analyze the page
    const bodyText = await page.textContent("body");
    const h3 = await page.$("h3");
    const h3Text = h3 ? await h3.textContent() : null;
    const radioGroups = await page.$$('[role="radiogroup"]');
    const answerLabels = await page.$$('label[role="radio"]');
    const textareas = await page.$$("textarea");
    const submitBtn = await page.$('button:has-text("Submit")');
    const unsupported = bodyText && bodyText.includes("not supported in the simplified quiz view");

    console.log("  Title (h3): " + h3Text);
    console.log("  Radio groups: " + radioGroups.length);
    console.log("  Answer labels: " + answerLabels.length);
    console.log("  Textareas: " + textareas.length);
    console.log("  Submit button: " + !!submitBtn);
    console.log("  Unsupported type msg: " + unsupported);

    if (bodyText && bodyText.includes("Couldn't load")) {
      console.log("  ERROR: Quiz failed to load");
      await page.waitForTimeout(5000);
      continue;
    }

    // Click answers for multiple choice
    if (radioGroups.length > 0) {
      console.log("  -> Clicking answers...");
      for (let i = 0; i < radioGroups.length; i++) {
        const options = await radioGroups[i].$$('label[role="radio"]');
        if (options.length > 0) {
          const idx = Math.min(1, options.length - 1);
          console.log("     Q" + (i + 1) + ": option " + (idx + 1) + "/" + options.length);
          await options[idx].click();
          await page.waitForTimeout(500);
        }
      }
      await page.screenshot({ path: "screenshots/q" + (qi + 1) + "-02-answered.png", fullPage: true });
    }

    // Fill essay textareas
    if (textareas.length > 0) {
      console.log("  -> Filling " + textareas.length + " essay answer(s)...");
      for (let i = 0; i < textareas.length; i++) {
        await textareas[i].fill("Test answer from automated browser test. The driver understands the importance of professional driving standards and safety on the road.");
      }
      await page.screenshot({ path: "screenshots/q" + (qi + 1) + "-02-answered.png", fullPage: true });
    }

    // Submit
    if (submitBtn) {
      console.log("  -> Clicking Submit...");
      await submitBtn.click();
      await page.waitForTimeout(6000);
      await page.screenshot({ path: "screenshots/q" + (qi + 1) + "-03-submitted.png", fullPage: true });

      const resultText = await page.textContent("body");
      if (resultText && resultText.includes("Quiz submitted")) console.log("  RESULT: Submitted successfully!");
      else if (resultText && resultText.includes("Quiz finished")) console.log("  RESULT: Quiz finished.");
      else if (resultText && (resultText.includes("error") || resultText.includes("Error"))) console.log("  RESULT: Possible error - check screenshot");
      else console.log("  RESULT: Check screenshot q" + (qi + 1) + "-03-submitted.png");
    }

    // Pause so user can see the result
    await page.waitForTimeout(5000);
  }

  const sep2 = "=".repeat(60);
  console.log("\n" + sep2);
  console.log("All quizzes tested! Keeping browser open for 30s...");
  console.log(sep2);
  await page.waitForTimeout(30000);
  await browser.close();
  console.log("Done. Check screenshots/ folder for all captures.");
}

run().catch((err) => { console.error("Fatal:", err); process.exit(1); });
