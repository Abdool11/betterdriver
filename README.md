# BetterDriver — Next.js 15 Frontend Package

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui  
**Role in ecosystem:** Driver development portal — the human resource asset layer. Where the investment in people lands. Training, certification, CPD, professional profile, and career record for professional truck drivers.

---

## Component Inventory

### Layout Components (`/components/layout/`)

| Component | Purpose | Props |
|---|---|---|
| `Navigation.tsx` | Public site top navigation — amber/charcoal, mobile-first | None — reads from `lib/constants.ts` |
| `Footer.tsx` | Site footer with programme links, ecosystem links, legal | None — reads from `lib/constants.ts` |
| `PortalLayout.tsx` | Authenticated portal sidebar layout | `children: React.ReactNode` |

### Page Components — Public (`/app/`)

| Route | File | Dynamic Data Required |
|---|---|---|
| `/` | `app/page.tsx` | Registry sample via `/api/registry?limit=3` |
| `/start` | `app/start/page.tsx` | Payment via Paystack (Asif to implement) |
| `/login` | `app/login/page.tsx` | Supabase Auth (Asif to implement) |
| `/help` | `app/help/page.tsx` | None — static FAQ content |
| `/registry` | `app/registry/page.tsx` | Driver registry search via `/api/registry` |
| `/certificate` | `app/certificate/page.tsx` | Certificate lookup via `/api/certificate?id=` |

### Page Components — Authenticated Portal (`/app/portal/`)

| Route | File | Dynamic Data Required |
|---|---|---|
| `/portal/tasks` | `app/portal/tasks/page.tsx` | Driver tasks via `/api/driver/tasks` |
| `/portal/course` | `app/portal/course/page.tsx` | Course progress via `/api/driver/course` |
| `/portal/progress` | `app/portal/progress/page.tsx` | Progress summary via `/api/driver/progress` |
| `/portal/certificate` | `app/portal/certificate/page.tsx` | Certificate data via `/api/driver/certificate` |
| `/portal/cpd` | `app/portal/cpd/page.tsx` | CPD history via `/api/driver/cpd` |
| `/portal/profile` | `app/portal/profile/page.tsx` | Driver profile via `/api/driver/profile` |
| `/portal/support` | `app/portal/support/page.tsx` | None — static support content |

---

## Data Flow

### Driver Authentication
```
Login page → Supabase Auth → session cookie → PortalLayout checks session
                                             → Redirect to /login if unauthenticated
```
All portal routes (`/portal/*`) require authentication. `PortalLayout.tsx` handles the auth check.

### Enrolment Flow (`/start`)
```
Driver selects programme → fills personal details → Paystack payment
                                                  → POST /api/enrol
                                                  → Supabase: driver_enrolments table
                                                  → Moodle: create user + enrol in course
                                                  → Email confirmation to driver
```
The `?programme=` query parameter pre-selects the programme from the pricing section.

### Driver Tasks (`/portal/tasks`)
```
Component mounts → GET /api/driver/tasks → TaskItem[] sorted by priority
                                         → Overdue tasks shown first (red)
                                         → Urgent CPD shown second (orange)
                                         → Current module shown third (primary)
                                         → Next CPD shown last (standard)
```

### Certificate Download (`/portal/certificate`)
```
Component mounts → GET /api/driver/certificate → CertificateData
                                               → PDF generation via /api/certificate/download
                                               → Public registry entry at /registry?id=
```

### Public Registry (`/registry`)
```
Search input → GET /api/registry?q={query}&programme={filter}
             → RegistryEntry[] with verified status
             → Publicly accessible — no authentication required
```

### CPD Submission (GFA side — referenced from portal)
```
Company submits incident → POST /api/cpd-submissions (on GFA)
                         → visibility: "anonymous" | "private"
                         → dispatch: "urgent" | "standard"
                         → urgent triggers push to driver tasks within the month
                         → standard queued for next quarterly CPD cycle
```

---

## Static Strings

All static strings, labels, and copy live in `lib/constants.ts`. Key exports:

- `PROGRAMMES` — all six programme definitions with pricing, duration, and features
- `MOCK_TASKS` — demo task data (remove before go-live)
- `MOCK_DRIVER` — demo driver profile (remove before go-live)
- `MOCK_REGISTRY` — demo registry entries (remove before go-live)
- `FAQS` — static FAQ content for the help page
- `EXTERNAL_LINKS` — ecosystem URLs from `process.env`

---

## Environment Variables

Key variables required (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GFA_URL` | GreenFreightAcademy site URL |
| `NEXT_PUBLIC_TAG_URL` | Transport Action Group site URL |
| `NEXT_PUBLIC_ZERO_AFRICA_URL` | ZeroAfrica site URL |
| `NEXT_PUBLIC_BD_API_URL` | BetterDriver API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key (Asif to provide) |

---

## TypeScript Types

All data shapes are defined in `types/index.ts`. Key interfaces:

- `Driver` — authenticated driver profile
- `TaskItem` — portal task with status, priority, and progress
- `Programme` — training programme definition
- `RegistryEntry` — public driver registry entry
- `CertificateData` — driver certificate data
- `CPDItem` — CPD history item
- `EnrolmentFormData` — enrolment form submission payload

---

## Mock Data Removal Checklist

Before going live, remove or replace the following:

- [ ] `MOCK_TASKS` in `lib/constants.ts` — replace with live `/api/driver/tasks` fetch
- [ ] `MOCK_DRIVER` in `lib/constants.ts` — replace with live `/api/driver/profile` fetch
- [ ] `MOCK_REGISTRY` in `lib/constants.ts` — replace with live `/api/registry` fetch
- [ ] Yellow `[DEMO DATA]` banners in portal screens — remove once live data is connected
- [ ] `MOCK_CPD_ITEMS` in `lib/constants.ts` — replace with live `/api/driver/cpd` fetch
- [ ] `MOCK_PROGRESS` in `lib/constants.ts` — replace with live `/api/driver/progress` fetch

---

## Supabase Schema (Asif to implement)

### `drivers` table
```sql
id uuid primary key default gen_random_uuid()
email text unique not null
full_name text not null
id_number text
licence_number text
pdp_number text
phone text
employer text
created_at timestamptz default now()
updated_at timestamptz default now()
```

### `driver_enrolments` table
```sql
id uuid primary key default gen_random_uuid()
driver_id uuid references drivers(id)
programme_id text not null
enrolment_type text not null  -- 'individual' | 'corporate'
company_id uuid references companies(id) nullable
paystack_reference text
payment_status text  -- 'pending' | 'paid' | 'failed'
moodle_enrolment_id text
enrolled_at timestamptz default now()
```

### `driver_certificates` table
```sql
id uuid primary key default gen_random_uuid()
driver_id uuid references drivers(id)
programme_id text not null
certificate_number text unique not null  -- format: BD-YYYY-NNNNN
issued_at timestamptz not null
is_public boolean default true
moodle_completion_id text
```

### `driver_cpd` table
```sql
id uuid primary key default gen_random_uuid()
driver_id uuid references drivers(id)
cpd_module_id text not null
status text  -- 'pending' | 'in_progress' | 'completed' | 'overdue'
dispatch_type text  -- 'urgent' | 'standard'
due_date timestamptz
completed_at timestamptz
```

---

## Deployment Notes

- Deploy to Vercel. Set all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard.
- The portal routes (`/portal/*`) require Supabase Auth to be configured before they are functional.
- The public routes (`/`, `/start`, `/registry`, `/help`, `/certificate`) are fully functional without auth.
- Paystack integration: Asif to implement using the Paystack public key in the enrolment flow.
