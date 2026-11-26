<?php
    function show_notifications() {
        require __DIR__ . '/../../public/api/session-management.php';
        restrict_access('passenger');

        require __DIR__ . '/../views/notifications.php';
    }
?>