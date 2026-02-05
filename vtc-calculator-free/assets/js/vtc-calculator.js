/**
 * VTC Calculator Free - JavaScript
 * Gestion de l'autocomplétion Nominatim et du calcul de prix
 */

(function($) {
    'use strict';
    
    // Variables globales
    let selectedDeparture = null;
    let selectedArrival = null;
    let debounceTimer = null;
    
    // Initialisation au chargement du DOM
    $(document).ready(function() {
        initCalculator();
    });
    
    /**
     * Initialisation du calculateur
     */
    function initCalculator() {
        // Autocomplétion pour le départ
        $('#vtc-departure').on('input', function() {
            handleAutocomplete($(this), 'departure');
        });
        
        // Autocomplétion pour l'arrivée
        $('#vtc-arrival').on('input', function() {
            handleAutocomplete($(this), 'arrival');
        });
        
        // Clic sur le bouton de calcul
        $('#vtc-calculate-btn').on('click', function() {
            calculatePrice();
        });
        
        // Clic sur le bouton WhatsApp
        $('#vtc-whatsapp-btn').on('click', function() {
            openWhatsApp();
        });
        
        // Fermer les suggestions au clic en dehors
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.vtc-form-group').length) {
                $('.vtc-suggestions').hide();
            }
        });
        
        // Entrée sur les champs
        $('.vtc-autocomplete').on('keypress', function(e) {
            if (e.which === 13) { // Touche Entrée
                e.preventDefault();
                calculatePrice();
            }
        });
    }
    
    /**
     * Gestion de l'autocomplétion avec Nominatim
     */
    function handleAutocomplete($input, type) {
        const query = $input.val().trim();
        
        if (query.length < 3) {
            $('#vtc-suggestions-' + type).hide();
            return;
        }
        
        // Debounce pour éviter trop de requêtes
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            searchAddress(query, type);
        }, 300);
    }
    
    /**
     * Recherche d'adresse via Nominatim (OpenStreetMap)
     */
    function searchAddress(query, type) {
        // Priorité pour la Suisse
        const url = 'https://nominatim.openstreetmap.org/search?' + $.param({
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'ch', // Prioriser la Suisse
            'accept-language': 'fr'
        });
        
        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                'User-Agent': 'VTC-Calculator-WordPress-Plugin/1.0'
            },
            success: function(data) {
                displaySuggestions(data, type);
            },
            error: function() {
                console.error('Erreur lors de la recherche d\'adresse');
            }
        });
    }
    
    /**
     * Affichage des suggestions
     */
    function displaySuggestions(results, type) {
        const $container = $('#vtc-suggestions-' + type);
        $container.empty();
        
        if (results.length === 0) {
            $container.hide();
            return;
        }
        
        results.forEach(function(result) {
            const $item = $('<div class="vtc-suggestion-item"></div>')
                .text(result.display_name)
                .data('lat', result.lat)
                .data('lon', result.lon)
                .data('display_name', result.display_name);
            
            $item.on('click', function() {
                selectAddress($(this), type);
            });
            
            $container.append($item);
        });
        
        $container.show();
    }
    
    /**
     * Sélection d'une adresse
     */
    function selectAddress($item, type) {
        const data = {
            lat: parseFloat($item.data('lat')),
            lon: parseFloat($item.data('lon')),
            display_name: $item.data('display_name')
        };
        
        if (type === 'departure') {
            selectedDeparture = data;
            $('#vtc-departure').val(data.display_name);
            $('#vtc-suggestions-departure').hide();
        } else {
            selectedArrival = data;
            $('#vtc-arrival').val(data.display_name);
            $('#vtc-suggestions-arrival').hide();
        }
        
        // Masquer le résultat si on change les adresses
        $('#vtc-result').hide();
        $('#vtc-error').hide();
    }
    
    /**
     * Calcul du prix
     */
    function calculatePrice() {
        // Validation
        if (!selectedDeparture || !selectedArrival) {
            showError(vtcCalcData.translations.error_fields);
            return;
        }
        
        // UI: bouton en mode chargement
        const $btn = $('#vtc-calculate-btn');
        const $btnText = $btn.find('.vtc-btn-text');
        const $btnLoader = $btn.find('.vtc-btn-loader');
        
        $btn.prop('disabled', true);
        $btnText.hide();
        $btnLoader.show();
        
        // Masquer les résultats précédents
        $('#vtc-result').hide();
        $('#vtc-error').hide();
        
        // Requête AJAX
        $.ajax({
            url: vtcCalcData.ajaxUrl,
            method: 'POST',
            data: {
                action: 'vtc_calculate_price',
                nonce: vtcCalcData.nonce,
                departure_lat: selectedDeparture.lat,
                departure_lon: selectedDeparture.lon,
                arrival_lat: selectedArrival.lat,
                arrival_lon: selectedArrival.lon
            },
            success: function(response) {
                if (response.success) {
                    displayResult(response.data);
                } else {
                    showError(response.data.message);
                }
            },
            error: function() {
                showError(vtcCalcData.translations.error_general);
            },
            complete: function() {
                // Restaurer le bouton
                $btn.prop('disabled', false);
                $btnText.show();
                $btnLoader.hide();
            }
        });
    }
    
    /**
     * Affichage du résultat
     */
    function displayResult(data) {
        $('#vtc-distance').text(data.distance_km + ' km');
        $('#vtc-duration').text(data.duration_minutes + ' minutes');
        
        $('#vtc-base-fee').text(data.base_fee + ' ' + data.currency);
        $('#vtc-km-count').text(data.distance_km);
        $('#vtc-km-cost').text(data.km_cost + ' ' + data.currency);
        $('#vtc-min-count').text(data.duration_minutes);
        $('#vtc-min-cost').text(data.time_cost + ' ' + data.currency);
        
        $('#vtc-price').text(data.total_price + ' ' + data.currency);
        
        // Animation d'apparition
        $('#vtc-result').slideDown(400);
        
        // Scroll vers le résultat
        $('html, body').animate({
            scrollTop: $('#vtc-result').offset().top - 20
        }, 500);
    }
    
    /**
     * Affichage d'une erreur
     */
    function showError(message) {
        $('#vtc-error .vtc-error-message').text(message);
        $('#vtc-error').slideDown(400);
        
        // Masquer après 5 secondes
        setTimeout(function() {
            $('#vtc-error').slideUp(400);
        }, 5000);
    }
    
    /**
     * Ouverture de WhatsApp avec le message pré-rempli
     */
    function openWhatsApp() {
        if (!selectedDeparture || !selectedArrival) {
            return;
        }
        
        const whatsappNumber = $('.vtc-calculator-wrapper').data('whatsapp');
        const price = $('#vtc-price').text();
        
        // Message pré-rempli
        const message = `Bonjour, je veux réserver le trajet ${selectedDeparture.display_name} vers ${selectedArrival.display_name} pour ${price}`;
        
        // URL WhatsApp
        const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        
        // Ouvrir dans un nouvel onglet
        window.open(whatsappUrl, '_blank');
    }
    
})(jQuery);
