/**
 * ================================================================
 * ROMUO - Système de Redirection Intelligent
 * ================================================================
 * Gestion des redirections entre romuo.ch et app.romuo.ch
 * avec passage de paramètres, tracking et fallback
 * ================================================================
 */

(function(global) {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  const CONFIG = {
    // Domaines
    SHOWCASE_DOMAIN: 'romuo.ch',
    APP_DOMAIN: 'app.romuo.ch',
    APP_URL: 'https://app.romuo.ch',
    SHOWCASE_URL: 'https://romuo.ch',

    // LocalStorage keys (préfixe pour éviter collisions)
    STORAGE_PREFIX: 'romuo_',
    STORAGE_KEYS: {
      SESSION: 'romuo_session',
      PENDING_RESERVATION: 'romuo_pending_reservation',
      TRACKING: 'romuo_tracking',
      LAST_VISIT: 'romuo_last_visit',
      CONVERSION_FUNNEL: 'romuo_funnel',
    },

    // Timeout pour health check (ms)
    HEALTH_CHECK_TIMEOUT: 5000,

    // URL du endpoint de health check
    HEALTH_CHECK_URL: 'https://app.romuo.ch/api/health',

    // Numéro de téléphone fallback
    PHONE_NUMBER: '+41 22 123 45 67',
    PHONE_LINK: 'tel:+41221234567',

    // Google Analytics / tracking
    GA_TRACKING_ID: 'G-XXXXXXXXXX',

    // Durée de session (24h en ms)
    SESSION_DURATION: 24 * 60 * 60 * 1000,

    // Cookie domain pour cross-subdomain
    COOKIE_DOMAIN: '.romuo.ch',
  };

  // ============================================
  // CLASSE PRINCIPALE
  // ============================================

  class RomuoRedirect {
    constructor(options = {}) {
      this.config = { ...CONFIG, ...options };
      this.isAppAvailable = true;
      this.lastHealthCheck = null;
      this.eventListeners = new Map();

      // Initialiser
      this.init();
    }

    // ============================================
    // INITIALISATION
    // ============================================

    init() {
      // Charger/créer session
      this.initSession();

      // Parser les paramètres URL si on est sur l'app
      if (this.isOnApp()) {
        this.parseIncomingParams();
      }

      // Vérifier si réservation en cours (pour afficher banner)
      if (this.isOnShowcase()) {
        this.checkPendingReservation();
      }

      // Health check initial
      this.performHealthCheck();

      // Health check périodique (toutes les 30s)
      setInterval(() => this.performHealthCheck(), 30000);

      // Tracker la visite
      this.trackPageView();

      // Exposer les méthodes globalement
      this.exposeGlobalAPI();

      console.log('[Romuo] Système de redirection initialisé');
    }

    /**
     * Initialiser ou restaurer la session
     */
    initSession() {
      let session = this.getFromStorage(this.config.STORAGE_KEYS.SESSION);

      if (!session || this.isSessionExpired(session)) {
        session = {
          id: this.generateSessionId(),
          createdAt: Date.now(),
          expiresAt: Date.now() + this.config.SESSION_DURATION,
          source: this.getTrafficSource(),
          referrer: document.referrer || null,
          landingPage: window.location.href,
          device: this.getDeviceInfo(),
          visits: 1,
        };
      } else {
        session.visits++;
        session.lastVisit = Date.now();
      }

      this.session = session;
      this.saveToStorage(this.config.STORAGE_KEYS.SESSION, session);

      // Aussi sauvegarder en cookie pour cross-subdomain
      this.setCrossDomainCookie('romuo_session_id', session.id);
    }

    /**
     * Vérifier si la session a expiré
     */
    isSessionExpired(session) {
      return !session.expiresAt || Date.now() > session.expiresAt;
    }

    // ============================================
    // REDIRECTION CONTEXTUELLE
    // ============================================

    /**
     * Redirection vers l'app avec paramètres
     * @param {Object} params - Paramètres à passer
     * @param {Object} options - Options de redirection
     */
    async redirectToApp(params = {}, options = {}) {
      const {
        newTab = false,
        section = 'reservation',
        trackEvent = true,
        fallbackOnError = true,
      } = options;

      // Tracker l'événement
      if (trackEvent) {
        this.trackConversion('redirect_to_app', {
          section,
          params,
          source: this.getCurrentPage(),
        });
      }

      // Vérifier disponibilité de l'app
      if (fallbackOnError) {
        const isAvailable = await this.checkAppAvailability();
        if (!isAvailable) {
          this.showFallbackModal();
          return false;
        }
      }

      // Construire l'URL avec paramètres
      const url = this.buildAppUrl(section, params);

      // Sauvegarder la réservation en cours
      if (Object.keys(params).length > 0) {
        this.savePendingReservation(params);
      }

      // Rediriger
      if (newTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }

      return true;
    }

    /**
     * Construire l'URL de l'app avec paramètres encodés
     * @param {string} section - Section de l'app (reservation, tarifs, etc.)
     * @param {Object} params - Paramètres à encoder
     */
    buildAppUrl(section = 'reservation', params = {}) {
      const baseUrl = `${this.config.APP_URL}/${section}`;

      // Ajouter session ID et tracking
      const fullParams = {
        ...params,
        _sid: this.session.id,
        _src: this.getCurrentPage(),
        _ts: Date.now(),
      };

      // Encoder les paramètres
      const queryString = this.encodeParams(fullParams);

      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    }

    /**
     * Encoder les paramètres pour l'URL
     * @param {Object} params - Paramètres à encoder
     */
    encodeParams(params) {
      const encoded = [];

      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '') {
          // Gestion spéciale des objets/arrays
          if (typeof value === 'object') {
            encoded.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`);
          } else {
            encoded.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
          }
        }
      }

      return encoded.join('&');
    }

    /**
     * Décoder les paramètres de l'URL
     * @param {string} queryString - Query string à décoder
     */
    decodeParams(queryString = window.location.search) {
      const params = {};
      const urlParams = new URLSearchParams(queryString);

      for (const [key, value] of urlParams.entries()) {
        // Essayer de parser JSON si c'est un objet
        try {
          if (value.startsWith('{') || value.startsWith('[')) {
            params[key] = JSON.parse(value);
          } else {
            params[key] = decodeURIComponent(value);
          }
        } catch (e) {
          params[key] = decodeURIComponent(value);
        }
      }

      return params;
    }

    /**
     * Parser les paramètres entrants et pré-remplir le formulaire
     */
    parseIncomingParams() {
      const params = this.decodeParams();

      if (Object.keys(params).length === 0) return;

      // Mapper les paramètres aux champs du formulaire
      const fieldMappings = {
        depart: ['pickup-address', 'departure', 'from'],
        arrival: ['dropoff-address', 'destination', 'to'],
        canton: ['canton-select', 'canton'],
        vehicle: ['vehicle-type', 'vehicleType'],
        date: ['pickup-date', 'date'],
        time: ['pickup-time', 'time'],
        passengers: ['passengers', 'pax'],
        estimate: ['estimate-display', 'price'],
        name: ['customer-name', 'name'],
        email: ['customer-email', 'email'],
        phone: ['customer-phone', 'phone'],
      };

      // Attendre que le DOM soit prêt
      this.onDOMReady(() => {
        for (const [paramKey, fieldIds] of Object.entries(fieldMappings)) {
          if (params[paramKey]) {
            this.fillFormField(fieldIds, params[paramKey]);
          }
        }

        // Émettre un événement personnalisé
        this.emit('params_loaded', params);

        // Tracker
        this.trackEvent('form_prefilled', {
          fields: Object.keys(params).filter(k => !k.startsWith('_')),
          source: params._src || 'direct',
        });
      });

      return params;
    }

    /**
     * Remplir un champ de formulaire
     * @param {Array|string} fieldIds - ID(s) possibles du champ
     * @param {*} value - Valeur à remplir
     */
    fillFormField(fieldIds, value) {
      const ids = Array.isArray(fieldIds) ? fieldIds : [fieldIds];

      for (const id of ids) {
        const element = document.getElementById(id) ||
                       document.querySelector(`[name="${id}"]`) ||
                       document.querySelector(`[data-field="${id}"]`);

        if (element) {
          if (element.tagName === 'SELECT') {
            // Pour les select, chercher l'option correspondante
            const option = Array.from(element.options).find(
              opt => opt.value === value || opt.text.toLowerCase() === value.toLowerCase()
            );
            if (option) {
              element.value = option.value;
            }
          } else if (element.type === 'checkbox') {
            element.checked = Boolean(value);
          } else if (element.type === 'radio') {
            const radio = document.querySelector(`[name="${element.name}"][value="${value}"]`);
            if (radio) radio.checked = true;
          } else {
            element.value = value;
          }

          // Déclencher un événement de changement
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));

          return true;
        }
      }

      return false;
    }

    // ============================================
    // SCROLL VERS SECTION
    // ============================================

    /**
     * Scroll fluide vers une section
     * @param {string} sectionId - ID de la section
     * @param {Object} options - Options de scroll
     */
    scrollToSection(sectionId, options = {}) {
      const {
        offset = -80, // Offset pour header fixe
        behavior = 'smooth',
        trackEvent = true,
      } = options;

      const section = document.getElementById(sectionId) ||
                     document.querySelector(`[data-section="${sectionId}"]`) ||
                     document.querySelector(`.${sectionId}-section`);

      if (!section) {
        console.warn(`[Romuo] Section "${sectionId}" non trouvée`);
        return false;
      }

      const targetPosition = section.getBoundingClientRect().top + window.pageYOffset + offset;

      window.scrollTo({
        top: targetPosition,
        behavior: behavior,
      });

      // Mettre à jour l'URL avec hash
      history.pushState(null, null, `#${sectionId}`);

      // Tracker
      if (trackEvent) {
        this.trackEvent('scroll_to_section', { section: sectionId });
      }

      return true;
    }

    // ============================================
    // SESSION PERSISTANTE
    // ============================================

    /**
     * Sauvegarder une réservation en cours
     * @param {Object} reservation - Données de la réservation
     */
    savePendingReservation(reservation) {
      const data = {
        ...reservation,
        savedAt: Date.now(),
        sessionId: this.session.id,
        source: this.getCurrentPage(),
      };

      this.saveToStorage(this.config.STORAGE_KEYS.PENDING_RESERVATION, data);
      this.setCrossDomainCookie('romuo_has_pending', '1', 7); // 7 jours
    }

    /**
     * Récupérer la réservation en cours
     */
    getPendingReservation() {
      return this.getFromStorage(this.config.STORAGE_KEYS.PENDING_RESERVATION);
    }

    /**
     * Supprimer la réservation en cours
     */
    clearPendingReservation() {
      this.removeFromStorage(this.config.STORAGE_KEYS.PENDING_RESERVATION);
      this.deleteCookie('romuo_has_pending');
    }

    /**
     * Vérifier et afficher le banner "Continuer la réservation"
     */
    checkPendingReservation() {
      const pending = this.getPendingReservation();

      if (!pending) return;

      // Vérifier si pas trop vieille (max 7 jours)
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - pending.savedAt > maxAge) {
        this.clearPendingReservation();
        return;
      }

      // Afficher le banner
      this.showContinueReservationBanner(pending);
    }

    /**
     * Afficher le banner de continuation
     * @param {Object} reservation - Réservation en cours
     */
    showContinueReservationBanner(reservation) {
      // Vérifier si déjà affiché
      if (document.getElementById('romuo-continue-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'romuo-continue-banner';
      banner.className = 'romuo-continue-banner';
      banner.innerHTML = `
        <div class="romuo-banner-content">
          <div class="romuo-banner-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="romuo-banner-text">
            <strong>Reprendre votre réservation</strong>
            <span>${this.formatReservationSummary(reservation)}</span>
          </div>
          <div class="romuo-banner-actions">
            <button class="romuo-btn romuo-btn-primary" data-action="continue">
              Continuer
            </button>
            <button class="romuo-btn romuo-btn-ghost" data-action="dismiss">
              Plus tard
            </button>
          </div>
          <button class="romuo-banner-close" data-action="close">&times;</button>
        </div>
      `;

      // Ajouter les styles
      this.injectBannerStyles();

      // Ajouter au DOM
      document.body.appendChild(banner);

      // Animation d'entrée
      requestAnimationFrame(() => {
        banner.classList.add('romuo-banner-visible');
      });

      // Event listeners
      banner.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'continue') {
          this.redirectToApp(reservation, { section: 'reservation' });
          banner.remove();
        } else if (action === 'dismiss' || action === 'close') {
          banner.classList.remove('romuo-banner-visible');
          setTimeout(() => banner.remove(), 300);
        }
      });

      // Tracker
      this.trackEvent('continue_banner_shown', {
        reservation_age_hours: Math.round((Date.now() - reservation.savedAt) / 3600000),
      });
    }

    /**
     * Formater le résumé de réservation
     * @param {Object} reservation - Réservation
     */
    formatReservationSummary(reservation) {
      const parts = [];

      if (reservation.depart) {
        parts.push(`De: ${this.truncate(reservation.depart, 25)}`);
      }
      if (reservation.arrival) {
        parts.push(`À: ${this.truncate(reservation.arrival, 25)}`);
      }
      if (reservation.estimate) {
        parts.push(`Estimé: CHF ${reservation.estimate}`);
      }

      return parts.join(' • ') || 'Réservation en cours';
    }

    // ============================================
    // TRACKING DES CONVERSIONS
    // ============================================

    /**
     * Tracker un événement
     * @param {string} eventName - Nom de l'événement
     * @param {Object} data - Données additionnelles
     */
    trackEvent(eventName, data = {}) {
      const event = {
        name: eventName,
        timestamp: Date.now(),
        sessionId: this.session?.id,
        page: this.getCurrentPage(),
        ...data,
      };

      // Sauvegarder localement
      const tracking = this.getFromStorage(this.config.STORAGE_KEYS.TRACKING) || [];
      tracking.push(event);
      // Garder seulement les 100 derniers événements
      if (tracking.length > 100) tracking.shift();
      this.saveToStorage(this.config.STORAGE_KEYS.TRACKING, tracking);

      // Envoyer à Google Analytics si disponible
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          event_category: 'romuo_redirect',
          event_label: data.source || this.getCurrentPage(),
          value: data.value,
          ...data,
        });
      }

      // Envoyer à notre API si nécessaire
      this.sendToAnalyticsAPI(event);

      console.debug(`[Romuo] Event tracked: ${eventName}`, data);
    }

    /**
     * Tracker une conversion (clic vers l'app)
     * @param {string} type - Type de conversion
     * @param {Object} data - Données
     */
    trackConversion(type, data = {}) {
      const conversion = {
        type,
        sessionId: this.session?.id,
        timestamp: Date.now(),
        page: this.getCurrentPage(),
        referrer: document.referrer,
        device: this.getDeviceInfo(),
        ...data,
      };

      // Ajouter au funnel
      const funnel = this.getFromStorage(this.config.STORAGE_KEYS.CONVERSION_FUNNEL) || [];
      funnel.push(conversion);
      this.saveToStorage(this.config.STORAGE_KEYS.CONVERSION_FUNNEL, funnel);

      // Tracker comme événement
      this.trackEvent('conversion', conversion);

      // Envoyer immédiatement à l'API
      this.sendConversionToAPI(conversion);
    }

    /**
     * Tracker une vue de page
     */
    trackPageView() {
      this.trackEvent('page_view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      });
    }

    /**
     * Calculer le temps entre visite et réservation
     */
    getTimeToConversion() {
      const funnel = this.getFromStorage(this.config.STORAGE_KEYS.CONVERSION_FUNNEL) || [];

      if (funnel.length < 2) return null;

      const firstVisit = funnel.find(e => e.type === 'page_view' || e.type === 'session_start');
      const conversion = funnel.find(e => e.type === 'booking_completed');

      if (!firstVisit || !conversion) return null;

      return {
        milliseconds: conversion.timestamp - firstVisit.timestamp,
        minutes: Math.round((conversion.timestamp - firstVisit.timestamp) / 60000),
        hours: Math.round((conversion.timestamp - firstVisit.timestamp) / 3600000),
        touchpoints: funnel.length,
      };
    }

    /**
     * Envoyer à l'API d'analytics (placeholder)
     */
    async sendToAnalyticsAPI(event) {
      // En production, envoyer à votre API
      try {
        // await fetch('/api/analytics/event', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(event),
        // });
      } catch (error) {
        console.warn('[Romuo] Failed to send analytics event', error);
      }
    }

    /**
     * Envoyer une conversion à l'API
     */
    async sendConversionToAPI(conversion) {
      try {
        // await fetch('/api/analytics/conversion', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(conversion),
        // });
      } catch (error) {
        console.warn('[Romuo] Failed to send conversion', error);
      }
    }

    // ============================================
    // FALLBACK & HEALTH CHECK
    // ============================================

    /**
     * Vérifier la disponibilité de l'app
     */
    async checkAppAvailability() {
      // Utiliser le cache si récent (< 10s)
      if (this.lastHealthCheck && Date.now() - this.lastHealthCheck.timestamp < 10000) {
        return this.lastHealthCheck.available;
      }

      const result = await this.performHealthCheck();
      return result;
    }

    /**
     * Effectuer un health check
     */
    async performHealthCheck() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.HEALTH_CHECK_TIMEOUT);

        const response = await fetch(this.config.HEALTH_CHECK_URL, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        this.isAppAvailable = response.ok;
        this.lastHealthCheck = {
          timestamp: Date.now(),
          available: response.ok,
          status: response.status,
        };

        return response.ok;
      } catch (error) {
        this.isAppAvailable = false;
        this.lastHealthCheck = {
          timestamp: Date.now(),
          available: false,
          error: error.message,
        };

        return false;
      }
    }

    /**
     * Afficher le modal de fallback
     */
    showFallbackModal() {
      // Vérifier si déjà affiché
      if (document.getElementById('romuo-fallback-modal')) return;

      const isMobile = this.isMobileDevice();

      const modal = document.createElement('div');
      modal.id = 'romuo-fallback-modal';
      modal.className = 'romuo-modal-overlay';
      modal.innerHTML = `
        <div class="romuo-modal">
          <div class="romuo-modal-header">
            <h2>Service temporairement indisponible</h2>
            <button class="romuo-modal-close" data-action="close">&times;</button>
          </div>
          <div class="romuo-modal-body">
            <div class="romuo-modal-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p>Notre application de réservation est momentanément indisponible. Nous nous excusons pour ce désagrément.</p>
            <p>Vous pouvez nous contacter directement pour effectuer votre réservation:</p>
          </div>
          <div class="romuo-modal-actions">
            ${isMobile ? `
              <a href="${this.config.PHONE_LINK}" class="romuo-btn romuo-btn-primary romuo-btn-large">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Appeler maintenant
              </a>
            ` : `
              <div class="romuo-phone-display">
                <span>Téléphone:</span>
                <strong>${this.config.PHONE_NUMBER}</strong>
              </div>
            `}
            <button class="romuo-btn romuo-btn-secondary" data-action="contact-form">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Formulaire de contact
            </button>
            <button class="romuo-btn romuo-btn-ghost" data-action="callback">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Me rappeler
            </button>
          </div>
          <div class="romuo-modal-footer">
            <p>Nous faisons tout notre possible pour rétablir le service rapidement.</p>
          </div>
        </div>
      `;

      // Ajouter les styles
      this.injectModalStyles();

      // Ajouter au DOM
      document.body.appendChild(modal);

      // Animation d'entrée
      requestAnimationFrame(() => {
        modal.classList.add('romuo-modal-visible');
      });

      // Event listeners
      modal.addEventListener('click', (e) => {
        const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;

        switch (action) {
          case 'close':
            this.closeFallbackModal(modal);
            break;
          case 'contact-form':
            this.showContactForm(modal);
            break;
          case 'callback':
            this.showCallbackForm(modal);
            break;
        }

        // Fermer si clic sur overlay
        if (e.target === modal) {
          this.closeFallbackModal(modal);
        }
      });

      // Fermer avec Escape
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeFallbackModal(modal);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      // Tracker
      this.trackEvent('fallback_modal_shown', {
        reason: 'app_unavailable',
        is_mobile: isMobile,
      });
    }

    /**
     * Fermer le modal de fallback
     */
    closeFallbackModal(modal) {
      modal.classList.remove('romuo-modal-visible');
      setTimeout(() => modal.remove(), 300);
    }

    /**
     * Afficher le formulaire de contact
     */
    showContactForm(modal) {
      const body = modal.querySelector('.romuo-modal-body');
      const actions = modal.querySelector('.romuo-modal-actions');

      body.innerHTML = `
        <form id="romuo-contact-form" class="romuo-form">
          <div class="romuo-form-group">
            <label for="contact-name">Nom complet *</label>
            <input type="text" id="contact-name" name="name" required>
          </div>
          <div class="romuo-form-group">
            <label for="contact-email">Email *</label>
            <input type="email" id="contact-email" name="email" required>
          </div>
          <div class="romuo-form-group">
            <label for="contact-phone">Téléphone</label>
            <input type="tel" id="contact-phone" name="phone">
          </div>
          <div class="romuo-form-group">
            <label for="contact-message">Message *</label>
            <textarea id="contact-message" name="message" rows="4" required placeholder="Décrivez votre besoin de transport..."></textarea>
          </div>
        </form>
      `;

      actions.innerHTML = `
        <button type="submit" form="romuo-contact-form" class="romuo-btn romuo-btn-primary">
          Envoyer le message
        </button>
        <button class="romuo-btn romuo-btn-ghost" data-action="back">
          Retour
        </button>
      `;

      // Form submission
      document.getElementById('romuo-contact-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitContactForm(e.target, modal);
      });

      // Back button
      modal.querySelector('[data-action="back"]').addEventListener('click', () => {
        this.closeFallbackModal(modal);
        this.showFallbackModal();
      });
    }

    /**
     * Afficher le formulaire de rappel
     */
    showCallbackForm(modal) {
      const body = modal.querySelector('.romuo-modal-body');
      const actions = modal.querySelector('.romuo-modal-actions');

      body.innerHTML = `
        <form id="romuo-callback-form" class="romuo-form">
          <div class="romuo-form-group">
            <label for="callback-name">Votre nom *</label>
            <input type="text" id="callback-name" name="name" required>
          </div>
          <div class="romuo-form-group">
            <label for="callback-phone">Numéro de téléphone *</label>
            <input type="tel" id="callback-phone" name="phone" required placeholder="+41 XX XXX XX XX">
          </div>
          <div class="romuo-form-group">
            <label for="callback-time">Meilleur moment pour vous rappeler</label>
            <select id="callback-time" name="preferred_time">
              <option value="asap">Dès que possible</option>
              <option value="morning">Matin (8h-12h)</option>
              <option value="afternoon">Après-midi (12h-18h)</option>
              <option value="evening">Soir (18h-20h)</option>
            </select>
          </div>
        </form>
      `;

      actions.innerHTML = `
        <button type="submit" form="romuo-callback-form" class="romuo-btn romuo-btn-primary">
          Demander un rappel
        </button>
        <button class="romuo-btn romuo-btn-ghost" data-action="back">
          Retour
        </button>
      `;

      // Form submission
      document.getElementById('romuo-callback-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitCallbackForm(e.target, modal);
      });

      // Back button
      modal.querySelector('[data-action="back"]').addEventListener('click', () => {
        this.closeFallbackModal(modal);
        this.showFallbackModal();
      });
    }

    /**
     * Soumettre le formulaire de contact
     */
    async submitContactForm(form, modal) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Afficher loading
      const submitBtn = modal.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours...';

      try {
        // Envoyer à l'API (placeholder)
        // await fetch('/api/contact', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(data),
        // });

        // Simuler un délai
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Afficher succès
        modal.querySelector('.romuo-modal-body').innerHTML = `
          <div class="romuo-success">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3>Message envoyé!</h3>
            <p>Nous vous répondrons dans les plus brefs délais.</p>
          </div>
        `;
        modal.querySelector('.romuo-modal-actions').innerHTML = `
          <button class="romuo-btn romuo-btn-primary" data-action="close">Fermer</button>
        `;

        this.trackEvent('contact_form_submitted', data);

      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('Erreur lors de l\'envoi. Veuillez réessayer.');
      }
    }

    /**
     * Soumettre le formulaire de rappel
     */
    async submitCallbackForm(form, modal) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      const submitBtn = modal.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours...';

      try {
        // Simuler envoi
        await new Promise(resolve => setTimeout(resolve, 1000));

        modal.querySelector('.romuo-modal-body').innerHTML = `
          <div class="romuo-success">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3>Demande enregistrée!</h3>
            <p>Nous vous rappellerons ${data.preferred_time === 'asap' ? 'dans les plus brefs délais' : 'selon votre préférence'}.</p>
          </div>
        `;
        modal.querySelector('.romuo-modal-actions').innerHTML = `
          <button class="romuo-btn romuo-btn-primary" data-action="close">Fermer</button>
        `;

        this.trackEvent('callback_requested', data);

      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('Erreur lors de l\'envoi. Veuillez réessayer.');
      }
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    /**
     * Vérifier si on est sur le site vitrine
     */
    isOnShowcase() {
      return window.location.hostname === this.config.SHOWCASE_DOMAIN ||
             window.location.hostname === `www.${this.config.SHOWCASE_DOMAIN}` ||
             window.location.hostname === 'localhost';
    }

    /**
     * Vérifier si on est sur l'app
     */
    isOnApp() {
      return window.location.hostname === this.config.APP_DOMAIN ||
             window.location.hostname === 'localhost' && window.location.port === '3000';
    }

    /**
     * Obtenir la page actuelle
     */
    getCurrentPage() {
      const path = window.location.pathname;
      const hash = window.location.hash;
      return path + hash;
    }

    /**
     * Générer un ID de session unique
     */
    generateSessionId() {
      return 'rs_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obtenir la source du trafic
     */
    getTrafficSource() {
      const params = new URLSearchParams(window.location.search);
      const referrer = document.referrer;

      // UTM parameters
      if (params.get('utm_source')) {
        return {
          type: 'utm',
          source: params.get('utm_source'),
          medium: params.get('utm_medium'),
          campaign: params.get('utm_campaign'),
        };
      }

      // Referrer analysis
      if (referrer) {
        const referrerUrl = new URL(referrer);
        if (referrerUrl.hostname.includes('google')) return { type: 'organic', source: 'google' };
        if (referrerUrl.hostname.includes('facebook')) return { type: 'social', source: 'facebook' };
        if (referrerUrl.hostname.includes('instagram')) return { type: 'social', source: 'instagram' };
        if (referrerUrl.hostname.includes('linkedin')) return { type: 'social', source: 'linkedin' };
        return { type: 'referral', source: referrerUrl.hostname };
      }

      return { type: 'direct', source: null };
    }

    /**
     * Obtenir les infos de l'appareil
     */
    getDeviceInfo() {
      const ua = navigator.userAgent;
      return {
        isMobile: /Mobile|Android|iPhone/i.test(ua),
        isTablet: /iPad|Tablet/i.test(ua),
        browser: this.getBrowserName(ua),
        os: this.getOSName(ua),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
      };
    }

    /**
     * Détecter le navigateur
     */
    getBrowserName(ua) {
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      if (ua.includes('Opera')) return 'Opera';
      return 'Unknown';
    }

    /**
     * Détecter l'OS
     */
    getOSName(ua) {
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac')) return 'MacOS';
      if (ua.includes('Linux')) return 'Linux';
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
      return 'Unknown';
    }

    /**
     * Vérifier si appareil mobile
     */
    isMobileDevice() {
      return /Mobile|Android|iPhone/i.test(navigator.userAgent);
    }

    /**
     * Tronquer une chaîne
     */
    truncate(str, length = 30) {
      if (!str) return '';
      return str.length > length ? str.substring(0, length - 3) + '...' : str;
    }

    // ============================================
    // STOCKAGE
    // ============================================

    /**
     * Sauvegarder dans localStorage
     */
    saveToStorage(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn('[Romuo] localStorage save failed', error);
      }
    }

    /**
     * Récupérer depuis localStorage
     */
    getFromStorage(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn('[Romuo] localStorage get failed', error);
        return null;
      }
    }

    /**
     * Supprimer du localStorage
     */
    removeFromStorage(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('[Romuo] localStorage remove failed', error);
      }
    }

    /**
     * Définir un cookie cross-domain
     */
    setCrossDomainCookie(name, value, days = 1) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${name}=${value};${expires};path=/;domain=${this.config.COOKIE_DOMAIN};SameSite=Lax`;
    }

    /**
     * Récupérer un cookie
     */
    getCookie(name) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    }

    /**
     * Supprimer un cookie
     */
    deleteCookie(name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${this.config.COOKIE_DOMAIN}`;
    }

    // ============================================
    // ÉVÉNEMENTS
    // ============================================

    /**
     * Émettre un événement
     */
    emit(eventName, data) {
      const event = new CustomEvent(`romuo:${eventName}`, { detail: data });
      window.dispatchEvent(event);

      const listeners = this.eventListeners.get(eventName) || [];
      listeners.forEach(callback => callback(data));
    }

    /**
     * Écouter un événement
     */
    on(eventName, callback) {
      if (!this.eventListeners.has(eventName)) {
        this.eventListeners.set(eventName, []);
      }
      this.eventListeners.get(eventName).push(callback);
    }

    /**
     * Attendre que le DOM soit prêt
     */
    onDOMReady(callback) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
      } else {
        callback();
      }
    }

    // ============================================
    // STYLES INJECTÉS
    // ============================================

    /**
     * Injecter les styles du banner
     */
    injectBannerStyles() {
      if (document.getElementById('romuo-banner-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'romuo-banner-styles';
      styles.textContent = `
        .romuo-continue-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1a1a1a;
          color: white;
          padding: 16px 24px;
          z-index: 9998;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
        }
        .romuo-continue-banner.romuo-banner-visible {
          transform: translateY(0);
        }
        .romuo-banner-content {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .romuo-banner-icon {
          flex-shrink: 0;
          color: #D52B1E;
        }
        .romuo-banner-text {
          flex: 1;
        }
        .romuo-banner-text strong {
          display: block;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .romuo-banner-text span {
          font-size: 14px;
          opacity: 0.8;
        }
        .romuo-banner-actions {
          display: flex;
          gap: 8px;
        }
        .romuo-banner-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          opacity: 0.6;
          padding: 4px 8px;
        }
        .romuo-banner-close:hover {
          opacity: 1;
        }
        .romuo-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          text-decoration: none;
        }
        .romuo-btn-primary {
          background: #D52B1E;
          color: white;
        }
        .romuo-btn-primary:hover {
          background: #B8241A;
        }
        .romuo-btn-secondary {
          background: white;
          color: #1a1a1a;
          border: 1px solid #ddd;
        }
        .romuo-btn-secondary:hover {
          background: #f5f5f5;
        }
        .romuo-btn-ghost {
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .romuo-btn-ghost:hover {
          background: rgba(255,255,255,0.1);
        }
        @media (max-width: 768px) {
          .romuo-banner-content {
            flex-direction: column;
            text-align: center;
          }
          .romuo-banner-actions {
            flex-direction: column;
            width: 100%;
          }
          .romuo-btn {
            width: 100%;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    /**
     * Injecter les styles du modal
     */
    injectModalStyles() {
      if (document.getElementById('romuo-modal-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'romuo-modal-styles';
      styles.textContent = `
        .romuo-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          padding: 20px;
        }
        .romuo-modal-overlay.romuo-modal-visible {
          opacity: 1;
          visibility: visible;
        }
        .romuo-modal {
          background: white;
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          transform: scale(0.95) translateY(20px);
          transition: transform 0.3s ease;
        }
        .romuo-modal-overlay.romuo-modal-visible .romuo-modal {
          transform: scale(1) translateY(0);
        }
        .romuo-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .romuo-modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #1a1a1a;
        }
        .romuo-modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #999;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .romuo-modal-close:hover {
          color: #333;
        }
        .romuo-modal-body {
          padding: 24px;
          text-align: center;
        }
        .romuo-modal-body p {
          margin: 0 0 16px;
          color: #666;
          line-height: 1.6;
        }
        .romuo-modal-icon {
          margin-bottom: 20px;
        }
        .romuo-modal-actions {
          padding: 0 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .romuo-btn-large {
          padding: 16px 24px;
          font-size: 16px;
        }
        .romuo-phone-display {
          background: #f5f5f5;
          padding: 16px 24px;
          border-radius: 8px;
          text-align: center;
        }
        .romuo-phone-display span {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }
        .romuo-phone-display strong {
          font-size: 20px;
          color: #D52B1E;
        }
        .romuo-modal-footer {
          padding: 16px 24px;
          background: #f9f9f9;
          border-top: 1px solid #eee;
          text-align: center;
        }
        .romuo-modal-footer p {
          margin: 0;
          font-size: 13px;
          color: #999;
        }
        .romuo-form {
          text-align: left;
        }
        .romuo-form-group {
          margin-bottom: 16px;
        }
        .romuo-form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 6px;
        }
        .romuo-form-group input,
        .romuo-form-group select,
        .romuo-form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .romuo-form-group input:focus,
        .romuo-form-group select:focus,
        .romuo-form-group textarea:focus {
          outline: none;
          border-color: #D52B1E;
        }
        .romuo-success {
          padding: 20px;
        }
        .romuo-success h3 {
          margin: 16px 0 8px;
          color: #10B981;
        }
        .romuo-success p {
          margin: 0;
        }
      `;
      document.head.appendChild(styles);
    }

    // ============================================
    // API GLOBALE
    // ============================================

    /**
     * Exposer l'API globalement
     */
    exposeGlobalAPI() {
      global.Romuo = {
        // Redirection
        redirectToApp: this.redirectToApp.bind(this),
        buildAppUrl: this.buildAppUrl.bind(this),
        scrollToSection: this.scrollToSection.bind(this),

        // Session
        getSession: () => this.session,
        getPendingReservation: this.getPendingReservation.bind(this),
        savePendingReservation: this.savePendingReservation.bind(this),
        clearPendingReservation: this.clearPendingReservation.bind(this),

        // Tracking
        trackEvent: this.trackEvent.bind(this),
        trackConversion: this.trackConversion.bind(this),
        getTimeToConversion: this.getTimeToConversion.bind(this),

        // État
        isAppAvailable: () => this.isAppAvailable,
        checkAppAvailability: this.checkAppAvailability.bind(this),

        // Événements
        on: this.on.bind(this),

        // Utilitaires
        encodeParams: this.encodeParams.bind(this),
        decodeParams: this.decodeParams.bind(this),

        // Instance
        _instance: this,
      };
    }
  }

  // ============================================
  // INITIALISATION AUTOMATIQUE
  // ============================================

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new RomuoRedirect();
    });
  } else {
    new RomuoRedirect();
  }

  // Exporter pour usage en module
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RomuoRedirect;
  }

})(typeof window !== 'undefined' ? window : this);
