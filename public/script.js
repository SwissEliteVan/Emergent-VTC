// Configuration
const MAP_CENTER = [46.2044, 6.1432]; // Genève
const MINIMUM_PRICE = 25.00; // CHF

// Initialize map
const map = L.map('map').setView(MAP_CENTER, 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Map markers
let startMarker = null;
let endMarker = null;

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

// Geocode using Nominatim
const geocodeAddress = async (query) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ch`);
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
};

// Update autocomplete suggestions
const updateAutocomplete = async (inputId) => {
    const input = document.getElementById(inputId);
    const query = input.value;
    
    if (query.length < 3) return;
    
    const result = await geocodeAddress(query);
    if (result) {
        input.setAttribute('data-lat', result.lat);
        input.setAttribute('data-lon', result.lon);
        
        // Update map marker
        const coords = [parseFloat(result.lat), parseFloat(result.lon)];
        
        if (inputId === 'start') {
            if (startMarker) map.removeLayer(startMarker);
            startMarker = L.marker(coords, {icon: L.divIcon({className: 'start-marker', html: '🟢'})}).addTo(map);
        } else {
            if (endMarker) map.removeLayer(endMarker);
            endMarker = L.marker(coords, {icon: L.divIcon({className: 'end-marker', html: '🔴'})}).addTo(map);
        }
        
        // Fit map to markers
        if (startMarker && endMarker) {
            const bounds = L.latLngBounds([
                startMarker.getLatLng(),
                endMarker.getLatLng()
            ]);
            map.fitBounds(bounds);
        }
    }
};

// Calculate price
const calculatePrice = async () => {
    const startLat = document.getElementById('start').getAttribute('data-lat');
    const startLon = document.getElementById('start').getAttribute('data-lon');
    const endLat = document.getElementById('end').getAttribute('data-lat');
    const endLon = document.getElementById('end').getAttribute('data-lon');
    
    if (!startLat || !startLon || !endLat || !endLon) {
        alert('Veuillez sélectionner des adresses valides');
        return;
    }
    
    try {
        const response = await fetch('/api/estimate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                startLat: parseFloat(startLat),
                startLon: parseFloat(startLon),
                endLat: parseFloat(endLat),
                endLon: parseFloat(endLon)
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message);
        }
        
        document.getElementById('distance').textContent = data.distance_km;
        document.getElementById('duration').textContent = data.duration_min;
        document.getElementById('price').textContent = data.price_chf;
    } catch (error) {
        console.error('Calculation error:', error);
        alert('Erreur lors du calcul du prix: ' + error.message);
    }
};

// Setup event listeners
document.getElementById('start').addEventListener('input', debounce(() => updateAutocomplete('start'), 500));
document.getElementById('end').addEventListener('input', debounce(() => updateAutocomplete('end'), 500));
document.getElementById('calculate').addEventListener('click', calculatePrice);

// Initialize map view
map.setView(MAP_CENTER, 13);