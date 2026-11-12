<?php
function show_driver_home(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $userId = $_SESSION['user_id'] ?? null;
    $role = $_SESSION['role'] ?? null;

    if (
        empty($userId) ||
        filter_var($userId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false ||
        $role !== 'driver'
    ) {
        header('Location: index.php', true, 303);
        exit;
    }

    try {
        require_once __DIR__ . '/../core/db.php';
        $statement = $pdo->prepare("SELECT role, account_status FROM `user` WHERE user_id = :id LIMIT 1");
        $statement->execute(['id' => (int) $userId]);
        $account = $statement->fetch(PDO::FETCH_ASSOC);

        if (
            !$account ||
            strtolower((string) $account['role']) !== 'driver' ||
            strtolower((string) $account['account_status']) !== 'active'
        ) {
            header('Location: index.php', true, 303);
            exit;
        }

        require __DIR__ . '/../views/driver-home.php';
    } catch (Throwable $error) {
        error_log('Driver home controller: ' . $error->getMessage());
        header('Location: index.php', true, 303);
        exit;
    }
}