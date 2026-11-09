<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/bootstrap-icons.css">
        <link rel="stylesheet" href="assets/css/styles.css">
        <title>Admin Accounts - Arrows Express Admin</title>
    </head>
    <body class="dashboard-body bookings-body admin-body bg-white" data-admin-page="accounts">
        <div class="container-fluid p-0">
            <div class="d-flex bookings-layout">
                <!-- ADMIN DESKTOP NAVIGATION -->
                <aside class="sidebar bookings-sidebar d-none d-lg-flex flex-column border-end p-3 pt-4">
                    <div class="mb-4 px-3">
                        <img src="assets/images/logo.png" alt="DLSU Logo" class="img-fluid bookings-logo">
                    </div>
                    <nav class="nav flex-column gap-1 mb-auto px-2" aria-label="Admin navigation">
                        <a href="admin.html" class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
                            <i class="bi bi-house-door-fill me-3 fs-5" aria-hidden="true"></i> Dashboard
                        </a>
                        <a href="admin-bookings.html" class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
                            <i class="bi bi-calendar-event me-3 fs-5" aria-hidden="true"></i> Bookings & Slots
                        </a>
                        <a href="admin-profiles.html" class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
                            <i class="bi bi-people me-3 fs-5" aria-hidden="true"></i> User Profiles
                        </a>
                        <a href="admin-vehicles.html" class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
                            <i class="bi bi-bus-front me-3 fs-5" aria-hidden="true"></i> Vehicles
                        </a>
                        <a href="admin-accounts.html" class="nav-link nav-item-active rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1" aria-current="page">
                            <i class="bi bi-person-gear me-3 fs-5" aria-hidden="true"></i> Admin Accounts
                        </a>
                    </nav>
                    <div class="px-2">
                        <hr class="my-3 opacity-25">
                        <a href="index.html" data-admin-logout class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold">
                            <i class="bi bi-box-arrow-right me-3 fs-5" aria-hidden="true"></i> Log Out
                        </a>
                    </div>
                </aside>
                <!-- MAIN CONTENT -->
                <main class="bookings-main flex-grow-1 p-3 p-md-4 px-xl-5">
                    <!-- PAGE HEADER -->
                    <header class="dashboard-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 position-relative z-2">
                        <img src="assets/images/logo.png" alt="DLSU Logo" class="dashboard-logo d-lg-none">
                        <div class="ms-auto d-flex align-items-center gap-2">
                            <button type="button" id="themeToggle" class="btn btn-sm btn-light border" aria-label="Toggle theme" aria-pressed="false">
                                <i class="bi bi-moon" aria-hidden="true"></i>
                            </button>
                            <a href="admin-accounts.html" class="dashboard-account btn btn-white border rounded-pill py-1 px-2 d-flex align-items-center shadow-sm text-decoration-none">
                                <span class="dashboard-user-avatar me-2">
                                    <i class="bi bi-person-fill" aria-hidden="true"></i>
                                </span>
                                <span class="fw-semibold me-2" id="admin-user-name">Admin</span>
                            </a>
                            <a href="index.html" data-admin-logout class="btn btn-sm btn-light border d-lg-none" aria-label="Log out">
                                <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                            </a>
                        </div>
                    </header>
                    <h1 class="fs-3 fw-bold text-dlsu-green mb-1">Admin Accounts</h1>
                    <p class="text-secondary mb-4">Only an existing demo admin can create another admin account.</p>
                    <div id="admin-message" class="alert d-none" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">
                    </div>
                    <div id="admin-content" aria-busy="true">
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Create Admin Account</h2>
                            </div>
                            <form id="admin-account-form" novalidate>
                                <div class="row g-3">
                                    <div class="col-12 col-md-6">
                                        <label for="admin-first-name" class="form-label">First name</label>
                                        <input type="text" id="admin-first-name" class="form-control" required maxlength="50">
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <label for="admin-last-name" class="form-label">Last name</label>
                                        <input type="text" id="admin-last-name" class="form-control" required maxlength="50">
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <label for="admin-email" class="form-label">DLSU email</label>
                                        <input type="email" id="admin-email" class="form-control" required maxlength="254" autocomplete="off">
                                    </div>
                                    <div class="col-12">
                                        <p class="small text-secondary">Public demo password: <strong data-admin-demo-password>
                                            </strong>. This creates a mock admin login only.</p>
                                        <button type="submit" class="btn btn-dlsu-green">Create Admin Account</button>
                                    </div>
                                </div>
                            </form>
                        </section>
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Existing Admins</h2>
                            </div>
                            <div class="admin-table-wrapper">
                                <table class="table align-middle mb-0 admin-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Name</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">Created By</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-account-list">
                                        <tr>
                                            <td colspan="3">Loading data...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
        <!-- FIVE LINKS KEEP THE MOBILE NAVIGATION CONSISTENT. -->
        <nav class="d-lg-none fixed-bottom bg-white border-top shadow-lg pb-safe z-3" aria-label="Mobile admin navigation">
            <div class="d-flex justify-content-around align-items-center py-2">
                <a href="admin.html" class="dashboard-mobile-item text-decoration-none text-muted">
                    <i class="bi bi-house-door-fill fs-5" aria-hidden="true"></i>
                    <span>Home</span>
                </a>
                <a href="admin-bookings.html" class="dashboard-mobile-item text-decoration-none text-muted">
                    <i class="bi bi-calendar-event fs-5" aria-hidden="true"></i>
                    <span>Bookings</span>
                </a>
                <a href="admin-profiles.html" class="dashboard-mobile-item text-decoration-none text-muted">
                    <i class="bi bi-people fs-5" aria-hidden="true"></i>
                    <span>Profiles</span>
                </a>
                <a href="admin-vehicles.html" class="dashboard-mobile-item text-decoration-none text-muted">
                    <i class="bi bi-bus-front fs-5" aria-hidden="true"></i>
                    <span>Vehicles</span>
                </a>
                <a href="admin-accounts.html" class="dashboard-mobile-item text-decoration-none text-dlsu-green fw-bold" aria-current="page">
                    <i class="bi bi-person-gear fs-5" aria-hidden="true"></i>
                    <span>Admins</span>
                </a>
            </div>
        </nav>
        <!-- LOCAL SCRIPTS -->
        <script src="assets/js/bootstrap.bundle.min.js"></script>
        <script src="assets/js/booking-lifecycle.js"></script>
        <script src="assets/js/admin.js">
        </script>
        <script src="assets/js/theme-toggle.js">
        </script>
    </body>
</html>
