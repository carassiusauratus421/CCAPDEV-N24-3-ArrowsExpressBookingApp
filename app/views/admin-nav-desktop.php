<!-- ADMIN DESKTOP NAVIGATION -->
<?php 
    $pagename = basename($_SERVER['PHP_SELF']);
?>

<aside class="sidebar bookings-sidebar d-none d-lg-flex flex-column border-end p-3 pt-4">
    <div class="mb-4 px-3">
        <img src="assets/images/logo.png" alt="DLSU Logo" class="img-fluid bookings-logo">
    </div>

    <nav class="nav flex-column gap-1 mb-auto px-2" aria-label="Admin navigation">
        <a href="admin-home.php"
           class="nav-link <?= $pagename === 'admin-home.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
           <?= $pagename === 'admin.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-house-door-fill me-3 fs-5" aria-hidden="true"></i> Dashboard
        </a>

        <a href="admin-bookings.php"
           class="nav-link <?= $pagename === 'admin-bookings.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
           <?= $pagename === 'admin-bookings.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-calendar-event me-3 fs-5" aria-hidden="true"></i> Bookings &amp; Slots
        </a>

        <a href="admin-profiles.php"
           class="nav-link <?= $pagename === 'admin-profiles.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
           <?= $pagename === 'admin-profiles.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-people me-3 fs-5" aria-hidden="true"></i> User Profiles
        </a>

        <a href="admin-vehicles.php"
           class="nav-link <?= $pagename === 'admin-vehicles.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
           <?= $pagename === 'admin-vehicles.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-bus-front me-3 fs-5" aria-hidden="true"></i> Vehicles
        </a>

        <a href="admin-accounts.php"
           class="nav-link <?= $pagename === 'admin-accounts.php' ? 'nav-item-active' : 'nav-item-default' ?> rounded px-3 py-2 d-flex align-items-center fw-semibold mb-1"
           <?= $pagename === 'admin-accounts.php' ? 'aria-current="page"' : '' ?>>
            <i class="bi bi-person-gear me-3 fs-5" aria-hidden="true"></i> Admin Accounts
        </a>

        <button type="button" id="themeToggle" class="btn btn-sm btn-light border" aria-label="Toggle theme" aria-pressed="false">
            <i class="bi bi-moon" aria-hidden="true"></i>
        </button>
    </nav>

    <div class="px-2">
        <hr class="my-3 opacity-25">
        <a href="api/logout.php"
           class="nav-link nav-item-default rounded px-3 py-2 d-flex align-items-center fw-semibold">
            <i class="bi bi-box-arrow-right me-3 fs-5" aria-hidden="true"></i> Log Out
        </a>
    </div>
</aside>