
<?php

// Passenger Bookings API
// Retrieves bookings, submits requests, and handles cancellation.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_start();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    http_response_code(405);

    echo json_encode([
        'error' => 'Request method not allowed.'
    ]);

    exit;
}


// Require an authenticated user.

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
        'error' => 'Please log in to access your bookings.'
    ]);

    exit;
}


try {
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/Booking.php';

    $bookingModel = new Booking($pdo);

    // Find the passenger associated with this session.
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

    $passengerId = (int) $passenger['passenger_id'];


    // Generate a CSRF token for state-changing requests.

    if (empty($_SESSION['booking_csrf_token'])) {
        $_SESSION['booking_csrf_token'] = bin2hex(
            random_bytes(32)
        );
    }


    // GET: Retrieve all bookings for the logged-in passenger.

    if ($method === 'GET') {
        // Idempotent fallback if the scheduled worker has not run yet.
        // Only this passenger's overdue, admin-approved bookings are settled.
        $bookingModel->processDueForfeitures($passengerId);
        $bookings = $bookingModel->getBookingsByPassengerId(
            $passengerId
        );

        echo json_encode([
            'passenger' => $passenger,
            'bookings' => $bookings,
            'server_now' => $bookingModel->getDatabaseNow(),
            'csrf_token' => $_SESSION['booking_csrf_token']
        ], JSON_THROW_ON_ERROR);

        exit;
    }


    // POST: Require a JSON request.

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (
        !preg_match(
            '~^application/json(?:\s*;|$)~i',
            $contentType
        )
    ) {
        http_response_code(415);

        echo json_encode([
            'error' => 'Content-Type must be application/json.'
        ]);

        exit;
    }


    // Verify the session-specific CSRF token.

    $submittedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (
        !is_string($submittedToken) ||
        !hash_equals(
            $_SESSION['booking_csrf_token'],
            $submittedToken
        )
    ) {
        http_response_code(403);

        echo json_encode([
            'error' => 'Invalid booking security token.'
        ]);

        exit;
    }


    // Decode the request body.

    $rawBody = file_get_contents('php://input');

    try {
        $input = json_decode(
            $rawBody,
            true,
            512,
            JSON_THROW_ON_ERROR
        );

    } catch (JsonException $error) {
        http_response_code(400);

        echo json_encode([
            'error' => 'Invalid JSON request.'
        ]);

        exit;
    }

    if (
        !is_array($input) ||
        array_is_list($input)
    ) {
        http_response_code(400);

        echo json_encode([
            'error' => 'Invalid booking request.'
        ]);

        exit;
    }


    // Determine the requested booking operation.

    $action = $input['action'] ?? 'create';

    if (!is_string($action)) {
        http_response_code(400);

        echo json_encode([
            'error' => 'Invalid booking action.'
        ]);

        exit;
    }


    // POST: Passenger ride confirmation; admin approval is a separate step.
    if ($action === 'confirm_ride') {
        $bookingId = filter_var(
            $input['booking_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );
        if ($bookingId === false) {
            http_response_code(400);
            echo json_encode(['error' => 'A valid booking ID is required.']);
            exit;
        }
        $result = $bookingModel->confirmRide($passengerId, (int) $bookingId);
        if (!$result['success']) {
            http_response_code($result['message'] === 'Booking not found.' ? 404 : 409);
            echo json_encode(['error' => $result['message']]);
            exit;
        }
        echo json_encode($result, JSON_THROW_ON_ERROR);
        exit;
    }

    // POST: Cancel an existing reservation.

    if ($action === 'cancel') {
        $bookingId = filter_var(
            $input['booking_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($bookingId === false) {
            http_response_code(400);

            echo json_encode([
                'error' => 'A valid booking ID is required.'
            ]);

            exit;
        }

        $result = $bookingModel->cancelBooking(
            $passengerId,
            (int) $bookingId
        );

        if (!$result['success']) {
            http_response_code(
                $result['message'] === 'Booking not found.'
                    ? 404
                    : 409
            );

            echo json_encode([
                'error' => $result['message']
            ]);

            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'booking_id' => $result['booking_id'],
            'trip_id' => $result['trip_id']
        ], JSON_THROW_ON_ERROR);

        exit;
    }


    // Only creation, cancellation, and ride confirmation are supported.

    if ($action !== 'create') {
        http_response_code(400);

        echo json_encode([
            'error' => 'Unsupported booking action.'
        ]);

        exit;
    }


    // POST: Submit a new booking request.

    $tripId = filter_var(
        $input['trip_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($tripId === false) {
        http_response_code(400);

        echo json_encode([
            'error' => 'A valid trip ID is required.'
        ]);

        exit;
    }

    $result = $bookingModel->createBooking(
        $passengerId,
        (int) $tripId
    );

    if (!$result['success']) {
        http_response_code(
            $result['message'] === 'The selected trip does not exist.'
                ? 404
                : 409
        );

        echo json_encode([
            'error' => $result['message']
        ]);

        exit;
    }


    // A new booking request awaits admin approval.

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => $result['message'],
        'booking_id' => $result['booking_id'],
        'trip_id' => $result['trip_id'],
        'booking_status' => $result['booking_status']
    ], JSON_THROW_ON_ERROR);


} catch (Throwable $error) {
    error_log(
        'Passenger bookings API: ' . $error->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'error' => 'Unable to process the booking request.'
    ]);
}
