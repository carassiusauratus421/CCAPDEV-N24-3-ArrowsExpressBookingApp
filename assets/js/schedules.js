/* ========================================================
   AVAILABLE TRIP SCHEDULES (LINE 1 ONLY)
   ======================================================== */
const tripSchedules = {
    weekday: {
        "manila-laguna": [
            { departure: "6:00 AM", hour: 6, slots: 65 },
            { departure: "7:30 AM", hour: 7, slots: 65 },
            { departure: "9:30 AM", hour: 9, slots: 39 },
            { departure: "11:00 AM", hour: 11, slots: 39 },
            { departure: "1:00 PM", hour: 13, slots: 39 },
            { departure: "2:30 PM", hour: 14, slots: 39 },
            { departure: "3:30 PM", hour: 15, slots: 39 },
            { departure: "5:30 PM", hour: 17, slots: 65 },
            { departure: "6:15 PM", hour: 18, slots: 26 },
            { departure: "7:45 PM", hour: 19, slots: 13 }
        ],
        "laguna-manila": [
            { departure: "6:00 AM", hour: 6, slots: 52 },
            { departure: "7:00 AM", hour: 7, slots: 52 },
            { departure: "9:00 AM", hour: 9, slots: 39 },
            { departure: "11:00 AM", hour: 11, slots: 39 },
            { departure: "1:00 PM", hour: 13, slots: 39 },
            { departure: "2:30 PM", hour: 14, slots: 39 },
            { departure: "3:30 PM", hour: 15, slots: 39 },
            { departure: "5:30 PM", hour: 17, slots: 65 },
            { departure: "6:15 PM", hour: 18, slots: 39 }
        ]
    },
    saturday: {
        "manila-laguna": [
            { departure: "6:00 AM", hour: 6, slots: 26 },
            { departure: "7:30 AM", hour: 7, slots: 26 },
            { departure: "9:00 AM", hour: 9, slots: 26 },
            { departure: "11:00 AM", hour: 11, slots: 26 },
            { departure: "1:00 PM", hour: 13, slots: 26 },
            { departure: "2:30 PM", hour: 14, slots: 13 },
            { departure: "3:30 PM", hour: 15, slots: 13 },
            { departure: "5:30 PM", hour: 17, slots: 39 }
        ],
        "laguna-manila": [
            { departure: "6:00 AM", hour: 6, slots: 26 },
            { departure: "7:00 AM", hour: 7, slots: 26 },
            { departure: "9:00 AM", hour: 9, slots: 26 },
            { departure: "11:00 AM", hour: 11, slots: 26 },
            { departure: "1:00 PM", hour: 13, slots: 26 },
            { departure: "2:30 PM", hour: 14, slots: 13 },
            { departure: "3:30 PM", hour: 15, slots: 13 },
            { departure: "5:30 PM", hour: 17, slots: 39 }
        ]
    }
};

const tripDateInput = document.getElementById("trip-date");
const tripTimeslotSelect = document.getElementById("timeslot-filter");
const tripList = document.getElementById("available-trip-list");
const tripRowTemplate = document.getElementById("trip-row-template");
const tripDetailsModal = document.getElementById("trip-details-modal");
let currentDirection = "manila-laguna";
let currentTimeslot = "all";

function getLocalDateValue(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function getTripDate(value) {
    return new Date(value + "T12:00:00");
}

function isTripDateValid() {
    const valid = tripDateInput.value !== "" && tripDateInput.validity.valid && tripDateInput.value >= getLocalDateValue(new Date());
    tripDateInput.classList.toggle("is-invalid", !valid);
    tripDateInput.setAttribute("aria-invalid", String(!valid));
    return valid;
}

function getDirectionDetails(direction) {
    if (direction === "laguna-manila") {
        return { route: "Laguna → Manila", pickup: "East Canopy (MRR Bldg.)", dropoff: "DLSU Manila" };
    }
    return { route: "Manila → Laguna", pickup: "Southgate (LS Bldg.)", dropoff: "DLSU Laguna Campus" };
}

/* Weekdays + Saturday have schedules, no service on Sundays */
function getScheduleType(dateValue) {
    const day = getTripDate(dateValue).getDay();
    switch (day) {
        case 0:
            return null;
        case 6:
            return "saturday";
        default:
            return "weekday";
    }
}

function getTimeslot(hour) {
    switch (true) {
        case hour < 12:
            return "morning";
        case hour < 18:
            return "afternoon";
        default:
            return "evening";
    }
}

function getAvailableTrips() {
    const scheduleType = getScheduleType(tripDateInput.value);
    if (!scheduleType) {
        return [];
    }
    const direction = getDirectionDetails(currentDirection);
    return tripSchedules[scheduleType][currentDirection].map(function (slot) {
        return {
            ...slot,
            ...direction,
            id: currentDirection + "|" + slot.departure,
            date: tripDateInput.value
        };
    }).filter(function (trip) {
        return currentTimeslot === "all" || getTimeslot(trip.hour) === currentTimeslot;
    });
}

function showBookingMessage(message, type = "warning") {
    const feedback = document.getElementById("booking-message");
    feedback.textContent = message;
    feedback.className = "alert alert-" + type;
}

function showTripMessage(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.style.gridColumn = "1 / -1";
    cell.className = "text-center text-secondary py-4";
    cell.textContent = message;
    row.appendChild(cell);
    tripList.appendChild(row);
}

function renderAvailableTrips() {
    tripList.replaceChildren();

    if (!isTripDateValid()) {
        showTripMessage("Choose today or a future date to view trips.");
        return;
    }
    if (!getScheduleType(tripDateInput.value)) {
        showTripMessage("No shuttle service on Sundays.");
        return;
    }

    const trips = getAvailableTrips();
    if (trips.length === 0) {
        showTripMessage("No trips match your filters.");
        return;
    }

    trips.forEach(function (trip) {
        const row = tripRowTemplate.content.firstElementChild.cloneNode(true);
        row.querySelector(".trip-time").textContent = trip.departure;
        row.querySelector(".trip-date").textContent = getTripDate(trip.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        row.querySelector(".trip-pickup").textContent = trip.pickup;
        row.querySelector(".trip-dropoff").textContent = trip.dropoff;

        const button = row.querySelector(".trip-select-button");
        button.dataset.tripId = trip.id;
        button.setAttribute("aria-label", "Select the " + trip.departure + " trip, " + trip.route);
        tripList.appendChild(row);
    });
}

tripDetailsModal.addEventListener("show.bs.modal", function (event) {
    const selectedTrip = getAvailableTrips().find(function (trip) {
        return trip.id === event.relatedTarget?.dataset.tripId;
    });
    if (!isTripDateValid() || !selectedTrip) {
        event.preventDefault();
        showBookingMessage("This trip is unavailable. Please select another trip.");
        return;
    }

    const details = {
        "selected-route": selectedTrip.route,
        "selected-date": getTripDate(selectedTrip.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        "selected-time": selectedTrip.departure,
        "selected-shuttle": "Arrows Express Line 1",
        "selected-pickup": selectedTrip.pickup,
        "selected-dropoff": selectedTrip.dropoff,
        "selected-seats": selectedTrip.slots + " slots"
    };
    Object.keys(details).forEach(function (id) {
        document.getElementById(id).textContent = details[id];
    });
    document.getElementById("trip-booking-error").classList.add("d-none");
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
tripTimeslotSelect.addEventListener("change", function () {
    currentTimeslot = tripTimeslotSelect.value;
    renderAvailableTrips();
});

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
tripDateInput.min = getLocalDateValue(today);
tripDateInput.value = getLocalDateValue(tomorrow);
renderAvailableTrips();