# Romuo.ch - Plateforme VTC Suisse

**Plateforme de transport VTC pour le marché suisse** avec application mobile (iOS/Android), PWA web et dashboard administrateur.

**Version**: 4.0.0 Production Ready
**Tech Stack**: React Native (Expo) + React PWA + FastAPI + MongoDB 8.0
**Marché**: Suisse (CHF pricing, French language)

---

## 🚀 DÉPLOIEMENT RAPIDE

### Installation Automatique (15-20 minutes)

```bash
# Connectez-vous à votre VPS
ssh root@76.13.6.218

# Lancez le script d'installation
curl -fsSL https://raw.githubusercontent.com/SwissEliteVan/Emergent-VTC/main/install_rapide.sh | bash
```

**Voir le guide complet**: [DEPLOY_NOW.md](./DEPLOY_NOW.md)

---

## Documentation

### Guides de Déploiement

- **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - Guide ultra-rapide (START HERE!)
- **[DEPLOIEMENT_RAPIDE_VPS.md](./DEPLOIEMENT_RAPIDE_VPS.md)** - Guide détaillé étape par étape
- **[MONGODB_8_OPTIMIZATIONS.md](./MONGODB_8_OPTIMIZATIONS.md)** - Spécifique MongoDB 8.0
- **[GUIDE_COMPLET_DEPLOIEMENT.md](./GUIDE_COMPLET_DEPLOIEMENT.md)** - Guide complet original
- **[PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md)** - Guide de production complet

### Documentation PWA

- **[pwa/README.md](./pwa/README.md)** - PWA Emergent VTC (Vanilla JS)
- **[pwa-react/README.md](./pwa-react/README.md)** - PWA Romuo.ch (React + TailwindCSS)

### Documentation Technique

- **[PROJECT_README.md](./PROJECT_README.md)** - Architecture et fonctionnalités
- **[PHASE2_DRIVER_DOCS.md](./PHASE2_DRIVER_DOCS.md)** - Interface conducteur
- **[GUEST_MODE_DOCS.md](./GUEST_MODE_DOCS.md)** - Mode invité (sans login)
- **[HOSTINGER_HORIZON_PROMPT.md](./HOSTINGER_HORIZON_PROMPT.md)** - Prompt optimisé pour Hostinger Horizon

---

## Architecture

```
romuo-ch/
├── backend/                 # FastAPI (Python 3.11)
│   ├── server.py           # API principale (1500+ lignes)
│   ├── requirements.txt    # Dépendances Python
│   └── .env                # Configuration (MongoDB, admin)
│
├── frontend/               # React Native (Expo SDK 52)
│   ├── app/               # Screens (Expo Router)
│   ├── components/        # Composants réutilisables
│   ├── contexts/          # AuthContext
│   └── store/             # Zustand state management
│
├── pwa/                    # PWA Vanilla JS (Emergent VTC)
│   ├── index.html         # App complète
│   ├── styles.css         # Design System
│   ├── app.js             # Logique JavaScript
│   └── service-worker.js  # Support offline (résilient)
│
├── pwa-react/              # PWA React + TailwindCSS (Romuo.ch)
│   ├── index.html         # App React standalone
│   ├── manifest.json      # Configuration PWA
│   └── service-worker.js  # Support offline (résilient)
│
└── docs/                  # Documentation complète
```

---

## PWA Web Applications

Deux Progressive Web Apps sont disponibles pour un déploiement web instantané:

### PWA Romuo.ch (React + TailwindCSS)

**Dossier**: `pwa-react/`

```bash
# Déploiement local
cd pwa-react
npx serve .
# Ouvrir http://localhost:3000
```

**Caractéristiques**:
- Design Swiss International Style
- Pickup restreint à la Suisse (autocomplete 10 villes)
- Destination ouverte à toute l'Europe
- Pricing en CHF:
  - Eco (Toyota): 6.00 CHF + 2.50 CHF/km
  - Berline (Mercedes): 10.00 CHF + 3.50 CHF/km
  - Van (V-Class): 15.00 CHF + 4.50 CHF/km
- Icônes SVG (Lucide-style), zéro emoji
- Service Worker résilient (fonctionne même si icônes manquantes)

### PWA Emergent VTC (Vanilla JS)

**Dossier**: `pwa/`

```bash
# Déploiement local
cd pwa
python -m http.server 8000
# Ouvrir http://localhost:8000
```

**Caractéristiques**:
- 3 onglets: Accueil, Activités, Compte
- Carte CSS vectorielle (pas d'image statique)
- Bottom sheet sélection véhicule
- Animation recherche chauffeur
- Section parrainage (Growth Hacking)
- Design corporate, zéro emoji

---

## ✨ Fonctionnalités

### Phase 1: MVP Passager ✅
- Mode invité (estimation de prix sans login)
- Authentification Google OAuth (Emergent)
- 3 types de véhicules (Eco, Berline Luxe, Van)
- Calcul de prix en temps réel
- Réservation de courses
- Suivi de statut en temps réel

### Phase 2: Interface Conducteur ✅
- Basculement Passager/Conducteur
- Flux de dispatch en temps réel (polling 5s)
- Accepter/Refuser des courses
- Navigation Waze/Google Maps
- Gestion complète du cycle de vie
- Tableau de bord des gains

### Phase 3: Admin & B2B ✅
- Dashboard admin web (/admin)
- Dispatch manuel pour réservations téléphoniques
- Comptes corporate (business vs personal)
- Facturation mensuelle pour entreprises
- Tracking TVA/IDE suisse
- Statistiques plateforme

---

## 🌐 URLs de Production

| Service | URL | Credentials |
|---------|-----|-------------|
| **API Backend** | https://api.romuo.ch | - |
| **Documentation API** | https://api.romuo.ch/docs | - |
| **Admin Dashboard** | https://romuo.ch/admin | `RomuoAdmin2025!` |
| **MongoDB** | localhost:27017 | `romuo_root` / voir .env |

---

## 🛠️ Installation Développement

### Prérequis
- Python 3.11+
- Node.js 20+
- MongoDB 8.0
- Expo CLI

### Backend

```bash
cd backend

# Créer l'environnement virtuel
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Créer le .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=romuo_dev
ADMIN_PASSWORD=admin123
EOF

# Lancer le serveur
uvicorn server:app --reload --port 8001
```

**Test**: http://localhost:8001/api/vehicles

### Frontend

```bash
cd frontend

# Installer les dépendances
yarn install

# Créer le .env
cat > .env << EOF
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
EOF

# Lancer Expo
yarn start
```

---

## 🧪 Tests API

```bash
# Test vehicles
curl http://localhost:8001/api/vehicles

# Test calcul de prix
curl -X POST http://localhost:8001/api/rides/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {"latitude": 46.5197, "longitude": 6.6323, "address": "Lausanne"},
    "destination": {"latitude": 46.2044, "longitude": 6.1432, "address": "Geneva"},
    "vehicle_type": "berline",
    "distance_km": 65.5
  }'
```

---

## 🇨🇭 Configuration Suisse

### Tarification (CHF)
- **Eco**: CHF 6.00 base + CHF 3.00/km
- **Berline Luxe**: CHF 10.00 base + CHF 5.00/km
- **Van**: CHF 15.00 base + CHF 6.00/km

### Langue
- Interface en français
- Messages d'erreur en français

### Conformité
- TVA suisse: 7.7%
- Numéros IDE trackés pour B2B
- Facturation mensuelle pour entreprises

---

## 📊 Base de Données

### Collections MongoDB

```javascript
// users
{
  user_id: "user_abc123",
  email: "user@example.com",
  name: "Jean Dupont",
  role: "passenger" | "driver",
  account_type: "personal" | "business",
  company_name: "...",  // Si business
  vat_number: "CHE-..."  // Si business
}

// rides
{
  ride_id: "ride_abc123",
  user_id: "user_abc123",
  driver_id: "user_xyz789",
  pickup: { latitude, longitude, address },
  destination: { latitude, longitude, address },
  vehicle_type: "eco" | "berline" | "van",
  price: 337.50,
  status: "pending" | "accepted" | "in_progress" | "completed",
  billing_type: "immediate" | "monthly"
}

// user_sessions
{
  user_id: "user_abc123",
  session_token: "token_xyz...",
  expires_at: ISODate("...")  // 7 jours
}
```

---

## 🔒 Sécurité

### MongoDB
- Authentification activée (MongoDB 8.0)
- Utilisateur dédié avec permissions limitées
- Connexion via `authSource=admin`

### API
- Session tokens (7 jours)
- Admin password protected
- HTTPS forcé (production)

### Firewall
- Ports ouverts: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- MongoDB accessible uniquement en localhost

---

## 🚨 Dépannage

### Backend ne démarre pas

```bash
# Voir les logs
journalctl -u romuo-backend -n 50

# Tester manuellement
cd /var/www/romuo-ch/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### MongoDB erreur authentification

```bash
# Vérifier l'utilisateur
mongosh -u romuo_root -p --authenticationDatabase admin

# Voir la config
cat /etc/mongod.conf
```

### Nginx 502 Bad Gateway

```bash
# Vérifier que le backend écoute
ss -ltnp | grep 8001

# Tester l'API
curl http://localhost:8001/api/vehicles

# Logs Nginx
tail -f /var/log/nginx/error.log
```

**Guide complet**: [MONGODB_8_OPTIMIZATIONS.md](./MONGODB_8_OPTIMIZATIONS.md)

---

## 📞 Support

### Commandes Utiles

```bash
# Health check
/root/romuo_health.sh

# Redémarrer les services
systemctl restart mongod romuo-backend nginx

# Backup MongoDB
mongodump --uri="mongodb://romuo_root:PASSWORD@localhost:27017/romuo_production?authSource=admin" --out=/backup/$(date +%Y%m%d)

# Mettre à jour le code
cd /var/www/romuo-ch
git pull origin main
systemctl restart romuo-backend
```

### Documentation

- **Questions MongoDB 8.0**: Voir [MONGODB_8_OPTIMIZATIONS.md](./MONGODB_8_OPTIMIZATIONS.md)
- **Questions déploiement**: Voir [DEPLOIEMENT_RAPIDE_VPS.md](./DEPLOIEMENT_RAPIDE_VPS.md)
- **Questions features**: Voir [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md)

---

## 🎯 Roadmap

### Phase 4: Paiements (À venir)
- [ ] Intégration Stripe
- [ ] Intégration Twint (paiement mobile suisse)
- [ ] Facturation automatique PDF
- [ ] Reçus par email

### Phase 5: Notifications (À venir)
- [ ] Push notifications (Expo)
- [ ] Email notifications (SendGrid)
- [ ] SMS notifications (Twilio)

### Phase 6: Features Avancées (À venir)
- [ ] WebSocket temps réel
- [ ] Système de notes conducteurs
- [ ] Courses planifiées
- [ ] Partage de course
- [ ] Codes promo

---

## 📄 Licence

Propriétaire - Romuo.ch © 2025

---

## 🤝 Contribution

Pour contribuer au projet:

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

**Développé avec ❤️ pour le marché suisse 🇨🇭**
