<?php
// Protect the admin booking page using the server-side account record.
function show_admin_bookings(): void
{
    require __DIR__ . '/../../public/api/session-management.php';
    restrict_access('admin');
    
    try {
        require __DIR__ . '/../core/db.php';
        $statement = $pdo->prepare("SELECT role, account_status FROM `user` WHERE user_id = :id LIMIT 1");
        $statement->execute(['id' => (int) $_SESSION['user_id']]);
        $account = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$account || strtolower((string) $account['role']) !== 'admin'
            || strtolower((string) $account['account_status']) !== 'active') {
            http_response_code(403);
            echo 'Administrator access required.';
            exit;
        }
        require __DIR__ . '/../views/admin-bookings.php';
    } catch (Throwable $error) {
        error_log('Admin booking page: ' . $error->getMessage());
        http_response_code(503);
        echo 'Admin bookings are temporarily unavailable.';
    }
}
