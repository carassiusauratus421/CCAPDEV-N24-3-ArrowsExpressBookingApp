<!-- DESKTOP NAV -->
<?php 
    $pagename = basename($_SERVER['PHP_SELF']);
?>

<aside class="sidebar d-none d-lg-flex flex-column border-end p-3 pt-4">
    <div class="mb-4 px-3">
        <img src="assets/images/logo.png"
                alt="DLSU Logo"
                class="img-fluid"
                style="max-height: 40px;">
    </div>

    <nav class="nav flex-column gap-1 mb-auto px-2" aria-label="Passenger navigation">
        <a href="home.php"
            class="nav-link <?= $pagename === 'home.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
            aria-current="page">
            <i class="bi bi-house-door-fill me-3 fs-5" aria-hidden="true"></i>
            Home
        </a>

        <a href="my-bookings.php#my-bookings"
            class="nav-link <?= $pagename === 'my-bookings.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
            <i class="bi bi-calendar-event me-3 fs-5" aria-hidden="true"></i>
            My Bookings
        </a>

        <a href="schedules.php"
            class="nav-link <?= $pagename === 'schedules.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
            style="font-size: 0.9rem;">
            <i class="bi bi-clock me-3 fs-5"></i>
            Schedules
        </a>

        <a href="routes-and-maps.php"
            class="nav-link <?= $pagename === 'routes-and-maps.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
            style="font-size: 0.9rem;">
            <i class="bi bi-geo-alt me-3 fs-5"></i>
            Passenger Guide
        </a>

        <a href="notifications.php"
            class="nav-link <?= $pagename === 'notifications.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
            data-notification-link>
            <i class="bi bi-bell me-3 fs-5" aria-hidden="true"></i>
            Notifications
            <span class="badge bg-success-subtle text-success rounded-pill ms-auto"
                    data-notification-count hidden>0</span>
        </a>

        <a href="profile.php"
            class="nav-link <?= $pagename === 'profile.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1">
            <i class="bi bi-person me-3 fs-5" aria-hidden="true"></i>
            Profile
        </a>
    </nav>

    <div class="px-2">
        <hr class="my-3 opacity-25">

        <a href="index.php"
            class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold"
            style="font-size: 0.9rem;">
            <i class="bi bi-box-arrow-right me-3 fs-5"></i>
            Log Out
        </a>
    </div>
</aside>