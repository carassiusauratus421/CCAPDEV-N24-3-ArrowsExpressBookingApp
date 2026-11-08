<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">

    <title>Passenger Guide - Arrows Express Booking App</title>
</head>
<body class="dashboard-body bookings-body bg-white">
    <div class="container-fluid p-0">
        <div class="d-flex bookings-layout">
            <!-- DESKTOP SIDEBAR -->
            <?php include 'navDesktop.php';?>

            <!-- MAIN CONTENT AREA -->
            <main class="bookings-main flex-grow-1 p-3 p-md-4 px-xl-5">
                <!-- PAGE HEADER -->
                <header class="dashboard-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 position-relative z-2">
                    <img src="assets/images/logo.png" alt="DLSU Logo" class="dashboard-logo d-lg-none">
                    <div class="ms-auto d-flex align-items-center gap-2 notification-header-actions">
                        <a href="notifications.html"
                           class="notification-bell btn btn-white border rounded-circle d-lg-none"
                           aria-label="Notifications"
                           data-notification-link>
                            <i class="bi bi-bell fs-5" aria-hidden="true"></i>
                            <span class="notification-count badge bg-success rounded-pill"
                                  data-notification-count hidden>0</span>
                        </a>

                        <button type="button" id="themeToggle" class="btn btn-sm btn-light border" aria-label="Toggle theme" aria-pressed="false">
                            <i class="bi bi-moon" aria-hidden="true"></i>
                        </button>

                        <a href="profile.html" class="dashboard-account btn btn-white border rounded-pill py-1 px-2 d-flex align-items-center shadow-sm text-decoration-none">
                            <span class="dashboard-user-avatar me-2">
                                <i class="bi bi-person-fill" aria-hidden="true"></i>
                            </span>
                            <span class="fw-semibold me-2" data-passenger-name>Loading...</span>
                            <i class="bi bi-chevron-right text-muted small me-1" aria-hidden="true"></i>
                        </a>
                        <a href="index.html" class="btn btn-sm btn-light border d-lg-none" aria-label="Log out">
                            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                        </a>
                    </div>
                </header>

                <h1 class="fs-3 fw-bold text-dlsu-green mb-1">Passenger Guide</h1>
                <p class="text-secondary mb-4">A simple guide showing pickup locations for new riders.</p>
                <div id="booking-message" class="alert d-none" role="status" aria-live="polite" aria-atomic="true"></div>

                <!-- TRIP INFORMATION -->
                <div class="row g-4 mb-4" id="book-a-trip">
                    <section class="col-12" aria-labelledby="available-trips-heading">

                        <aside class="col-12 col-xl-12" aria-labelledby="trip-information-heading">
                            <div class="trip-information-panel h-100">
                                <div class="d-flex gap-3">
                                    <i class="bi bi-calendar-event fs-4" aria-hidden="true"></i>
                                    <div>
                                        <h3 id="trip-information-heading" class="fs-6 fw-semibold mb-1">Reminders</h3>
                                        <ul class="small ps-3 mb-0">
                                            <li>Please arrive at least 10 minutes before departure.</li>
                                            <li>Confirm your attendance when a reminder appears <span id="schedule-confirmation-minutes">...</span> minutes before departure.</li>
                                            <li>Arrival times may vary depending on traffic conditions.</li>
                                            <li>Eating inside the shuttle is prohibited.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </section>
                </div>

                <!-- CAMPUS PICK-UP POINTS -->
                <section>
                    <h2 class="fs-5 fw-bold text-dlsu-green mb-3" id="available-trips-heading">Pick-up Points</h2>
                    <div class="row">
                        <div class="col-12 col-lg-6">
                            <div class="border rounded-4 p-3 h-100 bg-white">
                                <h3 class="fs-6 fw-bold text-dlsu-green mb-3">Manila Campus - LS South Gate</h3>
                                <div class="ratio ratio-1x1 mb-3">
                                    <img src="assets/images/mnl-campus.png" alt="DLSU Manila map" class="rounded-3 border">
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-lg-6">
                            <div class="border rounded-4 p-3 h-100 bg-white">
                                <h3 class="fs-6 fw-bold text-dlsu-green mb-3">Laguna Campus - MRR East Canopy</h3>
                                <div class="ratio ratio-1x1 mb-3">
                                    <img src="assets/images/lag-campus.png" alt="DLSU Laguna map" class="rounded-3 border">
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>

    <!-- MOBILE NAVIGATION BAR -->
    <?php require 'navMobile.php';?>

    <script src="assets/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/booking-lifecycle.js"></script>
    <script src="assets/js/notifications.js"></script>
    <script src="assets/js/theme-toggle.js"></script>
</body>
</html>