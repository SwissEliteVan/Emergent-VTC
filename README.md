# Romuo - Transport VTC Suisse Romande

Service de transport VTC en Suisse romande. **Voiture, Van, Bus** de 1 a 50 passagers.
Ligne nocturne **Martigny-Lausanne** chaque week-end.

**Version**: 5.0.0
**Stack**: React + Vite + TailwindCSS | FastAPI + MongoDB | Hostinger VPS

---

## Apercu

```
https://romuo.ch              # Landing page + Reservation
https://romuo.ch/pwa          # Progressive Web App
https://api.romuo.ch          # Backend API
```

---

## Services

| Service | Capacite | Prix de base | Prix/km | Ideal pour |
|---------|----------|--------------|---------|------------|
| **Voiture** | 4 places | 8 CHF | 3.5 CHF | Trajets quotidiens, aeroports |
| **Van** | 9 places | 15 CHF | 5.5 CHF | Familles, groupes d'amis |
| **Bus** | 50 places | 80 CHF | 12 CHF | Evenements, entreprises |

### Offres Speciales

| Offre | Reduction | Conditions |
|-------|-----------|------------|
| **Tarif Jeune** | -15% | Moins de 26 ans |
| **Covoiturage** | -25% | 2+ passagers |
| **Ligne Nocturne** | Des 25 CHF | Martigny-Lausanne, Ven/Sam |

---

## Structure du Projet

```
Emergent-VTC/
├── frontend-romuo/          # Landing page React + Vite
│   ├── src/
│   │   ├── App.jsx          # Page d'accueil marketing
│   │   ├── components/
│   │   │   ├── AutocompleteInput.jsx   # Photon + Nominatim
│   │   │   └── OptimizedImage.jsx      # Lazy loading
│   │   └── utils/
│   │       └── vehicles.js  # Services et tarifs
│   └── public/
│       ├── .htaccess        # Config Apache/Hostinger
│       ├── sw.js            # Service Worker v3
│       ├── offline.html     # Page hors ligne
│       └── manifest.json    # PWA manifest
│
├── backend/                 # FastAPI Python
│   ├── server.py           # API principale
│   └── requirements.txt
│
├── nginx/                   # Config serveur VPS
│   ├── romuo.ch.conf       # Configuration nginx
│   └── deploy-vps.sh       # Script de deploiement
│
├── pwa/                     # PWA Vanilla JS
├── pwa-react/               # PWA React standalone
└── frontend/                # App mobile React Native
```

---

## Deploiement

### Hostinger Mutualis (FTP)

Le deploiement est automatique via GitHub Actions sur push vers `main`.

**Secrets GitHub requis:**
- `FTP_SERVER` - Serveur FTP Hostinger
- `FTP_USERNAME` - Utilisateur FTP
- `FTP_PASSWORD` - Mot de passe FTP
- `FTP_SERVER_DIR` - `/public_html/`

Voir: [HOSTINGER_GUIDE.md](./HOSTINGER_GUIDE.md)

### VPS Ubuntu (nginx)

```bash
# Sur le VPS
git clone https://github.com/SwissEliteVan/Emergent-VTC.git
cd Emergent-VTC
sudo chmod +x nginx/deploy-vps.sh
sudo ./nginx/deploy-vps.sh
```

Le script installe automatiquement nginx, Node.js, Let's Encrypt SSL.

---

## Developpement Local

### Frontend (Landing Page)

```bash
cd frontend-romuo
npm install
npm run dev
# http://localhost:3000
```

### Backend API

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurer .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=romuo_dev
ADMIN_PASSWORD=admin123
EOF

uvicorn server:app --reload --port 8001
# http://localhost:8001/docs
```

### Build Production

```bash
cd frontend-romuo
npm run build
# Output: dist/
```

---

## Fonctionnalites Techniques

### Autocompletion d'Adresses

Double API pour une fiabilite maximale:
1. **Photon** (Komoot) - Rapide, biais Suisse romande
2. **Nominatim** - Fallback OpenStreetMap

```jsx
<AutocompleteInput
  value={address}
  onChange={setAddress}
  onSelect={(place) => console.log(place.lat, place.lon)}
  placeholder="Entrez une adresse"
/>
```

### Service Worker (PWA)

| Strategie | Ressources |
|-----------|-----------|
| Cache-First | JS/CSS (assets Vite), Google Fonts |
| Network-First + TTL | APIs Photon/Nominatim (5min) |
| Stale-While-Revalidate | Images Unsplash, tiles OSM |
| Offline Fallback | HTML → offline.html |

### SEO

- Meta tags Open Graph + Twitter Card
- Schema.org LocalBusiness + FAQ
- Preconnect aux APIs externes
- Sitemap.xml + robots.txt

---

## API Endpoints

### Vehicules

```bash
GET /api/vehicles
# Retourne les 3 types de vehicules avec tarifs
```

### Calcul de Prix

```bash
POST /api/rides/calculate
{
  "pickup": "Martigny",
  "destination": "Lausanne",
  "vehicle_type": "voiture",
  "distance_km": 75
}
# Retourne: { "total": 270, "currency": "CHF" }
```

### Reservation

```bash
POST /api/rides
{
  "pickup": { "address": "...", "lat": 46.1, "lon": 7.0 },
  "destination": { "address": "...", "lat": 46.5, "lon": 6.6 },
  "vehicle_type": "van",
  "passengers": 6
}
```

Documentation complete: https://api.romuo.ch/docs

---

## Tarification

### Formule

```
Prix = Base + (Distance × Prix/km)
```

### Reductions

| Reduction | Pourcentage | Application |
|-----------|-------------|-------------|
| Jeune (<26 ans) | -15% | Automatique |
| Covoiturage | -25% | 2+ passagers |
| Hors-pointe | -10% | En dehors de 7-9h et 17-19h |

### Supplements

| Supplement | Montant |
|------------|---------|
| Nocturne (22h-6h) | +10 CHF |
| Aeroport | +15 CHF |
| Attente (15 min) | +10 CHF |

---

## Ligne Nocturne Martigny-Lausanne

**Chaque vendredi et samedi soir**

| Depart | Heure |
|--------|-------|
| Martigny | 23:00 |
| Martigny | 01:00 |
| Lausanne (retour) | 03:00 |

**Arrets:** Martigny → Sion → Montreux → Vevey → Lausanne

**Prix:** Des 25 CHF par personne

---

## Configuration Serveur

### Apache (.htaccess)

- Routing SPA (toutes les routes → index.html)
- Compression GZIP
- Cache navigateur (1 an pour assets hashes)
- Headers de securite (CSP, HSTS, X-Frame-Options)
- HTTPS force

### nginx (VPS)

```bash
# Tester la config
sudo nginx -t

# Recharger
sudo systemctl reload nginx

# Logs
tail -f /var/log/nginx/romuo.ch.error.log
```

---

## Troubleshooting

### Erreur 404 sur romuo.ch

1. Verifier que `.htaccess` est present dans `/public_html/`
2. Verifier que `mod_rewrite` est active (Hostinger hPanel)
3. Verifier les logs nginx si VPS

### Autocompletion ne fonctionne pas

1. Verifier la console navigateur pour les erreurs CORS
2. Verifier que `photon.komoot.io` est accessible
3. Fallback automatique vers Nominatim

### PWA ne s'installe pas

1. Verifier HTTPS (obligatoire)
2. Verifier `manifest.json` est accessible
3. Verifier `sw.js` est enregistre

---

## Performance

### Lighthouse Scores (Objectifs)

| Metrique | Score |
|----------|-------|
| Performance | 90+ |
| Accessibility | 95+ |
| Best Practices | 95+ |
| SEO | 100 |

### Optimisations Implementees

- Pre-compression GZIP des assets
- Lazy loading des images (Intersection Observer)
- Preconnect aux APIs externes
- Font display swap
- Service Worker avec cache strategies

---

## Contact

- **Telephone:** +41 79 123 45 67
- **Email:** info@romuo.ch
- **Site:** https://romuo.ch

---

## Licence

Proprietaire - Romuo © 2025

---

**Transport VTC en Suisse romande - Voiture, Van, Bus - De 1 a 50 passagers**
