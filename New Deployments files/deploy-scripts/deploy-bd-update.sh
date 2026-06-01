#!/bin/bash
# ============================================================
#  BetterDriver (BD) — Update Deployment Script
#  Run this script on the server to pull and apply the latest
#  changes from GitHub main branch.
#
#  Usage:
#    chmod +x deploy-bd-update.sh
#    ./deploy-bd-update.sh
#
#  What this script does:
#    1. Pulls latest code from GitHub main
#    2. Installs any new npm packages (including pdf-lib)
#    3. Runs the Next.js production build
#    4. Copies the new build into the live site directory
#    5. Applies any new database migrations (prompts for confirmation)
#    6. Restarts the PM2 process
#    7. Verifies the site is responding
#
#  Prerequisites:
#    - Node.js 20 LTS installed
#    - PM2 installed globally (npm install -g pm2)
#    - Git configured with access to the repo
#    - .env.local already configured at /home/ubuntu/sites/bd/.env.local
# ============================================================
set -e

# ── Configuration ─────────────────────────────────────────
REPO_DIR="/home/ubuntu/bd-v2-clean"
SITE_DIR="/home/ubuntu/sites/bd"
APP_NAME="bd-site"
PORT=3004
DOMAIN="betterdriver.co.za"
LOG_DIR="/var/log/pm2"

# ── Colours ───────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=============================================="
echo "  BetterDriver — Update Deployment"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "==============================================${NC}"
echo ""

# ── Step 1: Pull latest code ──────────────────────────────
echo -e "${YELLOW}[1/7] Pulling latest code from GitHub...${NC}"
cd "$REPO_DIR"
git fetch origin
git checkout main
git pull origin main
echo -e "${GREEN}✓ Code updated to: $(git log --oneline -1)${NC}"
echo ""

# ── Step 2: Install dependencies ─────────────────────────
echo -e "${YELLOW}[2/7] Installing dependencies (including pdf-lib)...${NC}"
npm install --production=false
echo -e "${GREEN}✓ Dependencies installed.${NC}"
echo ""

# ── Step 3: Build ─────────────────────────────────────────
echo -e "${YELLOW}[3/7] Building Next.js production bundle...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete.${NC}"
echo ""

# ── Step 4: Deploy to site directory ─────────────────────
echo -e "${YELLOW}[4/7] Copying build to site directory...${NC}"
mkdir -p "$SITE_DIR"

# Copy standalone server
cp -r .next/standalone/. "$SITE_DIR/"

# Copy static assets (CRITICAL — without this, CSS/JS will not load)
mkdir -p "$SITE_DIR/.next/static"
cp -r .next/static/. "$SITE_DIR/.next/static/"

# Copy public assets (certificate template background, images, etc.)
cp -r public/. "$SITE_DIR/public/"

# Preserve existing .env.local (do NOT overwrite)
if [ -f "$SITE_DIR/.env.local" ]; then
  echo -e "${GREEN}✓ Existing .env.local preserved.${NC}"
else
  echo -e "${YELLOW}⚠ No .env.local found at $SITE_DIR — copying example file.${NC}"
  cp .env.local.example "$SITE_DIR/.env.local"
  echo -e "${RED}  ACTION REQUIRED: Edit $SITE_DIR/.env.local and fill in all values before proceeding.${NC}"
  echo -e "${RED}  Run: nano $SITE_DIR/.env.local${NC}"
  read -p "  Press ENTER once you have filled in the env file, or Ctrl+C to abort..."
fi

# Copy PM2 config
cp pm2.config.js "$SITE_DIR/pm2.config.js"
echo -e "${GREEN}✓ Build deployed to $SITE_DIR.${NC}"
echo ""

# ── Step 5: Database migrations ──────────────────────────
echo -e "${YELLOW}[5/7] Database migrations...${NC}"
echo ""
echo "  This build adds the following new tables:"
echo "    • surveys            — pre/post survey definitions"
echo "    • survey_questions   — individual survey questions (bilingual)"
echo "    • survey_responses   — driver survey answers"
echo "    • certificate_templates — uploadable certificate backgrounds"
echo ""
echo "  The full migration script is at:"
echo "    $REPO_DIR/ALL_MIGRATIONS_RUN_ONCE.sql"
echo ""
echo -e "${YELLOW}  ACTION REQUIRED:${NC}"
echo "  1. Open Supabase → your project → SQL Editor"
echo "  2. Click 'New Query'"
echo "  3. Paste the contents of ALL_MIGRATIONS_RUN_ONCE.sql"
echo "  4. Click Run"
echo ""
read -p "  Press ENTER once migrations have been run (or Ctrl+C to abort)..."
echo -e "${GREEN}✓ Migrations confirmed.${NC}"
echo ""

# ── Step 6: Restart PM2 ───────────────────────────────────
echo -e "${YELLOW}[6/7] Restarting PM2 process...${NC}"
mkdir -p "$LOG_DIR"
cd "$SITE_DIR"

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME"
  echo -e "${GREEN}✓ PM2 process '$APP_NAME' restarted.${NC}"
else
  pm2 start pm2.config.js
  pm2 save
  echo -e "${GREEN}✓ PM2 process '$APP_NAME' started.${NC}"
fi
echo ""

# ── Step 7: Verify ────────────────────────────────────────
echo -e "${YELLOW}[7/7] Verifying site is responding...${NC}"
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
  echo -e "${GREEN}✓ Site is responding (HTTP $HTTP_CODE).${NC}"
else
  echo -e "${RED}✗ Site returned HTTP $HTTP_CODE — check logs below:${NC}"
  pm2 logs "$APP_NAME" --lines 20 --nostream
  echo ""
  echo -e "${RED}Deployment may have issues. Check: pm2 logs $APP_NAME${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}=============================================="
echo "  BetterDriver deployment complete!"
echo ""
echo "  Local:  http://localhost:$PORT"
echo "  Public: https://$DOMAIN"
echo ""
echo "  New features in this build:"
echo "    ✓ Password visibility toggle on login"
echo "    ✓ Driver logout route wired"
echo "    ✓ Certificate auto-generation (pdf-lib)"
echo "    ✓ Live driver registry + verify endpoint"
echo "    ✓ Public certificate verification page (/verify/[certNumber])"
echo ""
echo "  Useful commands:"
echo "    pm2 status                  — check all processes"
echo "    pm2 logs $APP_NAME          — view live logs"
echo "    pm2 restart $APP_NAME       — restart the server"
echo -e "==============================================${NC}"
echo ""
