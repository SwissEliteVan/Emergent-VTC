const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', stack: 'OpenStreetMap' });
});

app.get('/api/estimate', async (req, res) => {
  try {
    const { depart_lon, depart_lat, arrive_lon, arrive_lat } = req.query;
    
    if (!depart_lon || !depart_lat || !arrive_lon || !arrive_lat) {
      return res.status(400).json({ error: 'Coordonn\u00e9es manquantes' });
    }

    const response = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${depart_lon},${depart_lat};${arrive_lon},${arrive_lat}?overview=false`
    );

    if (response.data.routes.length === 0) {
      return res.status(404).json({ error: 'Aucun itin\u00e9raire trouv\u00e9' });
    }

    const distance_m = response.data.routes[0].legs[0].distance;
    const duree_s = response.data.routes[0].legs[0].duration;

    const distance_km = distance_m / 1000;
    const duree_min = duree_s / 60;

    const prise_en_charge = 7.0;
    const prix_au_km = 1.8;
    const prix_a_la_minute = 0.5;

    const prix_estime = prise_en_charge + (distance_km * prix_au_km) + (duree_min * prix_a_la_minute);

    res.json({
      distance_km: Number(distance_km.toFixed(2)),
      duree_min: Number(duree_min.toFixed(2)),
      prix_estime: Number(prix_estime.toFixed(2))
    });

  } catch (error) {
    console.error('Erreur OSRM:', error);
    res.status(500).json({ error: '\u00c9chec du calcul d\'itin\u00e9raire' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server VTC OSRM running on port ${PORT}`);
});