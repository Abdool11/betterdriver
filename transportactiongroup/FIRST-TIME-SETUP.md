# TAG — First-Time Setup Guide

This guide is written for a developer deploying TAG for the first time on a fresh Ubuntu server. Follow every step in order. Do not skip any step.

---

## Prerequisites

- Ubuntu 22.04 server with a public IP address
- Domain `transportactiongroup.co.za` pointing to your server's IP (DNS A record)
- Root or sudo access
- A Supabase project created at https://supabase.com (free tier is fine)

---

## Step 1 — Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Verify versions
node -v    # Should show v22.x.x
npm -v
nginx -v
```

---

## Step 2 — Extract the Deployment Package

```bash
# Create the sites directory
sudo mkdir -p /home/ubuntu/sites
cd /home/ubuntu/sites

# Upload the TAG tar.gz to the server, then extract it
tar -xzf TAG-transportactiongroup-v4.tar.gz
mv standalone tag

# Verify the structure
ls tag/
# You should see: server.js  node_modules/  .next/  public/  .env.local.example  nginx.conf  pm2.config.js  deploy.sh  QUICK-START-CARD.md
```

---

## Step 3 — Configure Environment Variables

```bash
cd /home/ubuntu/sites/tag

# Copy the example file
cp .env.local.example .env.local

# Edit the file and fill in all values
nano .env.local
```

Fill in every value in `.env.local`. The required variables are:

| Variable | What to put |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (from Supabase dashboard > Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep this secret) |
| `ADMIN_EMAIL` | The email address you will use to log in to the TAG admin panel |
| `ADMIN_PASSWORD` | A strong password for the TAG admin panel |
| `ADMIN_JWT_SECRET` | A long random string — generate one with: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://transportactiongroup.co.za` |
| `RESEND_API_KEY` | Your Resend.com API key (for contact form emails) |

Save the file with `Ctrl+O`, then `Ctrl+X`.

---

## Step 4 — Set Up the Database

1. Log in to your Supabase project at https://supabase.com
2. Go to **SQL Editor**
3. Open the file `supabase-setup.sql` (included in the delivery package)
4. Paste the entire contents into the SQL Editor and click **Run**
5. Verify the tables were created: go to **Table Editor** and confirm you see `site_config`, `tag_admins`, `enquiries`, `tco_submissions`, etc.

---

## Step 5 — Configure Nginx

```bash
# Update the nginx.conf with your actual deployment path
# Open the nginx.conf file
nano /home/ubuntu/sites/tag/nginx.conf

# Find all occurrences of /home/ubuntu/sites/tag and confirm they match
# your actual path. If you used a different directory, update them.

# Copy to Nginx sites-available
sudo cp /home/ubuntu/sites/tag/nginx.conf /etc/nginx/sites-available/transportactiongroup.co.za

# Enable the site
sudo ln -s /etc/nginx/sites-available/transportactiongroup.co.za \
           /etc/nginx/sites-enabled/

# Remove the default Nginx site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test the configuration
sudo nginx -t
# You should see: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 6 — Get SSL Certificate

```bash
sudo certbot --nginx -d transportactiongroup.co.za -d www.transportactiongroup.co.za
```

Follow the prompts. Certbot will automatically update your nginx.conf with the SSL certificate paths and reload Nginx.

---

## Step 7 — Start the Application

```bash
cd /home/ubuntu/sites/tag

# Start with PM2
pm2 start pm2.config.js

# Save PM2 process list so it restarts on server reboot
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs (it will look like: sudo env PATH=... pm2 startup ...)
```

---

## Step 8 — Verify the Site is Working

```bash
# Check the app is running
pm2 status
# Should show: tag-app | online

# Check it responds
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002
# Should return: 200

# Check Nginx is serving correctly
curl -s -o /dev/null -w "%{http_code}" https://transportactiongroup.co.za
# Should return: 200
```

Open `https://transportactiongroup.co.za` in your browser. The site should load with full styling (green theme, navigation, hero section).

---

## Step 9 — Test the Admin Login

1. Go to `https://transportactiongroup.co.za/admin/login`
2. Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in `.env.local`
3. You should land on the admin dashboard

---

## Roles on TAG

TAG has one authenticated role:

| Role | Login URL | Credentials |
| :--- | :--- | :--- |
| **Public visitor** | N/A — no login required | Browse all public pages freely |
| **Admin** | `/admin/login` | Set via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` |

---

## Troubleshooting

**Site loads but has no styling (no CSS, no colours)**
The Nginx static assets block is not working. Check:
1. The `location /_next/static/` block exists in your nginx.conf
2. The `alias` path in that block matches the actual location of your `.next/static/` folder
3. Run `sudo nginx -t` to check for config errors
4. Run `sudo systemctl reload nginx`

**502 Bad Gateway**
The Node.js app is not running. Run `pm2 status` and `pm2 logs tag-app` to diagnose.

**Admin login fails**
Double-check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`. Restart the app after any `.env.local` change: `pm2 restart tag-app`.

**Contact form or TCO submission not sending emails**
Check `RESEND_API_KEY` is set correctly in `.env.local`.
