/* MOCK DRIVER STATUS FOR PHASE 1 */
const driverStatuses = {
    "on-departure": {
        label: "On Departure",
        description: "Preparing the assigned vehicle for departure.",
        badgeClass: "bg-primary-subtle text-primary"
    },
    active: {
        label: "Active",
        description: "Available for assigned shuttle duties.",
        badgeClass: "bg-success-subtle text-success"
    },
    inactive: {
        label: "Inactive",
        description: "Temporarily unavailable for shuttle duties.",
        badgeClass: "bg-warning-subtle text-dark"
    },
    "off-duty": {
        label: "Off-duty",
        description: "Not currently on duty.",
        badgeClass: "bg-secondary-subtle text-secondary"
    }
};

const driverStatusForm = document.getElementById("driver-status-form");
const driverStatusSelect = document.getElementById("driver-status-select");
const driverStatusButton = document.getElementById("driver-status-button");
const driverStatusMessage = document.getElementById("driver-status-message");

const driverStatusStorageKey =
    "arrowsExpressDriverStatus:roberto_sanjose@dlsu.edu.ph";

let currentDriverStatus = {
    status: "active",
    updatedAt: null
};

function showDriverStatusMessage(message, type) {
    driverStatusMessage.className = "alert alert-" + type;
    driverStatusMessage.textContent = message;
}

function clearDriverStatusError() {
    driverStatusSelect.classList.remove("is-invalid");
    driverStatusSelect.removeAttribute("aria-invalid");
    document.getElementById("driver-status-error").textContent = "";
}

/* Render predefined labels as text and show the saved update time. */
function renderDriverStatus() {
    const status = driverStatuses[currentDriverStatus.status];
    const badge = document.getElementById("driver-status-badge");

    badge.className = "badge rounded-pill px-3 py-2 " + status.badgeClass;
    badge.textContent = status.label;

    document.getElementById("driver-status-description").textContent =
        status.description;

    document.getElementById("driver-status-updated").textContent =
        currentDriverStatus.updatedAt
            ? new Date(currentDriverStatus.updatedAt).toLocaleString(
                "en-PH",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            )
            : "Not updated yet";

    driverStatusSelect.value = currentDriverStatus.status;
}

/* Validate browser data before using it to restore the demo state. */
function loadDriverStatus() {
    try {
        const savedStatus = JSON.parse(
            localStorage.getItem(driverStatusStorageKey)
        );

        if (savedStatus !== null) {
            if (
                !savedStatus ||
                typeof savedStatus.status !== "string" ||
                !Object.hasOwn(driverStatuses, savedStatus.status) ||
                typeof savedStatus.updatedAt !== "string" ||
                !Number.isFinite(Date.parse(savedStatus.updatedAt))
            ) {
                throw new Error("Invalid saved driver status");
            }

            currentDriverStatus = {
                status: savedStatus.status,
                updatedAt: savedStatus.updatedAt
            };
        }
    } catch (error) {
        showDriverStatusMessage(
            "Your saved status could not be loaded. The demo starts as Active; you can still update it.",
            "warning"
        );
    }
}

driverStatusForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearDriverStatusError();

    const selectedStatus = driverStatusSelect.value;

    if (!Object.hasOwn(driverStatuses, selectedStatus)) {
        driverStatusSelect.classList.add("is-invalid");
        driverStatusSelect.setAttribute("aria-invalid", "true");

        document.getElementById("driver-status-error").textContent =
            "Select one of the four available statuses.";

        showDriverStatusMessage(
            "Please choose a valid driver status.",
            "danger"
        );

        driverStatusSelect.focus();
        return;
    }

    currentDriverStatus = {
        status: selectedStatus,
        updatedAt: new Date().toISOString()
    };

    renderDriverStatus();

    try {
        localStorage.setItem(
            driverStatusStorageKey,
            JSON.stringify(currentDriverStatus)
        );

        showDriverStatusMessage(
            "Status updated to " + driverStatuses[selectedStatus].label +
            ". Your demo change is saved in this browser.",
            "success"
        );
    } catch (error) {
        showDriverStatusMessage(
            "Status updated for this visit. Browser storage is unavailable, so the change will reset when you reload.",
            "warning"
        );
    }
});

driverStatusSelect.addEventListener("change", function () {
    clearDriverStatusError();
    driverStatusMessage.classList.add("d-none");
    driverStatusMessage.textContent = "";
});

loadDriverStatus();
renderDriverStatus();

// Enable controls only after the mock state and handlers are ready.
driverStatusSelect.disabled = false;
driverStatusButton.disabled = false;