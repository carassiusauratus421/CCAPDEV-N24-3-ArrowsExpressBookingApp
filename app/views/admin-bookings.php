<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/bootstrap-icons.css">
        <link rel="stylesheet" href="assets/css/styles.css">
    
        <title>Bookings & Slots - Arrows Express Admin</title>
    </head>
    <body class="dashboard-body bookings-body admin-body bg-white" data-admin-page="bookings">
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
                    <h1 class="fs-3 fw-bold text-dlsu-green mb-1">Bookings & Slots</h1>
                    <p class="text-secondary mb-4">Manage reservations and seat limits for a date range.</p>
                    <div id="admin-message" class="alert d-none" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">
                    </div>
                    <div id="admin-content" aria-busy="true">
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Manage Slot Availability</h2>
                            </div>
                            <form id="admin-slots-form" novalidate>
                                <div class="row g-3">
                                    <div class="col-12 col-md-6">
                                        <label for="admin-start-date" class="form-label">From date</label>
                                        <input type="date" id="admin-start-date" class="form-control" required>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <label for="admin-end-date" class="form-label">To date</label>
                                        <input type="date" id="admin-end-date" class="form-control" required>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <label for="admin-route" class="form-label">Direction</label>
                                        <select id="admin-route" class="form-select">
                                            <option value="all">Both directions</option>
                                        </select>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <label for="admin-capacity" class="form-label">Reservation limit per trip</label>
                                        <input type="number" id="admin-capacity" class="form-control" min="1" max="100" step="1" required>
                                    </div>
                                    <div class="col-12">
                                        <p class="small text-secondary mb-3">Changes apply to every scheduled departure in this date range (up to 31 days). Available seats equal the limit minus other reservations and active bookings. Existing reservations are kept.</p>
                                        <button class="btn btn-dlsu-green" type="submit">Update Slot Limits</button>
                                    </div>
                                </div>
                            </form>
                        </section>
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Passenger Bookings</h2>
                            </div>
                            <form id="admin-booking-filters" class="row g-3 mb-3">
                                <div class="col-12 col-lg-6">
                                    <label for="admin-search" class="form-label">Search</label>
                                    <input type="search" id="admin-search" class="form-control" placeholder="Search names, emails, plates, or references">
                                </div>
                                <div class="col-12 col-md-6">
                                    <label for="admin-booking-status" class="form-label">Status</label>
                                    <select id="admin-booking-status" class="form-select">
                                        <option value="all">All statuses</option>
                                        <option value="Pending">Pending review</option>
                                        <option value="Confirmed">Accepted</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </form>
                            <div class="admin-table-wrapper">
                                <table class="table align-middle mb-0 admin-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Reference</th>
                                            <th scope="col">Passenger</th>
                                            <th scope="col">Route / Departure</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-booking-list">
                                        <tr>
                                            <td colspan="5">Loading data...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
        <!-- MOBILE NAV -->
        <?php include __DIR__ . '/admin-nav-mobile.php';?>

        <!-- LOCAL SCRIPTS -->
        <script src="assets/js/bootstrap.bundle.min.js"></script>
        <script src="assets/js/booking-lifecycle.js"></script>
        <script src="assets/js/admin.js">
        </script>
        <script src="assets/js/theme-toggle.js">
        </script>
    </body>
</html>
