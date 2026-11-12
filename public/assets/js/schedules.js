
/*
 * Passenger Trip Schedules
 * Displays shuttle schedules using data from MySQL.
 */

const tripDateInput = document.getElementById("trip-date");
const tripTimeslotSelect = document.getElementById("timeslot-filter");
const routeFilter = document.getElementById("route-filter");
const tripList = document.getElementById("available-trip-list");
const tripRowTemplate = document.getElementById("trip-row-template");
const tripDetailsModal = document.getElementById("trip-details-modal");
const confirmBookingButton = document.getElementById(
    "confirm-booking-button"
);

let scheduleTrips = [];
let selectedScheduleTripId = null;
let scheduleRequestNumber = 0;
let bookingInProgress = false;


// Date and time formatting

function getTripDate(value) {
    return new Date(value + "T12:00:00+08:00");
}

function formatScheduleDate(value, month = "short") {
    return getTripDate(value).toLocaleDateString("en-US", {
        month: month,
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila"
    });
}

function formatScheduleTime(datetime) {
    const time = datetime.split(" ")[1].slice(0, 5);
    const parts = time.split(":");
    const hours = Number(parts[0]);

    return (hours % 12 || 12) + ":" + parts[1] +
        (hours < 12 ? " AM" : " PM");
}

function getTimeslot(datetime) {
    const parts = datetime.split(" ")[1].split(":");

    const minutes =
        Number(parts[0]) * 60 + Number(parts[1]);

    if (minutes < 720) {
        return "morning";
    }

    if (minutes < 1080) {
        return "afternoon";
    }

    return "evening";
}


// Display messages

function showBookingMessage(message, type = "warning") {
    const feedback = document.getElementById("booking-message");

    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.className = "alert alert-" + type;
}

function hideBookingMessage() {
    const feedback = document.getElementById("booking-message");

    if (!feedback) {
        return;
    }

    feedback.textContent = "";
    feedback.className = "alert d-none";
}

function showModalBookingMessage(message, type = "danger") {
    if (!confirmBookingButton) {
        showBookingMessage(message, type);
        return;
    }

    let feedback = document.getElementById(
        "modal-booking-message"
    );

    if (!feedback) {
        feedback = document.createElement("div");
        feedback.id = "modal-booking-message";
        feedback.setAttribute("role", "alert");

        confirmBookingButton.parentElement.insertBefore(
            feedback,
            confirmBookingButton
        );
    }

    feedback.textContent = message;
    feedback.className = "alert alert-" + type + " mb-2";
}

function hideModalBookingMessage() {
    const feedback = document.getElementById(
        "modal-booking-message"
    );

    if (feedback) {
        feedback.textContent = "";
        feedback.className = "alert d-none";
    }
}

function showTripMessage(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "text-center text-secondary py-4";
    cell.textContent = message;

    row.appendChild(cell);
    tripList.appendChild(row);
}


// Filter available trips

function getAvailableTrips() {
    return scheduleTrips.filter(function (trip) {
        const selectedRoute = routeFilter.value;

        const routeMatches = !selectedRoute ||
            selectedRoute === JSON.stringify([
                trip.pickup_point,
                trip.dropoff_point
            ]);

        const timeMatches =
            tripTimeslotSelect.value === "all" ||
            getTimeslot(trip.departure_datetime) ===
                tripTimeslotSelect.value;

        return routeMatches && timeMatches;
    });
}


// Display trip details

function fillScheduleDetails(trip) {
    const date = trip.departure_datetime.split(" ")[0];

    const details = {
        "selected-route":
            trip.pickup_point + " → " + trip.dropoff_point,

        "selected-date":
            formatScheduleDate(date, "long"),

        "selected-time":
            formatScheduleTime(trip.departure_datetime),

        "selected-line":
            trip.vehicle_model + " (" + trip.plate_number + ")",

        "selected-pickup":
            trip.pickup_point,

        "selected-dropoff":
            trip.dropoff_point,

        "selected-seats":
            trip.available_slots + " / " +
            trip.capacity + " available seats"
    };

    Object.keys(details).forEach(function (id) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = details[id];
        }
    });
}


// Generate available trip rows

function generateAvailableTrips() {
    tripList.replaceChildren();

    const trips = getAvailableTrips();

    if (!trips.length) {
        showTripMessage(
            "No trips match your selected date and filters."
        );

        return;
    }

    trips.forEach(function (trip) {
        const row = tripRowTemplate.content
            .firstElementChild.cloneNode(true);

        const date = trip.departure_datetime.split(" ")[0];

        row.querySelector(".trip-time").textContent =
            formatScheduleTime(trip.departure_datetime);

        row.querySelector(".trip-date").textContent =
            formatScheduleDate(date);

        row.querySelector(".trip-pickup").textContent =
            trip.pickup_point;

        row.querySelector(".trip-dropoff").textContent =
            trip.dropoff_point;

        row.querySelector(".trip-slots").textContent =
            trip.available_slots;

        const button = row.querySelector(".trip-select-button");

        button.dataset.tripId = String(trip.trip_id);

        button.disabled = Number(trip.available_slots) <= 0;

        button.setAttribute(
            "aria-label",
            "View details for " +
            formatScheduleTime(trip.departure_datetime) +
            " from " + trip.pickup_point
        );

        tripList.appendChild(row);
    });
}


// Populate route options from the database

function populateRoutes(routes) {
    const previousRoute = routeFilter.value;

    routeFilter.replaceChildren();

    routeFilter.add(
        new Option("All available routes", "")
    );

    routes.forEach(function (route) {
        const label =
            route.pickup_point + " → " + route.dropoff_point;

        const value = JSON.stringify([
            route.pickup_point,
            route.dropoff_point
        ]);

        routeFilter.add(new Option(label, value));
    });

    const routeStillExists = Array.from(
        routeFilter.options
    ).some(function (option) {
        return option.value === previousRoute;
    });

    if (routeStillExists) {
        routeFilter.value = previousRoute;
    }
}


// Load trip schedules from MySQL through PHP

async function loadScheduleTrips() {
    const requestNumber = ++scheduleRequestNumber;

    tripList.replaceChildren();
    showTripMessage("Loading trips from the database...");
    hideBookingMessage();

    const selectedDate = tripDateInput.value;

    const url = "api/trips.php" + (
        selectedDate
            ? "?date=" + encodeURIComponent(selectedDate)
            : ""
    );

    try {
        const response = await fetch(url, {
            cache: "no-store",
            credentials: "same-origin"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Could not load scheduled trips."
            );
        }

        // Ignore results from outdated requests.
        if (requestNumber !== scheduleRequestNumber) {
            return;
        }

        if (!Array.isArray(data.trips) ||
            !Array.isArray(data.routes)) {
            throw new Error("Invalid schedule response.");
        }

        scheduleTrips = data.trips;

        populateRoutes(data.routes);

        if (!selectedDate) {
            tripDateInput.value = data.date || "";
        }

        generateAvailableTrips();

    } catch (error) {
        if (requestNumber !== scheduleRequestNumber) {
            return;
        }

        console.error(
            "Trip schedule request failed:",
            error
        );

        scheduleTrips = [];

        tripList.replaceChildren();

        showTripMessage(
            "Unable to retrieve trips. Please try again."
        );

        showBookingMessage(
            "Unable to load trip schedules from the database.",
            "danger"
        );

        throw error;
    }
}


// Retrieve the booking security token

async function getBookingCsrfToken() {
    const response = await fetch("api/bookings.php", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
    });

    if (response.status === 401) {
        throw new Error(
            "Your login session has expired. Please log in again."
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Unable to verify your passenger account."
        );
    }

    if (!data.csrf_token) {
        throw new Error(
            "Unable to obtain a booking security token."
        );
    }

    return data.csrf_token;
}


// Create a booking through the PHP API

async function createScheduleBooking(tripId) {
    const csrfToken = await getBookingCsrfToken();

    const response = await fetch("api/bookings.php", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
            trip_id: tripId
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Unable to complete your booking."
        );
    }

    if (data.success !== true) {
        throw new Error(
            "The server did not confirm the reservation."
        );
    }

    return data;
}


// Process the booking confirmation

async function confirmScheduleBooking() {
    if (bookingInProgress) {
        return;
    }

    if (!selectedScheduleTripId) {
        showModalBookingMessage(
            "Please select a trip before booking."
        );
        return;
    }

    const tripId = Number(selectedScheduleTripId);

    if (!Number.isInteger(tripId) || tripId <= 0) {
        showModalBookingMessage(
            "The selected trip is invalid."
        );
        return;
    }

    bookingInProgress = true;
    hideModalBookingMessage();

    if (confirmBookingButton) {
        confirmBookingButton.disabled = true;
        confirmBookingButton.textContent = "Booking...";
    }

    try {
        const result = await createScheduleBooking(tripId);

        // Close the modal after a successful booking.
        if (tripDetailsModal && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(
                tripDetailsModal
            );

            if (modal) {
                modal.hide();
            }
        }

        // Refresh trip seats from the database.
        try {
            await loadScheduleTrips();

            showBookingMessage(
                result.message ||
                "Your booking has been confirmed.",
                "success"
            );
        } catch (refreshError) {
            showBookingMessage(
                "Your booking was confirmed, but the schedules " +
                "could not be refreshed. Reload the page to " +
                "view updated availability.",
                "warning"
            );
        }

    } catch (error) {
        console.error("Booking request failed:", error);

        showModalBookingMessage(
            error.message || "Unable to complete your booking."
        );

    } finally {
        bookingInProgress = false;

        if (confirmBookingButton) {
            confirmBookingButton.disabled = false;
            confirmBookingButton.textContent = "Book Trip";
        }
    }
}


// Trip details modal

if (tripDetailsModal) {
    tripDetailsModal.addEventListener(
        "show.bs.modal",
        function (event) {
            const selected = scheduleTrips.find(function (trip) {
                return String(trip.trip_id) ===
                    event.relatedTarget?.dataset.tripId;
            });

            if (!selected) {
                event.preventDefault();
                return;
            }

            selectedScheduleTripId = selected.trip_id;

            fillScheduleDetails(selected);
            hideModalBookingMessage();

            if (confirmBookingButton) {
                confirmBookingButton.disabled =
                    bookingInProgress ||
                    Number(selected.available_slots) <= 0;
            }
        }
    );

    tripDetailsModal.addEventListener(
        "hidden.bs.modal",
        function () {
            if (!bookingInProgress) {
                selectedScheduleTripId = null;
            }

            hideModalBookingMessage();
        }
    );
}


// Booking confirmation event

if (confirmBookingButton) {
    confirmBookingButton.addEventListener(
        "click",
        confirmScheduleBooking
    );
} else {
    console.warn(
        "Booking confirmation button was not found."
    );
}


// Filter event listeners

routeFilter.addEventListener(
    "change",
    generateAvailableTrips
);

tripTimeslotSelect.addEventListener(
    "change",
    generateAvailableTrips
);

tripDateInput.addEventListener(
    "change",
    loadScheduleTrips
);

window.addEventListener(
    "pageshow",
    function (event) {
        if (event.persisted) {
            loadScheduleTrips().catch(function () {
                // The loading function displays the error.
            });
        }
    }
);


// Initialize schedules

loadScheduleTrips().catch(function () {
    // The loading function displays the error.
});
