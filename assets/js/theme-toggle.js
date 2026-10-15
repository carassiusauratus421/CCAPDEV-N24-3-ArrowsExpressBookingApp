
const themeToggles = document.querySelectorAll("#themeToggle");

//load selected theme
function updateTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);

    if (isDark) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }

    themeToggles.forEach(function (themeToggle) {
        themeToggle.setAttribute("aria-pressed", isDark);

        const themeIcon = themeToggle.querySelector("i");
        const themeText = themeToggle.querySelector("span");

        if (themeIcon) {
            if (isDark) {
                themeIcon.classList.replace("bi-moon", "bi-sun");
            } else {
                themeIcon.classList.replace("bi-sun", "bi-moon");
            }
        }

        if (themeText) {
            if (isDark) {
                themeText.textContent = "Light Mode";
            } else {
                themeText.textContent = "Dark Mode";
            }
        }
    });
}

//restore saved theme
if (localStorage.getItem("theme") === "dark") {
    updateTheme(true);
} else {
    updateTheme(false);
}

//toggle light/dark mode
themeToggles.forEach(function (themeToggle) {
    themeToggle.addEventListener("click", function () {
        if (document.body.classList.contains("dark-mode")) {
            updateTheme(false);
        } else {
            updateTheme(true);
        }
    });
});
