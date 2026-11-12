/* ========================================================
   MY BOOKINGS
   ======================================================== */

const tripDateInput = document.getElementById("trip-date");
const routeFilter = document.getElementById("route-filter");
const tripList = document.getElementById("available-trip-list");
const tripRowTemplate = document.getElementById("trip-row-template");
const tripDetailsModal = document.getElementById("trip-details-modal");
const bookTripButton = document.getElementById("book-trip-button");

const bookingCardTemplate = document.getElementById("booking-card-template");
const bookingDetailsModal = document.getElementById("booking-details-modal");
const upcomingList = document.getElementById("upcoming-list");
const completedList = document.getElementById("completed-list");
const cancelledList = document.getElementById("cancelled-list");
const bookingLoading = document.getElementById("booking-loading");
const bookingHistoryFilters = document.getElementById("booking-history-filters");
const bookingSearch = document.getElementById("booking-search");
const bookingStatusFilter = document.getElementById("booking-status-filter");
const bookingRouteFilter = document.getElementById("booking-route-filter");
const bookingSort = document.getElementById("booking-sort");
const bookingDateFrom = document.getElementById("booking-date-from");
const bookingDateTo = document.getElementById("booking-date-to");
const bookingClearFilters = document.getElementById("booking-clear-filters");
const bookingFilterCount = document.getElementById("booking-filter-count");

let availableTrips = [];
let passengerBookings = [];
let selectedTripId = null;
let selectedBookingId = null;
let tripRequestNumber = 0;


// Date and time formatting

function formatDate(dateString, month = "short") {
    const date = new Date(dateString + "T12:00:00+08:00");

    return date.toLocaleDateString("en-US", {
        month: month,
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila"
    });
}

function formatTime(datetime) {
    const time = datetime.split(" ")[1].slice(0, 5);
    const parts = time.split(":");
    const hour = Number(parts[0]);

    return (hour % 12 || 12) + ":" + parts[1] +
        (hour < 12 ? " AM" : " PM");
}

function getDateParts(datetime) {
    const date = datetime.split(" ")[0];
    const formattedDate = new Date(date + "T12:00:00+08:00");

    return {
        month: formattedDate.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "Asia/Manila"
        }),
        day: formattedDate.toLocaleDateString("en-US", {
            day: "numeric",
            timeZone: "Asia/Manila"
        }),
        year: formattedDate.toLocaleDateString("en-US", {
            year: "numeric",
            timeZone: "Asia/Manila"
        })
    };
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// Display messages

function showBookingMessage(message, type = "warning") {
    const element = document.getElementById("booking-message");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = "alert alert-" + type;
}

function showTripMessage(message) {
    tripList.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.className = "text-center text-secondary py-4";
    cell.textContent = message;

    row.appendChild(cell);
    tripList.appendChild(row);
}


// Populate route options from MySQL

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

    const routeExists = Array.from(
        routeFilter.options
    ).some(function (option) {
        return option.value === previousRoute;
    });

    if (routeExists) {
        routeFilter.value = previousRoute;
    }
}


// Filter trips by route

function getFilteredTrips() {
    const selectedRoute = routeFilter.value;

    if (!selectedRoute) {
        return availableTrips;
    }

    return availableTrips.filter(function (trip) {
        const tripRoute = JSON.stringify([
            trip.pickup_point,
            trip.dropoff_point
        ]);

        return tripRoute === selectedRoute;
    });
}


// Update trip information

function updateTripInformation() {
    const trips = getFilteredTrips();

    if (trips.length === 0) {
        setText("trip-pickup", "No scheduled departures");
        setText("trip-dropoff", "No scheduled departures");
    } else {
        const pickupPoints = [
            ...new Set(trips.map(function (trip) {
                return trip.pickup_point;
            }))
        ];

        const dropoffPoints = [
            ...new Set(trips.map(function (trip) {
                return trip.dropoff_point;
            }))
        ];

        setText("trip-pickup", pickupPoints.join(", "));
        setText("trip-dropoff", dropoffPoints.join(", "));
    }

    setText("trip-duration", "Varies depending on traffic");
}


// Display available trips

function generateAvailableTrips() {
    tripList.replaceChildren();

    const trips = getFilteredTrips();

    if (trips.length === 0) {
        showTripMessage(
            "No available trips for the selected route and date."
        );
        return;
    }

    trips.forEach(function (trip) {
        const row = tripRowTemplate.content
            .firstElementChild.cloneNode(true);

        const available = Number(trip.available_slots);
        const capacity = Number(trip.capacity);

        row.querySelector(".trip-time").textContent =
            formatTime(trip.departure_datetime);

        row.querySelector(".trip-shuttle").textContent =
            trip.vehicle_model;

        row.querySelector(".trip-plate").textContent =
            trip.plate_number;

        row.querySelector(".trip-seats").textContent =
            available + " / " + capacity + " seats";

        const progress = row.querySelector(".trip-seat-progress");
        const progressBar = row.querySelector(".progress-bar");

        const percentage = capacity > 0
            ? Math.max(0, Math.min(100, available / capacity * 100))
            : 0;

        progress.setAttribute("aria-valuemax", String(capacity));
        progress.setAttribute("aria-valuenow", String(available));

        progressBar.style.width = percentage + "%";

        const button = row.querySelector(".trip-select-button");

        button.dataset.tripId = String(trip.trip_id);
        button.disabled = available <= 0;

        tripList.appendChild(row);
    });
}


// Load trips from MySQL

async function loadAvailableTrips() {
    const requestNumber = ++tripRequestNumber;
    const selectedDate = tripDateInput.value;

    showTripMessage("Loading available trips...");

    const url = "api/trips.php" + (
        selectedDate
            ? "?date=" + encodeURIComponent(selectedDate)
            : ""
    );

    try {
        const response = await fetch(url, {
            cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to load trips."
            );
        }

        if (requestNumber !== tripRequestNumber) {
            return;
        }

        if (!Array.isArray(data.trips) ||
            !Array.isArray(data.routes)) {
            throw new Error("Invalid trip schedule response.");
        }

        availableTrips = data.trips;

        populateRoutes(data.routes);

        if (!selectedDate) {
            tripDateInput.value = data.date || "";
        }

        updateTripInformation();
        generateAvailableTrips();

    } catch (error) {
        if (requestNumber !== tripRequestNumber) {
            return;
        }

        console.error("Trip loading error:", error);

        availableTrips = [];
        showTripMessage("Unable to load trips from the database.");

        setText("trip-pickup", "Unavailable");
        setText("trip-dropoff", "Unavailable");
        setText("trip-duration", "Unavailable");
    }
}


// Display selected trip details

function fillTripDetails(trip) {
    const date = trip.departure_datetime.split(" ")[0];

    setText(
        "selected-route",
        trip.pickup_point + " → " + trip.dropoff_point
    );

    setText("selected-date", formatDate(date, "long"));
    setText("selected-time", formatTime(trip.departure_datetime));

    setText(
        "selected-shuttle",
        trip.vehicle_model + " (" + trip.plate_number + ")"
    );

    setText("selected-pickup", trip.pickup_point);
    setText("selected-dropoff", trip.dropoff_point);

    setText(
        "selected-seats",
        trip.available_slots + " / " +
        trip.capacity + " available seats"
    );
}


// Booking status

function getBookingCategory(booking) {
    const status = String(
        booking.booking_status || ""
    ).toLowerCase();

    if (status === "cancelled" || status === "canceled") {
        return "cancelled";
    }

    if (status === "completed") {
        return "completed";
    }

    const departure = new Date(
        booking.departure_datetime.replace(" ", "T") + "+08:00"
    );

    if (departure.getTime() < Date.now()) {
        return "completed";
    }

    return "upcoming";
}

function getBookingStatusLabel(booking) {
    const category = getBookingCategory(booking);

    if (category === "cancelled") {
        return "Cancelled";
    }

    if (category === "completed") {
        return "Completed";
    }

    const status = String(
        booking.booking_status || "pending"
    ).toLowerCase();

    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getBookingStatusClass(booking) {
    const category = getBookingCategory(booking);

    if (category === "cancelled") {
        return "bg-danger-subtle text-danger-emphasis";
    }

    if (category === "completed") {
        return "bg-secondary-subtle text-secondary-emphasis";
    }

    return "bg-success-subtle text-success-emphasis";
}


// Display passenger bookings

function showEmptyBookings(container, message) {
    const paragraph = document.createElement("p");

    paragraph.className = "small text-secondary py-3";
    paragraph.textContent = message;

    container.appendChild(paragraph);
}

function createBookingCard(booking) {
    const card = bookingCardTemplate.content
        .firstElementChild.cloneNode(true);

    const date = getDateParts(booking.departure_datetime);

    card.querySelector(".booking-month").textContent = date.month;
    card.querySelector(".booking-day").textContent = date.day;
    card.querySelector(".booking-year").textContent = date.year;

    card.querySelector(".booking-route").textContent =
        booking.pickup_point + " → " + booking.dropoff_point;

    card.querySelector(".booking-shuttle").textContent =
        booking.vehicle_model + " (" + booking.plate_number + ")";

    card.querySelector(".booking-time").textContent =
        formatTime(booking.departure_datetime);

    card.querySelector(".booking-pickup").textContent =
        booking.pickup_point;

    const badge = card.querySelector(".booking-status");

    badge.textContent = getBookingStatusLabel(booking);

    badge.className =
        "booking-status badge rounded-pill px-3 py-2 " +
        getBookingStatusClass(booking);

    const button = card.querySelector(".booking-details-button");

    button.dataset.bookingId = String(booking.booking_id);

    return card;
}

// Booking history filters work on the records already loaded from MySQL.
// They never alter a reservation or the Available Trips search.
function normalizedBookingStatus(booking) {
    const status = String(booking.booking_status || "")
        .toLowerCase().trim().replace(/[\s-]+/g, "_");

    if (status === "accepted") return "confirmed";
    if (status === "canceled") return "cancelled";
    return status;
}

function bookingRouteKey(booking) {
    return String(booking.pickup_point || "") + " → " +
        String(booking.dropoff_point || "");
}

function populateBookingRoutes() {
    if (!bookingRouteFilter) return;

    const previousValue = bookingRouteFilter.value;
    const routes = [...new Set(passengerBookings.map(bookingRouteKey))]
        .filter(route => route !== " → ")
        .sort((a, b) => a.localeCompare(b));

    bookingRouteFilter.replaceChildren();
    const allOption = new Option("All routes", "all");
    bookingRouteFilter.add(allOption);

    routes.forEach(function (route) {
        bookingRouteFilter.add(new Option(route, route));
    });

    bookingRouteFilter.value = routes.includes(previousValue)
        ? previousValue : "all";
}

function filteredPassengerBookings() {
    const search = (bookingSearch?.value || "").trim().toLowerCase();
    const status = bookingStatusFilter?.value || "all";
    const route = bookingRouteFilter?.value || "all";
    const from = bookingDateFrom?.value || "";
    const to = bookingDateTo?.value || "";
    const sort = bookingSort?.value || "newest";

    return passengerBookings.filter(function (booking) {
        const normalizedStatus = normalizedBookingStatus(booking);
        const category = getBookingCategory(booking);
        const bookingRoute = bookingRouteKey(booking);
        const departureDate = String(booking.departure_datetime || "").slice(0, 10);
        const searchable = [
            booking.booking_id,
            "AE-" + booking.booking_id,
            bookingRoute,
            booking.vehicle_model,
            booking.plate_number,
            getBookingStatusLabel(booking)
        ].join(" ").toLowerCase();

        if (search && !searchable.includes(search)) return false;
        if (status !== "all" &&
            status !== normalizedStatus &&
            !(status === "completed" && category === "completed")) {
            return false;
        }
        if (route !== "all" && bookingRoute !== route) return false;
        if (from && departureDate < from) return false;
        if (to && departureDate > to) return false;
        return true;
    }).sort(function (a, b) {
        const aDate = String(a.departure_datetime || "");
        const bDate = String(b.departure_datetime || "");
        const order = aDate.localeCompare(bDate) ||
            (Number(a.booking_id) - Number(b.booking_id));
        return sort === "oldest" ? order : -order;
    });
}

function generateBookingLists() {
    if (!upcomingList || !completedList || !cancelledList) return;

    upcomingList.replaceChildren();
    completedList.replaceChildren();
    cancelledList.replaceChildren();

    const groups = { upcoming: [], completed: [], cancelled: [] };
    const matches = filteredPassengerBookings();

    matches.forEach(function (booking) {
        const category = getBookingCategory(booking);
        if (groups[category]) groups[category].push(booking);
    });

    const containers = {
        upcoming: upcomingList,
        completed: completedList,
        cancelled: cancelledList
    };

    Object.keys(containers).forEach(function (category) {
        const container = containers[category];
        if (!groups[category].length) {
            showEmptyBookings(container, "No matching " + category + " bookings.");
            return;
        }
        groups[category].forEach(function (booking) {
            container.appendChild(createBookingCard(booking));
        });
    });

    if (bookingFilterCount) {
        bookingFilterCount.textContent = matches.length + " of " +
            passengerBookings.length + " booking(s) match your filters.";
    }
}


// Display booking details

function fillBookingDetails(booking) {
    const date = booking.departure_datetime.split(" ")[0];

    const driver = [
        booking.driver_first_name,
        booking.driver_last_name
    ].filter(Boolean).join(" ") || "Not assigned";

    setText(
        "detail-route",
        booking.pickup_point + " → " + booking.dropoff_point
    );

    setText("detail-id", String(booking.booking_id));
    setText("detail-date", formatDate(date, "long"));
    setText("detail-time", formatTime(booking.departure_datetime));
    setText("detail-status", getBookingStatusLabel(booking));

    setText(
        "detail-attendance",
        booking.passenger_confirmed
            ? "Confirmed"
            : "Not confirmed"
    );

    setText("detail-trip-status", booking.trip_status);
    setText("detail-shuttle", booking.vehicle_model);
    setText("detail-vehicle", booking.plate_number);
    setText("detail-driver", driver);
    setText("detail-pickup", booking.pickup_point);
    setText("detail-dropoff", booking.dropoff_point);
}


// Load passenger bookings

async function loadPassengerBookings() {
    if (bookingLoading) {
        bookingLoading.textContent = "Loading your bookings...";
    }

    try {
        const response = await fetch("api/bookings.php", {
            cache: "no-store",
            credentials: "same-origin"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to retrieve bookings."
            );
        }

        if (!Array.isArray(data.bookings)) {
            throw new Error("Invalid bookings response.");
        }

        passengerBookings = data.bookings;
        populateBookingRoutes();

        if (data.passenger) {
            const name = [
                data.passenger.first_name,
                data.passenger.last_name
            ].filter(Boolean).join(" ");

            document.querySelectorAll("[data-passenger-name]")
                .forEach(function (element) {
                    element.textContent = name;
                });
        }

        generateBookingLists();

        if (bookingLoading) {
            bookingLoading.textContent =
                passengerBookings.length + " booking(s) found.";
        }

    } catch (error) {
        console.error("Booking loading error:", error);

        passengerBookings = [];
        generateBookingLists();

        if (bookingLoading) {
            bookingLoading.textContent =
                "Bookings could not be loaded.";
        }

        showBookingMessage(error.message, "danger");
    }
}


// Trip details modal

if (tripDetailsModal) {
    tripDetailsModal.addEventListener(
        "show.bs.modal",
        function (event) {
            const tripId = event.relatedTarget?.dataset.tripId;

            const trip = availableTrips.find(function (item) {
                return String(item.trip_id) === tripId;
            });

            if (!trip) {
                event.preventDefault();
                return;
            }

            selectedTripId = trip.trip_id;
            fillTripDetails(trip);
        }
    );

    tripDetailsModal.addEventListener(
        "hidden.bs.modal",
        function () {
            selectedTripId = null;
        }
    );
}


// Booking details modal

if (bookingDetailsModal) {
    bookingDetailsModal.addEventListener(
        "show.bs.modal",
        function (event) {
            const bookingId = event.relatedTarget?.dataset.bookingId;

            const booking = passengerBookings.find(function (item) {
                return String(item.booking_id) === bookingId;
            });

            if (!booking) {
                event.preventDefault();
                return;
            }

            selectedBookingId = booking.booking_id;
            fillBookingDetails(booking);
        }
    );

    bookingDetailsModal.addEventListener(
        "hidden.bs.modal",
        function () {
            selectedBookingId = null;
        }
    );
}


// Route selection

routeFilter.addEventListener("change", function () {
    updateTripInformation();
    generateAvailableTrips();
});


// Date selection

tripDateInput.addEventListener("change", loadAvailableTrips);


// Keep unfinished booking actions disabled

if (bookTripButton) {
    bookTripButton.disabled = true;
    bookTripButton.title =
        "Database booking creation is not available yet.";
}

const cancelBookingButton = document.getElementById(
    "cancel-booking-button"
);

const confirmBookingButton = document.getElementById(
    "confirm-booking-button"
);

if (cancelBookingButton) {
    cancelBookingButton.hidden = true;
}

if (confirmBookingButton) {
    confirmBookingButton.hidden = true;
}


// Apply booking history filters immediately without another API request.
if (bookingHistoryFilters) {
    bookingHistoryFilters.addEventListener("submit", function (event) {
        event.preventDefault();
    });
    bookingHistoryFilters.addEventListener("input", generateBookingLists);
    bookingHistoryFilters.addEventListener("change", generateBookingLists);
}

if (bookingClearFilters) {
    bookingClearFilters.addEventListener("click", function () {
        if (bookingHistoryFilters) bookingHistoryFilters.reset();
        generateBookingLists();
    });
}

// Initialize page

loadAvailableTrips();
loadPassengerBookings();