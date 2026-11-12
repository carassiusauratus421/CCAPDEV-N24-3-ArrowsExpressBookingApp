<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/bootstrap-icons.css">
        <link rel="stylesheet" href="assets/css/styles.css">
        <title>Dashboard - Arrows Express Admin</title>
        <style>
            /* Dashboard-only labels; does not change global booking styles. */
            .dashboard-status {
                display: inline-block;
                padding: .35rem .65rem;
                border-radius: .45rem;
                font-size: .78rem;
                font-weight: 700;
                line-height: 1.2;
                text-align: center;
                white-space: nowrap;
            }
            .dashboard-status--pending { background: #fff0c2; color: #895900; }
            .dashboard-status--confirmed { background: #cdeddc; color: #176443; }
            .dashboard-status--on-hold { background: #d7eeff; color: #215c98; }
            .dashboard-status--waitlisted { background: #e9defa; color: #7044a0; }
            .dashboard-status--rejected { background: #f9d9dd; color: #a12638; }
            .dashboard-status--cancelled { background: #e8eaed; color: #5a626c; }
            .dashboard-status--forfeited { background: #ffe3d0; color: #a74b1d; }
            .dashboard-status--completed { background: #d7e4e6; color: #365f66; }
            .dashboard-status--on-departure { background: #d7eeff; color: #215c98; }
            .dashboard-status--off-duty { background: #e8eaed; color: #5a626c; }
            .dashboard-status--inactive { background: #f9d9dd; color: #a12638; }
            .dashboard-status--default { background: #e8eaed; color: #495057; }
        </style>
    </head>
    <body class="dashboard-body bookings-body admin-body bg-white" data-admin-page="dashboard">
        <div class="container-fluid p-0">
            <div class="d-flex bookings-layout">
                <!-- ADMIN DESKTOP NAVIGATION -->
                <?php include __DIR__ . '/admin-nav-desktop.php';?>

                <!-- MAIN CONTENT -->
                <main class="bookings-main flex-grow-1 p-3 p-md-4 px-xl-5">
                    <!-- PAGE HEADER -->
                    <header class="dashboard-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 position-relative z-2">
                        <img src="assets/images/logo.png" alt="DLSU Logo" class="dashboard-logo d-lg-none">
                        <div class="ms-auto d-flex align-items-center gap-2">
                            <button type="button" id="themeToggle" class="btn btn-sm btn-light border d-lg-none" aria-label="Toggle theme" aria-pressed="false">
                                <i class="bi bi-moon" aria-hidden="true"></i>
                            </button>
                            <a href="admin-accounts.php" class="dashboard-account btn btn-white border rounded-pill py-1 px-2 d-flex align-items-center shadow-sm text-decoration-none">
                                <span class="dashboard-user-avatar me-2">
                                    <i class="bi bi-person-fill" aria-hidden="true"></i>
                                </span>
                                <span class="fw-semibold me-2" id="admin-user-name">Admin</span>
                            </a>
                            <a href="index.php" data-admin-logout class="btn btn-sm btn-light border d-lg-none" aria-label="Log out">
                                <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                            </a>
                        </div>
                    </header>
                    <h1 class="fs-3 fw-bold text-dlsu-green mb-1">Dashboard</h1>
                    <p class="text-secondary mb-4">Live overview of shuttle operations from MySQL.</p>
                    <div id="admin-message" class="alert d-none" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">
                    </div>
                    <div id="admin-content" aria-busy="false">
                        <div class="row g-3 mb-4">
                            <div class="col-12 col-md-6 col-xl-3">
                                <a href="admin-vehicles.php" class="quick-action-card d-block rounded-4 p-4 text-decoration-none text-dlsu-green">
                                    <span class="d-block text-secondary">Shuttles</span>
                                    <strong class="fs-2" id="admin-vehicle-count"><?php echo($vehicle_count) ?></strong>
                                </a>
                            </div>
                            <div class="col-12 col-md-6 col-xl-3">
                                <a href="admin-profiles.php" class="quick-action-card d-block rounded-4 p-4 text-decoration-none text-dlsu-green">
                                    <span class="d-block text-secondary">Drivers</span>
                                    <strong class="fs-2" id="admin-driver-count"><?php echo($driver_count) ?></strong>
                                </a>
                            </div>
                            <div class="col-12 col-md-6 col-xl-3">
                                <a href="admin-profiles.php" class="quick-action-card d-block rounded-4 p-4 text-decoration-none text-dlsu-green">
                                    <span class="d-block text-secondary">Passengers</span>
                                    <strong class="fs-2" id="admin-passenger-count"><?php echo($passenger_count) ?></strong>
                                </a>
                            </div>
                            <div class="col-12 col-md-6 col-xl-3">
                                <a href="admin-bookings.php" class="quick-action-card d-block rounded-4 p-4 text-decoration-none text-dlsu-green">
                                    <span class="d-block text-secondary">Pending Approvals</span>
                                    <strong class="fs-2" id="admin-pending-count"><?= $pending_count ?></strong>
                                </a>
                            </div>
                        </div>
                        <?php
                            // These values come from the existing MySQL dashboard controller.
                            $summaryCapacity = max(0, (int) $total_seat_capacity);
                            $summaryReserved = max(0, (int) $reserved_seat_count);
                            $summaryAvailable = max(0, $summaryCapacity - $summaryReserved);
                            $summaryOccupancy = $summaryCapacity > 0
                                ? min(100, ($summaryReserved / $summaryCapacity) * 100)
                                : 0;
                            $summaryPercentLabel = number_format($summaryOccupancy, 1);
                            $summaryBarWidth = number_format($summaryOccupancy, 2, '.', '');
                        ?>
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4" aria-labelledby="reservation-summary-heading">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <div>
                                    <h2 id="reservation-summary-heading" class="fs-5 fw-bold text-dlsu-green mb-1">Reservation Summary</h2>
                                    <p class="small text-secondary mb-0">
                                        Across the next <?= (int) $upcoming_trip_count ?> scheduled <?= (int) $upcoming_trip_count === 1 ? 'departure' : 'departures' ?>
                                    </p>
                                </div>
                            </div>
                            <div class="row g-3 mb-3" aria-label="Reservation occupancy metrics">
                                <div class="col-12 col-sm-4">
                                    <div class="rounded-3 p-3 h-100" style="background-color: #edf5f1;">
                                        <div class="fs-3 fw-bold text-dlsu-green"><?= $summaryPercentLabel ?>%</div>
                                        <div class="small text-secondary">Occupancy</div>
                                    </div>
                                </div>
                                <div class="col-6 col-sm-4">
                                    <div class="rounded-3 p-3 h-100" style="background-color: #f5f7f8;">
                                        <div class="fs-3 fw-bold text-dlsu-green"><?= $summaryReserved ?></div>
                                        <div class="small text-secondary">Reserved seats</div>
                                    </div>
                                </div>
                                <div class="col-6 col-sm-4">
                                    <div class="rounded-3 p-3 h-100" style="background-color: #f5f7f8;">
                                        <div class="fs-3 fw-bold text-dlsu-green"><?= $summaryAvailable ?></div>
                                        <div class="small text-secondary">Available seats</div>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                                <span class="small fw-semibold text-dlsu-green">Seat occupancy</span>
                                <span id="admin-reservation-summary" class="small text-secondary">
                                    <?= $summaryReserved ?> of <?= $summaryCapacity ?> seats reserved
                                </span>
                            </div>
                            <div class="progress" style="height: 14px;" aria-label="Reservation occupancy bar">
                                <div id="admin-reservation-progress"
                                     class="progress-bar bg-dlsu-green"
                                     role="progressbar"
                                     aria-label="Reserved seats"
                                     aria-valuemin="0"
                                     aria-valuemax="100"
                                     aria-valuenow="<?= $summaryBarWidth ?>"
                                     style="width: <?= $summaryBarWidth ?>%;">
                                </div>
                            </div>
                            <div class="d-flex flex-wrap gap-3 mt-2 small text-secondary">
                                <span><span class="d-inline-block rounded-circle me-1" style="height: 10px; width: 10px; background-color: #08734d;"></span>Reserved</span>
                                <span><span class="d-inline-block rounded-circle me-1" style="height: 10px; width: 10px; background-color: #e9ecef; border: 1px solid #cbd3d8;"></span>Available</span>
                            </div>
                            <?php if ($summaryCapacity === 0): ?>
                                <p class="small text-secondary mb-0 mt-2">No upcoming scheduled trip capacity is available for this summary.</p>
                            <?php endif; ?>
                        </section>
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Shuttles</h2>
                            </div>
                            <div class="admin-table-wrapper">
                                <table class="table align-middle mb-0 admin-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Shuttle</th>
                                            <th scope="col">Plate Number</th>
                                            <th scope="col">Model</th>
                                            <th scope="col">Capacity</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-shuttle-list">
                                        <?php foreach ($vehicles as $vehicle): ?>
                                        <tr>
                                            <td><?= htmlspecialchars($vehicle['shuttle']); ?></td>
                                            <td><?= htmlspecialchars($vehicle['plate_number']); ?></td>
                                            <td><?= htmlspecialchars($vehicle['vehicle_model']); ?></td>
                                            <td><?= htmlspecialchars($vehicle['capacity']); ?></td>
                                            <td><a href="admin-vehicles.php">Manage</a></td>
                                            
                                        </tr>
                                        <?php endforeach; ?>
                                        <?php if (empty($vehicles)): ?>
                                        <tr><td colspan="5" class="text-secondary">No vehicles found.</td></tr>
                                        <?php endif; ?>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        <div class="row g-4">
                            <div class="col-12 col-xl-6">
                                <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                        <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Drivers</h2>
                                    </div>
                                    <div class="admin-table-wrapper">
                                        <table class="table align-middle mb-0 admin-table">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Driver</th>
                                                    <th scope="col">Assigned Shuttle</th>
                                                    <th scope="col">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody id="admin-driver-list">
                                                <?php foreach ($drivers as $driver): ?>
                                                <tr>
                                                    <td><?= htmlspecialchars($driver['name']); ?></td>
                                                    <td><?= htmlspecialchars($driver['assigned_shuttle']); ?></td>
                                                    <td>
                                                        <?php
                                                            $driverStatus = strtolower(trim((string) ($driver['status'] ?? '')));
                                                            $driverStatus = str_replace([' ', '-'], '_', $driverStatus);
                                                            $driverLabels = [
                                                                'active' => 'Active',
                                                                'inactive' => 'Inactive',
                                                                'off_duty' => 'Off-duty',
                                                                'on_departure' => 'On Departure',
                                                            ];
                                                            $driverClasses = [
                                                                'active' => 'confirmed',
                                                                'inactive' => 'inactive',
                                                                'off_duty' => 'off-duty',
                                                                'on_departure' => 'on-departure',
                                                            ];
                                                            $driverLabel = $driverLabels[$driverStatus] ?? (
                                                                $driverStatus === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $driverStatus))
                                                            );
                                                            $driverClass = $driverClasses[$driverStatus] ?? 'default';
                                                        ?>
                                                        <span class="dashboard-status dashboard-status--<?= $driverClass ?>">
                                                            <?= htmlspecialchars($driverLabel, ENT_QUOTES, 'UTF-8') ?>
                                                        </span>
                                                    </td>
                                                    
                                                </tr>
                                                <?php endforeach; ?>
                                                <?php if (empty($drivers)): ?>
                                                <tr><td colspan="3" class="text-secondary">No drivers found.</td></tr>
                                                <?php endif; ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                            <div class="col-12 col-xl-6">
                                <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                        <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Recent Bookings</h2>
                                    </div>
                                    <div class="admin-table-wrapper">
                                        <table class="table align-middle mb-0 admin-table">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Reference</th>
                                                    <th scope="col">Passenger</th>
                                                    <th scope="col">Route</th>
                                                    <th scope="col">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody id="admin-recent-list">
                                                <?php foreach ($bookings as $booking): ?>
                                                <tr>
                                                    <td><?= htmlspecialchars($booking['reference']); ?></td>
                                                    <td><?= htmlspecialchars($booking['passenger_name']); ?></td>
                                                    <td><?= htmlspecialchars($booking['route']); ?></td>
                                                    <td>
                                                        <?php
                                                            $bookingStatus = strtolower(trim((string) ($booking['status'] ?? '')));
                                                            $bookingStatus = str_replace([' ', '-'], '_', $bookingStatus);
                                                            $bookingLabels = [
                                                                'pending' => 'Pending',
                                                                'confirmed' => 'Confirmed',
                                                                'accepted' => 'Accepted',
                                                                'on_hold' => 'On Hold',
                                                                'waitlisted' => 'Waitlisted',
                                                                'rejected' => 'Rejected',
                                                                'cancelled' => 'Cancelled',
                                                                'canceled' => 'Cancelled',
                                                                'forfeited' => 'Forfeited',
                                                                'completed' => 'Completed',
                                                            ];
                                                            $bookingClasses = [
                                                                'pending' => 'pending',
                                                                'confirmed' => 'confirmed',
                                                                'accepted' => 'confirmed',
                                                                'on_hold' => 'on-hold',
                                                                'waitlisted' => 'waitlisted',
                                                                'rejected' => 'rejected',
                                                                'cancelled' => 'cancelled',
                                                                'canceled' => 'cancelled',
                                                                'forfeited' => 'forfeited',
                                                                'completed' => 'completed',
                                                            ];
                                                            $bookingLabel = $bookingLabels[$bookingStatus] ?? (
                                                                $bookingStatus === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $bookingStatus))
                                                            );
                                                            $bookingClass = $bookingClasses[$bookingStatus] ?? 'default';
                                                        ?>
                                                        <span class="dashboard-status dashboard-status--<?= $bookingClass ?>">
                                                            <?= htmlspecialchars($bookingLabel, ENT_QUOTES, 'UTF-8') ?>
                                                        </span>
                                                    </td>
                                                    
                                                </tr>
                                                <?php endforeach; ?>
                                                <?php if (empty($bookings)): ?>
                                                <tr><td colspan="4" class="text-secondary">No bookings found.</td></tr>
                                                <?php endif; ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        <!-- MOBILE NAV -->
        <?php include __DIR__ . '/admin-nav-mobile.php';?>
        
        <!-- LOCAL SCRIPTS -->
        <script src="assets/js/bootstrap.bundle.min.js"></script>
        <script src="assets/js/theme-toggle.js">
        </script>
    </body>
</html>
