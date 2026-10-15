/* ========================================================
   AUTOMATIC BOOKING STATUSES — PHASE 1 DEMO CLOCK
   ======================================================== */
(function () {
    if (window.arrowsExpressBookingLifecycleLoaded) { return; }
    window.arrowsExpressBookingLifecycleLoaded = true;
    const storageKey = "arrowsExpressDemoChanges:v1";
    let seed = null;
    let isUpdating = false;

    /* Combine the JSON records and saved edits without changing either. */
    function mergeRecords(records, changes) {
        const merged = records.map(function (record) { return { ...record }; });
        (changes || []).forEach(function (change) {
            const existing = merged.find(function (record) {
                return record.id === change.id;
            });
            if (existing) {
                Object.assign(existing, change);
            } else {
                merged.push({ ...change });
            }
        });
        return merged;
    }

    function updateBookingStatuses() {
        if (!seed || isUpdating) { return; }
        isUpdating = true;

        try {
            const now = new Date(seed.settings.demoNow);
            if (!Number.isFinite(now.getTime())) {
                throw new Error("The demo date is invalid.");
            }

            const saved = JSON.parse(localStorage.getItem(storageKey));
            const changes = saved || { schemaVersion: seed.schemaVersion };
            if (changes.schemaVersion !== seed.schemaVersion) {
                throw new Error("Saved demo data uses a different schema version.");
            }

            const trips = mergeRecords(seed.trips, changes.trips);
            const bookings = mergeRecords(seed.bookings, changes.bookings);
            let hasUpdates = false;

            bookings.forEach(function (booking) {
                /* Historical and manually cancelled bookings stay unchanged. */
                if (!["Pending", "Confirmed", "On Hold"].includes(booking.status)) { return; }

                const trip = trips.find(function (record) {
                    return record.id === booking.tripId;
                });
                if (!trip || !Number.isInteger(trip.departureMinutes) ||
                    trip.departureMinutes < 0 || trip.departureMinutes >= 1440 ||
                    !Number.isFinite(trip.durationMinutes) || trip.durationMinutes < 0) {
                    return;
                }

                const departure = new Date(trip.date + "T00:00:00+08:00").getTime() +
                    trip.departureMinutes * 60000;
                const arrival = departure + trip.durationMinutes * 60000;
                if (!Number.isFinite(departure)) { return; }

                /* Older passenger requests were auto-confirmed without an admin decision.
                   Move only those browser-created records back to Pending. Seeded demo
                   bookings and bookings explicitly accepted by an admin are preserved. */
                const needsAdminReview = booking.status === "Confirmed" && !booking.adminDecision &&
                    !seed.bookings.some(function (record) { return record.id === booking.id; });
                const reviewStatus = needsAdminReview ? "Pending" : booking.status;
                const attendanceConfirmed = !needsAdminReview && booking.attendanceConfirmed === true;
                let update = needsAdminReview
                    ? { status: "Pending", adminDecision: "Pending", attendanceConfirmed: false }
                    : null;
                if (now.getTime() >= departure && ["Pending", "On Hold"].includes(reviewStatus)) {
                    update = {
                        status: "Cancelled", adminDecision: "Rejected",
                        attendanceConfirmed: false, lifecycleReason: reviewStatus === "Pending" ? "Admin review expired" : "Expired on hold"
                    };
                } else if (now.getTime() >= departure && !attendanceConfirmed) {
                    update = {
                        status: "Cancelled", adminDecision: "Rejected",
                        attendanceConfirmed: false, lifecycleReason: "Attendance not confirmed"
                    };
                } else if (now.getTime() >= arrival && attendanceConfirmed) {
                    update = { status: "Completed", lifecycleReason: "Trip completed" };
                }
                if (!update) { return; }

                changes.bookings = changes.bookings || [];
                let storedBooking = changes.bookings.find(function (record) {
                    return record.id === booking.id;
                });
                if (!storedBooking) {
                    storedBooking = { id: booking.id };
                    changes.bookings.push(storedBooking);
                }
                Object.assign(storedBooking, update, {
                    lifecycleUpdatedAt: now.toISOString()
                });
                hasUpdates = true;
            });

            /* Preserve profile, vehicle, driver, and unrelated booking edits. */
            if (hasUpdates) {
                localStorage.setItem(storageKey, JSON.stringify(changes));
                window.dispatchEvent(new Event("arrows-express-data-updated"));
            }
        } catch (error) {
            console.warn("Booking statuses could not be updated:", error);
        } finally {
            isUpdating = false;
        }
    }

    function loadBookingClock() {
        return fetch("assets/data/mock-data.json", { cache: "no-store" })
            .then(function (response) {
                if (!response.ok) { throw new Error("Could not load mock-data.json."); }
                return response.json();
            })
            .then(function (data) {
                seed = data;
                updateBookingStatuses();
            })
            .catch(function (error) {
                console.warn("The booking demo clock could not be loaded:", error);
            });
    }

    /* Recheck after page actions and changes made in another browser tab. */
    window.addEventListener("arrows-express-data-updated", updateBookingStatuses);
    window.addEventListener("storage", function (event) {
        if (event.key === storageKey || event.key === null) {
            updateBookingStatuses();
        }
    });
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) { loadBookingClock(); }
    });

    loadBookingClock();
})();
