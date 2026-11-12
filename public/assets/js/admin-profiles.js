/* ========================================================
   ADMIN USER PROFILES - MYSQL BACKEND INTEGRATION
   ======================================================== */

const adminUserList = document.getElementById("admin-user-list");
const adminSearchInput = document.getElementById("admin-search");
const adminMessageEl = document.getElementById("admin-message");
const adminContentEl = document.getElementById("admin-content");
const adminUserForm = document.getElementById("admin-user-form");
const adminUserFormError = document.getElementById("admin-user-form-error");
const userRoleSelect = document.getElementById("user-role");
const passengerFields = document.getElementById("admin-passenger-fields");
const driverFields = document.getElementById("admin-driver-fields");
const vehicleSelect = document.getElementById("user-vehicle");
const driverStatusSelect = document.getElementById("user-driver-status");

let adminProfiles = [];
let adminVehicles = [];
let adminProfileCsrfToken = "";
let editingUserId = null;
let isSubmitting = false;

const DRIVER_DUTY_STATUSES = [
    { value: "Active", label: "Active" },
    { value: "On Departure", label: "On Departure" },
    { value: "Inactive", label: "Inactive" },
    { value: "Off-duty", label: "Off-duty" }
];

function showAdminMessage(message, type = "success") {
    if (!adminMessageEl) return;
    adminMessageEl.className = "alert alert-" + type;
    adminMessageEl.textContent = message;
    adminMessageEl.classList.remove("d-none");
    adminMessageEl.focus({ preventScroll: true });
}

function showFormError(message) {
    if (!adminUserFormError) return;
    adminUserFormError.textContent = message;
    adminUserFormError.classList.remove("d-none");
    adminUserFormError.focus({ preventScroll: true });
}

function clearFormError() {
    if (!adminUserFormError) return;
    adminUserFormError.textContent = "";
    adminUserFormError.classList.add("d-none");
}

function getAdminValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function updateAdminUserFields() {
    const isDriver = userRoleSelect.value === "driver";
    if (passengerFields) {
        passengerFields.classList.toggle("d-none", isDriver);
    }
    if (driverFields) {
        driverFields.classList.toggle("d-none", !isDriver);
    }
    const collegeInput = document.getElementById("user-college");
    if (collegeInput) {
        collegeInput.required = !isDriver;
    }
}

function populateVehicleDropdown(selectedId = null) {
    if (!vehicleSelect) return;
    vehicleSelect.replaceChildren();

    const defaultOpt = new Option("Not assigned", "");
    vehicleSelect.add(defaultOpt);

    adminVehicles.forEach(function (v) {
        const label = `${v.plate_number} (${v.vehicle_model})`;
        const opt = new Option(label, String(v.vehicle_id));
        if (selectedId && String(v.vehicle_id) === String(selectedId)) {
            opt.selected = true;
        }
        vehicleSelect.add(opt);
    });
}

function populateDriverStatusDropdown(selectedStatus = "Active") {
    if (!driverStatusSelect) return;
    driverStatusSelect.replaceChildren();

    DRIVER_DUTY_STATUSES.forEach(function (item) {
        const opt = new Option(item.label, item.value);
        if (item.value.toLowerCase() === (selectedStatus || "").toLowerCase()) {
            opt.selected = true;
        }
        driverStatusSelect.add(opt);
    });
}

function renderProfilesTable() {
    if (!adminUserList) return;
    adminUserList.replaceChildren();

    const query = adminSearchInput ? adminSearchInput.value.trim().toLowerCase() : "";

    const filtered = adminProfiles.filter(function (p) {
        if (!query) return true;
        const haystack = [
            p.full_name,
            p.first_name,
            p.last_name,
            p.email,
            p.id_number,
            p.role,
            p.college,
            p.vehicle_plate,
            p.vehicle_model
        ].filter(Boolean).join(" ").toLowerCase();

        return haystack.includes(query);
    });

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.className = "text-secondary py-3 text-center";
        cell.textContent = query ? "No matching user profiles found." : "No profiles registered yet.";
        row.appendChild(cell);
        adminUserList.appendChild(row);
        return;
    }

    filtered.forEach(function (profile) {
        const row = document.createElement("tr");

        // Name
        const nameCell = document.createElement("td");
        const nameStrong = document.createElement("strong");
        nameStrong.className = "d-block";
        nameStrong.textContent = profile.full_name || "—";
        nameCell.appendChild(nameStrong);
        if (profile.account_status && profile.account_status !== "active") {
            const badge = document.createElement("span");
            badge.className = "badge bg-warning text-dark me-1";
            badge.textContent = profile.account_status.toUpperCase();
            nameCell.appendChild(badge);
        }
        row.appendChild(nameCell);

        // Type
        const typeCell = document.createElement("td");
        const isDriver = profile.role === "driver";
        const typeBadge = document.createElement("span");
        typeBadge.className = isDriver ? "badge bg-primary-subtle text-primary px-2 py-1" : "badge bg-success-subtle text-success px-2 py-1";
        typeBadge.textContent = isDriver ? "Driver" : "Passenger";
        typeCell.appendChild(typeBadge);
        row.appendChild(typeCell);

        // Email
        const emailCell = document.createElement("td");
        emailCell.textContent = profile.email || "—";
        row.appendChild(emailCell);

        // ID / Employee Number
        const idCell = document.createElement("td");
        idCell.textContent = profile.id_number || "—";
        if (isDriver && profile.vehicle_plate) {
            const vehicleInfo = document.createElement("div");
            vehicleInfo.className = "small text-secondary";
            vehicleInfo.textContent = `${profile.vehicle_plate} (${profile.vehicle_model || ""})`;
            idCell.appendChild(vehicleInfo);
        }
        row.appendChild(idCell);

        // Actions
        const actionsCell = document.createElement("td");
        const btnGroup = document.createElement("div");
        btnGroup.className = "d-flex gap-2";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-sm btn-outline-success";
        editBtn.textContent = "View / Edit";
        editBtn.addEventListener("click", function () {
            openUserModal(profile.user_id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn-sm btn-outline-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", function () {
            deleteUserProfile(profile);
        });

        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);
        actionsCell.appendChild(btnGroup);
        row.appendChild(actionsCell);

        adminUserList.appendChild(row);
    });
}

async function loadAdminProfiles() {
    try {
        const response = await fetch("api/admin-profiles.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!response.ok) {
            const errData = await response.json().catch(function () { return {}; });
            throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        adminProfiles = Array.isArray(data.profiles) ? data.profiles : [];
        adminVehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
        adminProfileCsrfToken = data.csrf_token || "";

        const adminNameEl = document.getElementById("admin-user-name");
        if (adminNameEl && data.admin_email) {
            adminNameEl.textContent = data.admin_email.split("@")[0] || "Admin";
        }

        renderProfilesTable();
        populateVehicleDropdown();
        populateDriverStatusDropdown();

        if (adminContentEl) {
            adminContentEl.setAttribute("aria-busy", "false");
        }
    } catch (error) {
        console.error("Failed to load user profiles:", error);
        showAdminMessage("Could not load user profiles: " + error.message, "danger");
        if (adminContentEl) {
            adminContentEl.setAttribute("aria-busy", "false");
        }
    }
}

function openUserModal(userId = null) {
    editingUserId = userId;
    clearFormError();

    if (!adminUserForm) return;
    adminUserForm.reset();

    const modalTitle = document.getElementById("admin-user-modal-heading");

    if (userId) {
        const profile = adminProfiles.find(function (p) { return p.user_id === userId; });
        if (!profile) {
            showAdminMessage("Profile not found.", "danger");
            return;
        }

        if (modalTitle) modalTitle.textContent = "Edit User Profile";

        document.getElementById("user-first-name").value = profile.first_name || "";
        document.getElementById("user-last-name").value = profile.last_name || "";
        document.getElementById("user-email").value = profile.email || "";
        userRoleSelect.value = profile.role || "passenger";
        userRoleSelect.disabled = true;

        document.getElementById("user-id-number").value = profile.id_number || "";

        if (profile.role === "passenger") {
            document.getElementById("user-passenger-type").value = profile.passenger_type || "student";
            document.getElementById("user-sex").value = profile.sex || "prefer-not-to-say";
            document.getElementById("user-college").value = profile.college || "";
            document.getElementById("user-document").value = profile.document_path || "";
        } else {
            populateVehicleDropdown(profile.assigned_vehicle_id);
            populateDriverStatusDropdown(profile.duty_status);
            document.getElementById("user-verified").value = profile.account_status === "active" ? "true" : "false";
            document.getElementById("user-driver-number").value = profile.driver_number || "";
        }
    } else {
        if (modalTitle) modalTitle.textContent = "Add User Profile";
        userRoleSelect.value = "passenger";
        userRoleSelect.disabled = false;
        populateVehicleDropdown();
        populateDriverStatusDropdown("Active");
    }

    updateAdminUserFields();

    const modalEl = document.getElementById("admin-user-modal");
    if (modalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
}

async function saveUserProfile(event) {
    event.preventDefault();
    if (isSubmitting) return;

    clearFormError();

    if (!adminUserForm.checkValidity()) {
        adminUserForm.reportValidity();
        return;
    }

    const role = userRoleSelect.value;
    const firstName = getAdminValue("user-first-name");
    const lastName = getAdminValue("user-last-name");
    const email = getAdminValue("user-email").toLowerCase();
    const idNumber = getAdminValue("user-id-number");
    const contact = getAdminValue("user-contact");

    if (!firstName || !lastName) {
        showFormError("Enter a first and last name.");
        return;
    }

    if (!email) {
        showFormError("Enter a valid DLSU email address.");
        return;
    }

    const payload = {
        action: editingUserId ? "update" : "create",
        user_id: editingUserId,
        role: role,
        first_name: firstName,
        last_name: lastName,
        email: email,
        id_number: idNumber,
        contact: contact
    };

    if (role === "passenger") {
        const college = getAdminValue("user-college");
        if (!college) {
            showFormError("Enter the college or department.");
            return;
        }
        payload.passenger_type = getAdminValue("user-passenger-type");
        payload.sex = getAdminValue("user-sex");
        payload.college = college;
        payload.campus = getAdminValue("user-campus");
        payload.document_path = getAdminValue("user-document");
    } else {
        payload.assigned_vehicle_id = getAdminValue("user-vehicle") || null;
        payload.verified = getAdminValue("user-verified");
        payload.duty_status = getAdminValue("user-driver-status");
        payload.driver_number = getAdminValue("user-driver-number");
    }

    isSubmitting = true;

    try {
        const response = await fetch("api/admin-profiles.php", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": adminProfileCsrfToken
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to save profile.");
        }

        const modalEl = document.getElementById("admin-user-modal");
        if (modalEl && window.bootstrap) {
            const instance = bootstrap.Modal.getInstance(modalEl);
            if (instance) instance.hide();
        }

        showAdminMessage(data.message || (editingUserId ? "Profile updated." : "Profile added."), "success");
        await loadAdminProfiles();
    } catch (error) {
        showFormError(error.message);
    } finally {
        isSubmitting = false;
    }
}

async function deleteUserProfile(profile) {
    const name = profile.full_name || profile.email;
    const confirmMsg = `Delete profile for ${name}? Future reservations or assignments will be updated.`;
    if (!window.confirm(confirmMsg)) {
        return;
    }

    try {
        const response = await fetch("api/admin-profiles.php", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": adminProfileCsrfToken
            },
            body: JSON.stringify({
                action: "delete",
                user_id: profile.user_id
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to delete profile.");
        }

        showAdminMessage(data.message || "Profile deleted successfully.", "success");
        await loadAdminProfiles();
    } catch (error) {
        showAdminMessage("Failed to delete profile: " + error.message, "danger");
    }
}

// Event Listeners
if (adminSearchInput) {
    adminSearchInput.addEventListener("input", renderProfilesTable);
}

if (userRoleSelect) {
    userRoleSelect.addEventListener("change", updateAdminUserFields);
}

if (adminUserForm) {
    adminUserForm.addEventListener("submit", saveUserProfile);
}

document.querySelectorAll("[data-admin-action='add-user']").forEach(function (btn) {
    btn.addEventListener("click", function () {
        openUserModal(null);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    loadAdminProfiles();
});
