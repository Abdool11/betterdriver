# BetterDriver Release Scope and Monorepo Boundary

## Why the repository contains GFA and TAG directories

`Abdool11/betterdriver` is an established **monorepo**. Its `main` branch already contains these top-level directories:

```text
betterdriver/
greenfreightacademy/
transportactiongroup/
tests/
```

The BetterDriver Next.js application is only the nested `betterdriver/` directory. The GFA and TAG directories are pre-existing repository baseline content; they were not introduced by `release/betterdriver-driver-experience-v1`.

> This BetterDriver release must **not** delete, move, merge from, or deploy the GFA/TAG directories. Removing them in this release would be a separate, high-risk monorepo restructuring project and would create an unrelated destructive diff against `main`.

## Release comparison rule

Review the release by comparing it with `main`, not by inspecting the full repository tree:

```bash
git diff --name-status origin/main...release/betterdriver-driver-experience-v1
```

For the BetterDriver Driver Experience V1 release, intended application changes are scoped to:

```text
betterdriver/**
.github/workflows/betterdriver-build-check.yml
```

No changes to `greenfreightacademy/**` or `transportactiongroup/**` are part of this release. The separately maintained GFA repository remains the deployment source for the GFA commercial/compliance release.

## Deployment boundary

| Concern | BetterDriver release behaviour |
|---|---|
| Vercel source root | `betterdriver` |
| GitHub build gate | Root `.github/workflows/betterdriver-build-check.yml`, executing from `betterdriver/` |
| Application build command | `cd betterdriver && npm ci && npm run type-check && npm run build` |
| Database migrations | Only `betterdriver/supabase/migrations/20260820_rbd2_driver_reaccess.sql` and `betterdriver/supabase/migrations/20260822_rbd4_push_notifications.sql` |
| GFA/TAG code | Baseline monorepo content; excluded from the BetterDriver release scope |

## Future housekeeping

If the team wants to split BetterDriver into a standalone repository or remove baseline GFA/TAG copies, plan it separately after this release is live and stable. That work needs a full import/deployment audit and must not be mixed into the current driver-experience release.
