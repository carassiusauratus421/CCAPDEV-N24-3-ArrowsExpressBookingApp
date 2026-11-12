<?php
    function show_admin_home() {
        require __DIR__ . '/../core/db.php';

        $sql = $pdo->query('SELECT COUNT(*) AS vehicle_count FROM vehicle;');
        $row = $sql->fetch(PDO::FETCH_ASSOC);
        $vehicle_count = $row['vehicle_count'];

        $sql = $pdo->query('SELECT COUNT(*) AS driver_count FROM driver_profile;');
        $row = $sql->fetch(PDO::FETCH_ASSOC);
        $driver_count = $row['driver_count'];

        $sql = $pdo->query('SELECT COUNT(*) AS passenger_count FROM passenger;');
        $row = $sql->fetch(PDO::FETCH_ASSOC);
        $passenger_count = $row['passenger_count'];


        $sql = $pdo->query('SELECT 
                    SUM(capacity - available_slots) AS reserved_seat_count, 
                    SUM(capacity) AS total_seat_capacity, 
                    COUNT(capacity) AS upcoming_trip_count 
                FROM (
                    SELECT t.available_slots, v.capacity 
                    FROM trip_schedule t LEFT JOIN vehicle v 
                    ON t.vehicle_id = v.vehicle_id 
                    WHERE NOW() < t.departure_datetime 
                    ORDER BY departure_datetime 
                    LIMIT 5
                ) 
                as upcoming_trips;');
        $row = $sql->fetch(PDO::FETCH_ASSOC);
        $reserved_seat_count = $row['reserved_seat_count'];
        $total_seat_capacity = $row['total_seat_capacity'];
        $upcoming_trip_count = $row['upcoming_trip_count'];
        $reserved_percent = ($total_seat_capacity == 0) ? 
            "0" : (string) round(100 * $reserved_seat_count / $total_seat_capacity);


        $sql = $pdo->query("SELECT *, CONCAT('DLSU Shuttle ', vehicle_id) AS shuttle 
                FROM vehicle 
                LIMIT 4;");
        $vehicles = $sql->fetchAll(PDO::FETCH_ASSOC);

        $sql = $pdo->query("SELECT 
                    CONCAT(d.first_name, ' ', d.last_name) AS name, 
                    CONCAT('DLSU Shuttle ', d.assigned_vehicle_id) AS assigned_shuttle, 
                    CONCAT(UPPER(SUBSTRING(u.account_status, 1, 1)), LOWER(SUBSTRING(u.account_status, 2))) AS status 
                FROM driver_profile d 
                    LEFT JOIN vehicle v ON d.assigned_vehicle_id = v.vehicle_id 
                    LEFT JOIN user u    ON d.user_id = u.user_id 
                ORDER BY d.driver_id 
                LIMIT 4;");
        $drivers = $sql->fetchAll(PDO::FETCH_ASSOC);

        $sql = $pdo->query("SELECT
                    CONCAT('AE-', b.booking_id) AS reference, 
                    CONCAT(p.first_name, ' ', p.last_name) AS passenger_name, 
                    CONCAT(t.pickup_point, ' -> ', t.dropoff_point) AS route, 
                    CONCAT(UPPER(SUBSTRING(b.booking_status, 1, 1)), LOWER(SUBSTRING(b.booking_status, 2))) AS status 
                FROM booking_reservation b 
                    LEFT JOIN passenger p       ON b.passenger_id = p.passenger_id 
                    LEFT JOIN trip_schedule t   ON b.trip_id = t.trip_id 
                ORDER BY b.booking_id
                LIMIT 4;");
        $bookings = $sql->fetchAll(PDO::FETCH_ASSOC);


        require __DIR__ . '/../views/admin-home.php';
    }
?>