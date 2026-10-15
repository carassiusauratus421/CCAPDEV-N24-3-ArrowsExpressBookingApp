/* DRIVER DETAILS AND STATUS FROM THE SHARED JSON FILE */
const driverStatusForm = document.getElementById("driver-status-form");
const driverStatusSelect = document.getElementById("driver-status-select");
const driverStatusButton = document.getElementById("driver-status-button");
const driverStatusMessage = document.getElementById("driver-status-message");
const driverStatusStorageKey = "arrowsExpressDemoChanges:v1";

let driverSeed = null;
let driverData = null;
let driverRecord = null;
let driverUser = null;
let driverStatuses = {};
let driverChanges = {};
let driverStorageAvailable = true;
let currentDriverStatus = null;

function showDriverStatusMessage(message, type) {
    driverStatusMessage.className = "alert alert-" + type;
    driverStatusMessage.textContent = message;
}

function clearDriverStatusError() {
    driverStatusSelect.classList.remove("is-invalid");
    driverStatusSelect.removeAttribute("aria-invalid");
    document.getElementById("driver-status-error").textContent = "";
}

/* Preserve profile, booking and notification changes when saving status. */
function readDriverChanges() {
    if (!driverStorageAvailable) {
        return driverChanges;
    }

    try {
        const saved = JSON.parse(localStorage.getItem(driverStatusStorageKey));

        return saved && saved.schemaVersion === driverSeed.schemaVersion
            ? saved
            : { schemaVersion: driverSeed.schemaVersion };
    } catch (error) {
        driverStorageAvailable = false;
        console.warn("Saved driver changes could not be loaded:", error);
        return driverChanges;
    }
}

function loadDriverStatus() {
    driverChanges = readDriverChanges();
    driverData = JSON.parse(JSON.stringify(driverSeed));

    ["users", "drivers", "vehicles"].forEach(function (section) {
        if (!Array.isArray(driverChanges[section])) {
            return;
        }

        driverChanges[section].forEach(function (change) {
            const record = driverData[section].find(function (item) {
                return item.id === change.id;
            });

            if (record) {
                Object.assign(record, change);
            } else {
                driverData[section].push({ ...change });
            }
        });
    });

    driverUser = driverData.users.find(function (user) {
        return user.id === driverData.settings.defaultDriverUserId;
    });

    driverRecord = driverData.drivers.find(function (driver) {
        return driver.userId === driverData.settings.defaultDriverUserId;
    });

    driverStatuses = driverData.driverStatuses;
    const profileDeleted = Boolean(driverUser?.deleted || driverRecord?.deleted);
    driverStatusSelect.disabled = profileDeleted;
    driverStatusButton.disabled = profileDeleted;
    if (profileDeleted) {
        showDriverStatusMessage("This driver profile was deleted by an admin. Return to Log In.", "warning");
    }


    if (!driverUser || !driverRecord) {
        throw new Error("The demo driver could not be found.");
    }

    if (!Object.hasOwn(driverStatuses, driverRecord.status) ||
        (driverRecord.updatedAt !== null &&
            (typeof driverRecord.updatedAt !== "string" ||
                !Number.isFinite(Date.parse(driverRecord.updatedAt))))) {
        const original = driverSeed.drivers.find(function (driver) {
            return driver.id === driverRecord.id;
        });

        driverRecord.status = original.status;
        driverRecord.updatedAt = original.updatedAt;

        showDriverStatusMessage(
            "The saved status was invalid. The original demo status is shown.",
            "warning"
        );
    }

    try {
        const legacy = JSON.parse(localStorage.getItem("arrowsExpressDriverStatus:" + driverUser.email));
        if (legacy && Object.hasOwn(driverStatuses, legacy.status) &&
            Number.isFinite(Date.parse(legacy.updatedAt)) &&
            (!driverRecord.updatedAt || Date.parse(legacy.updatedAt) > Date.parse(driverRecord.updatedAt))) {
            Object.assign(driverRecord, legacy);
        }
    } catch (error) {
        console.warn("Legacy driver status could not be loaded:", error);
    }

    currentDriverStatus = {
        status: driverRecord.status,
        updatedAt: driverRecord.updatedAt
    };
}

/* Keep the existing driver details, vehicle card and status guide layout. */
function renderDriverDetails() {
    document.querySelectorAll("[data-driver-name]").forEach(function (name) {
        name.textContent = driverUser.firstName + " " + driverUser.lastName;
    });

    document.getElementById("driver-number").textContent =
        driverRecord.driverNumber;

    document.getElementById("driver-email").textContent = driverUser.email;

    const verified = driverRecord.verified === true;
    const verificationBadge = document.getElementById("driver-verification-badge");

    verificationBadge.textContent = verified
        ? "Verified driver"
        : "Verification pending";

    verificationBadge.className = "badge rounded-pill px-3 py-2 " +
        (verified
            ? "bg-success-subtle text-success"
            : "bg-warning-subtle text-warning-emphasis");

    document.getElementById("driver-verification-details").textContent =
        verified ? "Verified (Demo)" : "Pending (Demo)";

    const vehicle = driverData.vehicles.find(function (item) {
        return item.id === driverRecord.vehicleId;
    });

    document.getElementById("driver-vehicle-plate").textContent =
        vehicle ? vehicle.plate : "To be assigned";

    document.getElementById("driver-vehicle-type").textContent =
        vehicle ? vehicle.type : "No vehicle assigned";

    document.querySelectorAll("[data-driver-status-label]").forEach(function (label) {
        const status = driverStatuses[label.dataset.driverStatusLabel];
        label.textContent = status ? status.label : "Unavailable";
    });

    document.querySelectorAll("[data-driver-status-description]").forEach(function (description) {
        const status = driverStatuses[description.dataset.driverStatusDescription];
        description.textContent = status ? status.description : "";
    });

    driverStatusSelect.replaceChildren();

    Object.keys(driverStatuses).forEach(function (value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = driverStatuses[value].label;
        driverStatusSelect.appendChild(option);
    });
}

function renderDriverStatus() {
    const status = driverStatuses[currentDriverStatus.status];
    const badge = document.getElementById("driver-status-badge");

    badge.className = "badge rounded-pill px-3 py-2 " + status.badgeClass;
    badge.textContent = status.label;

    document.getElementById("driver-status-description").textContent =
        status.description;

    document.getElementById("driver-status-updated").textContent =
        currentDriverStatus.updatedAt
            ? new Date(currentDriverStatus.updatedAt).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: driverData.settings.timeZone
            })
            : "Not updated yet";

    driverStatusSelect.value = currentDriverStatus.status;
}

/* Reload shared driver details and refresh the dashboard. */
function refreshDriverPage() {
    if (!driverSeed) {
        return;
    }

    /* An unrelated page update should not discard an unsaved selection. */
    const pendingStatus = currentDriverStatus &&
        driverStatusSelect.value !== currentDriverStatus.status
        ? driverStatusSelect.value
        : null;

    loadDriverStatus();
    renderDriverDetails();
    renderDriverStatus();

    if (pendingStatus && Object.hasOwn(driverStatuses, pendingStatus)) {
        driverStatusSelect.value = pendingStatus;
    }
}

driverStatusForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearDriverStatusError();

    if (!driverSeed) {
        return;
    }

    const selectedStatus = driverStatusSelect.value;

    if (!Object.hasOwn(driverStatuses, selectedStatus)) {
        driverStatusSelect.classList.add("is-invalid");
        driverStatusSelect.setAttribute("aria-invalid", "true");

        document.getElementById("driver-status-error").textContent =
            "Select one of the available statuses.";

        showDriverStatusMessage(
            "Please choose a valid driver status.",
            "danger"
        );

        driverStatusSelect.focus();
        return;
    }

    loadDriverStatus();
    if (driverUser.deleted || driverRecord.deleted) { return; }

    currentDriverStatus = {
        status: selectedStatus,
        updatedAt: new Date().toISOString()
    };

    driverChanges.schemaVersion = driverSeed.schemaVersion;
    driverChanges.drivers = driverChanges.drivers || [];

    const savedDriver = driverChanges.drivers.find(function (driver) {
        return driver.id === driverRecord.id;
    });

    if (savedDriver) {
        Object.assign(savedDriver, currentDriverStatus);
    } else {
        driverChanges.drivers.push({
            id: driverRecord.id,
            ...currentDriverStatus
        });
    }

    try {
        localStorage.setItem(
            driverStatusStorageKey,
            JSON.stringify(driverChanges)
        );
        driverStorageAvailable = true;
    } catch (error) {
        driverStorageAvailable = false;
        console.warn("Driver status could not be saved:", error);
    }

    window.dispatchEvent(new Event("arrows-express-data-updated"));

    showDriverStatusMessage(
        driverStorageAvailable
            ? "Status updated to " + driverStatuses[selectedStatus].label +
                ". Your demo change is saved in this browser."
            : "Status updated for this visit. Browser storage is unavailable, so the change will reset when you reload.",
        driverStorageAvailable ? "success" : "warning"
    );
});

driverStatusSelect.addEventListener("change", function () {
    clearDriverStatusError();
    driverStatusMessage.classList.add("d-none");
    driverStatusMessage.textContent = "";
});

window.addEventListener("arrows-express-data-updated", refreshDriverPage);

window.addEventListener("storage", function (event) {
    if (event.key === driverStatusStorageKey || event.key === null) {
        refreshDriverPage();
    }
});

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        refreshDriverPage();
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
        driverSeed = data;
        refreshDriverPage();
        driverStatusSelect.disabled = Boolean(driverUser?.deleted || driverRecord?.deleted);
        driverStatusButton.disabled = driverStatusSelect.disabled;
    })
    .catch(function (error) {
        console.error("Could not load driver details:", error);
        driverSeed = null;
        driverStatusSelect.disabled = true;
        driverStatusButton.disabled = true;

        showDriverStatusMessage(
            "Unable to load your driver details. Please reload the page.",
            "danger"
        );
    });