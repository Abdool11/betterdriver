#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# TAG — transportactiongroup.co.za
# Deployment script
# Run this script from the site root directory after uploading a new build.
# ─────────────────────────────────────────────────────────────────────────────
set -e

SITE_DIR="/home/ubuntu/sites/tag"
LOG_DIR="/home/ubuntu/logs"

echo "=== TAG Deploy: $(date) ==="

# Create required directories
mkdir -p "$LOG_DIR"
mkdir -p "$SITE_DIR"

# Copy standalone output to site directory
echo "→ Copying standalone build..."
cp -r .next/standalone/. "$SITE_DIR/"

# Copy static assets into standalone (required by Next.js standalone mode)
echo "→ Copying static assets..."
cp -r .next/static "$SITE_DIR/.next/static"
cp -r public "$SITE_DIR/public"

# Copy env file
echo "→ Copying .env.local..."
cp .env.local "$SITE_DIR/.env.local"

# Restart PM2
echo "→ Restarting PM2 process..."
cd "$SITE_DIR"
pm2 restart tag 2>/dev/null || pm2 start pm2.config.js

echo "=== Deploy complete ==="
echo "Check status: pm2 status"
echo "View logs:    pm2 logs tag --lines 50"
