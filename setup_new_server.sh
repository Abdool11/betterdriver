#!/bin/bash
# ============================================================
#  TAG Ecosystem — New Server One-Shot Setup Script
#  Run this in the Hetzner Rescue Console as root
#  This script does EVERYTHING: user creation, SSH hardening,
#  firewall, fail2ban, Node.js, PM2, Nginx.
# ============================================================
set -e

# ── CONFIG ────────────────────────────────────────────────
DEPLOY_USER="deploy"
SSH_PUBKEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOgRuKbGp9spTWs8GxGumtBKWgpKW+/HhPk7R8rFn1wA tag-deploy-20260601"
APP_PORTS=(3002 3003 3004)

echo ""
echo "=========================================="
echo "  TAG Server Setup — One-Shot Script"
echo "  $(date)"
echo "=========================================="
echo ""

# ── Step 1: Create deploy user ───────────────────────────
echo "[1/14] Creating deploy user..."
useradd -m -s /bin/bash "$DEPLOY_USER"
usermod -aG sudo "$DEPLOY_USER"
# No password for deploy — key auth only
passwd -l "$DEPLOY_USER" 2>/dev/null || true

# ── Step 2: Add SSH public key ──────────────────────────
echo "[2/14] Adding SSH public key..."
mkdir -p "/home/$DEPLOY_USER/.ssh"
echo "$SSH_PUBKEY" > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 700 "/home/$DEPLOY_USER/.ssh"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

# ── Step 3: Harden SSH ──────────────────────────────────
echo "[3/14] Hardening SSH..."
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'SSHEOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
SSHEOF

systemctl restart sshd

# ── Step 4: Update system ───────────────────────────────
echo "[4/14] Updating system..."
apt update && apt full-upgrade -y

# ── Step 5: Install UFW ─────────────────────────────────
echo "[5/14] Installing UFW firewall..."
apt install ufw -y
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
for port in "${APP_PORTS[@]}"; do
    ufw allow from 127.0.0.1 to any port "$port" comment "App port $port localhost only"
done
ufw --force enable

# ── Step 6: Install fail2ban ────────────────────────────
echo "[6/14] Installing fail2ban..."
apt install fail2ban -y
cat > /etc/fail2ban/jail.local << 'F2BEOF'
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
F2BEOF

systemctl restart fail2ban
systemctl enable fail2ban

# ── Step 7: Auto security updates ───────────────────────
echo "[7/14] Setting up auto security updates..."
apt install unattended-upgrades -y
echo 'unattended-upgrades unattended-upgrades/enable_auto_updates boolean true' | debconf-set-selections
dpkg-reconfigure -plow unattended-upgrades

# ── Step 8: Remove Docker and unnecessary packages ──────
echo "[8/14] Removing Docker and unnecessary packages..."
apt remove --purge -y snapd docker.io docker-doc podman containerd runc 2>/dev/null || true
apt autoremove -y
systemctl disable --now snapd 2>/dev/null || true

# ── Step 9: Install Node.js 20 LTS ──────────────────────
echo "[9/14] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# ── Step 10: Install PM2 and Nginx ───────────────────────
echo "[10/14] Installing PM2 and Nginx..."
npm install -g pm2
apt install -y nginx
systemctl enable nginx

# ── Step 11: Create app directories ─────────────────────
echo "[11/14] Creating app directories..."
mkdir -p /var/www/bd /var/www/gfa /var/www/tag
chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/www

# ── Step 12: Lock root password ─────────────────────────
echo "[12/14] Locking root account..."
passwd -l root

# ── Step 13: Clean up old known hosts and keys ──────────
echo "[13/14] Cleaning up..."
rm -f /root/.ssh/authorized_keys 2>/dev/null || true
# Remove any existing host keys to prevent fingerprint confusion
rm -f /etc/ssh/ssh_host_* 2>/dev/null || true
dpkg-reconfigure openssh-server 2>/dev/null || true

# ── Step 14: Verify everything ──────────────────────────
echo "[14/14] Verifying setup..."
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Firewall status:"
ufw status verbose | grep -E 'Status|22/tcp|80/tcp|443/tcp'
echo ""
echo "fail2ban status:"
fail2ban-client status sshd 2>/dev/null | head -5 || echo "  fail2ban not running"
echo ""
echo "Node.js: $(node -v)"
echo "PM2: $(pm2 -v 2>/dev/null || echo 'installed')"
echo "Nginx: $(nginx -v 2>&1 | head -1)"
echo ""
echo "Listening ports:"
ss -tlnp | grep -E '22|80|443|3002|3003|3004'
echo ""
echo "Running processes (top 15):"
ps aux --sort=-%cpu | head -15
echo ""
echo "=========================================="
echo "  IMPORTANT:"
echo "  Root login is now DISABLED."
echo "  Only the 'deploy' user can log in."
echo "  You MUST use your new SSH key:"
echo "    ssh -i ~/.ssh/hetzner_new deploy@178.105.181.157"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "  1. From your Windows machine, test SSH:"
echo "       ssh -i ~/.ssh/hetzner_new deploy@178.105.181.157"
echo "  2. Upload your built apps to /var/www/{bd,gfa,tag}"
echo "  3. Create .env.local files with chmod 600"
echo "  4. Configure PM2 and Nginx"
echo "  5. Install SSL with certbot"
echo ""
