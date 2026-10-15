/* ========================================================
   MY BOOKINGS
   ======================================================== */
const bookingStorageKey = "arrowsExpressDemoChanges:v1";
const bookingCardTemplate = document.getElementById("booking-card-template");
const bookingDetailsModal = document.getElementById("booking-details-modal");
const tripRowTemplate = document.getElementById("trip-row-template");
const tripDetailsModal = document.getElementById("trip-details-modal");
const tripDateInput = document.getElementById("trip-date");
const bookTripButton = document.getElementById("book-trip-button");

let bookingSeed = null;
let bookingData = null;
let bookingChanges = {};
let bookingStorageAvailable = true;
let currentDirection = document.querySelector(".direction-button.active").dataset.direction;
let selectedTrip = null;
let selectedBookingId = null;

const bookingStatusClasses = {
    "Confirmed": "bg-success-subtle text-success border-success-subtle",
    "On Hold": "bg-warning-subtle text-warning-emphasis border-warning-subtle",
    "Completed": "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle",
    "Cancelled": "bg-danger-subtle text-danger-emphasis border-danger-subtle"
};

/* Preserve edits saved by the notification and profile pages. */
function readBookingChanges() {
    if (!bookingStorageAvailable) {
        return bookingChanges;
    }

    try {
        const saved = JSON.parse(localStorage.getItem(bookingStorageKey));

        return saved && saved.schemaVersion === bookingSeed.schemaVersion
            ? saved
            : { schemaVersion: bookingSeed.schemaVersion };
    } catch (error) {
        bookingStorageAvailable = false;
        console.warn("Saved demo changes could not be loaded:", error);
        return bookingChanges;
    }
}

function rebuildBookingData() {
    bookingChanges = readBookingChanges();
    bookingData = JSON.parse(JSON.stringify(bookingSeed));

    ["users", "trips", "bookings", "drivers", "notices"].forEach(function (section) {
        if (!Array.isArray(bookingChanges[section])) {
            return;
        }

        bookingChanges[section].forEach(function (change) {
            const index = bookingData[section].findIndex(function (record) {
                return record.id === change.id;
            });

            if (index === -1) {
                bookingData[section].push(change);
            } else {
                Object.assign(bookingData[section][index], change);
            }
        });
    });
}

/* Update one record while keeping its other saved fields. */
function setBookingChange(section, record) {
    bookingChanges[section] = bookingChanges[section] || [];

    const existing = bookingChanges[section].find(function (item) {
        return item.id === record.id;
    });

    if (existing) {
        Object.assign(existing, record);
    } else {
        bookingChanges[section].push({ ...record });
    }
}

function saveBookingChanges() {
    bookingChanges.schemaVersion = bookingSeed.schemaVersion;

    try {
        localStorage.setItem(bookingStorageKey, JSON.stringify(bookingChanges));
        bookingStorageAvailable = true;
    } catch (error) {
        bookingStorageAvailable = false;
        console.warn("Demo changes could not be saved:", error);
    }

    window.dispatchEvent(new Event("arrows-express-data-updated"));
}

function showBookingMessage(message, type = "warning") {
    const feedback = document.getElementById("booking-message");
    feedback.className = "alert alert-" + type;
    feedback.textContent = message;
}

function showBookingModalMessage(message, type = "success") {
    const feedback = document.getElementById("notification-feedback");
    feedback.className = "alert alert-" + type + " mt-3";
    feedback.textContent = message;
    feedback.focus({ preventScroll: true });
}

/* Date filters and trip times use the same Philippine demo clock. */
function getBookingDemoNow() {
    return new Date(bookingData.settings.demoNow);
}

function getBookingToday() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: bookingData.settings.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(getBookingDemoNow());

    return ["year", "month", "day"].map(function (type) {
        return parts.find(function (part) {
            return part.type === type;
        }).value;
    }).join("-");
}

function getBookingDeparture(trip) {
    return new Date(
        new Date(trip.date + "T00:00:00+08:00").getTime() +
        trip.departureMinutes * 60000
    );
}

function formatBookingDate(date, options) {
    return date.toLocaleDateString("en-US", {
        ...options,
        timeZone: bookingData.settings.timeZone
    });
}

function formatBookingTime(date) {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: bookingData.settings.timeZone
    });
}

/* Join a trip to its route, vehicle and assigned driver. */
function getBookingTripDetails(trip) {
    const route = bookingData.routes.find(function (item) {
        return item.id === trip.routeId;
    });

    const vehicle = bookingData.vehicles.find(function (item) {
        return item.id === trip.vehicleId;
    });

    const driver = bookingData.drivers.find(function (item) {
        return item.id === trip.driverId;
    });

    const driverUser = driver
        ? bookingData.users.find(function (user) {
            return user.id === driver.userId;
        })
        : null;

    const departure = getBookingDeparture(trip);
    const arrival = new Date(
        departure.getTime() + trip.durationMinutes * 60000
    );

    return {
        trip: trip,
        departure: departure,
        arrival: arrival,
        route: route ? route.name : "Route unavailable",
        pickup: route
            ? route.pickupCampus + ", " + route.pickup
            : "To be announced",
        dropoff: route ? route.dropoff : "To be announced",
        shuttle: vehicle ? vehicle.name : bookingData.settings.serviceName,
        plate: vehicle ? vehicle.plate : "Vehicle to be assigned",
        vehicle: vehicle ? vehicle.type : "To be assigned",
        driver: driverUser
            ? driverUser.lastName + ", " + driverUser.firstName.charAt(0) +
                ". (ID: " + driver.employeeNumber + ")"
            : "Not assigned"
    };
}

function getPassengerBooking(bookingId) {
    const booking = bookingData.bookings.find(function (item) {
        return item.id === bookingId &&
            item.userId === bookingData.settings.defaultPassengerId;
    });

    const trip = booking && bookingData.trips.find(function (item) {
        return item.id === booking.tripId;
    });

    return trip
        ? { ...getBookingTripDetails(trip), booking: booking }
        : null;
}

function getBookingCategory(booking) {
    if (booking.status === "Cancelled") {
        return "cancelled";
    }

    return booking.status === "Completed" ? "completed" : "upcoming";
}

/* Build the three booking lists from the same shared records. */
function renderBookings(category) {
    const list = document.getElementById(category + "-list");

    const bookings = bookingData.bookings
        .map(function (booking) {
            return getPassengerBooking(booking.id);
        })
        .filter(function (details) {
            return details &&
                getBookingCategory(details.booking) === category;
        })
        .sort(function (first, second) {
            return category === "upcoming"
                ? first.departure - second.departure
                : second.departure - first.departure;
        });

    list.replaceChildren();

    if (bookings.length === 0) {
        const empty = document.createElement("p");
        empty.className = "text-secondary p-4 mb-0";
        empty.textContent = "No " + category + " bookings to display.";
        list.appendChild(empty);
    }

    bookings.forEach(function (details) {
        const card = bookingCardTemplate.content.firstElementChild.cloneNode(true);

        const fields = {
            ".booking-month": formatBookingDate(
                details.departure,
                { month: "short" }
            ).toUpperCase(),
            ".booking-day": formatBookingDate(
                details.departure,
                { day: "numeric" }
            ),
            ".booking-year": formatBookingDate(
                details.departure,
                { year: "numeric" }
            ),
            ".booking-route": details.route,
            ".booking-shuttle": details.shuttle + " | " + details.plate,
            ".booking-time": formatBookingTime(details.departure) +
                " – " + formatBookingTime(details.arrival),
            ".booking-pickup": details.pickup
        };

        Object.keys(fields).forEach(function (selector) {
            card.querySelector(selector).textContent = fields[selector];
        });

        const status = card.querySelector(".booking-status");
        status.textContent = details.booking.status;
        status.className =
            "booking-status badge rounded-pill px-3 py-2 border " +
            (bookingStatusClasses[details.booking.status] ||
                "bg-light text-dark");

        const button = card.querySelector(".booking-details-button");
        button.dataset.bookingId = details.booking.id;
        button.setAttribute(
            "aria-label",
            "View details for booking " + details.booking.id
        );

        list.appendChild(card);
    });
}

/* Keep the open details modal synchronized after confirmation or cancellation. */
function fillBookingDetails(details) {
    const booking = details.booking;

    const fields = {
        "detail-route": details.route,
        "detail-id": booking.id,
        "detail-date": formatBookingDate(details.departure, {
            month: "long",
            day: "numeric",
            year: "numeric"
        }),
        "detail-time": formatBookingTime(details.departure) +
            " – " + formatBookingTime(details.arrival),
        "detail-status": booking.status,
        "detail-attendance": booking.attendanceConfirmed
            ? "Confirmed"
            : "Not confirmed",
        "detail-trip-status": details.trip.tripStatus || "Scheduled",
        "detail-shuttle": details.shuttle,
        "detail-vehicle": details.plate + " | " + details.vehicle,
        "detail-driver": details.driver,
        "detail-pickup": details.pickup,
        "detail-dropoff": details.dropoff
    };

    Object.keys(fields).forEach(function (id) {
        document.getElementById(id).textContent = fields[id];
    });

    const upcoming = getBookingCategory(booking) === "upcoming";
    const minutes = (details.departure - getBookingDemoNow()) / 60000;

    const canConfirm = booking.status === "Confirmed" &&
        !booking.attendanceConfirmed &&
        minutes > 0 &&
        minutes <= bookingData.settings.confirmationMinutes;

    document.getElementById("booking-actions").hidden = !upcoming;

    const confirmButton = document.getElementById("confirm-booking-button");
    confirmButton.dataset.confirmBooking = booking.id;
    confirmButton.hidden = !canConfirm;

    document.getElementById("cancel-booking-button").hidden =
        !upcoming || minutes <= 0;

    let note = "Your attendance is confirmed.";

    if (minutes <= 0) {
        note = "This trip has departed. Booking actions are no longer available.";
    } else if (booking.status === "On Hold") {
        note = "This booking is on hold. Attendance confirmation requires a confirmed reservation.";
    } else if (!booking.attendanceConfirmed) {
        const opens = new Date(
            details.departure.getTime() -
            bookingData.settings.confirmationMinutes * 60000
        );

        note = canConfirm
            ? "Please confirm your attendance before departure."
            : "Attendance confirmation opens on " +
                formatBookingDate(opens, {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }) +
                " at " + formatBookingTime(opens) + ".";
    }

    document.getElementById("booking-action-note").textContent = note;
}

function isTripDateValid() {
    const valid = tripDateInput.value !== "" &&
        tripDateInput.validity.valid &&
        tripDateInput.value >= getBookingToday();

    tripDateInput.classList.toggle("is-invalid", !valid);
    tripDateInput.setAttribute("aria-invalid", String(!valid));

    return valid;
}

/* Combine dated trips with the weekly timetable, without duplicating a departure.
   A dated trip takes priority over a weekly slot at the same time. */
function getAvailableTrips(
    date = tripDateInput.value,
    direction = currentDirection
) {
    const datedTrips = bookingData.trips.filter(function (trip) {
        return trip.date === date && trip.routeId === direction;
    });

    const day = new Date(date + "T00:00:00Z").getUTCDay();

    const timetable = day === 0
        ? null
        : bookingData.weeklySchedules[
            day === 6 ? "saturday" : "weekday"
        ];

    const slots = timetable ? timetable[direction] || [] : [];
    const trips = datedTrips.slice();

    slots.forEach(function (slot) {
        if (!datedTrips.some(function (trip) {
            return trip.departureMinutes === slot.departureMinutes;
        })) {
            trips.push({
                ...slot,
                id: "scheduled-" + date + "-" + slot.id,
                date: date,
                routeId: direction,
                tripStatus: "Scheduled"
            });
        }
    });

    return trips.map(function (trip) {
        const reservations = bookingData.bookings.filter(function (booking) {
            return booking.tripId === trip.id &&
                (booking.status === "Confirmed" ||
                    booking.status === "On Hold");
        });

        return {
            ...getBookingTripDetails(trip),
            available: Math.max(
                0,
                trip.capacity -
                    (trip.otherReservations || 0) -
                    reservations.length
            ),
            alreadyBooked: reservations.some(function (booking) {
                return booking.userId ===
                    bookingData.settings.defaultPassengerId;
            }),
            departed: getBookingDeparture(trip) <= getBookingDemoNow(),
            unavailable: [
                "Cancelled",
                "Arrived",
                "Not applicable"
            ].includes(trip.tripStatus)
        };
    }).sort(function (first, second) {
        return first.departure - second.departure;
    });
}

function canReserveTrip(details) {
    return details &&
        details.available > 0 &&
        !details.alreadyBooked &&
        !details.departed &&
        !details.unavailable;
}

function showAvailableTripMessage(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.textContent = message;
    row.appendChild(cell);

    document.getElementById("available-trip-list").replaceChildren(row);
}

function renderAvailableTrips() {
    const list = document.getElementById("available-trip-list");

    const route = bookingData.routes.find(function (item) {
        return item.id === currentDirection;
    });

    document.getElementById("trip-pickup").textContent =
        route ? route.pickupCampus + ", " + route.pickup : "To be announced";

    document.getElementById("trip-dropoff").textContent =
        route ? route.dropoff : "To be announced";

    if (!isTripDateValid()) {
        document.getElementById("trip-duration").textContent =
            "Choose a valid date.";

        showAvailableTripMessage(
            "Choose the demo date or a later date to view trips."
        );
        return;
    }

    const trips = getAvailableTrips();
    list.replaceChildren();

    const durations = trips.map(function (details) {
        return details.trip.durationMinutes / 60;
    });

    const minimum = Math.min(...durations);
    const maximum = Math.max(...durations);

    document.getElementById("trip-duration").textContent =
        trips.length === 0
            ? "No trips scheduled."
            : (minimum === maximum
                ? String(minimum)
                : minimum + " – " + maximum) +
                (maximum === 1 ? " hour" : " hours");

    if (trips.length === 0) {
        showAvailableTripMessage(
            "No trips are scheduled for this direction and date."
        );
    }

    trips.forEach(function (details) {
        const row = tripRowTemplate.content.firstElementChild.cloneNode(true);

        row.querySelector(".trip-time").textContent =
            formatBookingTime(details.departure);

        row.querySelector(".trip-shuttle").textContent = details.shuttle;
        row.querySelector(".trip-plate").textContent = details.plate;
        row.querySelector(".trip-seats").textContent =
            details.available + " / " + details.trip.capacity + " seats";

        const progress = row.querySelector(".progress");
        progress.setAttribute("aria-valuemax", details.trip.capacity);
        progress.setAttribute("aria-valuenow", details.available);

        row.querySelector(".progress-bar").style.width =
            (details.trip.capacity > 0
                ? details.available / details.trip.capacity * 100
                : 0) + "%";

        const button = row.querySelector(".trip-select-button");
        button.dataset.tripId = details.trip.id;
        button.disabled = !canReserveTrip(details);

        button.textContent = details.departed
            ? "Departed"
            : details.unavailable
                ? "Unavailable"
                : details.alreadyBooked
                    ? "Already Booked"
                    : details.available === 0
                        ? "Full"
                        : "Select";

        button.setAttribute(
            "aria-label",
            button.textContent + ": " + details.route +
            " at " + formatBookingTime(details.departure)
        );

        list.appendChild(row);
    });
}

function refreshBookingsPage() {
    if (!bookingSeed) {
        return;
    }

    rebuildBookingData();

    const passenger = bookingData.users.find(function (user) {
        return user.id === bookingData.settings.defaultPassengerId;
    });

    if (!passenger) {
        throw new Error("The demo passenger could not be found.");
    }

    document.querySelectorAll("[data-passenger-name]").forEach(function (name) {
        name.textContent = passenger.firstName + " " + passenger.lastName;
    });

    document.querySelectorAll("[data-route-name]").forEach(function (label) {
        const route = bookingData.routes.find(function (item) {
            return item.id === label.dataset.routeName;
        });

        label.textContent = route ? route.name : "Route unavailable";
    });

    document.getElementById("trip-confirmation-minutes").textContent =
        bookingData.settings.confirmationMinutes;

    tripDateInput.min = getBookingToday();

    document.getElementById("trip-date-error").textContent =
        "Choose " + getBookingToday() + " or a later date.";

    if (!tripDateInput.value) {
        tripDateInput.value = getBookingToday();
    }

    ["upcoming", "completed", "cancelled"].forEach(renderBookings);
    renderAvailableTrips();

    document.getElementById("booking-loading").hidden = true;

    if (selectedBookingId) {
        const details = getPassengerBooking(selectedBookingId);

        if (details) {
            fillBookingDetails(details);
        }
    }
}

/* Bootstrap supplies the clicked card button as relatedTarget. */
bookingDetailsModal.addEventListener("show.bs.modal", function (event) {
    if (!bookingSeed) {
        event.preventDefault();
        return;
    }

    rebuildBookingData();

    const id = event.relatedTarget
        ? event.relatedTarget.dataset.bookingId
        : selectedBookingId;

    const details = getPassengerBooking(id);

    if (!details) {
        event.preventDefault();
        showBookingMessage("This booking could not be found.");
        return;
    }

    selectedBookingId = id;
    document.getElementById("notification-feedback").classList.add("d-none");
    fillBookingDetails(details);
});

tripDetailsModal.addEventListener("show.bs.modal", function (event) {
    if (!bookingSeed) {
        event.preventDefault();
        return;
    }

    rebuildBookingData();

    const id = event.relatedTarget
        ? event.relatedTarget.dataset.tripId
        : null;

    const details = isTripDateValid()
        ? getAvailableTrips().find(function (item) {
            return item.trip.id === id;
        })
        : null;

    if (!canReserveTrip(details)) {
        event.preventDefault();
        showBookingMessage(
            "This trip is unavailable. Please select another trip."
        );
        return;
    }

    selectedTrip = details.trip;

    const fields = {
        "selected-route": details.route,
        "selected-date": formatBookingDate(details.departure, {
            month: "long",
            day: "numeric",
            year: "numeric"
        }),
        "selected-time": formatBookingTime(details.departure),
        "selected-shuttle": details.shuttle + " | " + details.plate,
        "selected-pickup": details.pickup,
        "selected-dropoff": details.dropoff,
        "selected-seats": details.available + " / " + details.trip.capacity
    };

    Object.keys(fields).forEach(function (id) {
        document.getElementById(id).textContent = fields[id];
    });

    document.getElementById("trip-booking-error").classList.add("d-none");
    bookTripButton.disabled = false;
});

tripDetailsModal.addEventListener("hidden.bs.modal", function () {
    selectedTrip = null;
});

/* Recheck seats and duplicates immediately before adding a reservation. */
bookTripButton.addEventListener("click", function () {
    if (!selectedTrip || bookTripButton.disabled) {
        return;
    }

    rebuildBookingData();

    const details = getAvailableTrips(
        selectedTrip.date,
        selectedTrip.routeId
    ).find(function (item) {
        return item.trip.id === selectedTrip.id;
    });

    if (!canReserveTrip(details)) {
        const error = document.getElementById("trip-booking-error");

        error.textContent =
            "This trip is no longer available. Please select another trip.";
        error.classList.remove("d-none");

        bookTripButton.disabled = true;
        renderAvailableTrips();
        return;
    }

    bookTripButton.disabled = true;

    const numbers = bookingData.bookings.map(function (booking) {
        const match = /^AE-(\d+)$/.exec(booking.id);
        return match ? Number(match[1]) : 0;
    });

    const bookingId =
        "AE-" + String(Math.max(0, ...numbers) + 1).padStart(3, "0");

    if (!bookingData.trips.some(function (trip) {
        return trip.id === selectedTrip.id;
    })) {
        setBookingChange("trips", selectedTrip);
    }

    setBookingChange("bookings", {
        id: bookingId,
        userId: bookingData.settings.defaultPassengerId,
        tripId: selectedTrip.id,
        status: "Confirmed",
        attendanceConfirmed: false
    });

    setBookingChange("notices", {
        id: "booking-created-" + bookingId,
        userId: bookingData.settings.defaultPassengerId,
        bookingId: bookingId,
        type: "booking-created",
        createdAt: getBookingDemoNow().toISOString()
    });

    selectedTrip = null;
    saveBookingChanges();

    bootstrap.Tab.getOrCreateInstance(
        document.getElementById("upcoming-tab")
    ).show();

    bootstrap.Modal.getOrCreateInstance(tripDetailsModal).hide();

    document.getElementById("booking-toast-message").textContent =
        "Demo booking " + bookingId + " added to Upcoming." +
        (bookingStorageAvailable
            ? ""
            : " Changes could not be saved in this browser.");

    bootstrap.Toast.getOrCreateInstance(
        document.getElementById("booking-toast")
    ).show();
});

/* Attendance is handled by notifications.js using data-confirm-booking. */
document.getElementById("cancel-booking-button").addEventListener("click", function () {
    if (!bookingSeed || !selectedBookingId) {
        return;
    }

    rebuildBookingData();
    const details = getPassengerBooking(selectedBookingId);

    if (!details ||
        getBookingCategory(details.booking) !== "upcoming" ||
        details.departure <= getBookingDemoNow()) {
        showBookingModalMessage(
            "This booking can no longer be cancelled.",
            "warning"
        );
        return;
    }

    if (!window.confirm("Cancel booking " + details.booking.id + "?")) {
        return;
    }

    /* Read again after the confirmation dialog to preserve recent tab edits. */
    rebuildBookingData();
    const current = getPassengerBooking(selectedBookingId);

    if (!current ||
        getBookingCategory(current.booking) !== "upcoming" ||
        current.departure <= getBookingDemoNow()) {
        refreshBookingsPage();
        showBookingModalMessage(
            "This booking can no longer be cancelled.",
            "warning"
        );
        return;
    }

    setBookingChange("bookings", {
        id: current.booking.id,
        status: "Cancelled",
        attendanceConfirmed: false
    });

    saveBookingChanges();

    showBookingModalMessage(
        "Booking " + current.booking.id + " cancelled." +
        (bookingStorageAvailable
            ? ""
            : " This change could not be saved in this browser.")
    );
});

document.querySelectorAll(".direction-button").forEach(function (button) {
    button.addEventListener("click", function () {
        currentDirection = button.dataset.direction;

        document.querySelectorAll(".direction-button").forEach(function (item) {
            const active = item === button;
            item.classList.toggle("active", active);
            item.setAttribute("aria-pressed", String(active));
        });

        if (bookingSeed) {
            refreshBookingsPage();
        }
    });
});

tripDateInput.addEventListener("change", function () {
    if (bookingSeed) {
        refreshBookingsPage();
    }
});

/* View All and mobile My Bookings links select the Upcoming tab. */
function handleBookingHash() {
    if (window.location.hash === "#my-bookings") {
        bootstrap.Tab.getOrCreateInstance(
            document.getElementById("upcoming-tab")
        ).show();

        requestAnimationFrame(function () {
            document.getElementById("my-bookings").scrollIntoView({
                block: "start"
            });
        });
    }
}

window.addEventListener("hashchange", handleBookingHash);

window.addEventListener(
    "arrows-express-data-updated",
    refreshBookingsPage
);

window.addEventListener("storage", function (event) {
    if (event.key === bookingStorageKey || event.key === null) {
        refreshBookingsPage();
    }
});

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        refreshBookingsPage();
    }
});

/* Open a booking from a dashboard or notification link after data is ready. */
fetch("assets/data/mock-data.json")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load mock-data.json.");
        }

        return response.json();
    })
    .then(function (data) {
        bookingSeed = data;
        refreshBookingsPage();
        handleBookingHash();

        const requestedId = new URLSearchParams(
            window.location.search
        ).get("booking");

        if (requestedId) {
            const details = getPassengerBooking(requestedId);

            if (details) {
                selectedBookingId = requestedId;

                bootstrap.Tab.getOrCreateInstance(
                    document.getElementById(
                        getBookingCategory(details.booking) + "-tab"
                    )
                ).show();

                bootstrap.Modal.getOrCreateInstance(
                    bookingDetailsModal
                ).show();
            } else {
                showBookingMessage(
                    "This booking could not be found. Select View Details from the list."
                );
            }
        }
    })
    .catch(function (error) {
        console.error("Could not load booking data:", error);
        bookingSeed = null;

        document.getElementById("booking-loading").hidden = false;
        document.getElementById("booking-loading").textContent =
            "Unable to load booking data.";

        showAvailableTripMessage(
            "Unable to load trips. Please reload the page."
        );

        showBookingMessage(
            "Unable to load bookings. Please reload the page.",
            "danger"
        );
    });

