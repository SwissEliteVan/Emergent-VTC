import express from "express";
import cors from "cors";
import { calculatePrice, listVehicleOptions } from "./pricing.js";
import { createReservation, listReservations } from "./storage.js";

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/vehicles", (_req, res) => {
  res.json({ vehicles: listVehicleOptions() });
});

app.post("/api/pricing", (req, res) => {
  try {
    const { distanceKm, vehicleType, options } = req.body || {};
    const quote = calculatePrice({
      distanceKm: Number(distanceKm),
      vehicleType,
      options
    });
    res.json({ quote });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/reservations", (req, res) => {
  try {
    const {
      customer,
      pickup,
      dropoff,
      pickupTime,
      vehicleType,
      distanceKm,
      options
    } = req.body || {};

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({
        error: "Le client doit fournir un nom et un numero de telephone."
      });
    }

    if (!pickup || !dropoff || !pickupTime) {
      return res.status(400).json({
        error: "Les informations de trajet sont incompletes."
      });
    }

    const priceQuote = calculatePrice({
      distanceKm: Number(distanceKm),
      vehicleType,
      options
    });

    const reservation = createReservation({
      customer,
      pickup,
      dropoff,
      pickupTime,
      vehicleType,
      distanceKm: Number(distanceKm),
      priceQuote
    });

    return res.status(201).json({ reservation });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/reservations", (_req, res) => {
  res.json({ reservations: listReservations() });
});

app.listen(port, () => {
  console.log(`VTC backend listening on port ${port}`);
});
