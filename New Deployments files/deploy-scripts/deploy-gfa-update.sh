#!/bin/bash
# ============================================================
#  Green Freight Academy (GFA) — Update Deployment Script
#  Run this script on the server to pull and apply the latest
#  changes from GitHub main branch.
#
#  Usage:
#    chmod +x deploy-gfa-update.sh
#    ./deploy-gfa-update.sh
#
#  What this script does:
#    1. Pulls latest code from GitHub main
#    2. Installs any new npm packages
#    3. Runs the Next.js production build
#    4. Copies the new build into the live site directory
#    5. Checks for new required environment variables
#    6. Applies any new database migrations (prompts for confirmation)
#    7. Restarts the PM2 process
#    8. Verifies the site is responding
#
#  Prerequisites:
#    - Node.js 20 LTS installed
#    - PM2 installed globally (npm install -g pm2)
#    - Git configured with access to the repo
#    - .env.local already configured at /home/ubuntu/sites/gfa/.env.local
#    - BD must be deployed and running BEFORE GFA (GFA registry calls BD API)
# ============================================================
set -e

# ── Configuration ─────────────────────────────────────────
REPO_DIR="/home/ubuntu/gfa-v2-clean"
SITE_DIR="/home/ubuntu/sites/gfa"
APP_NAME="gfa-site"
PORT=3003
DOMAIN="greenfreightacademy.co.za"
LOG_DIR="/var/log/pm2"

# ── Colours ───────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=============================================="
echo "  Green Freight Academy — Update Deployment"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "==============================================${NC}"
echo ""

# ── Prerequisite check: BD must be running ────────────────
echo -e "${YELLOW}[0/8] Checking BD is running (required for GFA registry)...${NC}"
BD_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3004" 2>/dev/null || echo "000")
if [ "$BD_CHECK" = "000" ]; then
  echo -e "${YELLOW}⚠ BetterDriver (BD) does not appear to be running on port 3004.${NC}"
  echo "  GFA registry will fall back to showing no results until BD is live."
  echo "  Deploy BD first if this is a fresh server setup."
  read -p "  Continue anyway? (y/N): " CONTINUE_ANYWAY
  if [[ "$CONTINUE_ANYWAY" != "y" && "$CONTINUE_ANYWAY" != "Y" ]]; then
    echo "Aborting. Deploy BD first, then re-run this script."
    exit 1
  fi
else
  echo -e "${GREEN}✓ BD is running (HTTP $BD_CHECK).${NC}"
fi
echo ""

# ── Step 1: Pull latest code ──────────────────────────────
echo -e "${YELLOW}[1/8] Pulling latest code from GitHub...${NC}"
cd "$REPO_DIR"
git fetch origin
git checkout main
git pull origin main
echo -e "${GREEN}✓ Code updated to: $(git log --oneline -1)${NC}"
echo ""

# ── Step 2: Install dependencies ─────────────────────────
echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}✓ Dependencies installed.${NC}"
echo ""

# ── Step 3: Build ─────────────────────────────────────────
echo -e "${YELLOW}[3/8] Building Next.js production bundle...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete.${NC}"
echo ""

# ── Step 4: Deploy to site directory ─────────────────────
echo -e "${YELLOW}[4/8] Copying build to site directory...${NC}"
mkdir -p "$SITE_DIR"
cp -r .next/standalone/. "$SITE_DIR/"
mkdir -p "$SITE_DIR/.next/static"
cp -r .next/static/. "$SITE_DIR/.next/static/"
cp -r public/. "$SITE_DIR/public/"

if [ -f "$SITE_DIR/.env.local" ]; then
  echo -e "${GREEN}✓ Existing .env.local preserved.${NC}"
else
  echo -e "${YELLOW}⚠ No .env.local found — copying example file.${NC}"
  cp .env.local.example "$SITE_DIR/.env.local"
  echo -e "${RED}  ACTION REQUIRED: Edit $SITE_DIR/.env.local and fill in all values.${NC}"
  read -p "  Press ENTER once done, or Ctrl+C to abort..."
fi

cp nginx.conf "$SITE_DIR/nginx.conf" 2>/dev/null || true
echo -e "${GREEN}✓ Build deployed to $SITE_DIR.${NC}"
echo ""

# ── Step 5: Check new env var ─────────────────────────────
echo -e "${YELLOW}[5/8] Checking new environment variable...${NC}"
ENV_FILE="$SITE_DIR/.env.local"
if grep -q "NEXT_PUBLIC_BD_API_BASE_URL" "$ENV_FILE" 2>/dev/null; then
  echo -e "${GREEN}✓ NEXT_PUBLIC_BD_API_BASE_URL is already set.${NC}"
else
  echo -e "${RED}✗ NEXT_PUBLIC_BD_API_BASE_URL is MISSING from .env.local${NC}"
  echo ""
  echo "  This variable is required for the GFA registry to look up"
  echo "  driver certificates from the BetterDriver database."
  echo ""
  echo "  Add this line to $ENV_FILE:"
  echo "    NEXT_PUBLIC_BD_API_BASE_URL=https://betterdriver.co.za"
  echo ""
  read -p "  Press ENTER once you have added it (or Ctrl+C to abort)..."
  # Verify it was added
  if grep -q "NEXT_PUBLIC_BD_API_BASE_URL" "$ENV_FILE"; then
    echo -e "${GREEN}✓ NEXT_PUBLIC_BD_API_BASE_URL confirmed.${NC}"
  else
    echo -e "${RED}Variable still missing. Appending default value...${NC}"
    echo "" >> "$ENV_FILE"
    echo "# BetterDriver API — required for registry lookup" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_BD_API_BASE_URL=https://betterdriver.co.za" >> "$ENV_FILE"
    echo -e "${GREEN}✓ Appended to .env.local.${NC}"
  fi
fi
echo ""

# ── Step 6: Database migrations ──────────────────────────
echo -e "${YELLOW}[6/8] Database migrations...${NC}"
echo ""
echo "  This build adds the following new tables (shared Supabase project with BD):"
echo "    • surveys               — pre/post survey definitions"
echo "    • survey_questions      — bilingual question bank"
echo "    • survey_responses      — driver survey answers"
echo "    • certificate_templates — uploadable certificate backgrounds"
echo ""
echo "  NOTE: If you already ran ALL_MIGRATIONS_RUN_ONCE.sql for BD,"
echo "  these tables are already created. The SQL is idempotent (safe to re-run)."
echo ""
echo "  Migration file: $REPO_DIR/ALL_MIGRATIONS_RUN_ONCE.sql"
echo ""
read -p "  Confirm migrations have been run (press ENTER to continue)..."
echo -e "${GREEN}✓ Migrations confirmed.${NC}"
echo ""

# ── Step 7: Restart PM2 ───────────────────────────────────
echo -e "${YELLOW}[7/8] Restarting PM2 process...${NC}"
mkdir -p "$LOG_DIR"
cd "$SITE_DIR"

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME"
  echo -e "${GREEN}✓ PM2 process '$APP_NAME' restarted.${NC}"
else
  # Create pm2 config inline if not present
  cat > pm2.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "gfa-site",
    script: ".next/standalone/server.js",
    cwd: "./",
    env: { NODE_ENV: "production", PORT: 3003, HOSTNAME: "0.0.0.0" },
    max_memory_restart: "512M",
    restart_delay: 3000,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "/var/log/pm2/gfa-error.log",
    out_file: "/var/log/pm2/gfa-out.log",
    autorestart: true
  }]
};
EOF
  pm2 start pm2.config.js
  pm2 save
  echo -e "${GREEN}✓ PM2 process '$APP_NAME' started.${NC}"
fi
echo ""

# ── Step 8: Verify ────────────────────────────────────────
echo -e "${YELLOW}[8/8] Verifying site is responding...${NC}"
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
  echo -e "${GREEN}✓ Site is responding (HTTP $HTTP_CODE).${NC}"
else
  echo -e "${RED}✗ Site returned HTTP $HTTP_CODE — check logs below:${NC}"
  pm2 logs "$APP_NAME" --lines 20 --nostream
  exit 1
fi

echo ""
echo -e "${GREEN}=============================================="
echo "  Green Freight Academy deployment complete!"
echo ""
echo "  Local:  http://localhost:$PORT"
echo "  Public: https://$DOMAIN"
echo ""
echo "  New features in this build:"
echo "    ✓ Password visibility toggle on login"
echo "    ✓ Certificate Template Manager (/admin/certificate-template)"
echo "    ✓ Survey Admin interface (/admin/surveys)"
echo "    ✓ Registry wired to live BD Supabase API"
echo ""
echo "  First-time admin tasks:"
echo "    1. Upload certificate background at /admin/certificate-template"
echo "    2. Set text overlay positions (name, programme, date, cert number)"
echo "    3. Add pre/post survey questions at /admin/surveys"
echo ""
echo "  Useful commands:"
echo "    pm2 status                  — check all processes"
echo "    pm2 logs $APP_NAME          — view live logs"
echo "    pm2 restart $APP_NAME       — restart the server"
echo -e "==============================================${NC}"
echo ""
