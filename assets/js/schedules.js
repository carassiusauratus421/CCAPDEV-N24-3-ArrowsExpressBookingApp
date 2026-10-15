/* ========================================================
   AVAILABLE TRIP SCHEDULES (LINE 1 ONLY)
   ======================================================== */
const scheduleStorageKey = "arrowsExpressDemoChanges:v1";
const tripDateInput = document.getElementById("trip-date");
const tripTimeslotSelect = document.getElementById("timeslot-filter");
const tripList = document.getElementById("available-trip-list");
const tripRowTemplate = document.getElementById("trip-row-template");
const tripDetailsModal = document.getElementById("trip-details-modal");

let scheduleSeed = null;
let scheduleData = null;
let currentDirection = document.querySelector(".direction-button.active").dataset.direction;
let currentTimeslot = tripTimeslotSelect.value;
let selectedScheduleTripId = null;

/* Reapply shared browser edits to a fresh copy of the JSON records. */
function rebuildScheduleData() {
    scheduleData = JSON.parse(JSON.stringify(scheduleSeed));

    try {
        const changes = JSON.parse(localStorage.getItem(scheduleStorageKey));

        if (!changes || changes.schemaVersion !== scheduleSeed.schemaVersion) {
            return;
        }

        ["users", "trips", "bookings"].forEach(function (section) {
            if (!Array.isArray(changes[section])) {
                return;
            }

            changes[section].forEach(function (change) {
                const index = scheduleData[section].findIndex(function (record) {
                    return record.id === change.id;
                });

                if (index === -1) {
                    scheduleData[section].push(change);
                } else {
                    Object.assign(scheduleData[section][index], change);
                }
            });
        });
    } catch (error) {
        console.warn("Saved schedule changes could not be loaded:", error);
    }
}

function getLocalDateValue(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: scheduleData.settings.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    return ["year", "month", "day"].map(function (type) {
        return parts.find(function (part) {
            return part.type === type;
        }).value;
    }).join("-");
}

function getTripDate(value) {
    return new Date(value + "T12:00:00+08:00");
}

function formatScheduleDate(value, month = "short") {
    return getTripDate(value).toLocaleDateString("en-US", {
        month: month,
        day: "numeric",
        year: "numeric",
        timeZone: scheduleData.settings.timeZone
    });
}

function formatScheduleTime(trip) {
    const departure = new Date(
        new Date(trip.date + "T00:00:00+08:00").getTime() +
        trip.departureMinutes * 60000
    );

    return departure.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: scheduleData.settings.timeZone
    });
}

function isTripDateValid() {
    const today = getLocalDateValue(new Date(scheduleData.settings.demoNow));

    const valid = tripDateInput.value !== "" &&
        tripDateInput.validity.valid && tripDateInput.value >= today;

    tripDateInput.classList.toggle("is-invalid", !valid);
    tripDateInput.setAttribute("aria-invalid", String(!valid));
    return valid;
}

function getDirectionDetails(direction) {
    const route = scheduleData.routes.find(function (item) {
        return item.id === direction;
    });

    return {
        route: route ? route.name : "Route unavailable",
        pickup: route
            ? route.pickupCampus + ", " + route.pickup
            : "To be announced",
        dropoff: route ? route.dropoff : "To be announced"
    };
}

function getScheduleType(dateValue) {
    const day = new Date(dateValue + "T00:00:00Z").getUTCDay();
    return day === 0 ? null : day === 6 ? "saturday" : "weekday";
}

function getTimeslot(minutes) {
    return minutes < 720
        ? "morning"
        : minutes < 1080
            ? "afternoon"
            : "evening";
}

/* Dated trips override weekly slots at the same departure time.
   Generated IDs match those used by my-bookings.js. */
function getAvailableTrips() {
    const date = tripDateInput.value;

    const datedTrips = scheduleData.trips.filter(function (trip) {
        return trip.date === date && trip.routeId === currentDirection;
    });

    const type = getScheduleType(date);
    const timetable = type ? scheduleData.weeklySchedules[type] : null;
    const slots = timetable ? timetable[currentDirection] || [] : [];
    const trips = datedTrips.slice();
    const direction = getDirectionDetails(currentDirection);

    slots.forEach(function (slot) {
        if (!datedTrips.some(function (trip) {
            return trip.departureMinutes === slot.departureMinutes;
        })) {
            trips.push({
                ...slot,
                id: "scheduled-" + date + "-" + slot.id,
                date: date,
                routeId: currentDirection,
                tripStatus: "Scheduled"
            });
        }
    });

    return trips.map(function (trip) {
        const vehicle = scheduleData.vehicles.find(function (item) {
            return item.id === trip.vehicleId;
        });

        const reservations = scheduleData.bookings.filter(function (booking) {
            return booking.tripId === trip.id &&
                (booking.status === "Confirmed" ||
                    booking.status === "On Hold");
        }).length;

        return {
            ...trip,
            ...direction,
            departure: formatScheduleTime(trip),
            shuttle: vehicle
                ? vehicle.name
                : scheduleData.settings.serviceName,
            available: Math.max(
                0,
                trip.capacity - (trip.otherReservations || 0) - reservations
            )
        };
    }).filter(function (trip) {
        return currentTimeslot === "all" ||
            getTimeslot(trip.departureMinutes) === currentTimeslot;
    }).sort(function (first, second) {
        return first.departureMinutes - second.departureMinutes;
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

function fillScheduleDetails(trip) {
    const details = {
        "selected-route": trip.route,
        "selected-date": formatScheduleDate(trip.date, "long"),
        "selected-time": trip.departure,
        "selected-shuttle": trip.shuttle,
        "selected-pickup": trip.pickup,
        "selected-dropoff": trip.dropoff,
        "selected-seats": trip.available + " / " +
            trip.capacity + " available seats"
    };

    Object.keys(details).forEach(function (id) {
        document.getElementById(id).textContent = details[id];
    });
}

function generateAvailableTrips() {
    tripList.replaceChildren();

    if (!isTripDateValid()) {
        showTripMessage(
            "Choose the demo date or a later date to view trips."
        );
        return;
    }

    const trips = getAvailableTrips();

    if (trips.length === 0) {
        showTripMessage(!getScheduleType(tripDateInput.value)
            ? "No trips are scheduled for this Sunday."
            : "No trips match your filters.");
        return;
    }

    trips.forEach(function (trip) {
        const row = tripRowTemplate.content.firstElementChild.cloneNode(true);

        row.querySelector(".trip-time").textContent = trip.departure;
        row.querySelector(".trip-date").textContent =
            formatScheduleDate(trip.date);
        row.querySelector(".trip-pickup").textContent = trip.pickup;
        row.querySelector(".trip-dropoff").textContent = trip.dropoff;
        row.querySelector(".trip-slots").textContent = trip.slots;

        const button = row.querySelector(".trip-select-button");
        button.dataset.tripId = trip.id;
        button.setAttribute(
            "aria-label",
            "View the " + trip.departure + " trip, " + trip.route
        );

        tripList.appendChild(row);
    });
}

function refreshSchedulePage() {
    if (!scheduleSeed) {
        return;
    }

    rebuildScheduleData();

    const passenger = scheduleData.users.find(function (user) {
        return user.id === scheduleData.settings.defaultPassengerId;
    });

    if (!passenger) {
        throw new Error("The demo passenger could not be found.");
    }

    document.querySelectorAll("[data-passenger-name]").forEach(function (name) {
        name.textContent = passenger.firstName + " " + passenger.lastName;
    });

    document.querySelectorAll("[data-route-name]").forEach(function (label) {
        label.textContent = getDirectionDetails(label.dataset.routeName).route;
    });

    document.getElementById("schedule-confirmation-minutes").textContent =
        scheduleData.settings.confirmationMinutes;

    const today = getLocalDateValue(new Date(scheduleData.settings.demoNow));
    tripDateInput.min = today;

    document.getElementById("trip-date-error").textContent =
        "Choose " + today + " or a later date.";

    if (!tripDateInput.value) {
        tripDateInput.value = today;
    }

    generateAvailableTrips();

    if (selectedScheduleTripId && isTripDateValid()) {
        const selected = getAvailableTrips().find(function (trip) {
            return trip.id === selectedScheduleTripId;
        });

        if (selected) {
            fillScheduleDetails(selected);
        }
    }
}

tripDetailsModal.addEventListener("show.bs.modal", function (event) {
    if (!scheduleSeed) {
        event.preventDefault();
        return;
    }

    rebuildScheduleData();

    const selectedTrip = isTripDateValid()
        ? getAvailableTrips().find(function (trip) {
            return trip.id === event.relatedTarget?.dataset.tripId;
        })
        : null;

    if (!selectedTrip) {
        event.preventDefault();
        showBookingMessage(
            "This trip could not be found. Please select another trip."
        );
        return;
    }

    selectedScheduleTripId = selectedTrip.id;
    fillScheduleDetails(selectedTrip);
});

tripDetailsModal.addEventListener("hidden.bs.modal", function () {
    selectedScheduleTripId = null;
});

document.querySelectorAll(".direction-button").forEach(function (button) {
    button.addEventListener("click", function () {
        currentDirection = button.dataset.direction;

        document.querySelectorAll(".direction-button").forEach(function (item) {
            const active = item === button;
            item.classList.toggle("active", active);
            item.setAttribute("aria-pressed", String(active));
        });

        refreshSchedulePage();
    });
});

tripDateInput.addEventListener("change", refreshSchedulePage);

tripTimeslotSelect.addEventListener("change", function () {
    currentTimeslot = tripTimeslotSelect.value;
    refreshSchedulePage();
});

window.addEventListener("arrows-express-data-updated", refreshSchedulePage);

window.addEventListener("storage", function (event) {
    if (event.key === scheduleStorageKey || event.key === null) {
        refreshSchedulePage();
    }
});

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        refreshSchedulePage();
    }
});

fetch("assets/data/mock-data.json")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load mock-data.json.");
        }

        return response.json();
    })
    .then(function (data) {
        scheduleSeed = data;
        refreshSchedulePage();
    })
    .catch(function (error) {
        console.error("Could not load schedules:", error);
        scheduleSeed = null;

        tripList.replaceChildren();
        showTripMessage("Unable to load schedules. Please reload the page.");
        showBookingMessage("Unable to load schedule data.", "danger");
    });