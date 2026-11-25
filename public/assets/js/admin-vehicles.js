const vehicleModal = document.getElementById('admin-vehicle-modal');

vehicleModal.addEventListener('show.bs.modal', function (event) {
    // Button that triggered the modal
    const button = event.relatedTarget;

    // Extract info from data-bs-* attributes
    const vehicle = button.getAttribute('data-bs-vehicle');
    const plate = button.getAttribute('data-bs-plate');
    const model = button.getAttribute('data-bs-model');
    const capacity = button.getAttribute('data-bs-capacity');

    // Populate the form fields inside the modal
    vehicleModal.querySelector('#vehicle-id').value = vehicle;
    vehicleModal.querySelector('#vehicle-plate').value = plate;
    vehicleModal.querySelector('#vehicle-model').value = model;
    vehicleModal.querySelector('#vehicle-capacity').value = capacity;
});

const vehicleDeletionModal = document.getElementById('admin-vehicle-deletion-modal');

vehicleDeletionModal.addEventListener('show.bs.modal', function (event) {
    // Button that triggered the modal
    const button = event.relatedTarget;

    // Extract info from data-bs-* attributes
    const vehicle = button.getAttribute('data-bs-vehicle');
    const plate = button.getAttribute('data-bs-plate');
    const model = button.getAttribute('data-bs-model');
    const capacity = button.getAttribute('data-bs-capacity');

    // Populate the form fields inside the modal
    vehicleDeletionModal.querySelector('#vehicle-deletion-id').value = vehicle;
    vehicleDeletionModal.querySelector('#vehicle-deletion-plate').textContent = plate;
    vehicleDeletionModal.querySelector('#vehicle-deletion-model').textContent = model;
    vehicleDeletionModal.querySelector('#vehicle-deletion-capacity').textContent = capacity;
});