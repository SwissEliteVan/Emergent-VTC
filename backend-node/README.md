# Backend Node.js VTC

Ce service fournit un backend minimal pour le calcul des prix et la gestion des reservations.

## Installation

```bash
cd backend-node
npm install
npm run start
```

## Endpoints

- `GET /health` : verification du service
- `GET /api/vehicles` : liste des vehicules et tarifs
- `POST /api/pricing` : calculer un devis
- `POST /api/reservations` : creer une reservation
- `GET /api/reservations` : lister les reservations (memoire)

### Exemple `POST /api/pricing`

```json
{
  "distanceKm": 12.5,
  "vehicleType": "car",
  "options": { "night": true, "airport": true }
}
```
