<?php
function show_admin_profiles(): void
{
    require __DIR__ . '/../../public/api/session-management.php';
    restrict_access('admin');

    try {
        require_once __DIR__ . '/../core/db.php';

        $statement = $pdo->prepare("SELECT role, account_status FROM `user` WHERE user_id = :id LIMIT 1");
        $statement->execute(['id' => (int) $_SESSION['user_id']]);
        $account = $statement->fetch(PDO::FETCH_ASSOC);

        if (
            !$account ||
            strtolower((string) $account['role']) !== 'admin' ||
            strtolower((string) $account['account_status']) !== 'active'
        ) {
            http_response_code(403);
            echo 'Administrator access required.';
            exit;
        }

        require __DIR__ . '/../views/admin-profiles.php';
    } catch (Throwable $error) {
        error_log('Admin profiles page: ' . $error->getMessage());
        http_response_code(503);
        echo 'Admin user profiles are temporarily unavailable.';
    }
}