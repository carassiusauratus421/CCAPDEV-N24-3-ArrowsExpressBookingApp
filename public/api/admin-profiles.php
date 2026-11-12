<?php

// Server-authorized administrative user profiles endpoint.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
ini_set('session.use_strict_mode', '1');

session_start();

function adminProfileReply(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_THROW_ON_ERROR);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    adminProfileReply(405, ['error' => 'Method not allowed.']);
}

if (empty($_SESSION['user_id'])) {
    adminProfileReply(401, ['error' => 'Sign in as an administrator.']);
}

try {
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/AdminProfile.php';

    $check = $pdo->prepare('SELECT role, account_status, email FROM `user` WHERE user_id = :id LIMIT 1');
    $check->execute(['id' => (int) $_SESSION['user_id']]);
    $admin = $check->fetch(PDO::FETCH_ASSOC);

    if (
        !$admin ||
        strtolower((string) $admin['role']) !== 'admin' ||
        strtolower((string) $admin['account_status']) !== 'active'
    ) {
        adminProfileReply(403, ['error' => 'Administrator permission required.']);
    }

    $_SESSION['role'] = 'admin';

    if (empty($_SESSION['admin_profile_csrf_token'])) {
        $_SESSION['admin_profile_csrf_token'] = bin2hex(random_bytes(32));
    }

    $model = new AdminProfile($pdo);

    if ($method === 'GET') {
        adminProfileReply(200, [
            'success' => true,
            'admin_email' => $admin['email'],
            'profiles' => $model->listProfiles(),
            'vehicles' => $model->listVehicles(),
            'csrf_token' => $_SESSION['admin_profile_csrf_token']
        ]);
    }

    // POST request handling
    if (!preg_match('~^application/json(?:\s*;|$)~i', $_SERVER['CONTENT_TYPE'] ?? '')) {
        adminProfileReply(415, ['error' => 'JSON content type required.']);
    }

    $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($csrf) || !hash_equals($_SESSION['admin_profile_csrf_token'], $csrf)) {
        adminProfileReply(403, ['error' => 'Invalid security token. Refresh and retry.']);
    }

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true, 512, JSON_THROW_ON_ERROR);

    if (!is_array($input) || array_is_list($input)) {
        adminProfileReply(400, ['error' => 'Invalid request payload.']);
    }

    $action = $input['action'] ?? '';

    switch ($action) {
        case 'create':
            $role = strtolower(trim((string) ($input['role'] ?? 'passenger')));
            if (!in_array($role, ['passenger', 'driver'], true)) {
                adminProfileReply(400, ['error' => 'Profile type must be passenger or driver.']);
            }

            if ($role === 'passenger') {
                $profile = $model->createPassengerProfile($input);
            } else {
                $profile = $model->createDriverProfile($input);
            }

            adminProfileReply(201, [
                'success' => true,
                'message' => 'Profile added successfully.',
                'profile' => $profile
            ]);
            break;

        case 'update':
            $userId = filter_var($input['user_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($userId === false || $userId === null) {
                adminProfileReply(400, ['error' => 'Valid user ID is required for updating.']);
            }

            $existing = $model->getProfileByUserId((int) $userId);
            if (!$existing) {
                adminProfileReply(404, ['error' => 'Profile not found.']);
            }

            if ($existing['role'] === 'passenger') {
                $profile = $model->updatePassengerProfile((int) $userId, $input);
            } else {
                $profile = $model->updateDriverProfile((int) $userId, $input);
            }

            adminProfileReply(200, [
                'success' => true,
                'message' => 'Profile updated successfully.',
                'profile' => $profile
            ]);
            break;

        case 'delete':
            $userId = filter_var($input['user_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($userId === false || $userId === null) {
                adminProfileReply(400, ['error' => 'Valid user ID is required for deletion.']);
            }

            $existing = $model->getProfileByUserId((int) $userId);
            if (!$existing) {
                adminProfileReply(404, ['error' => 'Profile not found.']);
            }

            $model->deleteProfile((int) $userId);

            adminProfileReply(200, [
                'success' => true,
                'message' => 'Profile deleted successfully.'
            ]);
            break;

        default:
            adminProfileReply(400, ['error' => 'Invalid action specified. Supported actions: create, update, delete.']);
    }

} catch (InvalidArgumentException $error) {
    adminProfileReply(400, ['error' => $error->getMessage()]);
} catch (JsonException $error) {
    adminProfileReply(400, ['error' => 'Invalid JSON input.']);
} catch (Throwable $error) {
    error_log('Admin profile API error: ' . $error->getMessage());
    adminProfileReply(500, ['error' => 'Unable to process the profile request.']);
}
