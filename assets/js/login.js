/* MOCK LOG IN FOR PHASE 1 */


const demoAccount = {
    email: "juan_delacruz@dlsu.edu.ph",
    password: "Arrows123!",
    firstName: "Juan",
    lastName: "Dela Cruz",
    role: "passenger"
};

const demoDriverAccount = {
    email: "roberto_sanjose@dlsu.edu.ph",
    password: "Arrows123!",
    firstName: "Roberto",
    lastName: "San Jose",
    role: "driver"
};

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const googleLoginButton = document.getElementById("google-login-button");
const loginMessage = document.getElementById("login-message");
let isLoggingIn = false;

/* Use textContent so user-facing messages are treated as plain text. */
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

/* Validate required fields and the university email domain. */
function validateLogin() {
    emailInput.value = emailInput.value.trim().toLowerCase();
    clearFieldError(emailInput);
    clearFieldError(passwordInput);

    if (emailInput.value === "") {
        setFieldError(emailInput, "Please enter your DLSU email.");
    } else if (emailInput.validity.typeMismatch || !/^[^\s@]+@dlsu\.edu\.ph$/i.test(emailInput.value)) {
        setFieldError(emailInput, "Use a valid email ending in @dlsu.edu.ph.");
    }

    if (passwordInput.value.trim() === "") {
        setFieldError(passwordInput, "Please enter your password.");
    }

    const firstInvalidInput = loginForm.querySelector(".is-invalid");
    if (firstInvalidInput) {
        showMessage("Please correct the highlighted fields.", "danger");
        firstInvalidInput.focus();
        return false;
    }

    return true;
}

/* Save only mock profile information. Passwords are never saved. */
function completeMockLogin(message, account = demoAccount) {
    isLoggingIn = true;
    loginButton.disabled = true;
    googleLoginButton.disabled = true;
    emailInput.disabled = true;
    passwordInput.disabled = true;
    loginButton.textContent = "Opening dashboard...";
    loginForm.setAttribute("aria-busy", "true");

    try {
        sessionStorage.setItem("arrowsExpressUser", JSON.stringify({
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            role: account.role
        }));
    } catch (error) {
        // The static dashboard can still open if browser storage is unavailable.
    }

    showMessage(message, "success");

    window.setTimeout(function () {
        window.location.href = account.role === "driver"
            ? "driver-home.html"
            : "home.html";
    }, 800);
}

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (isLoggingIn || !validateLogin()) {
        return;
    }

    const account = [demoAccount, demoDriverAccount].find(function (account) {
        return account.email === emailInput.value &&
               account.password === passwordInput.value;
    });

    if (!account) {
        showMessage(
            "Email or password is incorrect. Use one of the demo accounts shown below.",
            "danger"
        );
        passwordInput.focus();
        return;
    }

    completeMockLogin(
        "Demo login successful. Opening your " + account.role + " dashboard...",
        account
    );
});

/* Google sign-in uses the same demo passenger and makes no external request. */
googleLoginButton.addEventListener("click", function () {
    if (isLoggingIn) {
        return;
    }
    clearFieldError(emailInput);
    clearFieldError(passwordInput);
    completeMockLogin("Google demo sign-in successful. Opening Juan's passenger dashboard...");
});

[emailInput, passwordInput].forEach(function (input) {
    input.addEventListener("input", function () {
        clearFieldError(input);
        if (!isLoggingIn) {
            loginMessage.classList.add("d-none");
            loginMessage.textContent = "";
        }
    });
});

// Enable login actions only after their JavaScript handlers are ready.
loginButton.disabled = false;
googleLoginButton.disabled = false;