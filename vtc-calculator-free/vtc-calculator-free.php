<?php
/**
 * Plugin Name: VTC Calculator Free
 * Plugin URI: https://romuo.ch
 * Description: Calculateur de prix VTC gratuit utilisant Nominatim (OpenStreetMap) et OSRM pour le calcul de distance
 * Version: 1.0.0
 * Author: Emergent VTC
 * Author URI: https://romuo.ch
 * License: GPL v2 or later
 * Text Domain: vtc-calculator-free
 */

// Sécurité : empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

// Définir les constantes du plugin
define('VTC_CALC_VERSION', '1.0.0');
define('VTC_CALC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('VTC_CALC_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Classe principale du plugin
 */
class VTC_Calculator_Free {
    
    /**
     * Instance unique de la classe
     */
    private static $instance = null;
    
    /**
     * Tarification suisse
     */
    private $pricing = array(
        'base_fee' => 6.00,      // Prise en charge
        'per_km' => 3.80,        // Prix par km
        'per_minute' => 0.80     // Prix par minute
    );
    
    /**
     * Retourne l'instance unique de la classe
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructeur
     */
    private function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('vtc_calculator', array($this, 'render_calculator'));
        add_action('wp_ajax_vtc_calculate_price', array($this, 'ajax_calculate_price'));
        add_action('wp_ajax_nopriv_vtc_calculate_price', array($this, 'ajax_calculate_price'));
    }
    
    /**
     * Enregistre les scripts et styles
     */
    public function enqueue_scripts() {
        // CSS
        wp_enqueue_style(
            'vtc-calculator-css',
            VTC_CALC_PLUGIN_URL . 'assets/css/vtc-calculator.css',
            array(),
            VTC_CALC_VERSION
        );
        
        // JavaScript
        wp_enqueue_script(
            'vtc-calculator-js',
            VTC_CALC_PLUGIN_URL . 'assets/js/vtc-calculator.js',
            array('jquery'),
            VTC_CALC_VERSION,
            true
        );
        
        // Localiser le script pour AJAX
        wp_localize_script('vtc-calculator-js', 'vtcCalcData', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('vtc_calculator_nonce'),
            'pricing' => $this->pricing,
            'translations' => array(
                'error_general' => __('Une erreur est survenue. Veuillez réessayer.', 'vtc-calculator-free'),
                'error_fields' => __('Veuillez remplir les champs départ et arrivée.', 'vtc-calculator-free'),
                'calculating' => __('Calcul en cours...', 'vtc-calculator-free'),
                'estimate' => __('Estimer le tarif', 'vtc-calculator-free')
            )
        ));
    }
    
    /**
     * Rendu du calculateur (shortcode)
     */
    public function render_calculator($atts) {
        $atts = shortcode_atts(array(
            'whatsapp_number' => '+41791234567' // Numéro par défaut, à personnaliser
        ), $atts);
        
        ob_start();
        ?>
        <div class="vtc-calculator-wrapper" data-whatsapp="<?php echo esc_attr($atts['whatsapp_number']); ?>">
            <div class="vtc-calculator-container">
                <h2 class="vtc-calculator-title">Calculateur de Prix VTC</h2>
                
                <div class="vtc-calculator-form">
                    <div class="vtc-form-group">
                        <label for="vtc-departure">
                            <i class="vtc-icon-departure"></i>
                            Adresse de départ
                        </label>
                        <input 
                            type="text" 
                            id="vtc-departure" 
                            class="vtc-input vtc-autocomplete" 
                            placeholder="Ex: Rue du Rhône 1, Genève"
                            autocomplete="off"
                        />
                        <div class="vtc-suggestions" id="vtc-suggestions-departure"></div>
                    </div>
                    
                    <div class="vtc-form-group">
                        <label for="vtc-arrival">
                            <i class="vtc-icon-arrival"></i>
                            Adresse d'arrivée
                        </label>
                        <input 
                            type="text" 
                            id="vtc-arrival" 
                            class="vtc-input vtc-autocomplete" 
                            placeholder="Ex: Aéroport de Genève"
                            autocomplete="off"
                        />
                        <div class="vtc-suggestions" id="vtc-suggestions-arrival"></div>
                    </div>
                    
                    <button type="button" id="vtc-calculate-btn" class="vtc-btn vtc-btn-primary">
                        <span class="vtc-btn-text">Estimer le tarif</span>
                        <span class="vtc-btn-loader" style="display:none;">⏳</span>
                    </button>
                </div>
                
                <div class="vtc-result" id="vtc-result" style="display:none;">
                    <div class="vtc-result-header">
                        <h3>Estimation de votre trajet</h3>
                    </div>
                    
                    <div class="vtc-result-details">
                        <div class="vtc-result-item">
                            <span class="vtc-result-label">Distance:</span>
                            <span class="vtc-result-value" id="vtc-distance">-</span>
                        </div>
                        <div class="vtc-result-item">
                            <span class="vtc-result-label">Durée estimée:</span>
                            <span class="vtc-result-value" id="vtc-duration">-</span>
                        </div>
                        <div class="vtc-result-item vtc-result-breakdown">
                            <span class="vtc-result-label">Détail du prix:</span>
                            <div class="vtc-price-breakdown">
                                <div>Prise en charge: <span id="vtc-base-fee">-</span></div>
                                <div>Distance (<span id="vtc-km-count">-</span> km): <span id="vtc-km-cost">-</span></div>
                                <div>Temps (<span id="vtc-min-count">-</span> min): <span id="vtc-min-cost">-</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="vtc-result-price">
                        <span class="vtc-price-label">Prix estimé:</span>
                        <span class="vtc-price-value" id="vtc-price">-</span>
                    </div>
                    
                    <button type="button" id="vtc-whatsapp-btn" class="vtc-btn vtc-btn-whatsapp">
                        <span class="vtc-whatsapp-icon">📱</span>
                        Réserver par WhatsApp
                    </button>
                    
                    <p class="vtc-disclaimer">
                        * Prix indicatif, peut varier selon les conditions de circulation
                    </p>
                </div>
                
                <div class="vtc-error" id="vtc-error" style="display:none;">
                    <span class="vtc-error-icon">⚠️</span>
                    <span class="vtc-error-message"></span>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Traitement AJAX pour le calcul de prix
     */
    public function ajax_calculate_price() {
        // Vérification du nonce
        check_ajax_referer('vtc_calculator_nonce', 'nonce');
        
        // Récupération des données
        $departure_lat = floatval($_POST['departure_lat']);
        $departure_lon = floatval($_POST['departure_lon']);
        $arrival_lat = floatval($_POST['arrival_lat']);
        $arrival_lon = floatval($_POST['arrival_lon']);
        
        // Validation
        if (empty($departure_lat) || empty($departure_lon) || empty($arrival_lat) || empty($arrival_lon)) {
            wp_send_json_error(array(
                'message' => __('Coordonnées invalides.', 'vtc-calculator-free')
            ));
        }
        
        // Appel à l'API OSRM pour calculer la route
        $osrm_url = sprintf(
            'https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=false',
            $departure_lon,
            $departure_lat,
            $arrival_lon,
            $arrival_lat
        );
        
        $response = wp_remote_get($osrm_url, array(
            'timeout' => 15,
            'headers' => array(
                'User-Agent' => 'VTC-Calculator-WordPress-Plugin/1.0'
            )
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => __('Erreur lors du calcul de la route.', 'vtc-calculator-free')
            ));
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!isset($data['routes'][0])) {
            wp_send_json_error(array(
                'message' => __('Impossible de calculer la route.', 'vtc-calculator-free')
            ));
        }
        
        $route = $data['routes'][0];
        $distance_meters = $route['distance'];
        $duration_seconds = $route['duration'];
        
        // Conversion
        $distance_km = $distance_meters / 1000;
        $duration_minutes = $duration_seconds / 60;
        
        // Calcul du prix selon la formule suisse
        $base_fee = $this->pricing['base_fee'];
        $km_cost = $distance_km * $this->pricing['per_km'];
        $time_cost = $duration_minutes * $this->pricing['per_minute'];
        $total_price = $base_fee + $km_cost + $time_cost;
        
        // Réponse
        wp_send_json_success(array(
            'distance_km' => round($distance_km, 2),
            'duration_minutes' => round($duration_minutes, 0),
            'base_fee' => number_format($base_fee, 2, '.', ''),
            'km_cost' => number_format($km_cost, 2, '.', ''),
            'time_cost' => number_format($time_cost, 2, '.', ''),
            'total_price' => number_format($total_price, 2, '.', ''),
            'currency' => 'CHF'
        ));
    }
}

// Initialiser le plugin
function vtc_calculator_free_init() {
    return VTC_Calculator_Free::get_instance();
}
add_action('plugins_loaded', 'vtc_calculator_free_init');
