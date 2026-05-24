# Transport Action Group (TAG)

**Website:** [transportactiongroup.co.za](https://transportactiongroup.co.za)

TAG is a national advisory and implementation platform for green freight and electric truck action plans. This repository contains the full source code for the TAG website.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 14 (App Router, standalone output) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| Auth | JWT (custom admin auth) |
| Deployment | Node.js standalone + Nginx + PM2 |

---

## Project Structure

```
app/                    # Next.js App Router pages and API routes
  api/                  # Backend API routes
  admin/                # Admin dashboard (JWT protected)
  tco-calculator/       # TCO Calculator with Daily Energy panel
  green-freight/        # Green Freight content pages
  electric-truck/       # Electric Truck content pages
  academy/              # Academy and training pages
  books/                # Publications and books
  ecosystem-partners/   # Ecosystem partner directory
  partner-with-tag/     # Partner registration
  about/                # About TAG
  contact/              # Contact form
components/             # Shared React components
lib/                    # Utilities, constants, Supabase client
public/                 # Static assets (images, fonts)
```

---

## Local Development

```bash
git clone https://github.com/Abdool11/transportactiongroup.git
cd transportactiongroup
npm install
cp .env.local.example .env.local
# Fill in .env.local values
npm run dev
```

Site runs at `http://localhost:3000`.

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `ADMIN_JWT_SECRET` | Yes | Secret for signing admin JWT tokens |
| `RESEND_API_KEY` | Yes | Resend API key for contact form emails |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full URL of this site in production |
| `NEXT_PUBLIC_GFA_URL` | Yes | Green Freight Academy site URL |
| `NEXT_PUBLIC_BD_URL` | Yes | BetterDriver site URL |

---

## Branching and Version Control Workflow

This repository follows traditional Git feature branch workflow. All changes go through a branch and Pull Request — nothing is pushed directly to `main`.

### Branch Naming Convention

| Type | Pattern | Example |
| :--- | :--- | :--- |
| New feature | `feature/short-description` | `feature/tco-export-pdf` |
| Bug fix | `fix/short-description` | `fix/contact-form-validation` |
| Content update | `content/short-description` | `content/update-homepage-hero` |
| Hotfix (urgent) | `hotfix/short-description` | `hotfix/admin-login-broken` |

### Step-by-Step Workflow

1. Create a branch from `main`: `git checkout -b feature/your-feature-name`
2. Make changes and commit: `git commit -m "feat: describe what changed and why"`
3. Push the branch: `git push origin feature/your-feature-name`
4. Open a Pull Request on GitHub against `main`
5. Review the diff — GitHub flags any conflicts before merge
6. Approve and merge to `main`
7. Delete the feature branch after merging

### Commit Message Format

```
feat: add PDF export to TCO calculator
fix: correct nginx static assets block
content: update Green Freight page with 2025 statistics
chore: update dependencies
```

---

## Deployment

The app is packaged as a standalone tar.gz including `server.js`, `pm2.config.js`, `nginx.conf`, `deploy.sh`, `QUICK-START-CARD.md`, and `.env.local.example`.

> **Important:** The Nginx config must include a `location /_next/static/` block pointing to the `.next/static/` directory. Without this the site loads without any CSS or JavaScript styling. This is already included in the provided `nginx.conf`.

---

## Deploying Updates

When new changes are pushed to `main`, Asif deploys them to the live server with these four commands:

```bash
# 1. Pull the latest code from GitHub
git pull origin main

# 2. Install any new dependencies (safe to run even if nothing changed)
npm install

# 3. Rebuild the application
npm run build

# 4. Restart the app (PM2 picks up the new build automatically)
pm2 restart tag-app
```

The site will be live with the new changes within 1–2 minutes of running `pm2 restart`.

> **Note:** After `npm run build`, copy the new static assets into the standalone directory before restarting:
> ```bash
> cp -r .next/static .next/standalone/.next/static
> cp -r public .next/standalone/public
> pm2 restart tag-app
> ```

---

## Recent Changes

| Date | Branch | Summary |
| :--- | :--- | :--- |
| 2026-04-29 | `feature/ui-updates-homepage-tco-electric-truck` | Hero text split into two lines, bragging line brought into view, Electric Truck badge removed, Electric Trucks page renamed to Africa, TCO title/subtitle updated, TCO layout reordered (inputs → Daily Energy → Optional Considerations), default values synced, new logo, Partner with TAG button resized |
| 2026-04-29 | `fix/nginx-static-assets-and-setup-docs` | Fixed nginx.conf to include `/_next/static/` block (critical for CSS serving), added FIRST-TIME-SETUP.md |
| 2026-04-29 | `docs` | Added README, CONTRIBUTING guide, PR template |
| 2026-04-29 | `initial` | Initial commit — TAG v4 production-ready source code |

---

## Admin Access

Admin backend at `/admin/login`. Credentials are set via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables — never committed to this repository.

---

## Related Repositories

| Site | Repository |
| :--- | :--- |
| Green Freight Academy | [Abdool11/greenfreightacademy](https://github.com/Abdool11/greenfreightacademy) |
| BetterDriver | [Abdool11/betterdriver](https://github.com/Abdool11/betterdriver) |
