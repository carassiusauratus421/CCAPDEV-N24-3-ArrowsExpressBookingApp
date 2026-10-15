async function queryShuttles () {
    try {
        const response = await fetch("assets/data/mock-data.json");
        const data = await response.json();

        const vehicles = data.vehicles;

        const shuttleTable = document.getElementById("shuttle-list");
        shuttleTable.innerHTML = "";

        vehicles.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>${item.plate}</td>
                <td></td>
                <td>${item.capacity}</td>
                <td></td>
                <td></td>
                <td></td>
            `;
            shuttleTable.appendChild(tr);
        });

    }
    catch (error) {
        console.error("Error querying data: ", error);
    }
}

async function queryDrivers () {
    try {
        const response = await fetch("assets/data/mock-data.json");
        const data = await response.json();

        const drivers = data.users.filter(item => item.role === "driver");

        const shuttleTable = document.getElementById("driver-list");
        shuttleTable.innerHTML = "";

        drivers.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.firstName} ${item.lastName}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            `;
            shuttleTable.appendChild(tr);
        });

    }
    catch (error) {
        console.error("Error querying data: ", error);
    }
}

queryShuttles();
queryDrivers();