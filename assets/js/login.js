/* MOCK LOG IN USING THE SHARED JSON DATA */
const loginStorageKey = "arrowsExpressDemoChanges:v1";
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const googleLoginButton = document.getElementById("google-login-button");
const loginMessage = document.getElementById("login-message");
let loginSeed = null;
let demoAccounts = [];
let demoAccount = null;
let isLoggingIn = false;
let accountsLoadFailed = false;

/* Saved profiles override JSON names and emails, but not demo passwords. */
function refreshDemoAccounts() {
    if (!loginSeed) { return; }
    const users = JSON.parse(JSON.stringify(loginSeed.users));
    try {
        const changes = JSON.parse(localStorage.getItem(loginStorageKey));
        if (changes && changes.schemaVersion === loginSeed.schemaVersion) {
            (changes.users || []).forEach(function (change) {
                const user = users.find(function (item) { return item.id === change.id; });
                if (user) { Object.assign(user, change); }
                else { users.push({ ...change }); }
            });
        }
    } catch (error) {
        console.warn("Saved demo account changes could not be loaded:", error);
    }
    demoAccounts = users.filter(function (user) {
        return !user.deleted && ["passenger", "driver", "admin"].includes(user.role);
    }).map(function (user) {
        const credentials = loginSeed.demoCredentials.find(function (item) { return item.userId === user.id; });
        const password = credentials?.password ||
            (user.role === "admin" && user.createdBy ? loginSeed.settings.newAccountDemoPassword : null);
        return password ? { ...user, password: password } : null;
    }).filter(Boolean);
    demoAccount = demoAccounts.find(function (account) { return account.id === loginSeed.settings.defaultPassengerId; });

    [["passenger", loginSeed.settings.defaultPassengerId],
        ["driver", loginSeed.settings.defaultDriverUserId],
        ["admin", loginSeed.settings.defaultAdminId]].forEach(function ([role, id]) {
        const account = demoAccounts.find(function (item) { return item.id === id; });
        document.getElementById("demo-" + role + "-email").textContent = account?.email || "Profile deleted";
        document.getElementById("demo-" + role + "-password").textContent = account?.password || "Unavailable";
    });
}

function showMessage(message, type) {
    loginMessage.className = "alert alert-" + type;
    loginMessage.textContent = message;
}

function setFieldError(input, message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    document.getElementById(input.id + "-error").textContent = message;
}

function clearFieldError(input) {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    document.getElementById(input.id + "-error").textContent = "";
}

/* Check the email and password fields before demo sign-in. */
function validateLogin() {
    emailInput.value = emailInput.value.trim().toLowerCase();
    clearFieldError(emailInput);
    clearFieldError(passwordInput);
    if (emailInput.value === "") {
        setFieldError(emailInput, "Please enter your DLSU email.");
    } else if (emailInput.validity.typeMismatch || !/^[^\s@]+@dlsu\.edu\.ph$/i.test(emailInput.value)) {
        setFieldError(emailInput, "Use a valid email ending in @dlsu.edu.ph.");
    }
    if (passwordInput.value.trim() === "") { setFieldError(passwordInput, "Please enter your password."); }
    const firstInvalidInput = loginForm.querySelector(".is-invalid");
    if (firstInvalidInput) {
        showMessage("Please correct the highlighted fields.", "danger");
        firstInvalidInput.focus();
        return false;
    }
    return true;
}

function canUseDemoAccounts() {
    if (!loginSeed) {
        showMessage(accountsLoadFailed ? "Demo accounts could not be loaded. Check mock-data.json and reload."
            : "Demo accounts are still loading. Please try again in a moment.", accountsLoadFailed ? "danger" : "info");
        return false;
    }
    refreshDemoAccounts();
    return true;
}

/* This is a frontend session marker, not server authentication. */
function completeMockLogin(message, account = demoAccount) {
    if (!account) { showMessage("The demo passenger profile is unavailable.", "warning"); return; }
    isLoggingIn = true;
    [loginButton, googleLoginButton, emailInput, passwordInput].forEach(function (control) { control.disabled = true; });
    loginButton.textContent = "Opening dashboard...";
    loginForm.setAttribute("aria-busy", "true");
    try {
        sessionStorage.setItem("arrowsExpressUser", JSON.stringify({
            id: account.id, email: account.email, firstName: account.firstName,
            lastName: account.lastName, role: account.role
        }));
    } catch (error) { /* Browser storage may be unavailable in this demo. */ }
    showMessage(message, "success");
    const destinations = { passenger: "home.html", driver: "driver-home.html", admin: "admin.html" };
    window.setTimeout(function () { window.location.href = destinations[account.role]; }, 800);
}

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (isLoggingIn || !canUseDemoAccounts() || !validateLogin()) { return; }
    const account = demoAccounts.find(function (item) {
        return item.email.toLowerCase() === emailInput.value && item.password === passwordInput.value;
    });
    if (!account) {
        showMessage("Email or password is incorrect. Use one of the demo accounts shown below.", "danger");
        passwordInput.focus();
        return;
    }
    completeMockLogin("Demo login successful. Opening your " + account.role + " dashboard...", account);
});

googleLoginButton.addEventListener("click", function () {
    if (isLoggingIn || !canUseDemoAccounts()) { return; }
    clearFieldError(emailInput);
    clearFieldError(passwordInput);
    completeMockLogin("Google demo sign-in successful. Opening the passenger dashboard...");
});

[emailInput, passwordInput].forEach(function (input) {
    input.addEventListener("input", function () {
        clearFieldError(input);
        if (!isLoggingIn) { loginMessage.classList.add("d-none"); loginMessage.textContent = ""; }
    });
});
window.addEventListener("pageshow", function () {
    isLoggingIn = false;
    [loginButton, googleLoginButton, emailInput, passwordInput].forEach(function (control) { control.disabled = false; });
    loginButton.textContent = "Log In";
    loginForm.removeAttribute("aria-busy");
    loginMessage.classList.add("d-none");
    refreshDemoAccounts();
});
window.addEventListener("storage", function (event) {
    if (event.key === loginStorageKey || event.key === null) { refreshDemoAccounts(); }
});
window.addEventListener("arrows-express-data-updated", refreshDemoAccounts);

fetch("assets/data/mock-data.json")
    .then(function (response) {
        if (!response.ok) { throw new Error("Could not load mock-data.json."); }
        return response.json();
    })
    .then(function (data) { loginSeed = data; refreshDemoAccounts(); })
    .catch(function (error) {
        loginSeed = null;
        accountsLoadFailed = true;
        console.error("Could not load demo accounts:", error);
        showMessage("Demo accounts could not be loaded. Check mock-data.json and reload.", "danger");
    });
