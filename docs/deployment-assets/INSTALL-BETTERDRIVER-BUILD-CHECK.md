# Install the BetterDriver Build Check

This is a **standalone BetterDriver repository**. The application and `package.json` are at the Git repository root, and GitHub Actions reads workflow files from the root `.github/workflows/` directory.

## Build-gate location

The recovery branch already includes the required workflow at:

```text
.github/workflows/betterdriver-build-check.yml
```

No copy action is needed after this recovery branch is merged. The identical reference copy is retained at `docs/deployment-assets/betterdriver-build-check.yml` for audit purposes.

> The workflow runs from the **repository root**. It intentionally has no `working-directory: betterdriver` setting because the nested application directory has been removed.

## Required Vercel setting

In the BetterDriver Vercel project, open **Settings → General → Root Directory** and leave the value **blank**.

Save the setting and redeploy the Preview environment. A blank value is now correct because `package.json` is at the repository root.

## Expected result

The workflow will run these commands from the repository root:

```text
npm ci
npm run type-check
npm run build
```

A green result is the release gate for BetterDriver preview testing. Keep `ENABLE_PUSH_NOTIFICATIONS=false` until VAPID configuration and real-device opt-in testing are complete.
