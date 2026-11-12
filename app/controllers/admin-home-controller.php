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


        require __DIR__ . '/../views/admin-home.php';
    }
?>