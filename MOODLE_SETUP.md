# BetterDriver — Moodle & WhatsApp Integration Guide

This document outlines the exact setup required in Moodle and Meta Business Suite to connect the BetterDriver learning experience.

## 1. Moodle Setup

BetterDriver (BD) acts as the portal shell. Moodle hosts the videos, quizzes, and completion logic. BD needs to know when a driver completes a module or the full programme to trigger WhatsApp notifications and update the dashboard.

### A. Enable Web Services
1. Go to **Site administration > Server > Web services > Overview**
2. Enable web services
3. Enable the **REST protocol**
4. Create a specific user for API access (e.g., `bd_api_user`)
5. Create a new role with the following capabilities and assign it to the API user:
   - `moodle/course:view`
   - `moodle/user:viewdetails`
   - `moodle/user:viewhiddendetails`
   - `moodle/course:useremail`
   - `moodle/user:update`
   - `moodle/user:create`
   - `report/completion:view`
6. Create a token for this user and add it to the BD `.env.local` file as `MOODLE_TOKEN`.

### B. Configure Webhooks (Primary Sync)
BD expects Moodle to push completion events in real-time.
1. Install a Moodle Webhook plugin (e.g., `local_webhooks` or similar).
2. Configure the webhook to point to: `https://[your-bd-domain]/api/moodle/webhook`
3. Set the webhook secret to match `MOODLE_WEBHOOK_SECRET` in your `.env.local`.
4. Subscribe the webhook to the following events:
   - `\core\event\course_module_completion_updated`
   - `\core\event\course_completed`

### C. Configure Cron (Fallback Sync & Inactivity Nudges)
BD has two cron endpoints that should be called periodically (e.g., via GitHub Actions, Vercel Cron, or a standard server cron job):
1. **Polling Fallback:** `GET https://[your-bd-domain]/api/moodle/poll` (Run every 15–30 minutes)
2. **Inactivity Nudges:** `GET https://[your-bd-domain]/api/moodle/inactivity-check` (Run once daily at 09:00 SAST)

Both endpoints require an `Authorization: Bearer [CRON_SECRET]` header matching the `CRON_SECRET` in `.env.local`.

---

## 2. Meta WhatsApp Setup

BD sends automated WhatsApp messages for welcome, module completion, and inactivity nudges. These use the Meta Graph API (same as GFA).

### A. Environment Variables
Add these to your BD `.env.local`:
```env
META_WA_TOKEN=your_permanent_system_user_token
META_WA_PHONE_NUMBER_ID=your_phone_number_id
META_WA_API_VERSION=v19.0
```

### B. Message Templates to Submit
You must create and submit the following 5 templates in the **Meta Business Suite > WhatsApp Manager > Message Templates**.
**Category:** Utility
**Languages:** English (en_US) and Zulu (zu)

#### 1. bd_welcome_first_login
**Variables:** `{{1}}` = Driver Name, `{{2}}` = Programme Name, `{{3}}` = Portal Link
**English Copy:**
> Welcome back, {{1}}. Your {{2}} programme is ready. Tap the link below to continue your training:
> {{3}}

#### 2. bd_module_complete
**Variables:** `{{1}}` = Driver Name, `{{2}}` = Module Number, `{{3}}` = Portal Link
**English Copy:**
> Great work, {{1}}! You have completed Module {{2}}. Tap the link below to start the next module:
> {{3}}

#### 3. bd_inactivity_7day
**Variables:** `{{1}}` = Driver Name, `{{2}}` = Modules Completed, `{{3}}` = Portal Link
**English Copy:**
> Hi {{1}}, it has been a week since your last session. You have completed {{2}} modules so far. Tap the link below to pick up where you left off:
> {{3}}

#### 4. bd_inactivity_14day
**Variables:** `{{1}}` = Driver Name, `{{2}}` = Modules Completed, `{{3}}` = Portal Link
**English Copy:**
> Hi {{1}}, your training is waiting for you. You have completed {{2}} modules. Tap the link below to continue:
> {{3}}

#### 5. bd_programme_complete
**Variables:** `{{1}}` = Driver Name, `{{2}}` = Programme Name, `{{3}}` = Portal Link
**English Copy:**
> Congratulations, {{1}}! You have successfully completed the {{2}} programme. Tap the link below to view and download your certificate:
> {{3}}

*(Note: Ensure you submit the Zulu translations for each of these templates as well, using the exact same variable structure.)*
