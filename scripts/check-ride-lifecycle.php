<?php
/**
 * Read-only prerequisite check for the ride confirmation / forfeiture feature.
 * Run: C:\xampp\php\php.exe scripts\check-ride-lifecycle.php
 * Does not create, update, or delete database records.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}
try {
    require_once __DIR__ . '/../app/core/db.php';
    $columns = $pdo->query("SHOW COLUMNS FROM booking_reservation")->fetchAll(PDO::FETCH_COLUMN);
    $trips = $pdo->query("SHOW COLUMNS FROM trip_schedule")->fetchAll(PDO::FETCH_COLUMN);
    foreach (['booking_id','passenger_id','trip_id','booking_status','passenger_confirmed'] as $column) {
        if (!in_array($column, $columns, true)) {
            throw new RuntimeException('Missing booking_reservation column: ' . $column);
        }
    }
    foreach (['trip_id','departure_datetime','trip_status','available_slots','vehicle_id'] as $column) {
        if (!in_array($column, $trips, true)) {
            throw new RuntimeException('Missing trip_schedule column: ' . $column);
        }
    }
    $time = $pdo->query("SELECT NOW() AS db_now, @@session.time_zone AS zone, TIMEDIFF(NOW(), UTC_TIMESTAMP()) AS utc_difference")
        ->fetch(PDO::FETCH_ASSOC);
    $count = (int) $pdo->query("SELECT COUNT(*) FROM booking_reservation b
        JOIN trip_schedule t ON t.trip_id = b.trip_id
        WHERE b.booking_status = 'confirmed' AND b.passenger_confirmed IS NULL
          AND t.trip_status = 'scheduled' AND t.departure_datetime <= NOW()")->fetchColumn();
    echo "Database prerequisites: PASS\n";
    echo 'Database now: ' . $time['db_now'] . "\n";
    echo 'Session timezone: ' . $time['zone'] . "\n";
    echo 'Difference vs UTC: ' . $time['utc_difference'] . "\n";
    echo 'Due unconfirmed approved bookings: ' . $count . "\n";
    echo "Expected difference vs UTC for Manila: +08:00:00.\n";
    exit(0);
} catch (Throwable $error) {
    fwrite(STDERR, 'Lifecycle prerequisite check failed: ' . $error->getMessage() . "\n");
    exit(1);
}
