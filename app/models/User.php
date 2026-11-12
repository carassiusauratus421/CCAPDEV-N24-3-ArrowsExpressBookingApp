
<?php

// User model for MySQL authentication.

class User
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Find an account by email.
    public function findByEmail(string $email): ?array
    {
        $query = "
            SELECT
                user_id,
                email,
                password_hash,
                role,
                account_status
            FROM `user`
            WHERE email = :email
            LIMIT 1
        ";

        $statement = $this->pdo->prepare($query);

        $statement->execute([
            'email' => $email
        ]);

        $user = $statement->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }
}
