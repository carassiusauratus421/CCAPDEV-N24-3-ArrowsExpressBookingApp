<?php
    function show_schedules() {
        require __DIR__ . '/../../public/api/session-management.php';
        restrict_access('passenger');

        require __DIR__ . '/../views/schedules.php';
    }
?>