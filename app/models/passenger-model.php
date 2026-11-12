<?php
    require_once __DIR__ . '/../core/db.php';

    function create_passenger($pdo, $userId, $data) {
        $stmt = $pdo->prepare(
            "INSERT INTO passenger (user_id, first_name, last_name, id_number, passenger_type, sex, college, document_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId, $data['firstName'], $data['lastName'], $data['idNumber'],
            $data['passengerType'], $data['sex'], $data['collegeDepartment'], null
        ]);
    }
?>