<?php
/**
 * VTC Premium Swiss - Theme Functions
 * 
 * @package VTC_Premium_Swiss
 * @version 1.0.0
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

/**
 * ============================================
 * CHARGEMENT DES STYLES
 * ============================================
 */
function vtc_enqueue_styles() {
    // Style du thème parent
    wp_enqueue_style(
        'parent-style',
        get_template_directory_uri() . '/style.css'
    );
    
    // Style du thème enfant
    wp_enqueue_style(
        'vtc-child-style',
        get_stylesheet_directory_uri() . '/style.css',
        array('parent-style'),
        wp_get_theme()->get('Version')
    );
    
    // Google Fonts (déjà dans style.css mais on peut aussi le charger ici)
    wp_enqueue_style(
        'vtc-google-fonts',
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap',
        array(),
        null
    );
}
add_action('wp_enqueue_scripts', 'vtc_enqueue_styles');

/**
 * ============================================
 * CHARGEMENT DES SCRIPTS
 * ============================================
 */
function vtc_enqueue_scripts() {
    wp_enqueue_script(
        'vtc-custom-script',
        get_stylesheet_directory_uri() . '/js/vtc-custom.js',
        array('jquery'),
        wp_get_theme()->get('Version'),
        true
    );
    
    // Localisation pour AJAX
    wp_localize_script('vtc-custom-script', 'vtcAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('vtc_booking_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'vtc_enqueue_scripts');

/**
 * ============================================
 * SUPPORT DU THÈME
 * ============================================
 */
function vtc_theme_setup() {
    // Support des images à la une
    add_theme_support('post-thumbnails');
    
    // Support du logo personnalisé
    add_theme_support('custom-logo', array(
        'height'      => 100,
        'width'       => 300,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    
    // Support du titre personnalisé
    add_theme_support('title-tag');
    
    // Support HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // Enregistrer les menus
    register_nav_menus(array(
        'primary' => __('Menu Principal', 'vtc-premium-swiss'),
        'footer'  => __('Menu Footer', 'vtc-premium-swiss'),
    ));
}
add_action('after_setup_theme', 'vtc_theme_setup');

/**
 * ============================================
 * MASQUER ÉLÉMENTS DE BLOG
 * ============================================
 */
// Désactiver les commentaires globalement
function vtc_disable_comments_status() {
    return false;
}
add_filter('comments_open', 'vtc_disable_comments_status', 20, 2);
add_filter('pings_open', 'vtc_disable_comments_status', 20, 2);

// Masquer les commentaires du menu admin
function vtc_remove_comments_admin_menu() {
    remove_menu_page('edit-comments.php');
}
add_action('admin_menu', 'vtc_remove_comments_admin_menu');

// Retirer la barre de commentaires de la barre d'admin
function vtc_remove_comments_admin_bar() {
    global $wp_admin_bar;
    $wp_admin_bar->remove_menu('comments');
}
add_action('wp_before_admin_bar_render', 'vtc_remove_comments_admin_bar');

/**
 * ============================================
 * PERSONNALISATION WORDPRESS CUSTOMIZER
 * ============================================
 */
function vtc_customize_register($wp_customize) {
    // Section VTC
    $wp_customize->add_section('vtc_settings', array(
        'title'    => __('Paramètres VTC', 'vtc-premium-swiss'),
        'priority' => 30,
    ));
    
    // Image de fond Hero
    $wp_customize->add_setting('vtc_hero_image', array(
        'default'   => '',
        'transport' => 'refresh',
    ));
    
    $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'vtc_hero_image', array(
        'label'    => __('Image de fond (Hero)', 'vtc-premium-swiss'),
        'section'  => 'vtc_settings',
        'settings' => 'vtc_hero_image',
        'description' => __('Recommandé: 1920x1080px, voiture de luxe sombre', 'vtc-premium-swiss'),
    )));
    
    // Téléphone
    $wp_customize->add_setting('vtc_phone', array(
        'default'   => '+41 XX XXX XX XX',
        'transport' => 'refresh',
    ));
    
    $wp_customize->add_control('vtc_phone', array(
        'label'    => __('Numéro de téléphone', 'vtc-premium-swiss'),
        'section'  => 'vtc_settings',
        'type'     => 'text',
    ));
    
    // Email
    $wp_customize->add_setting('vtc_email', array(
        'default'   => 'contact@votrevtc.ch',
        'transport' => 'refresh',
    ));
    
    $wp_customize->add_control('vtc_email', array(
        'label'    => __('Email de contact', 'vtc-premium-swiss'),
        'section'  => 'vtc_settings',
        'type'     => 'email',
    ));
    
    // Texte Hero
    $wp_customize->add_setting('vtc_hero_title', array(
        'default'   => 'Chauffeur Privé Suisse',
        'transport' => 'refresh',
    ));
    
    $wp_customize->add_control('vtc_hero_title', array(
        'label'    => __('Titre Hero', 'vtc-premium-swiss'),
        'section'  => 'vtc_settings',
        'type'     => 'text',
    ));
    
    $wp_customize->add_setting('vtc_hero_subtitle', array(
        'default'   => 'Élégance, Ponctualité, Discrétion',
        'transport' => 'refresh',
    ));
    
    $wp_customize->add_control('vtc_hero_subtitle', array(
        'label'    => __('Sous-titre Hero', 'vtc-premium-swiss'),
        'section'  => 'vtc_settings',
        'type'     => 'text',
    ));
}
add_action('customize_register', 'vtc_customize_register');

/**
 * ============================================
 * SHORTCODE FORMULAIRE DE RÉSERVATION
 * ============================================
 */
function vtc_booking_form_shortcode() {
    ob_start();
    ?>
    <div class="vtc-booking-container">
        <form class="vtc-booking-form" id="vtc-booking-form" method="post" action="">
            <div class="vtc-form-header">
                <h1 class="vtc-form-title"><?php echo esc_html(get_theme_mod('vtc_hero_title', 'Chauffeur Privé Suisse')); ?></h1>
                <p class="vtc-form-subtitle"><?php echo esc_html(get_theme_mod('vtc_hero_subtitle', 'Élégance, Ponctualité, Discrétion')); ?></p>
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-pickup">Point de départ</label>
                <input 
                    type="text" 
                    id="vtc-pickup" 
                    name="pickup" 
                    class="vtc-form-input" 
                    placeholder="Genève, Lausanne, Zurich..."
                    required
                >
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-destination">Destination</label>
                <input 
                    type="text" 
                    id="vtc-destination" 
                    name="destination" 
                    class="vtc-form-input" 
                    placeholder="Aéroport, Hôtel, Adresse..."
                    required
                >
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-date">Date</label>
                <input 
                    type="date" 
                    id="vtc-date" 
                    name="date" 
                    class="vtc-form-input"
                    required
                >
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-time">Heure</label>
                <input 
                    type="time" 
                    id="vtc-time" 
                    name="time" 
                    class="vtc-form-input"
                    required
                >
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-passengers">Nombre de passagers</label>
                <select id="vtc-passengers" name="passengers" class="vtc-form-select" required>
                    <option value="1">1 passager</option>
                    <option value="2">2 passagers</option>
                    <option value="3">3 passagers</option>
                    <option value="4">4 passagers</option>
                    <option value="5+">5+ passagers</option>
                </select>
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-name">Nom complet</label>
                <input 
                    type="text" 
                    id="vtc-name" 
                    name="name" 
                    class="vtc-form-input" 
                    placeholder="Votre nom"
                    required
                >
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-phone">Téléphone</label>
                <input 
                    type="tel" 
                    id="vtc-phone" 
                    name="phone" 
                    class="vtc-form-input" 
                    placeholder="+41 XX XXX XX XX"
                    required
                >
            </div>
            
            <div class="vtc-form-group">
                <label class="vtc-form-label" for="vtc-email">Email</label>
                <input 
                    type="email" 
                    id="vtc-email" 
                    name="email" 
                    class="vtc-form-input" 
                    placeholder="votre@email.ch"
                    required
                >
            </div>
            
            <button type="submit" class="vtc-btn">
                Réserver Maintenant
            </button>
            
            <div class="vtc-features">
                <div class="vtc-feature-item">
                    <div class="vtc-feature-icon">✓</div>
                    <div>Véhicules Premium</div>
                </div>
                <div class="vtc-feature-item">
                    <div class="vtc-feature-icon">✓</div>
                    <div>Chauffeurs Professionnels</div>
                </div>
                <div class="vtc-feature-item">
                    <div class="vtc-feature-icon">✓</div>
                    <div>Disponible 24/7</div>
                </div>
            </div>
        </form>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('vtc_booking_form', 'vtc_booking_form_shortcode');

/**
 * ============================================
 * TRAITEMENT AJAX DU FORMULAIRE
 * ============================================
 */
function vtc_process_booking() {
    // Vérification nonce
    check_ajax_referer('vtc_booking_nonce', 'nonce');
    
    // Récupération et nettoyage des données
    $booking_data = array(
        'pickup'      => sanitize_text_field($_POST['pickup']),
        'destination' => sanitize_text_field($_POST['destination']),
        'date'        => sanitize_text_field($_POST['date']),
        'time'        => sanitize_text_field($_POST['time']),
        'passengers'  => sanitize_text_field($_POST['passengers']),
        'name'        => sanitize_text_field($_POST['name']),
        'phone'       => sanitize_text_field($_POST['phone']),
        'email'       => sanitize_email($_POST['email']),
    );
    
    // Envoi d'email de notification
    $to = get_theme_mod('vtc_email', get_option('admin_email'));
    $subject = 'Nouvelle réservation VTC';
    $message = "Nouvelle demande de réservation:\n\n";
    $message .= "De: {$booking_data['pickup']}\n";
    $message .= "À: {$booking_data['destination']}\n";
    $message .= "Date: {$booking_data['date']} à {$booking_data['time']}\n";
    $message .= "Passagers: {$booking_data['passengers']}\n\n";
    $message .= "Client:\n";
    $message .= "Nom: {$booking_data['name']}\n";
    $message .= "Téléphone: {$booking_data['phone']}\n";
    $message .= "Email: {$booking_data['email']}\n";
    
    $headers = array('Content-Type: text/plain; charset=UTF-8');
    
    if (wp_mail($to, $subject, $message, $headers)) {
        wp_send_json_success(array(
            'message' => 'Votre réservation a été envoyée avec succès!'
        ));
    } else {
        wp_send_json_error(array(
            'message' => 'Une erreur est survenue. Veuillez réessayer.'
        ));
    }
}
add_action('wp_ajax_vtc_booking', 'vtc_process_booking');
add_action('wp_ajax_nopriv_vtc_booking', 'vtc_process_booking');

/**
 * ============================================
 * WIDGET ZONES
 * ============================================
 */
function vtc_widgets_init() {
    register_sidebar(array(
        'name'          => __('Footer Widget Area', 'vtc-premium-swiss'),
        'id'            => 'footer-widget-area',
        'description'   => __('Zone de widgets pour le footer', 'vtc-premium-swiss'),
        'before_widget' => '<div class="footer-widget">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ));
}
add_action('widgets_init', 'vtc_widgets_init');

/**
 * ============================================
 * DÉSACTIVER GUTENBERG POUR LA PAGE D'ACCUEIL
 * ============================================
 */
function vtc_disable_gutenberg($use_block_editor, $post) {
    if (get_option('page_on_front') == $post->ID) {
        return false;
    }
    return $use_block_editor;
}
add_filter('use_block_editor_for_post', 'vtc_disable_gutenberg', 10, 2);

/**
 * ============================================
 * NETTOYAGE DU HEAD
 * ============================================
 */
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
