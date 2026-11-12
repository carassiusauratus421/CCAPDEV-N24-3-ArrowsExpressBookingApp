/* Driver Dashboard - Live Backend API Integration */

const driverStatusForm = document.getElementById("driver-status-form");
const driverStatusSelect = document.getElementById("driver-status-select");
const driverStatusButton = document.getElementById("driver-status-button");
const driverStatusMessage = document.getElementById("driver-status-message");

const DRIVER_STATUS_MAP = {
    "On Departure": {
        key: "on-departure",
        label: "On Departure",
        description: "Preparing the assigned vehicle for departure.",
        badgeClass: "bg-primary-subtle text-primary"
    },
    "Active": {
        key: "active",
        label: "Active",
        description: "Available for assigned shuttle duties.",
        badgeClass: "bg-success-subtle text-success"
    },
    "Inactive": {
        key: "inactive",
        label: "Inactive",
        description: "Temporarily unavailable for shuttle duties.",
        badgeClass: "bg-warning-subtle text-dark"
    },
    "Off-duty": {
        key: "off-duty",
        label: "Off-duty",
        description: "Not currently on duty.",
        badgeClass: "bg-secondary-subtle text-secondary"
    }
};

const STATUS_KEYS_MAP = {
    "on-departure": "On Departure",
    "on departure": "On Departure",
    "active": "Active",
    "inactive": "Inactive",
    "off-duty": "Off-duty",
    "off duty": "Off-duty",
    "On Departure": "On Departure",
    "Active": "Active",
    "Inactive": "Inactive",
    "Off-duty": "Off-duty"
};

let currentDriver = null;
let isUpdatingStatus = false;

function showDriverStatusMessage(message, type = "success") {
    if (!driverStatusMessage) {
        return;
    }
    driverStatusMessage.className = "alert alert-" + type;
    driverStatusMessage.textContent = message;
    driverStatusMessage.classList.remove("d-none");
}

function clearDriverStatusError() {
    if (driverStatusSelect) {
        driverStatusSelect.classList.remove("is-invalid");
        driverStatusSelect.removeAttribute("aria-invalid");
    }
    const errorEl = document.getElementById("driver-status-error");
    if (errorEl) {
        errorEl.textContent = "";
    }
}

function formatStatusTimestamp(dateString) {
    if (!dateString) {
        return "Not updated yet";
    }
    const date = new Date(dateString.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) {
        return dateString;
    }
    return date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function getStatusConfig(rawStatus) {
    const canonical = STATUS_KEYS_MAP[rawStatus] || "Active";
    return DRIVER_STATUS_MAP[canonical] || DRIVER_STATUS_MAP["Active"];
}

function renderDriverDetails(driver) {
    const fullName = `${driver.first_name || ""} ${driver.last_name || ""}`.trim() || "Driver";

    document.querySelectorAll("[data-driver-name]").forEach(function (el) {
        el.textContent = fullName;
    });

    const numberEl = document.getElementById("driver-number");
    if (numberEl) {
        numberEl.textContent = driver.driver_number || "DRV-001";
    }

    const emailEl = document.getElementById("driver-email");
    if (emailEl) {
        emailEl.textContent = driver.email || "";
    }

    const isActive = driver.account_status === "active";
    const verificationBadge = document.getElementById("driver-verification-badge");
    if (verificationBadge) {
        verificationBadge.textContent = isActive ? "Verified driver" : "Verification pending";
        verificationBadge.className = "badge rounded-pill px-3 py-2 " +
            (isActive ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning-emphasis");
    }

    const verificationDetails = document.getElementById("driver-verification-details");
    if (verificationDetails) {
        verificationDetails.textContent = isActive ? "Verified (Active)" : "Pending Review";
    }

    const plateEl = document.getElementById("driver-vehicle-plate");
    const typeEl = document.getElementById("driver-vehicle-type");

    if (driver.vehicle && driver.vehicle.plate_number) {
        if (plateEl) {
            plateEl.textContent = driver.vehicle.plate_number;
        }
        if (typeEl) {
            const capacityStr = driver.vehicle.capacity ? ` (${driver.vehicle.capacity} seats)` : "";
            typeEl.textContent = `${driver.vehicle.vehicle_model || "Shuttle Van"}${capacityStr}`;
        }
    } else {
        if (plateEl) {
            plateEl.textContent = "To be assigned";
        }
        if (typeEl) {
            typeEl.textContent = "No vehicle assigned";
        }
    }
}

function renderDriverStatus(statusName, updatedAt) {
    const config = getStatusConfig(statusName);

    const badge = document.getElementById("driver-status-badge");
    if (badge) {
        badge.className = "badge rounded-pill px-3 py-2 " + config.badgeClass;
        badge.textContent = config.label;
    }

    const desc = document.getElementById("driver-status-description");
    if (desc) {
        desc.textContent = config.description;
    }

    const updatedEl = document.getElementById("driver-status-updated");
    if (updatedEl) {
        updatedEl.textContent = formatStatusTimestamp(updatedAt);
    }

    if (driverStatusSelect) {
        driverStatusSelect.value = config.key;
    }
}

async function fetchDriverProfile() {
    try {
        if (driverStatusSelect) {
            driverStatusSelect.disabled = true;
        }
        if (driverStatusButton) {
            driverStatusButton.disabled = true;
        }

        const response = await fetch("api/driver-me.php", {
            headers: {
                "Accept": "application/json"
            }
        });

        if (response.status === 401) {
            window.location.replace("index.php");
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Unable to load driver information.");
        }

        const data = await response.json();
        currentDriver = data.driver;

        renderDriverDetails(currentDriver);
        renderDriverStatus(currentDriver.duty_status, currentDriver.status_updated_at);

        if (driverStatusSelect) {
            driverStatusSelect.disabled = false;
        }
        if (driverStatusButton) {
            driverStatusButton.disabled = false;
        }

    } catch (error) {
        console.error("Driver profile loading error:", error);
        showDriverStatusMessage(error.message || "Unable to load your driver details. Please reload the page.", "danger");
    }
}

if (driverStatusForm) {
    driverStatusForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearDriverStatusError();

        if (isUpdatingStatus) {
            return;
        }

        const rawSelected = driverStatusSelect ? driverStatusSelect.value : "";
        const canonicalStatus = STATUS_KEYS_MAP[rawSelected];

        if (!canonicalStatus) {
            if (driverStatusSelect) {
                driverStatusSelect.classList.add("is-invalid");
                driverStatusSelect.setAttribute("aria-invalid", "true");
            }
            const errorEl = document.getElementById("driver-status-error");
            if (errorEl) {
                errorEl.textContent = "Please choose a valid driver status.";
            }
            showDriverStatusMessage("Please choose a valid driver status.", "danger");
            return;
        }

        try {
            isUpdatingStatus = true;
            if (driverStatusButton) {
                driverStatusButton.disabled = true;
                driverStatusButton.textContent = "Saving...";
            }
            if (driverStatusSelect) {
                driverStatusSelect.disabled = true;
            }

            const response = await fetch("api/driver-status.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    status: canonicalStatus
                })
            });

            if (response.status === 401) {
                window.location.replace("index.php");
                return;
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Unable to update duty status.");
            }

            if (currentDriver) {
                currentDriver.duty_status = data.duty_status;
                currentDriver.status_updated_at = data.status_updated_at;
            }

            renderDriverStatus(data.duty_status, data.status_updated_at);
            showDriverStatusMessage(`Status updated to ${data.duty_status} successfully.`, "success");

        } catch (error) {
            console.error("Driver status update error:", error);
            showDriverStatusMessage(error.message || "Failed to update driver status.", "danger");
        } finally {
            isUpdatingStatus = false;
            if (driverStatusButton) {
                driverStatusButton.disabled = false;
                driverStatusButton.textContent = "Save Status";
            }
            if (driverStatusSelect) {
                driverStatusSelect.disabled = false;
            }
        }
    });
}

if (driverStatusSelect) {
    driverStatusSelect.addEventListener("change", function () {
        clearDriverStatusError();
        if (driverStatusMessage) {
            driverStatusMessage.classList.add("d-none");
            driverStatusMessage.textContent = "";
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    fetchDriverProfile();
});
