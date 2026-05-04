# BetterDriver (BD)

**Website:** [betterdriver.co.za](https://betterdriver.co.za)

BetterDriver is the driver-facing LMS portal for professional truck driver training and certification. Drivers access their assigned courses, track progress, download certificates, and maintain their profile. Companies activate cohorts through the Green Freight Academy. This repository contains the full source code for the BetterDriver platform.

**Design principle:** Zero friction between link tap and learning. Drivers never create passwords. A magic link tap silently authenticates the driver and lands them directly in their portal, pre-enrolled and ready to learn.

Key platform capabilities include:
- **Persistent Magic Link Authentication** — drivers authenticate via a persistent opaque token (no passwords, no registration screens); the token resolves to a 30-day rolling JWT session; links expire only at campaign end date or when revoked by the operator
- **Welcome Video on First Access** — on first magic link tap, drivers are shown a personalised welcome screen with an invite video (uploaded by GFA admin) before entering the portal
- **Personalised Portal** — every screen addresses the driver by first name; language preference (English or Zulu) is set at invitation time
- **Offline Download** — drivers can download course content over WiFi for offline viewing
- **Driver Bulletins** — urgent and standard safety bulletins delivered to drivers with WhatsApp notification; drivers acknowledge and complete comprehension checks in-portal

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
    join/[token]/             # Magic link resolution — resolves opaque token, issues JWT, redirects to portal
    moodle/                   # Moodle LMS integration routes
  portal/                     # Driver portal pages (JWT protected)
    welcome/                  # First-access welcome screen with invite video
    tasks/                    # Assigned training tasks
    course/                   # Active course viewer
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
public/                       # Static assets
supabase/migrations/          # SQL migration files (apply via Supabase SQL editor)
```

---

## Local Development

```bash
git clone https://github.com/Abdool11/betterdriver.git
cd betterdriver
npm install
cp .env.local.example .env.local
# Fill in .env.local values
# Apply all incremental migrations in order:
#   supabase/migrations/20260502_phase1_auth_rebuild.sql
npm run dev
```

> **Database migrations:** Each file in `supabase/migrations/` is a standalone SQL script. Apply them in filename order via the Supabase dashboard SQL editor or the Supabase CLI (`supabase db push`).

### Authentication Flow

1. GFA deploys training → creates a `driver_invitations` row with a UUID opaque token and sets `expires_at` to the campaign end date
2. GFA sends WhatsApp with link: `https://betterdriver.co.za/join/{token}`
3. Driver taps link → `GET /api/join/[token]` resolves the token, marks `first_accessed_at` if first visit, issues a 30-day JWT session cookie, and redirects to `/portal/welcome` (first access) or `/portal` (returning)
4. All portal pages call `requireDriverSession()` which reads the JWT cookie — no password ever required
5. Sessions roll automatically on each visit; the driver is re-authenticated silently when the JWT nears expiry
6. Operators can revoke a link at any time via GFA admin → the `revoked_at` field is checked on every token resolution

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
| `GFA_BASE_URL` | Yes | Green Freight Academy site URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full URL of this site in production |

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

### Step-by-Step Workflow

1. Create a branch from `main`: `git checkout -b feature/your-feature-name`
2. Make changes and commit: `git commit -m "feat: describe what changed and why"`
3. Push the branch: `git push origin feature/your-feature-name`
4. Open a Pull Request on GitHub against `main`
5. Review the diff — GitHub flags any conflicts before merge
6. Approve and merge to `main`
7. Delete the feature branch after merging

---

## Deployment

Packaged as a standalone tar.gz including `server.js`, `pm2.config.js`, `nginx.conf`, `deploy.sh`, `QUICK-START-CARD.md`, and `.env.local.example`.

> **Important:** The Nginx config must include a `location /_next/static/` block. Without this the site loads without any styling. This is already included in the provided `nginx.conf`.

---

## Related Repositories

| Site | Repository |
| :--- | :--- |
| Transport Action Group | [Abdool11/transportactiongroup](https://github.com/Abdool11/transportactiongroup) |
| Green Freight Academy | [Abdool11/greenfreightacademy](https://github.com/Abdool11/greenfreightacademy) |
