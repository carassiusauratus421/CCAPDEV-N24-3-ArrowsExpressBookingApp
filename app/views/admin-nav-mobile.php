<!-- ADMIN MOBILE NAV -->
<?php 
    $pagename = basename($_SERVER['PHP_SELF']);
?>

<nav class="d-lg-none fixed-bottom bg-white border-top shadow-lg pb-safe z-3"
     aria-label="Mobile admin navigation">
    <div class="d-flex justify-content-around align-items-center py-2">
        <a href="admin-home.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'admin-home.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>"
           <?= $pagename === 'admin.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-house-door-fill fs-5" aria-hidden="true"></i>
            <span>Home</span>
        </a>

        <a href="admin-bookings.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'admin-bookings.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>"
           <?= $pagename === 'admin-bookings.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-calendar-event fs-5" aria-hidden="true"></i>
            <span>Bookings</span>
        </a>

        <a href="admin-profiles.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'admin-profiles.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>"
           <?= $pagename === 'admin-profiles.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-people fs-5" aria-hidden="true"></i>
            <span>Profiles</span>
        </a>

        <a href="admin-vehicles.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'admin-vehicles.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>"
           <?= $pagename === 'admin-vehicles.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-bus-front fs-5" aria-hidden="true"></i>
            <span>Vehicles</span>
        </a>

        <a href="admin-accounts.php"
           class="dashboard-mobile-item text-decoration-none <?= $pagename === 'admin-accounts.php' ? 'text-dlsu-green fw-bold' : 'text-muted' ?>"
           <?= $pagename === 'admin-accounts.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-person-gear fs-5" aria-hidden="true"></i>
            <span>Admins</span>
        </a>
    </div>
</nav>