# ROMUO - Système de Redirection Intelligent

## Vue d'ensemble

Ce système gère les redirections intelligentes entre le site vitrine `romuo.ch` et l'application `app.romuo.ch`, avec passage de paramètres, tracking des conversions et fallback élégant.

## Installation

### Site Vitrine (romuo.ch)

```html
<!-- Avant </body> -->
<script src="/js/romuo-redirect.js"></script>
```

### Application (app.romuo.ch)

```html
<!-- Avant </body> -->
<script src="/js/romuo-redirect.js"></script>
```

Le script s'initialise automatiquement et détecte sur quel domaine il s'exécute.

## Utilisation

### 1. Redirection vers l'App

#### Bouton "Réserver" avec pré-remplissage

```html
<button onclick="Romuo.redirectToApp({
  depart: 'Gare de Genève',
  arrival: 'Aéroport de Genève',
  canton: 'GE',
  vehicle: 'premium',
  estimate: '85.50'
})">
  Réserver maintenant
</button>
```

#### Ouvrir dans un nouvel onglet

```html
<button onclick="Romuo.redirectToApp({}, { newTab: true })">
  Ouvrir l'application
</button>
```

#### Redirection vers une section spécifique

```html
<button onclick="Romuo.redirectToApp({ vehicle: 'van' }, { section: 'flotte' })">
  Voir notre flotte
</button>
```

### 2. Scroll vers une section (site vitrine)

```html
<!-- Reste sur romuo.ch et scroll vers #tarifs -->
<button onclick="Romuo.scrollToSection('tarifs')">
  Voir les tarifs
</button>

<button onclick="Romuo.scrollToSection('contact', { offset: -100 })">
  Nous contacter
</button>
```

### 3. Format de l'URL générée

```
https://app.romuo.ch/reservation?depart=Gare%20de%20Gen%C3%A8ve&arrival=A%C3%A9roport&canton=GE&vehicle=premium&estimate=85.50&_sid=rs_xyz123&_src=%2Fhomepage&_ts=1703520000000
```

**Paramètres système ajoutés automatiquement:**
- `_sid`: ID de session pour tracking cross-domain
- `_src`: Page source de la redirection
- `_ts`: Timestamp pour cache-busting

### 4. Récupérer les paramètres (côté app)

L'application parse automatiquement les paramètres et pré-remplit les formulaires.

Pour un traitement personnalisé:

```javascript
// Écouter l'événement de chargement des paramètres
Romuo.on('params_loaded', (params) => {
  console.log('Paramètres reçus:', params);

  // Traitement personnalisé
  if (params.estimate) {
    document.getElementById('price-display').textContent = `CHF ${params.estimate}`;
  }
});
```

### 5. Session Persistante

#### Sauvegarder une simulation

```javascript
// Sur le site vitrine après une simulation
Romuo.savePendingReservation({
  depart: 'Zürich HB',
  arrival: 'Flughafen Zürich',
  date: '2024-12-25',
  time: '14:30',
  vehicle: 'berline',
  estimate: 75.00
});
```

#### Récupérer la réservation en cours

```javascript
const pending = Romuo.getPendingReservation();
if (pending) {
  console.log('Réservation en cours:', pending);
}
```

#### Effacer après réservation

```javascript
// Après confirmation de la réservation
Romuo.clearPendingReservation();
```

### 6. Tracking des Conversions

#### Événements automatiques

Le système track automatiquement:
- `page_view`: Chaque visite de page
- `redirect_to_app`: Clic vers l'application
- `form_prefilled`: Formulaire pré-rempli depuis paramètres URL
- `continue_banner_shown`: Banner "Continuer la réservation" affiché
- `fallback_modal_shown`: Modal d'indisponibilité affiché
- `contact_form_submitted`: Formulaire de contact soumis
- `callback_requested`: Demande de rappel

#### Événements personnalisés

```javascript
// Tracker un événement custom
Romuo.trackEvent('simulation_completed', {
  vehicle: 'premium',
  distance_km: 45,
  price: 120.50
});

// Tracker une conversion
Romuo.trackConversion('booking_started', {
  source: 'homepage_cta',
  value: 85.50
});
```

#### Analyser le funnel

```javascript
const timeToConversion = Romuo.getTimeToConversion();
if (timeToConversion) {
  console.log(`Temps jusqu'à conversion: ${timeToConversion.hours}h`);
  console.log(`Points de contact: ${timeToConversion.touchpoints}`);
}
```

### 7. Fallback si App Indisponible

Le système vérifie automatiquement la disponibilité de l'app:

```javascript
// Vérification manuelle
const isAvailable = await Romuo.checkAppAvailability();
if (!isAvailable) {
  console.log('App indisponible');
}
```

Si l'app est down, un modal s'affiche automatiquement proposant:
- Appeler directement (avec lien tel: sur mobile)
- Formulaire de contact
- Demande de rappel

### 8. Configuration

```javascript
// Configuration personnalisée (optionnel)
window.RomuoConfig = {
  SHOWCASE_DOMAIN: 'romuo.ch',
  APP_DOMAIN: 'app.romuo.ch',
  APP_URL: 'https://app.romuo.ch',
  PHONE_NUMBER: '+41 22 123 45 67',
  HEALTH_CHECK_TIMEOUT: 5000,
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24h
};
```

## API Complète

### Romuo.redirectToApp(params, options)

Redirige vers l'application avec paramètres.

**params** (Object):
- `depart` - Adresse de départ
- `arrival` - Adresse d'arrivée
- `canton` - Code canton (GE, VD, ZH...)
- `vehicle` - Type de véhicule (eco, berline, van, luxe)
- `date` - Date au format YYYY-MM-DD
- `time` - Heure au format HH:MM
- `passengers` - Nombre de passagers
- `estimate` - Prix estimé

**options** (Object):
- `newTab` (boolean, default: false) - Ouvrir dans nouvel onglet
- `section` (string, default: 'reservation') - Section de l'app
- `trackEvent` (boolean, default: true) - Tracker l'événement
- `fallbackOnError` (boolean, default: true) - Afficher fallback si erreur

### Romuo.scrollToSection(sectionId, options)

Scroll vers une section de la page.

**options**:
- `offset` (number, default: -80) - Offset vertical en pixels
- `behavior` (string, default: 'smooth') - Type d'animation

### Romuo.buildAppUrl(section, params)

Construit une URL vers l'app sans rediriger.

```javascript
const url = Romuo.buildAppUrl('reservation', { depart: 'Genève' });
// https://app.romuo.ch/reservation?depart=Gen%C3%A8ve&_sid=...
```

### Romuo.savePendingReservation(data)

Sauvegarde les données de réservation en cours.

### Romuo.getPendingReservation()

Récupère la réservation en cours (ou null).

### Romuo.clearPendingReservation()

Efface la réservation en cours.

### Romuo.trackEvent(name, data)

Track un événement personnalisé.

### Romuo.trackConversion(type, data)

Track une conversion.

### Romuo.getSession()

Retourne les infos de session.

### Romuo.on(eventName, callback)

Écoute un événement du système.

**Événements disponibles:**
- `params_loaded` - Paramètres URL parsés

### Romuo.encodeParams(params) / Romuo.decodeParams(queryString)

Encode/décode les paramètres URL.

### Romuo.isAppAvailable()

Retourne le dernier état de disponibilité (synchrone).

### Romuo.checkAppAvailability()

Vérifie la disponibilité (asynchrone).

## Mapping des Champs de Formulaire

Le système cherche automatiquement les champs par leur ID ou attribut:

| Paramètre URL | IDs recherchés |
|---------------|----------------|
| `depart` | pickup-address, departure, from |
| `arrival` | dropoff-address, destination, to |
| `canton` | canton-select, canton |
| `vehicle` | vehicle-type, vehicleType |
| `date` | pickup-date, date |
| `time` | pickup-time, time |
| `passengers` | passengers, pax |
| `estimate` | estimate-display, price |
| `name` | customer-name, name |
| `email` | customer-email, email |
| `phone` | customer-phone, phone |

## Synchronisation Cross-Domain

### Via Cookies

Un cookie `romuo_session_id` est partagé entre les sous-domaines:

```
Domain: .romuo.ch
Path: /
SameSite: Lax
```

### Via LocalStorage

Les données sont stockées avec le préfixe `romuo_`:
- `romuo_session` - Données de session
- `romuo_pending_reservation` - Réservation en cours
- `romuo_tracking` - Historique des événements
- `romuo_funnel` - Funnel de conversion

## Tests

Exécuter les tests unitaires:

```bash
cd frontend/js
node romuo-redirect.test.js
```

## Intégration Google Analytics

Le système envoie automatiquement les événements à GA4 si `gtag` est présent:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Exemples Complets

### Page d'accueil (romuo.ch)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <title>Romuo - VTC Suisse Premium</title>
</head>
<body>
  <header>
    <nav>
      <a href="#" onclick="Romuo.scrollToSection('services')">Services</a>
      <a href="#" onclick="Romuo.scrollToSection('tarifs')">Tarifs</a>
      <a href="#" onclick="Romuo.scrollToSection('flotte')">Notre Flotte</a>
      <a href="#" onclick="Romuo.redirectToApp({}, { newTab: true })">Application</a>
    </nav>
  </header>

  <section id="hero">
    <h1>Transport VTC Premium en Suisse</h1>
    <div id="quick-quote">
      <input type="text" id="hero-depart" placeholder="Départ">
      <input type="text" id="hero-arrival" placeholder="Arrivée">
      <button onclick="quickQuote()">Obtenir un devis</button>
    </div>
  </section>

  <section id="tarifs">
    <h2>Nos Tarifs</h2>
    <!-- ... -->
  </section>

  <script src="/js/romuo-redirect.js"></script>
  <script>
    function quickQuote() {
      const depart = document.getElementById('hero-depart').value;
      const arrival = document.getElementById('hero-arrival').value;

      if (depart && arrival) {
        Romuo.redirectToApp({
          depart,
          arrival,
          source: 'homepage_hero'
        });
      } else {
        alert('Veuillez remplir le départ et l\'arrivée');
      }
    }
  </script>
</body>
</html>
```

### Application (app.romuo.ch)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <title>Réserver - Romuo</title>
</head>
<body>
  <form id="booking-form">
    <input type="text" id="pickup-address" name="depart" placeholder="Adresse de départ">
    <input type="text" id="dropoff-address" name="arrival" placeholder="Adresse d'arrivée">
    <select id="canton-select" name="canton">
      <option value="GE">Genève</option>
      <option value="VD">Vaud</option>
      <!-- ... -->
    </select>
    <select id="vehicle-type" name="vehicle">
      <option value="eco">Eco</option>
      <option value="berline">Berline</option>
      <option value="premium">Premium</option>
      <option value="van">Van</option>
    </select>
    <input type="date" id="pickup-date" name="date">
    <input type="time" id="pickup-time" name="time">
    <input type="number" id="passengers" name="passengers" min="1" max="7" value="1">

    <div id="price-estimate">
      <span id="estimate-display">-</span>
    </div>

    <button type="submit">Confirmer la réservation</button>
  </form>

  <script src="/js/romuo-redirect.js"></script>
  <script>
    // Les champs sont automatiquement pré-remplis par Romuo

    // Traitement personnalisé si nécessaire
    Romuo.on('params_loaded', (params) => {
      console.log('Réservation pré-remplie:', params);

      // Afficher le prix estimé
      if (params.estimate) {
        document.getElementById('estimate-display').textContent = `CHF ${params.estimate}`;
      }

      // Tracker
      Romuo.trackEvent('booking_form_prefilled', {
        has_estimate: !!params.estimate,
        source: params._src
      });
    });

    // Confirmation de réservation
    document.getElementById('booking-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      // ... soumettre la réservation

      // Effacer la réservation en cours
      Romuo.clearPendingReservation();

      // Tracker la conversion
      Romuo.trackConversion('booking_completed', {
        value: parseFloat(document.getElementById('estimate-display').textContent.replace('CHF ', ''))
      });
    });
  </script>
</body>
</html>
```

## Support

Pour toute question ou problème, consultez les logs dans la console (préfixés par `[Romuo]`).
