
/* ========================================================
   PASSENGER DASHBOARD
   ======================================================== */

const dashboardUserName = document.getElementById("dashboard-user-name");
const dashboardFirstName = document.getElementById("dashboard-first-name");

const upcomingList = document.getElementById("dashboard-upcoming-list");
const upcomingTemplate = document.getElementById("dashboard-upcoming-template");

let dashboardBookings = [];


// Date and time formatting

function getDashboardDate(datetime) {
    return new Date(datetime.replace(" ", "T") + "+08:00");
}

function formatDashboardDate(datetime) {
    const date = getDashboardDate(datetime);

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila"
    });
}

function formatDashboardTime(datetime) {
    const time = datetime.split(" ")[1].slice(0, 5);
    const parts = time.split(":");
    const hour = Number(parts[0]);

    return (hour % 12 || 12) + ":" + parts[1] +
        (hour < 12 ? " AM" : " PM");
}

function getDashboardDateParts(datetime) {
    const date = getDashboardDate(datetime);

    return {
        month: date.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "Asia/Manila"
        }),

        day: date.toLocaleDateString("en-US", {
            day: "numeric",
            timeZone: "Asia/Manila"
        })
    };
}

function setDashboardText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// Passenger information

function updateDashboardPassenger(passenger) {
    const firstName = passenger.first_name || "";
    const lastName = passenger.last_name || "";

    const fullName = [firstName, lastName]
        .filter(Boolean)
        .join(" ");

    dashboardUserName.textContent = fullName;
    dashboardFirstName.textContent = firstName;

    document.querySelectorAll("[data-passenger-name]")
        .forEach(function (element) {
            element.textContent = fullName;
        });
}


// Booking filters

function getUpcomingDashboardBookings() {
    const now = Date.now();

    return dashboardBookings.filter(function (booking) {
        const status = String(
            booking.booking_status || ""
        ).toLowerCase();

        const departure = getDashboardDate(
            booking.departure_datetime
        );

        return (
            ["confirmed", "pending", "on hold", "on_hold"]
                .includes(status) &&
            departure.getTime() > now
        );
    }).sort(function (first, second) {
        return getDashboardDate(first.departure_datetime) -
            getDashboardDate(second.departure_datetime);
    });
}


// Display messages

function showDashboardListMessage(message) {
    const paragraph = document.createElement("p");

    paragraph.className = "text-secondary small mb-0";
    paragraph.textContent = message;

    upcomingList.replaceChildren(paragraph);
    upcomingList.setAttribute("aria-busy", "false");
}


// Display upcoming trips

function generateUpcomingDashboardTrips() {
    upcomingList.replaceChildren();

    const bookings = getUpcomingDashboardBookings()
        .slice(0, 4);

    if (bookings.length === 0) {
        showDashboardListMessage(
            "You have no upcoming trips."
        );

        return;
    }

    bookings.forEach(function (booking, index) {
        const record = upcomingTemplate.content
            .firstElementChild.cloneNode(true);

        const date = getDashboardDateParts(
            booking.departure_datetime
        );

        const route =
            booking.pickup_point +
            " → " +
            booking.dropoff_point;

        record.querySelector(
            ".dashboard-trip-month"
        ).textContent = date.month.toUpperCase();

        record.querySelector(
            ".dashboard-trip-day"
        ).textContent = date.day;

        record.querySelector(
            ".dashboard-trip-route"
        ).textContent = route;

        record.querySelector(
            ".dashboard-trip-time"
        ).textContent = formatDashboardTime(
            booking.departure_datetime
        );

        const status = record.querySelector(
            ".dashboard-trip-status"
        );

        const bookingStatus = String(
            booking.booking_status
        ).toLowerCase();

        status.textContent =
            bookingStatus === "confirmed"
                ? "Confirmed"
                : booking.booking_status;

        status.className =
            "dashboard-trip-status badge rounded-pill px-2 py-1 border " +
            (
                bookingStatus === "confirmed"
                    ? "bg-success-subtle text-success border-success-subtle"
                    : "bg-warning-subtle text-warning-emphasis border-warning-subtle"
            );

        if (index < bookings.length - 1) {
            record.classList.add(
                "border-bottom",
                "pb-3",
                "mb-3"
            );
        }

        upcomingList.appendChild(record);
    });

    upcomingList.setAttribute("aria-busy", "false");
}


// Clear the Next Trip card

function clearDashboardTrip(message) {
    setDashboardText("next-trip-time", message);
    setDashboardText("next-trip-date", "");
    setDashboardText("next-trip-route", "No upcoming trip");
    setDashboardText("next-trip-status", "No trip");
    setDashboardText("next-trip-plate", "—");
    setDashboardText("next-trip-vehicle", "—");
    setDashboardText("next-trip-driver", "—");
    setDashboardText("next-trip-driver-id", "—");
    setDashboardText("next-trip-pickup-campus", "—");
    setDashboardText("next-trip-pickup", "");

    const attendance = document.getElementById(
        "next-trip-confirmation"
    );

    if (attendance) {
        attendance.hidden = true;
    }

    const detailsLink = document.getElementById(
        "next-trip-details"
    );

    if (detailsLink) {
        detailsLink.href = "my-bookings.php";
    }
}


// Display the Next Trip card

function generateNextDashboardTrip() {
    const bookings = getUpcomingDashboardBookings();

    const nextBooking = bookings.find(function (booking) {
        return String(
            booking.booking_status
        ).toLowerCase() === "confirmed";
    });

    if (!nextBooking) {
        clearDashboardTrip("No upcoming confirmed trip");
        return;
    }

    const route =
        nextBooking.pickup_point +
        " → " +
        nextBooking.dropoff_point;

    const driver = [
        nextBooking.driver_first_name,
        nextBooking.driver_last_name
    ].filter(Boolean).join(" ") || "Not assigned";

    setDashboardText(
        "next-trip-route",
        route
    );

    setDashboardText(
        "next-trip-status",
        nextBooking.trip_status || "Scheduled"
    );

    setDashboardText(
        "next-trip-time",
        formatDashboardTime(
            nextBooking.departure_datetime
        )
    );

    setDashboardText(
        "next-trip-date",
        formatDashboardDate(
            nextBooking.departure_datetime
        )
    );

    setDashboardText(
        "next-trip-plate",
        nextBooking.plate_number || "Not assigned"
    );

    setDashboardText(
        "next-trip-vehicle",
        nextBooking.vehicle_model || "Not assigned"
    );

    setDashboardText(
        "next-trip-driver",
        driver
    );

    setDashboardText(
        "next-trip-driver-id",
        "Driver assigned"
    );

    setDashboardText(
        "next-trip-pickup-campus",
        nextBooking.pickup_point
    );

    setDashboardText(
        "next-trip-pickup",
        ""
    );

    // Show the attendance status stored in MySQL.
    const attendance = document.getElementById(
        "next-trip-confirmation"
    );

    if (attendance) {
        const confirmed = Boolean(
            nextBooking.passenger_confirmed
        );

        attendance.hidden = false;

        attendance.textContent = confirmed
            ? "Attendance confirmed"
            : "Attendance not yet confirmed";

        attendance.className =
            "badge rounded-pill px-3 py-2 " +
            (
                confirmed
                    ? "bg-success-subtle text-success"
                    : "bg-secondary-subtle text-secondary-emphasis"
            );
    }

    const detailsLink = document.getElementById(
        "next-trip-details"
    );

    if (detailsLink) {
        detailsLink.href =
            "my-bookings.php?booking=" +
            encodeURIComponent(nextBooking.booking_id);
    }
}


// Load dashboard data from MySQL

async function loadDashboardData() {
    try {
        const response = await fetch("api/bookings.php", {
            cache: "no-store",
            credentials: "same-origin"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to load dashboard data."
            );
        }

        if (!data.passenger || !Array.isArray(data.bookings)) {
            throw new Error("Invalid dashboard response.");
        }

        // Display the authenticated passenger.
        updateDashboardPassenger(data.passenger);

        // Display bookings belonging to this passenger.
        dashboardBookings = data.bookings;

        generateUpcomingDashboardTrips();
        generateNextDashboardTrip();

    } catch (error) {
        console.error(
            "Dashboard loading error:",
            error
        );

        dashboardUserName.textContent = "Unable to load";
        dashboardFirstName.textContent = "Guest";

        dashboardBookings = [];

        clearDashboardTrip("Trip details unavailable");

        showDashboardListMessage(
            "Unable to load upcoming trips."
        );
    }
}


// Refresh dashboard after returning to the page

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        loadDashboardData();
    }
});


// Initialize dashboard

loadDashboardData();
