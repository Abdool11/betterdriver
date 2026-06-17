<?php
/**
 * BetterDriver Moodle Auto-Login  (v3 — pure PHP, no external libs)
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
 *   4. Edit line 28 below — set $SHARED_SECRET to a random string (min 32 chars)
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

// ─── Pure-PHP JWT helpers (no external libraries needed) ──────────────────────

function bd_base64url_decode(string $data): string {
    $pad = 4 - (strlen($data) % 4);
    if ($pad !== 4) {
        $data .= str_repeat('=', $pad);
    }
    return base64_decode(strtr($data, '-_', '+/'), true);
}

function bd_decode_jwt(string $token, string $secret, string $expectedAlg = 'HS256'): object {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new Exception('Invalid JWT format');
    }

    $headerJson = bd_base64url_decode($parts[0]);
    $payloadJson = bd_base64url_decode($parts[1]);
    $signature = bd_base64url_decode($parts[2]);

    if ($headerJson === false || $payloadJson === false || $signature === false) {
        throw new Exception('Invalid JWT encoding');
    }

    $header = json_decode($headerJson);
    if (!isset($header->alg) || $header->alg !== $expectedAlg) {
        throw new Exception('Unexpected algorithm');
    }

    $computed = hash_hmac('sha256', $parts[0] . '.' . $parts[1], $secret, true);
    if (!hash_equals($computed, $signature)) {
        throw new Exception('Invalid signature');
    }

    $payload = json_decode($payloadJson);
    if (isset($payload->exp) && time() > $payload->exp) {
        throw new Exception('Token expired');
    }

    return $payload;
}

// ─── Main script ──────────────────────────────────────────────────────────────

$token    = required_param('token',    PARAM_RAW);
$redirect = required_param('redirect', PARAM_URL);

try {
    $payload = bd_decode_jwt($token, $SHARED_SECRET, 'HS256');
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
