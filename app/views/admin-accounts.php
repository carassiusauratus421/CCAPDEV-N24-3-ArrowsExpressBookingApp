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
                    <h1 class="fs-3 fw-bold text-dlsu-green mb-1">Admin Accounts</h1>
                    <p class="text-secondary mb-4">Only an existing demo admin can create another admin account.</p>
                    <div id="admin-message" class="alert d-none" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">
                    </div>
                    <div id="admin-content" aria-busy="true">
                        <section class="border rounded-4 p-3 p-md-4 bg-white mb-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <h2 class="fs-5 fw-bold text-dlsu-green mb-0">Create Admin Account</h2>
                            </div>

                            <?php
                                if (!empty($error)) {
                                    echo '<div class="alert alert-danger">' . htmlspecialchars($error) . '</div>';
                                }
                            ?>

                            <form id="admin-account-form" method = "POST" action="admin-accounts.php" >
                                <div class="row g-3">

                                    <div class="col-12">
                                        <label for="signup-email" class="form-label fw-bold">DLSU Email<span class="text-danger">*</span></label>
                                        <input required type="email" class="form-control" id="signup-email" name="email" placeholder="username@dlsu.edu.ph" autocomplete="email" autocapitalize="none" spellcheck="false" aria-describedby="signup-email-help">
                                        <div id="signup-email-help" class="form-text">Use a university email address.</div>
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="signup-password" class="form-label fw-bold">Password<span class="text-danger">*</span></label>
                                        <input required type="password" class="form-control" id="signup-password" name="password" placeholder="Create a password" autocomplete="new-password">
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="confirm-password" class="form-label fw-bold">Confirm Password<span class="text-danger">*</span></label>
                                        <input required type="password" class="form-control" id="confirm-password" name="confirmPassword" placeholder="Re-enter your password" autocomplete="new-password">
                                    </div>
                                    <button type="submit" class="btn btn-dlsu-green w-100" aria-describedby="registration-note">Create Admin Account</button>
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
                                        <th scope="col">Email</th>
                                        <th scope="col">Manage</th>
                                    </tr>
                                </thead>
                                
                                <tbody id="admin-account-list">
                                    <?php
                                        if (empty($admins)) {
                                            echo '<tr><td colspan="2">No admins found.</td></tr>';
                                        } else {
                                            foreach ($admins as $admin) {
                                                echo '<tr>';
                                                echo '<td>' . htmlspecialchars($admin['email']) . '</td>';
                                                echo '<td><button type="button" class="btn btn-sm btn-outline-danger"
                                                        data-bs-toggle="modal" data-bs-target="#delete-admin-modal"
                                                        data-id="' . htmlspecialchars($admin['user_id']) . '"
                                                        data-email="' . htmlspecialchars($admin['email']) . '">Delete</button></td>';
                                                echo '</tr>';
                                            }
                                        }
                                    ?>
                                </tbody>

                                </table>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>

        <div class="modal fade" id="delete-admin-modal" tabindex="-1">
            <div class="modal-dialog">
                <form class="modal-content" method="POST" action="admin-accounts.php">
                    <div class="modal-header">
                        <h5 class="modal-title">Delete Admin</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        Delete <strong id="delete-admin-email"></strong>? This can't be undone.
                        <input type="hidden" name="deleteUserId" id="delete-admin-id">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-danger">Delete</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MOBILE NAV -->
        <?php include __DIR__ . '/admin-nav-mobile.php';?>

        <!-- LOCAL SCRIPTS -->
        <script src="assets/js/bootstrap.bundle.min.js"></script>

        <script>
            document.getElementById("delete-admin-modal").addEventListener("show.bs.modal", function (event) {
                const btn = event.relatedTarget;
                document.getElementById("delete-admin-id").value = btn.dataset.id;
                document.getElementById("delete-admin-email").textContent = btn.dataset.email;
            });
        </script>

        <script src="assets/js/theme-toggle.js">
        </script>
    </body>
</html>
