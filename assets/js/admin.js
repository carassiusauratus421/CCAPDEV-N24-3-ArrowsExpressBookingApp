/* ========================================================
   ADMIN PAGES
   ======================================================== */
const adminStorageKey = "arrowsExpressDemoChanges:v1";
const adminPage = document.body.dataset.adminPage;
const adminMessage = document.getElementById("admin-message");
let adminSeed = null;
let adminData = null;
let currentAdmin = null;
let editingUserId = null;
let editingVehicleId = null;

function showAdminMessage(message, type = "success", target = adminMessage) {
    target.className = "alert alert-" + type;
    target.textContent = message;
    target.focus({ preventScroll: true });
}

/* Read before each action so edits from other pages are preserved. */
function readAdminChanges() {
    const changes = JSON.parse(localStorage.getItem(adminStorageKey));
    return changes && changes.schemaVersion === adminSeed.schemaVersion
        ? changes
        : { schemaVersion: adminSeed.schemaVersion };
}

/* Combine JSON defaults with saved admin and passenger changes. */
function rebuildAdminData() {
    const changes = readAdminChanges();
    adminData = JSON.parse(JSON.stringify(adminSeed));

    ["users", "drivers", "vehicles", "trips", "bookings", "notices"].forEach(function (section) {
        (changes[section] || []).forEach(function (change) {
            const record = adminData[section].find(function (item) {
                return item.id === change.id;
            });
            if (record) {
                Object.assign(record, change);
            } else {
                adminData[section].push({ ...change });
            }
        });
    });

    /* Read the existing driver's status while its page uses the legacy key. */
    const defaultDriver = adminData.drivers.find(function (driver) {
        return driver.userId === adminData.settings.defaultDriverUserId;
    });
    const driverUser = defaultDriver && adminData.users.find(function (user) {
        return user.id === defaultDriver.userId;
    });
    if (driverUser) {
        const status = JSON.parse(localStorage.getItem("arrowsExpressDriverStatus:" + driverUser.email));
        if (status && Object.hasOwn(adminData.driverStatuses, status.status) &&
            Number.isFinite(Date.parse(status.updatedAt)) &&
            (!defaultDriver.updatedAt || Date.parse(status.updatedAt) > Date.parse(defaultDriver.updatedAt))) {
            Object.assign(defaultDriver, status);
        }
    }

    const session = JSON.parse(sessionStorage.getItem("arrowsExpressUser"));
    currentAdmin = session && adminData.users.find(function (user) {
        return user.id === session.id && user.role === "admin" && !user.deleted;
    });
}

/* Save only changed records. JSON remains the unchanged source of seed data. */
function saveAdminRecords(updates, message) {
    if (!currentAdmin) {
        throw new Error("Log in with a demo admin account first.");
    }
    const changes = readAdminChanges();
    Object.keys(updates).forEach(function (section) {
        changes[section] = changes[section] || [];
        updates[section].forEach(function (update) {
            const record = changes[section].find(function (item) {
                return item.id === update.id;
            });
            if (record) {
                Object.assign(record, update);
            } else {
                changes[section].push({ ...update });
            }
        });
    });
    localStorage.setItem(adminStorageKey, JSON.stringify(changes));
    window.dispatchEvent(new Event("arrows-express-data-updated"));
    showAdminMessage(message);
}

function getAdminUser(id) {
    return adminData.users.find(function (user) { return user.id === id; });
}

function getAdminVehicle(id) {
    return adminData.vehicles.find(function (vehicle) { return vehicle.id === id; });
}

function getAdminTrip(id) {
    return adminData.trips.find(function (trip) { return trip.id === id; });
}

function getAdminName(user) {
    return user ? user.firstName + " " + user.lastName : "Profile unavailable";
}

function getAdminRoute(trip) {
    const route = trip && adminData.routes.find(function (item) { return item.id === trip.routeId; });
    return route ? route.name : "Route unavailable";
}

function getAdminDeparture(trip) {
    return new Date(new Date(trip.date + "T00:00:00+08:00").getTime() + trip.departureMinutes * 60000);
}

function formatAdminDeparture(trip) {
    return trip ? getAdminDeparture(trip).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", timeZone: adminData.settings.timeZone
    }) : "Trip unavailable";
}

function isAdminFutureTrip(trip) {
    return trip && getAdminDeparture(trip) > new Date(adminData.settings.demoNow);
}

/* Count bookings that currently reserve a seat. */
function getAdminReservations(tripId, excludedBookingId = null) {
    return adminData.bookings.filter(function (booking) {
        return booking.tripId === tripId && booking.id !== excludedBookingId &&
            ["Pending", "Confirmed", "On Hold"].includes(booking.status);
    });
}

/* Show the admin decision using passenger-facing labels. */
function getAdminStatus(booking) {
    return booking.adminDecision === "Rejected" ? "Rejected" :
        booking.status === "Confirmed" ? "Accepted" : booking.status;
}

function nextAdminId(prefix, records) {
    let number = 1;
    while (records.some(function (record) { return record.id === prefix + number; })) {
        number += 1;
    }
    return prefix + number;
}

function adminSearchMatches(values) {
    const search = document.getElementById("admin-search")?.value.trim().toLowerCase() || "";
    return values.join(" ").toLowerCase().includes(search);
}

function adminAction(label, action, id, className = "btn-outline-success") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm " + className;
    button.dataset.adminAction = action;
    button.dataset.id = id;
    button.textContent = label;
    return button;
}

function adminActions(buttons) {
    const container = document.createElement("div");
    container.className = "admin-actions";
    buttons.forEach(function (button) { container.appendChild(button); });
    return container;
}

/* All record values use textContent, including names and search results. */
function renderAdminTable(id, records, columns) {
    const body = document.getElementById(id);
    if (!body) { return; }
    const headings = Array.from(body.closest("table").querySelectorAll("th"));
    body.replaceChildren();
    if (records.length === 0) {
        const row = body.insertRow();
        const cell = row.insertCell();
        cell.colSpan = columns.length;
        cell.className = "text-secondary py-3";
        cell.textContent = "No records found.";
        return;
    }
    records.forEach(function (record) {
        const row = body.insertRow();
        columns.forEach(function (column, index) {
            const cell = row.insertCell();
            cell.dataset.label = headings[index].textContent;
            const value = column(record);
            if (value instanceof Node) {
                cell.appendChild(value);
            } else {
                cell.textContent = value ?? "—";
            }
        });
    });
}

/* Display booking totals and upcoming shuttle activity. */
function renderAdminDashboard() {
    const passengers = adminData.users.filter(function (user) { return user.role === "passenger" && !user.deleted; });
    const drivers = adminData.drivers.filter(function (driver) { return !driver.deleted && !getAdminUser(driver.userId)?.deleted; });
    document.getElementById("admin-vehicle-count").textContent = adminData.vehicles.length;
    document.getElementById("admin-driver-count").textContent = drivers.length;
    document.getElementById("admin-passenger-count").textContent = passengers.length;

    const futureTrips = adminData.trips.filter(isAdminFutureTrip);
    const capacity = futureTrips.reduce(function (total, trip) { return total + trip.capacity; }, 0);
    const reserved = futureTrips.reduce(function (total, trip) {
        return total + (trip.otherReservations || 0) + getAdminReservations(trip.id).length;
    }, 0);
    const percent = capacity ? Math.min(100, Math.round(reserved / capacity * 100)) : 0;
    document.getElementById("admin-reservation-summary").textContent =
        reserved + " of " + capacity + " seats reserved across " + futureTrips.length +
        " dated upcoming trips (including mock reservations). Demo date: " + adminData.settings.demoNow.slice(0, 10) + ".";
    const progress = document.getElementById("admin-reservation-progress");
    progress.style.width = percent + "%";
    progress.setAttribute("aria-valuenow", String(percent));

    renderAdminTable("admin-shuttle-list", adminData.vehicles, [
        function (v) { return v.name; }, function (v) { return v.plate; },
        function (v) { return v.type; }, function (v) { return v.capacity; },
        function () {
            const link = document.createElement("a");
            link.href = "admin-vehicles.html";
            link.textContent = "Manage";
            link.className = "text-dlsu-green";
            return link;
        }
    ]);
    renderAdminTable("admin-driver-list", drivers, [
        function (d) { return getAdminName(getAdminUser(d.userId)); },
        function (d) { return getAdminVehicle(d.vehicleId)?.name || "Not assigned"; },
        function (d) { return adminData.driverStatuses[d.status]?.label || d.status; }
    ]);
    renderAdminTable("admin-recent-list", adminData.bookings.slice().reverse().slice(0, 5), [
        function (b) { return b.id; }, function (b) { return getAdminName(getAdminUser(b.userId)); },
        function (b) { return getAdminRoute(getAdminTrip(b.tripId)); }, function (b) { return getAdminStatus(b); }
    ]);
}

/* Filter passenger bookings and show available admin actions. */
function renderAdminBookings() {
    const status = document.getElementById("admin-booking-status").value;
    const bookings = adminData.bookings.filter(function (booking) {
        return (status === "all" || getAdminStatus(booking) === (status === "Confirmed" ? "Accepted" : status)) && adminSearchMatches([
            booking.id, getAdminName(getAdminUser(booking.userId)), getAdminRoute(getAdminTrip(booking.tripId))
        ]);
    }).slice().reverse();
    renderAdminTable("admin-booking-list", bookings, [
        function (b) { return b.id; }, function (b) { return getAdminName(getAdminUser(b.userId)); },
        function (b) { const trip = getAdminTrip(b.tripId); return getAdminRoute(trip) + " · " + formatAdminDeparture(trip); },
        function (b) { return getAdminStatus(b); },
        function (b) {
            if (!isAdminFutureTrip(getAdminTrip(b.tripId)) || !["Pending", "Confirmed", "On Hold"].includes(b.status)) {
                return "No pending action";
            }
            return adminActions([
                adminAction("Accept", "accept-booking", b.id),
                adminAction("Hold", "hold-booking", b.id, "btn-outline-secondary"),
                adminAction("Reject", "reject-booking", b.id, "btn-outline-danger")
            ]);
        }
    ]);
}

/* List passenger and driver profiles. */
function renderAdminUsers() {
    const users = adminData.users.filter(function (user) {
        return ["passenger", "driver"].includes(user.role) && !user.deleted &&
            adminSearchMatches([getAdminName(user), user.email, user.idNumber || "", user.role]);
    });
    renderAdminTable("admin-user-list", users, [
        getAdminName, function (u) { return u.role === "driver" ? "Driver" : "Passenger"; },
        function (u) { return u.email; },
        function (u) { return u.idNumber || adminData.drivers.find(function (d) { return d.userId === u.id; })?.employeeNumber; },
        function (u) { return adminActions([
            adminAction("View / Edit", "edit-user", u.id),
            adminAction("Delete", "delete-user", u.id, "btn-outline-danger")
        ]); }
    ]);
}

/* Show each shuttle and its assigned capacity. */
function renderAdminVehicles() {
    const vehicles = adminData.vehicles.filter(function (vehicle) {
        return adminSearchMatches([vehicle.name, vehicle.plate, vehicle.type]);
    });
    renderAdminTable("admin-vehicle-list", vehicles, [
        function (v) { return v.name; }, function (v) { return v.plate; },
        function (v) { return v.type; }, function (v) { return v.capacity; },
        function (v) { return adminAction("Edit", "edit-vehicle", v.id); }
    ]);
}

/* List demo administrators and their account creator. */
function renderAdminAccounts() {
    document.querySelectorAll("[data-admin-demo-password]").forEach(function (label) {
        label.textContent = adminData.settings.newAccountDemoPassword;
    });
    renderAdminTable("admin-account-list", adminData.users.filter(function (u) { return u.role === "admin" && !u.deleted; }), [
        getAdminName, function (u) { return u.email; },
        function (u) { return u.createdBy ? getAdminName(getAdminUser(u.createdBy)) : "Initial demo account"; }
    ]);
}

/* Check the demo session and refresh the current admin page. */
function refreshAdminPage() {
    if (!adminSeed) { return; }
    try {
        rebuildAdminData();
        if (!currentAdmin) {
            document.getElementById("admin-content").classList.add("d-none");
            showAdminMessage("Please log in with the admin demo account: " +
                adminSeed.users.find(function (user) { return user.id === adminSeed.settings.defaultAdminId; }).email +
                ". Use the Log Out link to return to login.", "warning");
            return;
        }
        document.getElementById("admin-user-name").textContent = getAdminName(currentAdmin);
        document.getElementById("admin-content").classList.remove("d-none");
        const renderers = { dashboard: renderAdminDashboard, bookings: renderAdminBookings,
            profiles: renderAdminUsers, vehicles: renderAdminVehicles, accounts: renderAdminAccounts };
        renderers[adminPage]();
        document.getElementById("admin-content").setAttribute("aria-busy", "false");
    } catch (error) {
        showAdminMessage("Admin data could not be loaded. Check browser storage and mock-data.json. " + error.message, "danger");
    }
}

/* Save the admin decision and notify the passenger. */
function updateAdminBooking(id, status) {
    rebuildAdminData();
    const booking = adminData.bookings.find(function (item) { return item.id === id; });
    const trip = booking && getAdminTrip(booking.tripId);
    if (!booking || !isAdminFutureTrip(trip) || !["Pending", "Confirmed", "On Hold"].includes(booking.status)) {
        throw new Error("This booking is no longer awaiting an admin action.");
    }
    if (status !== "Cancelled") {
        const reservations = getAdminReservations(trip.id, booking.id);
        if (getAdminUser(booking.userId)?.deleted) { throw new Error("This passenger profile was deleted."); }
        if (reservations.some(function (item) { return item.userId === booking.userId; })) {
            throw new Error("This passenger already has an active reservation for this trip.");
        }
        if ((trip.otherReservations || 0) + reservations.length >= trip.capacity) {
            throw new Error("No seats remain for this trip.");
        }
    }
    if (status === "Cancelled" && !window.confirm("Reject booking " + id + " and release its seat?")) { return; }
    const decision = status === "Cancelled" ? "Rejected" : status === "On Hold" ? "On Hold" : "Accepted";
    if (booking.status === status && booking.adminDecision === decision) {
        showAdminMessage("Booking " + id + " is already " + decision + ".", "info");
        return;
    }
    const revision = (Number(booking.decisionRevision) || 0) + 1;
    saveAdminRecords({
        bookings: [{ id: id, status: status, adminDecision: decision, decisionRevision: revision,
            attendanceConfirmed: status === "Confirmed" ? booking.attendanceConfirmed : false }],
        notices: [{ id: "booking-decision-" + id + "-" + revision, userId: booking.userId,
            bookingId: id, type: "booking-decision", decision: decision,
            createdAt: new Date(adminData.settings.demoNow).toISOString() }]
    }, "Booking " + id + " updated to " + decision + ". The passenger has been notified.");
}

/* Generate the same dated IDs as the passenger's weekly timetable. */
function getAdminRangeTrips(start, end, routeId) {
    const trips = [];
    for (let cursor = new Date(start + "T00:00:00Z"); cursor <= new Date(end + "T00:00:00Z"); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
        const date = cursor.toISOString().slice(0, 10);
        adminData.routes.filter(function (route) { return routeId === "all" || route.id === routeId; }).forEach(function (route) {
            const dated = adminData.trips.filter(function (trip) { return trip.date === date && trip.routeId === route.id; });
            const day = cursor.getUTCDay();
            const timetable = day === 0 ? null : adminData.weeklySchedules[day === 6 ? "saturday" : "weekday"];
            const combined = dated.slice();
            (timetable?.[route.id] || []).forEach(function (slot) {
                if (!dated.some(function (trip) { return trip.departureMinutes === slot.departureMinutes; })) {
                    combined.push({ ...slot, id: "scheduled-" + date + "-" + slot.id,
                        date: date, routeId: route.id, tripStatus: "Scheduled" });
                }
            });
            trips.push(...combined.filter(function (trip) {
                return isAdminFutureTrip(trip) && !["Cancelled", "Arrived", "Not applicable"].includes(trip.tripStatus);
            }));
        });
    }
    return trips;
}

function validateAdminForm(form) {
    if (!form.checkValidity()) {
        form.reportValidity();
        throw new Error("Complete the required fields with valid values.");
    }
}

function adminValue(id) { return document.getElementById(id).value.trim(); }

function validateAdminEmail(email, excludedId = null) {
    if (!/^[^\s@]+@dlsu\.edu\.ph$/i.test(email)) { throw new Error("Use a valid @dlsu.edu.ph email address."); }
    if (adminData.users.some(function (user) { return user.id !== excludedId && user.email.toLowerCase() === email.toLowerCase(); })) {
        throw new Error("That email is already assigned to a profile.");
    }
}

function updateAdminUserFields() {
    const isDriver = adminValue("user-role") === "driver";
    document.getElementById("admin-passenger-fields").classList.toggle("d-none", isDriver);
    document.getElementById("admin-driver-fields").classList.toggle("d-none", !isDriver);
    document.getElementById("user-college").required = !isDriver;
}

function openAdminUser(id = null) {
    rebuildAdminData();
    editingUserId = id;
    const user = id ? getAdminUser(id) : {};
    if (id && (!user || user.deleted)) { throw new Error("This profile is no longer available."); }
    const driver = adminData.drivers.find(function (item) { return item.userId === id; });
    document.getElementById("admin-user-form").reset();
    document.getElementById("admin-user-form-error").classList.add("d-none");
    const fields = {
        "user-first-name": user.firstName || "", "user-last-name": user.lastName || "",
        "user-email": user.email || "", "user-role": user.role || "passenger",
        "user-contact": user.contactNumber || "", "user-id-number": user.idNumber || driver?.employeeNumber || "",
        "user-passenger-type": user.passengerType || "student", "user-sex": user.sex || "male",
        "user-college": user.collegeDepartment || "", "user-campus": user.campus || "Manila",
        "user-document": user.verificationDocument || "", "user-verified": String(driver?.verified ?? false),
        "user-driver-number": driver?.driverNumber || ""
    };
    const vehicleSelect = document.getElementById("user-vehicle");
    vehicleSelect.replaceChildren(new Option("Not assigned", ""));
    adminData.vehicles.forEach(function (vehicle) { vehicleSelect.add(new Option(vehicle.name + " | " + vehicle.plate, vehicle.id)); });
    const statusSelect = document.getElementById("user-driver-status");
    statusSelect.replaceChildren();
    Object.entries(adminData.driverStatuses).forEach(function ([key, status]) { statusSelect.add(new Option(status.label, key)); });
    fields["user-vehicle"] = driver?.vehicleId || "";
    fields["user-driver-status"] = driver?.status || "active";
    Object.entries(fields).forEach(function ([key, value]) { document.getElementById(key).value = value; });
    document.getElementById("user-role").disabled = Boolean(id);
    updateAdminUserFields();
    bootstrap.Modal.getOrCreateInstance(document.getElementById("admin-user-modal")).show();
}

/* Validate profile details before saving browser changes. */
function saveAdminUser(form) {
    validateAdminForm(form);
    rebuildAdminData();
    const role = adminValue("user-role");
    if (!["passenger", "driver"].includes(role)) { throw new Error("Choose Passenger or Driver."); }
    const existing = editingUserId ? getAdminUser(editingUserId) : null;
    if (editingUserId && (!existing || existing.deleted)) { throw new Error("This profile was deleted in another tab."); }
    const user = {
        id: editingUserId || nextAdminId(role === "driver" ? "driver-user-" : "passenger-", adminData.users),
        role: existing ? existing.role : role,
        firstName: adminValue("user-first-name"), lastName: adminValue("user-last-name"),
        email: adminValue("user-email").toLowerCase(), idNumber: adminValue("user-id-number"),
        contactNumber: adminValue("user-contact")
    };
    if (!user.firstName || !user.lastName) { throw new Error("Enter a first and last name."); }
    validateAdminEmail(user.email, user.id);
    if (!/^[a-z0-9-]{3,20}$/i.test(user.idNumber)) { throw new Error("Use an ID with 3 to 20 letters, digits, or hyphens."); }
    if (user.contactNumber && !/^\+?\d{10,15}$/.test(user.contactNumber)) { throw new Error("Enter a contact number with 10 to 15 digits."); }
    if (adminData.users.some(function (item) { return !item.deleted && item.id !== user.id && item.idNumber === user.idNumber; })) {
        throw new Error("That ID number is already in use.");
    }
    const updates = { users: [user] };
    if (user.role === "passenger") {
        Object.assign(user, { passengerType: adminValue("user-passenger-type"), sex: adminValue("user-sex"),
            collegeDepartment: adminValue("user-college"), campus: adminValue("user-campus"),
            verificationDocument: adminValue("user-document") });
        if (!user.collegeDepartment) { throw new Error("Enter the college or department."); }
    } else {
        const driver = adminData.drivers.find(function (item) { return item.userId === user.id; });
        const vehicleId = adminValue("user-vehicle") || null;
        if (vehicleId && !getAdminVehicle(vehicleId)) { throw new Error("Choose an existing vehicle."); }
        const status = adminValue("user-driver-status");
        if (!Object.hasOwn(adminData.driverStatuses, status)) { throw new Error("Choose a valid driver status."); }
        updates.drivers = [{ id: driver?.id || nextAdminId("driver-", adminData.drivers), userId: user.id,
            employeeNumber: user.idNumber, driverNumber: adminValue("user-driver-number") || driver?.driverNumber || "To be assigned",
            verified: adminValue("user-verified") === "true", vehicleId: vehicleId,
            status: status, updatedAt: new Date().toISOString() }];
        updates.trips = adminData.trips.filter(function (trip) {
            return trip.driverId === driver?.id && isAdminFutureTrip(trip);
        }).map(function (trip) {
            return { id: trip.id, vehicleId: vehicleId, capacity: vehicleId ? Math.min(trip.capacity, getAdminVehicle(vehicleId).capacity) : trip.capacity };
        });
        updates.trips.forEach(function (trip) {
            const original = getAdminTrip(trip.id);
            if (trip.capacity < (original.otherReservations || 0) + getAdminReservations(trip.id).length) {
                throw new Error("The assigned vehicle is too small for this driver's existing reservations.");
            }
        });
    }
    saveAdminRecords(updates, editingUserId ? "Profile updated." : "Profile added.");
    bootstrap.Modal.getInstance(document.getElementById("admin-user-modal")).hide();
}

/* Remove the demo profile and release its future reservations. */
function deleteAdminUser(id) {
    rebuildAdminData();
    const user = getAdminUser(id);
    if (!user || user.deleted || !["passenger", "driver"].includes(user.role)) { throw new Error("Profile not found."); }
    if (!window.confirm("Delete " + getAdminName(user) + "? Future reservations will be cancelled. Historical records are kept.")) { return; }
    const updates = { users: [{ id: id, deleted: true }] };
    updates.bookings = adminData.bookings.filter(function (booking) {
        return booking.userId === id && isAdminFutureTrip(getAdminTrip(booking.tripId)) && ["Pending", "Confirmed", "On Hold"].includes(booking.status);
    }).map(function (booking) { return { id: booking.id, status: "Cancelled", attendanceConfirmed: false, adminDecision: "Profile deleted" }; });
    const driver = adminData.drivers.find(function (item) { return item.userId === id; });
    if (driver) {
        updates.drivers = [{ id: driver.id, deleted: true, status: "inactive", vehicleId: null, updatedAt: new Date().toISOString() }];
        updates.trips = adminData.trips.filter(function (trip) { return trip.driverId === driver.id && isAdminFutureTrip(trip); })
            .map(function (trip) { return { id: trip.id, driverId: null }; });
    }
    saveAdminRecords(updates, "Profile deleted. Historical booking records are preserved.");
}

function openAdminVehicle(id = null) {
    rebuildAdminData();
    editingVehicleId = id;
    const vehicle = id ? getAdminVehicle(id) : {};
    if (!vehicle) { throw new Error("Vehicle not found."); }
    document.getElementById("admin-vehicle-form").reset();
    document.getElementById("admin-vehicle-form-error").classList.add("d-none");
    const fields = { "vehicle-name": vehicle.name || "", "vehicle-plate": vehicle.plate || "",
        "vehicle-model": vehicle.type || "", "vehicle-capacity": vehicle.capacity || 39 };
    Object.entries(fields).forEach(function ([key, value]) { document.getElementById(key).value = value; });
    bootstrap.Modal.getOrCreateInstance(document.getElementById("admin-vehicle-modal")).show();
}

/* Update the shuttle details and related trip capacities. */
function saveAdminVehicle(form) {
    validateAdminForm(form);
    rebuildAdminData();
    const vehicle = { id: editingVehicleId || nextAdminId("vehicle-", adminData.vehicles),
        name: adminValue("vehicle-name"), plate: adminValue("vehicle-plate").toUpperCase(),
        type: adminValue("vehicle-model"), capacity: Number(adminValue("vehicle-capacity")) };
    if (!vehicle.name || !vehicle.plate || !vehicle.type) { throw new Error("Enter a shuttle name, plate number, and model."); }
    if (!Number.isInteger(vehicle.capacity) || vehicle.capacity < 1 || vehicle.capacity > 100) { throw new Error("Capacity must be a whole number from 1 to 100."); }
    if (adminData.vehicles.some(function (item) {
        return item.id !== vehicle.id && item.plate.replace(/\s/g, "").toUpperCase() === vehicle.plate.replace(/\s/g, "");
    })) { throw new Error("That plate number is already registered."); }
    const trips = adminData.trips.filter(function (trip) { return trip.vehicleId === vehicle.id && isAdminFutureTrip(trip); }).map(function (trip) {
        if ((trip.otherReservations || 0) + getAdminReservations(trip.id).length > vehicle.capacity) {
            throw new Error("This capacity is lower than existing reservations. Keep a larger vehicle capacity.");
        }
        return { id: trip.id, capacity: Math.min(trip.capacity, vehicle.capacity) };
    });
    saveAdminRecords({ vehicles: [vehicle], trips: trips }, editingVehicleId ? "Vehicle updated." : "Vehicle added.");
    bootstrap.Modal.getInstance(document.getElementById("admin-vehicle-modal")).hide();
}

/* One delegated handler supports buttons in freshly rendered table rows. */
document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-admin-action]");
    if (!button || !adminSeed) { return; }
    try {
        const id = button.dataset.id;
        const actions = {
            "add-user": function () { openAdminUser(); }, "edit-user": function () { openAdminUser(id); },
            "delete-user": function () { deleteAdminUser(id); }, "add-vehicle": function () { openAdminVehicle(); },
            "edit-vehicle": function () { openAdminVehicle(id); },
            "accept-booking": function () { updateAdminBooking(id, "Confirmed"); },
            "hold-booking": function () { updateAdminBooking(id, "On Hold"); },
            "reject-booking": function () { updateAdminBooking(id, "Cancelled"); }
        };
        actions[button.dataset.adminAction]?.();
    } catch (error) { showAdminMessage(error.message, "danger"); }
});

document.getElementById("admin-search")?.addEventListener("input", refreshAdminPage);
document.getElementById("admin-booking-status")?.addEventListener("change", refreshAdminPage);
document.getElementById("admin-booking-filters")?.addEventListener("submit", function (event) { event.preventDefault(); });
document.getElementById("user-role")?.addEventListener("change", updateAdminUserFields);

["admin-user-form", "admin-vehicle-form"].forEach(function (id) {
    document.getElementById(id)?.addEventListener("submit", function (event) {
        event.preventDefault();
        try {
            if (id === "admin-user-form") { saveAdminUser(event.currentTarget); }
            else { saveAdminVehicle(event.currentTarget); }
        } catch (error) { showAdminMessage(error.message, "danger", document.getElementById(id + "-error")); }
    });
});

document.getElementById("admin-account-form")?.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
        validateAdminForm(event.currentTarget);
        rebuildAdminData();
        const firstName = adminValue("admin-first-name");
        const lastName = adminValue("admin-last-name");
        const email = adminValue("admin-email").toLowerCase();
        if (!firstName || !lastName) { throw new Error("Enter a first and last name."); }
        validateAdminEmail(email);
        const user = { id: nextAdminId("admin-", adminData.users), role: "admin", firstName: firstName,
            lastName: lastName, email: email, createdBy: currentAdmin?.id };
        saveAdminRecords({ users: [user] }, "Admin account created. Use the displayed public demo password to log in.");
        event.currentTarget.reset();
    } catch (error) { showAdminMessage(error.message, "danger"); }
});

document.getElementById("admin-slots-form")?.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
        validateAdminForm(event.currentTarget);
        rebuildAdminData();
        const start = adminValue("admin-start-date");
        const end = adminValue("admin-end-date");
        const days = (new Date(end + "T00:00:00Z") - new Date(start + "T00:00:00Z")) / 86400000 + 1;
        const capacity = Number(adminValue("admin-capacity"));
        const route = adminValue("admin-route");
        if (start < adminData.settings.demoNow.slice(0, 10) || !Number.isInteger(days) || days < 1 || days > 31) {
            throw new Error("Choose a date range from the demo date onward, covering no more than 31 days.");
        }
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) { throw new Error("Enter a seat limit from 1 to 100."); }
        if (route !== "all" && !adminData.routes.some(function (item) { return item.id === route; })) { throw new Error("Choose a valid direction."); }
        const trips = getAdminRangeTrips(start, end, route);
        if (trips.length === 0) { throw new Error("No future departures were found in this date range."); }
        trips.forEach(function (trip) {
            const minimum = (trip.otherReservations || 0) + getAdminReservations(trip.id).length;
            const vehicle = getAdminVehicle(trip.vehicleId);
            if (capacity < minimum) { throw new Error(formatAdminDeparture(trip) + " already has " + minimum + " reserved seats. No limits were changed."); }
            if (vehicle && capacity > vehicle.capacity) { throw new Error("The limit exceeds " + vehicle.name + "'s capacity of " + vehicle.capacity + ". No limits were changed."); }
        });
        saveAdminRecords({ trips: trips.map(function (trip) { return { ...trip, capacity: capacity }; }) },
            "Reservation limit set to " + capacity + " seats for " + trips.length + " departures. Existing bookings were kept.");
    } catch (error) { showAdminMessage(error.message, "danger"); }
});

document.querySelectorAll("[data-admin-logout]").forEach(function (link) {
    link.addEventListener("click", function () {
        try { sessionStorage.removeItem("arrowsExpressUser"); } catch (error) { /* The login link still works. */ }
    });
});
window.addEventListener("arrows-express-data-updated", refreshAdminPage);
window.addEventListener("storage", function (event) {
    if (event.key === adminStorageKey || event.key === null || event.key?.startsWith("arrowsExpressDriverStatus:")) { refreshAdminPage(); }
});
window.addEventListener("pageshow", refreshAdminPage);

fetch("assets/data/mock-data.json")
    .then(function (response) {
        if (!response.ok) { throw new Error("Could not load mock-data.json."); }
        return response.json();
    })
    .then(function (data) {
        adminSeed = data;
        if (adminPage === "bookings") {
            const today = data.settings.demoNow.slice(0, 10);
            ["admin-start-date", "admin-end-date"].forEach(function (id) {
                document.getElementById(id).value = today;
                document.getElementById(id).min = today;
            });
            data.routes.forEach(function (route) { document.getElementById("admin-route").add(new Option(route.name, route.id)); });
        }
        refreshAdminPage();
    })
    .catch(function (error) { showAdminMessage("Could not load admin details: " + error.message, "danger"); });
