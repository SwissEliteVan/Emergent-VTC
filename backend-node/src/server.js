/**
 * ================================================================
 * VTC SUISSE - Backend Node.js/Express Intégré
 * ================================================================
 * API REST complète pour service VTC Suisse avec:
 * - Intégration frontend Swiss Design
 * - OpenRouteService pour le calcul des distances
 * - Support multi-devises CHF/EUR
 * - Génération de PDF pour les tickets
 * - Support cantons suisses
 * - Tarification avancée (véhicules, trajets, suppléments)
 * ================================================================
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  sendBookingConfirmation,
  sendBookingCancelled,
  sendDriverAssigned,
  processBookingReminders,
  testEmailConnection,
} from './notifications.js';

// ============================================
// CONFIGURATION
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // Serveur
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // OpenRouteService API
  ORS_API_KEY: process.env.ORS_API_KEY || '',
  ORS_BASE_URL: 'https://api.openrouteservice.org/v2',

  // Nominatim (géocodage)
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
  PHOTON_URL: 'https://photon.komoot.io/api',

  // Devises
  CURRENCY_PRIMARY: 'CHF',
  CURRENCY_SECONDARY: 'EUR',
  VAT_RATE: 0.077, // 7.7% TVA Suisse

  // Tarification par véhicule (CHF)
  PRICING: {
    eco: { base: 6, perKm: 2.20, perMin: 0.40, maxPassengers: 4 },
    berline: { base: 10, perKm: 2.80, perMin: 0.50, maxPassengers: 4 },
    van: { base: 15, perKm: 3.50, perMin: 0.60, maxPassengers: 7 },
    luxe: { base: 25, perKm: 4.50, perMin: 0.80, maxPassengers: 4 },
  },

  // Suppléments
  SURCHARGES: {
    night: 0.20,      // +20% entre 22h et 6h
    weekend: 0.10,    // +10% samedi et dimanche
    airport: 5.00,    // Supplément aéroport fixe
    holiday: 0.25,    // +25% jours fériés
  },

  // Forfaits
  PACKAGES: {
    halfday: { hours: 4, discount: 0.15 },   // Demi-journée: 4h, -15%
    fullday: { hours: 8, discount: 0.25 },   // Journée: 8h, -25%
  },

  // Entreprise
  COMPANY: {
    name: 'VTC Suisse Sàrl',
    address: 'Rue du Lac 1, 1201 Genève, Suisse',
    phone: '+41 22 123 45 67',
    email: 'contact@vtc-suisse.ch',
    website: 'https://vtc-suisse.ch',
    license: 'VTC-CH-2024-001',
    ide: 'CHE-123.456.789',
    vatNumber: 'CHE-123.456.789 TVA',
  },

  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
};

// ============================================
// DONNÉES SUISSES
// ============================================

const CANTONS = {
  GE: { name: 'Genève', nameDe: 'Genf', nameIt: 'Ginevra', language: 'fr', lat: 46.2044, lon: 6.1432 },
  VD: { name: 'Vaud', nameDe: 'Waadt', nameIt: 'Vaud', language: 'fr', lat: 46.5197, lon: 6.6323 },
  VS: { name: 'Valais', nameDe: 'Wallis', nameIt: 'Vallese', language: 'fr', lat: 46.2333, lon: 7.35 },
  NE: { name: 'Neuchâtel', nameDe: 'Neuenburg', nameIt: 'Neuchâtel', language: 'fr', lat: 46.9899, lon: 6.9293 },
  FR: { name: 'Fribourg', nameDe: 'Freiburg', nameIt: 'Friburgo', language: 'fr', lat: 46.8065, lon: 7.1619 },
  JU: { name: 'Jura', nameDe: 'Jura', nameIt: 'Giura', language: 'fr', lat: 47.3667, lon: 7.35 },
  BE: { name: 'Berne', nameDe: 'Bern', nameIt: 'Berna', language: 'de', lat: 46.948, lon: 7.4474 },
  ZH: { name: 'Zurich', nameDe: 'Zürich', nameIt: 'Zurigo', language: 'de', lat: 47.3769, lon: 8.5417 },
  BS: { name: 'Bâle-Ville', nameDe: 'Basel-Stadt', nameIt: 'Basilea Città', language: 'de', lat: 47.5596, lon: 7.5886 },
  BL: { name: 'Bâle-Campagne', nameDe: 'Basel-Landschaft', nameIt: 'Basilea Campagna', language: 'de', lat: 47.4417, lon: 7.7633 },
  AG: { name: 'Argovie', nameDe: 'Aargau', nameIt: 'Argovia', language: 'de', lat: 47.3887, lon: 8.0456 },
  LU: { name: 'Lucerne', nameDe: 'Luzern', nameIt: 'Lucerna', language: 'de', lat: 47.0502, lon: 8.3093 },
  SG: { name: 'Saint-Gall', nameDe: 'St. Gallen', nameIt: 'San Gallo', language: 'de', lat: 47.4245, lon: 9.3767 },
  TG: { name: 'Thurgovie', nameDe: 'Thurgau', nameIt: 'Turgovia', language: 'de', lat: 47.5532, lon: 9.0746 },
  SH: { name: 'Schaffhouse', nameDe: 'Schaffhausen', nameIt: 'Sciaffusa', language: 'de', lat: 47.6959, lon: 8.6361 },
  ZG: { name: 'Zoug', nameDe: 'Zug', nameIt: 'Zugo', language: 'de', lat: 47.1724, lon: 8.5173 },
  SZ: { name: 'Schwytz', nameDe: 'Schwyz', nameIt: 'Svitto', language: 'de', lat: 47.0207, lon: 8.6528 },
  UR: { name: 'Uri', nameDe: 'Uri', nameIt: 'Uri', language: 'de', lat: 46.8802, lon: 8.6441 },
  OW: { name: 'Obwald', nameDe: 'Obwalden', nameIt: 'Obvaldo', language: 'de', lat: 46.8986, lon: 8.2457 },
  NW: { name: 'Nidwald', nameDe: 'Nidwalden', nameIt: 'Nidvaldo', language: 'de', lat: 46.9281, lon: 8.3848 },
  GL: { name: 'Glaris', nameDe: 'Glarus', nameIt: 'Glarona', language: 'de', lat: 47.0411, lon: 9.0679 },
  AR: { name: 'Appenzell RE', nameDe: 'Appenzell Ausserrhoden', nameIt: 'Appenzello Esterno', language: 'de', lat: 47.3665, lon: 9.4 },
  AI: { name: 'Appenzell RI', nameDe: 'Appenzell Innerrhoden', nameIt: 'Appenzello Interno', language: 'de', lat: 47.3302, lon: 9.4092 },
  GR: { name: 'Grisons', nameDe: 'Graubünden', nameIt: 'Grigioni', language: 'de', lat: 46.8508, lon: 9.5311 },
  SO: { name: 'Soleure', nameDe: 'Solothurn', nameIt: 'Soletta', language: 'de', lat: 47.2088, lon: 7.5323 },
  TI: { name: 'Tessin', nameDe: 'Tessin', nameIt: 'Ticino', language: 'it', lat: 46.0037, lon: 8.9511 },
};

const AIRPORTS = {
  GVA: { name: 'Aéroport de Genève', city: 'Genève', canton: 'GE', lat: 46.2381, lon: 6.1089 },
  ZRH: { name: 'Flughafen Zürich', city: 'Zürich', canton: 'ZH', lat: 47.4647, lon: 8.5492 },
  BSL: { name: 'EuroAirport Basel', city: 'Basel', canton: 'BS', lat: 47.5896, lon: 7.5299 },
  BRN: { name: 'Bern Airport', city: 'Bern', canton: 'BE', lat: 46.9141, lon: 7.4971 },
  LUG: { name: 'Lugano Airport', city: 'Lugano', canton: 'TI', lat: 46.004, lon: 8.9106 },
  SIR: { name: 'Sion Airport', city: 'Sion', canton: 'VS', lat: 46.2196, lon: 7.3267 },
};

const STATIONS = {
  GVA: { name: 'Gare de Genève-Cornavin', city: 'Genève', canton: 'GE', lat: 46.2103, lon: 6.1423 },
  ZRH: { name: 'Zürich HB', city: 'Zürich', canton: 'ZH', lat: 47.3783, lon: 8.5403 },
  BRN: { name: 'Bern Bahnhof', city: 'Bern', canton: 'BE', lat: 46.949, lon: 7.4392 },
  BSL: { name: 'Basel SBB', city: 'Basel', canton: 'BS', lat: 47.5476, lon: 7.5897 },
  LSN: { name: 'Gare de Lausanne', city: 'Lausanne', canton: 'VD', lat: 46.5171, lon: 6.6291 },
};

// Jours fériés suisses 2024-2025
const SWISS_HOLIDAYS = [
  '2024-01-01', '2024-01-02', '2024-08-01', '2024-12-25', '2024-12-26',
  '2025-01-01', '2025-01-02', '2025-08-01', '2025-12-25', '2025-12-26',
];

// ============================================
// LOGGER
// ============================================

const logger = {
  _format(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({ timestamp, level, message, ...data });
  },
  debug(msg, data) { if (config.NODE_ENV !== 'production') console.log(this._format('DEBUG', msg, data)); },
  info(msg, data) { console.log(this._format('INFO', msg, data)); },
  warn(msg, data) { console.warn(this._format('WARN', msg, data)); },
  error(msg, data) { console.error(this._format('ERROR', msg, data)); },
};

// ============================================
// STOCKAGE EN MÉMOIRE
// ============================================

const reservations = new Map();
const estimates = new Map();

// Cache taux de change
let exchangeRateCache = {
  rate: 0.95,
  lastUpdate: null,
};

// ============================================
// APPLICATION EXPRESS
// ============================================

const app = express();

// --- Sécurité avec Helmet ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://*.openstreetmap.org", "https://wmts.geo.admin.ch", "https://upload.wikimedia.org"],
      connectSrc: ["'self'", "https://api.openrouteservice.org", "https://nominatim.openstreetmap.org", "https://photon.komoot.io", "https://api.frankfurter.app", "https://router.project-osrm.org", "https://api3.geo.admin.ch"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// --- CORS ---
app.use(cors({
  origin: config.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  credentials: true,
}));

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Trop de requêtes. Veuillez patienter.', code: 'RATE_LIMIT' },
});

app.use('/api/', limiter);

// --- Body Parser ---
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Fichiers statiques (Frontend Swiss Design) ---
const frontendDir = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendDir));

// --- Logging ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });
  next();
});

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Réponse d'erreur standardisée
 */
function errorResponse(res, statusCode, message, code = 'ERROR', details = null) {
  const response = { success: false, error: message, code, timestamp: new Date().toISOString() };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
}

/**
 * Réponse de succès standardisée
 */
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, timestamp: new Date().toISOString() });
}

/**
 * Récupérer le taux de change CHF/EUR
 */
async function getExchangeRate() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (exchangeRateCache.lastUpdate && (now - exchangeRateCache.lastUpdate) < oneHour) {
    return exchangeRateCache.rate;
  }

  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=CHF&to=EUR');
    const data = await response.json();
    exchangeRateCache = { rate: data.rates.EUR, lastUpdate: now };
    return data.rates.EUR;
  } catch (error) {
    logger.warn('Exchange rate fetch failed', { error: error.message });
    return exchangeRateCache.rate || 0.95;
  }
}

/**
 * Calculer la route via OpenRouteService ou OSRM (fallback)
 */
async function getRoute(originLat, originLon, destLat, destLon) {
  // Essayer OpenRouteService d'abord
  if (config.ORS_API_KEY) {
    try {
      const response = await fetch(`${config.ORS_BASE_URL}/directions/driving-car`, {
        method: 'POST',
        headers: {
          'Authorization': config.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [[originLon, originLat], [destLon, destLat]],
          units: 'km',
          language: 'fr',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const route = data.routes[0].summary;
        return {
          distanceKm: parseFloat(route.distance.toFixed(2)),
          durationMin: Math.round(route.duration / 60),
          source: 'openrouteservice',
        };
      }
    } catch (error) {
      logger.warn('ORS routing failed', { error: error.message });
    }
  }

  // Fallback vers OSRM
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`
    );
    const data = await response.json();

    if (data.code === 'Ok' && data.routes.length > 0) {
      return {
        distanceKm: parseFloat((data.routes[0].distance / 1000).toFixed(2)),
        durationMin: Math.round(data.routes[0].duration / 60),
        source: 'osrm',
      };
    }
  } catch (error) {
    logger.warn('OSRM routing failed', { error: error.message });
  }

  // Fallback: calcul à vol d'oiseau
  const distance = haversineDistance(originLat, originLon, destLat, destLon);
  return {
    distanceKm: parseFloat((distance * 1.3).toFixed(2)), // Facteur de correction
    durationMin: Math.round((distance * 1.3 / 50) * 60), // 50 km/h moyen
    source: 'estimate',
  };
}

/**
 * Distance Haversine
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Vérifier si c'est un jour férié
 */
function isSwissHoliday(date) {
  const dateStr = date.toISOString().split('T')[0];
  return SWISS_HOLIDAYS.includes(dateStr);
}

/**
 * Vérifier si c'est une destination aéroport
 */
function isAirportDestination(lat, lon) {
  for (const airport of Object.values(AIRPORTS)) {
    const distance = haversineDistance(lat, lon, airport.lat, airport.lon);
    if (distance < 2) return true; // Dans un rayon de 2km
  }
  return false;
}

/**
 * Calculer le prix complet
 */
function calculatePrice(params) {
  const {
    distanceKm,
    durationMin,
    vehicleType = 'berline',
    tripType = 'oneway',
    pickupTime,
    pickupLat,
    pickupLon,
    dropoffLat,
    dropoffLon,
  } = params;

  const tariff = config.PRICING[vehicleType] || config.PRICING.berline;
  const pickupDate = pickupTime ? new Date(pickupTime) : new Date();

  // Prix de base
  let baseFare = tariff.base;
  let distanceFare = distanceKm * tariff.perKm;
  let timeFare = durationMin * tariff.perMin;

  // Forfait demi-journée
  if (tripType === 'halfday') {
    const packageRate = config.PACKAGES.halfday;
    baseFare = tariff.base * 15; // Équivalent ~60km
    distanceFare = 0;
    timeFare = 0;
  }

  // Aller-retour: réduction sur distance
  if (tripType === 'roundtrip') {
    distanceFare *= 1.8; // 2x avec 10% réduction
    timeFare *= 1.8;
  }

  // Suppléments
  let nightSurcharge = 0;
  let weekendSurcharge = 0;
  let holidaySurcharge = 0;
  let airportSurcharge = 0;

  const hour = pickupDate.getHours();
  const day = pickupDate.getDay();

  // Nuit (22h - 6h)
  if (hour >= 22 || hour < 6) {
    nightSurcharge = (baseFare + distanceFare + timeFare) * config.SURCHARGES.night;
  }

  // Week-end
  if (day === 0 || day === 6) {
    weekendSurcharge = (baseFare + distanceFare + timeFare) * config.SURCHARGES.weekend;
  }

  // Jour férié
  if (isSwissHoliday(pickupDate)) {
    holidaySurcharge = (baseFare + distanceFare + timeFare) * config.SURCHARGES.holiday;
  }

  // Aéroport
  if ((pickupLat && pickupLon && isAirportDestination(pickupLat, pickupLon)) ||
      (dropoffLat && dropoffLon && isAirportDestination(dropoffLat, dropoffLon))) {
    airportSurcharge = config.SURCHARGES.airport;
  }

  // Totaux
  const subtotalHT = baseFare + distanceFare + timeFare + nightSurcharge + weekendSurcharge + holidaySurcharge + airportSurcharge;
  const vat = subtotalHT * config.VAT_RATE;
  const totalTTC = subtotalHT + vat;

  return {
    currency: config.CURRENCY_PRIMARY,
    vehicleType,
    tripType,
    breakdown: {
      baseFare: round(baseFare),
      distanceFare: round(distanceFare),
      timeFare: round(timeFare),
      nightSurcharge: round(nightSurcharge),
      weekendSurcharge: round(weekendSurcharge),
      holidaySurcharge: round(holidaySurcharge),
      airportSurcharge: round(airportSurcharge),
    },
    subtotalHT: round(subtotalHT),
    vatRate: config.VAT_RATE,
    vatAmount: round(vat),
    totalTTC: round(totalTTC),
    hasNightSurcharge: nightSurcharge > 0,
    hasWeekendSurcharge: weekendSurcharge > 0,
    hasHolidaySurcharge: holidaySurcharge > 0,
    hasAirportSurcharge: airportSurcharge > 0,
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Formater le prix en CHF
 */
function formatCHF(amount) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(amount);
}

/**
 * Générer un ID de réservation
 */
function generateReservationId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VTC-${year}${month}-${random}`;
}

// ============================================
// ROUTES API
// ============================================

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  successResponse(res, {
    status: 'healthy',
    service: 'VTC Suisse API',
    version: '3.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/config - Configuration publique
 */
app.get('/api/config', async (req, res) => {
  const exchangeRate = await getExchangeRate();

  successResponse(res, {
    company: config.COMPANY,
    pricing: config.PRICING,
    surcharges: config.SURCHARGES,
    packages: config.PACKAGES,
    vatRate: config.VAT_RATE,
    currencies: {
      primary: config.CURRENCY_PRIMARY,
      secondary: config.CURRENCY_SECONDARY,
      exchangeRate,
    },
    vehicleTypes: Object.keys(config.PRICING),
    tripTypes: ['oneway', 'roundtrip', 'halfday'],
  });
});

/**
 * GET /api/cantons - Liste des cantons suisses
 */
app.get('/api/cantons', (req, res) => {
  successResponse(res, CANTONS);
});

/**
 * GET /api/poi - Points d'intérêt (aéroports, gares)
 */
app.get('/api/poi', (req, res) => {
  const { type, canton } = req.query;

  let result = {
    airports: AIRPORTS,
    stations: STATIONS,
  };

  if (type === 'airports') {
    result = { airports: AIRPORTS };
  } else if (type === 'stations') {
    result = { stations: STATIONS };
  }

  if (canton) {
    if (result.airports) {
      result.airports = Object.fromEntries(
        Object.entries(AIRPORTS).filter(([, a]) => a.canton === canton)
      );
    }
    if (result.stations) {
      result.stations = Object.fromEntries(
        Object.entries(STATIONS).filter(([, s]) => s.canton === canton)
      );
    }
  }

  successResponse(res, result);
});

/**
 * GET /api/exchange-rate - Taux de change actuel
 */
app.get('/api/exchange-rate', async (req, res) => {
  const rate = await getExchangeRate();
  successResponse(res, {
    from: 'CHF',
    to: 'EUR',
    rate,
    lastUpdate: exchangeRateCache.lastUpdate,
  });
});

/**
 * POST /api/geocode - Géocodage d'adresse
 */
app.post('/api/geocode', [
  body('address').trim().notEmpty().withMessage('Adresse requise'),
  body('limit').optional().isInt({ min: 1, max: 10 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Données invalides', 'VALIDATION_ERROR', errors.array());
  }

  const { address, limit = 5 } = req.body;

  try {
    // Utiliser Photon pour de meilleurs résultats suisses
    const response = await fetch(
      `${config.PHOTON_URL}?q=${encodeURIComponent(address)}&limit=${limit}&lang=fr&bbox=5.9,45.8,10.5,47.9`
    );
    const data = await response.json();

    const results = data.features.map(f => ({
      display: [f.properties.name, f.properties.street, f.properties.postcode, f.properties.city]
        .filter(Boolean).join(', '),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      type: f.properties.type,
      city: f.properties.city,
      postcode: f.properties.postcode,
    }));

    successResponse(res, results);
  } catch (error) {
    logger.error('Geocoding error', { error: error.message });
    errorResponse(res, 502, 'Service de géocodage indisponible', 'GEOCODE_ERROR');
  }
});

/**
 * POST /api/route - Calculer un itinéraire
 */
app.post('/api/route', [
  body('origin').isObject(),
  body('origin.lat').isFloat({ min: 45.8, max: 47.9 }),
  body('origin.lon').isFloat({ min: 5.9, max: 10.5 }),
  body('destination').isObject(),
  body('destination.lat').isFloat({ min: 45.8, max: 47.9 }),
  body('destination.lon').isFloat({ min: 5.9, max: 10.5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Coordonnées invalides', 'VALIDATION_ERROR', errors.array());
  }

  const { origin, destination } = req.body;

  try {
    const route = await getRoute(origin.lat, origin.lon, destination.lat, destination.lon);
    successResponse(res, route);
  } catch (error) {
    logger.error('Routing error', { error: error.message });
    errorResponse(res, 502, 'Service de routage indisponible', 'ROUTE_ERROR');
  }
});

/**
 * POST /api/estimate - Calculer une estimation de prix
 */
app.post('/api/estimate', [
  body('origin').isObject(),
  body('origin.lat').isFloat({ min: 45.8, max: 47.9 }),
  body('origin.lon').isFloat({ min: 5.9, max: 10.5 }),
  body('destination').isObject(),
  body('destination.lat').isFloat({ min: 45.8, max: 47.9 }),
  body('destination.lon').isFloat({ min: 5.9, max: 10.5 }),
  body('pickupTime').optional().isISO8601(),
  body('vehicleType').optional().isIn(['eco', 'berline', 'van', 'luxe']),
  body('tripType').optional().isIn(['oneway', 'roundtrip', 'halfday']),
  body('passengers').optional().isInt({ min: 1, max: 7 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Données invalides', 'VALIDATION_ERROR', errors.array());
  }

  const {
    origin,
    destination,
    pickupTime,
    vehicleType = 'berline',
    tripType = 'oneway',
    passengers = 1,
  } = req.body;

  try {
    // Calculer la route
    const route = await getRoute(origin.lat, origin.lon, destination.lat, destination.lon);

    // Calculer le prix
    const price = calculatePrice({
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      vehicleType,
      tripType,
      pickupTime,
      pickupLat: origin.lat,
      pickupLon: origin.lon,
      dropoffLat: destination.lat,
      dropoffLon: destination.lon,
    });

    // Sauvegarder l'estimation
    const estimateId = uuidv4();
    const estimate = {
      id: estimateId,
      origin,
      destination,
      route,
      price,
      vehicleType,
      tripType,
      passengers,
      pickupTime,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
    estimates.set(estimateId, estimate);

    // Ajouter le prix en EUR
    const exchangeRate = await getExchangeRate();
    price.totalEUR = round(price.totalTTC * exchangeRate);
    price.exchangeRate = exchangeRate;

    logger.info('Estimate created', { estimateId, total: price.totalTTC });

    successResponse(res, {
      estimateId,
      ...estimate,
      price,
    });
  } catch (error) {
    logger.error('Estimate error', { error: error.message });
    errorResponse(res, 500, 'Erreur lors du calcul', 'ESTIMATE_ERROR');
  }
});

/**
 * POST /api/book - Créer une réservation
 */
app.post('/api/book', strictLimiter, [
  body('customer').isObject(),
  body('customer.name').trim().notEmpty(),
  body('customer.phone').trim().notEmpty(),
  body('customer.email').isEmail(),
  body('origin').isObject(),
  body('origin.lat').isFloat(),
  body('origin.lon').isFloat(),
  body('origin.address').trim().notEmpty(),
  body('destination').isObject(),
  body('destination.lat').isFloat(),
  body('destination.lon').isFloat(),
  body('destination.address').trim().notEmpty(),
  body('pickupTime').isISO8601(),
  body('vehicleType').optional().isIn(['eco', 'berline', 'van', 'luxe']),
  body('tripType').optional().isIn(['oneway', 'roundtrip', 'halfday']),
  body('passengers').optional().isInt({ min: 1, max: 7 }),
  body('paymentMethod').optional().isIn(['twint', 'card', 'invoice', 'cash']),
  body('notes').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Données invalides', 'VALIDATION_ERROR', errors.array());
  }

  const {
    estimateId,
    customer,
    origin,
    destination,
    pickupTime,
    vehicleType = 'berline',
    tripType = 'oneway',
    passengers = 1,
    paymentMethod = 'cash',
    notes,
  } = req.body;

  try {
    // Récupérer ou calculer le prix
    let route, price;

    if (estimateId && estimates.has(estimateId)) {
      const estimate = estimates.get(estimateId);
      route = estimate.route;
      price = estimate.price;
    } else {
      route = await getRoute(origin.lat, origin.lon, destination.lat, destination.lon);
      price = calculatePrice({
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        vehicleType,
        tripType,
        pickupTime,
        pickupLat: origin.lat,
        pickupLon: origin.lon,
        dropoffLat: destination.lat,
        dropoffLon: destination.lon,
      });
    }

    // Créer la réservation
    const reservationId = generateReservationId();
    const booking = {
      id: reservationId,
      status: 'confirmed',
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.toLowerCase().trim(),
      },
      origin,
      destination,
      pickupTime,
      vehicleType,
      tripType,
      passengers,
      paymentMethod,
      route,
      price,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
    };

    reservations.set(reservationId, booking);

    logger.info('Booking created', { reservationId, customer: customer.name, total: price.totalTTC });

    // Send confirmation notification (async, don't wait)
    sendBookingConfirmation(booking).catch(err => {
      logger.warn('Failed to send booking confirmation', { error: err.message });
    });

    // Ajouter EUR
    const exchangeRate = await getExchangeRate();
    price.totalEUR = round(price.totalTTC * exchangeRate);

    successResponse(res, {
      reservationId,
      status: 'confirmed',
      message: 'Réservation confirmée avec succès',
      booking: {
        ...booking,
        price: { ...price, totalEUR: price.totalEUR },
        ticketUrl: `/api/ticket/${reservationId}`,
      },
      company: config.COMPANY,
    }, 201);
  } catch (error) {
    logger.error('Booking error', { error: error.message });
    errorResponse(res, 500, 'Erreur lors de la réservation', 'BOOKING_ERROR');
  }
});

/**
 * GET /api/booking/:id - Récupérer une réservation
 */
app.get('/api/booking/:id', [
  param('id').notEmpty(),
], (req, res) => {
  const booking = reservations.get(req.params.id);

  if (!booking) {
    return errorResponse(res, 404, 'Réservation introuvable', 'NOT_FOUND');
  }

  successResponse(res, booking);
});

/**
 * GET /api/ticket/:id - Télécharger le ticket PDF
 */
app.get('/api/ticket/:id', async (req, res) => {
  const booking = reservations.get(req.params.id);

  if (!booking) {
    return errorResponse(res, 404, 'Réservation introuvable', 'NOT_FOUND');
  }

  try {
    // Importer dynamiquement le générateur PDF
    const { generateTicketPDF } = await import('./ticketPdf.js');

    const pdfBuffer = await generateTicketPDF({
      reservationId: booking.id,
      company: config.COMPANY,
      customer: booking.customer,
      pickupTime: booking.pickupTime,
      pickupAddress: booking.origin.address,
      dropoffAddress: booking.destination.address,
      price: booking.price,
      options: {
        country: 'CH',
        currency: 'CHF',
        vehicleType: booking.vehicleType,
        passengers: booking.passengers,
      },
      saveToDisk: false,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vtc-suisse-${booking.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('PDF generation error', { error: error.message });

    // Fallback: renvoyer les données JSON
    successResponse(res, {
      message: 'PDF non disponible, voici les détails de votre réservation',
      booking,
    });
  }
});

/**
 * POST /api/twint/generate - Générer les données QR TWINT
 */
app.post('/api/twint/generate', [
  body('reservationId').notEmpty(),
  body('amount').isFloat({ min: 0 }),
], (req, res) => {
  const { reservationId, amount } = req.body;

  // Données pour QR TWINT (format simplifié pour démo)
  const twintData = {
    type: 'TWINT_PAYMENT',
    merchantId: 'VTC-SUISSE',
    merchantName: config.COMPANY.name,
    amount: round(amount),
    currency: 'CHF',
    reference: reservationId,
    message: `Course VTC ${reservationId}`,
    // En production: ajouter signature cryptographique
  };

  successResponse(res, {
    qrData: JSON.stringify(twintData),
    amount: formatCHF(amount),
    reference: reservationId,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });
});

// ============================================
// ADMIN API ROUTES
// ============================================

/**
 * GET /api/admin/statistics - Dashboard statistics
 */
app.get('/api/admin/statistics', (req, res) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Calculate stats from reservations
  let todayReservations = 0;
  let todayRevenue = 0;
  let weekRevenue = 0;
  let totalRevenue = 0;
  let pendingCount = 0;
  let completedCount = 0;
  const statusCounts = { pending: 0, confirmed: 0, assigned: 0, started: 0, completed: 0, cancelled: 0 };
  const vehicleCounts = { eco: 0, berline: 0, van: 0, luxe: 0 };

  for (const booking of reservations.values()) {
    const bookingDate = new Date(booking.createdAt);
    const price = booking.price?.totalTTC || 0;

    totalRevenue += price;
    statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
    vehicleCounts[booking.vehicleType] = (vehicleCounts[booking.vehicleType] || 0) + 1;

    if (booking.createdAt.startsWith(today)) {
      todayReservations++;
      todayRevenue += price;
    }

    if (bookingDate >= weekAgo) {
      weekRevenue += price;
    }

    if (booking.status === 'pending') pendingCount++;
    if (booking.status === 'completed') completedCount++;
  }

  successResponse(res, {
    today: {
      reservations: todayReservations,
      revenue: round(todayRevenue),
      distance: Math.floor(todayReservations * 15), // Approximation
    },
    week: {
      reservations: reservations.size,
      revenue: round(weekRevenue),
    },
    total: {
      reservations: reservations.size,
      revenue: round(totalRevenue),
    },
    pending: pendingCount,
    completed: completedCount,
    drivers: { available: 5, busy: 2, offline: 1 }, // Mock for now
    statusDistribution: [
      statusCounts.completed,
      statusCounts.started + statusCounts.assigned,
      statusCounts.pending + statusCounts.confirmed,
      statusCounts.cancelled,
    ],
    vehicleDistribution: vehicleCounts,
    weeklyRevenue: [
      round(weekRevenue * 0.12),
      round(weekRevenue * 0.15),
      round(weekRevenue * 0.13),
      round(weekRevenue * 0.16),
      round(weekRevenue * 0.14),
      round(weekRevenue * 0.18),
      round(weekRevenue * 0.12),
    ],
  });
});

/**
 * GET /api/admin/reservations - List all reservations
 */
app.get('/api/admin/reservations', (req, res) => {
  const { status, vehicle, page = 1, limit = 20, date_from, date_to } = req.query;

  let results = Array.from(reservations.values());

  // Filter by status
  if (status && status !== 'all') {
    const statuses = status.split(',');
    results = results.filter(r => statuses.includes(r.status));
  }

  // Filter by vehicle type
  if (vehicle) {
    results = results.filter(r => r.vehicleType === vehicle);
  }

  // Filter by date range
  if (date_from) {
    results = results.filter(r => r.createdAt >= date_from);
  }
  if (date_to) {
    results = results.filter(r => r.createdAt <= date_to + 'T23:59:59');
  }

  // Sort by creation date (newest first)
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Format for admin view
  const formattedResults = results.map(r => ({
    id: r.id,
    customer_name: r.customer?.name,
    customer_email: r.customer?.email,
    customer_phone: r.customer?.phone,
    pickup_address: r.origin?.address,
    dropoff_address: r.destination?.address,
    pickup_datetime: r.pickupTime,
    vehicle_type: r.vehicleType,
    passengers: r.passengers,
    luggage: r.luggage || 0,
    distance_km: r.route?.distanceKm,
    duration_min: r.route?.durationMin,
    total_price: r.price?.totalTTC,
    payment_method: r.paymentMethod,
    status: r.status,
    notes: r.notes,
    created_at: r.createdAt,
  }));

  // Pagination
  const startIdx = (parseInt(page) - 1) * parseInt(limit);
  const paginatedResults = formattedResults.slice(startIdx, startIdx + parseInt(limit));

  successResponse(res, {
    reservations: paginatedResults,
    total: results.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(results.length / parseInt(limit)),
  });
});

/**
 * PUT /api/admin/reservations/:id/status - Update reservation status
 */
app.put('/api/admin/reservations/:id/status', [
  param('id').notEmpty(),
  body('status').isIn(['pending', 'confirmed', 'assigned', 'started', 'completed', 'cancelled']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Données invalides', 'VALIDATION_ERROR', errors.array());
  }

  const booking = reservations.get(req.params.id);
  if (!booking) {
    return errorResponse(res, 404, 'Réservation introuvable', 'NOT_FOUND');
  }

  const previousStatus = booking.status;
  booking.status = req.body.status;
  booking.updatedAt = new Date().toISOString();

  if (req.body.status === 'completed') {
    booking.completedAt = new Date().toISOString();
  } else if (req.body.status === 'cancelled') {
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = req.body.reason || null;

    // Send cancellation notification
    sendBookingCancelled(booking, req.body.reason).catch(err => {
      logger.warn('Failed to send cancellation notification', { error: err.message });
    });
  } else if (req.body.status === 'assigned' && previousStatus !== 'assigned') {
    // If driver info is provided, send driver assigned notification
    if (req.body.driver) {
      booking.driver = req.body.driver;
      sendDriverAssigned(booking, req.body.driver).catch(err => {
        logger.warn('Failed to send driver assigned notification', { error: err.message });
      });
    }
  }

  reservations.set(req.params.id, booking);

  logger.info('Reservation status updated', { id: req.params.id, status: req.body.status });

  successResponse(res, { id: req.params.id, status: booking.status });
});

/**
 * GET /api/admin/drivers - List all drivers (mock data for now)
 */
app.get('/api/admin/drivers', (req, res) => {
  // In production, this would come from the database
  const drivers = [
    { id: 'drv_001', name: 'Marc Favre', phone: '+41 79 123 45 67', email: 'marc.favre@vtc-suisse.ch', license_number: 'GE123456', vehicle_model: 'Mercedes Classe E', vehicle_plate: 'GE 123456', status: 'available', rating: 4.8, trips_count: 245, total_distance: 8500, total_revenue: 42000 },
    { id: 'drv_002', name: 'Luca Rossi', phone: '+41 79 234 56 78', email: 'luca.rossi@vtc-suisse.ch', license_number: 'VD234567', vehicle_model: 'BMW Série 5', vehicle_plate: 'VD 234567', status: 'busy', rating: 4.9, trips_count: 312, total_distance: 11200, total_revenue: 55800 },
    { id: 'drv_003', name: 'Hans Keller', phone: '+41 79 345 67 89', email: 'hans.keller@vtc-suisse.ch', license_number: 'ZH345678', vehicle_model: 'Tesla Model S', vehicle_plate: 'ZH 345678', status: 'available', rating: 4.7, trips_count: 189, total_distance: 6800, total_revenue: 33500 },
    { id: 'drv_004', name: 'Ahmed Ben Ali', phone: '+41 79 456 78 90', email: 'ahmed.benali@vtc-suisse.ch', license_number: 'GE456789', vehicle_model: 'Mercedes Classe V', vehicle_plate: 'GE 456789', status: 'available', rating: 4.6, trips_count: 156, total_distance: 5400, total_revenue: 28000 },
    { id: 'drv_005', name: 'Paolo Bianchi', phone: '+41 79 567 89 01', email: 'paolo.bianchi@vtc-suisse.ch', license_number: 'TI567890', vehicle_model: 'Audi A6', vehicle_plate: 'TI 567890', status: 'offline', rating: 4.5, trips_count: 98, total_distance: 3200, total_revenue: 15600 },
  ];

  successResponse(res, drivers);
});

/**
 * POST /api/admin/drivers - Create a new driver
 */
app.post('/api/admin/drivers', [
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('email').isEmail(),
  body('license_number').trim().notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Données invalides', 'VALIDATION_ERROR', errors.array());
  }

  const driver = {
    id: `drv_${Date.now()}`,
    ...req.body,
    status: 'offline',
    rating: 5.0,
    trips_count: 0,
    total_distance: 0,
    total_revenue: 0,
    created_at: new Date().toISOString(),
  };

  // In production, save to database
  logger.info('Driver created', { id: driver.id, name: driver.name });

  successResponse(res, driver, 201);
});

/**
 * PUT /api/admin/drivers/:id - Update a driver
 */
app.put('/api/admin/drivers/:id', (req, res) => {
  // In production, update in database
  const driver = {
    id: req.params.id,
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  logger.info('Driver updated', { id: driver.id });

  successResponse(res, driver);
});

/**
 * GET /api/admin/customers - List all customers (from reservations)
 */
app.get('/api/admin/customers', (req, res) => {
  const customerMap = new Map();

  for (const booking of reservations.values()) {
    if (!booking.customer?.email) continue;

    const email = booking.customer.email;
    if (customerMap.has(email)) {
      const existing = customerMap.get(email);
      existing.reservations_count++;
      existing.total_spent += booking.price?.totalTTC || 0;
      if (booking.createdAt > existing.last_reservation) {
        existing.last_reservation = booking.createdAt;
      }
    } else {
      customerMap.set(email, {
        id: `cust_${Date.now()}_${customerMap.size}`,
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone,
        preferred_canton: booking.origin?.address?.match(/\b([A-Z]{2})\b/)?.[1] || null,
        reservations_count: 1,
        total_spent: booking.price?.totalTTC || 0,
        last_reservation: booking.createdAt,
      });
    }
  }

  const customers = Array.from(customerMap.values());
  customers.sort((a, b) => b.total_spent - a.total_spent);

  successResponse(res, customers);
});

/**
 * GET /api/admin/notifications/test - Test notification configuration
 */
app.get('/api/admin/notifications/test', async (req, res) => {
  const emailTest = await testEmailConnection();

  successResponse(res, {
    email: {
      configured: !!process.env.EMAIL_USER,
      status: emailTest.success ? 'connected' : 'not available',
      error: emailTest.error || null,
    },
    sms: {
      configured: process.env.SMS_ENABLED === 'true',
      status: process.env.SMS_ENABLED === 'true' ? 'configured' : 'disabled',
    },
  });
});

/**
 * POST /api/admin/notifications/send-test - Send a test notification
 */
app.post('/api/admin/notifications/send-test', [
  body('email').isEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Email invalide', 'VALIDATION_ERROR', errors.array());
  }

  // Create a mock booking for testing
  const testBooking = {
    id: 'TEST-' + Date.now(),
    customer: { name: 'Test Client', email: req.body.email, phone: '+41 79 000 00 00' },
    origin: { address: 'Gare de Genève, Genève' },
    destination: { address: 'Aéroport de Genève, Cointrin' },
    pickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    vehicleType: 'berline',
    tripType: 'oneway',
    passengers: 2,
    paymentMethod: 'card',
    price: { totalTTC: 85.00, vatAmount: 6.08 },
  };

  try {
    const result = await sendBookingConfirmation(testBooking);
    successResponse(res, {
      message: 'Test notification envoyée',
      result,
    });
  } catch (error) {
    errorResponse(res, 500, 'Erreur lors de l\'envoi', 'NOTIFICATION_ERROR', error.message);
  }
});

/**
 * GET /api/admin/payments - List all payments
 */
app.get('/api/admin/payments', (req, res) => {
  const payments = [];

  for (const booking of reservations.values()) {
    if (booking.price?.totalTTC) {
      payments.push({
        id: `pay_${booking.id}`,
        reservation_id: booking.id,
        customer_name: booking.customer?.name,
        amount: booking.price.totalTTC,
        method: booking.paymentMethod || 'cash',
        status: booking.status === 'completed' ? 'completed' : 'pending',
        created_at: booking.createdAt,
      });
    }
  }

  payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  successResponse(res, payments);
});

// ============================================
// ROUTES FRONTEND (SPA)
// ============================================

// Servir l'admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendDir, 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'admin', 'index.html'));
});

// Servir le frontend pour toutes les routes non-API
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// ============================================
// GESTION DES ERREURS
// ============================================

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  errorResponse(res, 500, 'Erreur interne du serveur', 'INTERNAL_ERROR');
});

// ============================================
// DÉMARRAGE
// ============================================

app.listen(config.PORT, () => {
  logger.info('Server started', { port: config.PORT, env: config.NODE_ENV });

  // Start reminder scheduler (every hour)
  setInterval(() => {
    processBookingReminders(reservations).catch(err => {
      logger.error('Reminder processing failed', { error: err.message });
    });
  }, 60 * 60 * 1000); // Every hour

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    VTC SUISSE API v3.0                     ║
╠════════════════════════════════════════════════════════════╣
║  Frontend:  http://localhost:${config.PORT}                      ║
║  API:       http://localhost:${config.PORT}/api                  ║
║  Health:    http://localhost:${config.PORT}/api/health           ║
╠════════════════════════════════════════════════════════════╣
║  Env:       ${config.NODE_ENV.padEnd(44)}║
║  ORS:       ${config.ORS_API_KEY ? 'Configuré'.padEnd(44) : 'Non configuré (OSRM fallback)'.padEnd(44)}║
╚════════════════════════════════════════════════════════════╝

Endpoints API:
  GET  /api/health        - Health check
  GET  /api/config        - Configuration publique
  GET  /api/cantons       - Liste des cantons
  GET  /api/poi           - Points d'intérêt (aéroports, gares)
  GET  /api/exchange-rate - Taux CHF/EUR
  POST /api/geocode       - Géocodage d'adresse
  POST /api/route         - Calcul d'itinéraire
  POST /api/estimate      - Estimation de prix
  POST /api/book          - Créer une réservation
  GET  /api/booking/:id   - Récupérer une réservation
  GET  /api/ticket/:id    - Télécharger le PDF
  POST /api/twint/generate - Générer QR TWINT
`);
});

export default app;
