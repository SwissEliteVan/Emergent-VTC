# 🏗️ Architecture Technique - Romuo.ch Frontend

## Vue d'Ensemble de l'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROMUO.CH FRONTEND                         │
│                     React 18 + Vite + Tailwind                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx (Root)                           │
│                  Split-Screen Layout Manager                     │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
         70% Width│                               │30% Width
                  │                               │
    ┌─────────────▼─────────────┐   ┌────────────▼────────────┐
    │   InteractiveMap.jsx      │   │     Sidebar.jsx         │
    │   (React-Leaflet)         │   │  (Booking Interface)    │
    │                           │   │                         │
    │  - MapContainer           │   │  - Header + Logo        │
    │  - TileLayer (OSM)        │   │  - BookingForm          │
    │  - Markers (POI)          │   │  - VehicleSelection     │
    │  - Popups                 │   │  - CTA Button           │
    │  - ChangeView Hook        │   │                         │
    └───────────────────────────┘   └──────────┬──────────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  VehicleCard.jsx    │
                                    │  (Reusable Card)    │
                                    │                     │
                                    │  - Vehicle Info     │
                                    │  - Pricing          │
                                    │  - Selection State  │
                                    └─────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      UTILITIES & DATA                            │
└─────────────────────────────────────────────────────────────────┘

    vehicles.js                 API Services (Future)
    ├── VEHICLE_TYPES          └── axios.post('/api/rides')
    ├── ADDITIONAL_FEES            axios.get('/api/vehicles')
    └── SERVICE_ZONES              axios.post('/api/rides/calculate')
```

---

## Flux de Données

### 1. Réservation d'une Course

```
User Input (Sidebar)
      ↓
[pickup, destination, passengers, vehicle]
      ↓
handleBooking() Function
      ↓
Validation Check
      ↓
API Call (POST /api/rides)
      ↓
Backend Processing
      ↓
Response → User Confirmation
```

### 2. Sélection de Véhicule

```
User clicks VehicleCard
      ↓
onClick() Handler
      ↓
setSelectedVehicle(vehicle.id)
      ↓
State Update
      ↓
Card Re-render with "selected" class
      ↓
Show Features Animation
```

### 3. Interaction Carte

```
Map Load
      ↓
Center on Vevey [46.4607, 6.8427]
      ↓
Render POI Markers
      ↓
User clicks Marker
      ↓
Show Popup with Location Info
      ↓
User can pan/zoom
```

---

## Structure des Composants

### App.jsx (Root Component)

**Responsabilité :** Layout principal et state management global

```jsx
App
├── State: pickup, destination
├── Layout: flex (70/30 split)
├── Children:
│   ├── InteractiveMap (props: pickup, destination)
│   └── Sidebar (props: onPickupChange, onDestinationChange)
```

**Caractéristiques :**
- Layout responsive (70% carte / 30% sidebar)
- Communication parent-enfant via props
- State lifting pour partager pickup/destination

---

### InteractiveMap.jsx

**Responsabilité :** Affichage de la carte interactive avec Leaflet

```jsx
InteractiveMap
├── Dependencies: react-leaflet, leaflet
├── State: center, zoom
├── Effects: useEffect pour recentrage
├── Components:
│   ├── MapContainer
│   ├── TileLayer (OpenStreetMap)
│   ├── Marker (x5 POI)
│   ├── Popup
│   └── ChangeView (custom hook)
├── Overlays:
│   ├── Info Box (région desservie)
│   └── Quality Badge
```

**Points d'Intérêt (POI) :**
```javascript
1. Vevey [46.4607, 6.8427]
2. Montreux [46.4312, 6.9107]
3. Château de Chillon [46.4144, 6.9275]
4. Lavaux - UNESCO [46.4850, 6.7500]
5. Rochers-de-Naye [46.4331, 6.9761]
```

**Personnalisations :**
- Icônes dorées pour landmarks
- Popups dark mode
- Info overlay avec fond dark/blur
- Badge de qualité en bas

---

### Sidebar.jsx

**Responsabilité :** Interface de réservation complète

```jsx
Sidebar
├── State:
│   ├── pickup (string)
│   ├── destination (string)
│   ├── passengers (number: 1-7)
│   ├── selectedVehicle (string: id)
│   ├── date (string)
│   └── time (string)
├── Sections:
│   ├── Header (Logo + Login)
│   ├── Form (Inputs)
│   ├── Vehicle List (Cards)
│   ├── Info Box
│   └── Footer (CTA Button)
├── Validation:
│   └── Disabled CTA if incomplete
```

**Formulaire :**
```
Inputs:
├── Pickup Location (text, required, icon: MapPin)
├── Destination (text, required, icon: Navigation)
├── Date (date, optional, icon: Calendar)
├── Time (time, optional, icon: Clock)
└── Passengers (select 1-7, icon: Users)

CTA Button:
├── Enabled: "Réserver maintenant"
└── Disabled: "Complétez le formulaire"
```

---

### VehicleCard.jsx

**Responsabilité :** Affichage et sélection d'un véhicule

```jsx
VehicleCard
├── Props:
│   ├── vehicle (object)
│   ├── selected (boolean)
│   ├── onClick (function)
│   └── estimatedPrice (number, optional)
├── Display:
│   ├── Icon (emoji 🚗🚙🚐)
│   ├── Name + Badge (⭐ Populaire)
│   ├── Description
│   ├── Capacity (👤)
│   ├── Price (CHF)
│   └── Features (if selected)
├── States:
│   ├── Default: border-dark-700
│   ├── Hover: border-primary
│   └── Selected: border-primary + bg-dark-700
```

**Véhicules :**
```javascript
Eco:
├── ID: 'eco'
├── Base: 6 CHF
├── Per km: 3 CHF
├── Capacity: 4
└── Icon: 🚗

Berline Luxe:
├── ID: 'berline'
├── Base: 10 CHF
├── Per km: 5 CHF
├── Capacity: 4
├── Icon: 🚙
└── Badge: ⭐ Populaire

Van Premium:
├── ID: 'van'
├── Base: 15 CHF
├── Per km: 7 CHF
├── Capacity: 7
└── Icon: 🚐
```

---

## Système de Styles (Tailwind CSS)

### Palette de Couleurs

```css
/* Couleur Primaire - Or */
primary: #D4AF37
primary-50:  #FDF9E7
primary-100: #F9F0C7
...
primary-900: #3D3210

/* Couleur Dark - Anthracite */
dark: #1A1A1A
dark-50:  #F5F5F5
dark-100: #E0E0E0
...
dark-900: #1A1A1A (base)

/* Dégradés Gris */
gray-100 à gray-900
```

### Classes Personnalisées

```css
.btn-primary
├── Couleur: bg-primary, text-dark-900
├── Padding: px-6 py-3
├── Border: rounded-lg
├── Shadow: shadow-lg → hover:shadow-luxury
├── Transition: duration-300
└── Focus: ring-2 ring-primary

.input-dark
├── Background: bg-dark-800
├── Border: border-dark-700 → focus:border-primary
├── Text: text-gray-100
├── Placeholder: text-gray-500
└── Padding: px-4 py-3

.vehicle-card
├── Background: bg-dark-800
├── Border: border-dark-700 → hover:border-primary
├── Padding: p-4
├── Rounded: rounded-xl
├── Cursor: cursor-pointer
└── Transition: duration-300

.vehicle-card.selected
├── Border: border-primary
└── Background: bg-dark-700
```

### Animations

```css
@keyframes fadeIn
├── 0%: opacity 0
└── 100%: opacity 1

@keyframes slideUp
├── 0%: translateY(20px), opacity 0
└── 100%: translateY(0), opacity 1

Usage:
.animate-fade-in (0.5s)
.animate-slide-up (0.5s)
```

---

## Gestion de l'État (State Management)

### State Local (useState)

```javascript
App.jsx:
├── pickup: string | null
└── destination: string | null

Sidebar.jsx:
├── pickup: string
├── destination: string
├── passengers: number (1-7)
├── selectedVehicle: string | null
├── date: string
└── time: string

InteractiveMap.jsx:
├── center: [lat, lng]
└── zoom: number
```

### Props Drilling

```
App
├── pickup → InteractiveMap
├── destination → InteractiveMap
├── onPickupChange ← Sidebar
└── onDestinationChange ← Sidebar
```

**Future State Management (si nécessaire) :**
- Context API pour authentification
- Redux/Zustand si état global complexe

---

## Intégration API (Backend)

### Endpoints Prévus

```javascript
BASE_URL: https://api.romuo.ch

POST /api/rides
├── Body: {
│   pickup_location: string,
│   destination: string,
│   vehicle_type: string,
│   passengers: number,
│   scheduled_time: datetime
│ }
└── Response: {
    ride_id: string,
    price: number,
    estimated_duration: number
  }

POST /api/rides/calculate
├── Body: {
│   pickup_location: string,
│   destination: string,
│   vehicle_type: string
│ }
└── Response: {
    price: number,
    distance: number,
    duration: number
  }

GET /api/vehicles
└── Response: [
    { id, name, base_fare, rate_per_km, ... }
  ]
```

### Configuration Axios

```javascript
// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteurs pour auth token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

---

## Déploiement et CI/CD

### Workflow GitHub Actions

```yaml
Trigger: push sur main
      ↓
Checkout Code
      ↓
Setup Node.js 20
      ↓
Install Dependencies (npm ci)
      ↓
Build Project (npm run build)
      ↓
Generate dist/ folder
      ↓
Deploy via FTP to Hostinger
      ↓
Upload dist/* to /public_html/
      ↓
Success Notification
```

**Durée Estimée :** 3-5 minutes

**Secrets Requis :**
```
FTP_SERVER
FTP_USERNAME
FTP_PASSWORD
FTP_SERVER_DIR
```

---

## Optimisations de Performance

### Build Optimization

```javascript
// vite.config.js
build: {
  minify: 'terser',              // Minification
  sourcemap: false,               // Pas de sourcemaps en prod
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'leaflet-vendor': ['leaflet', 'react-leaflet']
      }
    }
  }
}
```

**Résultat :**
- Chunk splitting pour meilleur cache
- Minification aggressive
- Tree shaking automatique

### Assets Optimization

```apache
# .htaccess
<IfModule mod_expires.c>
  ExpiresByType image/* "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Lazy Loading (Future)

```javascript
// Code splitting avec React.lazy()
const AdminDashboard = React.lazy(() => import('./Admin'));

<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

---

## Sécurité

### Frontend Security

```apache
# .htaccess Headers
X-Frame-Options: SAMEORIGIN          # Anti-clickjacking
X-XSS-Protection: 1; mode=block      # Protection XSS
X-Content-Type-Options: nosniff      # Anti-MIME sniffing
Content-Security-Policy: ...         # CSP
```

### Input Validation

```javascript
// Sidebar.jsx
const validateInput = (value) => {
  // Sanitize user input
  return value.trim().slice(0, 255);
};

const handleBooking = async () => {
  if (!pickup || !destination) {
    alert('Veuillez remplir tous les champs');
    return;
  }
  // ...
};
```

### HTTPS Only

```apache
# Force HTTPS redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Tests (À Implémenter)

### Structure de Tests Suggérée

```
tests/
├── unit/
│   ├── VehicleCard.test.jsx
│   ├── Sidebar.test.jsx
│   └── utils/vehicles.test.js
├── integration/
│   ├── booking-flow.test.jsx
│   └── map-interaction.test.jsx
└── e2e/
    └── complete-booking.spec.js
```

### Exemple de Test (Vitest)

```javascript
import { render, screen } from '@testing-library/react';
import VehicleCard from './VehicleCard';
import { VEHICLE_TYPES } from '../utils/vehicles';

test('renders vehicle card with correct price', () => {
  const vehicle = VEHICLE_TYPES[0]; // Eco
  render(<VehicleCard vehicle={vehicle} />);

  expect(screen.getByText('Eco')).toBeInTheDocument();
  expect(screen.getByText('6 CHF')).toBeInTheDocument();
});
```

---

## Monitoring et Analytics (Future)

### Google Analytics

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Performance Monitoring

```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## Accessibilité (A11y)

### Standards Suivis

- **ARIA Labels** sur les inputs
- **Keyboard Navigation** pour la sélection de véhicules
- **Focus States** visibles
- **Alt Text** pour les images (future)
- **Semantic HTML** (header, main, section)

### Améliorations Futures

```jsx
<button
  aria-label="Sélectionner véhicule Eco"
  role="button"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && onClick()}
>
```

---

## Technologies et Versions

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "vite": "^5.4.11",
  "tailwindcss": "^3.4.15",
  "react-leaflet": "^4.2.1",
  "leaflet": "^1.9.4",
  "lucide-react": "^0.460.0",
  "axios": "^1.7.9"
}
```

---

## Évolution de l'Architecture

### Phase 1 - MVP (Actuel) ✅
- Interface de réservation
- Carte interactive
- Sélection de véhicules

### Phase 2 - API Integration
- Connexion backend
- Authentification
- Paiement en ligne

### Phase 3 - Features Avancées
- Suivi en temps réel
- Notifications push
- Historique des courses

### Phase 4 - Scale
- PWA (Progressive Web App)
- Application mobile (React Native)
- Dashboard chauffeur

---

## Contact & Support

**Questions sur l'architecture ?**
- Consultez le code source (bien commenté)
- README.md pour la vue d'ensemble
- DEPLOYMENT_GUIDE.md pour le déploiement

---

**Architecture créée en 2026 pour Romuo.ch**
_React 18 + Vite 5 + Tailwind CSS 3 + React-Leaflet 4_
