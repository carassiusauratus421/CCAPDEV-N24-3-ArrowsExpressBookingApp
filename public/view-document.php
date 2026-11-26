<?php
session_start();

if (($_SESSION['role'] ?? '') !== 'admin') {
    exit('Forbidden');
}

$path = __DIR__ . '/../storage/uploads/eaf/' . basename($_GET['id'] ?? '') . '.pdf';

if (!is_file($path)) {
    exit('Not found');
}

header('Content-Type: application/pdf');
header('Content-Disposition: inline');
readfile($path);