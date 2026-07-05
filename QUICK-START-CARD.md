# BetterDriver — Quick Start Card

> Full instructions: `FIRST-TIME-SETUP.md` | Database setup: `ALL_MIGRATIONS_RUN_ONCE.sql` | Moodle wiring: `MOODLE_SETUP.md`

---

## 1. Deploy

```bash
tar -xzf BD-betterdriver-v4.tar.gz
mv standalone /home/ubuntu/sites/bd
cd /home/ubuntu/sites/bd
cp .env.local.example .env.local
nano .env.local          # fill in all values (see table below)
pm2 start pm2.config.js
pm2 save && pm2 startup
```

---

## 2. Required Environment Variables

| Variable | Where to get it |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `BD_JWT_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://betterdriver.co.za` |
| `GFA_BASE_URL` | `https://greenfreightacademy.co.za` |
| `MOODLE_URL` | Your Moodle instance URL |
| `MOODLE_TOKEN` | Moodle → Site Admin → Web Services → Manage Tokens |
| `MOODLE_DRIVER_PROGRAMME_COURSE_ID` | Moodle course ID (number in URL) |
| `MOODLE_ECO_DRIVER_COURSE_ID` | Moodle course ID (number in URL) |
| `META_WA_API_VERSION` | e.g. `v19.0` |
| `META_WA_PHONE_NUMBER_ID` | Meta Business → WhatsApp → Phone Numbers |
| `META_WA_ACCESS_TOKEN` | Meta Business → WhatsApp → API Setup |
| `RESEND_API_KEY` | resend.com → API Keys |
| `SUPPORT_EMAIL` | e.g. `support@betterdriver.co.za` |
| `SUPPORT_PHONE` | e.g. `+27 11 000 0000` |

---

## 3. Database

Run **once** in Supabase SQL Editor:

```
ALL_MIGRATIONS_RUN_ONCE.sql
```

---

## 4. Create First BD Admin

```sql
INSERT INTO bd_admins (email, name, password_hash)
VALUES (
  'admin@betterdriver.co.za',
  'BD Admin',
  '$2a$10$PASTE_BCRYPT_HASH_HERE'   -- generate at bcrypt-generator.com (10 rounds)
);
```

---

## 5. Cron Jobs (Vercel)

Configured automatically via `vercel.json`:

| Job | Schedule | Purpose |
| :--- | :--- | :--- |
| `/api/moodle/poll` | Every 15 min | Sync completion status from Moodle |
| `/api/moodle/inactivity-check` | Daily 08:00 | Send WhatsApp nudges to inactive drivers |

---

## 6. Roles

| Role | Login URL | How created |
| :--- | :--- | :--- |
| Driver | Magic link via WhatsApp/email | GFA deploys cohort → BD sends activation link |
| BD Admin | `/admin/login` | SQL insert into `bd_admins` |

---

## 7. Verify

```bash
pm2 status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3004
# Expected: 200
```

Open `https://betterdriver.co.za` — the site should load.

---

## 8. Languages

Drivers choose EN or isiZulu on first login. The choice is saved to `drivers.language_preference` and a `bd_lang` cookie is set for client-side rendering. To add a new language, add it to `hooks/useLanguage.ts` and the `COPY` dictionaries in each portal page.
