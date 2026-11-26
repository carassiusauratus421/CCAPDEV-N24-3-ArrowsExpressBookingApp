<?php
    function show_passenger_guide() {
        require __DIR__ . '/../../public/api/session-management.php';
        restrict_access('passenger');

        require __DIR__ . '/../views/passenger-guide.php';
    }
?>