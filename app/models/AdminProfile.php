<?php
class AdminProfile
{
    public function __construct(private PDO $pdo) {}

    /**
     * List all passenger and driver profiles with vehicle and account details.
     */
    public function listProfiles(): array
    {
        $statement = $this->pdo->query("
            SELECT 
                u.user_id,
                u.email,
                u.role,
                u.account_status,
                p.passenger_id,
                p.id_number AS passenger_id_number,
                p.first_name AS passenger_first_name,
                p.last_name AS passenger_last_name,
                p.sex,
                p.college,
                p.passenger_type,
                p.document_path,
                d.driver_id,
                d.assigned_vehicle_id,
                d.first_name AS driver_first_name,
                d.last_name AS driver_last_name,
                d.duty_status,
                d.status_updated_at,
                v.plate_number,
                v.vehicle_model,
                v.capacity AS vehicle_capacity
            FROM `user` u
            LEFT JOIN passenger p ON u.user_id = p.user_id AND u.role = 'passenger'
            LEFT JOIN driver_profile d ON u.user_id = d.user_id AND u.role = 'driver'
            LEFT JOIN vehicle v ON d.assigned_vehicle_id = v.vehicle_id
            WHERE u.role IN ('passenger', 'driver')
            ORDER BY u.user_id DESC
        ");

        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        $profiles = [];

        foreach ($rows as $row) {
            $profiles[] = $this->formatProfileRecord($row);
        }

        return $profiles;
    }

    /**
     * Retrieve a single profile by user ID.
     */
    public function getProfileByUserId(int $userId): ?array
    {
        $statement = $this->pdo->prepare("
            SELECT 
                u.user_id,
                u.email,
                u.role,
                u.account_status,
                p.passenger_id,
                p.id_number AS passenger_id_number,
                p.first_name AS passenger_first_name,
                p.last_name AS passenger_last_name,
                p.sex,
                p.college,
                p.passenger_type,
                p.document_path,
                d.driver_id,
                d.assigned_vehicle_id,
                d.first_name AS driver_first_name,
                d.last_name AS driver_last_name,
                d.duty_status,
                d.status_updated_at,
                v.plate_number,
                v.vehicle_model,
                v.capacity AS vehicle_capacity
            FROM `user` u
            LEFT JOIN passenger p ON u.user_id = p.user_id AND u.role = 'passenger'
            LEFT JOIN driver_profile d ON u.user_id = d.user_id AND u.role = 'driver'
            LEFT JOIN vehicle v ON d.assigned_vehicle_id = v.vehicle_id
            WHERE u.user_id = :user_id
              AND u.role IN ('passenger', 'driver')
            LIMIT 1
        ");

        $statement->execute(['user_id' => $userId]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return $this->formatProfileRecord($row);
    }

    /**
     * List all vehicles for driver assignment options.
     */
    public function listVehicles(): array
    {
        $statement = $this->pdo->query("
            SELECT vehicle_id, plate_number, vehicle_model, capacity
            FROM vehicle
            ORDER BY vehicle_id ASC
        ");

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Check if an email is already used by another user.
     */
    public function isEmailTaken(string $email, ?int $excludeUserId = null): bool
    {
        $sql = "SELECT 1 FROM `user` WHERE email = :email";
        $params = ['email' => strtolower(trim($email))];

        if ($excludeUserId !== null) {
            $sql .= " AND user_id != :exclude_id";
            $params['exclude_id'] = $excludeUserId;
        }

        $sql .= " LIMIT 1";

        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);

        return (bool) $statement->fetchColumn();
    }

    /**
     * Check if a passenger ID number is already taken.
     */
    public function isIdNumberTaken(string $idNumber, ?int $excludeUserId = null): bool
    {
        $sql = "SELECT 1 FROM passenger WHERE id_number = :id_number";
        $params = ['id_number' => trim($idNumber)];

        if ($excludeUserId !== null) {
            $sql .= " AND user_id != :exclude_id";
            $params['exclude_id'] = $excludeUserId;
        }

        $sql .= " LIMIT 1";

        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);

        return (bool) $statement->fetchColumn();
    }

    /**
     * Create a new passenger profile.
     */
    public function createPassengerProfile(array $data): array
    {
        $email = strtolower(trim($data['email'] ?? ''));
        $firstName = trim($data['first_name'] ?? '');
        $lastName = trim($data['last_name'] ?? '');
        $idNumber = trim($data['id_number'] ?? '');
        $passengerType = trim($data['passenger_type'] ?? 'student');
        $sex = trim($data['sex'] ?? 'prefer-not-to-say');
        $college = trim($data['college'] ?? '');
        $documentPath = trim($data['document_path'] ?? '') ?: null;

        $this->validatePassengerInput($email, $firstName, $lastName, $idNumber, $college);

        if ($this->isEmailTaken($email)) {
            throw new InvalidArgumentException('That email is already assigned to a profile.');
        }

        if ($this->isIdNumberTaken($idNumber)) {
            throw new InvalidArgumentException('That ID number is already in use.');
        }

        $defaultPassword = password_hash('Password123!', PASSWORD_DEFAULT);

        try {
            $this->pdo->beginTransaction();

            $userStmt = $this->pdo->prepare("
                INSERT INTO `user` (email, password_hash, role, account_status)
                VALUES (:email, :password_hash, 'passenger', 'active')
            ");
            $userStmt->execute([
                'email' => $email,
                'password_hash' => $defaultPassword
            ]);

            $userId = (int) $this->pdo->lastInsertId();

            $passengerStmt = $this->pdo->prepare("
                INSERT INTO passenger (user_id, id_number, first_name, last_name, sex, college, passenger_type, document_path)
                VALUES (:user_id, :id_number, :first_name, :last_name, :sex, :college, :passenger_type, :document_path)
            ");
            $passengerStmt->execute([
                'user_id' => $userId,
                'id_number' => $idNumber,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'sex' => $sex,
                'college' => $college,
                'passenger_type' => $passengerType,
                'document_path' => $documentPath
            ]);

            $this->pdo->commit();

            return $this->getProfileByUserId($userId);
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    /**
     * Create a new driver profile.
     */
    public function createDriverProfile(array $data): array
    {
        $email = strtolower(trim($data['email'] ?? ''));
        $firstName = trim($data['first_name'] ?? '');
        $lastName = trim($data['last_name'] ?? '');
        $idNumber = trim($data['id_number'] ?? '');
        $vehicleId = filter_var($data['assigned_vehicle_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $dutyStatus = trim($data['duty_status'] ?? 'Active');
        $isVerified = ($data['verified'] ?? 'true') === 'true' || ($data['verified'] ?? true) === true;
        $accountStatus = $isVerified ? 'active' : 'pending';

        $this->validateDriverInput($email, $firstName, $lastName, $vehicleId, $dutyStatus);

        if ($this->isEmailTaken($email)) {
            throw new InvalidArgumentException('That email is already assigned to a profile.');
        }

        $defaultPassword = password_hash('Password123!', PASSWORD_DEFAULT);

        try {
            $this->pdo->beginTransaction();

            $userStmt = $this->pdo->prepare("
                INSERT INTO `user` (email, password_hash, role, account_status)
                VALUES (:email, :password_hash, 'driver', :account_status)
            ");
            $userStmt->execute([
                'email' => $email,
                'password_hash' => $defaultPassword,
                'account_status' => $accountStatus
            ]);

            $userId = (int) $this->pdo->lastInsertId();

            $driverStmt = $this->pdo->prepare("
                INSERT INTO driver_profile (user_id, assigned_vehicle_id, first_name, last_name, duty_status, status_updated_at)
                VALUES (:user_id, :vehicle_id, :first_name, :last_name, :duty_status, :status_updated_at)
            ");
            $driverStmt->execute([
                'user_id' => $userId,
                'vehicle_id' => $vehicleId ?: null,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'duty_status' => $dutyStatus,
                'status_updated_at' => date('Y-m-d H:i:s')
            ]);

            $this->pdo->commit();

            return $this->getProfileByUserId($userId);
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    /**
     * Update an existing passenger profile.
     */
    public function updatePassengerProfile(int $userId, array $data): array
    {
        $email = strtolower(trim($data['email'] ?? ''));
        $firstName = trim($data['first_name'] ?? '');
        $lastName = trim($data['last_name'] ?? '');
        $idNumber = trim($data['id_number'] ?? '');
        $passengerType = trim($data['passenger_type'] ?? 'student');
        $sex = trim($data['sex'] ?? 'prefer-not-to-say');
        $college = trim($data['college'] ?? '');
        $documentPath = trim($data['document_path'] ?? '') ?: null;

        $this->validatePassengerInput($email, $firstName, $lastName, $idNumber, $college);

        if ($this->isEmailTaken($email, $userId)) {
            throw new InvalidArgumentException('That email is already assigned to a profile.');
        }

        if ($this->isIdNumberTaken($idNumber, $userId)) {
            throw new InvalidArgumentException('That ID number is already in use.');
        }

        try {
            $this->pdo->beginTransaction();

            $userStmt = $this->pdo->prepare("
                UPDATE `user`
                SET email = :email
                WHERE user_id = :user_id AND role = 'passenger'
            ");
            $userStmt->execute([
                'email' => $email,
                'user_id' => $userId
            ]);

            $passengerStmt = $this->pdo->prepare("
                UPDATE passenger
                SET id_number = :id_number,
                    first_name = :first_name,
                    last_name = :last_name,
                    sex = :sex,
                    college = :college,
                    passenger_type = :passenger_type,
                    document_path = :document_path
                WHERE user_id = :user_id
            ");
            $passengerStmt->execute([
                'id_number' => $idNumber,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'sex' => $sex,
                'college' => $college,
                'passenger_type' => $passengerType,
                'document_path' => $documentPath,
                'user_id' => $userId
            ]);

            $this->pdo->commit();

            return $this->getProfileByUserId($userId);
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    /**
     * Update an existing driver profile.
     */
    public function updateDriverProfile(int $userId, array $data): array
    {
        $email = strtolower(trim($data['email'] ?? ''));
        $firstName = trim($data['first_name'] ?? '');
        $lastName = trim($data['last_name'] ?? '');
        $vehicleId = filter_var($data['assigned_vehicle_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $dutyStatus = trim($data['duty_status'] ?? 'Active');
        $isVerified = ($data['verified'] ?? 'true') === 'true' || ($data['verified'] ?? true) === true;
        $accountStatus = $isVerified ? 'active' : 'pending';

        $this->validateDriverInput($email, $firstName, $lastName, $vehicleId, $dutyStatus);

        if ($this->isEmailTaken($email, $userId)) {
            throw new InvalidArgumentException('That email is already assigned to a profile.');
        }

        try {
            $this->pdo->beginTransaction();

            $userStmt = $this->pdo->prepare("
                UPDATE `user`
                SET email = :email,
                    account_status = :account_status
                WHERE user_id = :user_id AND role = 'driver'
            ");
            $userStmt->execute([
                'email' => $email,
                'account_status' => $accountStatus,
                'user_id' => $userId
            ]);

            $driverStmt = $this->pdo->prepare("
                UPDATE driver_profile
                SET first_name = :first_name,
                    last_name = :last_name,
                    assigned_vehicle_id = :vehicle_id,
                    duty_status = :duty_status,
                    status_updated_at = :status_updated_at
                WHERE user_id = :user_id
            ");
            $driverStmt->execute([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'vehicle_id' => $vehicleId ?: null,
                'duty_status' => $dutyStatus,
                'status_updated_at' => date('Y-m-d H:i:s'),
                'user_id' => $userId
            ]);

            $this->pdo->commit();

            return $this->getProfileByUserId($userId);
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    /**
     * Delete a profile (passenger or driver).
     */
    public function deleteProfile(int $userId): bool
    {
        $profile = $this->getProfileByUserId($userId);
        if (!$profile) {
            throw new InvalidArgumentException('Profile not found.');
        }

        try {
            $this->pdo->beginTransaction();

            if ($profile['role'] === 'passenger') {
                $passengerId = (int) $profile['passenger_id'];

                // Remove or cancel passenger bookings
                $deleteBookings = $this->pdo->prepare("DELETE FROM booking_reservation WHERE passenger_id = :pid");
                $deleteBookings->execute(['pid' => $passengerId]);

                $deletePassenger = $this->pdo->prepare("DELETE FROM passenger WHERE user_id = :uid");
                $deletePassenger->execute(['uid' => $userId]);

                $deleteUser = $this->pdo->prepare("DELETE FROM `user` WHERE user_id = :uid");
                $deleteUser->execute(['uid' => $userId]);
            } elseif ($profile['role'] === 'driver') {
                $driverId = (int) $profile['driver_id'];

                $tripCheck = $this->pdo->prepare("SELECT COUNT(*) FROM trip_schedule WHERE driver_id = :did");
                $tripCheck->execute(['did' => $driverId]);
                $hasTrips = (int) $tripCheck->fetchColumn() > 0;

                if ($hasTrips) {
                    $deactivateUser = $this->pdo->prepare("UPDATE `user` SET account_status = 'inactive' WHERE user_id = :uid");
                    $deactivateUser->execute(['uid' => $userId]);

                    $deactivateDriver = $this->pdo->prepare("UPDATE driver_profile SET duty_status = 'Off-duty' WHERE user_id = :uid");
                    $deactivateDriver->execute(['uid' => $userId]);
                } else {
                    $deleteDriver = $this->pdo->prepare("DELETE FROM driver_profile WHERE user_id = :uid");
                    $deleteDriver->execute(['uid' => $userId]);

                    $deleteUser = $this->pdo->prepare("DELETE FROM `user` WHERE user_id = :uid");
                    $deleteUser->execute(['uid' => $userId]);
                }
            }

            $this->pdo->commit();
            return true;
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    private function validatePassengerInput(
        string $email,
        string $firstName,
        string $lastName,
        string $idNumber,
        string $college
    ): void {
        if ($firstName === '' || $lastName === '') {
            throw new InvalidArgumentException('Enter a first and last name.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Use a valid email address.');
        }
        if ($idNumber === '' || !preg_match('/^[a-zA-Z0-9-]{3,20}$/', $idNumber)) {
            throw new InvalidArgumentException('Use an ID with 3 to 20 letters, digits, or hyphens.');
        }
        if ($college === '') {
            throw new InvalidArgumentException('Enter the college or department.');
        }
    }

    private function validateDriverInput(
        string $email,
        string $firstName,
        string $lastName,
        $vehicleId,
        string $dutyStatus
    ): void {
        if ($firstName === '' || $lastName === '') {
            throw new InvalidArgumentException('Enter a first and last name.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Use a valid email address.');
        }
        $allowedStatuses = ['Active', 'On Departure', 'Inactive', 'Off-duty'];
        if (!in_array($dutyStatus, $allowedStatuses, true)) {
            throw new InvalidArgumentException('Choose a valid driver duty status.');
        }
        if ($vehicleId !== null && $vehicleId !== false) {
            $stmt = $this->pdo->prepare("SELECT 1 FROM vehicle WHERE vehicle_id = :id");
            $stmt->execute(['id' => $vehicleId]);
            if (!$stmt->fetchColumn()) {
                throw new InvalidArgumentException('Selected vehicle does not exist.');
            }
        }
    }

    private function formatProfileRecord(array $row): array
    {
        $role = $row['role'] ?? 'passenger';
        $isDriver = $role === 'driver';

        $firstName = $isDriver ? ($row['driver_first_name'] ?? '') : ($row['passenger_first_name'] ?? '');
        $lastName = $isDriver ? ($row['driver_last_name'] ?? '') : ($row['passenger_last_name'] ?? '');
        $fullName = trim($firstName . ' ' . $lastName) ?: 'User';

        $driverNumber = $isDriver && !empty($row['driver_id'])
            ? sprintf('DRV-%03d', (int) $row['driver_id'])
            : ($row['passenger_id_number'] ?? '');

        return [
            'user_id' => (int) $row['user_id'],
            'email' => $row['email'],
            'role' => $role,
            'account_status' => $row['account_status'],
            'first_name' => $firstName,
            'last_name' => $lastName,
            'full_name' => $fullName,
            'id_number' => $isDriver ? $driverNumber : ($row['passenger_id_number'] ?? ''),
            'passenger_id' => !empty($row['passenger_id']) ? (int) $row['passenger_id'] : null,
            'sex' => $row['sex'] ?? 'prefer-not-to-say',
            'college' => $row['college'] ?? '',
            'passenger_type' => $row['passenger_type'] ?? 'student',
            'document_path' => $row['document_path'] ?? '',
            'driver_id' => !empty($row['driver_id']) ? (int) $row['driver_id'] : null,
            'driver_number' => $driverNumber,
            'assigned_vehicle_id' => !empty($row['assigned_vehicle_id']) ? (int) $row['assigned_vehicle_id'] : null,
            'duty_status' => $row['duty_status'] ?? 'Active',
            'status_updated_at' => $row['status_updated_at'] ?? null,
            'vehicle_plate' => $row['plate_number'] ?? null,
            'vehicle_model' => $row['vehicle_model'] ?? null,
            'vehicle_capacity' => !empty($row['vehicle_capacity']) ? (int) $row['vehicle_capacity'] : null
        ];
    }
}
