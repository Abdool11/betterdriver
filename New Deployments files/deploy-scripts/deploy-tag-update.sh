#!/bin/bash
# ============================================================
#  Transport Action Group (TAG) — Update Deployment Script
#  Run this script on the server to pull and apply the latest
#  changes from GitHub main branch.
#
#  Usage:
#    chmod +x deploy-tag-update.sh
#    ./deploy-tag-update.sh
#
#  What this script does:
#    1. Pulls latest code from GitHub main
#    2. Installs any new npm packages
#    3. Runs the Next.js production build
#    4. Copies the new build into the live site directory
#    5. Checks for the new GFA_PRICING_API_URL env var
#    6. Restarts the PM2 process
#    7. Verifies the site is responding and the TCO page loads
#
#  Prerequisites:
#    - Node.js 20 LTS installed
#    - PM2 installed globally (npm install -g pm2)
#    - Git configured with access to the repo
#    - .env.local already configured at /home/ubuntu/sites/tag/.env.local
# ============================================================
set -e

# ── Configuration ─────────────────────────────────────────
REPO_DIR="/home/ubuntu/tag-v2-clean"
SITE_DIR="/home/ubuntu/sites/tag"
APP_NAME="tag"
PORT=3002
DOMAIN="transportactiongroup.co.za"
LOG_DIR="/var/log/pm2"

# ── Colours ───────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=============================================="
echo "  Transport Action Group — Update Deployment"
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
echo -e "${YELLOW}[2/7] Installing dependencies...${NC}"
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

cp pm2.config.js "$SITE_DIR/pm2.config.js" 2>/dev/null || true
echo -e "${GREEN}✓ Build deployed to $SITE_DIR.${NC}"
echo ""

# ── Step 5: Check new env var ─────────────────────────────
echo -e "${YELLOW}[5/7] Checking new environment variable...${NC}"
ENV_FILE="$SITE_DIR/.env.local"

if grep -q "GFA_PRICING_API_URL" "$ENV_FILE" 2>/dev/null; then
  CURRENT_VAL=$(grep "GFA_PRICING_API_URL" "$ENV_FILE" | cut -d'=' -f2)
  echo -e "${GREEN}✓ GFA_PRICING_API_URL is set: $CURRENT_VAL${NC}"
else
  echo -e "${RED}✗ GFA_PRICING_API_URL is MISSING from .env.local${NC}"
  echo ""
  echo "  This variable enables the Academy page to show live course prices"
  echo "  from the GFA admin panel. Without it, hardcoded fallback prices are used."
  echo ""
  echo "  Add this line to $ENV_FILE:"
  echo "    GFA_PRICING_API_URL=https://greenfreightacademy.co.za/api/pricing"
  echo ""
  read -p "  Press ENTER once you have added it, or press S to skip (use fallback prices): " SKIP_ENV
  if [[ "$SKIP_ENV" != "s" && "$SKIP_ENV" != "S" ]]; then
    if grep -q "GFA_PRICING_API_URL" "$ENV_FILE"; then
      echo -e "${GREEN}✓ GFA_PRICING_API_URL confirmed.${NC}"
    else
      echo -e "${YELLOW}Appending default value to .env.local...${NC}"
      echo "" >> "$ENV_FILE"
      echo "# GFA Pricing API — enables live course prices on Academy page" >> "$ENV_FILE"
      echo "GFA_PRICING_API_URL=https://greenfreightacademy.co.za/api/pricing" >> "$ENV_FILE"
      echo -e "${GREEN}✓ Appended to .env.local.${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ Skipped — Academy page will use hardcoded fallback prices.${NC}"
    echo "  Current fallback prices:"
    echo "    • Professional Truck Driver Programme: R75/month"
    echo "    • Eco-Driver Certification: R75/month"
    echo "    • Electric Truck Driver Programme: R1,000 once-off"
  fi
fi

echo ""
echo -e "${YELLOW}  REMINDER: Add the Electric Truck Driver Programme to Supabase:${NC}"
echo "  Run this in Supabase SQL Editor if not already done:"
echo ""
echo "  INSERT INTO courses (name, slug, price_individual, price_corporate, available, description)"
echo "  VALUES ("
echo "    'Electric Truck Driver Programme',"
echo "    'electric-truck-driver',"
echo "    1000, 1000, true,"
echo "    'Once-off certification for drivers transitioning to electric trucks.'"
echo "  ) ON CONFLICT (slug) DO NOTHING;"
echo ""
read -p "  Press ENTER to continue..."
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
echo -e "${YELLOW}[7/7] Verifying site and TCO page...${NC}"
sleep 3

HTTP_HOME=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")
HTTP_TCO=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/tco-calculator" 2>/dev/null || echo "000")
HTTP_ACADEMY=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/academy" 2>/dev/null || echo "000")

if [ "$HTTP_HOME" = "200" ] || [ "$HTTP_HOME" = "307" ]; then
  echo -e "${GREEN}✓ Homepage responding (HTTP $HTTP_HOME).${NC}"
else
  echo -e "${RED}✗ Homepage returned HTTP $HTTP_HOME${NC}"
fi

if [ "$HTTP_TCO" = "200" ]; then
  echo -e "${GREEN}✓ TCO Calculator responding (HTTP $HTTP_TCO).${NC}"
else
  echo -e "${YELLOW}⚠ TCO Calculator returned HTTP $HTTP_TCO${NC}"
fi

if [ "$HTTP_ACADEMY" = "200" ]; then
  echo -e "${GREEN}✓ Academy page responding (HTTP $HTTP_ACADEMY).${NC}"
else
  echo -e "${YELLOW}⚠ Academy page returned HTTP $HTTP_ACADEMY${NC}"
fi

if [ "$HTTP_HOME" != "200" ] && [ "$HTTP_HOME" != "307" ]; then
  echo ""
  echo -e "${RED}Site may have issues. Check logs:${NC}"
  pm2 logs "$APP_NAME" --lines 20 --nostream
  exit 1
fi

echo ""
echo -e "${GREEN}=============================================="
echo "  Transport Action Group deployment complete!"
echo ""
echo "  Local:  http://localhost:$PORT"
echo "  Public: https://$DOMAIN"
echo ""
echo "  New features in this build:"
echo "    ✓ TCO Optimizer — Mixing Desk layout"
echo "    ✓ Dual charts (cumulative cost + annual saving)"
echo "    ✓ Independent Diesel/Electric sliders"
echo "    ✓ Academy page — updated pricing (R75/month)"
echo "    ✓ Electric Truck Driver Programme added (R1,000 once-off)"
echo "    ✓ Live pricing from GFA API (when env var is set)"
echo ""
echo "  Verify manually:"
echo "    • https://$DOMAIN/tco-calculator — mixing desk should show"
echo "    • https://$DOMAIN/academy        — new pricing and 3 courses"
echo ""
echo "  Useful commands:"
echo "    pm2 status                  — check all processes"
echo "    pm2 logs $APP_NAME          — view live logs"
echo "    pm2 restart $APP_NAME       — restart the server"
echo -e "==============================================${NC}"
echo ""
