<?php

// Database operations for the authenticated passenger's profile.
class Profile
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getByUserId(int $userId): ?array
    {
        $statement = $this->pdo->prepare("
            SELECT
                p.passenger_id,
                p.user_id,
                p.id_number,
                p.first_name,
                p.last_name,
                p.sex,
                p.college,
                p.passenger_type,
                p.document_path,
                u.email
            FROM passenger AS p
            INNER JOIN `user` AS u ON u.user_id = p.user_id
            WHERE u.user_id = :user_id
              AND u.role = 'passenger'
              AND u.account_status = 'active'
            LIMIT 1
        ");
        $statement->execute(['user_id' => $userId]);
        $profile = $statement->fetch(PDO::FETCH_ASSOC);
        return $profile ?: null;
    }

    public function updateByUserId(int $userId, array $values): ?array
    {
        $this->pdo->beginTransaction();
        try {
            // Re-check account ownership and status while updating.
            $check = $this->pdo->prepare("
                SELECT p.passenger_id
                FROM passenger AS p
                INNER JOIN `user` AS u ON u.user_id = p.user_id
                WHERE u.user_id = :user_id
                  AND u.role = 'passenger'
                  AND u.account_status = 'active'
                FOR UPDATE
            ");
            $check->execute(['user_id' => $userId]);
            $passengerId = $check->fetchColumn();
            if ($passengerId === false) {
                $this->pdo->rollBack();
                return null;
            }

            $update = $this->pdo->prepare("
                UPDATE passenger
                SET first_name = :first_name,
                    last_name = :last_name,
                    sex = :sex,
                    college = :college,
                    passenger_type = :passenger_type
                WHERE passenger_id = :passenger_id
            ");
            $update->execute([
                'first_name' => $values['first_name'],
                'last_name' => $values['last_name'],
                'sex' => $values['sex'],
                'college' => $values['college'],
                'passenger_type' => $values['passenger_type'],
                'passenger_id' => (int) $passengerId
            ]);
            $this->pdo->commit();
            return $this->getByUserId($userId);
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }
}
