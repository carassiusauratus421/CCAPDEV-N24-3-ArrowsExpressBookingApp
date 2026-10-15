// LOAD JSON DATA
let data = {};
fetch("assets/data/mock-data.json")
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        data = json;

        showVehicles();
        showProfiles();
        showBookings();
        showSlots();
    })
    .catch(function(error) {
        console.log("Error loading data:", error);
        showMessage("Could not load the JSON data.", "danger");
    });

function showMessage(message, type) {
    let messageBox = document.getElementById("message");

    messageBox.className = "alert alert-" + type;
    messageBox.textContent = message;
}


//CONFIRM MODAL
function showConfirm(message, action) {
    document.getElementById("confirmModalMessage").textContent = message;

    let confirmButton = document.getElementById("confirmModalButton");

    // Replace the button to remove its previous click event
    let newButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newButton, confirmButton);

    newButton.addEventListener("click", function() {
        action();

        let modalElement = document.getElementById("confirmModal");
        let modal = bootstrap.Modal.getInstance(modalElement);

        if (modal) {
            modal.hide();
        }
    });

    let modalElement = document.getElementById("confirmModal");
    let modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
}


// VEHICLES
function showVehicles() {
    let table = document.getElementById("vehicle-list");
    table.innerHTML = "";

    data.vehicles.forEach(function(vehicle) {
        table.innerHTML += `
            <tr>
                <td>${vehicle.name}</td>
                <td>${vehicle.plate}</td>
                <td>${vehicle.type}</td>
                <td>${vehicle.capacity}</td>
                <td>
                    <button class="btn btn-sm btn-outline-success"
                        onclick="editVehicle('${vehicle.id}')">
                        Edit
                    </button>

                    <button class="btn btn-sm btn-outline-danger"
                        onclick="deleteVehicle('${vehicle.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    if (data.vehicles.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary">
                    No vehicles found.
                </td>
            </tr>
        `;
    }
}


// ADD OR UPDATE VEHICLE
document.getElementById("vehicle-form").addEventListener("submit", function(event) {
    event.preventDefault();

    let id = document.getElementById("vehicle-id").value;
    let name = document.getElementById("vehicle-name").value;
    let plate = document.getElementById("vehicle-plate").value;
    let type = document.getElementById("vehicle-model").value;
    let capacity = Number(document.getElementById("vehicle-capacity").value);

    if (id === "") {
        let newVehicle = {
            id: "vehicle-" + Date.now(),
            name: name,
            plate: plate,
            type: type,
            capacity: capacity
        };

        data.vehicles.push(newVehicle);

        showMessage("Vehicle added successfully.", "success");
    } else {
        let vehicle = data.vehicles.find(function(vehicle) {
            return vehicle.id === id;
        });

        if (vehicle) {
            vehicle.name = name;
            vehicle.plate = plate;
            vehicle.type = type;
            vehicle.capacity = capacity;
        }

        showMessage("Vehicle updated successfully.", "success");
    }

    showVehicles();

    document.getElementById("vehicle-form").reset();
    document.getElementById("vehicle-id").value = "";
});


// EDIT VEHICLE
function editVehicle(id) {
    let vehicle = data.vehicles.find(function(vehicle) {
        return vehicle.id === id;
    });

    if (vehicle) {
        document.getElementById("vehicle-id").value = vehicle.id;
        document.getElementById("vehicle-name").value = vehicle.name;
        document.getElementById("vehicle-plate").value = vehicle.plate;
        document.getElementById("vehicle-model").value = vehicle.type;
        document.getElementById("vehicle-capacity").value = vehicle.capacity;

        document.getElementById("vehicle-form").scrollIntoView({
            behavior: "smooth"
        });
    }
}


// DELETE VEHICLE
function deleteVehicle(id) {
    showConfirm("Are you sure you want to delete this vehicle?", function() {
        data.vehicles = data.vehicles.filter(function(vehicle) {
            return vehicle.id !== id;
        });

        showVehicles();
        showMessage("Vehicle deleted successfully.", "success");
    });
}


// CLEAR VEHICLE FORM
document.getElementById("vehicle-cancel").addEventListener("click", function() {
    document.getElementById("vehicle-form").reset();
    document.getElementById("vehicle-id").value = "";
});


// PROFILES

function showProfiles() {
    let table = document.getElementById("profile-list");
    table.innerHTML = "";

    data.users.forEach(function(user) {
        let firstName = user.firstName || "";
        let lastName = user.lastName || "";
        let contact = user.contactNumber || user.contact || "";

        table.innerHTML += `
            <tr>
                <td>${user.id}</td>
                <td>${firstName} ${lastName}</td>
                <td>${user.role}</td>
                <td>${user.email}</td>
                <td>${contact}</td>
                <td>
                    <button class="btn btn-sm btn-outline-success"
                        onclick="editProfile('${user.id}')">
                        Edit
                    </button>

                    <button class="btn btn-sm btn-outline-danger"
                        onclick="deleteProfile('${user.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    if (data.users.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary">
                    No profiles found.
                </td>
            </tr>
        `;
    }
}


// ADD OR UPDATE PROFILE

document.getElementById("profile-form").addEventListener("submit", function(event) {
    event.preventDefault();

    let id = document.getElementById("profile-id").value;
    let role = document.getElementById("profile-role").value;
    let firstName = document.getElementById("profile-first-name").value;
    let lastName = document.getElementById("profile-last-name").value;
    let email = document.getElementById("profile-email").value;
    let contact = document.getElementById("profile-contact").value;

    if (id === "") {
        let newUser = {
            id: "user-" + Date.now(),
            role: role,
            firstName: firstName,
            lastName: lastName,
            email: email,
            contactNumber: contact
        };

        data.users.push(newUser);

        // Create a driver record when adding a driver
        if (role === "driver") {
            data.drivers.push({
                id: "driver-" + Date.now(),
                userId: newUser.id,
                driverNumber: "",
                employeeNumber: "",
                verified: false,
                vehicleId: null,
                status: "active",
                updatedAt: null
            });
        }

        showMessage("Profile added successfully.", "success");
    } else {
        let user = data.users.find(function(user) {
            return user.id === id;
        });

        if (user) {
            let oldRole = user.role;

            user.role = role;
            user.firstName = firstName;
            user.lastName = lastName;
            user.email = email;
            user.contactNumber = contact;

            // Create a driver record if the user becomes a driver
            if (role === "driver" && oldRole !== "driver") {
                let driverExists = data.drivers.some(function(driver) {
                    return driver.userId === user.id;
                });

                if (!driverExists) {
                    data.drivers.push({
                        id: "driver-" + Date.now(),
                        userId: user.id,
                        driverNumber: "",
                        employeeNumber: "",
                        verified: false,
                        vehicleId: null,
                        status: "active",
                        updatedAt: null
                    });
                }
            }
        }

        showMessage("Profile updated successfully.", "success");
    }

    showProfiles();

    document.getElementById("profile-form").reset();
    document.getElementById("profile-id").value = "";
});


// EDIT PROFILE

function editProfile(id) {
    let user = data.users.find(function(user) {
        return user.id === id;
    });

    if (user) {
        document.getElementById("profile-id").value = user.id;
        document.getElementById("profile-role").value = user.role;
        document.getElementById("profile-first-name").value = user.firstName || "";
        document.getElementById("profile-last-name").value = user.lastName || "";
        document.getElementById("profile-email").value = user.email || "";
        document.getElementById("profile-contact").value =
            user.contactNumber || user.contact || "";

        document.getElementById("profile-form").scrollIntoView({
            behavior: "smooth"
        });
    }
}


// DELETE PROFILE

function deleteProfile(id) {
    let userHasBooking = data.bookings.some(function(booking) {
        return booking.userId === id;
    });

    if (userHasBooking) {
        showMessage(
            "This user has a booking and cannot be deleted.",
            "warning"
        );
        return;
    }

    let driver = data.drivers.find(function(driver) {
        return driver.userId === id;
    });

    if (driver) {
        let driverHasTrip = data.trips.some(function(trip) {
            return trip.driverId === driver.id;
        });

        if (driverHasTrip) {
            showMessage(
                "This driver is assigned to a trip and cannot be deleted.",
                "warning"
            );
            return;
        }
    }

    showConfirm("Are you sure you want to delete this profile?", function() {
        data.users = data.users.filter(function(user) {
            return user.id !== id;
        });

        // Remove the driver's separate record if one exists
        data.drivers = data.drivers.filter(function(driver) {
            return driver.userId !== id;
        });

        showProfiles();
        showMessage("Profile deleted successfully.", "success");
    });
}


// CLEAR PROFILE FORM

document.getElementById("profile-cancel").addEventListener("click", function() {
    document.getElementById("profile-form").reset();
    document.getElementById("profile-id").value = "";
});


// BOOKINGS

function showBookings() {
    let table = document.getElementById("booking-list");
    table.innerHTML = "";

    data.bookings.forEach(function(booking) {
        // Find the passenger using userId from the JSON
        let user = data.users.find(function(user) {
            return user.id === booking.userId;
        });

        let trip = data.trips.find(function(trip) {
            return trip.id === booking.tripId;
        });

        let passengerName = "Unknown passenger";
        let tripName = "Unknown trip";

        if (user) {
            passengerName = (user.firstName || "") + " " +
                            (user.lastName || "");
        }

        if (trip) {
            let route = data.routes.find(function(route) {
                return route.id === trip.routeId;
            });

            if (route) {
                // Use the route name from the JSON
                tripName = route.name;
            } else {
                tripName = trip.routeId;
            }
        }

        table.innerHTML += `
            <tr>
                <td>${booking.id}</td>
                <td>${passengerName}</td>
                <td>${tripName}</td>
                <td>${booking.status}</td>
                <td>
                    <select class="form-select form-select-sm"
                        onchange="changeBookingStatus('${booking.id}', this.value)">

                        <option value="Confirmed"
                            ${booking.status === "Confirmed" ? "selected" : ""}>
                            Confirmed
                        </option>

                        <option value="On Hold"
                            ${booking.status === "On Hold" ? "selected" : ""}>
                            On Hold
                        </option>

                        <option value="Completed"
                            ${booking.status === "Completed" ? "selected" : ""}>
                            Completed
                        </option>

                        <option value="Cancelled"
                            ${booking.status === "Cancelled" ? "selected" : ""}>
                            Cancelled
                        </option>
                    </select>
                </td>
            </tr>
        `;
    });

    if (data.bookings.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary">
                    No bookings found.
                </td>
            </tr>
        `;
    }
}


// CHANGE BOOKING STATUS

function changeBookingStatus(id, status) {
    let booking = data.bookings.find(function(booking) {
        return booking.id === id;
    });

    if (booking) {
        booking.status = status;

        showBookings();
        showSlots();

        showMessage("Booking status updated.", "success");
    }
}


// TRIP SLOTS

function showSlots() {
    let table = document.getElementById("slot-list");
    table.innerHTML = "";

    data.trips.forEach(function(trip) {
        let route = data.routes.find(function(route) {
            return route.id === trip.routeId;
        });

        let vehicle = data.vehicles.find(function(vehicle) {
            return vehicle.id === trip.vehicleId;
        });

        let routeName = trip.routeId;

        if (route) {
            routeName = route.name;
        }

        let vehicleName = "Not assigned";

        if (vehicle) {
            vehicleName = vehicle.name;
        }

        // Start with reservations already listed for the trip
        let reserved = trip.otherReservations || 0;

        // Add bookings that are not cancelled
        data.bookings.forEach(function(booking) {
            if (booking.tripId === trip.id &&
                booking.status !== "Cancelled") {
                reserved++;
            }
        });

        let capacity = trip.capacity;

        if (!capacity && vehicle) {
            capacity = vehicle.capacity;
        }

        let available = capacity - reserved;

        // Convert departure minutes into a time
        let hours = Math.floor(trip.departureMinutes / 60);
        let minutes = trip.departureMinutes % 60;

        let departure = String(hours).padStart(2, "0") + ":" +
                        String(minutes).padStart(2, "0");

        table.innerHTML += `
            <tr>
                <td>${trip.date}</td>
                <td>${routeName}</td>
                <td>${departure}</td>
                <td>${vehicleName}</td>
                <td>${capacity}</td>
                <td>${reserved}</td>
                <td>${available}</td>
                <td>
                    <button class="btn btn-sm btn-outline-success"
                        onclick="editTripCapacity('${trip.id}')">
                        Edit Capacity
                    </button>
                </td>
            </tr>
        `;
    });

    if (data.trips.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-secondary">
                    No trips found.
                </td>
            </tr>
        `;
    }
}


//trip capacityt
let selectedTripId = null;
function editTripCapacity(id) {
    let trip = data.trips.find(function(trip) {
        return trip.id === id;
    });

    if (trip) {
        selectedTripId = id;

        document.getElementById("newCapacity").value = trip.capacity;

        let modalElement = document.getElementById("capacityModal");
        let modal = bootstrap.Modal.getOrCreateInstance(modalElement);

        modal.show();
    }
}
//save button
document.getElementById("saveCapacity").addEventListener("click", function() {
    let newCapacity = Number(document.getElementById("newCapacity").value);

    if (newCapacity <= 0 || !Number.isInteger(newCapacity)) {
        showMessage("Capacity must be a positive whole number.", "danger");
        return;
    }

    let trip = data.trips.find(function(trip) {
        return trip.id === selectedTripId;
    });

    if (trip) {
        trip.capacity = newCapacity;

        showSlots();
        showMessage("Trip capacity updated.", "success");

        let modalElement = document.getElementById("capacityModal");
        let modal = bootstrap.Modal.getInstance(modalElement);

        if (modal) {
            modal.hide();
        }
    }
});
