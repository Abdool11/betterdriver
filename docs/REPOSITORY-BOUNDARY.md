# BetterDriver Repository Boundary and Standalone Recovery

**Status:** Recovery branch documentation
**Applies to:** `feature/betterdriver-single-project-recovery` and its successor release branch
**Date:** 30 August 2026

## Purpose

BetterDriver must be deployable, reviewable and testable as a single application. This repository therefore contains **only the BetterDriver project** and the files required to build, document and deploy it. Green Freight Academy (GFA) and Transport Action Group (TAG) remain separate applications with their own repositories.

This separation removes the ambiguous multi-project layout that could cause routing confusion, incorrect Vercel build roots, incorrect dependency installation and unsafe review scope.

> **Rule:** a contributor may add a file here only if BetterDriver needs it to build, run, test, document, deploy or operate its own driver-learning service.

## Permitted root contents

| Root item | Why it belongs in BetterDriver |
|---|---|
| `app/`, `pages/`, `components/`, `hooks/`, `lib/`, `types/` | BetterDriver application source, driver/admin routes and reusable code |
| `public/` | BetterDriver PWA, service-worker and static assets |
| `supabase/migrations/` | BetterDriver-owned schema migrations, including re-access and push-subscription records |
| `docs/` | BetterDriver deployment, Moodle, release and driver-experience documentation |
| `scripts/` | BetterDriver development/operational scripts only |
| `.github/` | BetterDriver PR template, build gate and Moodle cron workflow |
| `package.json`, `package-lock.json` | Standalone npm project definition and locked dependencies |
| `next.config.js`, `vercel.json`, `middleware.ts` | BetterDriver framework, deployment and request controls |
| `.env.local.example` | Documented BetterDriver configuration template; no real secret values |
| `deploy.sh`, `pm2.config.js`, `nginx.conf` | BetterDriver deployment options where still used by the project |

## Explicitly excluded content

| Excluded item | Reason |
|---|---|
| `greenfreightacademy/` | GFA is a separate application/repository; its source must not affect BetterDriver builds or routes. |
| `transportactiongroup/` | TAG is a separate application/repository; its source must not affect BetterDriver builds or routes. |
| Cross-ecosystem `tests/` workspace | It contained TAG/GFA/BetterDriver tests and tracked dependency output. BetterDriver testing belongs in a BetterDriver-specific test setup only. |
| `New Deployments files/`, ecosystem hardening scripts and unrelated assets | These are not part of the BetterDriver application runtime or release process. |
| `.next/`, `node_modules/`, `.env.local` and temporary screenshots | Generated/local/private artefacts must never be committed. |

## Vercel and GitHub Actions settings after recovery

| Setting | Required value |
|---|---|
| Vercel project Root Directory | **Blank** — Vercel must build from the repository root. |
| Vercel Build Command | Default `npm run build` unless a project-specific override is approved. |
| Vercel Install Command | Default `npm ci` / Vercel standard install behaviour. |
| GitHub build gate path | `.github/workflows/betterdriver-build-check.yml` |
| Build-gate package location | Repository root: `package-lock.json`, `package.json` |
| Build-gate commands | `npm ci`, `npm run type-check`, `npm run build` |

## Feature preservation statement

The standalone recovery moves—not rewrites—the current BetterDriver application source to the Git repository root. It preserves the driver-experience release work, including:

- canonical driver hand-off at `/join/[token]`;
- rolling renewal of eligible active driver sessions and secure re-access flow;
- BetterDriver PWA assets and post-portal install experience;
- opt-in push-notification foundation and disabled-by-default `ENABLE_PUSH_NOTIFICATIONS` control;
- BetterDriver RBD-2 and RBD-4 Supabase migrations;
- Moodle integration source and current BetterDriver deployment documentation.

No GFA or TAG application source is copied into the recovered repository. GFA remains the separate owner of commercial, enrolment, evidence-reporting and learning-event receiver functionality.

## Safe review procedure for Asif

1. Open the recovery PR and review the top-level tree first.
2. Confirm there is exactly one `package.json`, at the Git root.
3. Confirm there are no `greenfreightacademy/`, `transportactiongroup/`, cross-ecosystem `tests/` or tracked `node_modules/` paths.
4. Confirm `.github/workflows/betterdriver-build-check.yml` runs at the root and has no `working-directory: betterdriver` setting.
5. Confirm `.env.local.example`, `README.md`, `supabase/migrations/`, `MOODLE_SETUP.md` and `vercel.json` exist at the root.
6. In Vercel, set **Root Directory** to blank and trigger a Preview deployment.
7. Run the BetterDriver smoke path: test `/join/{token}`, return to portal, re-access request, Moodle launch, and post-portal PWA prompt.
8. Do not delete the former `release/betterdriver-driver-experience-v1` branch until the Preview deployment and smoke path pass.

## Rollback

The original `release/betterdriver-driver-experience-v1` branch remains unchanged. If the recovered project does not pass the clean build and Preview smoke test, close the recovery PR and continue review from the preserved release branch while the structural issue is investigated. Do **not** force-push or delete the current release branch.
