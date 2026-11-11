<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/styles.css">

        <title>Forgot Password - Arrows Express Booking App</title>
    </head>

    <body class="forgot-password-body">
        <div class="container-fluid">
            <div class="row min-vh-100">
                <!-- LEFT SIDE -->
                <section class="col-lg-6 d-none d-lg-flex flex-column" aria-label="About Arrows Express">
                    <div class="pt-2 ps-2">
                        <img src="assets/images/logo.png" alt="De La Salle University" class="logo-slot">
                    </div>

                    <div class="my-auto px-5 py-4">
                        <div class="row mt-4">
                            <div class="col-3"> <!-- spacer column --> </div>
                            <div class="col-6">
                                <h1 class="display-2 fw-bold">ARROWS<br>EXPRESS</h1>
                                <p class="lead text-secondary fw-medium">Your inter-campus shuttle<br>booking platform</p>
                            </div>
                            <div class="col-3"> <!-- spacer column --> </div>
                        </div>

                        <div class="row text-center mt-4">
                            <div class="col-3"> <!-- spacer column --> </div>
                            <div class="col-2">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <img src="assets/images/calendar.png" alt="" width="32" class="d-block mx-auto mb-2">
                                        View<br>Schedules
                                    </div>
                                </div>
                            </div>
                            <div class="col-2">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <img src="assets/images/bus.png" alt="" width="32" class="d-block mx-auto mb-2">
                                        Book<br>Your Ride
                                    </div>
                                </div>
                            </div>
                            <div class="col-2">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <img src="assets/images/bell.png" alt="" width="32" class="d-block mx-auto mb-2">
                                        Live<br> Updates
                                    </div>
                                </div>
                            </div>
                            <div class="col-3"> <!-- spacer column --> </div>
                        </div>
                    </div>
                </section>

                <!-- RIGHT SIDE -->
                <main class="col-12 col-lg-6 d-flex flex-column divider">
                    <div class="d-flex justify-content-between align-items-center gap-3 pt-3 px-3 px-lg-4">
                        <img src="assets/images/logo.png" alt="De La Salle University" class="logo-slot d-lg-none">
                        <small class="ms-auto text-end">Don't have an account? <a href="signup.php" class="fw-semibold forgot-password-link">Sign up</a></small>
                    </div>

                    <div class="my-auto px-3 px-sm-4 px-lg-5 py-4">
                        <div class="mx-auto forgot-password-form-container">
                            <h2 class="fw-bold">Forgot password?</h2>
                            <p class="text-secondary">Enter your DLSU email to request a password reset.</p>

                            <!-- Frontend layout only. Password recovery is not enabled yet. -->
                            <form method="post">
                                <div class="mb-3">
                                    <label for="recovery-email" class="form-label">DLSU Email</label>
                                    <input type="email" class="form-control" id="recovery-email" name="email"
                                           placeholder="username@dlsu.edu.ph" autocomplete="email"
                                           autocapitalize="none" spellcheck="false"
                                           aria-describedby="recovery-email-help">
                                    <div id="recovery-email-help" class="form-text">Use the university email associated with your account.</div>
                                </div>

                                <p id="recovery-note" class="small text-secondary mb-2">Password reset is not available yet.</p>
                                <button type="submit" class="btn btn-dlsu-green w-100" aria-describedby="recovery-note" disabled>Send Reset Link</button>
                            </form>

                            <div class="text-center mt-4">
                                <a href="index.php" class="fw-semibold forgot-password-link">Back to Log In</a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <script src="assets/js/bootstrap.bundle.min.js"></script>
        <script src="assets/js/theme-toggle.js"></script>
    </body>
</html>