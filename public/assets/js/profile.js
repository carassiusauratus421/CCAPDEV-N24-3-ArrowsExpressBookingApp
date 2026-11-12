/* My Profile: authenticated MySQL profile data, no Phase 1 demo storage. */
(() => {
    "use strict";

    const form = document.getElementById("profile-form");
    const message = document.getElementById("profile-message");
    const editButton = document.getElementById("edit-profile-button");
    const cancelButton = document.getElementById("cancel-profile-button");
    const actions = document.getElementById("profile-edit-actions");
    const help = document.getElementById("profile-edit-help");
    if (!form || !editButton || !cancelButton || !actions) return;

    const inputs = {
        first_name: document.getElementById("first-name"),
        last_name: document.getElementById("last-name"),
        email: document.getElementById("profile-email"),
        id_number: document.getElementById("id-number"),
        passenger_type: document.getElementById("passenger-type"),
        sex: document.getElementById("sex"),
        college: document.getElementById("college-department")
    };
    const editable = ["first_name", "last_name", "passenger_type", "sex", "college"];
    const typeLabels = { student: "Student", faculty: "Faculty", "employee-staff": "Employee / Staff" };
    let current = null;
    let csrfToken = "";
    let editing = false;
    let saving = false;

    function text(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function feedback(value, type = "danger") {
        message.className = "alert alert-" + type;
        message.textContent = value;
    }

    function clearFeedback() {
        message.className = "alert d-none";
        message.textContent = "";
    }

    function fieldError(input, value) {
        if (!input) return;
        input.classList.toggle("is-invalid", Boolean(value));
        const target = document.getElementById(input.id + "-error");
        if (target) target.textContent = value || "";
    }

    function clearErrors() {
        Object.values(inputs).forEach(input => fieldError(input, ""));
    }

    function display(profile) {
        current = profile;
        Object.entries(inputs).forEach(([key, input]) => {
            if (!input) return;
            let value = String(profile[key] ?? "");
            if (key === "sex") value = value.toLowerCase();
            if (input.tagName === "SELECT" && value && !Array.from(input.options).some(option => option.value === value)) {
                // The database may contain a legacy value not offered by the select.
                const option = new Option(value, value);
                input.add(option);
            }
            input.value = value;
        });
        const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
        text("profile-header-name", name);
        text("profile-summary-name", name);
        text("profile-summary-email", profile.email || "");
        text("profile-summary-id", profile.id_number || "");
        text("profile-summary-type", typeLabels[profile.passenger_type] || profile.passenger_type || "Passenger");
        const filename = profile.document_path ? String(profile.document_path).split(/[\\/]/).pop() : "No document recorded";
        text("profile-document-name", filename);
        document.querySelectorAll("[data-passenger-name]").forEach(element => { element.textContent = name; });
    }

    function setEditing(enabled) {
        editing = enabled;
        editable.forEach(key => {
            const input = inputs[key];
            if (!input) return;
            if (input.tagName === "SELECT") input.disabled = !enabled;
            else input.readOnly = !enabled;
        });
        // The passenger cannot change account identifiers in this form.
        for (const key of ["email", "id_number"]) {
            if (inputs[key]) inputs[key].readOnly = true;
        }
        editButton.classList.toggle("d-none", enabled);
        actions.classList.toggle("d-none", !enabled);
        if (help) help.textContent = enabled
            ? "Edit your details, then select Save Changes."
            : "Select Edit Profile to make changes.";
        clearErrors();
    }

    async function loadProfile() {
        editButton.disabled = true;
        try {
            const response = await fetch("api/profile.php", { credentials: "same-origin", cache: "no-store" });
            const data = await response.json();
            if (!response.ok || !data.profile) throw new Error(data.error || "Unable to load profile.");
            csrfToken = data.csrf_token;
            display(data.profile);
            clearFeedback();
            editButton.disabled = false;
        } catch (error) {
            feedback(error.message || "Unable to load your profile. Please refresh.");
        }
    }

    editButton.addEventListener("click", () => {
        if (!current || saving) return;
        clearFeedback();
        setEditing(true);
        inputs.first_name.focus();
    });

    cancelButton.addEventListener("click", () => {
        if (saving) return;
        display(current);
        setEditing(false);
        clearFeedback();
        editButton.focus();
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!editing || saving) return;
        clearErrors();
        clearFeedback();
        const payload = {};
        editable.forEach(key => { payload[key] = (inputs[key]?.value ?? "").trim(); });

        let invalid = null;
        const mark = (key, error) => {
            fieldError(inputs[key], error);
            invalid = invalid || inputs[key];
        };
        for (const key of ["first_name", "last_name"]) {
            if (!payload[key] || payload[key].length > 45) mark(key, "Use 1 to 45 characters.");
        }
        if (payload.college.length > 45) mark("college", "Maximum 45 characters.");
        if (!Object.hasOwn(typeLabels, payload.passenger_type)) mark("passenger_type", "Select a passenger type.");
        if (!["male", "female", "prefer-not-to-say"].includes(payload.sex)) mark("sex", "Select a valid option.");
        if (invalid) {
            feedback("Please correct the highlighted fields.");
            invalid.focus();
            return;
        }

        saving = true;
        const submit = form.querySelector('[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            const response = await fetch("api/profile.php", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Unable to save your profile.");
            display(data.profile);
            setEditing(false);
            feedback("Profile changes saved to MySQL.", "success");
            document.dispatchEvent(new Event("arrows-express-profile-updated"));
        } catch (error) {
            feedback(error.message || "Unable to save profile.");
        } finally {
            saving = false;
            if (submit) submit.disabled = false;
        }
    });

    setEditing(false);
    loadProfile();
})();
