<?php

// Driver model for driver profiles and duty status.

class Driver
{
    public const ALLOWED_DUTY_STATUSES = [
        'On Departure',
        'Active',
        'Inactive',
        'Off-duty'
    ];

    /**
     * Normalize status string.
     */
    public static function normalizeDutyStatus(string $status): ?string
    {
        $map = [
            'on departure' => 'On Departure',
            'on-departure' => 'On Departure',
            'active' => 'Active',
            'inactive' => 'Inactive',
            'off-duty' => 'Off-duty',
            'off duty' => 'Off-duty'
        ];
        $key = strtolower(trim($status));
        return $map[$key] ?? null;
    }

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Find driver by associated user_id.
     */
    public function getDriverByUserId(int $userId): ?array
    {
        $query = "
            SELECT
                dp.driver_id,
                dp.user_id,
                dp.assigned_vehicle_id,
                dp.first_name,
                dp.last_name,
                dp.duty_status,
                dp.status_updated_at,
                u.email,
                u.role,
                u.account_status,
                v.vehicle_id,
                v.plate_number,
                v.vehicle_model,
                v.capacity
            FROM `driver_profile` AS dp
            INNER JOIN `user` AS u
                ON dp.user_id = u.user_id
            LEFT JOIN `vehicle` AS v
                ON dp.assigned_vehicle_id = v.vehicle_id
            WHERE dp.user_id = :user_id
                AND u.account_status = 'active'
                AND u.role = 'driver'
            LIMIT 1
        ";

        $statement = $this->pdo->prepare($query);
        $statement->execute([
            'user_id' => $userId
        ]);

        $row = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return $this->formatDriverRecord($row);
    }

    /**
     * Find an driver by driver_id.
     */
    public function getDriverById(int $driverId): ?array
    {
        $query = "
            SELECT
                dp.driver_id,
                dp.user_id,
                dp.assigned_vehicle_id,
                dp.first_name,
                dp.last_name,
                dp.duty_status,
                dp.status_updated_at,
                u.email,
                u.role,
                u.account_status,
                v.vehicle_id,
                v.plate_number,
                v.vehicle_model,
                v.capacity
            FROM `driver_profile` AS dp
            INNER JOIN `user` AS u
                ON dp.user_id = u.user_id
            LEFT JOIN `vehicle` AS v
                ON dp.assigned_vehicle_id = v.vehicle_id
            WHERE dp.driver_id = :driver_id
                AND u.account_status = 'active'
                AND u.role = 'driver'
            LIMIT 1
        ";

        $statement = $this->pdo->prepare($query);
        $statement->execute([
            'driver_id' => $driverId
        ]);

        $row = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return $this->formatDriverRecord($row);
    }

    /**
     * Update driver duty status.
     */
    public function updateDutyStatus(int $driverId, string $status): bool
    {
        $canonical = self::normalizeDutyStatus($status);
        if ($canonical === null) {
            throw new InvalidArgumentException('Invalid duty status value.');
        }

        $query = "
            UPDATE `driver_profile`
            SET
                duty_status = :duty_status,
                status_updated_at = CURRENT_TIMESTAMP
            WHERE driver_id = :driver_id
        ";

        $statement = $this->pdo->prepare($query);
        return $statement->execute([
            'duty_status' => $canonical,
            'driver_id' => $driverId
        ]);
    }

    /**
     * Format a database row into a structured driver array.
     */
    private function formatDriverRecord(array $row): array
    {
        $driverId = (int) $row['driver_id'];
        $driverNumber = sprintf('DRV-%03d', $driverId);

        $vehicle = null;
        if (!empty($row['vehicle_id'])) {
            $vehicle = [
                'vehicle_id' => (int) $row['vehicle_id'],
                'plate_number' => $row['plate_number'] ?? '',
                'vehicle_model' => $row['vehicle_model'] ?? '',
                'capacity' => isset($row['capacity']) ? (int) $row['capacity'] : 0
            ];
        }

        return [
            'driver_id' => $driverId,
            'user_id' => (int) $row['user_id'],
            'driver_number' => $driverNumber,
            'first_name' => $row['first_name'] ?? '',
            'last_name' => $row['last_name'] ?? '',
            'email' => $row['email'] ?? '',
            'role' => $row['role'] ?? 'driver',
            'account_status' => $row['account_status'] ?? 'active',
            'duty_status' => $row['duty_status'] ?? 'Active',
            'status_updated_at' => $row['status_updated_at'] ?? null,
            'vehicle' => $vehicle
        ];
    }
}
