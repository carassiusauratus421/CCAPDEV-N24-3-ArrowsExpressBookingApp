<?php
    require_once __DIR__ . '/../app/core/db.php';
    require __DIR__ . '/../app/controllers/admin-accounts-controller.php';
    
    show_admin_accounts($pdo);
?>