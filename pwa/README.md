# Emergent VTC - Progressive Web App

Application PWA de réservation de VTC premium.

## Structure

```
pwa/
├── index.html          # Point d'entrée de l'application
├── styles.css          # Styles et Design System
├── app.js              # Logique JavaScript
├── service-worker.js   # Service Worker pour fonctionnalité offline
├── manifest.json       # Manifest PWA
├── icons/              # Icônes de l'application
│   └── icon.svg        # Icône source SVG
└── generate-icons.html # Outil de génération d'icônes PNG
```

## Fonctionnalités

### Navigation
- **Accueil** : Carte interactive et réservation de course
- **Activités** : Historique des courses passées
- **Compte** : Profil, paiement et parrainage

### Workflow de réservation
1. Splash Screen avec connexion/inscription
2. Carte CSS vectorielle interactive
3. Barre de recherche "Où allez-vous ?"
4. Panel de sélection de destination
5. Bottom Sheet avec choix de véhicule (Éco, Berline, Van)
6. Animation de recherche de chauffeur
7. Confirmation avec détails du chauffeur

### Design System
- **Couleurs** : Blanc (#FFFFFF), Noir (#000000), Bleu Nuit (#0F172A)
- **Typographie** : Inter (Sans-Serif)
- **Icônes** : SVG vectorielles uniquement (zéro emoji)
- **Finitions** : Ombres portées douces, coins arrondis

## Service Worker Résilient

Le Service Worker est configuré pour être **résilient** et s'installer même si certaines ressources sont manquantes.

### Stratégie de caching

```javascript
// Assets critiques - DOIVENT être cachés
const CRITICAL_ASSETS = ['/', '/index.html', '/styles.css', '/app.js'];

// Assets optionnels - Nice to have (icônes PNG)
const OPTIONAL_ASSETS = ['/icons/icon-192x192.png', ...];
```

### Comportement

1. **Assets critiques** : Utilise `cache.addAll()` - échec = erreur d'installation
2. **Assets optionnels** : Utilise `Promise.allSettled()` - échecs ignorés

Cela garantit que l'application fonctionne en mode offline même si les icônes PNG n'ont pas été générées.

## Installation

### 1. Générer les icônes PNG (Optionnel)

Ouvrir `generate-icons.html` dans un navigateur et sauvegarder chaque canvas en PNG dans le dossier `icons/`.

**Note**: Grâce au Service Worker résilient, l'app fonctionne même sans ces fichiers.

Tailles recommandées :
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### 2. Déploiement

Servir les fichiers via HTTPS pour activer le Service Worker :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js (npx serve)
npx serve .

# Avec PHP
php -S localhost:8000
```

### 3. Installation PWA

Sur mobile ou desktop compatible :
1. Ouvrir l'URL dans Chrome/Safari/Edge
2. Cliquer sur "Ajouter à l'écran d'accueil"
3. L'app s'installe comme une application native

## API Backend (à implémenter)

L'application est prête à être connectée à une API backend :

```javascript
// Exemple d'endpoints attendus
POST /api/auth/login
POST /api/auth/register
GET  /api/rides/history
POST /api/rides/book
GET  /api/rides/:id/status
POST /api/rides/:id/cancel
```

## Personnalisation

### Modifier le logo
Éditer `icons/icon.svg` et régénérer les PNG.

### Modifier les couleurs
Éditer les variables CSS dans `styles.css` :
```css
:root {
    --color-primary: #0F172A;
    --color-white: #FFFFFF;
    ...
}
```

### Modifier les prix
Les prix sont calculés dynamiquement dans `app.js` selon la distance.

## Licence

Propriétaire - Emergent VTC
