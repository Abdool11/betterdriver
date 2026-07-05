# BetterDriver — First-Time Setup Guide

This guide is written for a developer deploying BetterDriver (BD) for the first time on a fresh Ubuntu server. Follow every step in order. Do not skip any step.

**Important:** BetterDriver is the driver-facing LMS portal. It works in conjunction with Green Freight Academy (GFA). Drivers are registered and activated through the GFA cohort deployment workflow. BD should be deployed alongside GFA, not as a standalone product.

---

## Prerequisites

- Ubuntu 22.04 server with a public IP address
- Domain `betterdriver.co.za` pointing to your server's IP (DNS A record)
- Root or sudo access
- A Supabase project (the same project used for GFA — they share the same database)
- GFA already deployed and running

---

## Step 1 — Install Required Software

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
sudo apt install -y nginx
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 2 — Extract the Deployment Package

```bash
sudo mkdir -p /home/ubuntu/sites
cd /home/ubuntu/sites

tar -xzf BD-betterdriver-v4.tar.gz
mv standalone bd

ls bd/
# You should see: server.js  node_modules/  .next/  public/  .env.local.example  nginx.conf  pm2.config.js  deploy.sh  QUICK-START-CARD.md
```

---

## Step 3 — Configure Environment Variables

```bash
cd /home/ubuntu/sites/bd
cp .env.local.example .env.local
nano .env.local
```

Fill in every value:

| Variable | What to put |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (same as GFA) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `BD_JWT_SECRET` | Long random string: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://betterdriver.co.za` |
| `GFA_BASE_URL` | `https://greenfreightacademy.co.za` |
| `TAG_BASE_URL` | `https://transportactiongroup.co.za` |
| `MOODLE_URL` | Your Moodle instance URL (e.g., `https://moodle.yourdomain.com`) |
| `MOODLE_TOKEN` | Moodle web services token (generate in Moodle > Site Admin > Web Services) |
| `MOODLE_DRIVER_PROGRAMME_COURSE_ID` | Moodle course ID for the Professional Driver Programme |
| `MOODLE_ECO_DRIVER_COURSE_ID` | Moodle course ID for the Advanced Eco-Driver Programme |
| `RESEND_API_KEY` | Your Resend.com API key (for activation emails) |
| `SUPPORT_EMAIL` | Support email shown to drivers (e.g., `support@betterdriver.co.za`) |
| `SUPPORT_PHONE` | Support phone number shown to drivers |

Save with `Ctrl+O`, then `Ctrl+X`.

---

## Step 4 — Verify the Database

The database tables for BD were created when you ran `supabase-setup.sql` for GFA. BD uses the same Supabase project.

Verify the following tables exist in your Supabase Table Editor:
- `drivers`
- `driver_invitations`
- `deployments`
- `bd_admins`
- `courses`
- `cohorts`

If any are missing, re-run `supabase-setup.sql` in the Supabase SQL Editor.

---

## Step 5 — Create the First BD Admin Account

BD admin accounts are stored in the `bd_admins` Supabase table with bcrypt-hashed passwords. There is no default account — you must create one.

**Generate a bcrypt hash of your chosen password:**
Go to https://bcrypt-generator.com, enter your password, set rounds to **10**, and click Generate. Copy the hash.

**Insert the admin record in Supabase SQL Editor:**

```sql
INSERT INTO bd_admins (email, name, password_hash)
VALUES (
  'admin@betterdriver.co.za',
  'BD Admin',
  '$2a$10$PASTE_YOUR_BCRYPT_HASH_HERE'
);
```

---

## Step 6 — Configure Nginx

```bash
nano /home/ubuntu/sites/bd/nginx.conf
# Confirm all alias paths say /home/ubuntu/sites/bd/...

sudo cp /home/ubuntu/sites/bd/nginx.conf /etc/nginx/sites-available/betterdriver.co.za
sudo ln -s /etc/nginx/sites-available/betterdriver.co.za \
           /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 7 — Get SSL Certificate

```bash
sudo certbot --nginx -d betterdriver.co.za -d www.betterdriver.co.za
```

---

## Step 8 — Start the Application

```bash
cd /home/ubuntu/sites/bd
pm2 start pm2.config.js
pm2 save
pm2 startup
# Run the command PM2 outputs
```

---

## Step 9 — Verify the Site is Working

```bash
pm2 status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3004
# Should return: 200
```

Open `https://betterdriver.co.za` in your browser. The site should load with full styling.

---

## Roles on BetterDriver

BD has two authenticated roles:

### Role 1 — Driver

Drivers do **not** register themselves. They are registered by a GFA company client when a cohort is deployed. The workflow is:

1. A GFA company client imports drivers and deploys a cohort
2. GFA sends each driver an activation email with a unique link
3. The driver clicks the link, goes to `/activate?token=THEIR_TOKEN`
4. They set a password and are taken to their portal at `/portal/tasks`

**To test the driver role without a live email:**
1. In Supabase, insert a test driver into the `drivers` table
2. Insert a test invitation into `driver_invitations` with a known token value and set `expires_at` to a future date
3. Visit `https://betterdriver.co.za/activate?token=YOUR_TEST_TOKEN`

---

### Role 2 — Admin

| Action | URL |
| :--- | :--- |
| Log in | `/admin/login` |
| Admin dashboard | `/admin/dashboard` |

**Credentials:** Use the email and password you inserted into `bd_admins` in Step 5.

**What admin can do:** View all drivers, manage deployments, view cohort progress, manage courses.

---

## Troubleshooting

**Site loads but has no styling**
The `location /_next/static/` block in nginx.conf is not working or the alias path is wrong. Check the path and run `sudo nginx -t && sudo systemctl reload nginx`.

**Admin login fails**
Check the `bd_admins` table in Supabase has a record. Verify the bcrypt hash was generated correctly.

**Driver activation link does not work**
Check `BD_JWT_SECRET` is set in `.env.local`. Verify the token in `driver_invitations` has not expired (`expires_at` must be in the future).

**Moodle enrolment not working**
Check `MOODLE_URL`, `MOODLE_TOKEN`, and the course ID variables in `.env.local`. Verify the Moodle web services token has the `enrol_manual_enrol_users` capability enabled.
