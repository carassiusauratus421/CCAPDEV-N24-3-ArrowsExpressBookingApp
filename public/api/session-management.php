<?php
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    // $role can be 'admin', 'driver', or 'passenger'
    function restrict_access($role) {
        if (empty($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== $role) {
            header('Location: index.php');
            exit;
        }
    }
?>

