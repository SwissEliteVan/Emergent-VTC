/**
 * VTC Suisse - Swiss Map Integration
 * Leaflet with Swisstopo tiles and geo.admin.ch
 */

class SwissMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = {
      pickup: null,
      dropoff: null,
    };
    this.routeLayer = null;
    this.currentLayer = "swisstopo";

    // Swiss bounds
    this.swissBounds = [
      [45.818, 5.956], // SW
      [47.808, 10.492], // NE
    ];

    // Swiss center (Bern area)
    this.swissCenter = [46.8182, 8.2275];

    // Tile layers
    this.tileLayers = {
      swisstopo: L.tileLayer(
        "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
        {
          attribution:
            '&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
          maxZoom: 18,
          minZoom: 7,
        }
      ),
      satellite: L.tileLayer(
        "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg",
        {
          attribution:
            '&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
          maxZoom: 20,
          minZoom: 7,
        }
      ),
      osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }),
    };

    // Canton boundaries layer (optional)
    this.cantonLayer = null;

    // Custom icons
    this.icons = {
      pickup: L.divIcon({
        className: "custom-marker pickup-marker",
        html: '<div class="marker-pin"><i class="fas fa-circle"></i></div>',
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40],
      }),
      dropoff: L.divIcon({
        className: "custom-marker dropoff-marker",
        html: '<div class="marker-pin"><i class="fas fa-map-marker-alt"></i></div>',
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40],
      }),
      poi: L.divIcon({
        className: "custom-marker poi-marker",
        html: '<div class="marker-pin"><i class="fas fa-star"></i></div>',
        iconSize: [24, 32],
        iconAnchor: [12, 32],
      }),
    };

    this.init();
  }

  /**
   * Initialize map
   */
  init() {
    // Create map
    this.map = L.map(this.containerId, {
      center: this.swissCenter,
      zoom: 8,
      maxBounds: this.swissBounds,
      maxBoundsViscosity: 0.8,
      zoomControl: false,
    });

    // Add default layer
    this.tileLayers.swisstopo.addTo(this.map);

    // Add zoom control (bottom right)
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(this.map);

    // Add scale (metric)
    L.control
      .scale({
        metric: true,
        imperial: false,
        position: "bottomleft",
      })
      .addTo(this.map);

    // Add custom CSS for markers
    this.addMarkerStyles();

    // Bind layer controls
    this.bindLayerControls();

    // Load canton boundaries
    this.loadCantonBoundaries();
  }

  /**
   * Add marker styles
   */
  addMarkerStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .custom-marker {
        background: transparent;
        border: none;
      }
      .marker-pin {
        width: 30px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      .pickup-marker .marker-pin {
        color: #2E7D32;
      }
      .dropoff-marker .marker-pin {
        color: #D52B1E;
      }
      .poi-marker .marker-pin {
        color: #F9A825;
        font-size: 18px;
      }
      .route-line {
        stroke: #D52B1E;
        stroke-width: 4;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Bind layer control buttons
   */
  bindLayerControls() {
    const layersBtn = document.getElementById("btn-layers");
    const layerSelector = document.getElementById("layer-selector");

    if (layersBtn && layerSelector) {
      layersBtn.addEventListener("click", () => {
        layerSelector.classList.toggle("hidden");
      });

      document.querySelectorAll(".layer-option").forEach((option) => {
        option.addEventListener("click", () => {
          const layer = option.dataset.layer;
          this.setLayer(layer);

          // Update active state
          document.querySelectorAll(".layer-option").forEach((opt) => {
            opt.classList.toggle("active", opt.dataset.layer === layer);
          });

          layerSelector.classList.add("hidden");
        });
      });
    }

    // Terrain button
    const terrainBtn = document.getElementById("btn-terrain");
    if (terrainBtn) {
      terrainBtn.addEventListener("click", () => {
        this.setLayer(this.currentLayer === "satellite" ? "swisstopo" : "satellite");
      });
    }

    // Fullscreen button
    const fullscreenBtn = document.getElementById("btn-fullscreen");
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        const container = document.querySelector(".map-container");
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          container.requestFullscreen();
        }
      });
    }
  }

  /**
   * Set tile layer
   */
  setLayer(layerName) {
    if (!this.tileLayers[layerName]) return;

    // Remove current layer
    this.map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        this.map.removeLayer(layer);
      }
    });

    // Add new layer
    this.tileLayers[layerName].addTo(this.map);
    this.currentLayer = layerName;
  }

  /**
   * Load canton boundaries from geo.admin.ch
   */
  async loadCantonBoundaries() {
    try {
      // Canton boundaries WMS layer
      this.cantonLayer = L.tileLayer.wms(
        "https://wms.geo.admin.ch/",
        {
          layers: "ch.swisstopo.swissboundaries3d-kanton-flaeche.fill",
          format: "image/png",
          transparent: true,
          opacity: 0.3,
        }
      );
      // Not added by default, can be toggled
    } catch (error) {
      console.warn("Could not load canton boundaries:", error);
    }
  }

  /**
   * Toggle canton boundaries
   */
  toggleCantonBoundaries(show = true) {
    if (!this.cantonLayer) return;

    if (show) {
      this.cantonLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.cantonLayer);
    }
  }

  /**
   * Set pickup marker
   */
  setPickup(lat, lon, label = "") {
    if (this.markers.pickup) {
      this.map.removeLayer(this.markers.pickup);
    }

    this.markers.pickup = L.marker([lat, lon], {
      icon: this.icons.pickup,
    }).addTo(this.map);

    if (label) {
      this.markers.pickup.bindPopup(`<strong>Départ</strong><br>${label}`);
    }

    this.fitMarkers();
  }

  /**
   * Set dropoff marker
   */
  setDropoff(lat, lon, label = "") {
    if (this.markers.dropoff) {
      this.map.removeLayer(this.markers.dropoff);
    }

    this.markers.dropoff = L.marker([lat, lon], {
      icon: this.icons.dropoff,
    }).addTo(this.map);

    if (label) {
      this.markers.dropoff.bindPopup(`<strong>Arrivée</strong><br>${label}`);
    }

    this.fitMarkers();
  }

  /**
   * Fit map to show all markers
   */
  fitMarkers() {
    const bounds = [];

    if (this.markers.pickup) {
      bounds.push(this.markers.pickup.getLatLng());
    }
    if (this.markers.dropoff) {
      bounds.push(this.markers.dropoff.getLatLng());
    }

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }

  /**
   * Draw route on map
   */
  async drawRoute(pickupCoords, dropoffCoords) {
    // Clear existing route
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    try {
      // Use OpenRouteService for routing
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?start=${pickupCoords[1]},${pickupCoords[0]}&end=${dropoffCoords[1]},${dropoffCoords[0]}`,
        {
          headers: {
            Accept: "application/json, application/geo+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Routing failed");
      }

      const data = await response.json();
      const coordinates = data.features[0].geometry.coordinates;

      // Convert to Leaflet format [lat, lng]
      const latLngs = coordinates.map((coord) => [coord[1], coord[0]]);

      // Draw polyline
      this.routeLayer = L.polyline(latLngs, {
        color: "#D52B1E",
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
      }).addTo(this.map);

      // Extract route info
      const properties = data.features[0].properties;
      const distance = (properties.segments[0].distance / 1000).toFixed(1);
      const duration = Math.round(properties.segments[0].duration / 60);

      // Get elevation data
      const elevation = await this.getElevationProfile(latLngs);

      return {
        distance,
        duration,
        elevation,
        coordinates: latLngs,
      };
    } catch (error) {
      console.error("Routing error:", error);

      // Fallback: draw straight line
      this.routeLayer = L.polyline([pickupCoords, dropoffCoords], {
        color: "#D52B1E",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(this.map);

      // Calculate straight-line distance
      const distance = this.calculateDistance(pickupCoords, dropoffCoords);
      const duration = Math.round((distance / 50) * 60); // Assume 50 km/h average

      return {
        distance: distance.toFixed(1),
        duration,
        elevation: { gain: 0, loss: 0, max: 0 },
        fallback: true,
      };
    }
  }

  /**
   * Get elevation profile
   */
  async getElevationProfile(coordinates) {
    try {
      // Use geo.admin.ch elevation API
      const samplePoints = this.sampleCoordinates(coordinates, 20);
      const elevations = [];

      for (const point of samplePoints) {
        const response = await fetch(
          `https://api3.geo.admin.ch/rest/services/height?easting=${point[1]}&northing=${point[0]}&sr=4326`
        );
        const data = await response.json();
        if (data.height) {
          elevations.push(data.height);
        }
      }

      if (elevations.length === 0) {
        return { gain: 0, loss: 0, max: 0 };
      }

      let gain = 0;
      let loss = 0;
      let max = elevations[0];

      for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1];
        if (diff > 0) gain += diff;
        else loss += Math.abs(diff);
        if (elevations[i] > max) max = elevations[i];
      }

      return {
        gain: Math.round(gain),
        loss: Math.round(loss),
        max: Math.round(max),
        profile: elevations,
      };
    } catch (error) {
      console.warn("Elevation API error:", error);
      return { gain: 0, loss: 0, max: 0 };
    }
  }

  /**
   * Sample coordinates for elevation profile
   */
  sampleCoordinates(coordinates, count) {
    if (coordinates.length <= count) return coordinates;

    const step = Math.floor(coordinates.length / count);
    const sampled = [];

    for (let i = 0; i < coordinates.length; i += step) {
      sampled.push(coordinates[i]);
    }

    return sampled;
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371;
    const dLat = this.toRad(coord2[0] - coord1[0]);
    const dLon = this.toRad(coord2[1] - coord1[1]);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(coord1[0])) *
        Math.cos(this.toRad(coord2[0])) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Clear all markers and route
   */
  clear() {
    if (this.markers.pickup) {
      this.map.removeLayer(this.markers.pickup);
      this.markers.pickup = null;
    }
    if (this.markers.dropoff) {
      this.map.removeLayer(this.markers.dropoff);
      this.markers.dropoff = null;
    }
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }

    // Reset view
    this.map.setView(this.swissCenter, 8);
  }

  /**
   * Get user's current location
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Check if within Switzerland
          if (lat < 45.8 || lat > 47.9 || lon < 5.9 || lon > 10.5) {
            reject(new Error("Location outside Switzerland"));
            return;
          }

          resolve({ lat, lon });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * Center on location
   */
  centerOn(lat, lon, zoom = 14) {
    this.map.setView([lat, lon], zoom);
  }

  /**
   * Add POI markers (airports, stations, hospitals)
   */
  addPOI(type, lat, lon, name) {
    const icon = L.divIcon({
      className: `custom-marker poi-marker poi-${type}`,
      html: `<div class="marker-pin"><i class="fas fa-${
        type === "airport"
          ? "plane"
          : type === "station"
            ? "train"
            : type === "hospital"
              ? "hospital"
              : "star"
      }"></i></div>`,
      iconSize: [24, 32],
      iconAnchor: [12, 32],
    });

    const marker = L.marker([lat, lon], { icon }).addTo(this.map);
    marker.bindPopup(`<strong>${name}</strong>`);

    return marker;
  }
}

// Swiss Points of Interest
const SWISS_POI = {
  airports: [
    { code: "GVA", name: "Aéroport de Genève", lat: 46.2381, lon: 6.1089 },
    { code: "ZRH", name: "Flughafen Zürich", lat: 47.4647, lon: 8.5492 },
    { code: "BSL", name: "EuroAirport Basel", lat: 47.5896, lon: 7.5299 },
    { code: "BRN", name: "Bern Airport", lat: 46.9141, lon: 7.4971 },
    { code: "LUG", name: "Lugano Airport", lat: 46.004, lon: 8.9106 },
  ],
  stations: [
    {
      code: "GVA",
      name: "Gare de Genève-Cornavin",
      lat: 46.2103,
      lon: 6.1423,
    },
    { code: "ZRH", name: "Zürich HB", lat: 47.3783, lon: 8.5403 },
    { code: "BRN", name: "Bern Bahnhof", lat: 46.949, lon: 7.4392 },
    { code: "BSL", name: "Basel SBB", lat: 47.5476, lon: 7.5897 },
    { code: "LSN", name: "Gare de Lausanne", lat: 46.5171, lon: 6.6291 },
  ],
  hospitals: [
    { code: "HUG", name: "HUG - Genève", lat: 46.1934, lon: 6.1496 },
    { code: "CHUV", name: "CHUV - Lausanne", lat: 46.5255, lon: 6.6423 },
    { code: "USB", name: "Universitätsspital Basel", lat: 47.5636, lon: 7.5833 },
    { code: "USZ", name: "Universitätsspital Zürich", lat: 47.3769, lon: 8.5515 },
    { code: "Insel", name: "Inselspital Bern", lat: 46.9472, lon: 7.4256 },
  ],
};

// Canton centers and info
const CANTONS = {
  GE: { name: "Genève", lat: 46.2044, lon: 6.1432, language: "fr" },
  VD: { name: "Vaud", lat: 46.5197, lon: 6.6323, language: "fr" },
  VS: { name: "Valais", lat: 46.2333, lon: 7.35, language: "fr" },
  NE: { name: "Neuchâtel", lat: 46.9899, lon: 6.9293, language: "fr" },
  FR: { name: "Fribourg", lat: 46.8065, lon: 7.1619, language: "fr" },
  JU: { name: "Jura", lat: 47.3667, lon: 7.35, language: "fr" },
  BE: { name: "Bern", lat: 46.948, lon: 7.4474, language: "de" },
  ZH: { name: "Zürich", lat: 47.3769, lon: 8.5417, language: "de" },
  BS: { name: "Basel-Stadt", lat: 47.5596, lon: 7.5886, language: "de" },
  BL: { name: "Basel-Landschaft", lat: 47.4417, lon: 7.7633, language: "de" },
  AG: { name: "Aargau", lat: 47.3887, lon: 8.0456, language: "de" },
  LU: { name: "Luzern", lat: 47.0502, lon: 8.3093, language: "de" },
  SG: { name: "St. Gallen", lat: 47.4245, lon: 9.3767, language: "de" },
  TG: { name: "Thurgau", lat: 47.5532, lon: 9.0746, language: "de" },
  SH: { name: "Schaffhausen", lat: 47.6959, lon: 8.6361, language: "de" },
  ZG: { name: "Zug", lat: 47.1724, lon: 8.5173, language: "de" },
  SZ: { name: "Schwyz", lat: 47.0207, lon: 8.6528, language: "de" },
  UR: { name: "Uri", lat: 46.8802, lon: 8.6441, language: "de" },
  OW: { name: "Obwalden", lat: 46.8986, lon: 8.2457, language: "de" },
  NW: { name: "Nidwalden", lat: 46.9281, lon: 8.3848, language: "de" },
  GL: { name: "Glarus", lat: 47.0411, lon: 9.0679, language: "de" },
  AR: { name: "Appenzell A.Rh.", lat: 47.3665, lon: 9.4, language: "de" },
  AI: { name: "Appenzell I.Rh.", lat: 47.3302, lon: 9.4092, language: "de" },
  GR: { name: "Graubünden", lat: 46.8508, lon: 9.5311, language: "de" },
  SO: { name: "Solothurn", lat: 47.2088, lon: 7.5323, language: "de" },
  TI: { name: "Ticino", lat: 46.0037, lon: 8.9511, language: "it" },
};

// Export
window.SwissMap = SwissMap;
window.SWISS_POI = SWISS_POI;
window.CANTONS = CANTONS;

export { SwissMap, SWISS_POI, CANTONS };
