# Moodle Integration Protection Framework
## BetterDriver (BD) Ecosystem

> **Status:** Active Standard
> **Applies to:** All future development on the BD repository
> **Purpose:** To prevent any future code change from breaking Asif's live Moodle integration.

---

## 1. The Core Principle: The "Safe Zone" vs The "Contract Zone"

The Moodle integration is not scattered randomly throughout the codebase. It is isolated into specific files and functions. We divide the codebase into two zones:

### The Safe Zone (UI, Layouts, Database Reads)
You can change these freely. Changing a button color, adding a new dashboard widget, or reading data from Supabase will **never** break Moodle.

### The Contract Zone (The Moodle Bridge)
These files are the bridge between BetterDriver and Moodle. **If you change the inputs, outputs, or logic of these files, you risk breaking the live integration.**

---

## 2. The Contract Zone Files (DO NOT TOUCH without an FSD)

If a future feature requires modifying ANY of the following files, it triggers a **High-Risk FSD** (Feature Specification Document) which must explicitly detail how Moodle compatibility will be maintained.

### 1. `lib/moodle.ts`
This is the core engine. It contains the API calls to Moodle's web services.
- **Protected functions:** `moodleCreateUser`, `moodleEnrolUser`, `moodleGetCourseProgress`
- **Why it breaks:** Changing the payload structure, the endpoint URL, or the error handling here will immediately stop drivers from being created or enrolled in Moodle.

### 2. `app/api/moodle/webhook/route.ts`
This is where Moodle talks back to BetterDriver when a driver completes a module.
- **Protected logic:** The JSON payload parsing (`req.json()`) and the Supabase `enrolments` table update.
- **Why it breaks:** If you change what this route expects to receive, Asif's Moodle webhooks will start failing with 400/500 errors, and progress will stop syncing.

### 3. `app/api/moodle/poll/route.ts`
This is the cron job that actively asks Moodle for progress updates.
- **Protected logic:** The iteration over active enrolments and the mapping of Moodle's response to Supabase's `progress_percent`.
- **Why it breaks:** Changing the cron schedule in `vercel.json` or the mapping logic here will cause progress to stall or sync incorrectly.

### 4. `app/api/join/[token]/route.ts`
This is the magic link resolution route.
- **Protected logic:** The exact moment where `moodleCreateUser` and `moodleEnrolUser` are called.
- **Why it breaks:** If you move, delay, or alter this sequence, drivers will log into BetterDriver but will not exist in Moodle, causing the course iframe to fail.

---

## 3. The "Append-Only" Rule for Database Sync

Moodle relies on specific columns in the Supabase database to know who is who.

**Protected Columns:**
- `drivers.moodle_user_id`
- `enrolments.moodle_user_id`
- `enrolments.progress_percent`
- `enrolments.status`

**The Rule:** You may add new columns to these tables, but you may **never** rename, delete, or change the data type of these protected columns. Moodle's webhooks and polling scripts are hardcoded to write to these exact column names.

---

## 4. How to Safely Test Moodle Changes

If a feature *must* change the Contract Zone, you cannot test it by "hoping it works." You must follow the **Mock-First Testing Protocol**:

1. **Never test against Asif's live Moodle server** during development.
2. If you are modifying `lib/moodle.ts`, you must create a mock Moodle response in your local environment to verify the BetterDriver side handles the new logic correctly.
3. The FSD for the feature must include a specific "Moodle Handover Note" for Asif, detailing exactly what changed in the payload or webhook structure so he can update the Moodle side simultaneously.

---

## 5. The Pre-Handover Audit Update

The `tag-ecosystem-audit.py` script has been updated to include a **Moodle Contract Check**.

If the script detects that any file in the Contract Zone has been modified, it will flag it in the audit report:
`⚠️ WARNING: Moodle Contract Zone modified. Ensure FSD covers integration impact.`

This ensures that no developer can accidentally slip a change into the Moodle bridge without it being explicitly flagged for Asif's attention before deployment.
