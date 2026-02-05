/**
 * VTC Premium Swiss - Custom JavaScript
 * 
 * @package VTC_Premium_Swiss
 * @version 1.0.0
 */

(function($) {
    'use strict';
    
    /**
     * ============================================
     * INITIALISATION
     * ============================================
     */
    $(document).ready(function() {
        initBookingForm();
        initSmoothScroll();
        initAnimations();
        initDateTimeDefaults();
    });
    
    /**
     * ============================================
     * FORMULAIRE DE RÉSERVATION AJAX
     * ============================================
     */
    function initBookingForm() {
        $('#vtc-booking-form').on('submit', function(e) {
            e.preventDefault();
            
            const $form = $(this);
            const $submitBtn = $form.find('button[type="submit"]');
            const originalText = $submitBtn.text();
            
            // Désactiver le bouton et afficher un loader
            $submitBtn.prop('disabled', true).text('Envoi en cours...');
            
            // Récupérer les données du formulaire
            const formData = {
                action: 'vtc_booking',
                nonce: vtcAjax.nonce,
                pickup: $('#vtc-pickup').val(),
                destination: $('#vtc-destination').val(),
                date: $('#vtc-date').val(),
                time: $('#vtc-time').val(),
                passengers: $('#vtc-passengers').val(),
                name: $('#vtc-name').val(),
                phone: $('#vtc-phone').val(),
                email: $('#vtc-email').val()
            };
            
            // Envoi AJAX
            $.ajax({
                url: vtcAjax.ajaxurl,
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        // Afficher message de succès
                        showMessage('success', response.data.message);
                        
                        // Réinitialiser le formulaire
                        $form[0].reset();
                        
                        // Redirection optionnelle vers page de confirmation
                        // window.location.href = '/confirmation';
                    } else {
                        showMessage('error', response.data.message);
                    }
                },
                error: function() {
                    showMessage('error', 'Une erreur est survenue. Veuillez nous contacter par téléphone.');
                },
                complete: function() {
                    // Réactiver le bouton
                    $submitBtn.prop('disabled', false).text(originalText);
                }
            });
        });
    }
    
    /**
     * ============================================
     * AFFICHAGE DES MESSAGES
     * ============================================
     */
    function showMessage(type, message) {
        // Supprimer les anciens messages
        $('.vtc-message').remove();
        
        // Créer le nouveau message
        const messageClass = type === 'success' ? 'vtc-message-success' : 'vtc-message-error';
        const icon = type === 'success' ? '✓' : '✕';
        
        const $message = $('<div>', {
            class: 'vtc-message ' + messageClass,
            html: '<span class="vtc-message-icon">' + icon + '</span>' +
                  '<span class="vtc-message-text">' + message + '</span>'
        });
        
        // Insérer le message
        $('#vtc-booking-form').prepend($message);
        
        // Animation d'apparition
        $message.hide().slideDown(300);
        
        // Faire défiler vers le message
        $('html, body').animate({
            scrollTop: $message.offset().top - 100
        }, 500);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(function() {
            $message.slideUp(300, function() {
                $(this).remove();
            });
        }, 5000);
    }
    
    /**
     * ============================================
     * DÉFILEMENT FLUIDE
     * ============================================
     */
    function initSmoothScroll() {
        $('a[href*="#"]').not('[href="#"]').not('[href="#0"]').on('click', function(e) {
            if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') &&
                location.hostname === this.hostname) {
                
                const target = $(this.hash);
                const $target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                
                if ($target.length) {
                    e.preventDefault();
                    $('html, body').animate({
                        scrollTop: $target.offset().top - 80
                    }, 800, 'swing');
                }
            }
        });
    }
    
    /**
     * ============================================
     * ANIMATIONS AU DÉFILEMENT
     * ============================================
     */
    function initAnimations() {
        // Observer pour les animations au scroll
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('vtc-animated');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            // Observer les éléments
            document.querySelectorAll('.vtc-service-card, .vtc-fleet-card, .vtc-advantage-item').forEach(function(el) {
                observer.observe(el);
            });
        }
    }
    
    /**
     * ============================================
     * VALEURS PAR DÉFAUT DATE/HEURE
     * ============================================
     */
    function initDateTimeDefaults() {
        // Date minimale = aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        $('#vtc-date').attr('min', today);
        
        // Si pas de date sélectionnée, mettre aujourd'hui
        if (!$('#vtc-date').val()) {
            $('#vtc-date').val(today);
        }
        
        // Heure par défaut si vide
        if (!$('#vtc-time').val()) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(Math.ceil(now.getMinutes() / 15) * 15).padStart(2, '0');
            $('#vtc-time').val(hours + ':' + minutes);
        }
    }
    
    /**
     * ============================================
     * VALIDATION DU FORMULAIRE
     * ============================================
     */
    function validateForm() {
        // Validation téléphone suisse
        $('#vtc-phone').on('blur', function() {
            const phone = $(this).val();
            const swissPhoneRegex = /^(\+41|0041|0)[1-9]\d{8,9}$/;
            
            if (phone && !swissPhoneRegex.test(phone.replace(/\s/g, ''))) {
                $(this).addClass('vtc-input-error');
                showInputError($(this), 'Format invalide. Ex: +41 XX XXX XX XX');
            } else {
                $(this).removeClass('vtc-input-error');
                hideInputError($(this));
            }
        });
    }
    
    /**
     * ============================================
     * AFFICHAGE ERREURS CHAMPS
     * ============================================
     */
    function showInputError($input, message) {
        const $error = $('<span>', {
            class: 'vtc-field-error',
            text: message
        });
        
        $input.parent().find('.vtc-field-error').remove();
        $input.after($error);
    }
    
    function hideInputError($input) {
        $input.parent().find('.vtc-field-error').remove();
    }
    
    /**
     * ============================================
     * EFFET PARALLAXE HERO (Optionnel)
     * ============================================
     */
    $(window).on('scroll', function() {
        const scrolled = $(window).scrollTop();
        $('.vtc-hero-background img').css('transform', 'translateY(' + (scrolled * 0.5) + 'px)');
    });
    
    /**
     * ============================================
     * RESPONSIVE MENU (Mobile)
     * ============================================
     */
    function initMobileMenu() {
        // Ajouter un bouton hamburger si nécessaire
        if ($('.main-navigation').length && !$('.menu-toggle').length) {
            $('.main-navigation').prepend('<button class="menu-toggle" aria-label="Menu">☰</button>');
        }
        
        $('.menu-toggle').on('click', function() {
            $(this).toggleClass('active');
            $('.main-navigation ul').slideToggle(300);
        });
    }
    
    initMobileMenu();
    
})(jQuery);
