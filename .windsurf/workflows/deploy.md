---
description: Pull latest changes from GitHub and deploy TAG, GFA, and BetterDriver apps to the production server.
---

This workflow deploys TAG, GFA, and BetterDriver to the Hetzner production server at `157.180.78.209`.

### Prerequisites
- SSH access to `157.180.78.209` with identity file `$env:USERPROFILE\.ssh\hetzner_deploy`.
- Git repos on server at `/home/ubuntu/sites/{tag,gfa,bd}` pointed at Abdool11 GitHub repos.
- **Important:** Server has only 3.7GB RAM. Next.js builds OOM-kill on the server. **All three apps must be built locally and uploaded.**

### Usage
Trigger with "deploy the apps" or `/deploy`.

### Deployment Order
**BD → GFA → TAG** (GFA depends on BD API; TAG depends on GFA pricing API)

### Steps

1. **Ask the user which app to deploy** (Options: TAG, GFA, BD, or All). Default to "all".

2. **Pre-deploy SQL migrations (Supabase):**
   - Connect to Supabase MCP and run `ALL_MIGRATIONS_RUN_ONCE.sql` if new tables/buckets are needed.
   - Key tables: `certificate_templates`, `surveys`, `survey_questions`, `survey_responses`, `settings`
   - Key bucket: `certificate-templates` (public)

// turbo
3. **Pull latest on server:**
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209 "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v20.19.2/bin; cd /home/ubuntu/sites/bd && git fetch --depth=1 origin main && git reset --hard origin/main && cd /home/ubuntu/sites/gfa && git fetch --depth=1 origin main && git reset --hard origin/main && cd /home/ubuntu/sites/tag && git fetch --depth=1 origin main && git reset --hard origin/main"
   ```

4. **Build locally and upload (all apps):**

   For each app, on your local machine:
   ```powershell
   # 1. Package source from server
   ssh -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209 "tar -czf /tmp/bd-source.tar.gz -C /home/ubuntu/sites/bd --exclude='node_modules' --exclude='.next' ."
   scp -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209:/tmp/bd-source.tar.gz C:\Temp\bd-source.tar.gz

   # 2. Extract locally, install deps, build
   New-Item -ItemType Directory -Path "C:\Temp\bd-build" -Force
   tar -xzf C:\Temp\bd-source.tar.gz -C C:\Temp\bd-build
   cd C:\Temp\bd-build
   npm install
   npx next build

   # 3. Package build artifacts and upload
   tar -czf C:\Temp\bd-deploy.tar.gz .next/standalone .next/static public
   scp -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no C:\Temp\bd-deploy.tar.gz root@157.180.78.209:/tmp/bd-deploy.tar.gz

   # 4. Extract on server
   ssh -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209 "cd /home/ubuntu/sites/bd && rm -rf .next/standalone .next/static public && tar -xzf /tmp/bd-deploy.tar.gz && cp .env.local .next/standalone/.env.local && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public"
   ```
   Repeat for `gfa` and `tag`.

// turbo
5. **Restart PM2 processes:**
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209 "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v20.19.2/bin; pm2 restart all && pm2 save"
   ```

   **Important:** BD must run in **fork mode** (not cluster) so the `PORT` env var from `.env.local` is respected. If BD is in cluster mode, switch:
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209 "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v20.19.2/bin; pm2 delete bd; PORT=3004 NODE_ENV=production HOSTNAME=0.0.0.0 pm2 start /home/ubuntu/sites/bd/.next/standalone/server.js --name bd --cwd /home/ubuntu/sites/bd && pm2 save"
   ```

// turbo
6. **Verify live status:**
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209 "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v20.19.2/bin; pm2 status"
   ```

   Check individual endpoints:
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\hetzner_deploy -o StrictHostKeyChecking=no root@157.180.78.209 "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v20.19.2/bin; echo BD; curl -s -o /dev/null -m 5 -w '%{http_code}' http://localhost:3004; echo; curl -s -o /dev/null -m 5 -w '%{http_code}' http://localhost:3004/registry; echo; echo GFA; curl -s -o /dev/null -m 5 -w '%{http_code}' http://localhost:3003; echo; curl -s -o /dev/null -m 5 -w '%{http_code}' http://localhost:3003/registry; echo; echo TAG; curl -s -o /dev/null -m 5 -w '%{http_code}' http://localhost:3002; echo; curl -s -o /dev/null -m 10 -w '%{http_code}' http://localhost:3002/tco-calculator; echo"
   ```

### Server Details
- **BD:** port 3004 → betterdriver.co.za
- **GFA:** port 3003 → greenfreightacademy.co.za
- **TAG:** port 3002 → transportactiongroup.co.za
- **PM2 processes:** tag (cluster), gfa (cluster), bd (fork)
- **4GB swap** added at `/swapfile` (persistent via fstab)

### Critical Environment Variables
- GFA `.env.local`: `NEXT_PUBLIC_BD_API_BASE_URL=https://betterdriver.co.za`
- TAG `.env.local`: `GFA_PRICING_API_URL=https://www.greenfreightacademy.co.za/api/pricing`
- TAG PM2 env: `GFA_PRICING_API_URL` must be set (restart with `--update-env` if changed)
