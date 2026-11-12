<?php

// Retrieve the currently authenticated passenger.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_start();

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
        'error' => 'Please log in to continue.'
    ]);

    exit;
}

try {
    require_once __DIR__ . '/../../app/core/db.php';

    $query = "
        SELECT
            u.user_id,
            u.email,
            u.role,
            p.passenger_id,
            p.first_name,
            p.last_name,
            p.id_number
        FROM `user` AS u
        INNER JOIN passenger AS p
            ON u.user_id = p.user_id
        WHERE u.user_id = :user_id
            AND u.role = 'passenger'
            AND u.account_status = 'active'
        LIMIT 1
    ";

    $statement = $pdo->prepare($query);

    $statement->execute([
        'user_id' => (int) $userId
    ]);

    $passenger = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$passenger) {
        http_response_code(403);

        echo json_encode([
            'error' => 'Passenger account not found.'
        ]);

        exit;
    }

    echo json_encode([
        'passenger' => $passenger
    ], JSON_THROW_ON_ERROR);

} catch (Throwable $error) {
    error_log(
        'Passenger identity API: ' . $error->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'error' => 'Unable to load passenger information.'
    ]);
}
