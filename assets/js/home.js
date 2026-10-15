/* ========================================================
   PASSENGER DASHBOARD
   ======================================================== */
const dashboardStorageKey = "arrowsExpressDemoChanges:v1";

/* Merge saved edits by record ID without changing the JSON file. */
function applyDashboardChanges(data) {
    try {
        const savedChanges = JSON.parse(
            localStorage.getItem(dashboardStorageKey)
        );

        if (!savedChanges || savedChanges.schemaVersion !== data.schemaVersion) {
            return data;
        }

        ["users", "trips", "bookings"].forEach(function (section) {
            if (!Array.isArray(savedChanges[section])) {
                return;
            }

            savedChanges[section].forEach(function (change) {
                const index = data[section].findIndex(function (record) {
                    return record.id === change.id;
                });

                if (index === -1) {
                    data[section].push(change);
                } else {
                    data[section][index] = {
                        ...data[section][index],
                        ...change
                    };
                }
            });
        });
    } catch (error) {
        console.warn("Saved demo changes could not be loaded:", error);
    }

    return data;
}

/* Display a message in the Upcoming Trips card. */
function showDashboardListMessage(message) {
    const list = document.getElementById("dashboard-upcoming-list");
    const paragraph = document.createElement("p");

    paragraph.className = "text-secondary small mb-0";
    paragraph.textContent = message;

    list.replaceChildren(paragraph);
    list.setAttribute("aria-busy", "false");
}

/* Clear every trip field when no trip is available or loading fails. */
function clearDashboardTrip(message) {
    document.getElementById("next-trip-time").textContent = message;

    [
        "next-trip-date",
        "next-trip-route",
        "next-trip-driver-id",
        "next-trip-pickup"
    ].forEach(function (id) {
        document.getElementById(id).textContent = "";
    });

    [
        "next-trip-plate",
        "next-trip-vehicle",
        "next-trip-driver",
        "next-trip-pickup-campus",
        "next-trip-status"
    ].forEach(function (id) {
        document.getElementById(id).textContent = "—";
    });

    document.getElementById("next-trip-confirmation").hidden = true;

    const detailsLink = document.getElementById("next-trip-details");
    detailsLink.href = "my-bookings.html";
    detailsLink.firstChild.textContent = "View My Bookings ";
}

/* Fill the dashboard using the passenger and related JSON records. */
function renderDashboard(data) {
    const passenger = data.users.find(function (user) {
        return user.id === data.settings.defaultPassengerId;
    });

    if (!passenger) {
        throw new Error("The demo passenger could not be found.");
    }

    const demoNow = new Date(data.settings.demoNow);

    if (Number.isNaN(demoNow.getTime())) {
        throw new Error("The demo date is invalid.");
    }

    document.getElementById("dashboard-user-name").textContent =
        passenger.firstName + " " + passenger.lastName;

    document.getElementById("dashboard-first-name").textContent =
        passenger.firstName;

    /* Trip dates are local Philippine calendar dates (UTC+08:00). */
    function getTripDeparture(trip) {
        const midnight = new Date(trip.date + "T00:00:00+08:00");

        return new Date(
            midnight.getTime() + trip.departureMinutes * 60000
        );
    }

    function formatTripTime(date) {
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: data.settings.timeZone
        });
    }

    /* Keep each booking paired with its trip for links and statuses. */
    const upcomingBookings = data.bookings
        .filter(function (booking) {
            return booking.userId === passenger.id &&
                (booking.status === "Confirmed" ||
                    booking.status === "On Hold");
        })
        .map(function (booking) {
            const trip = data.trips.find(function (item) {
                return item.id === booking.tripId;
            });

            return {
                booking: booking,
                trip: trip
            };
        })
        .filter(function (item) {
            return item.trip && getTripDeparture(item.trip) > demoNow;
        })
        .sort(function (first, second) {
            return getTripDeparture(first.trip) -
                getTripDeparture(second.trip);
        });

    /* Show up to four upcoming bookings using the existing card layout. */
    const list = document.getElementById("dashboard-upcoming-list");
    const template = document.getElementById("dashboard-upcoming-template");
    const visibleBookings = upcomingBookings.slice(0, 4);

    list.replaceChildren();

    if (visibleBookings.length === 0) {
        showDashboardListMessage("You have no upcoming trips.");
    } else {
        visibleBookings.forEach(function (item, index) {
            const record = template.content.firstElementChild.cloneNode(true);
            const departure = getTripDeparture(item.trip);
            const arrival = new Date(
                departure.getTime() + item.trip.durationMinutes * 60000
            );

            const route = data.routes.find(function (entry) {
                return entry.id === item.trip.routeId;
            });

            record.querySelector(".dashboard-trip-month").textContent =
                departure.toLocaleDateString("en-US", {
                    month: "short",
                    timeZone: data.settings.timeZone
                }).toUpperCase();

            record.querySelector(".dashboard-trip-day").textContent =
                departure.toLocaleDateString("en-US", {
                    day: "numeric",
                    timeZone: data.settings.timeZone
                });

            record.querySelector(".dashboard-trip-route").textContent =
                route ? route.name : "Route unavailable";

            record.querySelector(".dashboard-trip-time").textContent =
                formatTripTime(departure) + " – " + formatTripTime(arrival);

            const status = record.querySelector(".dashboard-trip-status");
            status.textContent = item.booking.status;
            status.className =
                "dashboard-trip-status badge rounded-pill px-2 py-1 border " +
                (item.booking.status === "Confirmed"
                    ? "bg-success-subtle text-success border-success-subtle"
                    : "bg-warning-subtle text-warning-emphasis border-warning-subtle");

            if (index < visibleBookings.length - 1) {
                record.classList.add("border-bottom", "pb-3", "mb-3");
            }

            list.appendChild(record);
        });

        list.setAttribute("aria-busy", "false");
    }

    /* The Next Trip card uses the earliest confirmed booking. */
    const nextBooking = upcomingBookings.find(function (item) {
        return item.booking.status === "Confirmed";
    });

    if (!nextBooking) {
        clearDashboardTrip("No upcoming confirmed trip");
        return;
    }

    const trip = nextBooking.trip;
    const booking = nextBooking.booking;
    const departure = getTripDeparture(trip);

    const route = data.routes.find(function (item) {
        return item.id === trip.routeId;
    });

    const vehicle = data.vehicles.find(function (item) {
        return item.id === trip.vehicleId;
    });

    const driver = data.drivers.find(function (item) {
        return item.id === trip.driverId;
    });

    const driverUser = driver
        ? data.users.find(function (user) {
            return user.id === driver.userId;
        })
        : null;

    document.getElementById("next-trip-time").textContent =
        formatTripTime(departure);

    document.getElementById("next-trip-date").textContent =
        departure.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: data.settings.timeZone
        });

    document.getElementById("next-trip-route").textContent =
        route ? route.name : "Route unavailable";

    document.getElementById("next-trip-status").textContent =
        trip.tripStatus || "Scheduled";

    document.getElementById("next-trip-plate").textContent =
        vehicle ? vehicle.plate : "To be assigned";

    document.getElementById("next-trip-vehicle").textContent =
        vehicle ? vehicle.type : "To be assigned";

    document.getElementById("next-trip-driver").textContent =
        driverUser
            ? driverUser.lastName + ", " + driverUser.firstName.charAt(0) + "."
            : "Not assigned";

    document.getElementById("next-trip-driver-id").textContent =
        driver ? "ID: " + driver.employeeNumber : "ID: —";

    document.getElementById("next-trip-pickup-campus").textContent =
        route ? route.pickupCampus : "To be announced";

    document.getElementById("next-trip-pickup").textContent =
        route ? route.pickup : "";

    const attendance = document.getElementById("next-trip-confirmation");
    const minutesUntilDeparture = (departure - demoNow) / 60000;
    const confirmationDue =
        minutesUntilDeparture <= data.settings.confirmationMinutes;

    attendance.hidden = false;
    attendance.textContent = booking.attendanceConfirmed
        ? "Attendance confirmed"
        : confirmationDue
            ? "Attendance confirmation required"
            : "Attendance confirmation opens before departure";

    attendance.className = "badge rounded-pill px-3 py-2 " +
        (booking.attendanceConfirmed
            ? "bg-success-subtle text-success"
            : confirmationDue
                ? "bg-warning-subtle text-warning-emphasis"
                : "bg-secondary-subtle text-secondary-emphasis");

    const detailsLink = document.getElementById("next-trip-details");
    detailsLink.href =
        "my-bookings.html?booking=" + encodeURIComponent(booking.id);
    detailsLink.firstChild.textContent = "View Booking Details ";
}

/* Reload the JSON, then apply browser edits made by other demo pages. */
function loadDashboardData() {
    return fetch("assets/data/mock-data.json")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Could not load mock-data.json.");
            }

            return response.json();
        })
        .then(function (data) {
            renderDashboard(applyDashboardChanges(data));
        })
        .catch(function (error) {
            console.error("Could not load dashboard details:", error);

            document.getElementById("dashboard-user-name").textContent =
                "Unable to load";

            document.getElementById("dashboard-first-name").textContent =
                "Guest";

            clearDashboardTrip("Trip details unavailable");
            showDashboardListMessage(
                "Unable to load upcoming trips. Please reload the page."
            );
        });
}

/* Refresh when another tab saves shared demo changes. */
window.addEventListener("storage", function (event) {
    if (event.key === dashboardStorageKey || event.key === null) {
        loadDashboardData();
    }
});

/* Other scripts use this event after saving changes in the current tab. */
window.addEventListener("arrows-express-data-updated", loadDashboardData);

/* Refresh when the browser restores this page using Back or Forward. */
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        loadDashboardData();
    }
});

loadDashboardData();