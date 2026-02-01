/**
 * ================================================================
 * ROMUO VTC - Serveur Backend Node.js/Express
 * ================================================================
 * API REST pour service VTC avec:
 * - OpenRouteService pour le calcul des distances (gratuit)
 * - Generation de PDF pour les tickets
 * - Securite (Helmet, CORS, Rate Limiting)
 * - Logs structures (Pino)
 * ================================================================
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ============================================
// CONFIGURATION
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variables d'environnement (avec valeurs par defaut)
const config = {
  // Serveur
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // OpenRouteService API (gratuit sur openrouteservice.org)
  ORS_API_KEY: process.env.ORS_API_KEY || 'VOTRE_CLE_ORS',
  ORS_BASE_URL: 'https://api.openrouteservice.org/v2',

  // Tarification VTC (CHF pour la Suisse)
  PRICE_BASE: parseFloat(process.env.PRICE_BASE) || 7.00,        // Prise en charge
  PRICE_PER_KM: parseFloat(process.env.PRICE_PER_KM) || 1.80,    // Par kilometre
  PRICE_PER_MIN: parseFloat(process.env.PRICE_PER_MIN) || 0.50,  // Par minute
  CURRENCY: process.env.CURRENCY || 'CHF',

  // Supplement nuit (22h-6h)
  NIGHT_SURCHARGE: 1.20,  // +20%
  NIGHT_START: 22,
  NIGHT_END: 6,

  // Entreprise
  COMPANY_NAME: process.env.COMPANY_NAME || 'Romuo VTC',
  COMPANY_ADDRESS: process.env.COMPANY_ADDRESS || 'Rue du Lac 15, 1003 Lausanne, Suisse',
  COMPANY_PHONE: process.env.COMPANY_PHONE || '+41 21 123 45 67',
  COMPANY_EMAIL: process.env.COMPANY_EMAIL || 'contact@romuo.ch',
  COMPANY_LICENSE: process.env.COMPANY_LICENSE || 'VTC-CH-2024-001',
  COMPANY_TVA: process.env.COMPANY_TVA || 'CHE-123.456.789 TVA',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

// ============================================
// LOGGER STRUCTURE (Pino-like simple)
// ============================================

const LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const currentLevel = config.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

const logger = {
  _format(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const log = { timestamp, level, message, ...data };
    return JSON.stringify(log);
  },
  debug(msg, data) { if (currentLevel <= LogLevel.DEBUG) console.log(this._format('DEBUG', msg, data)); },
  info(msg, data) { if (currentLevel <= LogLevel.INFO) console.log(this._format('INFO', msg, data)); },
  warn(msg, data) { if (currentLevel <= LogLevel.WARN) console.warn(this._format('WARN', msg, data)); },
  error(msg, data) { if (currentLevel <= LogLevel.ERROR) console.error(this._format('ERROR', msg, data)); },
};

// ============================================
// STOCKAGE EN MEMOIRE (Remplacer par DB en prod)
// ============================================

const reservations = new Map();
const estimates = new Map();

// ============================================
// APPLICATION EXPRESS
// ============================================

const app = express();

// --- Securite avec Helmet ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.openrouteservice.org"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// --- CORS ---
app.use(cors({
  origin: config.CORS_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requetes par fenetre
  message: {
    success: false,
    error: 'Trop de requetes. Veuillez reessayer dans 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requetes par minute pour les endpoints sensibles
  message: {
    success: false,
    error: 'Trop de requetes. Veuillez patienter.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
});

app.use('/api/', limiter);

// --- Body Parser ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Fichiers statiques ---
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// --- Logging des requetes ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Appel a l'API OpenRouteService pour calculer la distance et duree
 * @param {number} originLat - Latitude depart
 * @param {number} originLng - Longitude depart
 * @param {number} destLat - Latitude arrivee
 * @param {number} destLng - Longitude arrivee
 * @returns {Promise<{distanceKm: number, durationMin: number}>}
 */
async function getRouteFromORS(originLat, originLng, destLat, destLng) {
  const url = `${config.ORS_BASE_URL}/directions/driving-car`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': config.ORS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [originLng, originLat],  // ORS utilise [lng, lat]
        [destLng, destLat]
      ],
      units: 'km',
      language: 'fr',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('ORS API Error', { status: response.status, error: errorText });
    throw new Error(`Erreur OpenRouteService: ${response.status}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('Aucun itineraire trouve');
  }

  const route = data.routes[0].summary;

  return {
    distanceKm: parseFloat((route.distance).toFixed(2)),
    durationMin: parseFloat((route.duration / 60).toFixed(1)),
  };
}

/**
 * Calcule le prix VTC selon la formule
 * @param {number} distanceKm - Distance en km
 * @param {number} durationMin - Duree en minutes
 * @param {Date} pickupTime - Heure de prise en charge (optionnel)
 * @returns {Object} Details du prix
 */
function calculatePrice(distanceKm, durationMin, pickupTime = null) {
  const baseFare = config.PRICE_BASE;
  const distanceFare = distanceKm * config.PRICE_PER_KM;
  const timeFare = durationMin * config.PRICE_PER_MIN;

  let subtotal = baseFare + distanceFare + timeFare;
  let nightSurcharge = 0;
  let isNightRate = false;

  // Verification supplement nuit
  if (pickupTime) {
    const hour = new Date(pickupTime).getHours();
    if (hour >= config.NIGHT_START || hour < config.NIGHT_END) {
      isNightRate = true;
      nightSurcharge = subtotal * (config.NIGHT_SURCHARGE - 1);
    }
  }

  const total = subtotal + nightSurcharge;

  return {
    baseFare: parseFloat(baseFare.toFixed(2)),
    distanceFare: parseFloat(distanceFare.toFixed(2)),
    timeFare: parseFloat(timeFare.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    nightSurcharge: parseFloat(nightSurcharge.toFixed(2)),
    isNightRate,
    total: parseFloat(total.toFixed(2)),
    currency: config.CURRENCY,
    breakdown: {
      priseEnCharge: `${baseFare.toFixed(2)} ${config.CURRENCY}`,
      distance: `${distanceKm} km x ${config.PRICE_PER_KM} = ${distanceFare.toFixed(2)} ${config.CURRENCY}`,
      duree: `${durationMin} min x ${config.PRICE_PER_MIN} = ${timeFare.toFixed(2)} ${config.CURRENCY}`,
    }
  };
}

/**
 * Validation des coordonnees GPS
 */
function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

/**
 * Genere une reponse d'erreur standardisee
 */
function errorResponse(res, statusCode, message, code = 'ERROR', details = null) {
  const response = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
}

/**
 * Genere une reponse de succes standardisee
 */
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// ROUTES
// ============================================

/**
 * GET / - Page d'accueil avec formulaire HTML
 */
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Romuo VTC - Estimation de Course</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      color: #fff;
    }
    .container {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      border: 1px solid rgba(255,255,255,0.1);
    }
    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 2rem;
      background: linear-gradient(90deg, #d4af37, #f4e5b5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { text-align: center; color: #888; margin-bottom: 30px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: #ccc; font-weight: 500; }
    .coord-group { display: flex; gap: 10px; }
    .coord-group input { flex: 1; }
    input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 10px;
      background: rgba(255,255,255,0.05);
      color: #fff;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input:focus { outline: none; border-color: #d4af37; }
    input::placeholder { color: #666; }
    button {
      width: 100%;
      padding: 16px;
      background: linear-gradient(90deg, #d4af37, #b8962e);
      border: none;
      border-radius: 10px;
      color: #1a1a2e;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(212,175,55,0.3); }
    button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .result {
      margin-top: 30px;
      padding: 20px;
      background: rgba(212,175,55,0.1);
      border-radius: 15px;
      border: 1px solid rgba(212,175,55,0.3);
      display: none;
    }
    .result.show { display: block; animation: fadeIn 0.5s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .result h3 { color: #d4af37; margin-bottom: 15px; }
    .result-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .result-row:last-child { border-bottom: none; }
    .result-row .label { color: #888; }
    .result-row .value { color: #fff; font-weight: 500; }
    .total { font-size: 1.5rem; color: #d4af37; margin-top: 15px; text-align: center; }
    .error { color: #ff6b6b; background: rgba(255,107,107,0.1); padding: 15px; border-radius: 10px; margin-top: 20px; display: none; }
    .error.show { display: block; }
    .examples { margin-top: 20px; font-size: 0.85rem; color: #666; }
    .examples strong { color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Romuo VTC</h1>
    <p class="subtitle">Estimation de votre course en Suisse</p>

    <form id="estimateForm">
      <div class="form-group">
        <label>Depart (Coordonnees GPS)</label>
        <div class="coord-group">
          <input type="number" step="any" id="originLat" placeholder="Latitude" required>
          <input type="number" step="any" id="originLng" placeholder="Longitude" required>
        </div>
      </div>

      <div class="form-group">
        <label>Arrivee (Coordonnees GPS)</label>
        <div class="coord-group">
          <input type="number" step="any" id="destLat" placeholder="Latitude" required>
          <input type="number" step="any" id="destLng" placeholder="Longitude" required>
        </div>
      </div>

      <div class="form-group">
        <label>Date et heure de prise en charge (optionnel)</label>
        <input type="datetime-local" id="pickupTime">
      </div>

      <button type="submit" id="submitBtn">Calculer le prix</button>
    </form>

    <div class="result" id="result">
      <h3>Estimation de votre course</h3>
      <div class="result-row"><span class="label">Distance</span><span class="value" id="resDistance">-</span></div>
      <div class="result-row"><span class="label">Duree estimee</span><span class="value" id="resDuration">-</span></div>
      <div class="result-row"><span class="label">Prise en charge</span><span class="value" id="resBase">-</span></div>
      <div class="result-row"><span class="label">Distance</span><span class="value" id="resDistPrice">-</span></div>
      <div class="result-row"><span class="label">Temps</span><span class="value" id="resTimePrice">-</span></div>
      <div class="result-row" id="nightRow" style="display:none"><span class="label">Supplement nuit</span><span class="value" id="resNight">-</span></div>
      <div class="total">Total: <span id="resTotal">-</span></div>
    </div>

    <div class="error" id="error"></div>

    <div class="examples">
      <strong>Exemples de coordonnees:</strong><br>
      Geneve: 46.2044, 6.1432<br>
      Lausanne: 46.5197, 6.6323<br>
      Aeroport GVA: 46.2381, 6.1089
    </div>
  </div>

  <script>
    document.getElementById('estimateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const result = document.getElementById('result');
      const error = document.getElementById('error');

      btn.disabled = true;
      btn.textContent = 'Calcul en cours...';
      result.classList.remove('show');
      error.classList.remove('show');

      try {
        const response = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: {
              lat: parseFloat(document.getElementById('originLat').value),
              lng: parseFloat(document.getElementById('originLng').value)
            },
            destination: {
              lat: parseFloat(document.getElementById('destLat').value),
              lng: parseFloat(document.getElementById('destLng').value)
            },
            pickupTime: document.getElementById('pickupTime').value || null
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erreur inconnue');
        }

        const d = data.data;
        document.getElementById('resDistance').textContent = d.distanceKm + ' km';
        document.getElementById('resDuration').textContent = d.durationMin + ' min';
        document.getElementById('resBase').textContent = d.price.baseFare + ' ' + d.price.currency;
        document.getElementById('resDistPrice').textContent = d.price.distanceFare + ' ' + d.price.currency;
        document.getElementById('resTimePrice').textContent = d.price.timeFare + ' ' + d.price.currency;

        if (d.price.isNightRate) {
          document.getElementById('nightRow').style.display = 'flex';
          document.getElementById('resNight').textContent = '+' + d.price.nightSurcharge + ' ' + d.price.currency;
        } else {
          document.getElementById('nightRow').style.display = 'none';
        }

        document.getElementById('resTotal').textContent = d.price.total + ' ' + d.price.currency;
        result.classList.add('show');

      } catch (err) {
        error.textContent = err.message;
        error.classList.add('show');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Calculer le prix';
      }
    });
  </script>
</body>
</html>
  `);
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  successResponse(res, {
    status: 'healthy',
    service: 'Romuo VTC API',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/estimate - Calcule une estimation de prix
 * Body: { origin: {lat, lng}, destination: {lat, lng}, pickupTime?: string }
 */
app.post('/api/estimate', [
  body('origin').isObject().withMessage('Origin doit etre un objet'),
  body('origin.lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude origin invalide'),
  body('origin.lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude origin invalide'),
  body('destination').isObject().withMessage('Destination doit etre un objet'),
  body('destination.lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude destination invalide'),
  body('destination.lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude destination invalide'),
  body('pickupTime').optional().isISO8601().withMessage('Format de date invalide'),
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Donnees invalides', 'VALIDATION_ERROR', errors.array());
    }

    const { origin, destination, pickupTime } = req.body;

    logger.debug('Estimate request', { origin, destination, pickupTime });

    // Appel OpenRouteService
    const route = await getRouteFromORS(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );

    // Calcul du prix
    const price = calculatePrice(route.distanceKm, route.durationMin, pickupTime);

    // Sauvegarder l'estimation
    const estimateId = uuidv4();
    estimates.set(estimateId, {
      id: estimateId,
      origin,
      destination,
      ...route,
      price,
      pickupTime,
      createdAt: new Date().toISOString(),
    });

    logger.info('Estimate calculated', { estimateId, distanceKm: route.distanceKm, total: price.total });

    successResponse(res, {
      estimateId,
      origin,
      destination,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      price,
      pickupTime,
      validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Valide 30 min
    });

  } catch (error) {
    logger.error('Estimate error', { error: error.message });

    if (error.message.includes('OpenRouteService')) {
      return errorResponse(res, 502, 'Service de calcul d\'itineraire indisponible', 'ORS_ERROR');
    }

    return errorResponse(res, 500, 'Erreur lors du calcul de l\'estimation', 'INTERNAL_ERROR');
  }
});

/**
 * POST /api/book - Creer une reservation
 * Body: { estimateId?, customer: {name, phone, email}, origin, destination, pickupTime, ... }
 */
app.post('/api/book', strictLimiter, [
  body('customer').isObject().withMessage('Informations client requises'),
  body('customer.name').trim().notEmpty().withMessage('Nom du client requis'),
  body('customer.phone').trim().notEmpty().withMessage('Telephone requis'),
  body('customer.email').isEmail().withMessage('Email invalide'),
  body('pickupTime').isISO8601().withMessage('Date de prise en charge requise'),
  body('origin').isObject().withMessage('Adresse de depart requise'),
  body('destination').isObject().withMessage('Adresse d\'arrivee requise'),
  body('passengers').optional().isInt({ min: 1, max: 8 }).withMessage('Nombre de passagers invalide'),
  body('vehicleType').optional().isIn(['eco', 'berline', 'van', 'bus']).withMessage('Type de vehicule invalide'),
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Donnees de reservation invalides', 'VALIDATION_ERROR', errors.array());
    }

    const {
      estimateId,
      customer,
      origin,
      destination,
      pickupTime,
      passengers = 1,
      vehicleType = 'berline',
      notes,
    } = req.body;

    // Recuperer l'estimation si fournie
    let estimate = null;
    if (estimateId && estimates.has(estimateId)) {
      estimate = estimates.get(estimateId);
    }

    // Calculer le prix si pas d'estimation
    let route, price;
    if (estimate) {
      route = { distanceKm: estimate.distanceKm, durationMin: estimate.durationMin };
      price = estimate.price;
    } else {
      route = await getRouteFromORS(origin.lat, origin.lng, destination.lat, destination.lng);
      price = calculatePrice(route.distanceKm, route.durationMin, pickupTime);
    }

    // Creer la reservation
    const bookingId = uuidv4();
    const booking = {
      id: bookingId,
      status: 'confirmed',
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.toLowerCase().trim(),
      },
      origin,
      destination,
      pickupTime,
      passengers,
      vehicleType,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      price,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
    };

    reservations.set(bookingId, booking);

    logger.info('Booking created', { bookingId, customer: customer.name, total: price.total });

    successResponse(res, {
      bookingId,
      status: 'confirmed',
      message: 'Reservation confirmee avec succes',
      booking: {
        ...booking,
        ticketUrl: `/api/ticket/${bookingId}`,
      },
    }, 201);

  } catch (error) {
    logger.error('Booking error', { error: error.message });
    return errorResponse(res, 500, 'Erreur lors de la reservation', 'BOOKING_ERROR');
  }
});

/**
 * GET /api/booking/:id - Recuperer une reservation
 */
app.get('/api/booking/:id', (req, res) => {
  const booking = reservations.get(req.params.id);

  if (!booking) {
    return errorResponse(res, 404, 'Reservation introuvable', 'NOT_FOUND');
  }

  successResponse(res, booking);
});

/**
 * POST /api/ticket/:id - Generer un PDF de ticket/bon de reservation
 */
app.post('/api/ticket/:id', async (req, res) => {
  try {
    const booking = reservations.get(req.params.id);

    if (!booking) {
      return errorResponse(res, 404, 'Reservation introuvable', 'NOT_FOUND');
    }

    // Creer le document PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Bon de Reservation ${booking.id}`,
        Author: config.COMPANY_NAME,
        Subject: 'Bon de reservation VTC',
        Creator: 'Romuo VTC API',
      },
    });

    // Headers pour le telechargement
    const filename = `bon-reservation-${booking.id.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe vers la reponse
    doc.pipe(res);

    // === EN-TETE ===
    doc
      .fontSize(24)
      .fillColor('#1a1a2e')
      .text(config.COMPANY_NAME, 50, 50)
      .fontSize(10)
      .fillColor('#666')
      .text('BON DE RESERVATION VTC', 50, 80)
      .text(`N° ${booking.id.toUpperCase()}`, { align: 'right' });

    // Ligne de separation
    doc
      .moveTo(50, 100)
      .lineTo(545, 100)
      .strokeColor('#d4af37')
      .lineWidth(2)
      .stroke();

    // === INFORMATIONS ENTREPRISE ===
    doc
      .fontSize(9)
      .fillColor('#888')
      .text(config.COMPANY_ADDRESS, 50, 115)
      .text(`Tel: ${config.COMPANY_PHONE} | Email: ${config.COMPANY_EMAIL}`, 50, 128)
      .text(`Licence VTC: ${config.COMPANY_LICENSE} | ${config.COMPANY_TVA}`, 50, 141);

    // === INFORMATIONS CLIENT ===
    doc
      .fontSize(12)
      .fillColor('#1a1a2e')
      .text('INFORMATIONS CLIENT', 50, 175, { underline: true })
      .fontSize(10)
      .fillColor('#333')
      .text(`Nom: ${booking.customer.name}`, 50, 195)
      .text(`Telephone: ${booking.customer.phone}`, 50, 210)
      .text(`Email: ${booking.customer.email}`, 50, 225);

    // === DETAILS DE LA COURSE ===
    const pickupDate = new Date(booking.pickupTime);
    const formattedDate = pickupDate.toLocaleDateString('fr-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = pickupDate.toLocaleTimeString('fr-CH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    doc
      .fontSize(12)
      .fillColor('#1a1a2e')
      .text('DETAILS DE LA COURSE', 50, 260, { underline: true })
      .fontSize(10)
      .fillColor('#333')
      .text(`Date: ${formattedDate}`, 50, 280)
      .text(`Heure de prise en charge: ${formattedTime}`, 50, 295)
      .text(`Depart: ${booking.origin.address || `${booking.origin.lat}, ${booking.origin.lng}`}`, 50, 315)
      .text(`Arrivee: ${booking.destination.address || `${booking.destination.lat}, ${booking.destination.lng}`}`, 50, 335)
      .text(`Distance: ${booking.distanceKm} km | Duree estimee: ${booking.durationMin} min`, 50, 355)
      .text(`Passagers: ${booking.passengers} | Vehicule: ${booking.vehicleType.toUpperCase()}`, 50, 370);

    // === TARIFICATION ===
    doc
      .fontSize(12)
      .fillColor('#1a1a2e')
      .text('TARIFICATION', 50, 410, { underline: true });

    const priceY = 430;
    doc
      .fontSize(10)
      .fillColor('#333')
      .text('Prise en charge:', 50, priceY)
      .text(`${booking.price.baseFare.toFixed(2)} ${booking.price.currency}`, 450, priceY, { align: 'right' })
      .text(`Distance (${booking.distanceKm} km):`, 50, priceY + 18)
      .text(`${booking.price.distanceFare.toFixed(2)} ${booking.price.currency}`, 450, priceY + 18, { align: 'right' })
      .text(`Duree (${booking.durationMin} min):`, 50, priceY + 36)
      .text(`${booking.price.timeFare.toFixed(2)} ${booking.price.currency}`, 450, priceY + 36, { align: 'right' });

    let totalY = priceY + 54;
    if (booking.price.isNightRate) {
      doc
        .fillColor('#d4af37')
        .text('Supplement nuit (22h-6h):', 50, totalY)
        .text(`+${booking.price.nightSurcharge.toFixed(2)} ${booking.price.currency}`, 450, totalY, { align: 'right' });
      totalY += 18;
    }

    // Ligne de separation
    doc
      .moveTo(50, totalY + 5)
      .lineTo(545, totalY + 5)
      .strokeColor('#333')
      .lineWidth(0.5)
      .stroke();

    // Total
    doc
      .fontSize(14)
      .fillColor('#1a1a2e')
      .text('TOTAL TTC:', 50, totalY + 15)
      .fontSize(16)
      .fillColor('#d4af37')
      .text(`${booking.price.total.toFixed(2)} ${booking.price.currency}`, 450, totalY + 15, { align: 'right' });

    // === NOTES ===
    if (booking.notes) {
      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Notes:', 50, totalY + 50)
        .text(booking.notes, 50, totalY + 65);
    }

    // === CONDITIONS ===
    doc
      .fontSize(8)
      .fillColor('#888')
      .text('CONDITIONS:', 50, 650)
      .text('- Annulation gratuite jusqu\'a 2 heures avant la prise en charge', 50, 665)
      .text('- Le chauffeur vous attendra 15 minutes gratuitement', 50, 677)
      .text('- Paiement accepte: Especes, Carte bancaire, TWINT', 50, 689)
      .text('- Ce bon fait foi de reservation confirmee', 50, 701);

    // === PIED DE PAGE ===
    doc
      .fontSize(8)
      .fillColor('#aaa')
      .text(`Document genere le ${new Date().toLocaleString('fr-CH')}`, 50, 750, { align: 'center' })
      .text(`${config.COMPANY_NAME} - ${config.COMPANY_TVA}`, 50, 762, { align: 'center' });

    // Finaliser le PDF
    doc.end();

    logger.info('Ticket generated', { bookingId: booking.id });

  } catch (error) {
    logger.error('Ticket generation error', { error: error.message });
    return errorResponse(res, 500, 'Erreur lors de la generation du PDF', 'PDF_ERROR');
  }
});

/**
 * GET /api/ticket/:id - Telecharger le ticket (GET simple)
 */
app.get('/api/ticket/:id', (req, res) => {
  // Redirect vers POST avec meme ID
  req.method = 'POST';
  app.handle(req, res);
});

// ============================================
// GESTION DES ERREURS
// ============================================

// Route 404
app.use((req, res) => {
  errorResponse(res, 404, 'Route non trouvee', 'NOT_FOUND');
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  errorResponse(
    res,
    err.status || 500,
    config.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
    'INTERNAL_ERROR'
  );
});

// ============================================
// DEMARRAGE DU SERVEUR
// ============================================

app.listen(config.PORT, () => {
  logger.info('Server started', {
    port: config.PORT,
    env: config.NODE_ENV,
    service: 'Romuo VTC API',
    version: '2.0.0',
  });

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ROMUO VTC API                           ║
╠════════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${config.PORT}                      ║
║  Health:    http://localhost:${config.PORT}/api/health           ║
║  Env:       ${config.NODE_ENV.padEnd(44)}║
║  ORS Key:   ${config.ORS_API_KEY === 'VOTRE_CLE_ORS' ? 'NON CONFIGURE (demo mode)'.padEnd(33) : 'Configure'.padEnd(33)}║
╚════════════════════════════════════════════════════════════╝

Endpoints disponibles:
  GET  /               - Formulaire HTML d'estimation
  GET  /api/health     - Health check
  POST /api/estimate   - Calculer une estimation
  POST /api/book       - Creer une reservation
  GET  /api/booking/:id - Recuperer une reservation
  POST /api/ticket/:id - Generer le PDF du bon

Tarification VTC:
  Prise en charge: ${config.PRICE_BASE} ${config.CURRENCY}
  Par kilometre:   ${config.PRICE_PER_KM} ${config.CURRENCY}/km
  Par minute:      ${config.PRICE_PER_MIN} ${config.CURRENCY}/min
  Supplement nuit: +20% (22h-6h)
`);
});

export default app;
