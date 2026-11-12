<?php
    require_once __DIR__ . '/../models/user-model.php';

    function show_admin_accounts($pdo) {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (($_SESSION['role'] ?? '') !== 'admin') {
            header("Location: index.php");
            exit;
        }

        $error = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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

        $admins = get_admins($pdo);
        require __DIR__ . '/../views/admin-accounts.php';
    }
?>