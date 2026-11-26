<?php
    function show_my_bookings() {
        require __DIR__ . '/../../public/api/session-management.php';
        restrict_access('passenger');

        require __DIR__ . '/../views/my-bookings.php';
    }
?>