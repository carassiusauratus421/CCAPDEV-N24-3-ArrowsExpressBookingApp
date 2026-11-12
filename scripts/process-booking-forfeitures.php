<?php
/**
 * Arrows Express Phase 2: due ride-confirmation forfeiture worker.
 * Run from Windows Task Scheduler every minute using C:\xampp\php\php.exe.
 * CLI only; never expose this script as a public web endpoint.
 * The MySQL connection in app/core/db.php must use Manila time (+08:00).
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}

try {
    require_once __DIR__ . '/../app/core/db.php';
    require_once __DIR__ . '/../app/models/Booking.php';

    $bookingModel = new Booking($pdo);
    $total = 0;
    $batches = 0;

    // Avoid an unbounded loop if the database is unexpectedly backlogged.
    // Next scheduled run continues with remaining overdue bookings.
    do {
        $changed = $bookingModel->processDueForfeitures(null, 200);
        $total += $changed;
        $batches++;
    } while ($changed === 200 && $batches < 20);

    echo '[' . $bookingModel->getDatabaseNow() . ' PHT] ' .
        'Forfeited ' . $total . " overdue unconfirmed booking(s).\n";
    exit(0);
} catch (Throwable $error) {
    error_log('Arrows Express forfeiture worker: ' . $error->getMessage());
    fwrite(STDERR, 'Forfeiture worker failed: ' . $error->getMessage() . "\n");
    exit(1);
}
