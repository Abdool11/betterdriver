#!/bin/bash
# ============================================================
#  TAG Ecosystem — Master Deployment Orchestrator
#  Deploys all three sites in the correct order:
#    1. BetterDriver (BD)     — betterdriver.co.za
#    2. Green Freight Academy (GFA) — greenfreightacademy.co.za
#    3. Transport Action Group (TAG) — transportactiongroup.co.za
#
#  Usage:
#    chmod +x deploy-all.sh
#    ./deploy-all.sh
#
#  You can also deploy a single site:
#    ./deploy-all.sh bd
#    ./deploy-all.sh gfa
#    ./deploy-all.sh tag
#
#  IMPORTANT: BD must be deployed before GFA.
#  GFA and TAG can be deployed in any order after BD.
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ── Banner ────────────────────────────────────────────────
echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║   TAG Ecosystem — Master Deployment Script   ║${NC}"
echo -e "${BLUE}${BOLD}║   $(date '+%Y-%m-%d %H:%M:%S')                    ║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Argument handling ─────────────────────────────────────
TARGET="${1:-all}"

deploy_bd() {
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  SITE 1 OF 3: BetterDriver (BD)${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  bash "$SCRIPT_DIR/deploy-bd-update.sh"
  echo -e "${GREEN}${BOLD}✓ BD deployment complete.${NC}"
  echo ""
}

deploy_gfa() {
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  SITE 2 OF 3: Green Freight Academy (GFA)${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  bash "$SCRIPT_DIR/deploy-gfa-update.sh"
  echo -e "${GREEN}${BOLD}✓ GFA deployment complete.${NC}"
  echo ""
}

deploy_tag() {
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  SITE 3 OF 3: Transport Action Group (TAG)${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  bash "$SCRIPT_DIR/deploy-tag-update.sh"
  echo -e "${GREEN}${BOLD}✓ TAG deployment complete.${NC}"
  echo ""
}

# ── Run deployments ───────────────────────────────────────
case "$TARGET" in
  bd)
    deploy_bd
    ;;
  gfa)
    deploy_gfa
    ;;
  tag)
    deploy_tag
    ;;
  all)
    deploy_bd
    deploy_gfa
    deploy_tag
    ;;
  *)
    echo -e "${RED}Unknown target: $TARGET${NC}"
    echo "Usage: $0 [all|bd|gfa|tag]"
    exit 1
    ;;
esac

# ── Final status check ────────────────────────────────────
if [ "$TARGET" = "all" ]; then
  echo ""
  echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}${BOLD}║   All Deployments Complete — Status Check    ║${NC}"
  echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""

  check_site() {
    local NAME=$1
    local PORT=$2
    local DOMAIN=$3
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")
    if [ "$HTTP" = "200" ] || [ "$HTTP" = "307" ] || [ "$HTTP" = "308" ]; then
      echo -e "  ${GREEN}✓ $NAME${NC} — http://localhost:$PORT → https://$DOMAIN (HTTP $HTTP)"
    else
      echo -e "  ${RED}✗ $NAME${NC} — http://localhost:$PORT returned HTTP $HTTP"
    fi
  }

  check_site "BD  (BetterDriver)"          3004 "betterdriver.co.za"
  check_site "GFA (Green Freight Academy)" 3003 "greenfreightacademy.co.za"
  check_site "TAG (Transport Action Group)" 3002 "transportactiongroup.co.za"

  echo ""
  echo "  PM2 process summary:"
  pm2 list 2>/dev/null || echo "  (pm2 not available in this shell — run 'pm2 status' manually)"

  echo ""
  echo -e "${GREEN}${BOLD}  All three sites are live.${NC}"
  echo ""
  echo "  Post-deployment checklist:"
  echo "    □ Run ALL_MIGRATIONS_RUN_ONCE.sql in Supabase (if not already done)"
  echo "    □ Upload certificate template at https://greenfreightacademy.co.za/admin/certificate-template"
  echo "    □ Add survey questions at https://greenfreightacademy.co.za/admin/surveys"
  echo "    □ Add Electric Truck Driver Programme in Supabase courses table"
  echo "    □ Submit WhatsApp templates to Meta (see 16-WHATSAPP-TEMPLATE-SPEC.md)"
  echo "    □ Change default admin passwords on all three sites"
  echo ""
fi
