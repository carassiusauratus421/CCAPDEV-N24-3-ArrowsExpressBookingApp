<?php

// Unit tests for app/models/Booking.php.
// Run from the project folder:  php tests/BookingTest.php
// Needs MySQL/MariaDB running. Uses its own database (arrows_express_test),
// which is created at the start and removed at the end.

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Tests can only be run from the command line.');
}

require_once __DIR__ . '/../app/models/Booking.php';

const TEST_DB = 'arrows_express_test';

// ---------- Test database ----------

function connectTestDatabase(): PDO
{
    $pdo = new PDO('mysql:host=localhost;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec('DROP DATABASE IF EXISTS ' . TEST_DB);
    $pdo->exec('CREATE DATABASE ' . TEST_DB);
    $pdo->exec('USE ' . TEST_DB);
    $pdo->exec("SET time_zone = '+08:00'");

    // Copy only the table definitions from the project dump. The dump itself
    // is never imported, because it would overwrite the real database.
    $dump = file_get_contents(__DIR__ . '/../app/db/CCAPDEV-N24-3-ArrowsExpress.sql');
    preg_match_all('/^CREATE TABLE .*?^\) ENGINE[^;]*;/ms', $dump, $tables);

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($tables[0] as $createTable) {
        $pdo->exec($createTable);
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    return $pdo;
}

// Every test starts from the same small set of records.
function resetData(PDO $pdo): void
{
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (['booking_reservation', 'trip_schedule', 'driver_profile', 'passenger', 'vehicle', 'user'] as $table) {
        $pdo->exec("TRUNCATE TABLE `$table`");
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    $pdo->exec("INSERT INTO `user` (user_id, email, role, account_status) VALUES
        (1, 'ana@test.local', 'passenger', 'active'),
        (2, 'ben@test.local', 'passenger', 'active'),
        (3, 'off@test.local', 'passenger', 'inactive'),
        (4, 'drv@test.local', 'driver', 'active')");
    $pdo->exec("INSERT INTO passenger (passenger_id, user_id, id_number, first_name, last_name) VALUES
        (1, 1, '1001', 'Ana', 'Cruz'),
        (2, 2, '1002', 'Ben', 'Reyes'),
        (3, 3, '1003', 'Olive', 'Santos'),
        (4, 4, '1004', 'Dan', 'Lim')");
    $pdo->exec("INSERT INTO vehicle (vehicle_id, plate_number, vehicle_model, capacity) VALUES
        (1, 'ABC 123', 'Test Van', 10)");
    $pdo->exec("INSERT INTO driver_profile (driver_id, user_id, assigned_vehicle_id, first_name, last_name) VALUES
        (1, 4, 1, 'Dan', 'Lim')");
}

// $minutesFromNow is negative for a trip that has already departed.
function addTrip(PDO $pdo, int $minutesFromNow = 1440, int $slots = 5, string $status = 'scheduled'): int
{
    $statement = $pdo->prepare("INSERT INTO trip_schedule
        (vehicle_id, driver_id, pickup_point, dropoff_point, departure_datetime, trip_status, available_slots)
        VALUES (1, 1, 'Manila', 'Laguna', DATE_ADD(NOW(), INTERVAL ? MINUTE), ?, ?)");
    $statement->execute([$minutesFromNow, $status, $slots]);

    return (int) $pdo->lastInsertId();
}

function addBooking(PDO $pdo, int $tripId, string $status = 'pending', int $passengerId = 1, ?string $confirmed = null): int
{
    $statement = $pdo->prepare("INSERT INTO booking_reservation
        (trip_id, passenger_id, booking_status, passenger_confirmed, timestamp_created)
        VALUES (?, ?, ?, ?, NOW())");
    $statement->execute([$tripId, $passengerId, $status, $confirmed]);

    return (int) $pdo->lastInsertId();
}

function slots(PDO $pdo, int $tripId): int
{
    return (int) $pdo->query("SELECT available_slots FROM trip_schedule WHERE trip_id = $tripId")->fetchColumn();
}

function bookingRow(PDO $pdo, int $bookingId): array
{
    return $pdo->query("SELECT * FROM booking_reservation WHERE booking_id = $bookingId")->fetch(PDO::FETCH_ASSOC);
}

function bookingCount(PDO $pdo): int
{
    return (int) $pdo->query('SELECT COUNT(*) FROM booking_reservation')->fetchColumn();
}

// ---------- Assertions ----------

function assertSame_(mixed $expected, mixed $actual, string $label = 'value'): void
{
    if ($expected !== $actual) {
        throw new Exception("$label: expected " . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
}

function assertThrows(string $class, callable $action): void
{
    try {
        $action();
    } catch (Throwable $error) {
        if ($error instanceof $class) {
            return;
        }
        throw new Exception("expected $class, got " . get_class($error) . ': ' . $error->getMessage());
    }
    throw new Exception("expected $class, but nothing was thrown");
}

function assertFailure(array $result, string $message): void
{
    assertSame_(false, $result['success'], 'success');
    assertSame_($message, $result['message'], 'message');
}

// ---------- Test cases, grouped by function ----------

$tests = [];

$tests['__construct'] = [
    'stores a connection the model can use' => function (Booking $model, PDO $pdo) {
        assertSame_(true, new Booking($pdo) instanceof Booking);
        assertSame_([], (new Booking($pdo))->getBookingsByPassengerId(1));
    },
];

$tests['getPassengerByUserId'] = [
    'returns an active passenger' => function (Booking $model) {
        $passenger = $model->getPassengerByUserId(1);
        assertSame_('Ana', $passenger['first_name']);
        assertSame_('1001', $passenger['id_number']);
    },
    'returns null for an unknown user' => function (Booking $model) {
        assertSame_(null, $model->getPassengerByUserId(999));
    },
    'returns null for an inactive account' => function (Booking $model) {
        assertSame_(null, $model->getPassengerByUserId(3));
    },
    'returns null for a non-passenger role' => function (Booking $model) {
        assertSame_(null, $model->getPassengerByUserId(4));
    },
];

$tests['getBookingsByPassengerId'] = [
    'returns an empty list when there are no bookings' => function (Booking $model) {
        assertSame_([], $model->getBookingsByPassengerId(1));
    },
    'returns only that passenger, latest departure first' => function (Booking $model, PDO $pdo) {
        $sooner = addBooking($pdo, addTrip($pdo, 60));
        $later = addBooking($pdo, addTrip($pdo, 600));
        addBooking($pdo, addTrip($pdo, 90), 'pending', 2);

        $rows = $model->getBookingsByPassengerId(1);

        assertSame_([$later, $sooner], array_map(fn ($row) => (int) $row['booking_id'], $rows), 'order');
        assertSame_('ABC 123', $rows[0]['plate_number']);
        assertSame_('Dan', $rows[0]['driver_first_name']);
    },
];

$tests['createBooking'] = [
    'creates a pending booking and reserves one seat' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo);
        $result = $model->createBooking(1, $trip);

        assertSame_(true, $result['success'], 'success');
        assertSame_('pending', bookingRow($pdo, $result['booking_id'])['booking_status'], 'status');
        assertSame_(4, slots($pdo, $trip), 'slots');
    },
    'rejects a trip that does not exist' => function (Booking $model) {
        assertFailure($model->createBooking(1, 999), 'The selected trip does not exist.');
    },
    'rejects a departed trip' => function (Booking $model, PDO $pdo) {
        assertFailure($model->createBooking(1, addTrip($pdo, -10)), 'This trip is no longer available.');
    },
    'rejects a trip that is not scheduled' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo, 1440, 5, 'cancelled');
        assertFailure($model->createBooking(1, $trip), 'This trip is no longer available.');
    },
    'rejects a full trip' => function (Booking $model, PDO $pdo) {
        assertFailure($model->createBooking(1, addTrip($pdo, 1440, 0)), 'This trip is fully booked.');
        assertSame_(0, bookingCount($pdo), 'bookings');
    },
    'rejects a duplicate active booking' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo);
        $model->createBooking(1, $trip);

        assertFailure($model->createBooking(1, $trip), 'You already have an active booking request for this trip.');
        assertSame_(4, slots($pdo, $trip), 'slots');
    },
    'allows booking again after cancelling' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo);
        addBooking($pdo, $trip, 'cancelled');
        assertSame_(true, $model->createBooking(1, $trip)['success'], 'success');
    },
    'rolls back when the database rejects the insert' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo);

        assertThrows(PDOException::class, fn () => $model->createBooking(999, $trip));
        assertSame_(false, $pdo->inTransaction(), 'in transaction');
        assertSame_(5, slots($pdo, $trip), 'slots');
    },
];

$tests['cancelBooking'] = [
    'cancels pending, confirmed and on_hold bookings and returns the seat' => function (Booking $model, PDO $pdo) {
        foreach (['pending', 'confirmed', 'on_hold'] as $status) {
            $trip = addTrip($pdo);
            $booking = addBooking($pdo, $trip, $status);

            assertSame_(true, $model->cancelBooking(1, $booking)['success'], "$status success");
            assertSame_('cancelled', bookingRow($pdo, $booking)['booking_status'], "$status status");
            assertSame_(6, slots($pdo, $trip), "$status slots");
        }
    },
    "rejects another passenger's booking" => function (Booking $model, PDO $pdo) {
        $booking = addBooking($pdo, addTrip($pdo));

        assertFailure($model->cancelBooking(2, $booking), 'Booking not found.');
        assertSame_('pending', bookingRow($pdo, $booking)['booking_status'], 'status');
    },
    'rejects an already cancelled booking' => function (Booking $model, PDO $pdo) {
        $booking = addBooking($pdo, addTrip($pdo), 'cancelled');
        assertFailure($model->cancelBooking(1, $booking), 'This booking cannot be cancelled.');
    },
    'rejects a departed trip' => function (Booking $model, PDO $pdo) {
        $booking = addBooking($pdo, addTrip($pdo, -10));
        assertFailure($model->cancelBooking(1, $booking), 'Trips that have departed cannot be cancelled.');
    },
    'throws and rolls back when seat totals are inconsistent' => function (Booking $model, PDO $pdo) {
        $booking = addBooking($pdo, addTrip($pdo, 1440, 10));

        assertThrows(RuntimeException::class, fn () => $model->cancelBooking(1, $booking));
        assertSame_(false, $pdo->inTransaction(), 'in transaction');
        assertSame_('pending', bookingRow($pdo, $booking)['booking_status'], 'status');
    },
];

$tests['getDatabaseNow'] = [
    'returns the database time as Y-m-d H:i:s' => function (Booking $model, PDO $pdo) {
        $before = $pdo->query('SELECT NOW()')->fetchColumn();
        $now = $model->getDatabaseNow();
        $after = $pdo->query('SELECT NOW()')->fetchColumn();

        assertSame_(1, preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $now), 'format');
        assertSame_(true, $now >= $before && $now <= $after, 'between database timestamps');
    },
];

$tests['processDueForfeitures'] = [
    'forfeits an unconfirmed departed ride and releases the seat once' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo, -10);
        $booking = addBooking($pdo, $trip, 'confirmed');

        assertSame_(1, $model->processDueForfeitures(), 'first run');
        assertSame_(0, $model->processDueForfeitures(), 'second run');
        assertSame_('forfeited', bookingRow($pdo, $booking)['booking_status'], 'status');
        assertSame_(6, slots($pdo, $trip), 'slots');
    },
    'leaves confirmed, pending and future rides alone' => function (Booking $model, PDO $pdo) {
        $departed = addTrip($pdo, -10);
        addBooking($pdo, $departed, 'confirmed', 1, '2026-01-01 00:00:00');
        addBooking($pdo, $departed, 'pending', 2);
        addBooking($pdo, addTrip($pdo, 60), 'confirmed');

        assertSame_(0, $model->processDueForfeitures());
    },
    'can be limited to one passenger' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo, -10);
        addBooking($pdo, $trip, 'confirmed', 1);
        $other = addBooking($pdo, $trip, 'confirmed', 2);

        assertSame_(1, $model->processDueForfeitures(1), 'count');
        assertSame_('confirmed', bookingRow($pdo, $other)['booking_status'], 'other passenger');
    },
    'treats a limit below 1 as 1' => function (Booking $model, PDO $pdo) {
        $trip = addTrip($pdo, -10);
        addBooking($pdo, $trip, 'confirmed', 1);
        addBooking($pdo, $trip, 'confirmed', 2);

        assertSame_(1, $model->processDueForfeitures(null, 0));
    },
];

// Private, so it is called through reflection to reach its safety checks.
$forfeit = fn (Booking $model, int $bookingId, int $tripId) =>
    (new ReflectionMethod(Booking::class, 'forfeitDueBooking'))->invoke($model, $bookingId, $tripId);

$tests['forfeitDueBooking (private)'] = [
    'returns true for an eligible booking' => function (Booking $model, PDO $pdo) use ($forfeit) {
        $trip = addTrip($pdo, -10);
        assertSame_(true, $forfeit($model, addBooking($pdo, $trip, 'confirmed'), $trip));
    },
    'returns false when the trip has not departed' => function (Booking $model, PDO $pdo) use ($forfeit) {
        $trip = addTrip($pdo, 60);
        assertSame_(false, $forfeit($model, addBooking($pdo, $trip, 'confirmed'), $trip));
    },
    'returns false when the booking belongs to another trip' => function (Booking $model, PDO $pdo) use ($forfeit) {
        $booking = addBooking($pdo, addTrip($pdo, -10), 'confirmed');
        assertSame_(false, $forfeit($model, $booking, addTrip($pdo, -10)));
    },
    'throws and rolls back when seat totals are inconsistent' => function (Booking $model, PDO $pdo) use ($forfeit) {
        $trip = addTrip($pdo, -10, 10);
        $booking = addBooking($pdo, $trip, 'confirmed');

        assertThrows(RuntimeException::class, fn () => $forfeit($model, $booking, $trip));
        assertSame_('confirmed', bookingRow($pdo, $booking)['booking_status'], 'status');
    },
];

$windowMessage = 'Ride confirmation is only available from 60 minutes before departure until departure.';
$statusMessage = 'Only admin-approved, scheduled rides can be confirmed.';

$tests['confirmRide'] = [
    'confirms within 60 minutes of departure' => function (Booking $model, PDO $pdo) {
        $booking = addBooking($pdo, addTrip($pdo, 30), 'confirmed');
        $result = $model->confirmRide(1, $booking);

        assertSame_(true, $result['success'], 'success');
        assertSame_(true, bookingRow($pdo, $booking)['passenger_confirmed'] !== null, 'timestamp saved');
        assertSame_('confirmed', bookingRow($pdo, $booking)['booking_status'], 'status');
    },
    'keeps the first timestamp when confirmed again' => function (Booking $model, PDO $pdo) {
        $booking = addBooking($pdo, addTrip($pdo, 30), 'confirmed', 1, '2026-01-01 08:00:00');
        $result = $model->confirmRide(1, $booking);

        assertSame_('Your ride is already confirmed.', $result['message'], 'message');
        assertSame_('2026-01-01 08:00:00', $result['passenger_confirmed'], 'timestamp');
    },
    'rejects confirming too early' => function (Booking $model, PDO $pdo) use ($windowMessage) {
        $booking = addBooking($pdo, addTrip($pdo, 120), 'confirmed');
        assertFailure($model->confirmRide(1, $booking), $windowMessage);
    },
    'rejects confirming after departure' => function (Booking $model, PDO $pdo) use ($windowMessage) {
        $booking = addBooking($pdo, addTrip($pdo, -10), 'confirmed');
        assertFailure($model->confirmRide(1, $booking), $windowMessage);
    },
    'rejects a booking that is not admin-approved' => function (Booking $model, PDO $pdo) use ($statusMessage) {
        $booking = addBooking($pdo, addTrip($pdo, 30), 'pending');
        assertFailure($model->confirmRide(1, $booking), $statusMessage);
    },
    'rejects a trip that is not scheduled' => function (Booking $model, PDO $pdo) use ($statusMessage) {
        $booking = addBooking($pdo, addTrip($pdo, 30, 5, 'cancelled'), 'confirmed');
        assertFailure($model->confirmRide(1, $booking), $statusMessage);
    },
    "rejects another passenger's booking" => function (Booking $model, PDO $pdo) {
        $booking = addBooking($pdo, addTrip($pdo, 30), 'confirmed');
        assertFailure($model->confirmRide(2, $booking), 'Booking not found.');
    },
];

// ---------- Runner ----------

$lines = [];
$report = function (string $line = '') use (&$lines) {
    $lines[] = $line;
    echo $line, PHP_EOL;
};

$pdo = connectTestDatabase();
$passed = 0;
$failed = 0;

$report('Booking model unit tests');
$report('Run: ' . date('Y-m-d H:i:s T') . ' | PHP ' . PHP_VERSION
    . ' | Database ' . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION));

try {
    foreach ($tests as $function => $cases) {
        $report();
        $report($function);

        foreach ($cases as $name => $test) {
            try {
                resetData($pdo);
                $test(new Booking($pdo), $pdo);
                $passed++;
                $report("  [PASS] $name");
            } catch (Throwable $error) {
                $failed++;
                $report("  [FAIL] $name");
                $report('         ' . $error->getMessage());
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            }
        }
    }
} finally {
    $pdo->exec('DROP DATABASE IF EXISTS ' . TEST_DB);
}

$report();
$report('Total: ' . ($passed + $failed) . " | Passed: $passed | Failed: $failed");

file_put_contents(__DIR__ . '/test-results.txt', implode(PHP_EOL, $lines) . PHP_EOL);
exit($failed === 0 ? 0 : 1);
