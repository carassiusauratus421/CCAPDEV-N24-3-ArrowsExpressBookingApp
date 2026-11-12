/* ========================================================
   PASSENGER IDENTITY
   ======================================================== */

// Display values from the authenticated MySQL passenger.

function setPassengerText(selector, value) {
    document.querySelectorAll(selector).forEach(function (element) {
        element.textContent = value;
    });
}

async function loadPassengerIdentity() {
    try {
        const response = await fetch("api/me.php", {
            cache: "no-store",
            credentials: "same-origin"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to load passenger identity."
            );
        }

        const passenger = data.passenger;

        if (!passenger) {
            throw new Error("Passenger information is missing.");
        }

        const firstName = passenger.first_name || "";
        const lastName = passenger.last_name || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");

        // Update names in navigation and page headers.
        setPassengerText("[data-passenger-name]", fullName);
        setPassengerText(".dashboard-account .fw-semibold", fullName);

        // Update the Profile page summary.
        setPassengerText("#profile-header-name", fullName);
        setPassengerText("#profile-summary-name", fullName);
        setPassengerText("#profile-summary-email", passenger.email || "");
        setPassengerText("#profile-summary-id", passenger.id_number || "");
        setPassengerText("#profile-summary-type", "Passenger");

        // Update fields that are already supplied by MySQL.
        const fields = {
            "first-name": firstName,
            "last-name": lastName,
            "profile-email": passenger.email || "",
            "id-number": passenger.id_number || ""
        };

        Object.keys(fields).forEach(function (id) {
            const input = document.getElementById(id);
            if (input) {
                input.value = fields[id];
            }
        });

    } catch (error) {
        console.error("Passenger identity error:", error);
        setPassengerText("[data-passenger-name]", "Unavailable");
        setPassengerText(".dashboard-account .fw-semibold", "Unavailable");
    }
}

// Initialize passenger identity.
loadPassengerIdentity();
