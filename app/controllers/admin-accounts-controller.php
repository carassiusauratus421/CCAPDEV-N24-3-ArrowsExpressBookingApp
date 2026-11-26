<?php
    require_once __DIR__ . '/../models/user-model.php';

    function show_admin_accounts($pdo) {
        require __DIR__ . '/../../public/api/session-management.php';
        restrict_access('admin');

        $error = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (isset($_POST['deleteUserId'])) {
                $deleteId = $_POST['deleteUserId'];

                if ($deleteId == ($_SESSION['user_id'] ?? null)) {
                    $error = 'You cannot delete your own account.';
                } else {
                    try {
                        delete_user($pdo, $deleteId);
                        header("Location: admin-accounts.php");
                        exit;
                    } catch (PDOException $e) {
                        error_log($e->getMessage());
                        $error = 'Could not delete admin. Please try again.';
                    }
                }
            } else {
                $data = [
                    'email'    => trim($_POST['email'] ?? ''),
                    'password' => $_POST['password'] ?? '',
                ];

                if (in_array('', $data, true)) {
                    $error = 'Please fill in all fields.';
                } elseif ($data['password'] !== ($_POST['confirmPassword'] ?? '')) {
                    $error = 'Passwords do not match.';
                } elseif (email_exists($pdo, $data['email'])) {
                    $error = 'Email already registered.';
                } else {
                    try {
                        create_admin($pdo, $data['email'], password_hash($data['password'], PASSWORD_DEFAULT));
                        header("Location: admin-accounts.php");
                        exit;
                    } catch (PDOException $e) {
                        error_log($e->getMessage());
                        $error = 'Could not create admin. Please try again.';
                    }
                }
            }
        }

        $admins = get_admins($pdo);
        require __DIR__ . '/../views/admin-accounts.php';
    }
?>