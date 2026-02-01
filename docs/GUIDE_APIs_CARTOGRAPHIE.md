# Guide Complet : Alternatives Gratuites a Google Maps

Ce guide explique comment remplacer Google Maps par des solutions open source et gratuites pour une application VTC.

---

## Table des Matieres

1. [Vue d'ensemble des alternatives](#1-vue-densemble-des-alternatives)
2. [Geocodage avec Nominatim](#2-geocodage-avec-nominatim)
3. [Calcul d'itineraire avec OpenRouteService](#3-calcul-ditineraire-avec-openrouteservice)
4. [Affichage de carte avec Leaflet](#4-affichage-de-carte-avec-leaflet)
5. [Gestion des quotas et optimisation](#5-gestion-des-quotas-et-optimisation)
6. [Alternatives supplementaires](#6-alternatives-supplementaires)

---

## 1. Vue d'ensemble des alternatives

### Comparaison Google Maps vs Alternatives gratuites

| Fonctionnalite | Google Maps | Alternative Gratuite | Limite |
|----------------|-------------|---------------------|--------|
| Geocodage | Geocoding API | **Nominatim** | 1 req/sec |
| Itineraire | Directions API | **OpenRouteService** | 2,000/jour |
| Distance Matrix | Distance Matrix API | **ORS Matrix** | 2,000/jour |
| Carte interactive | Maps JavaScript API | **Leaflet + OSM** | Illimite |
| Autocomplete | Places API | **Photon** | 1 req/sec |

### Avantages des alternatives

- **Gratuit** : Pas de facturation, pas de carte bancaire
- **Open Source** : Donnees OpenStreetMap, code ouvert
- **RGPD** : Pas de tracking Google
- **Fiable** : Utilise dans des milliers d'applications

---

## 2. Geocodage avec Nominatim

### Qu'est-ce que Nominatim ?

Nominatim est le service de geocodage officiel d'OpenStreetMap. Il convertit :
- **Geocodage** : Adresse → Coordonnees GPS
- **Geocodage inverse** : Coordonnees GPS → Adresse

### Limites d'utilisation

| Regle | Valeur |
|-------|--------|
| Requetes max | 1 par seconde |
| User-Agent | Obligatoire (identifie votre app) |
| Cache | Recommande (24h minimum) |
| Usage commercial | Autorise (respecter les regles) |

### Code JavaScript (Frontend)

```javascript
/**
 * Classe pour interagir avec l'API Nominatim
 * Geocodage gratuit via OpenStreetMap
 */
class NominatimGeocoder {
  constructor(options = {}) {
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.userAgent = options.userAgent || 'RomuoVTC/1.0';
    this.language = options.language || 'fr';
    this.countryLimit = options.countryLimit || ['ch', 'fr', 'de', 'it'];
    this.cache = new Map();
    this.lastRequestTime = 0;
    this.minInterval = 1000; // 1 seconde entre chaque requete
  }

  /**
   * Respecter la limite de 1 requete par seconde
   */
  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - elapsed)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Geocodage : Adresse → Coordonnees
   * @param {string} address - L'adresse a geocoder
   * @returns {Promise<Array>} Liste des resultats
   */
  async geocode(address) {
    // Verifier le cache
    const cacheKey = `geo:${address.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit:', address);
      return this.cache.get(cacheKey);
    }

    await this.throttle();

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: this.countryLimit.join(','),
    });

    try {
      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'Accept-Language': this.language,
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.status}`);
      }

      const results = await response.json();

      // Formater les resultats
      const formatted = results.map(r => ({
        displayName: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        type: r.type,
        importance: r.importance,
        address: {
          road: r.address?.road,
          houseNumber: r.address?.house_number,
          city: r.address?.city || r.address?.town || r.address?.village,
          postcode: r.address?.postcode,
          country: r.address?.country,
          countryCode: r.address?.country_code,
        },
        boundingBox: r.boundingbox?.map(parseFloat),
      }));

      // Mettre en cache (24h)
      this.cache.set(cacheKey, formatted);

      return formatted;

    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Geocodage inverse : Coordonnees → Adresse
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Adresse trouvee
   */
  async reverseGeocode(lat, lng) {
    const cacheKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    await this.throttle();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '18', // Niveau de detail maximum
    });

    try {
      const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
        headers: {
          'Accept-Language': this.language,
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse error: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const formatted = {
        displayName: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: {
          road: result.address?.road,
          houseNumber: result.address?.house_number,
          city: result.address?.city || result.address?.town || result.address?.village,
          postcode: result.address?.postcode,
          canton: result.address?.state,
          country: result.address?.country,
          countryCode: result.address?.country_code,
        },
      };

      this.cache.set(cacheKey, formatted);
      return formatted;

    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Recherche d'adresse avec autocompletion
   * Utilise Photon (plus rapide pour l'autocomplete)
   */
  async autocomplete(query, limit = 5) {
    if (query.length < 3) return [];

    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      lang: this.language,
    });

    try {
      // Photon est optimise pour l'autocomplete
      const response = await fetch(
        `https://photon.komoot.io/api/?${params}`
      );

      if (!response.ok) throw new Error('Photon error');

      const data = await response.json();

      return data.features.map(f => ({
        displayName: this.formatPhotonResult(f),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        type: f.properties.type,
        city: f.properties.city,
        country: f.properties.country,
      }));

    } catch (error) {
      // Fallback vers Nominatim
      console.warn('Photon failed, falling back to Nominatim');
      return this.geocode(query);
    }
  }

  formatPhotonResult(feature) {
    const p = feature.properties;
    const parts = [];

    if (p.name) parts.push(p.name);
    if (p.street) parts.push(p.street);
    if (p.housenumber) parts[parts.length - 1] += ` ${p.housenumber}`;
    if (p.postcode || p.city) {
      parts.push([p.postcode, p.city].filter(Boolean).join(' '));
    }
    if (p.country) parts.push(p.country);

    return parts.join(', ');
  }

  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Exemple d'utilisation
const geocoder = new NominatimGeocoder({
  userAgent: 'RomuoVTC/2.0 (contact@romuo.ch)',
  language: 'fr',
  countryLimit: ['ch', 'fr'],
});

// Geocoder une adresse
async function searchAddress(query) {
  try {
    const results = await geocoder.geocode(query);
    console.log('Resultats:', results);

    if (results.length > 0) {
      const first = results[0];
      console.log(`${first.displayName}`);
      console.log(`Coordonnees: ${first.lat}, ${first.lng}`);
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

// Geocodage inverse (depuis GPS)
async function getAddressFromCoords(lat, lng) {
  try {
    const result = await geocoder.reverseGeocode(lat, lng);
    console.log('Adresse:', result.displayName);
    return result;
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}
```

### Code Node.js (Backend)

```javascript
// geocoder.js - Module de geocodage pour Node.js

/**
 * Service de geocodage Nominatim pour Node.js
 */
class NominatimService {
  constructor() {
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'RomuoVTC-Backend/2.0';
    this.requestQueue = [];
    this.processing = false;
  }

  /**
   * Ajouter une requete a la queue (respect du rate limit)
   */
  async enqueue(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn: requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const { fn, resolve, reject } = this.requestQueue.shift();

      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Attendre 1 seconde entre chaque requete
      if (this.requestQueue.length > 0) {
        await new Promise(r => setTimeout(r, 1100));
      }
    }

    this.processing = false;
  }

  async geocode(address, options = {}) {
    return this.enqueue(async () => {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: options.limit?.toString() || '5',
        countrycodes: options.countries?.join(',') || 'ch,fr,de,it',
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': options.language || 'fr',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const data = await response.json();

      return data.map(item => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        class: item.class,
        importance: item.importance,
        address: item.address,
        boundingBox: item.boundingbox?.map(parseFloat),
      }));
    });
  }

  async reverse(lat, lng, options = {}) {
    return this.enqueue(async () => {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        zoom: options.zoom?.toString() || '18',
      });

      const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': options.language || 'fr',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        displayName: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        address: data.address,
      };
    });
  }
}

export const nominatim = new NominatimService();
```

---

## 3. Calcul d'itineraire avec OpenRouteService

### Obtenir une cle API gratuite

1. Aller sur https://openrouteservice.org/dev/#/signup
2. Creer un compte (email requis)
3. Confirmer l'email
4. Aller dans "Dashboard" → "Request a token"
5. Creer un token "Standard" (gratuit)

### Limites du plan gratuit

| Ressource | Limite |
|-----------|--------|
| Directions | 2,000 req/jour |
| Matrix | 2,000 req/jour |
| Isochrones | 500 req/jour |
| Geocoding | 1,000 req/jour |

### Code Node.js pour le calcul d'itineraire

```javascript
// routing.js - Service de calcul d'itineraire

/**
 * Service OpenRouteService pour le calcul d'itineraires
 */
class OpenRouteService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openrouteservice.org/v2';
    this.requestsToday = 0;
    this.dailyLimit = 2000;
  }

  /**
   * Calculer un itineraire entre deux points
   * @param {Object} origin - {lat, lng}
   * @param {Object} destination - {lat, lng}
   * @param {Object} options - Options supplementaires
   * @returns {Promise<Object>} Itineraire avec distance et duree
   */
  async getRoute(origin, destination, options = {}) {
    // Verifier le quota
    if (this.requestsToday >= this.dailyLimit) {
      throw new Error('Quota journalier OpenRouteService atteint');
    }

    const profile = options.profile || 'driving-car';
    // Profiles disponibles:
    // - driving-car (voiture)
    // - driving-hgv (camion)
    // - cycling-regular (velo)
    // - foot-walking (pieton)

    const body = {
      coordinates: [
        [origin.lng, origin.lat],     // ORS utilise [lng, lat]
        [destination.lng, destination.lat],
      ],
      units: options.units || 'km',
      language: options.language || 'fr',
      instructions: options.instructions !== false,
      geometry: options.geometry !== false,
    };

    // Options avancees
    if (options.avoidTolls) {
      body.options = { avoid_features: ['tollways'] };
    }
    if (options.avoidHighways) {
      body.options = body.options || {};
      body.options.avoid_features = [
        ...(body.options.avoid_features || []),
        'highways',
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/directions/${profile}`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      this.requestsToday++;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `ORS HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('Aucun itineraire trouve');
      }

      const route = data.routes[0];
      const summary = route.summary;

      return {
        // Informations principales
        distance: {
          value: summary.distance,
          unit: 'km',
          text: `${summary.distance.toFixed(1)} km`,
        },
        duration: {
          value: summary.duration,
          minutes: Math.round(summary.duration / 60),
          text: this.formatDuration(summary.duration),
        },

        // Geometrie du trajet (pour affichage sur carte)
        geometry: route.geometry,

        // Instructions de navigation
        steps: route.segments?.[0]?.steps?.map(step => ({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration,
          type: step.type,
          name: step.name,
        })),

        // Bounding box
        bbox: data.bbox,

        // Metadata
        profile,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('ORS Routing error:', error);
      throw error;
    }
  }

  /**
   * Calculer une matrice de distances (plusieurs origines/destinations)
   * @param {Array} locations - Liste de {lat, lng}
   * @param {Object} options
   */
  async getMatrix(locations, options = {}) {
    if (this.requestsToday >= this.dailyLimit) {
      throw new Error('Quota journalier atteint');
    }

    const profile = options.profile || 'driving-car';
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);

    const body = {
      locations: coordinates,
      metrics: ['distance', 'duration'],
      units: 'km',
    };

    // Sources et destinations (optionnel)
    if (options.sources) body.sources = options.sources;
    if (options.destinations) body.destinations = options.destinations;

    try {
      const response = await fetch(`${this.baseUrl}/matrix/${profile}`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      this.requestsToday++;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `ORS HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        distances: data.distances,  // Matrice des distances en km
        durations: data.durations,  // Matrice des durees en secondes
        sources: data.sources,
        destinations: data.destinations,
      };

    } catch (error) {
      console.error('ORS Matrix error:', error);
      throw error;
    }
  }

  /**
   * Calculer une isochrone (zone accessible en X minutes)
   */
  async getIsochrone(center, options = {}) {
    const profile = options.profile || 'driving-car';
    const rangeType = options.rangeType || 'time'; // 'time' ou 'distance'
    const range = options.range || [600]; // 10 minutes par defaut

    const body = {
      locations: [[center.lng, center.lat]],
      range,
      range_type: rangeType,
    };

    try {
      const response = await fetch(`${this.baseUrl}/isochrones/${profile}`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      this.requestsToday++;

      if (!response.ok) {
        throw new Error(`ORS Isochrone HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('ORS Isochrone error:', error);
      throw error;
    }
  }

  /**
   * Formater une duree en texte lisible
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  }

  /**
   * Obtenir le nombre de requetes restantes
   */
  getRemainingRequests() {
    return this.dailyLimit - this.requestsToday;
  }

  /**
   * Reinitialiser le compteur (a appeler chaque jour a minuit)
   */
  resetDailyCounter() {
    this.requestsToday = 0;
  }
}

// Singleton pour l'application
export const ors = new OpenRouteService(
  process.env.ORS_API_KEY || 'VOTRE_CLE_ORS'
);

// Exemple d'utilisation
async function calculateRoute() {
  const origin = { lat: 46.5197, lng: 6.6323 };      // Lausanne
  const destination = { lat: 46.2044, lng: 6.1432 }; // Geneve

  try {
    const route = await ors.getRoute(origin, destination, {
      profile: 'driving-car',
      language: 'fr',
      avoidTolls: false,
    });

    console.log(`Distance: ${route.distance.text}`);
    console.log(`Duree: ${route.duration.text}`);
    console.log(`Requetes restantes: ${ors.getRemainingRequests()}`);

    return route;
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}
```

### Format de reponse ORS

```json
{
  "routes": [{
    "summary": {
      "distance": 62.5,
      "duration": 2847
    },
    "geometry": "encoded_polyline_string",
    "segments": [{
      "distance": 62.5,
      "duration": 2847,
      "steps": [
        {
          "distance": 0.2,
          "duration": 15,
          "type": 11,
          "instruction": "Dirigez-vous vers le sud sur Avenue de la Gare",
          "name": "Avenue de la Gare"
        }
      ]
    }]
  }],
  "bbox": [6.1432, 46.2044, 6.6323, 46.5197]
}
```

---

## 4. Affichage de carte avec Leaflet

### Installation

```html
<!-- CDN -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Code JavaScript complet

```javascript
/**
 * Classe pour gerer l'affichage de carte avec Leaflet
 */
class VTCMap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.markers = new Map();
    this.routeLayer = null;

    // Initialiser la carte
    this.map = L.map(containerId, {
      center: options.center || [46.5197, 6.6323], // Lausanne
      zoom: options.zoom || 12,
      zoomControl: options.zoomControl !== false,
    });

    // Ajouter les tuiles OpenStreetMap
    this.tileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }
    ).addTo(this.map);

    // Style personnalise pour VTC (optionnel)
    // Utiliser CartoDB Dark pour theme sombre
    if (options.darkMode) {
      this.tileLayer.setUrl(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      );
    }

    // Icones personnalisees
    this.icons = {
      origin: L.divIcon({
        className: 'custom-marker origin-marker',
        html: '<div class="marker-pin origin"><i class="fas fa-map-marker-alt"></i></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      }),
      destination: L.divIcon({
        className: 'custom-marker destination-marker',
        html: '<div class="marker-pin destination"><i class="fas fa-flag-checkered"></i></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      }),
      car: L.divIcon({
        className: 'custom-marker car-marker',
        html: '<div class="marker-pin car"><i class="fas fa-car"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    };
  }

  /**
   * Ajouter un marqueur
   */
  addMarker(id, lat, lng, type = 'origin', popup = null) {
    // Supprimer l'ancien marqueur si existe
    if (this.markers.has(id)) {
      this.map.removeLayer(this.markers.get(id));
    }

    const icon = this.icons[type] || this.icons.origin;
    const marker = L.marker([lat, lng], { icon }).addTo(this.map);

    if (popup) {
      marker.bindPopup(popup);
    }

    this.markers.set(id, marker);
    return marker;
  }

  /**
   * Supprimer un marqueur
   */
  removeMarker(id) {
    if (this.markers.has(id)) {
      this.map.removeLayer(this.markers.get(id));
      this.markers.delete(id);
    }
  }

  /**
   * Afficher un itineraire sur la carte
   * @param {string} encodedPolyline - Polyline encodee (format ORS)
   */
  displayRoute(encodedPolyline, options = {}) {
    // Supprimer l'ancien trajet
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    // Decoder la polyline
    const coordinates = this.decodePolyline(encodedPolyline);

    // Creer la ligne
    this.routeLayer = L.polyline(coordinates, {
      color: options.color || '#d4af37',
      weight: options.weight || 5,
      opacity: options.opacity || 0.8,
      smoothFactor: 1,
    }).addTo(this.map);

    // Ajuster la vue pour montrer tout le trajet
    if (options.fitBounds !== false) {
      this.map.fitBounds(this.routeLayer.getBounds(), {
        padding: [50, 50],
      });
    }

    return this.routeLayer;
  }

  /**
   * Afficher un itineraire avec depart et arrivee
   */
  displayFullRoute(origin, destination, encodedPolyline) {
    // Ajouter les marqueurs
    this.addMarker('origin', origin.lat, origin.lng, 'origin',
      `<strong>Depart</strong><br>${origin.address || ''}`
    );
    this.addMarker('destination', destination.lat, destination.lng, 'destination',
      `<strong>Arrivee</strong><br>${destination.address || ''}`
    );

    // Afficher le trajet
    if (encodedPolyline) {
      this.displayRoute(encodedPolyline);
    } else {
      // Si pas de polyline, tracer une ligne simple
      this.routeLayer = L.polyline([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ], {
        color: '#d4af37',
        weight: 3,
        dashArray: '10, 10',
      }).addTo(this.map);

      this.map.fitBounds(this.routeLayer.getBounds(), {
        padding: [50, 50],
      });
    }
  }

  /**
   * Decoder une polyline encodee (format Google/ORS)
   */
  decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  }

  /**
   * Centrer la carte sur des coordonnees
   */
  setView(lat, lng, zoom = null) {
    this.map.setView([lat, lng], zoom || this.map.getZoom());
  }

  /**
   * Nettoyer la carte
   */
  clear() {
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers.clear();

    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
  }

  /**
   * Obtenir la position actuelle de l'utilisateur
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalisation non supportee'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          this.setView(latitude, longitude, 15);
          this.addMarker('currentLocation', latitude, longitude, 'car', 'Vous etes ici');
          resolve({ lat: latitude, lng: longitude });
        },
        error => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}

// CSS pour les marqueurs personnalises
const markerStyles = `
  .custom-marker {
    background: transparent;
    border: none;
  }

  .marker-pin {
    width: 30px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .marker-pin.origin {
    color: #22c55e;
  }

  .marker-pin.destination {
    color: #ef4444;
  }

  .marker-pin.car {
    color: #d4af37;
    background: #1a1a2e;
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
`;

// Injecter les styles
const styleSheet = document.createElement('style');
styleSheet.textContent = markerStyles;
document.head.appendChild(styleSheet);
```

### Exemple d'integration complete

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carte VTC</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    #map { height: 400px; width: 100%; border-radius: 10px; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Initialiser la carte
    const vtcMap = new VTCMap('map', {
      center: [46.5197, 6.6323], // Lausanne
      zoom: 10,
      darkMode: true,
    });

    // Exemple : afficher un trajet Lausanne → Geneve
    const origin = { lat: 46.5197, lng: 6.6323, address: 'Lausanne' };
    const destination = { lat: 46.2044, lng: 6.1432, address: 'Geneve' };

    vtcMap.displayFullRoute(origin, destination);
  </script>
</body>
</html>
```

---

## 5. Gestion des quotas et optimisation

### Strategies de cache

```javascript
/**
 * Cache intelligent pour les APIs de cartographie
 */
class GeoCache {
  constructor(options = {}) {
    this.storage = options.storage || 'memory'; // 'memory', 'localStorage', 'redis'
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 heures
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Generer une cle de cache
   */
  generateKey(type, params) {
    const normalized = JSON.stringify(params, Object.keys(params).sort());
    return `${type}:${this.hashCode(normalized)}`;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Obtenir une valeur du cache
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Verifier l'expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Stocker une valeur
   */
  set(key, value, ttl = null) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.ttl),
      createdAt: Date.now(),
    });
  }

  /**
   * Nettoyer les entrees expirees
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(1) + '%' : '0%',
      size: this.cache.size,
    };
  }
}

// Cache global pour les itineraires
const routeCache = new GeoCache({ ttl: 60 * 60 * 1000 }); // 1 heure

// Wrapper avec cache pour ORS
async function getRouteWithCache(origin, destination, options = {}) {
  const cacheKey = routeCache.generateKey('route', {
    origin: `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`,
    dest: `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`,
    profile: options.profile || 'driving-car',
  });

  // Verifier le cache
  const cached = routeCache.get(cacheKey);
  if (cached) {
    console.log('Route from cache');
    return cached;
  }

  // Appeler l'API
  const route = await ors.getRoute(origin, destination, options);

  // Mettre en cache
  routeCache.set(cacheKey, route);

  return route;
}
```

### Fallback entre APIs

```javascript
/**
 * Service avec fallback automatique entre APIs
 */
class RoutingServiceWithFallback {
  constructor(services) {
    this.services = services; // Liste ordonnee des services
    this.currentServiceIndex = 0;
    this.failureCount = new Map();
    this.maxFailures = 3;
  }

  async getRoute(origin, destination, options = {}) {
    const errors = [];

    for (let i = 0; i < this.services.length; i++) {
      const service = this.services[i];

      // Verifier si le service n'a pas trop echoue
      if ((this.failureCount.get(service.name) || 0) >= this.maxFailures) {
        console.log(`Service ${service.name} desactive (trop d'echecs)`);
        continue;
      }

      try {
        console.log(`Tentative avec ${service.name}...`);
        const result = await service.getRoute(origin, destination, options);

        // Succes : reinitialiser le compteur d'echecs
        this.failureCount.set(service.name, 0);

        return {
          ...result,
          provider: service.name,
        };

      } catch (error) {
        console.error(`${service.name} a echoue:`, error.message);
        errors.push({ service: service.name, error: error.message });

        // Incrementer le compteur d'echecs
        const failures = (this.failureCount.get(service.name) || 0) + 1;
        this.failureCount.set(service.name, failures);
      }
    }

    // Tous les services ont echoue
    throw new Error(`Tous les services ont echoue: ${JSON.stringify(errors)}`);
  }

  /**
   * Reinitialiser les compteurs d'echecs
   */
  resetFailures() {
    this.failureCount.clear();
  }
}

// Configuration avec plusieurs services
const routingService = new RoutingServiceWithFallback([
  {
    name: 'OpenRouteService',
    getRoute: (o, d, opts) => ors.getRoute(o, d, opts),
  },
  {
    name: 'OSRM',
    getRoute: async (o, d, opts) => {
      // OSRM est totalement gratuit et open source
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${o.lng},${o.lat};${d.lng},${d.lat}?overview=full`
      );
      const data = await response.json();

      if (data.code !== 'Ok') throw new Error(data.message);

      return {
        distance: { value: data.routes[0].distance / 1000, unit: 'km' },
        duration: { value: data.routes[0].duration, minutes: Math.round(data.routes[0].duration / 60) },
        geometry: data.routes[0].geometry,
      };
    },
  },
]);
```

### Optimisation des requetes batch

```javascript
/**
 * Regrouper plusieurs requetes en une seule (batch)
 */
class BatchedGeocoder {
  constructor(geocoder, options = {}) {
    this.geocoder = geocoder;
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 100; // ms
    this.queue = [];
    this.processing = false;
  }

  async geocode(address) {
    return new Promise((resolve, reject) => {
      this.queue.push({ address, resolve, reject });
      this.scheduleProcessing();
    });
  }

  scheduleProcessing() {
    if (this.processing) return;

    this.processing = true;

    setTimeout(async () => {
      await this.processBatch();
      this.processing = false;

      // Traiter le prochain batch si necessaire
      if (this.queue.length > 0) {
        this.scheduleProcessing();
      }
    }, this.batchDelay);
  }

  async processBatch() {
    const batch = this.queue.splice(0, this.batchSize);

    for (const item of batch) {
      try {
        const result = await this.geocoder.geocode(item.address);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Respecter le rate limit
      if (batch.indexOf(item) < batch.length - 1) {
        await new Promise(r => setTimeout(r, 1100));
      }
    }
  }
}
```

---

## 6. Alternatives supplementaires

### GraphHopper (gratuit avec limites)

```javascript
// GraphHopper - Alternative a ORS
class GraphHopperService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://graphhopper.com/api/1';
  }

  async getRoute(origin, destination) {
    const params = new URLSearchParams({
      point: `${origin.lat},${origin.lng}`,
      point: `${destination.lat},${destination.lng}`,
      vehicle: 'car',
      locale: 'fr',
      key: this.apiKey,
      points_encoded: 'false',
    });

    const response = await fetch(`${this.baseUrl}/route?${params}`);
    const data = await response.json();

    return {
      distance: data.paths[0].distance / 1000,
      duration: data.paths[0].time / 1000,
      geometry: data.paths[0].points,
    };
  }
}
```

### OSRM (totalement gratuit)

```javascript
// OSRM - Open Source Routing Machine (100% gratuit)
class OSRMService {
  constructor(baseUrl = 'https://router.project-osrm.org') {
    this.baseUrl = baseUrl;
  }

  async getRoute(origin, destination) {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

    const response = await fetch(
      `${this.baseUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );

    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error(data.message || 'OSRM error');
    }

    const route = data.routes[0];

    return {
      distance: {
        value: route.distance / 1000,
        unit: 'km',
      },
      duration: {
        value: route.duration,
        minutes: Math.round(route.duration / 60),
      },
      geometry: route.geometry,
      legs: route.legs,
    };
  }
}

// OSRM est gratuit et sans limite!
const osrm = new OSRMService();
```

### Tableau comparatif des alternatives

| Service | Gratuit | Limite/jour | Cle API | Auto-heberge |
|---------|---------|-------------|---------|--------------|
| **Nominatim** | Oui | 1 req/sec | Non | Oui |
| **OpenRouteService** | Oui | 2,000 | Oui | Oui |
| **OSRM** | Oui | Illimite | Non | Oui |
| **GraphHopper** | Oui | 500 | Oui | Oui |
| **Mapbox** | Freemium | 100,000/mois | Oui | Non |
| **HERE** | Freemium | 250,000/mois | Oui | Non |

---

## Resume

### Stack recommandee pour Romuo VTC

1. **Geocodage** : Nominatim + Photon (autocomplete)
2. **Itineraires** : OpenRouteService (principal) + OSRM (fallback)
3. **Cartes** : Leaflet + tuiles OpenStreetMap

### Avantages

- 100% gratuit
- Pas de carte bancaire requise
- Open source
- Conforme RGPD
- Performant

### Limites a respecter

- Nominatim : 1 requete/seconde
- ORS : 2,000 requetes/jour
- Toujours implementer du cache
- Toujours avoir un fallback

---

*Guide cree pour Romuo VTC - Janvier 2026*
