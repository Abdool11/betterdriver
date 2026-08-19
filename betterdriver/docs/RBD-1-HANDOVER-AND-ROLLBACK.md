# RBD-1: GFA-to-BetterDriver Handover Stabilisation

**Branch:** `feature/rbd1-handover-stabilisation`  
**Status:** Build verified; awaiting Asif review and controlled deployment.  
**Database migration:** None.  
**New environment variables:** None.

## Purpose

RBD-1 makes the existing GFA driver WhatsApp link format (`https://betterdriver.co.za/join/{token}`) an explicit BetterDriver application route. It removes reliance on an undocumented proxy rewrite and renews a returning driver's active 30-day session during its final seven days.

No WhatsApp template, invitation-token format, Supabase table, Moodle connection, certificate behaviour, or driver data is changed.

## Files changed

| File | Change | Risk |
|---|---|---:|
| `app/join/[token]/route.ts` | New canonical public route that forwards `/join/{token}` requests to the existing tested invitation resolver at `/api/join/{token}`. | Low |
| `middleware.ts` | Renews a valid driver session only when fewer than seven days remain; keeps admin and driver routes separated. | Medium, build verified |
| `README.md` | Documents route contract, verification and rollback process. | None |
| `package-lock.json` | Re-synchronised with the repository's declared Next.js dependency so a clean install/build can run. | Low; dependency lock alignment only |

## Expected driver journey

1. GFA deploys a paid driver and sends the existing WhatsApp link: `https://betterdriver.co.za/join/{token}`.
2. BetterDriver's new canonical route forwards the request internally to the existing invitation resolver.
3. A valid first-time invitation creates a secure `bd_session` cookie and takes the driver to language selection or the welcome page.
4. A valid returning invitation takes the driver directly to `/portal`.
5. An active portal session with seven or fewer days remaining receives a replacement 30-day session cookie.
6. Invalid, revoked or expired invitation tokens retain the existing safe redirect to `/start`.

## Option C confirmation: re-access plus rolling renewal

RBD-1 and RBD-2 together implement **Option C**. RBD-2 provides rate-limited, non-enumerating self-service re-access after an idle session has expired. RBD-1 keeps active drivers signed in without requiring them to request a new link.

The initial driver JWT is correctly issued for 30 days in `lib/auth.ts`. Renewal is intentionally implemented in `middleware.ts`, rather than in `auth.ts`, because middleware can attach a replacement httpOnly cookie to every eligible `/portal/*` response. On a valid driver portal request, middleware calculates the remaining JWT lifetime. If **seven days or fewer** remain, it signs and sets a fresh 30-day `bd_session` cookie. It never renews admin sessions, invalid tokens, or tokens with more than seven days remaining.

> A driver who returns to the BetterDriver portal during the final seven days of a valid session receives a fresh 30-day session. A driver who remains idle until expiry uses the RBD-2 re-access route. This is deliberate Option C behaviour, not an Option B-only implementation.

## Pre-deployment checks

Use a dedicated non-production test driver and quote where possible.

| Check | Expected result |
|---|---|
| Visit `/join/{valid-token}` | First access reaches language/welcome; returning access reaches `/portal` |
| Visit `/join/{invalid-token}` | Redirects to `/start?error=invalid-link` |
| Visit `/join/{revoked-token}` | Redirects to `/start?error=link-deactivated` |
| Visit `/join/{expired-token}` | Redirects to `/start?error=link-expired` |
| Driver session opens `/admin/dashboard` | Redirected to `/admin/login` |
| Admin session opens `/portal` | Redirected to `/start` |
| Near-expiry driver token opens `/portal` | Response sets a fresh 30-day `bd_session` cookie |
| Existing GFA WhatsApp deployment | Link retains `/join/{token}` format and succeeds without a proxy-only dependency |

## Deployment sequence

1. Review the branch diff and confirm no separate production Nginx rewrite is required.
2. Merge `feature/rbd1-handover-stabilisation` into `main`.
3. Deploy BetterDriver through the normal PM2/Nginx/Vercel pipeline.
4. Run every check in the table above.
5. Retain the branch until at least one real controlled driver deployment has completed successfully.

## Failsafe rollback

RBD-1 has no database migration and no configuration change. It can be reversed without data repair.

```bash
# Option A: revert the merged RBD-1 commit on main
git revert <RBD1_MERGE_COMMIT>
git push origin main

# Option B: redeploy the previous known-good BetterDriver release
# using the existing deployment artefact/process.
```

If an external `/join/*` rewrite already exists, it is safe to leave it in place during rollout and rollback. The new application route is compatible with the current GFA URL format.

## Known boundary: RBD-2 and beyond

RBD-1 does not add a self-service re-access link after an idle driver session expires, does not add PWA installation, and does not add push notifications. Those will be separate, reviewable releases after the real GFA-to-BetterDriver production journey has passed the checks above.
