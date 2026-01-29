# 🚗 Romuo.ch - Application VTC Premium

Application web moderne de réservation VTC pour la région de Vevey et Montreux (Suisse).

## 📋 Table des Matières

- [Technologies](#technologies)
- [Installation Locale](#installation-locale)
- [Structure du Projet](#structure-du-projet)
- [Déploiement Automatique](#déploiement-automatique)
- [Configuration Hostinger](#configuration-hostinger)
- [Développement](#développement)

---

## 🛠️ Technologies

### Frontend
- **React 18** - Bibliothèque UI moderne
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utilitaire
- **React-Leaflet** - Cartographie interactive avec OpenStreetMap
- **Lucide React** - Icônes modernes
- **Axios** - Client HTTP pour l'API

### DevOps
- **GitHub Actions** - CI/CD automatisé
- **FTP Deploy** - Déploiement vers Hostinger

---

## 💻 Installation Locale

### Prérequis
- Node.js 20.x ou supérieur
- npm ou yarn

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/SwissEliteVan/Emergent-VTC.git
cd Emergent-VTC/frontend-romuo

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Ouvrir dans le navigateur
# L'application sera disponible sur http://localhost:3000
```

### Commandes disponibles

```bash
npm run dev       # Démarrer le serveur de développement
npm run build     # Build pour la production
npm run preview   # Prévisualiser le build de production
npm run lint      # Linter le code
```

---

## 📁 Structure du Projet

```
frontend-romuo/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow GitHub Actions
├── public/
│   └── romuo-icon.svg          # Favicon et icônes
├── src/
│   ├── components/
│   │   ├── InteractiveMap.jsx  # Carte Leaflet
│   │   ├── Sidebar.jsx         # Barre latérale avec formulaire
│   │   └── VehicleCard.jsx     # Card de sélection véhicule
│   ├── utils/
│   │   └── vehicles.js         # Données des véhicules
│   ├── App.jsx                 # Composant principal
│   ├── main.jsx                # Point d'entrée React
│   └── index.css               # Styles Tailwind
├── index.html                  # Template HTML
├── package.json                # Dépendances npm
├── vite.config.js              # Configuration Vite
├── tailwind.config.js          # Configuration Tailwind
├── postcss.config.js           # Configuration PostCSS
└── README.md                   # Ce fichier
```

---

## 🚀 Déploiement Automatique

### Comment ça fonctionne ?

Le déploiement est **100% automatisé** via GitHub Actions :

1. **Push sur `main`** → Déclenche le workflow
2. **GitHub Actions** :
   - Installe les dépendances
   - Build le projet (`npm run build`)
   - Crée le dossier `dist/`
3. **FTP Deploy** :
   - Transfère le contenu de `dist/` vers Hostinger
   - Votre site est live ! 🎉

### Configuration des Secrets GitHub

Pour que le déploiement fonctionne, vous devez configurer **4 secrets** dans votre repository GitHub :

#### Étapes détaillées :

1. **Aller sur GitHub** → Votre repository
2. **Settings** → **Secrets and variables** → **Actions**
3. **Cliquer sur "New repository secret"**
4. **Ajouter ces 4 secrets :**

| Secret Name | Description | Exemple |
|-------------|-------------|---------|
| `FTP_SERVER` | Adresse du serveur FTP Hostinger | `ftp.votredomaine.com` ou `123.456.789.10` |
| `FTP_USERNAME` | Nom d'utilisateur FTP | `u123456789` |
| `FTP_PASSWORD` | Mot de passe FTP | `VotreMotDePasseSecurise123!` |
| `FTP_SERVER_DIR` | Répertoire cible sur le serveur | `/public_html/` ou `/domains/romuo.ch/public_html/` |

---

## 🔧 Configuration Hostinger

### Étape 1 : Obtenir vos identifiants FTP

1. **Connectez-vous à Hostinger**
2. **Panel Hostinger** → **Fichiers** → **Gestionnaire FTP**
3. **Créer un compte FTP** ou utiliser le compte existant
4. **Noter les informations :**
   - Serveur FTP : `ftp.votredomaine.com`
   - Nom d'utilisateur : `u123456789`
   - Mot de passe : (celui que vous avez défini)
   - Port : `21` (standard FTP)

### Étape 2 : Identifier le répertoire cible

Le répertoire cible dépend de votre configuration Hostinger :

**Option A - Site principal :**
```
/public_html/
```

**Option B - Sous-domaine ou domaine additionnel :**
```
/domains/romuo.ch/public_html/
```

**Option C - Sous-dossier :**
```
/public_html/romuo/
```

### Étape 3 : Configuration .htaccess pour React Router (Important!)

Créez un fichier `.htaccess` dans votre dossier cible avec ce contenu :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Compression Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Cache des assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 🎨 Design & Personnalisation

### Couleurs de Marque

Les couleurs sont définies dans `tailwind.config.js` :

```javascript
colors: {
  primary: '#D4AF37',  // Or classique
  dark: '#1A1A1A',     // Anthracite
}
```

### Modifier les véhicules

Les véhicules sont définis dans `src/utils/vehicles.js` :

```javascript
export const VEHICLE_TYPES = [
  {
    id: 'eco',
    name: 'Eco',
    basePrice: 6,
    pricePerKm: 3,
    // ...
  }
]
```

### Modifier la zone de service

Dans `src/components/InteractiveMap.jsx`, modifier les points d'intérêt :

```javascript
const POINTS_OF_INTEREST = [
  {
    name: 'Vevey',
    position: [46.4607, 6.8427],
    // ...
  }
]
```

---

## 🔗 Intégration Backend (API)

### Configuration de l'API

Pour connecter le frontend à votre backend FastAPI :

1. **Créer un fichier `.env` à la racine :**

```env
VITE_API_URL=https://api.romuo.ch
```

2. **Utiliser l'API dans vos composants :**

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Exemple : Calculer le prix d'une course
const calculatePrice = async (pickup, destination, vehicleType) => {
  const response = await axios.post(`${API_URL}/api/rides/calculate`, {
    pickup_location: pickup,
    destination: destination,
    vehicle_type: vehicleType
  });
  return response.data;
};
```

3. **Intégrer dans `Sidebar.jsx` :**

```javascript
const handleBooking = async () => {
  const price = await calculatePrice(pickup, destination, selectedVehicle);
  // ...
};
```

---

## 📱 Responsive Design

L'application est optimisée pour **Desktop First** comme demandé, mais peut être adaptée pour mobile :

### Adaptation Mobile (Optionnelle)

Dans `tailwind.config.js` et les composants, vous pouvez ajouter des breakpoints :

```jsx
<div className="flex flex-col lg:flex-row">
  {/* Mobile: stack vertical, Desktop: split horizontal */}
</div>
```

---

## 🐛 Dépannage

### Le déploiement échoue

**Problème :** Erreur FTP dans GitHub Actions

**Solutions :**
1. Vérifier que les secrets sont correctement configurés
2. Tester la connexion FTP avec un client comme FileZilla
3. Vérifier les permissions du dossier cible sur Hostinger

### La carte ne s'affiche pas

**Problème :** Carte Leaflet blanche

**Solutions :**
1. Vérifier que le CSS Leaflet est bien chargé dans `index.html`
2. Ouvrir la console navigateur pour voir les erreurs
3. Vérifier que les tiles OpenStreetMap sont accessibles

### Les styles ne s'appliquent pas

**Problème :** Tailwind ne fonctionne pas

**Solutions :**
1. Vérifier que `npm run build` compile sans erreur
2. Purger le cache : `rm -rf node_modules dist && npm install && npm run build`
3. Vérifier `tailwind.config.js` et `postcss.config.js`

---

## 📄 Licence

© 2026 Romuo.ch - Tous droits réservés

---

## 👥 Support

Pour toute question ou problème :

- **Email :** support@romuo.ch
- **GitHub Issues :** [Créer une issue](https://github.com/SwissEliteVan/Emergent-VTC/issues)

---

## 🚀 Prochaines Étapes

### Fonctionnalités à venir

- [ ] Authentification utilisateur (Login/Signup)
- [ ] Paiement en ligne (Stripe/Twint)
- [ ] Suivi en temps réel des courses
- [ ] Notifications push
- [ ] Historique des courses
- [ ] Programme de fidélité
- [ ] Application mobile (React Native)

### Optimisations

- [ ] PWA (Progressive Web App)
- [ ] Lazy loading des composants
- [ ] Optimisation des images
- [ ] Analytics (Google Analytics / Plausible)
- [ ] SEO avancé
- [ ] Tests automatisés (Jest/Vitest)

---

**Développé avec ❤️ pour Romuo.ch**
