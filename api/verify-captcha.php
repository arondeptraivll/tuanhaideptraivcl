<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? '';
$userAgent = $input['userAgent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '';
$remoteIP = $_SERVER['REMOTE_ADDR'] ?? '';

// hCaptcha configuration
$hcaptcha_secret = 'ES_cb6386c0e7b34869a4ccf1a29c680c92';
$hcaptcha_sitekey = '3640844c-e606-4b7e-93ec-078232d4047a';

// Validate input
if (empty($token)) {
    echo json_encode([
        'success' => false, 
        'error' => 'No token provided'
    ]);
    exit;
}

// Additional bot checks before verifying captcha
$botScore = 0;
$botReasons = [];

// Check User Agent
if (empty($userAgent)) {
    $botScore += 30;
    $botReasons[] = 'no_user_agent';
} else {
    $ua_lower = strtolower($userAgent);
    $bot_indicators = ['headless', 'phantom', 'selenium', 'webdriver', 'crawler', 'bot'];
    
    foreach ($bot_indicators as $indicator) {
        if (strpos($ua_lower, $indicator) !== false) {
            $botScore += 40;
            $botReasons[] = "ua_contains_{$indicator}";
            break;
        }
    }
}

// Check IP (basic)
if ($remoteIP === '127.0.0.1' || $remoteIP === '::1') {
    $botScore += 10; // Local IP gets small penalty
    $botReasons[] = 'local_ip';
}

// If bot score too high, reject immediately
if ($botScore >= 50) {
    echo json_encode([
        'success' => false,
        'error' => 'Bot detected',
        'bot_score' => $botScore,
        'reasons' => $botReasons
    ]);
    exit;
}

// Verify hCaptcha token
$verify_data = [
    'secret' => $hcaptcha_secret,
    'response' => $token,
    'sitekey' => $hcaptcha_sitekey,
    'remoteip' => $remoteIP
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://hcaptcha.com/siteverify');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($verify_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// Handle cURL errors
if ($curl_error) {
    error_log("hCaptcha verification cURL error: " . $curl_error);
    echo json_encode([
        'success' => false,
        'error' => 'Verification service unavailable'
    ]);
    exit;
}

if ($http_code !== 200) {
    error_log("hCaptcha verification HTTP error: " . $http_code);
    echo json_encode([
        'success' => false,
        'error' => 'Verification service error'
    ]);
    exit;
}

// Parse hCaptcha response
$result = json_decode($response, true);

if (!$result) {
    error_log("hCaptcha verification: Invalid JSON response");
    echo json_encode([
        'success' => false,
        'error' => 'Invalid verification response'
    ]);
    exit;
}

// Log verification attempt
$log_data = [
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $remoteIP,
    'user_agent' => $userAgent,
    'bot_score' => $botScore,
    'captcha_success' => $result['success'] ?? false,
    'error_codes' => $result['error-codes'] ?? []
];
error_log("hCaptcha verification: " . json_encode($log_data));

if ($result['success']) {
    // Start session and mark as verified
    session_start();
    $_SESSION['security_verified'] = true;
    $_SESSION['verify_time'] = time();
    $_SESSION['verify_ip'] = $remoteIP;
    $_SESSION['verify_ua'] = $userAgent;
    
    // Set additional cookie as backup
    setcookie('sec_verified', 'true', time() + 1800, '/', '', false, true); // 30 min, httponly
    
    echo json_encode([
        'success' => true,
        'message' => 'Verification successful',
        'timestamp' => time()
    ]);
} else {
    // Captcha verification failed
    $error_codes = $result['error-codes'] ?? ['unknown-error'];
    
    echo json_encode([
        'success' => false,
        'error' => 'Captcha verification failed',
        'error_codes' => $error_codes,
        'bot_score' => $botScore
    ]);
}
?>