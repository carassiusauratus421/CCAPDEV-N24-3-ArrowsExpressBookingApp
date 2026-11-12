
<?php

// Passenger Bookings API
// Retrieves reservations for the authenticated passenger.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_start();

// Require a server-side login session.
$userId = $_SESSION['user_id'] ?? null;

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
        'error' => 'Please log in to view your bookings.'
    ]);

    exit;
}

try {
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/Booking.php';

    $bookingModel = new Booking($pdo);

    // Identify the passenger using the logged-in user.
    $passenger = $bookingModel->getPassengerByUserId(
        (int) $userId
    );

    if (!$passenger) {
        http_response_code(403);

        echo json_encode([
            'error' => 'No active passenger account was found.'
        ]);

        exit;
    }

    // Retrieve only this passenger's reservations.
    $bookings = $bookingModel->getBookingsByPassengerId(
        (int) $passenger['passenger_id']
    );

    echo json_encode([
        'passenger' => $passenger,
        'bookings' => $bookings
    ], JSON_THROW_ON_ERROR);

} catch (Throwable $error) {
    error_log(
        'Passenger bookings API: ' . $error->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'error' => 'Unable to load bookings from the database.'
    ]);
}
