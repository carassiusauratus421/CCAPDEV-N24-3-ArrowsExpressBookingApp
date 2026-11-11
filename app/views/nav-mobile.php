<!-- MOBILE NAV -->
<?php 
    $pagename = basename($_SERVER['PHP_SELF']);
?>

<nav class="d-lg-none fixed-bottom bg-white border-top shadow-lg pb-safe z-3"
     aria-label="Mobile passenger navigation">
    <div class="d-flex justify-content-around align-items-center py-2">
        <a href="home.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'home.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>"
           aria-current="page">
            <i class="bi bi-house-door-fill fs-5" aria-hidden="true"></i>
            <span>Home</span>
        </a>

        <a href="my-bookings.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'my-bookings.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>">
            <i class="bi bi-calendar-plus fs-5" aria-hidden="true"></i>
            <span>Book</span>
        </a>

        <a href="my-bookings.php#my-bookings"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'my-bookings.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>">
            <i class="bi bi-calendar-event fs-5" aria-hidden="true"></i>
            <span>My Bookings</span>
        </a>

        <a href="schedules.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'schedules.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>">
            <i class="bi bi-clock fs-5" aria-hidden="true"></i>
            <span>Schedules</span>
        </a>

        <a href="passenger-guide.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'passenger-guide.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>">
            <i class="bi bi-geo-alt fs-5" aria-hidden="true"></i>
            <span>Passenger Guide</span>
        </a>
    </div>
</nav>