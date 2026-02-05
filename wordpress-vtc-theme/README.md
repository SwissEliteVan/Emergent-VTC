# 🚗 VTC Premium Swiss - Thème WordPress

Thème enfant WordPress premium pour service de chauffeur privé suisse avec design noir, or et minimaliste.

![Version](https://img.shields.io/badge/version-1.0.0-gold)
![WordPress](https://img.shields.io/badge/WordPress-6.0%2B-blue)
![License](https://img.shields.io/badge/license-GPL%202.0-green)

## ✨ Caractéristiques

- 🎨 **Design Premium** : Palette noir (#000000), anthracite (#1A1A1A) et or (#D4AF37)
- 💎 **Effet Glassmorphism** : Formulaire de réservation flottant avec effet de verre
- 📱 **100% Responsive** : Optimisé pour tous les appareils
- 🚀 **Performance** : Code léger et optimisé
- 🔒 **Sécurisé** : Protection AJAX et validation des données
- 🌐 **Google Fonts** : Montserrat et Playfair Display
- ✉️ **Formulaire AJAX** : Soumission sans rechargement de page
- 🎭 **Animations** : Effets au scroll et transitions fluides

## 📋 Prérequis

- WordPress 6.0 ou supérieur
- PHP 7.4 ou supérieur
- Thème parent : **Twenty Twenty-Four** (ou autre thème compatible)

## 🚀 Installation

### Option 1 : Installation via FTP

1. **Téléchargez les fichiers** du thème

2. **Connectez-vous à votre serveur** via FTP (FileZilla, WinSCP, etc.)

3. **Naviguez vers** `/wp-content/themes/`

4. **Uploadez le dossier** `wordpress-vtc-theme` dans ce répertoire

5. **Renommez le dossier** (optionnel) en quelque chose comme `vtc-premium-swiss`

### Option 2 : Installation via ZIP

1. **Compressez le dossier** `wordpress-vtc-theme` en fichier ZIP

2. **Dans WordPress** :
   - Allez dans `Apparence > Thèmes`
   - Cliquez sur `Ajouter`
   - Cliquez sur `Téléverser un thème`
   - Sélectionnez votre fichier ZIP
   - Cliquez sur `Installer maintenant`

3. **Activez le thème** une fois l'installation terminée

## ⚙️ Configuration

### 1. Activer le thème

1. Dans WordPress, allez dans `Apparence > Thèmes`
2. Trouvez "VTC Premium Swiss"
3. Cliquez sur `Activer`

### 2. Configurer les paramètres

Allez dans `Apparence > Personnaliser > Paramètres VTC`

#### Configuration disponible :

- **Image de fond (Hero)** : Téléchargez une image de voiture de luxe
  - Taille recommandée : 1920x1080px
  - Format : JPG ou PNG
  - Exemple : Mercedes S-Class sombre, BMW Série 7

- **Numéro de téléphone** : `+41 XX XXX XX XX`
- **Email de contact** : Recevra les réservations
- **Titre Hero** : Par défaut "Chauffeur Privé Suisse"
- **Sous-titre Hero** : Par défaut "Élégance, Ponctualité, Discrétion"

### 3. Créer la page d'accueil

1. **Créer une nouvelle page** :
   - Allez dans `Pages > Ajouter`
   - Titre : "Accueil" ou "Home"
   - Ne mettez aucun contenu (géré par le template)
   - **Important** : Sélectionnez le modèle "VTC Homepage" dans l'encadré "Attributs de la page"

2. **Définir comme page d'accueil** :
   - Allez dans `Réglages > Lecture`
   - Sélectionnez "Une page statique"
   - Page d'accueil : Choisissez votre page "Accueil"
   - Enregistrez

### 4. Créer le menu

1. **Créer un menu** :
   - Allez dans `Apparence > Menus`
   - Créez un nouveau menu "Menu Principal"
   - Ajoutez vos liens (Accueil, Services, Tarifs, Contact...)
   - Emplacement : Cochez "Menu Principal"

### 5. Ajouter votre logo (optionnel)

1. Allez dans `Apparence > Personnaliser > Identité du site`
2. Cliquez sur "Sélectionner un logo"
3. Téléchargez votre logo (recommandé : 300x100px, fond transparent PNG)

## 📸 Image Hero recommandée

### Où trouver des images gratuites de qualité :

1. **Unsplash** : https://unsplash.com/s/photos/luxury-car
2. **Pexels** : https://www.pexels.com/search/luxury%20car/
3. **Pixabay** : https://pixabay.com/images/search/luxury-car/

### Mots-clés de recherche :
- "luxury car dark"
- "mercedes s class"
- "bmw 7 series"
- "chauffeur car"
- "black limousine"

### Recommandations :
- Préférez des images sombres (voiture noire/grise)
- Arrière-plan sobre (ville de nuit, aéroport)
- Haute résolution (min 1920x1080px)
- Format paysage

## 🎨 Personnalisation avancée

### Modifier les couleurs

Éditez `/style.css` lignes 19-26 :

```css
:root {
  --color-black: #000000;        /* Fond principal */
  --color-anthracite: #1A1A1A;   /* Sections alternées */
  --color-gold: #D4AF37;         /* Couleur accent */
  --color-gold-hover: #F0C54A;   /* Survol or */
  /* ... */
}
```

### Modifier les polices

Éditez `/style.css` ligne 14 pour changer les Google Fonts :

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
```

### Personnaliser le formulaire

Éditez `/functions.php` dans la fonction `vtc_booking_form_shortcode()` pour :
- Ajouter/supprimer des champs
- Modifier les placeholders
- Changer les labels

## 📧 Configuration Email

### Recevoir les réservations par email

1. Assurez-vous que votre serveur peut envoyer des emails
2. Installez un plugin SMTP (recommandé) :
   - **WP Mail SMTP** (gratuit)
   - **Easy WP SMTP** (gratuit)

3. Configurez votre email dans `Apparence > Personnaliser > Paramètres VTC`

### Test d'envoi d'emails

1. Installez le plugin "Check Email" ou "WP Mail Logging"
2. Faites un test de réservation
3. Vérifiez les logs

## 🔌 Plugins recommandés

### Essentiels :
- **WP Mail SMTP** : Pour les emails fiables
- **Contact Form 7** : Formulaires supplémentaires (si besoin)
- **Wordfence Security** : Sécurité
- **UpdraftPlus** : Sauvegardes

### Performance :
- **WP Rocket** : Cache et optimisation (payant)
- **Autoptimize** : Minification CSS/JS (gratuit)
- **Imagify** : Compression d'images

### SEO :
- **Yoast SEO** ou **Rank Math** : Référencement

## 📱 Responsive Design

Le thème est optimisé pour :
- 📱 Mobile (320px - 480px)
- 📱 Tablet (481px - 768px)
- 💻 Desktop (769px+)

Testez sur : https://responsivedesignchecker.com/

## 🐛 Dépannage

### Le formulaire ne s'affiche pas

1. Vérifiez que jQuery est chargé
2. Ouvrez la console du navigateur (F12) et cherchez des erreurs
3. Vérifiez que le thème parent est bien activé

### Les emails ne sont pas reçus

1. Testez avec le plugin "Check Email"
2. Vérifiez votre dossier SPAM
3. Installez WP Mail SMTP et configurez-le
4. Contactez votre hébergeur pour activer l'envoi d'emails

### Les styles ne s'appliquent pas

1. Videz le cache de WordPress
2. Videz le cache du navigateur (Ctrl + F5)
3. Si vous utilisez un plugin de cache, purgez-le
4. Vérifiez que `style.css` et `additional-styles.css` sont bien chargés

### L'image Hero ne s'affiche pas

1. Vérifiez que l'image est bien uploadée dans le Customizer
2. Taille maximale du fichier : vérifiez `upload_max_filesize` dans PHP
3. Compressez l'image si elle est trop lourde (utilisez TinyPNG.com)

### Menu mobile ne fonctionne pas

1. Vérifiez que jQuery est chargé
2. Ouvrez la console (F12) et cherchez des erreurs JavaScript
3. Testez la désactivation temporaire des autres plugins

## 📁 Structure des fichiers

```
wordpress-vtc-theme/
├── style.css                  # Styles principaux + header du thème
├── additional-styles.css      # Styles pour sections (services, flotte)
├── functions.php              # Fonctions PHP et logique
├── front-page.php            # Template page d'accueil
├── README.md                 # Ce fichier
├── screenshot.png            # Capture d'écran (à ajouter)
└── js/
    └── vtc-custom.js         # JavaScript personnalisé
```

## 🎯 Utilisation du formulaire

### Shortcode

Vous pouvez utiliser le formulaire n'importe où avec :

```
[vtc_booking_form]
```

### Dans une page :
1. Éditez une page
2. Ajoutez un bloc "Shortcode"
3. Collez `[vtc_booking_form]`

### Dans le code :
```php
<?php echo do_shortcode('[vtc_booking_form]'); ?>
```

## 🔄 Mises à jour

Pour mettre à jour le thème :

1. **Sauvegardez** votre thème actuel
2. **Notez** vos personnalisations
3. **Remplacez** les fichiers
4. **Réappliquez** vos personnalisations si nécessaire

💡 **Astuce** : Créez un thème enfant du thème enfant pour vos modifications personnelles !

## 🆘 Support

### Problèmes courants

1. **Thème parent manquant** : Installez Twenty Twenty-Four
2. **Erreur 500** : Vérifiez les permissions des fichiers (644 pour les fichiers, 755 pour les dossiers)
3. **Page blanche** : Activez le débogage WordPress dans `wp-config.php`

### Activer le mode debug

Éditez `wp-config.php` :

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Les erreurs seront enregistrées dans `/wp-content/debug.log`

## 📝 Licence

Ce thème est sous licence GPL v2 ou ultérieure.

## 🎓 Crédits

- **Google Fonts** : Montserrat & Playfair Display
- **Icons** : Emojis Unicode
- **Inspiration** : Services de chauffeur privé suisse premium

## 🚀 Pour aller plus loin

### Intégrations possibles :

1. **Google Maps** : Afficher les zones de service
2. **Calendrier** : Flatpickr pour sélection de dates avancée
3. **Paiement** : Stripe, PayPal pour prépaiement
4. **CRM** : Connexion à votre système de gestion
5. **SMS** : Notifications par SMS (Twilio)

### Personnalisations avancées :

- Calculateur de prix en temps réel
- Suivi de réservation en ligne
- Espace client
- Multi-langue (WPML, Polylang)
- Système de notation client

---

**Créé avec ❤️ pour les chauffeurs privés suisses**

*Version 1.0.0 - Février 2026*
