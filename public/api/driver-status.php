<?php

// Update duty status for the authenticated driver.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

session_start();

$userId = $_SESSION['user_id'] ?? null;
$role = $_SESSION['role'] ?? null;

if (
    !is_scalar($userId) ||
    filter_var(
        $userId,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    ) === false
) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Please log in to update your status.'
    ]);
    exit;
}

if ($role !== 'driver') {
    http_response_code(403);
    echo json_encode([
        'error' => 'Unauthorized driver access.'
    ]);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true, 512, JSON_THROW_ON_ERROR);

    if (!is_array($input)) {
        throw new InvalidArgumentException('Invalid request format.');
    }

    $status = trim((string) ($input['status'] ?? ''));

    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/Driver.php';

    $canonicalStatus = Driver::normalizeDutyStatus($status);
    if ($canonicalStatus === null) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Invalid duty status value.'
        ]);
        exit;
    }

    $driverModel = new Driver($pdo);
    $driver = $driverModel->getDriverByUserId((int) $userId);

    if (!$driver) {
        http_response_code(404);
        echo json_encode([
            'error' => 'Driver profile not found.'
        ]);
        exit;
    }

    $updated = $driverModel->updateDutyStatus($driver['driver_id'], $canonicalStatus);
    if (!$updated) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Unable to update duty status.'
        ]);
        exit;
    }

    $freshDriver = $driverModel->getDriverByUserId((int) $userId);

    echo json_encode([
        'success' => true,
        'message' => 'Duty status updated successfully.',
        'duty_status' => $canonicalStatus,
        'status_updated_at' => $freshDriver['status_updated_at'] ?? date('Y-m-d H:i:s')
    ], JSON_THROW_ON_ERROR);

} catch (JsonException | InvalidArgumentException $error) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid request data.'
    ]);
} catch (Throwable $error) {
    error_log('Driver status API: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Unable to update duty status.'
    ]);
}
