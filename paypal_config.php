<?php
// PayPal Sandbox Configuration
// Populate with your PayPal sandbox app credentials

// PayPal Sandbox Configuration
// Set these environment variables or update the fallback values below

define('PAYPAL_ENV', 'sandbox');
define('PAYPAL_CLIENT_ID', getenv('PAYPAL_CLIENT_ID') ?: 'Abz-V81hQ8C-5sDwq20ZyZ9QNnpWkAopTQZ2BJ_wH84bZsTB1daDE7FAe8b8KMh8hkBMf-dvy4m7Atvo'); // Replace with your complete Client ID
define('PAYPAL_CLIENT_SECRET', getenv('PAYPAL_CLIENT_SECRET') ?: 'EGoIOIaFaaDRou2V2AvYhUwa5AXnPuQiIXRfYft5uTt_sZKcW530Sr2GP5dsLTKMvJD1EM4il9X6LtOf'); // Replace with your Client Secret
define('PAYPAL_API_BASE', PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com');

function getPayPalAccessToken() {
    $ch = curl_init(PAYPAL_API_BASE . '/v1/oauth2/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_USERPWD, PAYPAL_CLIENT_ID . ':' . PAYPAL_CLIENT_SECRET);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Accept-Language: en_US'
    ]);
    $response = curl_exec($ch);
    if ($response === false) {
        throw new Exception('PayPal token request failed: ' . curl_error($ch));
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode($response, true);
    if ($status >= 400 || empty($data['access_token'])) {
        throw new Exception('PayPal token error: ' . ($data['error_description'] ?? 'Unknown error'));
    }
    return $data['access_token'];
}


