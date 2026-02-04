// Initialize map centered on Switzerland
const map = L.map('map').setView([46.8182, 8.2275], 8);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Global variables
let startMarker = null;
let endMarker = null;
let routePolyline = null;
let startCoords = null;
let endCoords = null;

// Autocomplete functionality
function setupAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    let timeout = null;

    input.addEventListener('input', function() {
        clearTimeout(timeout);
        const query = this.value.trim();
        
        if (query.length < 3) {
            suggestions.innerHTML = '';
            return;
        }
        
        timeout = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    suggestions.innerHTML = '';
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.textContent = item.display_name;
                        div.onclick = () => {
                            input.value = item.display_name;
                            suggestions.innerHTML = '';
                            
                            // Save coordinates
                            const coords = [parseFloat(item.lat), parseFloat(item.lon)];
                            
                            if (inputId === 'depart') {
                                startCoords = coords;
                                placeMarker(coords, true);
                            } else {
                                endCoords = coords;
                                placeMarker(coords, false);
                            }
                            
                            // If both points selected, draw route and get price
                            if (startCoords && endCoords) {
                                drawRoute();
                                getPriceEstimate();
                            }
                        };
                        suggestions.appendChild(div);
                    });
                });
        }, 300);
    });

    // Hide suggestions when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!suggestions.contains(e.target) && e.target !== input) {
            suggestions.innerHTML = '';
        }
    });
}

// Place marker on map
function placeMarker(coords, isStart) {
    // Remove existing marker
    if (isStart && startMarker) {
        map.removeLayer(startMarker);
    } else if (!isStart && endMarker) {
        map.removeLayer(endMarker);
    }
    
    // Create new marker
    const marker = L.marker(coords).addTo(map);
    marker.bindPopup(isStart ? 'Départ' : 'Arrivée').openPopup();
    
    if (isStart) {
        startMarker = marker;
    } else {
        endMarker = marker;
    }
}

// Draw route between points
function drawRoute() {
    // Remove existing polyline
    if (routePolyline) {
        map.removeLayer(routePolyline);
    }
    
    // Create new polyline
    routePolyline = L.polyline([startMarker.getLatLng(), endMarker.getLatLng()], {
        color: 'blue',
        weight: 4
    }).addTo(map);
    
    // Adjust map view to show both markers
    const bounds = L.latLngBounds([startMarker.getLatLng(), endMarker.getLatLng()]);
    map.fitBounds(bounds, { padding: [50, 50] });
}

// Get price estimate from backend
function getPriceEstimate() {
    if (!startCoords || !endCoords) return;
    
    const payload = {
        start: { lat: startCoords[0], lng: startCoords[1] },
        end: { lat: endCoords[0], lng: endCoords[1] }
    };
    
    fetch('/api/estimate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('price-display').textContent = `Prix estimé: ${data.price} CHF`;
    })
    .catch(error => {
        console.error('Erreur lors de l\'estimation du prix:', error);
        document.getElementById('price-display').textContent = 'Erreur de calcul du prix';
    });
}

// Initialize autocomplete for both fields
setupAutocomplete('depart', 'depart-suggestions');
setupAutocomplete('arrivee', 'arrivee-suggestions');

// Handle reservation button click
document.getElementById('reserver').addEventListener('click', function() {
    if (!startCoords || !endCoords) {
        alert('Veuillez sélectionner un départ et une arrivée');
        return;
    }
    
    // Here you would implement the actual booking logic
    alert('Réservation effectuée avec succès!');
});