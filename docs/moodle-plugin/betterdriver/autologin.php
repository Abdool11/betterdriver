<?php
/**
 * BetterDriver Auto-Login Endpoint
 * ================================
 * This file receives a signed JWT from BetterDriver, verifies it, logs the
 * user into Moodle, and redirects them to the requested course activity.
 *
 * CONFIGURATION:
 *   Set the secret in Moodle admin: Site Admin → Plugins → Local plugins →
 *   BetterDriver Auto-Login. Paste the same value you use for
 *   MOODLE_AUTOLOGIN_SECRET in your BetterDriver .env.local file.
 *
 * SECURITY:
 *   - JWT expires in 5 minutes
 *   - Signed with HMAC-SHA256 using the shared secret
 *   - No passwords are ever transmitted
 */

require_once('../../config.php');

$SHARED_SECRET = get_config('local_betterdriver', 'secret');

if (empty($SHARED_SECRET)) {
    http_response_code(500);
    echo 'BetterDriver auto-login is not configured. Please set the secret in Site Admin → Plugins → Local plugins → BetterDriver Auto-Login.';
    exit;
}

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

$user = $DB->get_record('user', ['id' => $moodleUserId, 'deleted' => 0, 'suspended' => 0]);
if (!$user) {
    http_response_code(404);
    echo 'User not found.';
    exit;
}

complete_user_login($user);
redirect($redirect);
