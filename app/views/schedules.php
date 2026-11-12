
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/styles.css">

    <title>Term 2 AY26-27 Schedule - Arrows Express Booking App</title>
</head>

<body class="dashboard-body bookings-body bg-white">
    <div class="container-fluid p-0">
        <div class="d-flex bookings-layout">

            <!-- Desktop sidebar -->
            <?php include 'nav-desktop.php'; ?>

            <!-- Main content -->
            <main class="bookings-main flex-grow-1 p-3 p-md-4 px-xl-5">

                <!-- Page header -->
                <header class="dashboard-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 position-relative z-2">

                    <img
                        src="assets/images/logo.png"
                        alt="DLSU Logo"
                        class="dashboard-logo d-lg-none"
                    >

                    <div class="ms-auto d-flex align-items-center gap-2 notification-header-actions">

                        <a
                            href="notifications.php"
                            class="notification-bell btn btn-white border rounded-circle d-lg-none"
                            aria-label="Notifications"
                            data-notification-link
                        >
                            <i class="bi bi-bell fs-5" aria-hidden="true"></i>
                            <span
                                class="notification-count badge bg-success rounded-pill"
                                data-notification-count
                                hidden
                            >0</span>
                        </a>

                        <a
                            href="profile.php"
                            class="dashboard-account btn btn-white border rounded-pill py-1 px-2 d-flex align-items-center shadow-sm text-decoration-none"
                        >
                            <span class="dashboard-user-avatar me-2">
                                <i class="bi bi-person-fill" aria-hidden="true"></i>
                            </span>

                            <span class="fw-semibold me-2" data-passenger-name>Loading...</span>

                            <i
                                class="bi bi-chevron-right text-muted small me-1"
                                aria-hidden="true"
                            ></i>
                        </a>

                        <a
                            href="api/logout.php"
                            class="btn btn-sm btn-light border d-lg-none"
                            aria-label="Log out"
                        >
                            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                        </a>

                    </div>
                </header>

                <!-- Page title -->
                <h1 class="fs-3 fw-bold text-dlsu-green mb-1">
                    Term 2 AY 2026-2027 Schedule
                </h1>

                <p class="text-secondary mb-4">
                    Check the available schedules for this term.
                </p>

                <div
                    id="booking-message"
                    class="alert d-none"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                ></div>

                <!-- Trip filters -->
                <div class="row g-4 mb-4" id="book-a-trip">

                    <section class="col-12" aria-labelledby="available-trips-heading">

                        <div class="row g-3 align-items-end mb-4">

                            <!-- Route filter -->
                            <div class="col-12 col-xl-6">
                                <label for="route-filter" class="form-label fw-semibold">
                                    Route
                                </label>

                                <select
                                    id="route-filter"
                                    class="form-select"
                                    aria-label="Choose shuttle route"
                                >
                                    <option value="">All available routes</option>
                                </select>
                            </div>

                            <!-- Date filter -->
                            <div class="col-6 col-xl-3">
                                <label for="trip-date" class="form-label fw-semibold">
                                    Select Date
                                </label>

                                <input
                                    type="date"
                                    class="form-control"
                                    id="trip-date"
                                    aria-describedby="trip-date-error"
                                >

                                <div class="invalid-feedback" id="trip-date-error">
                                    Choose a valid departure date.
                                </div>
                            </div>

                            <!-- Time filter -->
                            <div class="col-6 col-xl-3">
                                <label for="timeslot-filter" class="form-label fw-semibold">
                                    Time Slot
                                </label>

                                <select
                                    class="form-select"
                                    id="timeslot-filter"
                                >
                                    <option value="all">All times</option>
                                    <option value="morning">Before 12:00 PM</option>
                                    <option value="afternoon">12:00 PM to 6:00 PM</option>
                                    <option value="evening">After 6:00 PM</option>
                                </select>
                            </div>
                        </div>

                        <!-- Reminders -->
                        <aside
                            class="col-12"
                            aria-labelledby="trip-information-heading"
                        >
                            <div class="trip-information-panel h-100">

                                <div class="d-flex gap-3">
                                    <i
                                        class="bi bi-calendar-event fs-4"
                                        aria-hidden="true"
                                    ></i>

                                    <div>
                                        <h3
                                            id="trip-information-heading"
                                            class="fs-6 fw-semibold mb-1"
                                        >
                                            Reminders
                                        </h3>

                                        <ul class="small ps-3 mb-0">
                                            <li>Please arrive at least 10 minutes before departure.</li>
                                            <li>Follow the attendance confirmation instructions shown in your booking details.</li>
                                            <li>Arrival times may vary depending on traffic conditions.</li>
                                            <li>Eating inside the shuttle is prohibited.</li>
                                        </ul>
                                    </div>

                                </div>
                            </div>
                        </aside>

                    </section>
                </div>

                <!-- Available trips -->
                <h2
                    class="fs-5 fw-bold text-dlsu-green mb-3"
                    id="available-trips-heading"
                >
                    Available Trips
                </h2>

                <div class="available-trips-panel">
                    <table class="table align-middle mb-0 available-trips-table">

                        <caption class="visually-hidden">
                            Available shuttle trips for the selected date and route
                        </caption>

                        <thead>
                            <tr>
                                <th scope="col">Departure Time</th>
                                <th scope="col">Date</th>
                                <th scope="col">Pickup Point</th>
                                <th scope="col">Drop-off Point</th>
                                <th scope="col">Slots Remaining</th>
                                <th scope="col">
                                    <span class="visually-hidden">Action</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody id="available-trip-list">
                            <tr>
                                <td colspan="6">
                                    Loading available trips...
                                </td>
                            </tr>
                        </tbody>

                    </table>
                </div>

            </main>
        </div>
    </div>

    <!-- Mobile navigation -->
    <?php require 'nav-mobile.php'; ?>

    <!-- Trip row template -->
    <template id="trip-row-template">
        <tr>
            <td
                class="trip-time fw-bold"
                data-label="Departure Time"
            ></td>

            <td
                class="trip-date"
                data-label="Date"
            ></td>

            <td
                class="trip-pickup"
                data-label="Pickup Point"
            ></td>

            <td
                class="trip-dropoff"
                data-label="Drop-off Point"
            ></td>

            <td
                class="trip-slots"
                data-label="Slots"
            ></td>

            <td class="trip-action text-end">
                <button
                    type="button"
                    class="trip-select-button btn btn-dlsu-green btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#trip-details-modal"
                >
                    Details
                </button>
            </td>
        </tr>
    </template>

    <!-- Trip details modal -->
    <div
        class="modal fade"
        id="trip-details-modal"
        tabindex="-1"
        aria-labelledby="trip-details-title"
        aria-hidden="true"
    >
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4">

                <div class="modal-header">
                    <h2
                        class="modal-title fs-5 fw-bold"
                        id="trip-details-title"
                    >
                        Trip Details
                    </h2>

                    <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                    ></button>
                </div>

                <div class="modal-body">

                    <h3
                        class="fs-5 fw-bold text-dlsu-green"
                        id="selected-route"
                    ></h3>

                    <dl class="row small booking-detail-list mb-0">

                        <dt class="col-5">Date</dt>
                        <dd class="col-7" id="selected-date"></dd>

                        <dt class="col-5">Departure Time</dt>
                        <dd class="col-7" id="selected-time"></dd>

                        <dt class="col-5">Vehicle</dt>
                        <dd class="col-7" id="selected-line"></dd>

                        <dt class="col-5">Pick-up Point</dt>
                        <dd class="col-7" id="selected-pickup"></dd>

                        <dt class="col-5">Drop-off Point</dt>
                        <dd class="col-7" id="selected-dropoff"></dd>

                        <dt class="col-5">Slots</dt>
                        <dd class="col-7" id="selected-seats"></dd>

                    </dl>

                </div>

                <div class="modal-footer">
                    <button
                        type="button"
                        class="btn btn-light border"
                        data-bs-dismiss="modal"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="assets/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/schedules.js"></script>
    <script src="assets/js/theme-toggle.js"></script>

<script src="assets/js/passenger-identity.js"></script>
</body>
</html>
