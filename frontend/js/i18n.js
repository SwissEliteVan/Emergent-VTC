/**
 * VTC Suisse - Internationalization (i18n)
 * Support: FR, DE, IT, EN
 */

const translations = {
  fr: {
    // Navigation
    skip_to_content: "Aller au contenu",
    logo_subtitle: "Transport Premium",
    nav_booking: "Réserver",
    nav_services: "Services",
    nav_fleet: "Flotte",
    nav_contact: "Contact",
    quality_badge: "Prix officiel contrôlé",

    // Hero
    hero_title: "Réservez votre chauffeur",
    hero_subtitle: "Service ponctuel et professionnel dans toute la Suisse",
    select_canton: "Votre canton",
    more_cantons: "Plus",

    // Trip Types
    trip_oneway: "Aller simple",
    trip_roundtrip: "Aller-retour",
    trip_halfday: "Demi-journée",

    // Form Labels
    label_pickup: "Adresse de départ",
    label_dropoff: "Adresse d'arrivée",
    label_date: "Date",
    label_time: "Heure",
    label_passengers: "Passagers",
    label_vehicle: "Type de véhicule",
    label_name: "Nom complet",
    label_phone: "Téléphone",
    label_email: "Email",
    label_notes: "Notes (optionnel)",

    // Placeholders
    placeholder_pickup: "Ex: Gare de Genève-Cornavin",
    placeholder_dropoff: "Ex: Aéroport de Genève",
    placeholder_notes: "Numéro de vol, instructions spéciales...",

    // Quick Destinations
    quick_destinations: "Destinations fréquentes:",
    poi_airport: "Aéroport",
    poi_station: "Gare",
    poi_hospital: "Hôpital",

    // Passengers
    passengers_label: "passager(s)",

    // Vehicles
    vehicle_eco_desc: "Confortable, économique",
    vehicle_berline_desc: "Mercedes Classe E, BMW Série 5",
    vehicle_van_desc: "Jusqu'à 7 passagers",
    vehicle_luxe_desc: "Mercedes Classe S, BMW Série 7",
    badge_popular: "Populaire",
    price_from: "dès",

    // Buttons
    btn_estimate: "Obtenir un devis",
    btn_confirm: "Confirmer la réservation",
    btn_download_receipt: "Télécharger le récépissé",
    btn_close: "Fermer",

    // Official Price
    official_price_title: "Prix officiel contrôlé",
    official_price_desc: "Conforme à l'OTV - TVA 7.7% incluse",

    // Estimate Modal
    estimate_title: "Votre estimation",
    est_date: "Date et heure",
    est_distance: "Distance",
    est_duration: "Durée estimée",
    est_vehicle: "Véhicule",

    // Price Breakdown
    price_breakdown: "Détail du prix",
    price_base: "Prise en charge",
    price_distance: "Distance",
    price_time: "Temps",
    price_night: "Supplément nuit (22h-6h)",
    price_weekend: "Supplément week-end",
    price_subtotal: "Sous-total HT",
    price_vat: "TVA 7.7%",
    price_total: "Total TTC",
    price_eur: "Équivalent EUR",

    // Customer Info
    your_info: "Vos informations",

    // Payment
    payment_method: "Mode de paiement",
    payment_card: "Carte",
    payment_invoice: "Facture",
    payment_cash: "Espèces",
    pay_with_twint: "Payer avec TWINT",
    twint_instructions: "Scannez ce QR code avec votre application TWINT",

    // Terms
    accept_terms: "J'accepte les conditions générales et la politique de confidentialité",

    // Confirmation
    confirmation_title: "Réservation confirmée!",
    reservation_number: "N° de réservation:",
    receipt_sent: "Un récépissé a été envoyé à votre email.",

    // Canton Modal
    select_your_canton: "Sélectionnez votre canton",

    // Footer
    footer_desc: "Service de transport avec chauffeur privé dans toute la Suisse.",
    footer_services: "Services",
    footer_regions: "Régions",
    footer_contact: "Contact",
    service_airport: "Transferts aéroport",
    service_business: "Business",
    service_events: "Événements",
    service_longdist: "Longue distance",
    all_rights: "Tous droits réservés.",
    link_terms: "CGV",
    link_privacy: "Confidentialité",
    link_legal: "Mentions légales",
  },

  de: {
    // Navigation
    skip_to_content: "Zum Inhalt springen",
    logo_subtitle: "Premium Transport",
    nav_booking: "Buchen",
    nav_services: "Dienste",
    nav_fleet: "Flotte",
    nav_contact: "Kontakt",
    quality_badge: "Offizieller kontrollierter Preis",

    // Hero
    hero_title: "Buchen Sie Ihren Chauffeur",
    hero_subtitle: "Pünktlicher und professioneller Service in der ganzen Schweiz",
    select_canton: "Ihr Kanton",
    more_cantons: "Mehr",

    // Trip Types
    trip_oneway: "Einfache Fahrt",
    trip_roundtrip: "Hin- und Rückfahrt",
    trip_halfday: "Halbtag",

    // Form Labels
    label_pickup: "Abholadresse",
    label_dropoff: "Zieladresse",
    label_date: "Datum",
    label_time: "Zeit",
    label_passengers: "Passagiere",
    label_vehicle: "Fahrzeugtyp",
    label_name: "Vollständiger Name",
    label_phone: "Telefon",
    label_email: "E-Mail",
    label_notes: "Notizen (optional)",

    // Placeholders
    placeholder_pickup: "z.B.: Bahnhof Genf-Cornavin",
    placeholder_dropoff: "z.B.: Flughafen Genf",
    placeholder_notes: "Flugnummer, spezielle Anweisungen...",

    // Quick Destinations
    quick_destinations: "Häufige Ziele:",
    poi_airport: "Flughafen",
    poi_station: "Bahnhof",
    poi_hospital: "Krankenhaus",

    // Passengers
    passengers_label: "Passagier(e)",

    // Vehicles
    vehicle_eco_desc: "Komfortabel, wirtschaftlich",
    vehicle_berline_desc: "Mercedes E-Klasse, BMW 5er",
    vehicle_van_desc: "Bis zu 7 Passagiere",
    vehicle_luxe_desc: "Mercedes S-Klasse, BMW 7er",
    badge_popular: "Beliebt",
    price_from: "ab",

    // Buttons
    btn_estimate: "Angebot erhalten",
    btn_confirm: "Buchung bestätigen",
    btn_download_receipt: "Quittung herunterladen",
    btn_close: "Schliessen",

    // Official Price
    official_price_title: "Offizieller kontrollierter Preis",
    official_price_desc: "Konform mit OTV - 7.7% MwSt. inkl.",

    // Estimate Modal
    estimate_title: "Ihre Schätzung",
    est_date: "Datum und Uhrzeit",
    est_distance: "Distanz",
    est_duration: "Geschätzte Dauer",
    est_vehicle: "Fahrzeug",

    // Price Breakdown
    price_breakdown: "Preisdetails",
    price_base: "Grundgebühr",
    price_distance: "Distanz",
    price_time: "Zeit",
    price_night: "Nachtzuschlag (22-6 Uhr)",
    price_weekend: "Wochenendzuschlag",
    price_subtotal: "Zwischensumme (netto)",
    price_vat: "MwSt. 7.7%",
    price_total: "Total (brutto)",
    price_eur: "EUR Äquivalent",

    // Customer Info
    your_info: "Ihre Informationen",

    // Payment
    payment_method: "Zahlungsmethode",
    payment_card: "Karte",
    payment_invoice: "Rechnung",
    payment_cash: "Bargeld",
    pay_with_twint: "Mit TWINT bezahlen",
    twint_instructions: "Scannen Sie diesen QR-Code mit Ihrer TWINT-App",

    // Terms
    accept_terms: "Ich akzeptiere die AGB und die Datenschutzrichtlinie",

    // Confirmation
    confirmation_title: "Buchung bestätigt!",
    reservation_number: "Reservierungsnummer:",
    receipt_sent: "Eine Quittung wurde an Ihre E-Mail gesendet.",

    // Canton Modal
    select_your_canton: "Wählen Sie Ihren Kanton",

    // Footer
    footer_desc: "Chauffeurservice in der ganzen Schweiz.",
    footer_services: "Dienste",
    footer_regions: "Regionen",
    footer_contact: "Kontakt",
    service_airport: "Flughafentransfers",
    service_business: "Business",
    service_events: "Veranstaltungen",
    service_longdist: "Langstrecke",
    all_rights: "Alle Rechte vorbehalten.",
    link_terms: "AGB",
    link_privacy: "Datenschutz",
    link_legal: "Impressum",
  },

  it: {
    // Navigation
    skip_to_content: "Vai al contenuto",
    logo_subtitle: "Trasporto Premium",
    nav_booking: "Prenota",
    nav_services: "Servizi",
    nav_fleet: "Flotta",
    nav_contact: "Contatto",
    quality_badge: "Prezzo ufficiale controllato",

    // Hero
    hero_title: "Prenota il tuo autista",
    hero_subtitle: "Servizio puntuale e professionale in tutta la Svizzera",
    select_canton: "Il tuo cantone",
    more_cantons: "Altro",

    // Trip Types
    trip_oneway: "Solo andata",
    trip_roundtrip: "Andata e ritorno",
    trip_halfday: "Mezza giornata",

    // Form Labels
    label_pickup: "Indirizzo di partenza",
    label_dropoff: "Indirizzo di arrivo",
    label_date: "Data",
    label_time: "Ora",
    label_passengers: "Passeggeri",
    label_vehicle: "Tipo di veicolo",
    label_name: "Nome completo",
    label_phone: "Telefono",
    label_email: "Email",
    label_notes: "Note (opzionale)",

    // Placeholders
    placeholder_pickup: "Es: Stazione di Ginevra-Cornavin",
    placeholder_dropoff: "Es: Aeroporto di Ginevra",
    placeholder_notes: "Numero volo, istruzioni speciali...",

    // Quick Destinations
    quick_destinations: "Destinazioni frequenti:",
    poi_airport: "Aeroporto",
    poi_station: "Stazione",
    poi_hospital: "Ospedale",

    // Passengers
    passengers_label: "passeggero(i)",

    // Vehicles
    vehicle_eco_desc: "Confortevole, economico",
    vehicle_berline_desc: "Mercedes Classe E, BMW Serie 5",
    vehicle_van_desc: "Fino a 7 passeggeri",
    vehicle_luxe_desc: "Mercedes Classe S, BMW Serie 7",
    badge_popular: "Popolare",
    price_from: "da",

    // Buttons
    btn_estimate: "Ottieni preventivo",
    btn_confirm: "Conferma prenotazione",
    btn_download_receipt: "Scarica ricevuta",
    btn_close: "Chiudi",

    // Official Price
    official_price_title: "Prezzo ufficiale controllato",
    official_price_desc: "Conforme all'OTV - IVA 7.7% inclusa",

    // Estimate Modal
    estimate_title: "Il tuo preventivo",
    est_date: "Data e ora",
    est_distance: "Distanza",
    est_duration: "Durata stimata",
    est_vehicle: "Veicolo",

    // Price Breakdown
    price_breakdown: "Dettaglio prezzo",
    price_base: "Tariffa base",
    price_distance: "Distanza",
    price_time: "Tempo",
    price_night: "Supplemento notturno (22-6)",
    price_weekend: "Supplemento fine settimana",
    price_subtotal: "Subtotale (netto)",
    price_vat: "IVA 7.7%",
    price_total: "Totale (lordo)",
    price_eur: "Equivalente EUR",

    // Customer Info
    your_info: "Le tue informazioni",

    // Payment
    payment_method: "Metodo di pagamento",
    payment_card: "Carta",
    payment_invoice: "Fattura",
    payment_cash: "Contanti",
    pay_with_twint: "Paga con TWINT",
    twint_instructions: "Scansiona questo codice QR con la tua app TWINT",

    // Terms
    accept_terms: "Accetto i termini e condizioni e l'informativa sulla privacy",

    // Confirmation
    confirmation_title: "Prenotazione confermata!",
    reservation_number: "N° prenotazione:",
    receipt_sent: "Una ricevuta è stata inviata alla tua email.",

    // Canton Modal
    select_your_canton: "Seleziona il tuo cantone",

    // Footer
    footer_desc: "Servizio di trasporto con autista privato in tutta la Svizzera.",
    footer_services: "Servizi",
    footer_regions: "Regioni",
    footer_contact: "Contatto",
    service_airport: "Trasferimenti aeroporto",
    service_business: "Business",
    service_events: "Eventi",
    service_longdist: "Lunga distanza",
    all_rights: "Tutti i diritti riservati.",
    link_terms: "CGV",
    link_privacy: "Privacy",
    link_legal: "Note legali",
  },

  en: {
    // Navigation
    skip_to_content: "Skip to content",
    logo_subtitle: "Premium Transport",
    nav_booking: "Book",
    nav_services: "Services",
    nav_fleet: "Fleet",
    nav_contact: "Contact",
    quality_badge: "Official controlled price",

    // Hero
    hero_title: "Book your chauffeur",
    hero_subtitle: "Punctual and professional service throughout Switzerland",
    select_canton: "Your canton",
    more_cantons: "More",

    // Trip Types
    trip_oneway: "One way",
    trip_roundtrip: "Round trip",
    trip_halfday: "Half day",

    // Form Labels
    label_pickup: "Pickup address",
    label_dropoff: "Drop-off address",
    label_date: "Date",
    label_time: "Time",
    label_passengers: "Passengers",
    label_vehicle: "Vehicle type",
    label_name: "Full name",
    label_phone: "Phone",
    label_email: "Email",
    label_notes: "Notes (optional)",

    // Placeholders
    placeholder_pickup: "e.g.: Geneva-Cornavin Station",
    placeholder_dropoff: "e.g.: Geneva Airport",
    placeholder_notes: "Flight number, special instructions...",

    // Quick Destinations
    quick_destinations: "Frequent destinations:",
    poi_airport: "Airport",
    poi_station: "Station",
    poi_hospital: "Hospital",

    // Passengers
    passengers_label: "passenger(s)",

    // Vehicles
    vehicle_eco_desc: "Comfortable, economical",
    vehicle_berline_desc: "Mercedes E-Class, BMW 5 Series",
    vehicle_van_desc: "Up to 7 passengers",
    vehicle_luxe_desc: "Mercedes S-Class, BMW 7 Series",
    badge_popular: "Popular",
    price_from: "from",

    // Buttons
    btn_estimate: "Get a quote",
    btn_confirm: "Confirm booking",
    btn_download_receipt: "Download receipt",
    btn_close: "Close",

    // Official Price
    official_price_title: "Official controlled price",
    official_price_desc: "Compliant with OTV - 7.7% VAT included",

    // Estimate Modal
    estimate_title: "Your estimate",
    est_date: "Date and time",
    est_distance: "Distance",
    est_duration: "Estimated duration",
    est_vehicle: "Vehicle",

    // Price Breakdown
    price_breakdown: "Price breakdown",
    price_base: "Base fare",
    price_distance: "Distance",
    price_time: "Time",
    price_night: "Night surcharge (10pm-6am)",
    price_weekend: "Weekend surcharge",
    price_subtotal: "Subtotal (excl. VAT)",
    price_vat: "VAT 7.7%",
    price_total: "Total (incl. VAT)",
    price_eur: "EUR equivalent",

    // Customer Info
    your_info: "Your information",

    // Payment
    payment_method: "Payment method",
    payment_card: "Card",
    payment_invoice: "Invoice",
    payment_cash: "Cash",
    pay_with_twint: "Pay with TWINT",
    twint_instructions: "Scan this QR code with your TWINT app",

    // Terms
    accept_terms: "I accept the terms and conditions and privacy policy",

    // Confirmation
    confirmation_title: "Booking confirmed!",
    reservation_number: "Reservation number:",
    receipt_sent: "A receipt has been sent to your email.",

    // Canton Modal
    select_your_canton: "Select your canton",

    // Footer
    footer_desc: "Private chauffeur service throughout Switzerland.",
    footer_services: "Services",
    footer_regions: "Regions",
    footer_contact: "Contact",
    service_airport: "Airport transfers",
    service_business: "Business",
    service_events: "Events",
    service_longdist: "Long distance",
    all_rights: "All rights reserved.",
    link_terms: "Terms",
    link_privacy: "Privacy",
    link_legal: "Legal notice",
  },
};

// i18n Class
class I18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = translations;
  }

  /**
   * Detect user's preferred language
   */
  detectLanguage() {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    if (urlLang && this.isValidLang(urlLang)) {
      return urlLang;
    }

    // Check localStorage
    const storedLang = localStorage.getItem("vtc-lang");
    if (storedLang && this.isValidLang(storedLang)) {
      return storedLang;
    }

    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    if (this.isValidLang(browserLang)) {
      return browserLang;
    }

    // Default to French (most common in Swiss VTC)
    return "fr";
  }

  /**
   * Check if language is valid
   */
  isValidLang(lang) {
    return ["fr", "de", "it", "en"].includes(lang);
  }

  /**
   * Get translation
   */
  t(key) {
    return (
      this.translations[this.currentLang]?.[key] ||
      this.translations.fr[key] ||
      key
    );
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    if (!this.isValidLang(lang)) return;

    this.currentLang = lang;
    localStorage.setItem("vtc-lang", lang);

    // Update HTML lang attribute
    document.documentElement.lang =
      lang === "fr"
        ? "fr-CH"
        : lang === "de"
          ? "de-CH"
          : lang === "it"
            ? "it-CH"
            : "en";

    // Update all translated elements
    this.updatePage();

    // Update active button
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
      btn.setAttribute("aria-selected", btn.dataset.lang === lang);
    });

    // Dispatch event
    window.dispatchEvent(
      new CustomEvent("languageChanged", { detail: { lang } })
    );
  }

  /**
   * Update all translated elements on page
   */
  updatePage() {
    // Update text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = this.t(key);
    });

    // Update ARIA labels
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.dataset.i18nAria;
      el.setAttribute("aria-label", this.t(key));
    });
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Get language name
   */
  getLanguageName(lang = this.currentLang) {
    const names = {
      fr: "Français",
      de: "Deutsch",
      it: "Italiano",
      en: "English",
    };
    return names[lang] || lang;
  }
}

// Create global instance
window.i18n = new I18n();

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // Set initial language
  window.i18n.updatePage();

  // Bind language buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.i18n.setLanguage(btn.dataset.lang);
    });

    // Set initial active state
    btn.classList.toggle("active", btn.dataset.lang === window.i18n.getLanguage());
  });
});

export default window.i18n;
