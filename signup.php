<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/styles.css">

        <title>Sign Up - Arrows Express Booking App</title>
    </head>

    <body class="signup-body">
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
                        <small class="ms-auto text-end">Already have an account? <a href="index.html" class="fw-semibold signup-link">Log in</a></small>
                    </div>

                    <div class="my-auto px-3 px-sm-4 px-lg-5 py-4">
                        <div class="mx-auto signup-form-container">
                            <h2 class="fw-bold">Sign up</h2>
                            <p class="text-secondary fw-medium">Create your passenger account for Arrows Express.</p>

                            <!-- Frontend layout only. Registration is not enabled yet. -->
                            <form method="post">
                                <div class="row g-3">
                                    <div class="col-12 col-sm-6">
                                        <label for="first-name" class="form-label fw-bold">First Name</label>
                                        <input type="text" class="form-control" id="first-name" name="firstName" placeholder="Juan" autocomplete="given-name">
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="last-name" class="form-label fw-bold">Last Name</label>
                                        <input type="text" class="form-control" id="last-name" name="lastName" placeholder="Dela Cruz" autocomplete="family-name">
                                    </div>

                                    <div class="col-12">
                                        <label for="signup-email" class="form-label fw-bold">DLSU Email</label>
                                        <input type="email" class="form-control" id="signup-email" name="email" placeholder="username@dlsu.edu.ph" autocomplete="email" autocapitalize="none" spellcheck="false" aria-describedby="signup-email-help">
                                        <div id="signup-email-help" class="form-text">Use your university email address.</div>
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="id-number" class="form-label fw-bold">ID Number</label>
                                        <input type="text" class="form-control" id="id-number" name="idNumber" placeholder="Enter your university ID number">
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="passenger-type" class="form-label fw-bold">Passenger Type</label>
                                        <select class="form-select" id="passenger-type" name="passengerType">
                                            <option value="" selected>Select passenger type</option>
                                            <option value="student">Student</option>
                                            <option value="faculty">Faculty</option>
                                            <option value="employee-staff">Employee / Staff</option>
                                        </select>
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="sex" class="form-label fw-bold">Sex</label>
                                        <select class="form-select" id="sex" name="sex">
                                            <option value="" selected>Select sex</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="prefer-not-to-say">Prefer not to say</option>
                                        </select>
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="college-department" class="form-label fw-bold">College / Department</label>
                                        <input type="text" class="form-control" id="college-department" name="collegeDepartment" placeholder="Enter your college or department">
                                    </div>

                                    <div class="col-12">
                                        <label for="verification-document" class="form-label fw-bold">Verification Document</label>
                                        <input type="file" class="form-control" id="verification-document" name="verificationDocument" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="verification-document-help">
                                        <div id="verification-document-help" class="form-text">Select an EAF or university ID (PDF, JPG, or PNG). Files are not uploaded yet.</div>
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="signup-password" class="form-label fw-bold">Password</label>
                                        <input type="password" class="form-control" id="signup-password" name="password" placeholder="Create a password" autocomplete="new-password">
                                    </div>

                                    <div class="col-12 col-sm-6">
                                        <label for="confirm-password" class="form-label fw-bold">Confirm Password</label>
                                        <input type="password" class="form-control" id="confirm-password" name="confirmPassword" placeholder="Re-enter your password" autocomplete="new-password">
                                    </div>
                                </div>

                                <p id="registration-note" class="small text-secondary mt-4 mb-2">Account registration is not available yet.</p>
                                <button type="submit" class="btn btn-dlsu-green w-100" aria-describedby="registration-note" disabled>Create Account</button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <script src="assets/js/theme-toggle.js"></script>
    </body>
</html>

