<?php

// Retrieve the currently authenticated driver profile, duty status, and vehicle assignment.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
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
        'error' => 'Please log in to continue.'
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
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/Driver.php';

    $driverModel = new Driver($pdo);
    $driver = $driverModel->getDriverByUserId((int) $userId);

    if (!$driver) {
        http_response_code(404);
        echo json_encode([
            'error' => 'Driver profile not found.'
        ]);
        exit;
    }

    echo json_encode([
        'driver' => $driver
    ], JSON_THROW_ON_ERROR);

} catch (Throwable $error) {
    error_log('Driver identity API: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Unable to load driver information.'
    ]);
}
