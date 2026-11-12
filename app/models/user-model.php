<?php
    require_once __DIR__ . '/../core/db.php';

    function email_exists($email) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT 1 FROM `user` WHERE email = ?");
        $stmt->execute([$email]);
        return (bool) $stmt->fetchColumn();
    }

    function create_user($email, $passwordHash) {
        global $pdo;
        $stmt = $pdo->prepare(
            "INSERT INTO `user` (email, password_hash, role, account_status) VALUES (?, ?, 'passenger', 'pending')"
        );
        $stmt->execute([$email, $passwordHash]);
        return $pdo->lastInsertId();
    }
?>