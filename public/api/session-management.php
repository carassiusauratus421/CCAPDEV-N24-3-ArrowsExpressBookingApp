<?php
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    // $role can be 'admin', 'driver', or 'passenger'
    function restrict_access($role) {
        $current_role = ($_SESSION['role'] ?? '');
        
        $homepage_redirect = match ($current_role) {
            'admin'     => 'Location: admin-home.php',
            'driver'    => 'Location: driver-home.php',
            'passenger' => 'Location: home.php',
            default     => 'Location: index.php',
        };

        if (empty($_SESSION['user_id'])) {
            header('Location: index.php');
            exit();
        }
        
        if ($current_role !== $role) {
            header($homepage_redirect);
            exit();
        }
    }
?>