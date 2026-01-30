(() => {
    'use strict';

    const views = {
        landing: document.getElementById('view-landing'),
        input: document.getElementById('view-input'),
        vehicle: document.getElementById('view-vehicle'),
        tracking: document.getElementById('view-tracking')
    };

    const ctaStart = document.getElementById('cta-start');
    const confirmDestination = document.getElementById('confirm-destination');
    const confirmVehicle = document.getElementById('confirm-vehicle');
    const pickupInput = document.getElementById('pickup-input');
    const destinationInput = document.getElementById('destination-input');
    const vehicleCards = document.querySelectorAll('.vehicle-card');
    const tripPickup = document.getElementById('trip-pickup');
    const tripDestination = document.getElementById('trip-destination');
    const trackingStatus = document.getElementById('tracking-status');
    const driverCard = document.getElementById('driver-card');
    const newRide = document.getElementById('new-ride');

    let selectedVehicle = null;
    let trackingTimer = null;

    const showView = (view) => {
        Object.values(views).forEach((section) => {
            section.classList.remove('view-active');
        });
        view.classList.add('view-active');
    };

    const updateVehicleSelection = (card) => {
        vehicleCards.forEach((item) => item.classList.remove('selected'));
        card.classList.add('selected');
        selectedVehicle = card.dataset.vehicle;
        confirmVehicle.disabled = false;
    };

    const startTracking = () => {
        trackingStatus.classList.remove('hidden');
        driverCard.classList.add('hidden');
        trackingStatus.classList.add('searching');
        if (trackingTimer) {
            clearTimeout(trackingTimer);
        }
        trackingTimer = setTimeout(() => {
            trackingStatus.classList.add('hidden');
            driverCard.classList.remove('hidden');
        }, 2000);
    };

    const updateTripSummary = () => {
        tripPickup.textContent = pickupInput.value || 'Départ Suisse';
        tripDestination.textContent = destinationInput.value || 'Destination Europe';
    };

    ctaStart.addEventListener('click', () => {
        showView(views.input);
    });

    confirmDestination.addEventListener('click', () => {
        if (!destinationInput.value.trim()) {
            destinationInput.focus();
            return;
        }
        updateTripSummary();
        showView(views.vehicle);
    });

    vehicleCards.forEach((card) => {
        card.addEventListener('click', () => updateVehicleSelection(card));
    });

    confirmVehicle.addEventListener('click', () => {
        if (!selectedVehicle) {
            return;
        }
        showView(views.tracking);
        startTracking();
    });

    newRide.addEventListener('click', () => {
        showView(views.input);
        selectedVehicle = null;
        confirmVehicle.disabled = true;
        vehicleCards.forEach((item) => item.classList.remove('selected'));
        destinationInput.value = '';
        updateTripSummary();
    });

    updateTripSummary();
})();
