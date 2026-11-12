
<?php

// Retrieve passenger trip schedules from MySQL as JSON.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    require_once __DIR__ . '/../../app/core/db.php';
    require_once __DIR__ . '/../../app/models/Trip.php';

    $tripModel = new Trip($pdo);

    $date = isset($_GET['date'])
        ? trim((string) $_GET['date'])
        : '';

    // Select the next available date if none was provided.
    if ($date === '') {
        $date = $tripModel->getNextAvailableDate() ?? '';
    } else {
        $parsedDate = DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $date
        );

        if (
            !$parsedDate ||
            $parsedDate->format('Y-m-d') !== $date
        ) {
            http_response_code(400);

            echo json_encode([
                'error' => 'Select a valid date (YYYY-MM-DD).'
            ]);

            exit;
        }
    }

    // Retrieve routes and trips from the database.
    $routes = $tripModel->getRoutes();

    $trips = $date === ''
        ? []
        : $tripModel->getTripsByDate($date);

    echo json_encode([
        'date' => $date,
        'routes' => $routes,
        'trips' => $trips
    ], JSON_THROW_ON_ERROR);

} catch (Throwable $error) {
    error_log('Trip schedule API: ' . $error->getMessage());

    http_response_code(500);

    echo json_encode([
        'error' => 'Unable to load the schedule from the database.'
    ]);
}
