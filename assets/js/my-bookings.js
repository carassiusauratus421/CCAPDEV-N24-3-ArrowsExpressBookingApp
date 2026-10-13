/* ========================================================
   SAMPLE BOOKING DATA
   Categories are fixed for this preview, not calculated from today's date.
   The first four trips match the existing dashboard samples.
   ======================================================== */
const sampleBookings = [
    {
        id: "AE-001",
        category: "upcoming",
        date: "2025-04-28",
        route: "Manila → Laguna",
        departure: "8:00 AM",
        arrival: "10:00 AM",
        shuttle: "DLSU Shuttle 1",
        plate: "NCM 1234",
        vehicle: "Coaster",
        driver: "San Jose, R. (ID: 8743)",
        pickup: "DLSU Manila, Gate 1",
        dropoff: "DLSU Laguna Campus",
        status: "Confirmed",
        tripStatus: "On Time"
    },
    {
        id: "AE-002",
        category: "upcoming",
        date: "2025-04-30",
        route: "Laguna → Manila",
        departure: "4:00 PM",
        arrival: "6:00 PM",
        shuttle: "DLSU Shuttle 2",
        plate: "DEF 5678",
        vehicle: "Coaster",
        driver: "Not assigned",
        pickup: "DLSU Laguna Campus",
        dropoff: "DLSU Manila",
        status: "Confirmed",
        tripStatus: "Scheduled"
    },
    {
        id: "AE-003",
        category: "upcoming",
        date: "2025-05-02",
        route: "Manila → Laguna",
        departure: "8:00 AM",
        arrival: "10:00 AM",
        shuttle: "DLSU Shuttle 3",
        plate: "GHI 9012",
        vehicle: "Coaster",
        driver: "Not assigned",
        pickup: "DLSU Manila",
        dropoff: "DLSU Laguna Campus",
        status: "Confirmed",
        tripStatus: "Scheduled"
    },
    {
        id: "AE-004",
        category: "upcoming",
        date: "2025-05-05",
        route: "Laguna → Manila",
        departure: "4:00 PM",
        arrival: "6:00 PM",
        shuttle: "DLSU Shuttle 4",
        plate: "JKL 3456",
        vehicle: "Coaster",
        driver: "Not assigned",
        pickup: "DLSU Laguna Campus",
        dropoff: "DLSU Manila",
        status: "Confirmed",
        tripStatus: "Scheduled"
    },
    {
        id: "AE-005",
        category: "upcoming",
        date: "2025-05-08",
        route: "Manila → Laguna",
        departure: "7:00 AM",
        arrival: "9:00 AM",
        shuttle: "DLSU Shuttle 2",
        plate: "DEF 5678",
        vehicle: "Coaster",
        driver: "Not assigned",
        pickup: "DLSU Manila",
        dropoff: "DLSU Laguna Campus",
        status: "On Hold",
        tripStatus: "Scheduled"
    },
    {
        id: "AE-006",
        category: "completed",
        date: "2025-04-20",
        route: "Laguna → Manila",
        departure: "4:00 PM",
        arrival: "6:00 PM",
        shuttle: "DLSU Shuttle 1",
        plate: "NCM 1234",
        vehicle: "Coaster",
        driver: "San Jose, R. (ID: 8743)",
        pickup: "DLSU Laguna Campus",
        dropoff: "DLSU Manila",
        status: "Completed",
        tripStatus: "Arrived"
    },
    {
        id: "AE-007",
        category: "cancelled",
        date: "2025-04-22",
        route: "Manila → Laguna",
        departure: "8:00 AM",
        arrival: "10:00 AM",
        shuttle: "DLSU Shuttle 3",
        plate: "GHI 9012",
        vehicle: "Coaster",
        driver: "Not assigned",
        pickup: "DLSU Manila",
        dropoff: "DLSU Laguna Campus",
        status: "Cancelled",
        tripStatus: "Not applicable"
    }
];

const bookingCardTemplate = document.getElementById("booking-card-template");
const bookingDetailsModal = document.getElementById("booking-details-modal");
const bookingStatusClasses = {
    "Confirmed": "bg-success-subtle text-success border border-success-subtle",
    "On Hold": "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
    "Completed": "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle",
    "Cancelled": "bg-danger-subtle text-danger-emphasis border border-danger-subtle"
};

function getBookingDate(booking) {
    return new Date(booking.date + "T12:00:00");
}

function getBookingTime(booking) {
    return booking.departure + " – " + booking.arrival;
}

/* Build the cards from a single HTML template. */
function renderBookings(category) {
    const list = document.getElementById(category + "-list");
    const bookings = sampleBookings.filter(function (booking) {
        return booking.category === category;
    });
    list.replaceChildren();

    if (bookings.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "text-secondary border rounded-4 p-4";
        emptyMessage.textContent = "No " + category + " bookings to display.";
        list.appendChild(emptyMessage);
        return;
    }

    bookings.forEach(function (booking) {
        const card = bookingCardTemplate.content.firstElementChild.cloneNode(true);
        const date = getBookingDate(booking);
        card.querySelector(".booking-month").textContent = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
        card.querySelector(".booking-day").textContent = date.getDate();
        card.querySelector(".booking-year").textContent = date.getFullYear();
        card.querySelector(".booking-route").textContent = booking.route;
        card.querySelector(".booking-shuttle").textContent = booking.shuttle + " | " + booking.plate;
        card.querySelector(".booking-time").textContent = getBookingTime(booking);
        card.querySelector(".booking-pickup").textContent = booking.pickup;

        const status = card.querySelector(".booking-status");
        status.textContent = booking.status;
        status.className += " " + bookingStatusClasses[booking.status];

        const detailsButton = card.querySelector(".booking-details-button");
        detailsButton.dataset.bookingId = booking.id;
        detailsButton.setAttribute("aria-label", "View details for booking " + booking.id);
        list.appendChild(card);
    });
}

/* Populate the modal with plain text rather than inserting data as HTML. */
function fillBookingDetails(booking) {
    const details = {
        "detail-route": booking.route,
        "detail-id": booking.id,
        "detail-date": getBookingDate(booking).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        "detail-time": getBookingTime(booking),
        "detail-status": booking.status,
        "detail-trip-status": booking.tripStatus,
        "detail-shuttle": booking.shuttle,
        "detail-vehicle": booking.plate + " | " + booking.vehicle,
        "detail-driver": booking.driver,
        "detail-pickup": booking.pickup,
        "detail-dropoff": booking.dropoff
    };

    Object.keys(details).forEach(function (id) {
        document.getElementById(id).textContent = details[id];
    });
    document.getElementById("booking-actions").hidden = booking.category !== "upcoming";
}

function showBookingMessage(message, type = "warning") {
    const feedback = document.getElementById("booking-message");
    feedback.textContent = message;
    feedback.className = "alert alert-" + type;
}

bookingDetailsModal.addEventListener("show.bs.modal", function (event) {
    // A dashboard link opens the modal without a related button on this page.
    if (!event.relatedTarget) {
        return;
    }
    const booking = sampleBookings.find(function (item) {
        return item.id === event.relatedTarget.dataset.bookingId;
    });
    if (!booking) {
        event.preventDefault();
        showBookingMessage("This booking could not be found. Please select an existing booking.");
        return;
    }
    fillBookingDetails(booking);
});

["upcoming", "completed", "cancelled"].forEach(renderBookings);
document.getElementById("booking-loading").hidden = true;

/* Support dashboard links such as my-bookings.html?booking=AE-001. */
const requestedBookingId = new URLSearchParams(window.location.search).get("booking");
if (requestedBookingId) {
    const requestedBooking = sampleBookings.find(function (booking) {
        return booking.id === requestedBookingId;
    });
    if (requestedBooking) {
        bootstrap.Tab.getOrCreateInstance(document.getElementById(requestedBooking.category + "-tab")).show();
        fillBookingDetails(requestedBooking);
        bootstrap.Modal.getOrCreateInstance(bookingDetailsModal).show();
    } else {
        showBookingMessage("This booking could not be found. Please select View Details from the list.");
    }
}

/* ========================================================
   AVAILABLE TRIPS AND DEMO RESERVATIONS
   Trip data repeats by date and direction for this frontend preview.
   ======================================================== */
const tripSlots = [
    { id: "SH-01", shuttle: "DLSU Shuttle 1", plate: "ABC 1234", departure: "7:00 AM", arrival: "9:00 AM", hour: 7, capacity: 13, available: 8 },
    { id: "SH-02", shuttle: "DLSU Shuttle 2", plate: "DEF 5678", departure: "9:00 AM", arrival: "11:00 AM", hour: 9, capacity: 13, available: 5 },
    { id: "SH-03", shuttle: "DLSU Shuttle 3", plate: "GHI 9012", departure: "12:00 PM", arrival: "2:00 PM", hour: 12, capacity: 13, available: 11 },
    { id: "SH-04", shuttle: "DLSU Shuttle 4", plate: "JKL 3456", departure: "4:00 PM", arrival: "6:00 PM", hour: 16, capacity: 13, available: 7 }
];

const tripDateInput = document.getElementById("trip-date");
const tripRowTemplate = document.getElementById("trip-row-template");
const tripDetailsModal = document.getElementById("trip-details-modal");
const bookTripButton = document.getElementById("book-trip-button");
let currentDirection = "manila-laguna";
let selectedTrip = null;

/* Build a local calendar date without UTC shifting the selected day. */
function getLocalDateValue(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function isTripDateValid() {
    const valid = tripDateInput.value !== "" && tripDateInput.validity.valid && tripDateInput.value >= getLocalDateValue(new Date());
    tripDateInput.classList.toggle("is-invalid", !valid);
    tripDateInput.setAttribute("aria-invalid", String(!valid));
    return valid;
}

function getDirectionDetails(direction) {
    if (direction === "laguna-manila") {
        return { route: "Laguna → Manila", pickup: "DLSU Laguna Campus", dropoff: "DLSU Manila" };
    }
    return { route: "Manila → Laguna", pickup: "DLSU Manila", dropoff: "DLSU Laguna Campus" };
}

function getAvailableTrips() {
    const direction = getDirectionDetails(currentDirection);
    const now = new Date();
    return tripSlots.map(function (slot) {
        const key = tripDateInput.value + "|" + currentDirection + "|" + slot.id;
        const reservations = sampleBookings.filter(function (booking) {
            return booking.tripKey === key && booking.status !== "Cancelled";
        });
        return {
            ...slot,
            ...direction,
            key: key,
            date: tripDateInput.value,
            available: Math.max(0, slot.available - reservations.length),
            alreadyBooked: reservations.length > 0,
            departed: tripDateInput.value === getLocalDateValue(now) && slot.hour * 60 <= now.getHours() * 60 + now.getMinutes()
        };
    });
}

function renderAvailableTrips() {
    const list = document.getElementById("available-trip-list");
    list.replaceChildren();
    const direction = getDirectionDetails(currentDirection);
    document.getElementById("trip-pickup").textContent = direction.pickup;
    document.getElementById("trip-dropoff").textContent = direction.dropoff;

    if (!isTripDateValid()) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "Choose today or a future date to view trips.";
        row.appendChild(cell);
        list.appendChild(row);
        return;
    }

    getAvailableTrips().forEach(function (trip) {
        const row = tripRowTemplate.content.firstElementChild.cloneNode(true);
        row.querySelector(".trip-time").textContent = trip.departure;
        row.querySelector(".trip-shuttle").textContent = trip.shuttle;
        row.querySelector(".trip-plate").textContent = trip.plate;
        row.querySelector(".trip-seats").textContent = trip.available + " / " + trip.capacity + " seats";
        row.querySelector(".progress").setAttribute("aria-valuenow", trip.available);
        row.querySelector(".progress-bar").style.width = (trip.available / trip.capacity * 100) + "%";

        const button = row.querySelector(".trip-select-button");
        button.dataset.tripId = trip.id;
        button.setAttribute("aria-label", "Select " + trip.shuttle + " at " + trip.departure);
        button.disabled = trip.departed || trip.available === 0 || trip.alreadyBooked;
        if (trip.departed) {
            button.textContent = "Departed";
        } else if (trip.alreadyBooked) {
            button.textContent = "Already Booked";
        } else if (trip.available === 0) {
            button.textContent = "Full";
        }
        list.appendChild(row);
    });
}

tripDetailsModal.addEventListener("show.bs.modal", function (event) {
    selectedTrip = getAvailableTrips().find(function (trip) {
        return trip.id === event.relatedTarget?.dataset.tripId;
    });
    if (!isTripDateValid() || !selectedTrip || selectedTrip.departed || selectedTrip.available === 0 || selectedTrip.alreadyBooked) {
        event.preventDefault();
        selectedTrip = null;
        showBookingMessage("This trip is unavailable. Please select another trip.");
        return;
    }

    const details = {
        "selected-route": selectedTrip.route,
        "selected-date": getBookingDate(selectedTrip).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        "selected-time": selectedTrip.departure,
        "selected-shuttle": selectedTrip.shuttle + " | " + selectedTrip.plate,
        "selected-pickup": selectedTrip.pickup,
        "selected-dropoff": selectedTrip.dropoff,
        "selected-seats": selectedTrip.available + " / " + selectedTrip.capacity
    };
    Object.keys(details).forEach(function (id) {
        document.getElementById(id).textContent = details[id];
    });
    document.getElementById("trip-booking-error").classList.add("d-none");
    bookTripButton.disabled = false;
});

bookTripButton.addEventListener("click", function () {
    if (!selectedTrip || bookTripButton.disabled) {
        return;
    }
    const trip = getAvailableTrips().find(function (item) {
        return item.key === selectedTrip.key;
    });
    if (!trip || !isTripDateValid() || trip.departed || trip.available === 0 || trip.alreadyBooked) {
        const feedback = document.getElementById("trip-booking-error");
        feedback.textContent = "This trip is no longer available. Close this window and select another trip.";
        feedback.classList.remove("d-none");
        bookTripButton.disabled = true;
        return;
    }

    bookTripButton.disabled = true;
    const booking = {
        id: "AE-" + String(sampleBookings.length + 1).padStart(3, "0"),
        category: "upcoming",
        date: trip.date,
        route: trip.route,
        departure: trip.departure,
        arrival: trip.arrival,
        shuttle: trip.shuttle,
        plate: trip.plate,
        vehicle: "Coaster",
        driver: "Not assigned",
        pickup: trip.pickup,
        dropoff: trip.dropoff,
        status: "Confirmed",
        tripStatus: "Scheduled",
        tripKey: trip.key
    };
    sampleBookings.unshift(booking);
    selectedTrip = null;
    renderBookings("upcoming");
    renderAvailableTrips();
    bootstrap.Tab.getOrCreateInstance(document.getElementById("upcoming-tab")).show();
    bootstrap.Modal.getOrCreateInstance(tripDetailsModal).hide();
    document.getElementById("booking-toast-message").textContent = "Demo booking " + booking.id + " added to Upcoming.";
    bootstrap.Toast.getOrCreateInstance(document.getElementById("booking-toast")).show();
});

document.querySelectorAll(".direction-button").forEach(function (button) {
    button.addEventListener("click", function () {
        currentDirection = button.dataset.direction;
        document.querySelectorAll(".direction-button").forEach(function (item) {
            const active = item === button;
            item.classList.toggle("active", active);
            item.setAttribute("aria-pressed", String(active));
        });
        renderAvailableTrips();
    });
});

tripDateInput.addEventListener("change", renderAvailableTrips);
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
tripDateInput.min = getLocalDateValue(today);
tripDateInput.value = getLocalDateValue(tomorrow);
renderAvailableTrips();
