import express from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { confirmReservation, createReservation, getReservationById } from "./storage.js";

const app = express();
const port = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "VOTRE_CLE_API";
const PRICE_BASE = 7;
const PRICE_PER_KM = 1.8;
const PRICE_PER_MINUTE = 0.5;
const COMPANY_NAME = process.env.COMPANY_NAME || "Mon Entreprise VTC";
const COMPANY_LOGO_PATH =
  process.env.COMPANY_LOGO_PATH || path.join(publicDir, "logo.png");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.post("/api/estimate", async (req, res) => {
  try {
    const { origin, destination } = req.body || {};

    if (!origin || !destination) {
      return res.status(400).json({
        error: "Merci de fournir une adresse de depart et une adresse d'arrivee."
      });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", origin);
    url.searchParams.set("destinations", destination);
    url.searchParams.set("key", GOOGLE_API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({
        error: "Erreur lors de l'appel a l'API Google Distance Matrix."
      });
    }

    const data = await response.json();
    const element = data?.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return res.status(400).json({
        error: "Impossible de calculer la distance pour ces adresses."
      });
    }

    const distanceKm = element.distance.value / 1000;
    const durationMinutes = element.duration.value / 60;
    const priceEstimate =
      PRICE_BASE + distanceKm * PRICE_PER_KM + durationMinutes * PRICE_PER_MINUTE;

    return res.json({
      origin,
      destination,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes: Number(durationMinutes.toFixed(1)),
      priceEstimate: Number(priceEstimate.toFixed(2))
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur interne lors du calcul du prix.",
      details: error.message
    });
  }
});

app.post("/api/reservations", (req, res) => {
  const { customerName, pickup, dropoff, pickupTime, vehicleType, distanceKm, priceQuote } =
    req.body || {};

  if (!customerName || !pickup || !dropoff || !pickupTime) {
    return res.status(400).json({
      error:
        "Merci de fournir le nom du client, l'adresse de depart, l'adresse d'arrivee et la date/heure de prise en charge."
    });
  }

  const reservation = createReservation({
    customer: { name: customerName },
    pickup,
    dropoff,
    pickupTime,
    vehicleType,
    distanceKm,
    priceQuote
  });

  return res.status(201).json(reservation);
});

app.post("/api/reservations/:id/confirm", (req, res) => {
  const reservation = confirmReservation(req.params.id);

  if (!reservation) {
    return res.status(404).json({ error: "Reservation introuvable." });
  }

  const pdfFileName = `bon-reservation-${reservation.id}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  if (fs.existsSync(COMPANY_LOGO_PATH)) {
    doc.image(COMPANY_LOGO_PATH, 50, 40, { width: 80 });
  }

  doc
    .fontSize(20)
    .text(COMPANY_NAME, 150, 45)
    .fontSize(12)
    .text("Bon de Reservation VTC", { align: "right" })
    .moveDown(2);

  doc
    .fontSize(14)
    .text("Informations client", { underline: true })
    .moveDown(0.5)
    .fontSize(12)
    .text(`Nom du client : ${reservation.customer?.name || "Non renseigne"}`)
    .moveDown();

  const pickupDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(reservation.pickupTime));

  doc
    .fontSize(14)
    .text("Details de la course", { underline: true })
    .moveDown(0.5)
    .fontSize(12)
    .text(`Date et heure de prise en charge : ${pickupDate}`)
    .text(`Adresse de depart : ${reservation.pickup}`)
    .text(`Adresse d'arrivee : ${reservation.dropoff}`)
    .moveDown();

  doc
    .fontSize(10)
    .fillColor("gray")
    .text(
      `Reservation confirmee le ${new Date(reservation.confirmedAt).toLocaleString(
        "fr-FR"
      )}.`,
      { align: "left" }
    );

  doc.end();
});

app.get("/api/reservations/:id", (req, res) => {
  const reservation = getReservationById(req.params.id);

  if (!reservation) {
    return res.status(404).json({ error: "Reservation introuvable." });
  }

  return res.json(reservation);
});

app.listen(port, () => {
  console.log(`Serveur VTC demarre sur le port ${port}`);
});
