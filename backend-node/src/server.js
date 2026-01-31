import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "VOTRE_CLE_API";
const PRICE_BASE = 7;
const PRICE_PER_KM = 1.8;
const PRICE_PER_MINUTE = 0.5;

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

app.listen(port, () => {
  console.log(`Serveur VTC demarre sur le port ${port}`);
});
