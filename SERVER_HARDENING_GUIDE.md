# Server Rebuild & Hardening Guide — TAG Ecosystem

**Goal:** Rebuild the 3-app server without getting reinfected.

**The #1 rule: Never reuse anything from the old server.**

---

## Phase 1: Burn Everything on Your Windows Machine

The attacker may have your SSH keys. Do this on your local Windows machine first.

### Step 1.1 — Scan Your Windows Machine
1. Run **Windows Defender Full Scan**
2. Download and run **Malwarebytes Free** (https://www.malwarebytes.com/) — do a Threat Scan
3. Check your `Downloads` and `Temp` folders for suspicious `.exe` files

### Step 1.2 — Delete the Compromised SSH Key
Open PowerShell as Administrator and run:

```powershell
# Delete the old key pair
Remove-Item "$env:USERPROFILE\.ssh\hetzner_deploy" -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.ssh\hetzner_deploy.pub" -ErrorAction SilentlyContinue

# Verify it's gone
ls "$env:USERPROFILE\.ssh\"
```

You should only see: `config`, `id_ed25519`, `id_ed25519.pub`, `known_hosts`

### Step 1.3 — Generate a NEW SSH Key (with passphrase)

```powershell
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\hetzner_new" -C "tag-deploy-$(Get-Date -Format 'yyyyMMdd')"
```

- When prompted for a passphrase, **enter a strong one** (at least 12 characters). This is critical.
- This creates `hetzner_new` (private) and `hetzner_new.pub` (public)

### Step 1.4 — Rotate All Credentials

| Account | Action |
|---|---|
| **Hetzner** | Change password, enable 2FA in Hetzner Robot |
| **GitHub** | Rotate any deploy tokens or personal access tokens |
| **Supabase** | Go to Project Settings > API and click **Regenerate** on `anon` and `service_role` keys |
| **Domains** | Check your DNS registrar hasn't been tampered with |

---

## Phase 2: Provision a Fresh Hetzner Server

### Step 2.1 — Create New Server in Hetzner Robot
1. Go to https://robot.hetzner.com/server
2. Click **Order** or use an existing server slot
3. Choose **Ubuntu 24.04 LTS** (do NOT use a snapshot or custom image)
4. Select a location (Helsinki or Falkenstein)
5. **Do NOT paste your SSH key in the Hetzner Robot interface yet**
6. After creation, note the new IP address

### Step 2.2 — Initial Login via Hetzner Rescue Console
1. In Hetzner Robot, go to your server and click **Rescue**
2. Activate rescue mode and reboot
3. Use the web console to log in as `root` (password shown in Robot)
4. This is the ONLY time you will log in as root directly

### Step 2.3 — Install Ubuntu with Full Disk Encryption (Optional but Recommended)

Run in the rescue console:

```bash
# Install fresh Ubuntu
installimage
```

- Select `Ubuntu-2404-noble` (not minimal)
- When it asks about partitions, use defaults
- **Do NOT set a root password here** — we will lock root later
- Reboot when done

### Step 2.4 — First Boot — Create a Non-Root User

Once the server reboots into Ubuntu, log in via the Hetzner console using the temporary root password shown in Robot.

```bash
# Create a deploy user
useradd -m -s /bin/bash deploy
usermod -aG sudo deploy

# Set a strong password for deploy
passwd deploy

# Create SSH directory for deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Add your NEW public key
# (You will paste the contents of your hetzner_new.pub here)
nano /home/deploy/.ssh/authorized_keys
```

Paste the contents of `C:\Users\Administrator\.ssh\hetzner_new.pub` into the nano editor, then `Ctrl+X`, `Y`, `Enter`.

```bash
# Fix permissions
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### Step 2.5 — Harden SSH (Critical)

```bash
nano /etc/ssh/sshd_config
```

Make sure these lines exist and are NOT commented out (`#`):

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

Save and restart SSH:

```bash
systemctl restart sshd
```

**Test from your Windows machine** before closing the console:

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_new" deploy@<NEW_SERVER_IP>
```

If this works, you can close the rescue console. If not, fix SSH before closing.

---

## Phase 3: Server Hardening (Run as `deploy` user)

### Step 3.1 — Update Everything

```bash
sudo apt update && sudo apt full-upgrade -y
```

### Step 3.2 — Install and Configure UFW Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Default deny everything
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow only what we need
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

**Expected output:** Only ports 22, 80, 443 should be open.

### Step 3.3 — Install fail2ban (Blocks Brute Force)

```bash
sudo apt install fail2ban -y

# Create a custom jail config
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
EOF

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status sshd
```

### Step 3.4 — Install Unattended Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
# Select YES when prompted
```

### Step 3.5 — Remove Unnecessary Services

```bash
# Check what's running
sudo ss -tlnp

# Remove potential attack surfaces
sudo apt remove --purge -y snapd docker.io docker-doc podman containerd runc
sudo apt autoremove -y

# Disable unnecessary services
sudo systemctl disable --now snapd 2>/dev/null || true
```

**We will NOT install Docker** unless absolutely needed.

### Step 3.6 — Install Node.js (via NodeSource, NOT root)

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should show v20.x.x
npm -v
```

### Step 3.7 — Install PM2 (Globally)

```bash
sudo npm install -g pm2
```

### Step 3.8 — Install Nginx (Reverse Proxy)

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

### Step 3.9 — Disable Root Account

```bash
sudo passwd -l root
```

Root is now locked. You can only log in as `deploy` with your SSH key.

---

## Phase 4: Deploy Your Apps Securely

### Step 4.1 — Create App Directory Structure

```bash
sudo mkdir -p /var/www/bd /var/www/gfa /var/www/tag
sudo chown -R deploy:deploy /var/www
```

### Step 4.2 — Set Up Git Access (Read-Only Deploy Key)

For each repo, go to GitHub Settings > Deploy Keys and add your NEW public key with **read-only** access.

```bash
cd /var/www/bd
git clone --depth 1 https://github.com/Abdool11/betterdriver.git .
# Repeat for gfa and tag
```

### Step 4.3 — Build Apps Locally (On Windows) and Upload

Because the server only has 4GB RAM, build locally and upload the standalone builds.

On your Windows machine, for each app:

```powershell
# 1. Clone locally
git clone --depth 1 https://github.com/Abdool11/betterdriver.git C:\Temp\bd-build
cd C:\Temp\bd-build

# 2. Install deps and build
npm install
npx next build

# 3. Create deploy package
tar -czf C:\Temp\bd-deploy.tar.gz .next/standalone .next/static public

# 4. Upload to server
scp -i "$env:USERPROFILE\.ssh\hetzner_new" -o StrictHostKeyChecking=no C:\Temp\bd-deploy.tar.gz deploy@<NEW_SERVER_IP>:/tmp/
```

On the server:

```bash
cd /var/www/bd
rm -rf .next/standalone .next/static public
tar -xzf /tmp/bd-deploy.tar.gz
```

Repeat for GFA and TAG.

### Step 4.4 — Create .env.local Files

```bash
cd /var/www/bd
nano .env.local
# Paste your Supabase credentials (use the NEW rotated keys!)

chmod 600 .env.local  # Only owner can read
```

### Step 4.5 — Configure PM2 (As `deploy` User, NOT root)

```bash
cd /var/www/bd
pm2 start pm2.config.js
pm2 save
pm2 startup systemd
```

**Important:** Run `pm2 startup` and copy/paste the command it outputs (it uses sudo).

Repeat for GFA and TAG.

### Step 4.6 — Configure Nginx Reverse Proxy

Create a config for each app:

```bash
sudo tee /etc/nginx/sites-available/betterdriver << 'EOF'
server {
    listen 80;
    server_name betterdriver.co.za www.betterdriver.co.za;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/betterdriver /etc/nginx/sites-enabled/
```

Repeat for GFA (port 3003) and TAG (port 3002).

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4.7 — Install SSL Certificates (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d betterdriver.co.za -d www.betterdriver.co.za
sudo certbot --nginx -d greenfreightacademy.co.za -d www.greenfreightacademy.co.za
sudo certbot --nginx -d transportactiongroup.co.za -d www.transportactiongroup.co.za

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

---

## Phase 5: Update Your Domains

In your DNS provider (e.g., Cloudflare, GoDaddy):
1. Change A records for all 3 domains to point to the **NEW server IP**
2. Remove or update the old IP (157.180.78.209) records
3. Wait 5-15 minutes for DNS propagation

---

## Phase 6: Verify and Monitor

### Step 6.1 — Check Everything is Running

```bash
# On the server
pm2 status
sudo systemctl status nginx
sudo ufw status verbose
sudo fail2ban-client status sshd
```

### Step 6.2 — Verify No Suspicious Processes

```bash
# Run this daily for the first week
ps aux --sort=-%cpu | head -20
ss -tlnp
sudo last
```

### Step 6.3 — Set Up Log Monitoring (Optional but Recommended)

```bash
# Install logwatch for daily security reports
sudo apt install logwatch -y
```

---

## Phase 7: Destroy the Old Server

1. In Hetzner Robot, go to the old server (157.180.78.209)
2. Click **Reset** → **Power reset** then **Rescue** → destroy all data
3. Or simply cancel the server
4. **Request Spamhaus delisting** at https://check.spamhaus.org/results/?query=157.180.78.209 once the server is offline

---

## Security Checklist — Before Declaring Done

| # | Check | Status |
|---|---|---|
| 1 | Old SSH keys deleted from Windows | ☐ |
| 2 | New SSH key has a strong passphrase | ☐ |
| 3 | Windows machine scanned for malware | ☐ |
| 4 | Hetzner password changed + 2FA enabled | ☐ |
| 5 | Supabase keys rotated | ☐ |
| 6 | Server is Ubuntu 24.04, fresh install (no snapshot) | ☐ |
| 7 | Only `deploy` user exists, root is locked (`passwd -l`) | ☐ |
| 8 | SSH key-only auth, root login disabled | ☐ |
| 9 | UFW firewall active, only 22/80/443 open | ☐ |
| 10 | fail2ban running and protecting SSH | ☐ |
| 11 | Docker removed/uninstalled | ☐ |
| 12 | No unnecessary services running | ☐ |
| 13 | Apps run as `deploy` user, never root | ☐ |
| 14 | `.env.local` files have `chmod 600` | ☐ |
| 15 | Nginx reverse proxy configured with SSL | ☐ |
| 16 | Domains point to new IP | ☐ |
| 17 | Old server destroyed | ☐ |
| 18 | Spamhaus delisting requested | ☐ |

---

## Ongoing Security Habits

1. **Never SSH as root** — always use `deploy`
2. **Never store SSH keys without passphrases**
3. **Check running processes weekly:** `ps aux --sort=-%cpu | head -20`
4. **Review auth logs:** `sudo grep 'Failed password' /var/log/auth.log | tail -20`
5. **Keep system updated:** `sudo apt update && sudo apt upgrade -y`
6. **Don't open unnecessary ports** — if you need a new service, add it to UFW explicitly
7. **Don't install Docker** unless you absolutely need it and know how to secure it
8. **Use Cloudflare in front of Nginx** — it hides your real IP and blocks DDoS
