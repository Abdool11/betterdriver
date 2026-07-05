# Feature Specification Document (FSD)
## BetterDriver — Live Data Wiring (Replace Mock Data with Supabase)

> **Status:** Approved — Ready for Development
> **Repo:** BD (`betterdriver`)
> **Author:** TAG Development
> **Date:** 2026-05-06
> **Estimated dev time:** 2–3 days

---

## 1. Summary

BetterDriver's portal pages currently display mock data defined in `lib/constants.ts`. This feature replaces every mock data block with live Supabase queries so that drivers see their actual enrolment status, progress, CPD records, bulletins, and certificate. It also wires up the profile edit form so that changes are saved to the database. No new features are being added — this is purely a data layer swap.

---

## 2. User Story

> **As a** driver who has been activated and enrolled in a course
> **I want to** see my real training progress, tasks, and certificate in the portal
> **So that** I know exactly where I am in my programme and what I need to do next

---

## 3. Acceptance Criteria

1. The tasks page shows the driver's real enrolment status and module completion data from Supabase.
2. The progress page shows the driver's real `progress_percent` from the `enrolments` table.
3. The certificate page shows the driver's real certification record from the `certifications` table, or a "not yet earned" state if none exists.
4. The CPD page shows the driver's real records from `cpd_records` and `driver_cpd_participation`.
5. The bulletins page fetches real bulletins from the `bulletins` table filtered by the driver's company.
6. The profile page loads the driver's real data and saves changes via the existing `/api/portal/profile` PATCH route.
7. All pages display a loading skeleton while fetching and a clear empty state if no data exists.
8. All user-facing text on every page is available in both English and isiZulu.

---

## 4. Database Changes

No new tables or columns are required. All necessary schema changes were completed in the `20260506_driver_cv_columns.sql` migration.

**Verify the following tables exist and have the correct columns before starting:**

| Table | Key Columns Needed |
| :--- | :--- |
| `drivers` | `id`, `first_name`, `last_name`, `email`, `mobile`, `language_preference`, `activation_status`, `profile_complete`, `licence_class`, `licence_number`, `licence_expiry`, `years_experience`, `vehicle_types` |
| `enrolments` | `id`, `driver_id`, `course_id`, `status`, `progress_percent`, `enrolled_at`, `completed_at`, `moodle_user_id` |
| `certifications` | `id`, `driver_id`, `course_id`, `issued_at`, `certificate_number`, `verified` |
| `cpd_records` | `id`, `driver_id`, `title`, `status`, `due_date`, `completed_at` |
| `bulletins` | `id`, `company_id`, `title`, `category`, `urgency`, `published_at` |
| `driver_bulletin_interactions` | `id`, `driver_id`, `bulletin_id`, `status`, `opened_at` |

### Migration File to Create

None required.

---

## 5. API Routes

### New Routes to Create

| Method | Route | File Path | Purpose | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/portal/dashboard` | `app/api/portal/dashboard/route.ts` | Returns driver's enrolment, progress, and unread bulletin count in a single call | Driver session |
| `GET` | `/api/portal/tasks` | `app/api/portal/tasks/route.ts` | Returns driver's task list derived from enrolment status and module completion | Driver session |
| `GET` | `/api/portal/progress` | `app/api/portal/progress/route.ts` | Returns driver's progress metrics | Driver session |
| `GET` | `/api/portal/certificate` | `app/api/portal/certificate/route.ts` | Returns driver's certification record | Driver session |
| `GET` | `/api/portal/cpd` | `app/api/portal/cpd/route.ts` | Returns driver's CPD records | Driver session |
| `GET` | `/api/portal/bulletins` | `app/api/portal/bulletins/route.ts` | Returns bulletins for the driver's company | Driver session |

### Existing Routes to Verify (Already Built)

| Method | Route | File Path | Status |
| :--- | :--- | :--- | :--- |
| `GET/PATCH` | `/api/portal/profile` | `app/api/portal/profile/route.ts` | Built — verify `language_preference` is in allowed fields |

---

## 6. Pages and Components

### Modified Pages (Mock → Live)

| Page | File Path | What Changes |
| :--- | :--- | :--- |
| Dashboard | `app/portal/page-client.tsx` | Replace `MOCK_STATS` with fetch to `/api/portal/dashboard` |
| Tasks | `app/portal/tasks/page.tsx` | Replace `MOCK_TASKS` with fetch to `/api/portal/tasks` |
| Progress | `app/portal/progress/page.tsx` | Replace mock data with fetch to `/api/portal/progress` |
| Certificate | `app/portal/certificate/page.tsx` | Replace mock data with fetch to `/api/portal/certificate` |
| CPD | `app/portal/cpd/page.tsx` | Replace mock data with fetch to `/api/portal/cpd` |
| Bulletins | `app/portal/bulletins/page-client.tsx` | Replace mock data with fetch to `/api/portal/bulletins` |
| Profile | `app/portal/profile/page-client.tsx` | Replace mock data with fetch to `/api/portal/profile` |

### New Components to Create

| Component | File Path | Purpose |
| :--- | :--- | :--- |
| `LoadingSkeleton` | `components/portal/LoadingSkeleton.tsx` | Reusable loading state for all portal pages |
| `EmptyState` | `components/portal/EmptyState.tsx` | Reusable empty state with EN/ZU copy |

---

## 7. Environment Variables

No new environment variables are required for this feature. All required Supabase variables are already in `.env.local.example`.

---

## 8. Third-Party Integrations

No new third-party integrations. The Moodle poll cron (`/api/moodle/poll`) already syncs completion data into Supabase — this feature reads from Supabase only.

---

## 9. Translation Requirements

Every new user-facing string on every modified page must be added to the `COPY` dictionary in both English and isiZulu. The `useLanguage` hook and `bd_lang` cookie are already in place.

| Context | English | isiZulu |
| :--- | :--- | :--- |
| Loading state | "Loading..." | "Iyalayisha..." |
| No tasks yet | "No tasks yet. Check back soon." | "Akukho imisebenzi. Buya maduze." |
| No certificate yet | "Your certificate will appear here once you complete the programme." | "Isitifiketi sakho sizovela lapha uma uqeda uhlelo." |
| No CPD records | "No CPD records yet." | "Akukho amarekhodi e-CPD." |
| No bulletins | "No bulletins from your company yet." | "Akukho izaziso ezivela enkampanini yakho." |
| Profile saved | "Profile updated." | "Iphrofayeli ibuyekeziwe." |

---

## 10. Files Checklist

### Created
- [ ] `app/api/portal/dashboard/route.ts`
- [ ] `app/api/portal/tasks/route.ts`
- [ ] `app/api/portal/progress/route.ts`
- [ ] `app/api/portal/certificate/route.ts`
- [ ] `app/api/portal/cpd/route.ts`
- [ ] `app/api/portal/bulletins/route.ts`
- [ ] `components/portal/LoadingSkeleton.tsx`
- [ ] `components/portal/EmptyState.tsx`

### Modified
- [ ] `app/portal/page-client.tsx`
- [ ] `app/portal/tasks/page.tsx`
- [ ] `app/portal/progress/page.tsx`
- [ ] `app/portal/certificate/page.tsx`
- [ ] `app/portal/cpd/page.tsx`
- [ ] `app/portal/bulletins/page-client.tsx`
- [ ] `app/portal/profile/page-client.tsx`
- [ ] `lib/constants.ts` (remove or archive MOCK_ constants once live)

---

## 11. Pre-Handover Audit

Before marking this feature complete, run the audit script:

```bash
python3 /home/ubuntu/scripts/tag-ecosystem-audit.py /home/ubuntu/bd-v2-clean
```

- [ ] 0 missing tables
- [ ] 0 missing columns
- [ ] 0 missing env vars
- [ ] 0 build errors
- [ ] 0 missing deployment files
- [ ] All files in Section 10 are ticked
- [ ] All changes pushed to GitHub `main`

---

## 12. Notes for Asif

- The database schema is already complete. No SQL migrations need to be run for this feature.
- The `bd_lang` cookie is set at login — client components read it via `hooks/useLanguage.ts`. No changes to the auth flow are needed.
- The Moodle poll cron must be running for progress data to stay current. Confirm `/api/moodle/poll` is being called every 15 minutes via Vercel cron (configured in `vercel.json`).
- Remove the yellow `MOCK DATA` banners from each page as you wire up the live data — they are the `<div className="...">MOCK DATA — Asif to connect...</div>` blocks at the top of each page.
