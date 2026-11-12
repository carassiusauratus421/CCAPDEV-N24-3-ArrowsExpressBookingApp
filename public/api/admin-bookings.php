<?php
// Server-authorized admin booking list and approval decisions.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
ini_set('session.use_strict_mode', '1');
session_start();
function adminBookingReply(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_THROW_ON_ERROR);
    exit;
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    adminBookingReply(405, ['error' => 'Method not allowed.']);
}
if (empty($_SESSION['user_id'])) {
    adminBookingReply(401, ['error' => 'Sign in as an administrator.']);
}
try {
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/AdminBooking.php';
    $check = $pdo->prepare('SELECT role, account_status, email FROM `user` WHERE user_id = :id LIMIT 1');
    $check->execute(['id' => (int) $_SESSION['user_id']]);
    $admin = $check->fetch(PDO::FETCH_ASSOC);
    if (!$admin || strtolower((string) $admin['role']) !== 'admin' ||
        strtolower((string) $admin['account_status']) !== 'active') {
        adminBookingReply(403, ['error' => 'Administrator permission required.']);
    }
    $_SESSION['role'] = 'admin';
    if (empty($_SESSION['admin_booking_csrf_token'])) {
        $_SESSION['admin_booking_csrf_token'] = bin2hex(random_bytes(32));
    }
    $model = new AdminBooking($pdo);
    if ($method === 'GET') {
        adminBookingReply(200, [
            'admin_email' => $admin['email'],
            'bookings' => $model->listBookings(),
            'csrf_token' => $_SESSION['admin_booking_csrf_token']
        ]);
    }
    if (!preg_match('~^application/json(?:\s*;|$)~i', $_SERVER['CONTENT_TYPE'] ?? '')) {
        adminBookingReply(415, ['error' => 'JSON content type required.']);
    }
    $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($csrf) || !hash_equals($_SESSION['admin_booking_csrf_token'], $csrf)) {
        adminBookingReply(403, ['error' => 'Invalid security token. Refresh and retry.']);
    }
    $input = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($input) || array_is_list($input)) {
        adminBookingReply(400, ['error' => 'Invalid request body.']);
    }
    $bookingId = filter_var($input['booking_id'] ?? null, FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]);
    $action = $input['action'] ?? null;
    if ($bookingId === false || !is_string($action) ||
        !in_array($action, ['accept', 'hold', 'reject'], true)) {
        adminBookingReply(400, ['error' => 'Valid booking ID and decision required.']);
    }
    $result = $model->decide((int) $bookingId, $action);
    if (!$result['success']) {
        adminBookingReply($result['message'] === 'Booking not found.' ? 404 : 409,
            ['error' => $result['message']]);
    }
    adminBookingReply(200, $result);
} catch (JsonException $error) {
    adminBookingReply(400, ['error' => 'Invalid JSON request.']);
} catch (Throwable $error) {
    error_log('Admin booking API: ' . $error->getMessage());
    adminBookingReply(500, ['error' => 'Unable to process the admin booking request.']);
}
