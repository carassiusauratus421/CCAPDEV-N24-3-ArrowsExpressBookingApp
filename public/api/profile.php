<?php

// Passenger-only profile retrieval and updates.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_start();

function profileResponse(int $code, array $data): void
{
    http_response_code($code);
    echo json_encode($data, JSON_THROW_ON_ERROR);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    profileResponse(405, ['error' => 'Method not allowed.']);
}

$userId = filter_var($_SESSION['user_id'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1]
]);
if ($userId === false) {
    profileResponse(401, ['error' => 'Please log in as a passenger.']);
}

try {
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/Profile.php';
    $model = new Profile($pdo);
    $profile = $model->getByUserId((int) $userId);
    if (!$profile) {
        profileResponse(403, ['error' => 'Active passenger account not found.']);
    }

    if (empty($_SESSION['profile_csrf_token'])) {
        $_SESSION['profile_csrf_token'] = bin2hex(random_bytes(32));
    }

    if ($method === 'GET') {
        profileResponse(200, [
            'profile' => $profile,
            'csrf_token' => $_SESSION['profile_csrf_token']
        ]);
    }

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (!preg_match('~^application/json(?:\s*;|$)~i', $contentType)) {
        profileResponse(415, ['error' => 'Expected a JSON request.']);
    }
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals($_SESSION['profile_csrf_token'], $token)) {
        profileResponse(403, ['error' => 'Invalid security token. Refresh the page.']);
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        profileResponse(400, ['error' => 'Invalid JSON body.']);
    }
    if (!is_array($input) || array_is_list($input)) {
        profileResponse(400, ['error' => 'Invalid profile payload.']);
    }

    $fields = ['first_name', 'last_name', 'sex', 'college', 'passenger_type'];
    $values = [];
    foreach ($fields as $field) {
        if (!array_key_exists($field, $input) || !is_string($input[$field])) {
            profileResponse(400, ['error' => 'Missing or invalid field: ' . $field]);
        }
        $values[$field] = trim($input[$field]);
    }

    foreach (['first_name', 'last_name'] as $field) {
        if ($values[$field] === '' || strlen($values[$field]) > 45) {
            profileResponse(422, ['error' => 'First and last names must be 1 to 45 characters.']);
        }
    }
    if (!in_array(strtolower($values['sex']), ['male', 'female', 'prefer-not-to-say'], true)) {
        profileResponse(422, ['error' => 'Choose a valid sex value.']);
    }
    if (!in_array($values['passenger_type'], ['student', 'faculty', 'employee-staff'], true)) {
        profileResponse(422, ['error' => 'Choose a valid passenger type.']);
    }
    if ($values['college'] !== '' && strlen($values['college']) > 45) {
        profileResponse(422, ['error' => 'College or department must be at most 45 characters.']);
    }

    $values['sex'] = strtolower($values['sex']);
    $values['college'] = $values['college'] === '' ? null : $values['college'];

    $updated = $model->updateByUserId((int) $userId, $values);
    if (!$updated) {
        profileResponse(403, ['error' => 'Passenger account is no longer active.']);
    }
    profileResponse(200, ['success' => true, 'message' => 'Profile saved successfully.', 'profile' => $updated]);
} catch (Throwable $error) {
    error_log('Passenger profile API: ' . $error->getMessage());
    profileResponse(500, ['error' => 'Could not load or save the profile. Check the server logs.']);
}
