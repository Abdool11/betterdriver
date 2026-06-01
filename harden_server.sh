#!/bin/bash
# ============================================================
#  TAG Ecosystem — Server Hardening Script
#  Run this ON THE SERVER as the deploy user (after initial setup)
#  This script automates Phase 3 of the hardening guide.
# ============================================================
set -e

NEW_USER="deploy"
APP_PORTS=(3002 3003 3004)  # TAG, GFA, BD

echo "=========================================="
echo "  TAG Server Hardening Script"
echo "  $(date)"
echo "=========================================="
echo ""

# ── Check we're running as deploy ─────────────────────────
if [ "$(whoami)" != "$NEW_USER" ]; then
    echo "ERROR: Run this script as the '$NEW_USER' user, not root."
    echo "   su - $NEW_USER"
    exit 1
fi

# ── Step 1: Update system ──────────────────────────────────
echo "[1/10] Updating system packages..."
sudo apt update && sudo apt full-upgrade -y

# ── Step 2: Install UFW and configure firewall ─────────────
echo "[2/10] Installing and configuring UFW firewall..."
sudo apt install ufw -y

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Also allow app ports (only from localhost/Nginx)
for port in "${APP_PORTS[@]}"; do
    sudo ufw allow from 127.0.0.1 to any port "$port" comment "App port $port (localhost only)"
done

sudo ufw --force enable
sudo ufw status verbose

# ── Step 3: Install fail2ban ─────────────────────────────
echo "[3/10] Installing fail2ban..."
sudo apt install fail2ban -y

sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3
backend = systemd

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
sudo fail2ban-client status sshd

# ── Step 4: Auto security updates ────────────────────────
echo "[4/10] Setting up unattended security updates..."
sudo apt install unattended-upgrades -y
echo 'unattended-upgrades unattended-upgrades/enable_auto_updates boolean true' | sudo debconf-set-selections
sudo dpkg-reconfigure -plow unattended-upgrades

# ── Step 5: Remove Docker and unnecessary packages ───────
echo "[5/10] Removing Docker and unnecessary packages..."
sudo apt remove --purge -y snapd docker.io docker-doc podman containerd runc 2>/dev/null || true
sudo apt autoremove -y
sudo systemctl disable --now snapd 2>/dev/null || true

# ── Step 6: Install Node.js 20 LTS ───────────────────────
echo "[6/10] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

# ── Step 7: Install PM2 and Nginx ────────────────────────
echo "[7/10] Installing PM2 and Nginx..."
sudo npm install -g pm2
sudo apt install nginx -y
sudo systemctl enable nginx

# ── Step 8: Create app directories ──────────────────────
echo "[8/10] Creating app directories..."
sudo mkdir -p /var/www/bd /var/www/gfa /var/www/tag
sudo chown -R "$NEW_USER":"$NEW_USER" /var/www

# ── Step 9: Harden SSH (if running as root, skip this) ─────
echo "[9/10] SSH is already hardened during initial setup."
echo "  Verify with: grep -E 'PermitRootLogin|PasswordAuthentication|AllowUsers' /etc/ssh/sshd_config"

# ── Step 10: Lock root password ─────────────────────────
echo "[10/10] Locking root account..."
sudo passwd -l root

# ── Final status ─────────────────────────────────────────
echo ""
echo "=========================================="
echo "  Hardening Complete!"
echo "=========================================="
echo ""
echo "Status check:"
echo "  Firewall:"
sudo ufw status verbose | grep -E 'Status|22/tcp|80/tcp|443/tcp'
echo ""
echo "  fail2ban:"
sudo fail2ban-client status sshd 2>/dev/null | head -5 || echo "  fail2ban not running"
echo ""
echo "  Node.js: $(node -v)"
echo "  PM2: $(pm2 -v 2>/dev/null || echo 'installed')"
echo "  Nginx: $(nginx -v 2>&1 | head -1)"
echo ""
echo "  Services running:"
sudo ss -tlnp | grep -E '22|80|443|3002|3003|3004'
echo ""
echo "  Running processes (top 15):"
ps aux --sort=-%cpu | head -15
echo ""
echo "NEXT STEPS:"
echo "  1. Upload your built apps to /var/www/{bd,gfa,tag}"
echo "  2. Create .env.local files (chmod 600)"
echo "  3. Configure PM2 and Nginx"
echo "  4. Install SSL certificates with certbot"
echo "  5. Point your domains to this server's IP"
echo ""
