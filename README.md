# BetterDriver (BD)

**Website:** [betterdriver.co.za](https://betterdriver.co.za)

BetterDriver is the driver-facing LMS portal for professional truck driver training and certification. Drivers access their assigned courses, track progress, download certificates, and maintain their profile. Companies activate cohorts through the Green Freight Academy. This repository contains the full source code for the BetterDriver platform.

**Design principle:** Zero friction between link tap and learning. Drivers never create passwords. A magic link tap silently authenticates the driver and lands them directly in their portal, pre-enrolled and ready to learn.

Key platform capabilities include:
- **Persistent Magic Link Authentication** — drivers authenticate through the canonical `/join/{token}` opaque-link route (no passwords or registration screens); the token resolves to a 30-day JWT session that is safely renewed for active drivers during its final seven days; invitation links remain subject to their configured expiry or operator revocation
- **Language Selection on First Access** — drivers choose English or IsiZulu on their first visit; preference is stored and applied throughout the portal
- **Welcome Video on First Access** — after language selection, drivers see a personalised welcome screen with the programme invite video before entering the portal
- **Moodle Integration (Webhook + Polling)** — Moodle handles all video delivery, quizzes, and completion logic; BD syncs progress via real-time webhooks (primary) and a polling cron job (fallback); see `MOODLE_SETUP.md` for full configuration instructions
- **WhatsApp Notifications** — automated messages sent via Meta Graph API at key milestones: welcome on first access, module completion, programme completion, and inactivity nudges at 7 and 14 days
- **Module Landing Pages** — each module has a dedicated landing page showing video status, quiz status, and a Moodle deep-link launch button; the button is locked until all 5 videos are complete
- **Personalised Portal** — every screen addresses the driver by first name; language preference (English or Zulu) is applied throughout
- **Offline Download** — drivers can download course content over WiFi for offline viewing
- **Driver Bulletins** — urgent and standard safety bulletins delivered to drivers with WhatsApp notification; drivers acknowledge and complete comprehension checks in-portal
- **Installable Driver Portal** — the BetterDriver PWA provides branded home-screen icons and an Android install prompt after a driver has entered the portal
- **Opt-in Push Foundation** — browser push subscriptions and delivery audit records are available behind a disabled-by-default flag; WhatsApp remains the driver fallback channel
- **Deployment Experience** — a root-level GitHub build check, a deployment-ready PR template and a versioned integration runbook make the GFA/BetterDriver release train easier to review and reverse

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 14 (App Router, standalone output) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| LMS | Moodle (via REST API) |
| Auth | JWT (custom driver and admin auth) |
| Deployment | Node.js standalone + Nginx + PM2 |

---

## User Roles

| Role | Access | Description |
| :--- | :--- | :--- |
| Driver | Portal pages | Accesses courses, tracks progress, downloads certificate |
| Company | Activation flow | Activates cohort and registers drivers |
| Admin | Admin dashboard | Manages drivers, cohorts, and platform settings |

---

## Project Structure

```
app/
  api/                        # Backend API routes
    auth/                     # Driver login, logout
    admin/                    # Admin-only routes (JWT protected)
    driver/                   # Driver profile, progress, certificate
    join/[token]/             # Canonical public driver entry — forwards GFA /join/{token} links to the invitation resolver
    api/join/[token]/         # Magic link resolution — resolves opaque token, issues JWT, redirects to portal
    moodle/
      webhook/                # POST — receives real-time completion events from Moodle
      poll/                   # POST — cron fallback; polls Moodle for all active enrolments
      inactivity-check/       # POST — cron; sends 7-day and 14-day WhatsApp nudges
  portal/                     # Driver portal pages (JWT protected)
    language/                 # Language selection screen (shown once on first access)
    welcome/                  # First-access welcome screen with invite video
    tasks/                    # Assigned training tasks
    course/                   # Programme overview — module list with lock/progress state
    module/[id]/              # Module landing page — video list, quiz status, Moodle launch
    progress/                 # Progress tracking
    certificate/              # Certificate download
    profile/                  # Driver profile management
    bulletins/                # Driver bulletin list and detail
  admin/                      # Admin dashboard (JWT protected)
  activate/                   # Redirect — forwards any /activate?token=xxx URLs to /join/[token]
  start/                      # Shown when no session exists; handles invalid/revoked/expired link errors
  login/                      # Driver login (fallback)
  registry/                   # Public certified driver registry
  help/                       # Help and support
  about/ contact/ privacy/ terms/
components/                   # Shared React components
lib/                          # Utilities, constants, Supabase client, Moodle client
  auth.ts                     # Hybrid token auth: resolveInvitationToken, issueDriverSession, requireDriverSession
  moodle.ts                   # Moodle REST API client: moodleGetProgress, moodleCreateUser, moodleCourseUrl
  whatsapp.ts                 # Meta Graph API WhatsApp client: all 5 BD message templates
public/                       # Static assets
supabase/migrations/          # SQL migration files (apply via Supabase SQL editor)
MOODLE_SETUP.md               # Full Moodle + WhatsApp setup guide for Asif
```

---

## Repository Layout and Vercel Configuration

This GitHub repository is a **standalone BetterDriver project**. Its root contains the BetterDriver Next.js application, deployment configuration, documentation, test-support files and BetterDriver migrations only. Green Freight Academy (GFA) and Transport Action Group (TAG) live in their own repositories and are not included here.

> **Required Vercel setting:** in the BetterDriver Vercel project, open **Settings → General → Root Directory** and leave it **blank** (the repository root). The root now contains the BetterDriver `package.json`, `vercel.json`, `app/`, `public/` and Supabase migrations.

The GitHub Actions build gate is at `.github/workflows/betterdriver-build-check.yml` and runs `npm ci`, `npm run type-check` and `npm run build` from the repository root. See [`docs/REPOSITORY-BOUNDARY.md`](docs/REPOSITORY-BOUNDARY.md) for the permitted repository contents and recovery rationale.

## Local Development

```bash
git clone https://github.com/Abdool11/betterdriver.git
cd betterdriver
npm ci
cp .env.local.example .env.local
# Fill in .env.local values
# Apply all incremental migrations in order:
#   supabase/migrations/20260502_phase1_auth_rebuild.sql
#   supabase/migrations/20260504_moodle_integration.sql
#   supabase/migrations/20260820_rbd2_driver_reaccess.sql
#   supabase/migrations/20260822_rbd4_push_notifications.sql
npm run dev
```

> **Database migrations:** Each file in `supabase/migrations/` is a standalone SQL script. Apply them in filename order via the Supabase dashboard SQL editor or the Supabase CLI (`supabase db push`).

### Authentication Flow

1. GFA deploys training → creates a `driver_invitations` row with a UUID opaque token and sets `expires_at` to the campaign end date
2. GFA sends WhatsApp with link: `https://betterdriver.co.za/join/{token}`
3. Driver taps the canonical `GET /join/[token]` route, which forwards internally to `GET /api/join/[token]`. The resolver marks `first_accessed_at` if first visit, issues a 30-day JWT session cookie, and redirects to:
   - `/portal/language` — if first access and no language preference set
   - `/portal/welcome` — if first access and language already set
   - `/portal` — returning driver
4. All portal pages call `requireDriverSession()` which reads the JWT cookie — no password ever required
5. Active driver sessions are renewed silently when fewer than seven days remain on the JWT. Idle sessions still expire and require a valid re-access link.
6. Operators can revoke a link at any time via GFA admin; the `revoked_at` field is checked when an invitation token is resolved and by server-side driver-session guards.

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `BD_JWT_SECRET` | Yes | Secret for signing driver JWT tokens |
| `ADMIN_JWT_SECRET` | Yes | Secret for signing admin JWT tokens |
| `MOODLE_URL` | Yes | Base URL of the Moodle instance |
| `MOODLE_TOKEN` | Yes | Moodle REST API token |
| `MOODLE_DRIVER_PROGRAMME_COURSE_ID` | Yes | Moodle course ID for Professional Driver programme |
| `MOODLE_ECO_DRIVER_COURSE_ID` | Yes | Moodle course ID for Eco-Driver programme |
| `MOODLE_WEBHOOK_SECRET` | Yes | Shared secret for validating Moodle webhook requests |
| `MOODLE_POLL_SECRET` | Yes | Bearer token for authorising cron poll requests |
| `META_WA_TOKEN` | Yes | Meta Graph API permanent system user token |
| `META_WA_PHONE_NUMBER_ID` | Yes | Meta WhatsApp Business phone number ID |
| `META_WA_API_VERSION` | No | Meta Graph API version (default: v19.0) |
| `NEXT_PUBLIC_BD_URL` | Yes | Full public URL of this site (used in WhatsApp message links) |
| `GFA_BASE_URL` | Yes | Green Freight Academy site URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full URL of this site in production |
| `VAPID_PUBLIC_KEY` | Push only | Server VAPID public key |
| `VAPID_PRIVATE_KEY` | Push only | Server VAPID private key; never expose this value |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push only | Same public VAPID key, safe for the browser subscription request |
| `ENABLE_PUSH_NOTIFICATIONS` | Release controlled | Leave `false` until real-device opt-in and WhatsApp fallback tests pass |

> See `MOODLE_SETUP.md` for full Moodle configuration instructions and WhatsApp template copy.
>
> **Driver Experience V1:** The GFA companion release runbook at [`../greenfreightacademy/docs/releases/2026-08-commercial-compliance-v1/00-RELEASE-SUMMARY.md`](https://github.com/Abdool11/greenfreightacademy/tree/release/gfa-commercial-compliance-v1/docs/releases/2026-08-commercial-compliance-v1) explains the shared deployment, migration, feature-activation and rollback sequence.

---

## Branching and Version Control Workflow

All changes go through a branch and Pull Request — nothing is pushed directly to `main`.

### Branch Naming Convention

| Type | Pattern | Example |
| :--- | :--- | :--- |
| New feature | `feature/short-description` | `feature/certificate-pdf-download` |
| Bug fix | `fix/short-description` | `fix/moodle-progress-sync` |
| Content update | `content/short-description` | `content/update-help-page` |
| Hotfix (urgent) | `hotfix/short-description` | `hotfix/driver-login-broken` |
| Integration release | `release/short-description` | `release/betterdriver-driver-experience-v1` |

### Step-by-Step Workflow

1. Create a branch from `main`: `git checkout -b feature/your-feature-name`
2. Make changes and commit: `git commit -m "feat: describe what changed and why"`
3. Run `npm ci`, `npm run type-check` and `npm run build`.
4. Push the branch: `git push origin feature/your-feature-name`.
5. Complete the deployment-ready PR template, including migration, external configuration, feature-flag and rollback details.
6. Wait for the GitHub **BetterDriver Build Check** and a Vercel Preview deployment. Confirm the Vercel project Root Directory is blank (repository root) before interpreting any build failure.
7. For a cumulative release, merge feature commits into a `release/...` branch and open one final PR to `main` after preview tests pass.
8. Approve and merge only after the preview checklist passes; delete the source branch after the release is stable.

---

## RBD-2 Driver Re-access and WhatsApp Onboarding

RBD-2 adds a rate-limited, non-enumerating driver re-access request flow at `/start`. A registered driver can request a fresh 30-day opaque BetterDriver link through an approved Meta Utility template. The required migration, Meta template parameters, paired GFA message release, verification journey and failsafe rollback are documented in `docs/RBD-2-DRIVER-REACCESS-AND-WHATSAPP-HANDOVER.md`.

## RBD-1 Handover Stabilisation — Deployment and Rollback

RBD-1 adds an explicit in-application `/join/[token]` route so GFA WhatsApp links no longer depend on an undocumented proxy rewrite. It also renews active driver sessions only during the final seven days of a 30-day session.

### Pre-merge verification

1. From a deployed GFA test quote, send a BetterDriver link and confirm `https://betterdriver.co.za/join/{token}` reaches the first-access language/welcome flow.
2. Open an existing valid link and confirm a returning driver reaches `/portal`.
3. Confirm an invalid, revoked and expired token each redirect to `/start` with the correct error state.
4. Use a test JWT with fewer than seven days remaining and confirm the portal response replaces the `bd_session` cookie with a new 30-day token.
5. Confirm a driver session never grants access to `/admin`, and an admin session never grants access to `/portal`.

### Failsafe rollback

The change is self-contained: revert the RBD-1 Git commit or redeploy the prior known-good BetterDriver release. No SQL migration or environment-variable change is required. If an external `/join/*` proxy rewrite exists, it may remain in place during and after rollback because the in-app route is compatible with the current GFA link format.

## Deployment

Vercel deploys `main` to production. Feature and release branches should be reviewed on their Vercel Preview deployment before a PR is merged. BetterDriver’s companion integration branch is `release/betterdriver-driver-experience-v1`.

> **Required before deployment:** leave the Vercel project **Root Directory** blank so Vercel builds from this standalone repository root, where `package.json` is located.
>
> **Important:** Do not push directly to `main`. Keep `ENABLE_PUSH_NOTIFICATIONS=false` until real-device opt-in and WhatsApp-fallback testing are documented.

---

## Related Repositories

| Site | Repository |
| :--- | :--- |
| Transport Action Group | [Abdool11/transportactiongroup](https://github.com/Abdool11/transportactiongroup) |
| Green Freight Academy | [Abdool11/greenfreightacademy](https://github.com/Abdool11/greenfreightacademy) |
