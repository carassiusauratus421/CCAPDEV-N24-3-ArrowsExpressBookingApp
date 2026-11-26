<?php
    function show_home() {
        require __DIR__ . '/../../public/api/session-management.php';
        restrict_access('passenger');

        require __DIR__ . '/../views/home.php';
    }
?>