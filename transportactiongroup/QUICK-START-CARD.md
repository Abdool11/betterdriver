# TAG Quick-Start Deployment Card
## transportactiongroup.co.za — V2.0

---

## Prerequisites (one-time server setup)

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 process manager
sudo npm install -g pm2

# nginx
sudo apt-get install -y nginx

# certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## Step 1 — Upload and unpack

```bash
# On your local machine, upload the ZIP to the server
scp TAG-transportactiongroup-v2.tar.gz ubuntu@YOUR_SERVER_IP:~

# On the server
cd ~
tar -xzf TAG-transportactiongroup-v2.tar.gz
cd tag-v2
```

---

## Step 2 — Configure environment

```bash
cp .env.local.example .env.local
nano .env.local
# Fill in all values (Supabase URL, anon key, service role key, JWT secret, Resend key)
# Save and exit: Ctrl+X → Y → Enter
```

---

## Step 3 — Set up Supabase database

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Click **New Query**
3. Paste the entire contents of `supabase-setup.sql`
4. Click **Run**

---

## Step 4 — Create the first admin user

In Supabase SQL Editor, run:

```sql
-- First, generate a bcrypt hash of your password on the command line:
-- node -e "const b=require('bcryptjs');b.hash('YourPassword123',10).then(h=>console.log(h))"
-- Then paste the hash below:

INSERT INTO tag_admins (email, password_hash)
VALUES ('admin@transportactiongroup.co.za', '$2a$10$PASTE_YOUR_BCRYPT_HASH_HERE');
```

---

## Step 5 — Deploy the site

```bash
# Make deploy script executable (first time only)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

---

## Step 6 — Configure nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/transportactiongroup.co.za
sudo ln -s /etc/nginx/sites-available/transportactiongroup.co.za \
           /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Get SSL certificate (point DNS to this server first)
sudo certbot --nginx -d transportactiongroup.co.za -d www.transportactiongroup.co.za

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 7 — Verify

| Check | Expected |
|---|---|
| https://transportactiongroup.co.za | Homepage loads |
| https://transportactiongroup.co.za/tco-calculator | TCO Calculator with currency selector |
| https://transportactiongroup.co.za/admin/login | Admin login page |
| Login with admin credentials | Admin dashboard with 10 cards |
| Admin → TCO Submissions | Submissions table page |

---

## Useful commands

```bash
pm2 status              # Check all processes
pm2 logs tag --lines 50 # View recent logs
pm2 restart tag         # Restart the site
pm2 stop tag            # Stop the site
sudo systemctl status nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

**Port:** 3002 | **Process name:** `tag` | **Site directory:** `/home/ubuntu/sites/tag`
