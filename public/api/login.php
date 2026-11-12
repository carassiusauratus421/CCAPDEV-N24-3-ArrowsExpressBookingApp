
<?php

// Authenticate a passenger using MySQL.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);

    echo json_encode([
        'error' => 'Method not allowed.'
    ]);

    exit;
}

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS'])
        && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();

try {
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/User.php';

    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($input)) {
        http_response_code(400);

        echo json_encode([
            'error' => 'Invalid login request.'
        ]);

        exit;
    }

    $email = strtolower(trim(
        (string) ($input['email'] ?? '')
    ));

    $password = $input['password'] ?? '';

    if (
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        !is_string($password) ||
        $password === ''
    ) {
        http_response_code(400);

        echo json_encode([
            'error' => 'Enter a valid email and password.'
        ]);

        exit;
    }

    $userModel = new User($pdo);
    $user = $userModel->findByEmail($email);

    $validLogin = $user
        && !empty($user['password_hash'])
        && password_verify(
            $password,
            $user['password_hash']
        )
        && strtolower((string) $user['account_status']) === 'active'
        && strtolower((string) $user['role']) === 'passenger';

    if (!$validLogin) {
        http_response_code(401);

        echo json_encode([
            'error' => 'Invalid email or password.'
        ]);

        exit;
    }

    // Regenerate the session after authentication.
    session_regenerate_id(true);

    $_SESSION['user_id'] = (int) $user['user_id'];
    $_SESSION['role'] = 'passenger';

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'redirect' => 'home.php'
    ], JSON_THROW_ON_ERROR);

} catch (Throwable $error) {
    error_log(
        'Passenger login API: ' . $error->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'error' => 'Unable to complete login.'
    ]);
}
