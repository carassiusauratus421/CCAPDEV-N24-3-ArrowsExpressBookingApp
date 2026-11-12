
<?php

// Booking model for retrieving passenger reservations from MySQL.

class Booking
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Find the passenger associated with a user account.
    public function getPassengerByUserId(int $userId): ?array
    {
        $query = "
            SELECT
                p.passenger_id,
                p.user_id,
                p.first_name,
                p.last_name,
                p.id_number
            FROM passenger AS p
            INNER JOIN `user` AS u
                ON p.user_id = u.user_id
            WHERE p.user_id = :user_id
                AND u.role = 'passenger'
                AND u.account_status = 'active'
            LIMIT 1
        ";

        $statement = $this->pdo->prepare($query);

        $statement->execute([
            'user_id' => $userId
        ]);

        $passenger = $statement->fetch(PDO::FETCH_ASSOC);

        return $passenger ?: null;
    }

    // Retrieve all reservations belonging to one passenger.
    public function getBookingsByPassengerId(int $passengerId): array
    {
        $query = "
            SELECT
                br.booking_id,
                br.passenger_id,
                br.trip_id,
                br.booking_status,
                DATE_FORMAT(
                    br.passenger_confirmed,
                    '%Y-%m-%d %H:%i:%s'
                ) AS passenger_confirmed,
                DATE_FORMAT(
                    br.timestamp_created,
                    '%Y-%m-%d %H:%i:%s'
                ) AS timestamp_created,

                ts.pickup_point,
                ts.dropoff_point,
                DATE_FORMAT(
                    ts.departure_datetime,
                    '%Y-%m-%d %H:%i:%s'
                ) AS departure_datetime,
                ts.trip_status,
                ts.available_slots,

                v.vehicle_model,
                v.plate_number,
                v.capacity,

                dp.first_name AS driver_first_name,
                dp.last_name AS driver_last_name

            FROM booking_reservation AS br

            INNER JOIN trip_schedule AS ts
                ON br.trip_id = ts.trip_id

            INNER JOIN vehicle AS v
                ON ts.vehicle_id = v.vehicle_id

            LEFT JOIN driver_profile AS dp
                ON ts.driver_id = dp.driver_id

            WHERE br.passenger_id = :passenger_id

            ORDER BY
                ts.departure_datetime DESC,
                br.booking_id DESC
        ";

        $statement = $this->pdo->prepare($query);

        $statement->execute([
            'passenger_id' => $passengerId
        ]);

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }
}
