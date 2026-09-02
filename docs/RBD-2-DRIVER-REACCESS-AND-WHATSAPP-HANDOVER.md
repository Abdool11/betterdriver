# RBD-2 — Driver Re-access and WhatsApp Onboarding

## Paired branches

| Repository | Branch | Purpose |
|---|---|---|
| BetterDriver | `feature/rbd2-driver-reaccess-onboarding` | Secure expired-session recovery endpoint, rate-limit/audit trail and mobile recovery form. |
| GFA | `feature/rbd2-driver-whatsapp-onboarding` | Clearer initial driver WhatsApp onboarding copy while retaining the existing opaque magic link. |

RBD-2 must be merged only after RBD-1, because BetterDriver RBD-2 depends on the canonical `/join/{token}` route.

## BetterDriver changes

- `POST /api/auth/reaccess` accepts a mobile number and always returns the same response to prevent account enumeration.
- The request is rate-limited to three requests per mobile hash per 15 minutes and logged in `driver_reaccess_requests`.
- Where an active driver and invitation exist, BetterDriver creates a fresh 30-day opaque invitation and sends a WhatsApp template message.
- `/start` includes a mobile-first **Send my secure link** form for drivers whose portal session has expired.

## Required Supabase migration

Run `supabase/migrations/20260820_rbd2_driver_reaccess.sql` after the BetterDriver branch is merged. It is additive and idempotent.

## Required Meta template

Create and approve the Utility template `bd_reaccess_link` in English and isiZulu.

| Template part | Required content |
|---|---|
| Body | `Hi {{1}}, here is your secure BetterDriver access link. Tap below to continue your training, safety briefings and professional record.` |
| URL button | `https://betterdriver.co.za/join/{{1}}` |
| Parameter | Button parameter is the opaque token, never a driver ID, email or mobile number. |

The application sends `{{1}}` in the body as the driver first name and the URL button parameter as the opaque token. Do not put personal data in the button URL.

## Paired verification

1. Merge/deploy RBD-1 first.
2. Apply the RBD-2 BetterDriver migration and configure the Meta template.
3. Merge/deploy the GFA message branch.
4. Deploy a test driver from GFA and verify the revised first WhatsApp message contains the working `/join/{token}` link.
5. On BetterDriver `/start`, submit the registered mobile number and verify generic confirmation.
6. Confirm a registered test driver receives `bd_reaccess_link`; confirm an unknown number receives no driver message but sees the same generic response.
7. Submit more than three requests in 15 minutes and confirm no additional invitation is sent.
8. Confirm invalid/revoked invitations still redirect safely to `/start`.

## Failsafe rollback

- Revert either Git branch independently; neither branch changes an existing invitation token, payment, training record or certificate.
- The BetterDriver migration only adds an audit table. Do not delete the audit history during rollback.
- If the Meta template is not approved, do not enable RBD-2 re-access in production; RBD-1 and the existing GFA deployment link continue to work.
- If the GFA copy branch is rolled back, only the fallback message wording changes; the magic-link format is unchanged.
