/* ========================================================
   PHASE 2 PASSENGER NOTIFICATIONS
   Reads real booking records from the authenticated MySQL API.
   Read/unread flags are browser-local until a notification table/API exists.
   This file does NOT confirm attendance or change booking status.
   ======================================================== */
(function () {
    "use strict";

    const list = document.getElementById("notification-list");
    const summary = document.getElementById("notification-summary");
    const feedback = document.getElementById("notification-feedback");
    const markAll = document.getElementById("mark-notifications-read");
    const clearAll = document.getElementById("clear-notifications");
    const template = document.getElementById("notification-template");
    const TIMEZONE = "Asia/Manila";
    const REMINDER_MINUTES = 60;
    const REFRESH_MS = 60000;
    let notifications = [];
    let storageKey = "";
    let readIds = new Set();
    let dismissedIds = new Set();
    let loading = false;
    let firstSeenTimes = {};
    let observedBefore = false;

    if (!list || !template) return;

    function parseManilaDate(value) {
        if (!value) return null;
        const normalized = String(value).trim().replace(" ", "T");
        const date = new Date(/[zZ]$|[+-]\d\d:\d\d$/.test(normalized)
            ? normalized : normalized + "+08:00");
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(date) {
        return date ? new Intl.DateTimeFormat("en-PH", {
            timeZone: TIMEZONE, year: "numeric", month: "short", day: "numeric",
            hour: "numeric", minute: "2-digit", hour12: true
        }).format(date) : "Not available";
    }

    function cleanStatus(value) {
        return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    }

    function makeNotifications(bookings) {
        const now = Date.now();
        const result = [];
        bookings.forEach(function (booking) {
            const id = Number(booking.booking_id);
            if (!Number.isSafeInteger(id) || id < 1) return;
            const status = cleanStatus(booking.booking_status);
            const departure = parseManilaDate(booking.departure_datetime);
            const created = parseManilaDate(booking.timestamp_created);
            const route = [booking.pickup_point, booking.dropoff_point].filter(Boolean).join(" → ") || "Your trip";
            const base = {
                bookingId: id,
                route: route,
                pickup: String(booking.pickup_point || "Not available"),
                departure: departure,
                created: created,
                status: status
            };
            const content = {
                pending: ["Booking request submitted", "Your reservation request is awaiting admin approval."],
                confirmed: ["Booking accepted", "Your reservation is confirmed. Check My Bookings for trip information."],
                accepted: ["Booking accepted", "Your reservation is confirmed. Check My Bookings for trip information."],
                on_hold: ["Booking on hold", "An administrator has placed your request on hold."],
                rejected: ["Booking rejected", "An administrator declined this reservation request."],
                cancelled: ["Booking cancelled", "This reservation is cancelled."],
                canceled: ["Booking cancelled", "This reservation is cancelled."],
                waitlisted: ["Booking waitlisted", "Your reservation is waiting for an available seat."],
                forfeited: ["Booking forfeited", "This reservation has been forfeited."],
                completed: ["Trip completed", "This trip is recorded as completed."]
            }[status];
            if (content) {
                result.push({
                    ...base, id: "booking-" + id + "-" + status,
                    title: content[0], message: content[1],
                    // Booking creation time is known; admin decision time is NOT.
                    // Do not present creation as the approval/rejection timestamp.
                    time: created,
                    sortTime: (created || departure)?.getTime() || 0
                });
            }
            const minutesUntil = departure ? (departure.getTime() - now) / 60000 : -1;
            if (["confirmed", "accepted"].includes(status) &&
                !booking.passenger_confirmed && minutesUntil > 0 &&
                minutesUntil <= REMINDER_MINUTES) {
                result.push({
                    ...base, id: "reminder-" + id + "-" + departure.getTime(),
                    title: "Upcoming departure reminder",
                    message: "Your confirmed trip departs in approximately " +
                        Math.ceil(minutesUntil) + " minute(s). Attendance confirmation is not yet supported on this page.",
                    time: new Date(departure.getTime() - REMINDER_MINUTES * 60000),
                    sortTime: departure.getTime() - REMINDER_MINUTES * 60000
                });
            }
        });
        // Latest activity first. New status updates receive a first-observed
        // timestamp, not the older booking creation timestamp.
        return result.sort(function (a, b) {
            return b.sortTime - a.sortTime || b.bookingId - a.bookingId;
        });
    }

    function readSeenTimes(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "{}");
            if (!data || typeof data !== "object" || Array.isArray(data)) return {};
            const valid = {};
            Object.entries(data).forEach(function ([id, value]) {
                if (typeof id === "string" && Number.isFinite(value) && value > 0) {
                    valid[id] = value;
                }
            });
            return valid;
        } catch (_) { return {}; }
    }

    function orderByRecentActivity(items) {
        const now = Date.now();
        let changed = false;
        items.forEach(function (item) {
            if (!Object.prototype.hasOwnProperty.call(firstSeenTimes, item.id)) {
                // On the first visit, do not pretend historic statuses happened now.
                // On later visits, newly observed statuses rise to the top.
                firstSeenTimes[item.id] = observedBefore ? now : (item.sortTime || now);
                changed = true;
            }
            item.sortTime = firstSeenTimes[item.id];
            item.firstObservedUpdate = observedBefore && changed && firstSeenTimes[item.id] === now;
        });
        if (changed) {
            try {
                localStorage.setItem(storageKey + ":first-seen", JSON.stringify(firstSeenTimes));
            } catch (_) {
                // Sorting works for this page even if the browser blocks storage.
            }
        }
        if (!observedBefore) {
            observedBefore = true;
            try { localStorage.setItem(storageKey + ":initialized", "1"); } catch (_) {}
        }
        items.sort(function (a, b) {
            return b.sortTime - a.sortTime || b.bookingId - a.bookingId;
        });
        return items;
    }

    function readIdSet(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return new Set(Array.isArray(value)
                ? value.filter(function (x) { return typeof x === "string"; })
                : []);
        } catch (_) { return new Set(); }
    }

    function saveIdSet(key, values) {
        try {
            localStorage.setItem(key, JSON.stringify(Array.from(values)));
            return true;
        } catch (_) {
            showFeedback("Your browser could not save notification preferences.", "warning");
            return false;
        }
    }

    function saveReadIds() {
        return saveIdSet(storageKey, readIds);
    }

    function saveDismissedIds() {
        return saveIdSet(storageKey + ":dismissed", dismissedIds);
    }

    function visibleNotifications() {
        return notifications.filter(function (item) {
            return !dismissedIds.has(item.id);
        });
    }

    function showFeedback(message, kind) {
        if (!feedback) return;
        feedback.className = "alert alert-" + (kind || "success");
        feedback.textContent = message;
    }

    function updateCounters() {
        const visible = visibleNotifications();
        const unread = visible.filter(function (item) { return !readIds.has(item.id); }).length;
        if (summary) summary.textContent = unread === 0 ? "You have no unread notifications." :
            "You have " + unread + " unread notification" + (unread === 1 ? "." : "s.");
        document.querySelectorAll("[data-notification-count]").forEach(function (badge) {
            badge.textContent = String(unread);
            badge.hidden = unread === 0;
        });
        if (markAll) markAll.disabled = unread === 0;
        if (clearAll) clearAll.disabled = visible.length === 0;
    }

    function render() {
        list.replaceChildren();
        const visible = visibleNotifications();
        if (!visible.length) {
            const empty = document.createElement("div");
            empty.className = "alert alert-light border rounded-4";
            empty.textContent = "No notifications to display. New booking-status updates will appear here.";
            list.appendChild(empty);
            updateCounters();
            return;
        }
        visible.forEach(function (item) {
            const node = template.content.firstElementChild.cloneNode(true);
            const read = readIds.has(item.id);
            const title = node.querySelector(".notification-title");
            const message = node.querySelector(".notification-text");
            const time = node.querySelector(".notification-time");
            const badge = node.querySelector(".notification-read-status");
            const dd = node.querySelectorAll(".notification-trip-details dd");
            const confirmButton = node.querySelector("[data-confirm-booking]");
            const confirmedText = node.querySelector(".notification-confirmed");
            const readButton = node.querySelector("[data-read-notification]");
            node.classList.toggle("is-unread", !read);
            node.classList.toggle("is-read", read);
            if (title) title.textContent = item.title;
            if (message) message.textContent = item.message;
            if (time) {
                const isReminder = item.id.startsWith("reminder-");
                // First observed is honest about the absence of server-side decision timestamps.
                const isNewerStatus = !isReminder && item.sortTime !== ((item.created || item.departure)?.getTime() || 0);
                time.textContent = isReminder
                    ? "Reminder window: " + formatDate(item.time) + " (PHT)"
                    : isNewerStatus
                        ? "Update first noticed: " + formatDate(new Date(item.sortTime)) + " (PHT)"
                        : "Booking created: " + formatDate(item.time) + " (PHT)";
            }
            if (badge) {
                badge.textContent = read ? "Read" : "Unread";
                badge.className = "notification-read-status badge rounded-pill " +
                    (read ? "bg-secondary-subtle text-secondary" : "bg-success text-white");
            }
            if (dd.length >= 4) {
                dd[0].textContent = "AE-" + item.bookingId;
                dd[1].textContent = formatDate(item.departure) + " (PHT)";
                dd[2].textContent = item.route;
                dd[3].textContent = item.pickup;
            }
            if (confirmButton) confirmButton.hidden = true;
            if (confirmedText) confirmedText.hidden = true;
            if (readButton) {
                readButton.dataset.notificationId = item.id;
                readButton.disabled = read;
                readButton.textContent = read ? "Read" : "Mark as read";
            }
            list.appendChild(node);
        });
        updateCounters();
    }

    async function refresh() {
        if (loading) return;
        loading = true;
        if (summary) summary.textContent = "Loading notifications...";
        try {
            const response = await fetch("api/bookings.php", {
                credentials: "same-origin", cache: "no-store", headers: { "Accept": "application/json" }
            });
            if (!response.ok) throw new Error(response.status === 401 ?
                "Your session has expired. Please sign in again." :
                "Unable to load bookings (HTTP " + response.status + ").");
            const data = await response.json();
            if (!Array.isArray(data.bookings) || !data.passenger) {
                throw new Error("Unexpected bookings response from server.");
            }
            const passengerId = Number(data.passenger.passenger_id);
            if (!Number.isSafeInteger(passengerId) || passengerId < 1) {
                throw new Error("Passenger identity was not provided.");
            }
            const key = "arrowsExpressReadNotifications:phase2:passenger:" + passengerId;
            if (storageKey !== key) {
                storageKey = key;
                readIds = readIdSet(storageKey);
                dismissedIds = readIdSet(storageKey + ":dismissed");
                firstSeenTimes = readSeenTimes(storageKey + ":first-seen");
                observedBefore = localStorage.getItem(storageKey + ":initialized") === "1";
            }
            notifications = orderByRecentActivity(makeNotifications(data.bookings));
            if (feedback) {
                feedback.className = "alert d-none";
                feedback.textContent = "";
            }
            render();
        } catch (error) {
            if (summary) summary.textContent = "Notifications could not be refreshed.";
            showFeedback(error.message || "Unable to load notifications.", "danger");
        } finally { loading = false; }
    }

    list.addEventListener("click", function (event) {
        const button = event.target.closest("[data-read-notification]");
        if (!button || !storageKey) return;
        const id = button.dataset.notificationId;
        if (!notifications.some(function (item) { return item.id === id; })) return;
        readIds.add(id);
        saveReadIds();
        render();
    });
    if (markAll) markAll.addEventListener("click", function () {
        if (!storageKey) return;
        visibleNotifications().forEach(function (item) { readIds.add(item.id); });
        saveReadIds();
        render();
        showFeedback("Notifications marked as read on this browser. Booking status is unchanged.");
    });
    if (clearAll) clearAll.addEventListener("click", function () {
        if (!storageKey) return;
        const visible = visibleNotifications();
        if (!visible.length) return;
        if (!window.confirm("Clear all displayed notifications? This will not change your bookings.")) return;
        const next = new Set(dismissedIds);
        visible.forEach(function (item) { next.add(item.id); });
        if (!saveIdSet(storageKey + ":dismissed", next)) return;
        dismissedIds = next;
        render();
        showFeedback("Notifications cleared on this browser. New booking-status changes will still appear.", "success");
    });
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) refresh();
    });
    window.setInterval(function () { if (!document.hidden) refresh(); }, REFRESH_MS);
    refresh();
})();
