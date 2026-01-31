const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const pinoHttp = require("pino-http");
const Joi = require("joi");

const app = express();

const ORS_API_KEY = process.env.ORS_API_KEY || "VOTRE_CLE_ORS";
const ORS_ENDPOINT = "https://api.openrouteservice.org/v2/directions/driving-car";

const logger = pinoHttp({
  transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
});

app.use(logger);
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const coordinateSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

const estimateSchema = Joi.object({
  pickup: coordinateSchema.required(),
  dropoff: coordinateSchema.required(),
});

const bookingSchema = Joi.object({
  customerName: Joi.string().min(2).max(120).required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string().min(6).max(30).required(),
  pickup: coordinateSchema.required(),
  dropoff: coordinateSchema.required(),
  pickupAddress: Joi.string().min(3).max(255).required(),
  dropoffAddress: Joi.string().min(3).max(255).required(),
  pickupTime: Joi.string().isoDate().required(),
  notes: Joi.string().max(500).allow("", null),
});

const ticketSchema = Joi.object({
  bookingId: Joi.string().min(3).max(64).required(),
  customerName: Joi.string().min(2).max(120).required(),
  customerEmail: Joi.string().email().required(),
  pickupAddress: Joi.string().min(3).max(255).required(),
  dropoffAddress: Joi.string().min(3).max(255).required(),
  distanceKm: Joi.number().positive().required(),
  durationMinutes: Joi.number().positive().required(),
  price: Joi.number().positive().required(),
});

const priceFormula = (distanceKm, durationMinutes) => {
  const base = 7;
  const perKm = 1.8 * distanceKm;
  const perMinute = 0.5 * durationMinutes;
  return Number((base + perKm + perMinute).toFixed(2));
};

app.get("/", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Estimateur VTC</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; background: #f5f5f5; }
    form { background: white; padding: 1.5rem; border-radius: 8px; max-width: 520px; }
    label { display: block; margin-top: 1rem; }
    input { width: 100%; padding: 0.5rem; margin-top: 0.25rem; }
    button { margin-top: 1.5rem; padding: 0.75rem 1.5rem; }
  </style>
</head>
<body>
  <h1>Calculer un trajet VTC</h1>
  <form method="post" action="/api/estimate">
    <label>Latitude départ
      <input type="number" step="any" name="pickupLat" required />
    </label>
    <label>Longitude départ
      <input type="number" step="any" name="pickupLng" required />
    </label>
    <label>Latitude arrivée
      <input type="number" step="any" name="dropoffLat" required />
    </label>
    <label>Longitude arrivée
      <input type="number" step="any" name="dropoffLng" required />
    </label>
    <button type="submit">Estimer</button>
  </form>
  <p>Utilisez l'endpoint <code>/api/estimate</code> avec du JSON pour des réponses structurées.</p>
</body>
</html>`);
});

app.post("/api/estimate", async (req, res, next) => {
  try {
    const payload = req.is("application/json")
      ? req.body
      : {
          pickup: { latitude: Number(req.body.pickupLat), longitude: Number(req.body.pickupLng) },
          dropoff: { latitude: Number(req.body.dropoffLat), longitude: Number(req.body.dropoffLng) },
        };

    const { error, value } = estimateSchema.validate(payload, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((detail) => detail.message),
      });
    }

    const response = await axios.post(
      ORS_ENDPOINT,
      {
        coordinates: [
          [value.pickup.longitude, value.pickup.latitude],
          [value.dropoff.longitude, value.dropoff.latitude],
        ],
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const route = response.data?.routes?.[0];
    if (!route) {
      return res.status(502).json({ message: "Route introuvable via OpenRouteService" });
    }

    const distanceKm = route.summary.distance / 1000;
    const durationMinutes = route.summary.duration / 60;
    const price = priceFormula(distanceKm, durationMinutes);

    return res.json({
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes: Number(durationMinutes.toFixed(2)),
      price,
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/book", (req, res) => {
  const { error, value } = bookingSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((detail) => detail.message),
    });
  }

  const bookingId = `BOOK-${Date.now()}`;

  return res.status(201).json({
    bookingId,
    status: "confirmed",
    message: "Réservation enregistrée",
    data: value,
  });
});

app.post("/api/ticket", (req, res) => {
  const { error, value } = ticketSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((detail) => detail.message),
    });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="ticket-${value.bookingId}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("Ticket de réservation VTC", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Réservation : ${value.bookingId}`);
  doc.text(`Client : ${value.customerName}`);
  doc.text(`Email : ${value.customerEmail}`);
  doc.moveDown();

  doc.text(`Départ : ${value.pickupAddress}`);
  doc.text(`Arrivée : ${value.dropoffAddress}`);
  doc.moveDown();

  doc.text(`Distance : ${value.distanceKm.toFixed(2)} km`);
  doc.text(`Durée : ${value.durationMinutes.toFixed(2)} minutes`);
  doc.text(`Prix : ${value.price.toFixed(2)} €`);
  doc.moveDown();

  doc.text("Merci pour votre confiance.");
  doc.end();
});

app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

app.use((error, req, res, next) => {
  req.log.error({ err: error }, "Unhandled error");
  const status = error.response?.status || error.status || 500;
  const message = error.response?.data || error.message || "Erreur serveur";
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Serveur démarré sur le port ${PORT}`);
});
