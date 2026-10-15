/* ========================================================
   PASSENGER NOTIFICATIONS
   ======================================================== */
const notificationStorageKey = "arrowsExpressDemoChanges:v1";
let notificationSeed = null;
let notificationData = null;
let notificationChanges = {};
let passengerNotifications = [];
let notificationStorageAvailable = true;

/* Read the same browser changes used by the dashboard. */
function readNotificationChanges() {
    if (!notificationStorageAvailable) {
        return notificationChanges;
    }

    try {
        const saved = JSON.parse(localStorage.getItem(notificationStorageKey));

        return saved && saved.schemaVersion === notificationSeed.schemaVersion
            ? saved
            : { schemaVersion: notificationSeed.schemaVersion };
    } catch (error) {
        notificationStorageAvailable = false;
        console.warn("Saved demo changes could not be loaded:", error);
        return notificationChanges;
    }
}

/* Rebuild from JSON so resetting browser changes restores the defaults. */
function buildNotificationData() {
    notificationChanges = readNotificationChanges();
    notificationData = JSON.parse(JSON.stringify(notificationSeed));

    ["users", "trips", "bookings", "drivers", "vehicles", "notices"].forEach(function (section) {
        if (!Array.isArray(notificationChanges[section])) {
            return;
        }

        notificationChanges[section].forEach(function (change) {
            const index = notificationData[section].findIndex(function (record) {
                return record.id === change.id;
            });

            if (index === -1) {
                notificationData[section].push(change);
            } else {
                Object.assign(notificationData[section][index], change);
            }
        });
    });

    notificationData.readNotificationIds =
        Array.isArray(notificationChanges.readNotificationIds)
            ? notificationChanges.readNotificationIds.slice()
            : notificationData.readNotificationIds.slice();
}

/* Find the passenger's booking and its related trip and route. */
function getNotificationBooking(bookingId) {
    const booking = notificationData.bookings.find(function (item) {
        return item.id === bookingId &&
            item.userId === notificationData.settings.defaultPassengerId;
    });

    if (!booking) {
        return null;
    }

    const trip = notificationData.trips.find(function (item) {
        return item.id === booking.tripId;
    });

    if (!trip) {
        return null;
    }

    const route = notificationData.routes.find(function (item) {
        return item.id === trip.routeId;
    });

    const departure = new Date(
        new Date(trip.date + "T00:00:00+08:00").getTime() +
        trip.departureMinutes * 60000
    );

    return {
        booking: booking,
        departure: departure,
        route: route ? route.name : "Route unavailable",
        pickup: route
            ? route.pickupCampus + ", " + route.pickup
            : "To be announced"
    };
}

function formatNotificationDate(date) {
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: notificationData.settings.timeZone
    });
}

/* Create reminders only inside the configured confirmation window. */
function buildPassengerNotifications() {
    const settings = notificationData.settings;
    const demoNow = new Date(settings.demoNow);
    const notifications = [];

    notificationData.bookings.forEach(function (booking) {
        const details = getNotificationBooking(booking.id);

        if (!details || booking.status !== "Confirmed") {
            return;
        }

        const minutes = (details.departure - demoNow) / 60000;

        if (minutes <= 0 || minutes > settings.confirmationMinutes) {
            return;
        }

        notifications.push({
            id: "booking-reminder-" + booking.id,
            details: details,
            requiresConfirmation: true,
            createdAt: new Date(
                details.departure.getTime() -
                settings.confirmationMinutes * 60000
            ),
            title: booking.attendanceConfirmed
                ? "Booking confirmed"
                : "Confirm your upcoming trip",
            message: booking.attendanceConfirmed
                ? "You confirmed your " + details.route + " trip. Pick-up: " +
                    details.pickup + "."
                : "Your " + details.route + " trip departs in " +
                    Math.ceil(minutes) + " minutes. Please confirm your booking."
        });
    });

    notificationData.notices.forEach(function (notice) {
        if (notice.userId !== settings.defaultPassengerId ||
            !["booking-created", "booking-decision"].includes(notice.type)) {
            return;
        }

        const details = getNotificationBooking(notice.bookingId);

        if (!details) {
            return;
        }

        let title = notice.requiresAdminReview ? "Booking submitted" : "Booking received";
        let message = "Booking " + details.booking.id + ": " + details.route +
            " on " + formatNotificationDate(details.departure) + ".";
        if (notice.type === "booking-decision") {
            const titles = { "Accepted": "Booking accepted", "On Hold": "Booking on hold", "Rejected": "Booking rejected" };
            const explanations = {
                "Accepted": "The admin accepted your request. Confirm attendance when the departure reminder appears.",
                "On Hold": "The admin put your request on hold. Please wait for another update.",
                "Rejected": "The admin rejected your request. You can request another available trip."
            };
            title = titles[notice.decision] || "Booking updated";
            message += " " + (explanations[notice.decision] || "View your booking for details.");
        } else if (notice.requiresAdminReview) {
            message += " Your request was submitted for admin review.";
        } else {
            message += " Current status: " +
                (details.booking.status === "Confirmed" ? "Accepted" : details.booking.status) + ".";
        }
        notifications.push({
            id: notice.id, details: details, requiresConfirmation: false,
            createdAt: new Date(notice.createdAt), title: title, message: message
        });
    });

    return notifications.reverse().sort(function (first, second) {
        return second.createdAt - first.createdAt;
    });
}

function showNotificationFeedback(message, type = "success") {
    const feedback = document.getElementById("notification-feedback");

    if (feedback) {
        feedback.className = "alert alert-" + type;
        feedback.textContent = message + (notificationStorageAvailable
            ? ""
            : " Changes will not be saved after this page is closed.");
        feedback.focus({ preventScroll: true });
    }
}

/* Update counts and the mobile bell's green/white background. */
function updateNotificationBadges() {
    const count = passengerNotifications.filter(function (notification) {
        return !notificationData.readNotificationIds.includes(notification.id);
    }).length;

    document.querySelectorAll("[data-notification-count]").forEach(function (badge) {
        badge.textContent = count;
        badge.hidden = count === 0;
    });

    document.querySelectorAll("[data-notification-link]").forEach(function (link) {
        link.setAttribute("aria-label", "Notifications, " + count + " unread");

        if (link.classList.contains("notification-bell")) {
            link.classList.toggle("bg-success", count > 0);
            link.classList.toggle("text-white", count > 0);
            link.classList.toggle("bg-white", count === 0);
        }
    });

    const summary = document.getElementById("notification-summary");
    const markAllButton = document.getElementById("mark-notifications-read");

    if (summary) {
        summary.textContent = count === 0
            ? "You have no unread notifications."
            : "You have " + count + " unread notification" +
                (count === 1 ? "." : "s.");
    }

    if (markAllButton) {
        markAllButton.disabled = count === 0;
    }
}

/* Fill the dashboard reminder without changing its layout. */
function updateDashboardReminder() {
    const section = document.getElementById("booking-confirmation-reminder");

    if (!section) {
        return;
    }

    const reminder = passengerNotifications
        .filter(function (notification) {
            return notification.requiresConfirmation;
        })
        .sort(function (first, second) {
            return first.details.departure - second.details.departure;
        })[0];

    section.hidden = !reminder;

    if (!reminder) {
        return;
    }

    document.getElementById("booking-reminder-title").textContent = reminder.title;
    document.getElementById("booking-reminder-text").textContent = reminder.message;
    document.getElementById("booking-reminder-time").textContent =
        "Demo time: " +
        formatNotificationDate(new Date(notificationData.settings.demoNow)) +
        ". Departure: " + formatNotificationDate(reminder.details.departure) + ".";

    const button = section.querySelector("[data-confirm-booking]");
    button.dataset.confirmBooking = reminder.details.booking.id;
    button.hidden = reminder.details.booking.attendanceConfirmed;

    document.getElementById("booking-reminder-details").href =
        "my-bookings.html?booking=" +
        encodeURIComponent(reminder.details.booking.id);
}

/* Populate the existing notification card template. */
function renderNotificationList() {
    const list = document.getElementById("notification-list");
    const template = document.getElementById("notification-template");

    if (!list || !template) {
        return;
    }

    list.replaceChildren();

    if (passengerNotifications.length === 0) {
        const paragraph = document.createElement("p");
        paragraph.className = "text-secondary small mb-0";
        paragraph.textContent = "You have no notifications.";
        list.appendChild(paragraph);
        return;
    }

    passengerNotifications.forEach(function (notification) {
        const card = template.content.firstElementChild.cloneNode(true);
        const details = notification.details;
        const isRead = notificationData.readNotificationIds.includes(notification.id);
        const isConfirmed =
            notification.requiresConfirmation && details.booking.attendanceConfirmed;

        const heading = card.querySelector(".notification-title");
        heading.id = "title-" + notification.id;
        heading.textContent = notification.title;

        card.setAttribute("aria-labelledby", heading.id);
        card.classList.toggle("is-unread", !isRead);
        card.querySelector(".notification-text").textContent = notification.message;
        card.querySelector(".notification-time").textContent =
            formatNotificationDate(notification.createdAt);

        const readBadge = card.querySelector(".notification-read-status");
        readBadge.textContent = isRead ? "Read" : "Unread";
        readBadge.className = "notification-read-status badge rounded-pill " +
            (isRead
                ? "bg-secondary-subtle text-secondary-emphasis"
                : "bg-success-subtle text-success");

        /* The four existing detail fields are reference, date, route and pickup. */
        const fields = card.querySelectorAll(".notification-trip-details dd");
        const values = [
            details.booking.id,
            formatNotificationDate(details.departure),
            details.route,
            details.pickup
        ];

        fields.forEach(function (field, index) {
            field.textContent = values[index];
        });

        card.querySelector(".notification-trip-details").hidden =
            !notification.requiresConfirmation;

        const confirmButton = card.querySelector("[data-confirm-booking]");
        confirmButton.dataset.confirmBooking = details.booking.id;
        confirmButton.hidden = !notification.requiresConfirmation || isConfirmed;

        card.querySelector(".notification-confirmed").hidden = !isConfirmed;
        card.querySelector(".notification-actions a").href =
            "my-bookings.html?booking=" + encodeURIComponent(details.booking.id);

        const readButton = card.querySelector("[data-read-notification]");
        readButton.dataset.readNotification = notification.id;
        readButton.hidden = isRead;

        list.appendChild(card);
    });
}

/* Refresh names and the demo clock on the Notifications page as well. */
function renderNotificationPageDetails() {
    const passenger = notificationData.users.find(function (user) {
        return user.id === notificationData.settings.defaultPassengerId;
    });

    if (!passenger) {
        throw new Error("The demo passenger could not be found.");
    }

    document.querySelectorAll(
        "[data-passenger-name], .dashboard-account .fw-semibold"
    ).forEach(function (name) {
        name.textContent = passenger.firstName + " " + passenger.lastName;
    });

    if (document.getElementById("notification-list")) {
        const clock = document.getElementById("notification-demo-clock") ||
            document.querySelector(".main-content > .bg-dlsu-light");

        if (clock) {
            const badge = document.createElement("span");
            badge.className = "badge bg-success-subtle text-success me-2";
            badge.textContent = "Phase 1 demo";

            clock.replaceChildren(
                badge,
                document.createTextNode(
                    "Demo time: " +
                    formatNotificationDate(new Date(notificationData.settings.demoNow)) +
                    ". Confirmation reminders appear " +
                    notificationData.settings.confirmationMinutes +
                    " minutes before departure."
                )
            );
        }
    }
}

/* Reload saved changes and refresh notification displays. */
function refreshNotifications() {
    if (!notificationSeed) {
        return;
    }

    buildNotificationData();
    passengerNotifications = buildPassengerNotifications();
    renderNotificationPageDetails();
    updateNotificationBadges();
    updateDashboardReminder();
    renderNotificationList();
}

/* Save only changed fields, preserving profile and booking edits from other pages. */
function setNotificationBookingChange(bookingId, attendanceConfirmed) {
    notificationChanges.bookings = notificationChanges.bookings || [];

    let change = notificationChanges.bookings.find(function (item) {
        return item.id === bookingId;
    });

    if (!change) {
        change = { id: bookingId };
        notificationChanges.bookings.push(change);
    }

    change.attendanceConfirmed = attendanceConfirmed;
}

/* Save notification changes while preserving other demo edits. */
function saveNotificationChanges() {
    notificationChanges.schemaVersion = notificationSeed.schemaVersion;

    try {
        localStorage.setItem(
            notificationStorageKey,
            JSON.stringify(notificationChanges)
        );
        notificationStorageAvailable = true;
    } catch (error) {
        notificationStorageAvailable = false;
        console.warn("Demo changes could not be saved:", error);
    }

    /* Refresh this page and tell the dashboard that shared data changed. */
    window.dispatchEvent(new Event("arrows-express-data-updated"));
}

/* Event delegation supports both dashboard and notification card buttons. */
document.addEventListener("click", function (event) {
    const confirmButton = event.target.closest("[data-confirm-booking]");
    const readButton = event.target.closest("[data-read-notification]");

    if (!notificationSeed || (!confirmButton && !readButton)) {
        return;
    }

    const bookingId = confirmButton ? confirmButton.dataset.confirmBooking : null;
    const notificationId = readButton ? readButton.dataset.readNotification : null;

    /* Read recent browser edits before changing any records. */
    refreshNotifications();

    if (confirmButton) {
        const reminder = passengerNotifications.find(function (notification) {
            return notification.requiresConfirmation &&
                notification.details.booking.id === bookingId;
        });

        if (!reminder || reminder.details.booking.attendanceConfirmed) {
            showNotificationFeedback(
                "This booking does not currently need attendance confirmation.",
                "info"
            );
            return;
        }

        setNotificationBookingChange(bookingId, true);
        notificationChanges.readNotificationIds = Array.from(new Set(
            notificationData.readNotificationIds.concat(reminder.id)
        ));

        saveNotificationChanges();
        showNotificationFeedback(
            "Booking " + bookingId + " confirmed. Pick-up: " +
            reminder.details.pickup + "."
        );
    } else if (passengerNotifications.some(function (notification) {
        return notification.id === notificationId;
    })) {
        notificationChanges.readNotificationIds = Array.from(new Set(
            notificationData.readNotificationIds.concat(notificationId)
        ));

        saveNotificationChanges();
        showNotificationFeedback(
            "Notification marked as read. Reading a reminder does not confirm attendance."
        );
    }
});

const markAllNotificationsButton = document.getElementById("mark-notifications-read");

if (markAllNotificationsButton) {
    markAllNotificationsButton.addEventListener("click", function () {
        if (!notificationSeed) {
            return;
        }

        refreshNotifications();
        notificationChanges.readNotificationIds = Array.from(new Set(
            notificationData.readNotificationIds.concat(
                passengerNotifications.map(function (notification) {
                    return notification.id;
                })
            )
        ));

        saveNotificationChanges();
        showNotificationFeedback(
            "All notifications marked as read. Attendance confirmations are unchanged."
        );
    });
}

const resetNotificationsButton = document.getElementById("reset-notifications-demo");

if (resetNotificationsButton) {
    resetNotificationsButton.addEventListener("click", function () {
        if (!notificationSeed) {
            return;
        }

        refreshNotifications();

        notificationData.bookings.forEach(function (booking) {
            if (booking.userId !== notificationData.settings.defaultPassengerId) {
                return;
            }

            const original = notificationSeed.bookings.find(function (item) {
                return item.id === booking.id;
            });

            setNotificationBookingChange(
                booking.id,
                original ? original.attendanceConfirmed : false
            );
        });

        notificationChanges.readNotificationIds =
            notificationSeed.readNotificationIds.slice();

        saveNotificationChanges();
        showNotificationFeedback(
            "Notification demo reset. Your bookings and profile edits are kept.",
            "info"
        );
    });
}

window.addEventListener("arrows-express-data-updated", refreshNotifications);

window.addEventListener("storage", function (event) {
    if (event.key === notificationStorageKey || event.key === null) {
        refreshNotifications();
    }
});

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        refreshNotifications();
    }
});

/* Load the initial records once; later refreshes reapply browser changes. */
fetch("assets/data/mock-data.json")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load mock-data.json.");
        }

        return response.json();
    })
    .then(function (data) {
        notificationSeed = data;
        refreshNotifications();
    })
    .catch(function (error) {
        console.error("Could not load notifications:", error);
        const summary = document.getElementById("notification-summary");

        if (summary) {
            summary.textContent = "Notifications could not be loaded.";
        }

        showNotificationFeedback(
            "Unable to load notifications. Please reload the page.",
            "danger"
        );
    });