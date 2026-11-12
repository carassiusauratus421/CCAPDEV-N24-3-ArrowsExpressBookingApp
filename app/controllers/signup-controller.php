<?php
    require_once __DIR__ . '/../models/user-model.php';
    require_once __DIR__ . '/../models/passenger-model.php';

    function show_signup($pdo) {
        $error = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = [
                'firstName'         => trim($_POST['firstName'] ?? ''),
                'lastName'          => trim($_POST['lastName'] ?? ''),
                'email'             => trim($_POST['email'] ?? ''),
                'idNumber'          => trim($_POST['idNumber'] ?? ''),
                'passengerType'     => $_POST['passengerType'] ?? '',
                'sex'               => $_POST['sex'] ?? '',
                'collegeDepartment' => trim($_POST['collegeDepartment'] ?? ''),
                'password'          => $_POST['password'] ?? '',
            ];

            if (in_array('', $data)) {
                $error = 'Please fill in all fields.';
            } elseif ($data['password'] !== ($_POST['confirmPassword'] ?? '')) {
                $error = 'Passwords do not match.';
            } elseif (email_exists($pdo, $data['email'])) {
                $error = 'Email already registered.';
            } else {
                try {
                    $pdo->beginTransaction();
                    $userId = create_user($pdo, $data['email'], password_hash($data['password'], PASSWORD_DEFAULT));
                    create_passenger($pdo, $userId, $data);
                    $pdo->commit();
                    header("Location: index.php");
                    exit;
                } catch (PDOException $e) {
                    $pdo->rollBack();
                    $error = 'Signup failed: ' . $e->getMessage();
                }
            }
        }

        require __DIR__ . '/../views/signup.php';
    }
?>