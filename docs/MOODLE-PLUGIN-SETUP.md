# Moodle Auto-Login Plugin Setup (No SSH Required)

## What this does
Enables seamless iframe embedding of Moodle content inside BetterDriver. When a driver clicks a module, they see the video/quiz immediately — no separate Moodle login.

## Prerequisites
- You must be a **Moodle site admin** on `https://learning.transportactiongroup.com/`
- You must be able to upload files in the Moodle admin panel

## Step-by-step Setup

### Step 1: ZIP the plugin files
1. Go to `docs/moodle-plugin/` in this repo
2. You'll see a folder called `betterdriver`
3. Right-click it → **Send to → Compressed (zipped) folder** (Windows) or use any ZIP tool
4. You should now have `betterdriver.zip`

### Step 2: Upload the plugin in Moodle
1. Log into Moodle as an admin: `https://learning.transportactiongroup.com/`
2. Go to **Site Admin → Plugins → Install plugins**
3. Click **Choose a file** and select `betterdriver.zip`
4. Plugin type should auto-detect as `Local plugin`
5. Click **Install plugin from the ZIP file**
6. Moodle will validate it — click **Continue** and **Upgrade Moodle database now**
7. Done. The plugin is installed at `/local/betterdriver/autologin.php`

### Step 3: Generate a shared secret
You need the SAME random string in two places.

Run this command on your computer (or any online UUID generator):
```bash
openssl rand -hex 32
```

Copy the output. It will look like:
```
a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

### Step 4: Set the secret in the Moodle plugin
1. In Moodle, go to **Site Admin → Plugins → Local plugins**
2. Find **BetterDriver Auto-Login**
3. Open `autologin.php` and replace:
   ```php
   $SHARED_SECRET = 'YOUR_RANDOM_SECRET_HERE_MIN_32_CHARACTERS';
   ```
   with your actual secret from Step 3.

*(Note: If you don't have a file editor in Moodle, you can use the tinyMCE editor or the Site Admin → Server → System paths workaround. Alternatively, ask someone with server access to edit this one line in `/local/betterdriver/autologin.php`.)*

### Step 5: Set the same secret in BetterDriver
On your BetterDriver server, in `.env.local`, add:
```
MOODLE_AUTOLOGIN_SECRET=a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

Restart the BetterDriver app.

### Step 6: Allow iframe embedding
1. In Moodle admin: **Site Admin → Security → HTTP security**
2. Find **Allow frame embedding**
3. Check the box → **Save changes**

### Done!
Drivers who click a module in BetterDriver will now see Moodle content directly in the iframe without logging in separately.

---

## Troubleshooting

**"Link expired or invalid" in iframe**
→ Check that both secrets (Moodle plugin + BetterDriver `.env.local`) are identical.

**"User not found"**
→ The driver's `moodle_user_id` in Supabase doesn't match a Moodle user. Visit the dashboard first — it auto-provisions the Moodle account.

**Iframe shows blank / refuses to connect**
→ Make sure `Allow frame embedding` is ON in Moodle security settings.

**Plugin upload fails with "validation failed"**
→ Make sure the ZIP contains a folder named `betterdriver` with `version.php` and `autologin.php` directly inside it.
