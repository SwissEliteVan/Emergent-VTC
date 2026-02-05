# 🎨 Guide de Personnalisation Avancée

Ce guide est pour les développeurs qui souhaitent personnaliser davantage le thème.

## 🎨 Modifier les couleurs

### Fichier : `style.css`

```css
:root {
  /* Couleurs principales */
  --color-black: #000000;           /* Changez pour un noir plus doux */
  --color-anthracite: #1A1A1A;      /* Sections alternées */
  --color-dark-grey: #2A2A2A;       /* Nuances */
  
  /* Or - Changez pour bleu, argent, etc. */
  --color-gold: #D4AF37;            /* Couleur principale */
  --color-gold-hover: #F0C54A;      /* Survol */
  --color-gold-dark: #B8942D;       /* Ombres/dégradés */
  
  /* Textes */
  --color-white: #FFFFFF;
  --color-light-grey: #F5F5F5;
}
```

### Exemples de palettes alternatives :

**Bleu Corporate :**
```css
--color-gold: #1E90FF;
--color-gold-hover: #4DA6FF;
--color-gold-dark: #1873CC;
```

**Argent/Platine :**
```css
--color-gold: #C0C0C0;
--color-gold-hover: #D3D3D3;
--color-gold-dark: #A8A8A8;
```

**Rouge Luxe :**
```css
--color-gold: #DC143C;
--color-gold-hover: #FF1744;
--color-gold-dark: #B71C1C;
```

## 🔤 Modifier les polices

### Fichier : `style.css` (ligne 14)

```css
/* Changer les polices */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Lora:wght@400;700&display=swap');
```

Puis modifier les variables :
```css
:root {
  --font-primary: 'Roboto', sans-serif;
  --font-accent: 'Lora', serif;
}
```

### Polices recommandées :

**Modernes :**
- Primary: Poppins, Inter, Nunito
- Accent: Abril Fatface, Crimson Text

**Classiques :**
- Primary: Merriweather, Georgia
- Accent: Cinzel, Cormorant Garamond

**Minimalistes :**
- Primary: Work Sans, Raleway
- Accent: Oswald, Bebas Neue

## 📝 Ajouter des champs au formulaire

### Fichier : `functions.php` → fonction `vtc_booking_form_shortcode()`

Exemple : Ajouter un champ "Type de véhicule"

```php
<div class="vtc-form-group">
    <label class="vtc-form-label" for="vtc-vehicle-type">Type de véhicule</label>
    <select id="vtc-vehicle-type" name="vehicle_type" class="vtc-form-select" required>
        <option value="">Sélectionnez...</option>
        <option value="berline">Berline Executive</option>
        <option value="premiere">Première Classe</option>
        <option value="van">Van Premium</option>
    </select>
</div>
```

Puis dans la fonction `vtc_process_booking()`, ajoutez :

```php
$booking_data = array(
    // ... champs existants
    'vehicle_type' => sanitize_text_field($_POST['vehicle_type']),
);

// Dans le message email
$message .= "Type de véhicule: {$booking_data['vehicle_type']}\n";
```

## 🎬 Personnaliser les animations

### Fichier : `additional-styles.css`

Modifier la vitesse des animations :

```css
.vtc-service-card.vtc-animated {
  animation: fadeInUp 0.6s ease-out forwards;  /* Changez 0.6s */
}
```

Ajouter une nouvelle animation :

```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.mon-element {
  animation: slideInRight 0.8s ease-out;
}
```

## 🔧 Modifier le traitement du formulaire

### Fichier : `functions.php` → fonction `vtc_process_booking()`

#### Exemple 1 : Enregistrer dans la base de données

```php
function vtc_process_booking() {
    check_ajax_referer('vtc_booking_nonce', 'nonce');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'vtc_bookings';
    
    $booking_data = array(
        'pickup'      => sanitize_text_field($_POST['pickup']),
        'destination' => sanitize_text_field($_POST['destination']),
        // ... autres champs
    );
    
    // Insertion en base
    $wpdb->insert(
        $table_name,
        $booking_data,
        array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')
    );
    
    // ... envoi email
}
```

#### Exemple 2 : Webhook vers service externe

```php
// Après l'envoi d'email, ajouter :
$response = wp_remote_post('https://votre-api.com/webhook', array(
    'body' => json_encode($booking_data),
    'headers' => array('Content-Type' => 'application/json'),
));
```

## 🗺️ Ajouter Google Maps

### 1. Obtenir une clé API Google Maps

1. https://console.cloud.google.com/
2. Créez un projet
3. Activez "Maps JavaScript API"
4. Créez une clé API

### 2. Fichier : `functions.php`

```php
function vtc_enqueue_google_maps() {
    wp_enqueue_script(
        'google-maps',
        'https://maps.googleapis.com/maps/api/js?key=VOTRE_CLE_API&libraries=places',
        array(),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'vtc_enqueue_google_maps');
```

### 3. Fichier : `js/vtc-custom.js`

```javascript
// Autocomplete pour les adresses
function initAutocomplete() {
    const pickupInput = document.getElementById('vtc-pickup');
    const destInput = document.getElementById('vtc-destination');
    
    const autocompletePickup = new google.maps.places.Autocomplete(pickupInput, {
        componentRestrictions: { country: 'ch' },
        types: ['address']
    });
    
    const autocompleteDest = new google.maps.places.Autocomplete(destInput, {
        componentRestrictions: { country: 'ch' },
        types: ['address']
    });
}

// Appeler après chargement de l'API
google.maps.event.addDomListener(window, 'load', initAutocomplete);
```

## 💳 Ajouter Stripe pour paiement

### 1. Installer Stripe PHP

```bash
composer require stripe/stripe-php
```

### 2. Créer un champ de paiement

Dans `front-page.php`, ajoutez avant la fermeture du formulaire :

```php
<div id="card-element" class="vtc-form-input"></div>
<div id="card-errors" role="alert"></div>
```

### 3. JavaScript Stripe

```javascript
const stripe = Stripe('pk_test_VOTRE_CLE_PUBLIQUE');
const elements = stripe.elements();
const cardElement = elements.create('card', {
    style: {
        base: {
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            '::placeholder': { color: '#aab7c4' }
        }
    }
});
cardElement.mount('#card-element');
```

## 🌐 Multi-langue avec Polylang

### Installation

1. Installez le plugin "Polylang"
2. Ajoutez vos langues (FR, EN, DE, IT)

### Traduction des strings

Dans `functions.php`, toutes les strings sont déjà prêtes :

```php
__('Texte à traduire', 'vtc-premium-swiss')
```

Créez le fichier `.po/.mo` dans `/languages/`

## 📊 Ajouter Google Analytics

### Fichier : `functions.php`

```php
function vtc_add_google_analytics() {
    ?>
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'GA_MEASUREMENT_ID');
    </script>
    <?php
}
add_action('wp_head', 'vtc_add_google_analytics');
```

## 🎭 Créer une page de confirmation

### Fichier : `confirmation-page.php` (créer)

```php
<?php
/*
Template Name: Confirmation Réservation
*/
get_header(); ?>

<div class="vtc-confirmation-page">
    <div class="vtc-container">
        <div class="vtc-success-message">
            <div class="vtc-success-icon">✓</div>
            <h1>Réservation Confirmée !</h1>
            <p>Nous avons bien reçu votre demande de réservation.</p>
            <p>Un email de confirmation vous a été envoyé.</p>
            <a href="<?php echo home_url(); ?>" class="vtc-btn">Retour à l'accueil</a>
        </div>
    </div>
</div>

<?php get_footer(); ?>
```

### Redirection après soumission

Dans `js/vtc-custom.js`, décommentez la ligne :

```javascript
// Redirection optionnelle vers page de confirmation
window.location.href = '/confirmation';
```

## 🔐 Ajouter un captcha (sécurité)

### Google reCAPTCHA v3

1. Obtenez les clés sur : https://www.google.com/recaptcha/admin

2. Dans `functions.php` :

```php
function vtc_enqueue_recaptcha() {
    wp_enqueue_script(
        'google-recaptcha',
        'https://www.google.com/recaptcha/api.js?render=VOTRE_CLE_SITE',
        array(),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'vtc_enqueue_recaptcha');
```

3. Dans `js/vtc-custom.js`, avant l'envoi AJAX :

```javascript
grecaptcha.ready(function() {
    grecaptcha.execute('VOTRE_CLE_SITE', {action: 'booking'})
    .then(function(token) {
        formData.recaptcha_token = token;
        // ... envoi AJAX
    });
});
```

4. Validation côté serveur dans `vtc_process_booking()` :

```php
$recaptcha_token = $_POST['recaptcha_token'];
$recaptcha_secret = 'VOTRE_CLE_SECRETE';

$verify = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', array(
    'body' => array(
        'secret' => $recaptcha_secret,
        'response' => $recaptcha_token
    )
));

$response_body = json_decode(wp_remote_retrieve_body($verify));

if (!$response_body->success || $response_body->score < 0.5) {
    wp_send_json_error(array('message' => 'Vérification reCAPTCHA échouée'));
    return;
}
```

## 📱 Push Notifications (PWA)

Pour transformer en Progressive Web App, voir le projet `pwa-react` dans votre repo.

## 🎯 Tracking conversions

### Facebook Pixel

```php
function vtc_add_facebook_pixel() {
    ?>
    <script>
    !function(f,b,e,v,n,t,s){...}
    fbq('init', 'VOTRE_PIXEL_ID');
    fbq('track', 'PageView');
    </script>
    <?php
}
add_action('wp_head', 'vtc_add_facebook_pixel');
```

Puis dans `js/vtc-custom.js` après soumission réussie :

```javascript
if (typeof fbq !== 'undefined') {
    fbq('track', 'Lead', {
        content_name: 'Booking Form',
        value: 0.00,
        currency: 'CHF'
    });
}
```

---

**Ces personnalisations nécessitent des connaissances en développement web.**

Pour des modifications simples, référez-vous au README.md principal.
