<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/bootstrap-icons.css">
        <link rel="stylesheet" href="assets/css/styles.css">
        <title>User Profiles - Arrows Express Admin</title>
    </head>
    <body class="dashboard-body bookings-body admin-body bg-white" data-admin-page="profiles">
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
                        <a href="admin-profiles.html" class="nav-link nav-item-active rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1" aria-current="page">
                            <i class="bi bi-people me-3 fs-5" aria-hidden="true"></i> User Profiles
                        </a>
                        <a href="admin-vehicles.html" class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
                            <i class="bi bi-bus-front me-3 fs-5" aria-hidden="true"></i> Vehicles
                        </a>
                        <a href="admin-accounts.html" class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
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
                    <h1 class="fs-3 fw-bold text-dlsu-green mb-1">User Profiles</h1>
                    <p class="text-secondary mb-4">View, add, update, and delete passenger and driver profiles.</p>
                    <div id="admin-message" class="alert d-none" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">
                    </div>
                    <div id="admin-content" aria-busy="true">
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Passengers & Drivers</h2>
                                <button type="button" class="btn btn-dlsu-green" data-admin-action="add-user">Add Profile</button>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-12 col-lg-6">
                                    <label for="admin-search" class="form-label">Search</label>
                                    <input type="search" id="admin-search" class="form-control" placeholder="Search names, emails, plates, or references">
                                </div>
                            </div>
                            <div class="admin-table-wrapper">
                                <table class="table align-middle mb-0 admin-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Name</th>
                                            <th scope="col">Type</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">ID / Employee Number</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-user-list">
                                        <tr>
                                            <td colspan="5">Loading data...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        <!-- DETAILS MODAL -->
                        <div class="modal fade" id="admin-user-modal" tabindex="-1" aria-labelledby="admin-user-modal-heading" aria-hidden="true">
                            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                                <div class="modal-content rounded-4">
                                    <form id="admin-user-form" novalidate>
                                        <div class="modal-header">
                                            <h2 class="modal-title fs-5" id="admin-user-modal-heading">User Profile</h2>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                            <div class="alert alert-danger d-none" id="admin-user-form-error" role="alert" tabindex="-1">
                                            </div>
                                            <div class="row g-3">
                                                <div class="col-12 col-md-6">
                                                    <label for="user-first-name" class="form-label">First name</label>
                                                    <input type="text" id="user-first-name" class="form-control" required maxlength="50">
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="user-last-name" class="form-label">Last name</label>
                                                    <input type="text" id="user-last-name" class="form-control" required maxlength="50">
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="user-email" class="form-label">DLSU email</label>
                                                    <input type="email" id="user-email" class="form-control" required maxlength="254" autocomplete="off">
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="user-role" class="form-label">Profile type</label>
                                                    <select id="user-role" class="form-select">
                                                        <option value="passenger">Passenger</option>
                                                        <option value="driver">Driver</option>
                                                    </select>
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="user-contact" class="form-label">Contact number</label>
                                                    <input type="tel" id="user-contact" class="form-control" maxlength="16">
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="user-id-number" class="form-label">ID / Employee number</label>
                                                    <input type="text" id="user-id-number" class="form-control" required maxlength="20">
                                                </div>
                                                <div class="col-12" id="admin-passenger-fields">
                                                    <div class="row g-3">
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-passenger-type" class="form-label">Passenger type</label>
                                                            <select id="user-passenger-type" class="form-select">
                                                                <option value="student">Student</option>
                                                                <option value="faculty">Faculty</option>
                                                                <option value="employee">Employee / Staff</option>
                                                            </select>
                                                        </div>
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-sex" class="form-label">Sex</label>
                                                            <select id="user-sex" class="form-select">
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                                <option value="prefer-not-to-say">Prefer not to say</option>
                                                            </select>
                                                        </div>
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-college" class="form-label">College / Department</label>
                                                            <input type="text" id="user-college" class="form-control" maxlength="100">
                                                        </div>
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-campus" class="form-label">Campus</label>
                                                            <select id="user-campus" class="form-select">
                                                                <option value="Manila">Manila</option>
                                                                <option value="Laguna">Laguna</option>
                                                            </select>
                                                        </div>
                                                        <div class="col-12">
                                                            <label for="user-document" class="form-label">Verification document filename</label>
                                                            <input type="text" id="user-document" class="form-control" maxlength="255" placeholder="e.g. passenger-eaf.pdf">
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-12 d-none" id="admin-driver-fields">
                                                    <div class="row g-3">
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-vehicle" class="form-label">Assigned vehicle</label>
                                                            <select id="user-vehicle" class="form-select">
                                                                <option value="">Not assigned</option>
                                                            </select>
                                                        </div>
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-verified" class="form-label">Admin verification</label>
                                                            <select id="user-verified" class="form-select">
                                                                <option value="true">Verified</option>
                                                                <option value="false">Not verified</option>
                                                            </select>
                                                        </div>
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-driver-status" class="form-label">Availability</label>
                                                            <select id="user-driver-status" class="form-select">
                                                                <option value="active">Active</option>
                                                            </select>
                                                        </div>
                                                        <div class="col-12 col-md-6">
                                                            <label for="user-driver-number" class="form-label">Driver number</label>
                                                            <input type="text" id="user-driver-number" class="form-control" maxlength="20">
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-12">
                                                    <p class="small text-secondary mb-0">This stores demo profile details only. Document names are placeholders; no document is uploaded.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                            <button type="submit" class="btn btn-dlsu-green">Save</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
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
                <a href="admin-profiles.html" class="dashboard-mobile-item text-decoration-none text-dlsu-green fw-bold" aria-current="page">
                    <i class="bi bi-people fs-5" aria-hidden="true"></i>
                    <span>Profiles</span>
                </a>
                <a href="admin-vehicles.html" class="dashboard-mobile-item text-decoration-none text-muted">
                    <i class="bi bi-bus-front fs-5" aria-hidden="true"></i>
                    <span>Vehicles</span>
                </a>
                <a href="admin-accounts.html" class="dashboard-mobile-item text-decoration-none text-muted">
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
