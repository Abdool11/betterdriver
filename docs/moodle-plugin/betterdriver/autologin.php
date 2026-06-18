<?php
/**
 * BetterDriver Auto-Login Endpoint  (v3 — pure PHP, no external libs)
 * ====================================================================
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

    $headerJson  = bd_base64url_decode($parts[0]);
    $payloadJson = bd_base64url_decode($parts[1]);
    $signature   = bd_base64url_decode($parts[2]);

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
$redirect = required_param('redirect', PARAM_RAW);  // PARAM_URL strips query params — use RAW and validate manually

// Basic validation: must start with http(s)://
if (strpos($redirect, 'http://') !== 0 && strpos($redirect, 'https://') !== 0) {
    http_response_code(400);
    echo 'Invalid redirect URL.';
    exit;
}

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

$user = $DB->get_record('user', ['id' => $moodleUserId, 'deleted' => 0, 'suspended' => 0]);
if (!$user) {
    http_response_code(404);
    echo 'User not found.';
    exit;
}

complete_user_login($user);

// Use a raw Location header instead of Moodle's redirect() to make sure the
// query string (e.g. ?id=123) is preserved exactly.
header('Location: ' . $redirect, true, 302);
exit;
