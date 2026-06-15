<?php
// BetterDriver plugin settings page — appears in Site Admin → Plugins → Local plugins → BetterDriver Auto-Login

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_betterdriver', get_string('pluginname', 'local_betterdriver'));

    $settings->add(new admin_setting_configtext(
        'local_betterdriver/secret',
        'Auto-Login Secret',
        'Paste the same secret you set in MOODLE_AUTOLOGIN_SECRET on your BetterDriver server. Generate it with: openssl rand -hex 32',
        '',
        PARAM_RAW,
        64
    ));

    $ADMIN->add('localplugins', $settings);
}
