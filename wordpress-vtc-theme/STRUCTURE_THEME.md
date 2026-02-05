# 📁 Structure du Thème VTC Premium Swiss

## Vue d'ensemble de l'architecture

```
wordpress-vtc-theme/
│
├── 📄 style.css                          # ⭐ OBLIGATOIRE - Header + Styles principaux
├── 📄 functions.php                      # ⭐ OBLIGATOIRE - Logique PHP
├── 📄 front-page.php                     # Template page d'accueil
├── 📄 additional-styles.css              # Styles sections (services, flotte)
│
├── 📁 js/
│   └── 📄 vtc-custom.js                  # JavaScript formulaire + animations
│
├── 📄 README.md                          # Documentation complète
├── 📄 INSTALLATION_RAPIDE.md             # Guide installation 5 min
├── 📄 PERSONNALISATION_AVANCEE.md        # Guide développeurs
├── 📄 STRUCTURE_THEME.md                 # Ce fichier
└── 📄 screenshot-info.txt                # Instructions screenshot

📄 screenshot.png                          # À AJOUTER (1200x900px)
```

## 🔑 Fichiers Essentiels

### 1. [`style.css`](style.css:1) - Le cœur du design

**Rôle :** Définit le thème dans WordPress + tous les styles visuels

**Contenu :**
- ✅ Header WordPress (lignes 1-12) - **OBLIGATOIRE**
- ✅ Import Google Fonts
- ✅ Variables CSS (couleurs, polices, espacements)
- ✅ Styles Hero Section
- ✅ Formulaire Glassmorphism
- ✅ Responsive design
- ✅ Import additional-styles.css

**À modifier pour :**
- Changer nom du thème (ligne 2)
- Changer thème parent (ligne 5)
- Modifier les couleurs (lignes 19-26)
- Changer les polices (ligne 14)

### 2. [`functions.php`](functions.php:1) - La logique

**Rôle :** Toutes les fonctionnalités PHP du thème

**Contenu :**
- ✅ Chargement des styles et scripts
- ✅ Support thème (logos, menus, images)
- ✅ Désactivation des commentaires
- ✅ WordPress Customizer (paramètres VTC)
- ✅ Shortcode formulaire `[vtc_booking_form]`
- ✅ Traitement AJAX des réservations
- ✅ Envoi d'emails
- ✅ Widgets footer

**À modifier pour :**
- Ajouter des champs au formulaire (ligne 144+)
- Modifier l'email de réception (ligne 245)
- Ajouter des paramètres Customizer (ligne 137+)

### 3. [`front-page.php`](front-page.php:1) - Page d'accueil

**Rôle :** Template de la landing page immersive

**Contenu :**
- ✅ Hero Section avec image de fond
- ✅ Formulaire de réservation (shortcode)
- ✅ Section Services (4 cartes)
- ✅ Section Flotte (3 véhicules)
- ✅ Section Avantages (4 points)

**À modifier pour :**
- Changer les textes des sections
- Ajouter/supprimer des sections
- Modifier les services/véhicules

### 4. [`js/vtc-custom.js`](js/vtc-custom.js:1) - Interactions

**Rôle :** Toutes les interactions JavaScript

**Contenu :**
- ✅ Soumission AJAX du formulaire
- ✅ Affichage messages succès/erreur
- ✅ Défilement fluide
- ✅ Animations au scroll (IntersectionObserver)
- ✅ Validation formulaire
- ✅ Effet parallaxe hero
- ✅ Menu mobile responsive

**À modifier pour :**
- Ajouter une validation personnalisée
- Modifier les animations
- Ajouter Google Maps autocomplete

### 5. [`additional-styles.css`](additional-styles.css:1) - Styles sections

**Rôle :** Styles complémentaires pour sections non-hero

**Contenu :**
- ✅ Styles sections (Services, Flotte, Avantages)
- ✅ Cartes et grilles
- ✅ Animations keyframes
- ✅ Messages formulaire
- ✅ États loading/erreur
- ✅ Menu mobile

**À modifier pour :**
- Personnaliser l'apparence des sections
- Ajouter de nouvelles animations

## 🎯 Flux de Fonctionnement

### Chargement de la page

```
1. WordPress charge style.css
   └─> Détecte le thème "VTC Premium Swiss"
   
2. functions.php s'exécute
   └─> Charge les styles (style.css + additional-styles.css)
   └─> Charge le JS (vtc-custom.js)
   └─> Enregistre le shortcode [vtc_booking_form]
   
3. front-page.php affiche le contenu
   └─> Hero avec image de fond
   └─> Appelle le shortcode [vtc_booking_form]
   └─> Affiche les sections
   
4. vtc-custom.js initialise
   └─> Configure le formulaire AJAX
   └─> Active les animations au scroll
```

### Soumission du formulaire

```
1. Utilisateur remplit et soumet le formulaire
   
2. vtc-custom.js intercepte (preventDefault)
   └─> Récupère les données
   └─> Désactive le bouton
   └─> Envoie via AJAX à WordPress
   
3. functions.php > vtc_process_booking() reçoit
   └─> Vérifie le nonce (sécurité)
   └─> Nettoie les données (sanitize)
   └─> Envoie un email
   └─> Retourne succès/erreur en JSON
   
4. vtc-custom.js reçoit la réponse
   └─> Affiche message succès/erreur
   └─> Réinitialise le formulaire si succès
   └─> Réactive le bouton
```

## 🎨 Hiérarchie des Styles

```
1. Thème parent (Twenty Twenty-Four)
   └─> Styles de base WordPress
   
2. style.css (VTC Premium Swiss)
   └─> Variables CSS
   └─> Reset et base
   └─> Header/Navigation
   └─> Hero Section
   └─> Formulaire Glassmorphism
   └─> Boutons
   └─> Footer
   └─> Responsive
   
3. additional-styles.css
   └─> Sections (Services, Flotte, Avantages)
   └─> Animations
   └─> États (loading, erreur)
   └─> Menu mobile
```

## 📊 Dépendances

```
WordPress 6.0+
    └─> Thème Parent: Twenty Twenty-Four
        └─> VTC Premium Swiss (ce thème)
            ├─> jQuery (inclus dans WordPress)
            ├─> Google Fonts (Montserrat, Playfair Display)
            └─> AJAX WordPress (admin-ajax.php)
```

## 🔧 Hooks WordPress Utilisés

### Actions
- `wp_enqueue_scripts` - Charge CSS/JS
- `after_setup_theme` - Configuration du thème
- `admin_menu` - Retire les commentaires de l'admin
- `customize_register` - Ajoute paramètres Customizer
- `widgets_init` - Enregistre zones de widgets
- `wp_ajax_vtc_booking` - Traite le formulaire (connecté)
- `wp_ajax_nopriv_vtc_booking` - Traite le formulaire (non-connecté)

### Filtres
- `comments_open` - Désactive les commentaires
- `pings_open` - Désactive les pings
- `use_block_editor_for_post` - Désactive Gutenberg pour accueil

### Shortcodes
- `[vtc_booking_form]` - Affiche le formulaire

## 📝 Variables Customizer WordPress

Accessibles via `Apparence > Personnaliser > Paramètres VTC` :

| Variable | Fonction PHP | Défaut |
|----------|--------------|--------|
| Image Hero | `get_theme_mod('vtc_hero_image')` | - |
| Téléphone | `get_theme_mod('vtc_phone')` | "+41 XX XXX XX XX" |
| Email | `get_theme_mod('vtc_email')` | "contact@votrevtc.ch" |
| Titre Hero | `get_theme_mod('vtc_hero_title')` | "Chauffeur Privé Suisse" |
| Sous-titre | `get_theme_mod('vtc_hero_subtitle')` | "Élégance, Ponctualité..." |

## 🎨 Variables CSS Disponibles

Utilisables partout dans vos styles personnalisés :

```css
var(--color-black)          /* #000000 */
var(--color-anthracite)     /* #1A1A1A */
var(--color-gold)           /* #D4AF37 */
var(--color-gold-hover)     /* #F0C54A */
var(--font-primary)         /* Montserrat */
var(--font-accent)          /* Playfair Display */
var(--spacing-sm)           /* 1rem */
var(--spacing-md)           /* 2rem */
var(--transition)           /* Transition fluide */
var(--shadow-gold)          /* Ombre dorée */
```

## 🔒 Sécurité Implémentée

- ✅ **Nonce AJAX** : Protection CSRF
- ✅ **Sanitization** : Nettoyage de toutes les entrées utilisateur
- ✅ **Validation email** : `sanitize_email()`
- ✅ **Échappement sortie** : `esc_html()`, `esc_url()`
- ✅ **Vérification capacités** : Accès admin protégé
- ✅ **No direct access** : `!defined('ABSPATH')`

## 📱 Points de Rupture Responsive

```css
/* Mobile */
@media (max-width: 480px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
/* Pas de media query = default desktop */
```

## 🚀 Ordre de Chargement

1. WordPress charge le thème parent
2. `style.css` (header lu par WordPress)
3. `functions.php` s'exécute
4. Enqueue de `parent-style` (thème parent)
5. Enqueue de `vtc-child-style` (notre style.css)
6. Enqueue de `vtc-google-fonts`
7. Enqueue de `vtc-custom-script` (notre JS)
8. Import de `additional-styles.css` (via @import dans style.css)
9. Template `front-page.php` s'affiche
10. JavaScript initialise les interactions

## 📋 Checklist Validation

Avant mise en production, vérifier :

- [ ] `style.css` contient le header WordPress correct
- [ ] Nom du thème parent correspond (Template: twentytwentyfour)
- [ ] Tous les textes sont échappés (`esc_html`, `esc_attr`)
- [ ] AJAX utilise un nonce valide
- [ ] Email de destination configuré
- [ ] Image hero uploadée (1920x1080px)
- [ ] Screenshot.png ajouté (1200x900px)
- [ ] Plugin SMTP installé pour emails
- [ ] Testéversion mobile/tablette/desktop
- [ ] Formulaire testé (soumission + email reçu)
- [ ] Menu créé et assigné

## 🆘 Dépannage Rapide

| Problème | Fichier à vérifier |
|----------|-------------------|
| Styles ne s'appliquent pas | `style.css` header (lignes 1-12) |
| Formulaire invisible | `front-page.php` template sélectionné ? |
| JS ne fonctionne pas | Console (F12) erreurs ? `functions.php` enqueue |
| Email non reçu | Plugin SMTP installé ? Spam ? |
| Erreur 500 | `functions.php` syntax error |
| Page blanche | Activer WP_DEBUG |

## 📚 Ressources

- Documentation WordPress : https://developer.wordpress.org/
- Google Fonts : https://fonts.google.com/
- CSS Variables : https://developer.mozilla.org/fr/docs/Web/CSS/Using_CSS_custom_properties
- AJAX WordPress : https://codex.wordpress.org/AJAX_in_Plugins

---

**Structure conçue pour être :**
- ✅ Simple à installer
- ✅ Facile à personnaliser
- ✅ Maintenable à long terme
- ✅ Compatible WordPress standards
