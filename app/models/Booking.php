
<?php

// Booking model for passenger reservation operations.

class Booking
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Find the active passenger associated with a user account.
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

    // Retrieve the authenticated passenger's reservations.
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

    // Submit a booking request that requires admin approval.
    public function createBooking(int $passengerId, int $tripId): array
    {
        try {
            $this->pdo->beginTransaction();

            // Lock the trip during availability checks.
            $tripStatement = $this->pdo->prepare("
                SELECT
                    trip_id,
                    trip_status,
                    available_slots,
                    departure_datetime > NOW() AS is_future
                FROM trip_schedule
                WHERE trip_id = :trip_id
                FOR UPDATE
            ");

            $tripStatement->execute([
                'trip_id' => $tripId
            ]);

            $trip = $tripStatement->fetch(PDO::FETCH_ASSOC);

            if (!$trip) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'The selected trip does not exist.'
                ];
            }

            // Only allow requests for upcoming scheduled trips.
            if (
                $trip['trip_status'] !== 'scheduled' ||
                (int) $trip['is_future'] !== 1
            ) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'This trip is no longer available.'
                ];
            }

            // Check whether the trip has available seats.
            if ((int) $trip['available_slots'] <= 0) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'This trip is fully booked.'
                ];
            }

            // Prevent duplicate pending or confirmed bookings.
            $duplicateStatement = $this->pdo->prepare("
                SELECT booking_id
                FROM booking_reservation
                WHERE passenger_id = :passenger_id
                    AND trip_id = :trip_id
                    AND booking_status IN (
                        'pending',
                        'confirmed',
                        'on_hold'
                    )
                LIMIT 1
            ");

            $duplicateStatement->execute([
                'passenger_id' => $passengerId,
                'trip_id' => $tripId
            ]);

            if ($duplicateStatement->fetchColumn() !== false) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' =>
                        'You already have an active booking ' .
                        'request for this trip.'
                ];
            }

            // Store the booking as pending admin approval.
            $insertStatement = $this->pdo->prepare("
                INSERT INTO booking_reservation (
                    trip_id,
                    passenger_id,
                    booking_status,
                    timestamp_created
                )
                VALUES (
                    :trip_id,
                    :passenger_id,
                    'pending',
                    NOW()
                )
            ");

            $insertStatement->execute([
                'trip_id' => $tripId,
                'passenger_id' => $passengerId
            ]);

            $bookingId = (int) $this->pdo->lastInsertId();

            // Provisionally reserve one seat.
            // Admin approval must not deduct another seat.
            $seatStatement = $this->pdo->prepare("
                UPDATE trip_schedule
                SET available_slots = available_slots - 1
                WHERE trip_id = :trip_id
                    AND available_slots > 0
            ");

            $seatStatement->execute([
                'trip_id' => $tripId
            ]);

            if ($seatStatement->rowCount() !== 1) {
                throw new RuntimeException(
                    'Unable to reserve a seat.'
                );
            }

            $this->pdo->commit();

            return [
                'success' => true,
                'message' =>
                    'Your booking request has been submitted. ' .
                    'Please wait for admin approval.',
                'booking_id' => $bookingId,
                'trip_id' => $tripId,
                'booking_status' => 'pending'
            ];

        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $error;
        }
    }

    // Cancel an eligible booking and return its reserved seat.
    public function cancelBooking(int $passengerId, int $bookingId): array
    {
        try {
            $this->pdo->beginTransaction();

            // Identify the trip belonging to this passenger's booking.
            $lookupStatement = $this->pdo->prepare("
                SELECT trip_id
                FROM booking_reservation
                WHERE booking_id = :booking_id
                    AND passenger_id = :passenger_id
                LIMIT 1
            ");

            $lookupStatement->execute([
                'booking_id' => $bookingId,
                'passenger_id' => $passengerId
            ]);

            $tripId = $lookupStatement->fetchColumn();

            if ($tripId === false) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'Booking not found.'
                ];
            }

            $tripId = (int) $tripId;

            // Lock the trip before locking the reservation.
            $tripStatement = $this->pdo->prepare("
                SELECT
                    ts.trip_id,
                    ts.available_slots,
                    ts.departure_datetime > NOW() AS is_future,
                    v.capacity
                FROM trip_schedule AS ts
                INNER JOIN vehicle AS v
                    ON ts.vehicle_id = v.vehicle_id
                WHERE ts.trip_id = :trip_id
                FOR UPDATE
            ");

            $tripStatement->execute([
                'trip_id' => $tripId
            ]);

            $trip = $tripStatement->fetch(PDO::FETCH_ASSOC);

            if (!$trip) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'The associated trip was not found.'
                ];
            }

            // Lock the booking and verify its current status.
            $bookingStatement = $this->pdo->prepare("
                SELECT
                    booking_id,
                    trip_id,
                    passenger_id,
                    booking_status
                FROM booking_reservation
                WHERE booking_id = :booking_id
                    AND passenger_id = :passenger_id
                FOR UPDATE
            ");

            $bookingStatement->execute([
                'booking_id' => $bookingId,
                'passenger_id' => $passengerId
            ]);

            $booking = $bookingStatement->fetch(PDO::FETCH_ASSOC);

            if (
                !$booking ||
                (int) $booking['trip_id'] !== $tripId
            ) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'Booking not found.'
                ];
            }

            // Both pending and confirmed bookings reserve seats.
            $cancellableStatuses = [
                'pending',
                'confirmed',
                'on_hold'
            ];

            if (
                !in_array(
                    $booking['booking_status'],
                    $cancellableStatuses,
                    true
                )
            ) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'This booking cannot be cancelled.'
                ];
            }

            // Only allow cancellation before departure.
            if ((int) $trip['is_future'] !== 1) {
                $this->pdo->rollBack();

                return [
                    'success' => false,
                    'message' =>
                        'Trips that have departed cannot be cancelled.'
                ];
            }

            if (
                (int) $trip['available_slots'] >=
                (int) $trip['capacity']
            ) {
                throw new RuntimeException(
                    'Seat availability is inconsistent.'
                );
            }

            // Preserve the record as cancelled.
            $cancelStatement = $this->pdo->prepare("
                UPDATE booking_reservation
                SET booking_status = 'cancelled'
                WHERE booking_id = :booking_id
                    AND passenger_id = :passenger_id
                    AND booking_status IN (
                        'pending',
                        'confirmed',
                        'on_hold'
                    )
            ");

            $cancelStatement->execute([
                'booking_id' => $bookingId,
                'passenger_id' => $passengerId
            ]);

            if ($cancelStatement->rowCount() !== 1) {
                throw new RuntimeException(
                    'Unable to update the booking.'
                );
            }

            // Restore exactly one reserved seat.
            $seatStatement = $this->pdo->prepare("
                UPDATE trip_schedule
                SET available_slots = available_slots + 1
                WHERE trip_id = :trip_id
                    AND available_slots < :capacity
            ");

            $seatStatement->execute([
                'trip_id' => $tripId,
                'capacity' => (int) $trip['capacity']
            ]);

            if ($seatStatement->rowCount() !== 1) {
                throw new RuntimeException(
                    'Unable to restore the available seat.'
                );
            }

            $this->pdo->commit();

            return [
                'success' => true,
                'message' => 'Your booking has been cancelled.',
                'booking_id' => $bookingId,
                'trip_id' => $tripId
            ];

        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $error;
        }
    }
}
