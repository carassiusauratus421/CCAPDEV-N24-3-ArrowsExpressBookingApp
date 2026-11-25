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
            $file = $_FILES['verificationDocument'] ?? null;

            if (in_array('', $data)) {
                $error = 'Please fill in all fields.';
            } elseif (empty($file['name'])) {
                $error = 'Please upload your EAF.';
            } elseif (strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) !== 'pdf') {
                $error = 'Only PDF files are allowed.';
            } elseif ($data['password'] !== ($_POST['confirmPassword'] ?? '')) {
                $error = 'Passwords do not match.';
            } elseif (email_exists($pdo, $data['email'])) {
                $error = 'Email already registered.';
            } else {
                try {
                    $uploadDir = __DIR__ . '/../../storage/uploads/eaf/';
                    $filename = $data['idNumber'] . '.pdf';

                    if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
                        throw new Exception('Upload failed.');
                    }

                    $pdo->beginTransaction();
                    $userId = create_user($pdo, $data['email'], password_hash($data['password'], PASSWORD_DEFAULT));
                    create_passenger($pdo, $userId, $data);
                    $pdo->commit();
                    header("Location: index.php");
                    exit;
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) $pdo->rollBack();
                    $error = 'Signup failed: ' . $e->getMessage();
                }
            }
        }

        require __DIR__ . '/../views/signup.php';
    }
?>