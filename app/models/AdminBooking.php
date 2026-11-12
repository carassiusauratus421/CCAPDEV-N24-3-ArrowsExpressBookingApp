<?php
// Administrative booking queries and transactional decisions.
class AdminBooking
{
    public function __construct(private PDO $pdo) {}

    public function listBookings(): array
    {
        $statement = $this->pdo->query("
            SELECT br.booking_id, br.trip_id, br.passenger_id,
                   br.booking_status, br.timestamp_created,
                   p.first_name, p.last_name, u.email,
                   ts.pickup_point, ts.dropoff_point,
                   DATE_FORMAT(ts.departure_datetime, '%Y-%m-%d %H:%i:%s') AS departure_datetime,
                   ts.available_slots, ts.trip_status,
                   v.plate_number, v.vehicle_model
            FROM booking_reservation br
            JOIN passenger p ON br.passenger_id = p.passenger_id
            JOIN `user` u ON p.user_id = u.user_id
            JOIN trip_schedule ts ON br.trip_id = ts.trip_id
            LEFT JOIN vehicle v ON ts.vehicle_id = v.vehicle_id
            ORDER BY ts.departure_datetime DESC, br.booking_id DESC
        ");
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    public function decide(int $bookingId, string $action): array
    {
        $destinations = ['accept' => 'confirmed', 'hold' => 'on_hold', 'reject' => 'rejected'];
        if (!isset($destinations[$action])) {
            return ['success' => false, 'message' => 'Invalid decision.'];
        }
        try {
            $this->pdo->beginTransaction();
            // All seat-changing operations lock trip first, then reservation.
            $lookup = $this->pdo->prepare('SELECT trip_id FROM booking_reservation WHERE booking_id = :id');
            $lookup->execute(['id' => $bookingId]);
            $tripId = $lookup->fetchColumn();
            if ($tripId === false) {
                $this->pdo->rollBack();
                return ['success' => false, 'message' => 'Booking not found.'];
            }
            $trip = $this->pdo->prepare("
                SELECT ts.trip_id, ts.available_slots,
                       ts.departure_datetime > NOW() AS is_future,
                       ts.trip_status, v.capacity
                FROM trip_schedule ts
                JOIN vehicle v ON v.vehicle_id = ts.vehicle_id
                WHERE ts.trip_id = :id FOR UPDATE
            ");
            $trip->execute(['id' => (int) $tripId]);
            $tripRow = $trip->fetch(PDO::FETCH_ASSOC);
            if (!$tripRow) {
                $this->pdo->rollBack();
                return ['success' => false, 'message' => 'Trip not found.'];
            }
            $booking = $this->pdo->prepare("
                SELECT booking_status, trip_id, passenger_confirmed FROM booking_reservation
                WHERE booking_id = :id FOR UPDATE
            ");
            $booking->execute(['id' => $bookingId]);
            $record = $booking->fetch(PDO::FETCH_ASSOC);
            if (!$record || (int) $record['trip_id'] !== (int) $tripId) {
                $this->pdo->rollBack();
                return ['success' => false, 'message' => 'Booking changed. Refresh and retry.'];
            }
            $current = strtolower(str_replace(' ', '_', trim((string) $record['booking_status'])));
            if ((int) $tripRow['is_future'] !== 1 ||
                !in_array($current, ['pending', 'on_hold', 'confirmed'], true)) {
                $this->pdo->rollBack();
                return ['success' => false, 'message' => 'This booking is not eligible for a decision.'];
            }
            if ($action === 'accept' && strtolower((string) $tripRow['trip_status']) !== 'scheduled') {
                $this->pdo->rollBack();
                return ['success' => false, 'message' => 'The trip is not scheduled.'];
            }
            if ($record['passenger_confirmed'] !== null && $action !== 'accept') {
                $this->pdo->rollBack();
                return ['success' => false,
                    'message' => 'Passenger already confirmed this ride. Contact the passenger before changing it.'];
            }
            $next = $destinations[$action];
            if ($current === $next) {
                $this->pdo->rollBack();
                return ['success' => false, 'message' => 'The booking already has this status.'];
            }
            if ($action === 'reject' && (int) $tripRow['available_slots'] >= (int) $tripRow['capacity']) {
                throw new RuntimeException('Seat totals are inconsistent.');
            }
            $update = $this->pdo->prepare("
                UPDATE booking_reservation SET booking_status = :status
                WHERE booking_id = :id
            ");
            $update->execute(['status' => $next, 'id' => $bookingId]);
            if ($update->rowCount() !== 1) {
                throw new RuntimeException('Unable to save admin decision.');
            }
            if ($action === 'reject') {
                $seat = $this->pdo->prepare("
                    UPDATE trip_schedule SET available_slots = available_slots + 1
                    WHERE trip_id = :id AND available_slots < :capacity
                ");
                $seat->execute(['id' => (int) $tripId, 'capacity' => (int) $tripRow['capacity']]);
                if ($seat->rowCount() !== 1) {
                    throw new RuntimeException('Unable to release reserved seat.');
                }
            }
            $this->pdo->commit();
            return [
                'success' => true,
                'booking_id' => $bookingId,
                'booking_status' => $next,
                'message' => 'Booking ' . $bookingId . ' updated to ' . str_replace('_', ' ', $next) . '.'
            ];
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }
}
