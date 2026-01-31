import express from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { confirmReservation, createReservation, getReservationById } from "./storage.js";
import { generateTicketPDF } from "./ticketPdf.js";

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
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "1 rue de la Mobilité, 75000 Paris";
const COMPANY_PHONE = process.env.COMPANY_PHONE || "+33 1 23 45 67 89";
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "contact@mon-vtc.fr";
const COMPANY_LICENSE = process.env.COMPANY_LICENSE || "VTC-XXXX-0000";
const COMPANY_SIRET = process.env.COMPANY_SIRET || "000 000 000 00000";
const COMPANY_LOGO_PATH =
  process.env.COMPANY_LOGO_PATH || path.join(publicDir, "logo.png");
const PDF_OUTPUT_DIR = process.env.PDF_OUTPUT_DIR || path.join(__dirname, "..", "generated");

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
  const {
    customerName,
    customerPhone,
    customerEmail,
    pickup,
    dropoff,
    pickupTime,
    vehicleType,
    distanceKm,
    durationMinutes,
    priceQuote
  } = req.body || {};

  if (!customerName || !pickup || !dropoff || !pickupTime) {
    return res.status(400).json({
      error:
        "Merci de fournir le nom du client, l'adresse de depart, l'adresse d'arrivee et la date/heure de prise en charge."
    });
  }

  const reservation = createReservation({
    customer: { name: customerName, phone: customerPhone, email: customerEmail },
    pickup,
    dropoff,
    pickupTime,
    vehicleType,
    distanceKm,
    durationMinutes,
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

app.post("/api/reservations/:id/ticket", async (req, res) => {
  try {
    const reservation = getReservationById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: "Reservation introuvable." });
    }

    const {
      customerPhone,
      customerEmail,
      priceTTC,
      priceDetails,
      saveToDisk = false,
      sendEmailSimulation = false,
      company: companyOverrides = {}
    } = req.body || {};

    const totalTTC =
      priceTTC ??
      reservation.priceQuote?.totalTTC ??
      reservation.priceQuote?.priceTTC ??
      reservation.priceQuote;

    const price = {
      totalTTC,
      details: Array.isArray(priceDetails) ? priceDetails : null
    };

    if (!price.details) {
      price.base = PRICE_BASE;
      if (reservation.distanceKm) {
        price.distance = reservation.distanceKm * PRICE_PER_KM;
      }
      if (reservation.durationMinutes) {
        price.duration = reservation.durationMinutes * PRICE_PER_MINUTE;
      }
    }

    const { buffer, filePath, emailSimulation } = await generateTicketPDF({
      reservationId: reservation.id,
      company: {
        name: companyOverrides.name || COMPANY_NAME,
        address: companyOverrides.address || COMPANY_ADDRESS,
        phone: companyOverrides.phone || COMPANY_PHONE,
        email: companyOverrides.email || COMPANY_EMAIL,
        licenseNumber: companyOverrides.licenseNumber || COMPANY_LICENSE,
        siret: companyOverrides.siret || COMPANY_SIRET
      },
      customer: {
        name: reservation.customer?.name || "Client",
        phone: customerPhone || reservation.customer?.phone,
        email: customerEmail || reservation.customer?.email
      },
      pickupTime: reservation.pickupTime,
      pickupAddress: reservation.pickup,
      dropoffAddress: reservation.dropoff,
      price,
      outputDir: PDF_OUTPUT_DIR,
      saveToDisk,
      sendEmailSimulation,
      logoPath: COMPANY_LOGO_PATH,
      notes: reservation.vehicleType
        ? `Type de véhicule réservé : ${reservation.vehicleType}`
        : undefined
    });

    if (req.query.format === "json") {
      return res.json({
        message: "Bon de réservation généré.",
        filePath,
        emailSimulation
      });
    }

    const pdfFileName = filePath
      ? path.basename(filePath)
      : `bon-reservation-${reservation.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
    return res.send(buffer);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: "Impossible de générer le bon de réservation.",
      details: error.message
    });
  }
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
