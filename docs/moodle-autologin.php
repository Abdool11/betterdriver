<?php
/**
 * BetterDriver Moodle Auto-Login  (v2 — simpler, no extra requires)
 * =================================================================
 * WHAT THIS DOES:
 *   1. BetterDriver sends a signed token + redirect URL to this script
 *   2. This script checks the signature, logs the user into Moodle
 *   3. Redirects the browser to the video/quiz inside Moodle
 *
 * STEPS TO SET UP:
 *   1. SSH into your Moodle server
 *   2. Run: mkdir -p /var/www/html/local/betterdriver
 *   3. Copy this file to: /var/www/html/local/betterdriver/autologin.php
 *   4. Edit line 24 below — set $SHARED_SECRET to a random string (min 32 chars)
 *   5. Set the SAME secret in BetterDriver's .env.local as MOODLE_AUTOLOGIN_SECRET
 *   6. In Moodle admin: Site Admin → Security → HTTP security → Allow frame embedding → ON
 *   7. Done.
 *
 * HOW TO GENERATE A SECRET:
 *   Run on your server:  openssl rand -hex 32
 *   Or just make up a long random password (min 32 characters)
 */

require_once('../../config.php');

// === STEP 4 — SET THIS ===
$SHARED_SECRET = 'YOUR_RANDOM_SECRET_HERE_MIN_32_CHARS_LONG';

// Get the token and redirect from the URL
$token    = required_param('token',    PARAM_RAW);
$redirect = required_param('redirect', PARAM_URL);

// Verify the JWT using Moodle's built-in helper
try {
    $payload = \core\jwt::decode($token, $SHARED_SECRET, 'HS256');
} catch (Exception $e) {
    http_response_code(403);
    echo 'Link expired or invalid. Please go back to BetterDriver and try again.';
    exit;
}

$moodleUserId = isset($payload->uid) ? intval($payload->uid) : 0;
if (!$moodleUserId) {
    http_response_code(400);
    echo 'Missing user ID.';
    exit;
}

// Find the user in Moodle
$user = $DB->get_record('user', ['id' => $moodleUserId, 'deleted' => 0, 'suspended' => 0]);
if (!$user) {
    http_response_code(404);
    echo 'User not found.';
    exit;
}

// Log them in
complete_user_login($user);

// Redirect to the video/quiz
redirect($redirect);
