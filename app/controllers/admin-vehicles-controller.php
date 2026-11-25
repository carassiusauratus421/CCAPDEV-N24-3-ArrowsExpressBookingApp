<?php
// Vehicle management
function show_admin_vehicles(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (empty($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
        header('Location: login.php');
        exit;
    }

    try {
        require __DIR__ . '/../core/db.php';

        // A PHP session alone is not proof that the account is still authorized.
        $adminStatement = $pdo->prepare("SELECT email FROM `user`
            WHERE user_id = :user_id AND role = 'admin' AND account_status = 'active'
            LIMIT 1");
        $adminStatement->execute(['user_id' => (int) $_SESSION['user_id']]);
        $adminEmail = $adminStatement->fetchColumn();
        if ($adminEmail === false) {
            http_response_code(403);
            echo 'Administrator access denied.';
            return;
        }

        // Receive inputs from admin-vehicles.php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = [
                'plate'    => trim($_POST['plate'] ?? ''),
                'model'    => trim($_POST['model'] ?? ''),
                'capacity' => trim($_POST['capacity'] ?? ''),
            ];

            $id = trim($_POST['id'] ?? '');

            if (in_array('', $data, true)) {
                $error = 'Please fill in all fields.';
            } else {
                try {
                    // Add vehicle
                    if ($id === '') {
                        $stmt = $pdo->prepare(
                            "INSERT INTO vehicle (plate_number, vehicle_model, capacity) VALUES (?, ?, ?);"
                        );
                        $stmt->execute([$data['plate'], $data['model'], $data['capacity']]);
                    }
                    // Edit vehicle
                    else {
                        $stmt = $pdo->prepare(
                            "UPDATE vehicle SET plate_number = ?, vehicle_model = ?, capacity = ? WHERE vehicle_id = ?;"
                        );
                        $stmt->execute([$data['plate'], $data['model'], $data['capacity'], $id]);
                    }

                    header("Location: admin-vehicles.php");
                    exit;
                } catch (PDOException $e) {
                    error_log($e->getMessage());
                    $error = 'Could not add vehicle. Please try again.';
                }
            }
        }

        // Display vehicles
        $vehicles = $pdo->query("SELECT
                vehicle_id, plate_number, vehicle_model, capacity
            FROM vehicle ORDER BY vehicle_id ASC")->fetchAll(PDO::FETCH_ASSOC);

        require __DIR__ . '/../views/admin-vehicles.php';
    } catch (Throwable $error) {
        error_log('Admin dashboard error: ' . $error->getMessage());
        http_response_code(500);
        echo 'Unable to load the admin dashboard. Check the PHP error log.';
    }
}
?>