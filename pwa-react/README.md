# Romuo.ch - PWA VTC Suisse

Application PWA React de réservation de VTC pour la Suisse avec destinations européennes.

## Caractéristiques

### Restrictions Géographiques
- **Pickup (Départ)** : Suisse uniquement - Autocomplete avec villes et rues suisses
- **Dropoff (Destination)** : Toute l'Europe - Suisse + villes européennes majeures

### Devise
- **CHF (Francs Suisses)** - Hardcodé, aucune autre devise

### Design System
- **Style** : Swiss International Style
- **Couleurs** : Blanc #FFFFFF, Noir #000000
- **Typographie** : Inter / Helvetica Neue
- **Icônes** : SVG (style Lucide) - Aucun emoji

## Architecture des Vues

### VIEW A - Landing Page
- Logo "Romuo.ch" en typographie grasse
- Titre "Votre Chauffeur Suisse"
- Bouton CTA large noir "Réserver une course"

### VIEW B - Saisie des Adresses
- Carte minimaliste CSS (gris/blanc)
- Deux champs superposés avec connecteur visuel
- Autocomplete intelligent (Suisse pour pickup, Europe pour dropoff)

### VIEW C - Sélection du Véhicule
- Bottom Sheet avec 3 options tarifaires :
  - **Eco (Toyota)** : 6.00 CHF + 2.50 CHF/km
  - **Berline (Mercedes E-Class)** : 10.00 CHF + 3.50 CHF/km
  - **Van (Mercedes V-Class)** : 15.00 CHF + 4.50 CHF/km

### VIEW D - Live Tracking
- Animation "Recherche chauffeur" (2 sec)
- Carte avec tracé polyline bleu
- Carte chauffeur (Photo, Plaque CH, Véhicule)

## Technologies

- **React 18** (via CDN)
- **TailwindCSS** (via CDN)
- **Babel** (transpilation JSX)
- **Service Worker** (offline support - résilient)

## Service Worker Résilient

Le Service Worker est configuré pour être **résilient** et s'installer même si certaines ressources sont manquantes.

### Stratégie de caching

```javascript
// Assets critiques - DOIVENT être cachés
const CRITICAL_ASSETS = ['/', '/index.html', '/manifest.json'];

// Assets optionnels - Nice to have (icônes PNG)
const OPTIONAL_ASSETS = ['/icons/icon-192x192.png', ...];
```

### Comportement

| Type d'asset | Méthode | Comportement si échec |
|--------------|---------|----------------------|
| Critique | `cache.addAll()` | Bloque l'installation |
| Optionnel | `Promise.allSettled()` | Continue quand même |

### Avantages

- L'app s'installe même si les icônes PNG n'existent pas
- Le mode offline fonctionne pour les fichiers critiques
- Logging détaillé pour le debugging

## Déploiement

### Développement local

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx serve .

# Avec PHP
php -S localhost:8000
```

### Production

Servir les fichiers via HTTPS pour activer le Service Worker et les fonctionnalités PWA.

## Données Suisses

### Villes incluses
- Zürich (ZH)
- Genève (GE)
- Basel (BS)
- Lausanne (VD)
- Bern (BE)
- Winterthur (ZH)
- Luzern (LU)
- St. Gallen (SG)
- Lugano (TI)
- Fribourg (FR)

### Destinations Européennes
- France : Paris, Lyon, Marseille, Nice, Chamonix
- Italie : Milano, Roma, Torino
- Allemagne : München, Frankfurt, Stuttgart
- Autriche : Wien, Salzburg
- Autres : Amsterdam, Brussels, Monaco

## Structure

```
pwa-react/
├── index.html          # Application React complète
├── manifest.json       # Configuration PWA
├── service-worker.js   # Support offline
├── icons/
│   └── icon.svg        # Logo Romuo.ch
└── README.md
```

## Licence

Propriétaire - Romuo.ch
