# Install the BetterDriver Build Check

This repository uses a **monorepo layout**. The BetterDriver Next.js application is nested at `betterdriver/`, while GitHub Actions reads workflow files only from the Git root `.github/workflows/` directory.

## One-time installation

In GitHub, on the `release/betterdriver-driver-experience-v1` branch, create the following file at the **repository root**:

```text
.github/workflows/betterdriver-build-check.yml
```

Copy the full contents of `betterdriver/docs/deployment-assets/betterdriver-build-check.yml` into that file unchanged, commit it to the release branch, and confirm that **BetterDriver Build Check** appears on the repository’s Actions tab.

> The workflow intentionally sets `working-directory: betterdriver`. This is required because `package.json` and `package-lock.json` are nested under `betterdriver/`; running npm at Git root will fail.

## Required Vercel setting

In the BetterDriver Vercel project, open **Settings → General → Root Directory** and set the value to:

```text
betterdriver
```

Save the setting and redeploy the Preview environment. A blank value makes Vercel search the monorepo root, where BetterDriver has no `package.json`.

## Expected result

The workflow will run these commands from `betterdriver/`:

```text
npm ci
npm run type-check
npm run build
```

A green result is the release gate for BetterDriver preview testing. Keep `ENABLE_PUSH_NOTIFICATIONS=false` until VAPID configuration and real-device opt-in testing are complete.
