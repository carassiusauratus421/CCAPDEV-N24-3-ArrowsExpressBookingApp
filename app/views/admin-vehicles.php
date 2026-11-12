<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/bootstrap-icons.css">
        <link rel="stylesheet" href="assets/css/styles.css">
        <title>Vehicles - Arrows Express Admin</title>
    </head>
    <body class="dashboard-body bookings-body admin-body bg-white" data-admin-page="vehicles">
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
                    <h1 class="fs-3 fw-bold text-dlsu-green mb-1">Vehicles</h1>
                    <p class="text-secondary mb-4">Maintain shuttle names, plate numbers, models, and capacity.</p>
                    <div id="admin-message" class="alert d-none" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">
                    </div>
                    <div id="admin-content" aria-busy="true">
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Shuttle Vehicles</h2>
                                <button type="button" class="btn btn-dlsu-green" data-admin-action="add-vehicle">Add Vehicle</button>
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
                                            <th scope="col">Shuttle</th>
                                            <th scope="col">Plate Number</th>
                                            <th scope="col">Model</th>
                                            <th scope="col">Capacity</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-vehicle-list">
                                        <tr>
                                            <td colspan="5">Loading data...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        <!-- DETAILS MODAL -->
                        <div class="modal fade" id="admin-vehicle-modal" tabindex="-1" aria-labelledby="admin-vehicle-modal-heading" aria-hidden="true">
                            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                                <div class="modal-content rounded-4">
                                    <form id="admin-vehicle-form" novalidate>
                                        <div class="modal-header">
                                            <h2 class="modal-title fs-5" id="admin-vehicle-modal-heading">Vehicle Information</h2>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                            <div class="alert alert-danger d-none" id="admin-vehicle-form-error" role="alert" tabindex="-1">
                                            </div>
                                            <div class="row g-3">
                                                <div class="col-12 col-md-6">
                                                    <label for="vehicle-name" class="form-label">Shuttle name</label>
                                                    <input type="text" id="vehicle-name" class="form-control" required maxlength="80">
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="vehicle-plate" class="form-label">Plate number</label>
                                                    <input type="text" id="vehicle-plate" class="form-control" required maxlength="20">
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="vehicle-model" class="form-label">Vehicle model</label>
                                                    <input type="text" id="vehicle-model" class="form-control" required maxlength="80">
                                                </div>
                                                <div class="col-12 col-md-6">
                                                    <label for="vehicle-capacity" class="form-label">Seat capacity</label>
                                                    <input type="number" id="vehicle-capacity" class="form-control" required min="1" max="100" step="1">
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
        <!-- ADMIN MOBILE NAVIGATION -->
        <?php include __DIR__ . '/admin-nav-mobile.php';?>
        
        <!-- LOCAL SCRIPTS -->
        <script src="assets/js/bootstrap.bundle.min.js"></script>
        <script src="assets/js/theme-toggle.js">
        </script>
    </body>
</html>
