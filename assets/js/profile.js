/* MOCK PASSENGER PROFILE FOR PHASE 1 */
const demoProfile = {
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan_delacruz@dlsu.edu.ph",
    idNumber: "12400001",
    passengerType: "student",
    sex: "male",
    collegeDepartment: "College of Computer Studies",
    contactNumber: "09123456789",
    campus: "Manila",
    verificationDocument: "juan-delacruz-eaf.pdf"
};

const passengerTypeLabels = {
    student: "Student",
    faculty: "Faculty",
    "employee-staff": "Employee / Staff"
};

const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const editProfileButton = document.getElementById("edit-profile-button");
const profileEditActions = document.getElementById("profile-edit-actions");

const profileFields = {
    firstName: document.getElementById("first-name"),
    lastName: document.getElementById("last-name"),
    email: document.getElementById("profile-email"),
    idNumber: document.getElementById("id-number"),
    passengerType: document.getElementById("passenger-type"),
    sex: document.getElementById("sex"),
    collegeDepartment: document.getElementById("college-department"),
    contactNumber: document.getElementById("contact-number"),
    campus: document.getElementById("profile-campus")
};

const documentInput = document.getElementById("verification-document");
const passwordInput = document.getElementById("profile-password");
const confirmPasswordInput = document.getElementById("confirm-password");

const allProfileInputs = [
    ...Object.values(profileFields),
    documentInput,
    passwordInput,
    confirmPasswordInput
];

let savedProfile = { ...demoProfile };
let profileStorageKey = "arrowsExpressProfile:" + demoProfile.email;
let savedDemoPassword = "Arrows123!";
let isEditingProfile = false;

function showProfileMessage(message, type) {
    profileMessage.className = "alert alert-" + type;
    profileMessage.textContent = message;
}

function clearProfileMessage() {
    profileMessage.classList.add("d-none");
    profileMessage.textContent = "";
}

function clearProfileFieldError(input) {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    document.getElementById(input.id + "-error").textContent = "";
}

function setProfileFieldError(input, message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    document.getElementById(input.id + "-error").textContent = message;
}

/* Validate profile details without storing passwords or document contents. */
function getProfileErrors(profile) {
    const errors = {};

    ["firstName", "lastName"].forEach(function (key) {
        if (profile[key].trim() === "" || profile[key].length > 50) {
            errors[key] = "Enter a name with 1 to 50 characters.";
        }
    });

    if (
        profile.email.length > 254 ||
        !/^[a-z0-9._%+-]+@dlsu\.edu\.ph$/i.test(profile.email)
    ) {
        errors.email = "Enter a valid email ending in @dlsu.edu.ph.";
    }

    if (!/^[a-z0-9-]{3,20}$/i.test(profile.idNumber)) {
        errors.idNumber = "Enter an ID number with 3 to 20 letters, digits, or hyphens.";
    }

    if (!Object.hasOwn(passengerTypeLabels, profile.passengerType)) {
        errors.passengerType = "Select a passenger type.";
    }

    if (!["male", "female", "prefer-not-to-say"].includes(profile.sex)) {
        errors.sex = "Select a sex option.";
    }

    if (
        profile.collegeDepartment.trim().length < 2 ||
        profile.collegeDepartment.length > 100
    ) {
        errors.collegeDepartment = "Enter your college or department with 2 to 100 characters.";
    }

    if (!/^\+?\d{10,15}$/.test(profile.contactNumber)) {
        errors.contactNumber = "Enter 10 to 15 digits, with an optional + prefix.";
    }

    if (!["Manila", "Laguna"].includes(profile.campus)) {
        errors.campus = "Select Manila or Laguna.";
    }

    return errors;
}

function readProfileFields() {
    const profile = {};

    Object.keys(profileFields).forEach(function (key) {
        profile[key] = profileFields[key].value.trim();
    });

    profile.firstName = profile.firstName.replace(/\s+/g, " ");
    profile.lastName = profile.lastName.replace(/\s+/g, " ");
    profile.email = profile.email.toLowerCase();
    profile.contactNumber = profile.contactNumber.replace(/[\s()-]/g, "");
    profile.verificationDocument = savedProfile.verificationDocument;

    return profile;
}

/* Always render user-entered data as text, never as HTML. */
function renderProfile() {
    Object.keys(profileFields).forEach(function (key) {
        profileFields[key].value = savedProfile[key];
    });

    const fullName = savedProfile.firstName + " " + savedProfile.lastName;

    document.getElementById("profile-header-name").textContent = fullName;
    document.getElementById("profile-summary-name").textContent = fullName;
    document.getElementById("profile-summary-email").textContent = savedProfile.email;
    document.getElementById("profile-summary-campus").textContent = savedProfile.campus;
    document.getElementById("profile-summary-type").textContent =
        passengerTypeLabels[savedProfile.passengerType];

    // Display the user's ID number instead of initials.
    document.getElementById("profile-summary-id").textContent = savedProfile.idNumber;

    document.getElementById("profile-document-name").textContent =
        savedProfile.verificationDocument;

    documentInput.value = "";
    passwordInput.value = savedDemoPassword;
    confirmPasswordInput.value = savedDemoPassword;
}

function setProfileEditing(isEditing) {
    isEditingProfile = isEditing;

    allProfileInputs.forEach(function (input) {
        if (input.tagName === "SELECT" || input.type === "file") {
            input.disabled = !isEditing;
        } else {
            input.readOnly = !isEditing;
        }

        clearProfileFieldError(input);
    });

    editProfileButton.classList.toggle("d-none", isEditing);
    profileEditActions.classList.toggle("d-none", !isEditing);
    document.getElementById("profile-document-edit").classList.toggle("d-none", !isEditing);

    document.getElementById("profile-edit-help").textContent = isEditing
        ? "Update your details, then select Save Changes."
        : "Select Edit Profile to make changes.";
}

/* Upgrade the earlier five-field profile while preserving existing edits. */
function upgradeStoredProfile(storedProfile) {
    const profile = { ...savedProfile };

    if (
        !storedProfile ||
        typeof storedProfile !== "object" ||
        Array.isArray(storedProfile) ||
        (
            !Object.hasOwn(storedProfile, "firstName") &&
            typeof storedProfile.fullName !== "string"
        )
    ) {
        throw new Error("Invalid stored profile");
    }

    Object.keys(profile).forEach(function (key) {
        if (Object.hasOwn(storedProfile, key)) {
            if (typeof storedProfile[key] !== "string") {
                throw new Error("Invalid stored profile field");
            }

            profile[key] = storedProfile[key];
        }
    });

    if (
        !Object.hasOwn(storedProfile, "firstName") &&
        typeof storedProfile.fullName === "string"
    ) {
        const names = storedProfile.fullName.trim().split(/\s+/);
        profile.firstName = names.shift();

        if (names.length > 0) {
            profile.lastName = names.join(" ");
        }
    }

    if (
        !Object.hasOwn(storedProfile, "idNumber") &&
        typeof storedProfile.studentNumber === "string"
    ) {
        profile.idNumber = storedProfile.studentNumber;
    }

    if (
        !Object.hasOwn(storedProfile, "firstName") &&
        profile.contactNumber === ""
    ) {
        profile.contactNumber = demoProfile.contactNumber;
    }

    if (
        Object.keys(getProfileErrors(profile)).length > 0 ||
        profile.verificationDocument.trim() === "" ||
        profile.verificationDocument.length > 255
    ) {
        throw new Error("Invalid stored profile values");
    }

    return profile;
}

function loadProfile() {
    try {
        const user = JSON.parse(sessionStorage.getItem("arrowsExpressUser"));

        if (user && typeof user === "object") {
            if (
                typeof user.email === "string" &&
                /^[a-z0-9._%+-]+@dlsu\.edu\.ph$/i.test(user.email)
            ) {
                savedProfile.email = user.email.toLowerCase();
                profileStorageKey = "arrowsExpressProfile:" + savedProfile.email;
            }

            ["firstName", "lastName"].forEach(function (key) {
                if (
                    typeof user[key] === "string" &&
                    user[key].trim() !== "" &&
                    user[key].length <= 50
                ) {
                    savedProfile[key] = user[key].trim();
                }
            });
        }
    } catch (error) {
        // Direct visits and unavailable session storage use the filled demo account.
    }

    try {
        const storedProfile = JSON.parse(localStorage.getItem(profileStorageKey));

        if (storedProfile !== null) {
            savedProfile = upgradeStoredProfile(storedProfile);
        }
    } catch (error) {
        showProfileMessage(
            "Saved details could not be loaded. Filled demo details are shown; you can still edit them.",
            "warning"
        );
    }
}

editProfileButton.addEventListener("click", function () {
    clearProfileMessage();
    setProfileEditing(true);
    profileFields.firstName.focus();
});

document.getElementById("cancel-profile-button").addEventListener("click", function () {
    renderProfile();
    setProfileEditing(false);
    clearProfileMessage();
    editProfileButton.focus();
});

profileForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!isEditingProfile) {
        return;
    }

    const profile = readProfileFields();
    const errors = getProfileErrors(profile);

    allProfileInputs.forEach(clearProfileFieldError);

    Object.keys(errors).forEach(function (key) {
        setProfileFieldError(profileFields[key], errors[key]);
    });

    if (
        passwordInput.value.length < 8 ||
        passwordInput.value.length > 128 ||
        passwordInput.value.trim() === ""
    ) {
        setProfileFieldError(
            passwordInput,
            "Use a demo password with 8 to 128 characters."
        );
    }

    if (confirmPasswordInput.value !== passwordInput.value) {
        setProfileFieldError(confirmPasswordInput, "The passwords must match.");
    }

    const file = documentInput.files[0];

    if (file) {
        if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || file.name.length > 255) {
            setProfileFieldError(
                documentInput,
                "Choose a PDF, JPG, or PNG with a filename up to 255 characters."
            );
        } else if (file.size > 5 * 1024 * 1024) {
            setProfileFieldError(
                documentInput,
                "Choose a document no larger than 5 MB."
            );
        } else {
            profile.verificationDocument = file.name;
        }
    }

    const firstInvalidInput = profileForm.querySelector(".is-invalid");

    if (firstInvalidInput) {
        showProfileMessage("Please correct the highlighted fields.", "danger");
        firstInvalidInput.focus();
        return;
    }

    const passwordChanged = passwordInput.value !== savedDemoPassword;

    savedDemoPassword = passwordInput.value;
    savedProfile = profile;

    try {
        localStorage.setItem(profileStorageKey, JSON.stringify(savedProfile));

        showProfileMessage(
            "Profile updated successfully. Demo details are saved in this browser." +
            (
                passwordChanged
                    ? " The password change applies only to this visit; demo login credentials remain the same."
                    : ""
            ),
            "success"
        );
    } catch (error) {
        showProfileMessage(
            "Profile updated for this visit, but browser storage is unavailable. Changes will reset on reload.",
            "warning"
        );
    }

    renderProfile();
    setProfileEditing(false);
    editProfileButton.focus();
});

allProfileInputs.forEach(function (input) {
    input.addEventListener("input", function () {
        clearProfileFieldError(input);
        clearProfileMessage();
    });
});

documentInput.addEventListener("change", function () {
    const file = documentInput.files[0];

    document.getElementById("profile-document-name").textContent = file
        ? file.name + " (selected; save to apply)"
        : savedProfile.verificationDocument;
});

loadProfile();
renderProfile();
setProfileEditing(false);

// Enable editing only after the page's handlers and demo data are ready.
editProfileButton.disabled = false;