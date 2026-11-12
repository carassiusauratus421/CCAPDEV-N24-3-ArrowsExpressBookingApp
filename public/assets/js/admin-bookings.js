/* ========================================================
   ADMIN BOOKINGS - MYSQL
   ======================================================== */

const adminBookingList = document.getElementById("admin-booking-list");
const adminBookingSearch = document.getElementById("admin-search");
const adminBookingFilter = document.getElementById("admin-booking-status");
const adminBookingMessage = document.getElementById("admin-message");
const adminBookingContent = document.getElementById("admin-content");
let adminBookings = [];
let adminBookingToken = null;
let adminBookingBusy = false;

function showAdminBookingMessage(message, type = "danger") {
    adminBookingMessage.textContent = message;
    adminBookingMessage.className = "alert alert-" + type;
}

function normalizeAdminBookingStatus(value) {
    return String(value || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function formatAdminBookingDate(value) {
    if (!value) return "Unknown departure";
    const date = new Date(value.replace(" ", "T") + "+08:00");
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila"
    });
}

function setAdminBookingCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = String(value ?? "");
    row.appendChild(cell);
    return cell;
}

function showAdminBookingRows() {
    adminBookingList.replaceChildren();
    const search = adminBookingSearch.value.trim().toLowerCase();
    const status = normalizeAdminBookingStatus(adminBookingFilter.value);
    const filtered = adminBookings.filter(function (booking) {
        const haystack = [booking.booking_id, booking.first_name,
            booking.last_name, booking.email, booking.plate_number,
            booking.pickup_point, booking.dropoff_point].join(" ").toLowerCase();
        return (status === "all" || normalizeAdminBookingStatus(booking.booking_status) === status)
            && haystack.includes(search);
    });
    if (!filtered.length) {
        const row = document.createElement("tr");
        const cell = setAdminBookingCell(row, "No bookings match the selected filters.");
        cell.colSpan = 5;
        adminBookingList.appendChild(row);
        return;
    }
    filtered.forEach(function (booking) {
        const row = document.createElement("tr");
        const id = Number(booking.booking_id);
        const statusValue = normalizeAdminBookingStatus(booking.booking_status);
        setAdminBookingCell(row, "#" + id);
        const passenger = setAdminBookingCell(row,
            [booking.first_name, booking.last_name].filter(Boolean).join(" "));
        const email = document.createElement("div");
        email.className = "small text-secondary";
        email.textContent = booking.email || "";
        passenger.appendChild(email);
        setAdminBookingCell(row,
            booking.pickup_point + " → " + booking.dropoff_point + " | " +
            formatAdminBookingDate(booking.departure_datetime));
        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "badge rounded-pill px-3 py-2 booking-status booking-status--" +
            (statusValue === "on_hold" ? "on-hold" : statusValue);
        badge.textContent = statusValue === "confirmed" ? "Accepted" :
            statusValue === "on_hold" ? "On Hold" :
            statusValue === "pending" ? "Pending" :
            statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        const actions = document.createElement("td");
        const future = new Date(booking.departure_datetime.replace(" ", "T") + "+08:00").getTime() > Date.now();
        if (future && ["pending", "confirmed", "on_hold"].includes(statusValue)) {
            [
                ["Accept", "accept", "btn-outline-success"],
                ["Hold", "hold", "btn-outline-secondary"],
                ["Reject", "reject", "btn-outline-danger"]
            ].forEach(function (definition) {
                if ((definition[1] === "accept" && statusValue === "confirmed") ||
                    (definition[1] === "hold" && statusValue === "on_hold")) return;
                const button = document.createElement("button");
                button.type = "button";
                button.className = "btn btn-sm " + definition[2] + " me-1 mb-1";
                button.textContent = definition[0];
                button.disabled = adminBookingBusy;
                button.addEventListener("click", function () {
                    submitAdminBookingDecision(id, definition[1]);
                });
                actions.appendChild(button);
            });
        } else {
            actions.textContent = "No available action";
        }
        row.appendChild(actions);
        adminBookingList.appendChild(row);
    });
}

async function loadAdminBookings() {
    const response = await fetch("api/admin-bookings.php", {
        credentials: "same-origin", cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load bookings.");
    if (!Array.isArray(data.bookings) || !data.csrf_token) {
        throw new Error("Invalid admin booking response.");
    }
    adminBookings = data.bookings;
    adminBookingToken = data.csrf_token;
    const name = document.getElementById("admin-user-name");
    if (name) name.textContent = "Admin";
    showAdminBookingRows();
    adminBookingContent.setAttribute("aria-busy", "false");
}

async function submitAdminBookingDecision(bookingId, action) {
    if (adminBookingBusy) return;
    const message = action === "reject"
        ? "Reject booking #" + bookingId + " and release its reserved seat?"
        : action === "hold"
            ? "Place booking #" + bookingId + " on hold?"
            : "Accept booking #" + bookingId + "?";
    if (!window.confirm(message)) return;
    adminBookingBusy = true;
    showAdminBookingRows();
    try {
        const response = await fetch("api/admin-bookings.php", {
            method: "POST", credentials: "same-origin", cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": adminBookingToken
            },
            body: JSON.stringify({booking_id: bookingId, action: action})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to update booking.");
        await loadAdminBookings();
        showAdminBookingMessage(data.message || "Booking updated.", "success");
    } catch (error) {
        showAdminBookingMessage(error.message);
    } finally {
        adminBookingBusy = false;
        showAdminBookingRows();
    }
}

adminBookingSearch.addEventListener("input", showAdminBookingRows);
adminBookingFilter.addEventListener("change", showAdminBookingRows);
document.getElementById("admin-booking-filters").addEventListener("submit", function (event) {
    event.preventDefault();
});
loadAdminBookings().catch(function (error) {
    adminBookingContent.setAttribute("aria-busy", "false");
    showAdminBookingMessage(error.message);
    adminBookingList.replaceChildren();
    const row = document.createElement("tr");
    const cell = setAdminBookingCell(row, "Unable to load admin bookings.");
    cell.colSpan = 5;
    adminBookingList.appendChild(row);
});
