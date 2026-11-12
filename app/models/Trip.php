
<?php

// Trip model for retrieving shuttle schedules from MySQL.

class Trip
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Retrieve all available pickup and drop-off routes.
    public function getRoutes(): array
    {
        $query = "
            SELECT DISTINCT
                pickup_point,
                dropoff_point
            FROM trip_schedule
            WHERE trip_status = 'scheduled'
                AND pickup_point IS NOT NULL
                AND dropoff_point IS NOT NULL
            ORDER BY pickup_point, dropoff_point
        ";

        $statement = $this->pdo->query($query);

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    // Retrieve the next scheduled departure date.
    public function getNextAvailableDate(): ?string
    {
        $query = "
            SELECT DATE_FORMAT(
                MIN(departure_datetime),
                '%Y-%m-%d'
            )
            FROM trip_schedule
            WHERE trip_status = 'scheduled'
                AND departure_datetime >= CURDATE()
        ";

        $statement = $this->pdo->query($query);
        $date = $statement->fetchColumn();

        return $date === false || $date === null
            ? null
            : (string) $date;
    }

    // Retrieve scheduled trips for a selected date.
    public function getTripsByDate(string $date): array
    {
        $startDate = $date . ' 00:00:00';

        $endDate = (new DateTimeImmutable($date))
            ->modify('+1 day')
            ->format('Y-m-d 00:00:00');

        $query = "
            SELECT
                t.trip_id,
                t.vehicle_id,
                t.driver_id,
                t.pickup_point,
                t.dropoff_point,
                DATE_FORMAT(
                    t.departure_datetime,
                    '%Y-%m-%d %H:%i:%s'
                ) AS departure_datetime,
                t.trip_status,
                t.available_slots,
                v.plate_number,
                v.vehicle_model,
                v.capacity
            FROM trip_schedule AS t
            INNER JOIN vehicle AS v
                ON t.vehicle_id = v.vehicle_id
            WHERE t.departure_datetime >= :start_date
                AND t.departure_datetime < :end_date
                AND t.trip_status = 'scheduled'
            ORDER BY
                t.departure_datetime ASC,
                t.trip_id ASC
        ";

        $statement = $this->pdo->prepare($query);

        $statement->execute([
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }
}
