<?php
// Database-backed administrator dashboard.
function show_admin_home(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (empty($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
        header('Location: login.php');
        exit;
    }

    try {
        require __DIR__ . '/../core/db.php';

        // A PHP session alone is not proof that the account is still authorized.
        $adminStatement = $pdo->prepare("SELECT email FROM `user`
            WHERE user_id = :user_id AND role = 'admin' AND account_status = 'active'
            LIMIT 1");
        $adminStatement->execute(['user_id' => (int) $_SESSION['user_id']]);
        $adminEmail = $adminStatement->fetchColumn();
        if ($adminEmail === false) {
            http_response_code(403);
            echo 'Administrator access denied.';
            return;
        }

        $vehicle_count = (int) $pdo->query('SELECT COUNT(*) FROM vehicle')->fetchColumn();
        $driver_count = (int) $pdo->query('SELECT COUNT(*) FROM driver_profile')->fetchColumn();
        $passenger_count = (int) $pdo->query('SELECT COUNT(*) FROM passenger')->fetchColumn();
        $pending_count = (int) $pdo->query("SELECT COUNT(*) FROM booking_reservation WHERE booking_status = 'pending'")->fetchColumn();

        // This summary deliberately covers only the next five scheduled departures.
        $summary = $pdo->query("SELECT
                COALESCE(SUM(GREATEST(0, capacity - available_slots)), 0) AS reserved_seat_count,
                COALESCE(SUM(capacity), 0) AS total_seat_capacity,
                COUNT(*) AS upcoming_trip_count
            FROM (
                SELECT v.capacity, t.available_slots
                FROM trip_schedule AS t
                INNER JOIN vehicle AS v ON v.vehicle_id = t.vehicle_id
                WHERE t.departure_datetime > NOW()
                  AND t.trip_status = 'scheduled'
                ORDER BY t.departure_datetime ASC, t.trip_id ASC
                LIMIT 5
            ) AS next_trips")->fetch(PDO::FETCH_ASSOC);

        $reserved_seat_count = (int) ($summary['reserved_seat_count'] ?? 0);
        $total_seat_capacity = (int) ($summary['total_seat_capacity'] ?? 0);
        $upcoming_trip_count = (int) ($summary['upcoming_trip_count'] ?? 0);
        $reserved_percent = $total_seat_capacity > 0
            ? max(0, min(100, (int) round($reserved_seat_count * 100 / $total_seat_capacity)))
            : 0;

        $vehicles = $pdo->query("SELECT
                CONCAT('DLSU Shuttle ', vehicle_id) AS shuttle,
                plate_number, vehicle_model, capacity
            FROM vehicle ORDER BY vehicle_id ASC LIMIT 4")->fetchAll(PDO::FETCH_ASSOC);

        $drivers = $pdo->query("SELECT
                CONCAT(d.first_name, ' ', d.last_name) AS name,
                CASE WHEN d.assigned_vehicle_id IS NULL THEN 'Unassigned'
                     ELSE CONCAT('DLSU Shuttle ', d.assigned_vehicle_id) END AS assigned_shuttle,
                COALESCE(u.account_status, 'Unknown') AS status
            FROM driver_profile AS d
            LEFT JOIN `user` AS u ON u.user_id = d.user_id
            ORDER BY d.driver_id ASC LIMIT 4")->fetchAll(PDO::FETCH_ASSOC);

        $bookings = $pdo->query("SELECT
                CONCAT('AE-', b.booking_id) AS reference,
                COALESCE(CONCAT(p.first_name, ' ', p.last_name), 'Unknown passenger') AS passenger_name,
                CONCAT(t.pickup_point, ' → ', t.dropoff_point) AS route,
                b.booking_status AS status
            FROM booking_reservation AS b
            LEFT JOIN passenger AS p ON p.passenger_id = b.passenger_id
            LEFT JOIN trip_schedule AS t ON t.trip_id = b.trip_id
            ORDER BY b.booking_id DESC LIMIT 4")->fetchAll(PDO::FETCH_ASSOC);

        require __DIR__ . '/../views/admin-home.php';
    } catch (Throwable $error) {
        error_log('Admin dashboard error: ' . $error->getMessage());
        http_response_code(500);
        echo 'Unable to load the admin dashboard. Check the PHP error log.';
    }
}
