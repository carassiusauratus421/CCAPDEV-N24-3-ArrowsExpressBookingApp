/* MOCK LOG IN USING THE SHARED JSON DATA */

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");
const googleLoginButton = document.getElementById("google-login-button");

let isLoggingIn = false;


// Display login feedback

function showLoginMessage(message, type = "danger") {
    loginMessage.textContent = message;
    loginMessage.className = "alert alert-" + type;
}

function clearFieldError(input) {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");

    const feedback = document.getElementById(
        input.id + "-error"
    );

    if (feedback) {
        feedback.textContent = "";
    }
}

function setFieldError(input, message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    const feedback = document.getElementById(
        input.id + "-error"
    );

    if (feedback) {
        feedback.textContent = message;
    }
}


// Validate login fields

function validateLogin() {
    const email = emailInput.value.trim();

    clearFieldError(emailInput);
    clearFieldError(passwordInput);

    if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        setFieldError(
            emailInput,
            "Enter a valid email address."
        );
    }

    if (!passwordInput.value) {
        setFieldError(
            passwordInput,
            "Enter your password."
        );
    }

    const invalidInput = loginForm.querySelector(
        ".is-invalid"
    );

    if (invalidInput) {
        showLoginMessage(
            "Please correct the highlighted fields."
        );

        invalidInput.focus();
        return false;
    }

    return true;
}


// Authenticate through PHP and MySQL

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (isLoggingIn || !validateLogin()) {
        return;
    }

    isLoggingIn = true;

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
    loginForm.setAttribute("aria-busy", "true");

    try {
        const response = await fetch("api/login.php", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: emailInput.value.trim().toLowerCase(),
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to log in."
            );
        }

        showLoginMessage(
            "Login successful. Opening your dashboard...",
            "success"
        );

        // Clear any previous Phase 1 demo session marker.
        sessionStorage.removeItem("arrowsExpressUser");

        window.location.replace(data.redirect || "home.php");

    } catch (error) {
        showLoginMessage(error.message);
        passwordInput.focus();

    } finally {
        isLoggingIn = false;
        loginButton.disabled = false;
        loginButton.textContent = "Log In";
        loginForm.removeAttribute("aria-busy");
    }
});


// Clear validation messages

[emailInput, passwordInput].forEach(function (input) {
    input.addEventListener("input", function () {
        clearFieldError(input);

        loginMessage.textContent = "";
        loginMessage.className = "alert d-none";
    });
});


// Disable the old Google demo login

if (googleLoginButton) {
    googleLoginButton.disabled = true;
    googleLoginButton.title =
        "Google authentication is not configured.";
}


// Reset the form after browser navigation

window.addEventListener("pageshow", function () {
    isLoggingIn = false;

    loginButton.disabled = false;
    loginButton.textContent = "Log In";
    loginForm.removeAttribute("aria-busy");
});