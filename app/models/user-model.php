<?php
    require_once __DIR__ . '/../core/db.php';

    function email_exists($pdo, $email) {
        $stmt = $pdo->prepare("SELECT 1 FROM `user` WHERE email = ?");
        $stmt->execute([$email]);
        return (bool) $stmt->fetchColumn();
    }

    function create_user($pdo, $email, $passwordHash) {
        $stmt = $pdo->prepare(
            "INSERT INTO `user` (email, password_hash, role, account_status) VALUES (?, ?, 'passenger', 'pending')"
        );
        $stmt->execute([$email, $passwordHash]);
        return $pdo->lastInsertId();
    }

    function create_admin($pdo, $email, $passwordHash) {
        $stmt = $pdo->prepare(
            "INSERT INTO `user` (email, password_hash, role, account_status) VALUES (?, ?, 'admin', 'active')"
        );
        $stmt->execute([$email, $passwordHash]);
    }

    function get_admins($pdo) {
        $stmt = $pdo->query("SELECT email FROM `user` WHERE role = 'admin'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
?>