/**
 * ================================================================
 * ROMUO.CH - Configuration Suisse Centralisee
 * ================================================================
 * Ce fichier contient toutes les configurations specifiques
 * a la Suisse pour l'application VTC Romuo
 * ================================================================
 */

export const SWISS_CONFIG = {
  // ============================================
  // INFORMATIONS ENTREPRISE
  // ============================================
  company: {
    name: 'Romuo',
    legalName: 'Romuo VTC Suisse',
    domain: 'romuo.ch',
    url: 'https://romuo.ch',
    apiUrl: 'https://api.romuo.ch',
    email: 'contact@romuo.ch',
    phone: '+41 XX XXX XX XX',
    slogan: 'Transport VTC Premium en Suisse Romande',
  },

  // ============================================
  // LOCALISATION SUISSE
  // ============================================
  locale: {
    country: 'CH',
    countryName: 'Suisse',
    language: 'fr',
    languageTag: 'fr-CH',
    timezone: 'Europe/Zurich',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1, // Lundi
  },

  // ============================================
  // DEVISE ET TARIFICATION
  // ============================================
  currency: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Franc Suisse',
    decimals: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.',
    position: 'after', // "45.00 CHF"

    // Formater un montant
    format: (amount) => {
      const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      return `${formatted} CHF`;
    },
  },

  // ============================================
  // TARIFS VEHICULES (CHF)
  // ============================================
  pricing: {
    vehicles: {
      eco: {
        id: 'eco',
        name: 'Eco',
        description: 'Berline confortable pour 1-4 passagers',
        maxPassengers: 4,
        maxLuggage: 3,
        baseFare: 6.00,      // CHF
        ratePerKm: 2.50,     // CHF/km
        ratePerMinute: 0.40, // CHF/min
        minFare: 15.00,      // CHF minimum
        image: '/vehicles/eco.png',
      },
      berline: {
        id: 'berline',
        name: 'Berline Luxe',
        description: 'Mercedes Classe E ou equivalent',
        maxPassengers: 4,
        maxLuggage: 4,
        baseFare: 10.00,
        ratePerKm: 3.50,
        ratePerMinute: 0.60,
        minFare: 25.00,
        image: '/vehicles/berline.png',
      },
      van: {
        id: 'van',
        name: 'Van Premium',
        description: 'Mercedes Classe V pour groupes',
        maxPassengers: 7,
        maxLuggage: 7,
        baseFare: 15.00,
        ratePerKm: 4.50,
        ratePerMinute: 0.80,
        minFare: 35.00,
        image: '/vehicles/van.png',
      },
      bus: {
        id: 'bus',
        name: 'Minibus',
        description: 'Pour groupes de 8-50 passagers',
        maxPassengers: 50,
        maxLuggage: 50,
        baseFare: 25.00,
        ratePerKm: 6.00,
        ratePerMinute: 1.00,
        minFare: 80.00,
        image: '/vehicles/bus.png',
      },
    },

    // Supplements
    surcharges: {
      night: {
        name: 'Supplement nuit',
        description: '22h00 - 06h00',
        multiplier: 1.20, // +20%
        startHour: 22,
        endHour: 6,
      },
      airport: {
        name: 'Supplement aeroport',
        description: 'Prise en charge aeroport',
        flatFee: 12.00, // CHF
        airports: ['GVA', 'ZRH', 'BSL', 'BRN'],
      },
      luggage: {
        name: 'Supplement bagages',
        description: 'Bagage supplementaire',
        flatFee: 5.00, // CHF par bagage
      },
      waiting: {
        name: 'Temps d\'attente',
        description: 'Apres 15 minutes gratuites',
        ratePerMinute: 0.50, // CHF/min
        freeMinutes: 15,
      },
    },

    // Tarifs fixes (zones predefinies)
    fixedRoutes: [
      {
        id: 'gva-lausanne',
        from: 'Aeroport de Geneve',
        to: 'Lausanne',
        prices: { eco: 85, berline: 120, van: 160 },
      },
      {
        id: 'gva-montreux',
        from: 'Aeroport de Geneve',
        to: 'Montreux',
        prices: { eco: 110, berline: 150, van: 200 },
      },
      {
        id: 'gva-verbier',
        from: 'Aeroport de Geneve',
        to: 'Verbier',
        prices: { eco: 180, berline: 240, van: 320 },
      },
      {
        id: 'gva-zermatt',
        from: 'Aeroport de Geneve',
        to: 'Zermatt',
        prices: { eco: 350, berline: 450, van: 600 },
      },
      {
        id: 'zrh-zurich',
        from: 'Aeroport de Zurich',
        to: 'Zurich Centre',
        prices: { eco: 50, berline: 70, van: 95 },
      },
    ],
  },

  // ============================================
  // VILLES SUISSES
  // ============================================
  cities: {
    // Suisse Romande (zone principale)
    romande: [
      { id: 'geneva', name: 'Geneve', canton: 'GE', lat: 46.2044, lng: 6.1432, airport: 'GVA' },
      { id: 'lausanne', name: 'Lausanne', canton: 'VD', lat: 46.5197, lng: 6.6323 },
      { id: 'montreux', name: 'Montreux', canton: 'VD', lat: 46.4312, lng: 6.9107 },
      { id: 'vevey', name: 'Vevey', canton: 'VD', lat: 46.4628, lng: 6.8418 },
      { id: 'nyon', name: 'Nyon', canton: 'VD', lat: 46.3833, lng: 6.2398 },
      { id: 'morges', name: 'Morges', canton: 'VD', lat: 46.5117, lng: 6.4992 },
      { id: 'yverdon', name: 'Yverdon-les-Bains', canton: 'VD', lat: 46.7785, lng: 6.6410 },
      { id: 'sion', name: 'Sion', canton: 'VS', lat: 46.2333, lng: 7.3667 },
      { id: 'martigny', name: 'Martigny', canton: 'VS', lat: 46.1028, lng: 7.0736 },
      { id: 'sierre', name: 'Sierre', canton: 'VS', lat: 46.2919, lng: 7.5353 },
      { id: 'monthey', name: 'Monthey', canton: 'VS', lat: 46.2544, lng: 6.9544 },
      { id: 'fribourg', name: 'Fribourg', canton: 'FR', lat: 46.8065, lng: 7.1620 },
      { id: 'neuchatel', name: 'Neuchatel', canton: 'NE', lat: 46.9900, lng: 6.9293 },
    ],
    // Reste de la Suisse
    other: [
      { id: 'bern', name: 'Berne', canton: 'BE', lat: 46.9480, lng: 7.4474, capital: true },
      { id: 'zurich', name: 'Zurich', canton: 'ZH', lat: 47.3769, lng: 8.5417, airport: 'ZRH' },
      { id: 'basel', name: 'Bale', canton: 'BS', lat: 47.5596, lng: 7.5886, airport: 'BSL' },
      { id: 'lugano', name: 'Lugano', canton: 'TI', lat: 46.0037, lng: 8.9511 },
    ],
  },

  // ============================================
  // AEROPORTS SUISSES
  // ============================================
  airports: [
    {
      code: 'GVA',
      name: 'Aeroport International de Geneve',
      city: 'Geneve',
      lat: 46.2381,
      lng: 6.1089,
      terminal: 'Terminal Principal',
    },
    {
      code: 'ZRH',
      name: 'Aeroport de Zurich',
      city: 'Zurich',
      lat: 47.4647,
      lng: 8.5492,
      terminal: 'Terminal 1/2/3',
    },
    {
      code: 'BSL',
      name: 'EuroAirport Basel-Mulhouse',
      city: 'Bale',
      lat: 47.5896,
      lng: 7.5299,
      terminal: 'Terminal Suisse',
    },
    {
      code: 'BRN',
      name: 'Aeroport de Berne',
      city: 'Berne',
      lat: 46.9141,
      lng: 7.4971,
      terminal: 'Terminal Principal',
    },
  ],

  // ============================================
  // STATIONS DE SKI (saison hiver)
  // ============================================
  skiResorts: [
    { id: 'verbier', name: 'Verbier', altitude: 1500, lat: 46.0967, lng: 7.2286 },
    { id: 'zermatt', name: 'Zermatt', altitude: 1620, lat: 46.0207, lng: 7.7491 },
    { id: 'crans-montana', name: 'Crans-Montana', altitude: 1500, lat: 46.3072, lng: 7.4810 },
    { id: 'villars', name: 'Villars-sur-Ollon', altitude: 1250, lat: 46.2998, lng: 7.0547 },
    { id: 'leysin', name: 'Leysin', altitude: 1260, lat: 46.3437, lng: 7.0133 },
    { id: 'grindelwald', name: 'Grindelwald', altitude: 1034, lat: 46.6246, lng: 8.0414 },
    { id: 'st-moritz', name: 'St. Moritz', altitude: 1822, lat: 46.4908, lng: 9.8355 },
    { id: 'davos', name: 'Davos', altitude: 1560, lat: 46.8027, lng: 9.8360 },
  ],

  // ============================================
  // LIGNE NOCTURNE (service special)
  // ============================================
  nightLine: {
    enabled: true,
    name: 'Ligne Nocturne Romande',
    route: 'Martigny - Sion - Montreux - Vevey - Lausanne',
    days: ['friday', 'saturday'],
    departures: {
      martigny: ['23:00', '01:00'],
      lausanne: ['03:00'], // retour
    },
    stops: [
      { city: 'Martigny', time: '23:00' },
      { city: 'Sion', time: '23:35' },
      { city: 'Montreux', time: '00:15' },
      { city: 'Vevey', time: '00:25' },
      { city: 'Lausanne', time: '00:45' },
    ],
    pricing: {
      perPerson: 25.00, // CHF
      fullVan: 150.00,  // CHF pour 7 personnes max
    },
  },

  // ============================================
  // METHODES DE PAIEMENT SUISSES
  // ============================================
  paymentMethods: [
    { id: 'cash', name: 'Especes (CHF)', icon: 'banknote', enabled: true },
    { id: 'card', name: 'Carte bancaire', icon: 'credit-card', enabled: true },
    { id: 'twint', name: 'TWINT', icon: 'smartphone', enabled: true, popular: true },
    { id: 'invoice', name: 'Facture', icon: 'file-text', enabled: true, businessOnly: true },
    { id: 'postfinance', name: 'PostFinance', icon: 'building', enabled: false },
  ],

  // ============================================
  // HEURES D'OUVERTURE
  // ============================================
  businessHours: {
    standard: {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
      wednesday: { open: '06:00', close: '23:00' },
      thursday: { open: '06:00', close: '23:00' },
      friday: { open: '06:00', close: '02:00' },
      saturday: { open: '06:00', close: '02:00' },
      sunday: { open: '06:00', close: '23:00' },
    },
    airport: '24/7', // Service aeroport 24h
    holidays: 'Ouvert les jours feries',
  },

  // ============================================
  // JOURS FERIES SUISSES 2026
  // ============================================
  holidays2026: [
    { date: '2026-01-01', name: 'Nouvel An' },
    { date: '2026-01-02', name: 'Lendemain du Nouvel An (GE, VD)' },
    { date: '2026-04-03', name: 'Vendredi Saint' },
    { date: '2026-04-06', name: 'Lundi de Paques' },
    { date: '2026-05-14', name: 'Ascension' },
    { date: '2026-05-25', name: 'Lundi de Pentecote' },
    { date: '2026-08-01', name: 'Fete nationale suisse' },
    { date: '2026-09-10', name: 'Jeune genevois (GE)' },
    { date: '2026-12-25', name: 'Noel' },
    { date: '2026-12-31', name: 'Restauration de la Republique (GE)' },
  ],

  // ============================================
  // SEO ET META
  // ============================================
  seo: {
    title: 'Romuo - VTC Premium Suisse Romande',
    description: 'Service de transport VTC haut de gamme en Suisse Romande. Transferts aeroport Geneve, Lausanne, Montreux. Reservez en ligne 24/7.',
    keywords: [
      'VTC Suisse',
      'taxi Geneve',
      'transfert aeroport Geneve',
      'chauffeur prive Lausanne',
      'transport Montreux',
      'VTC Suisse Romande',
      'navette aeroport',
    ],
    ogImage: 'https://romuo.ch/og-image.jpg',
  },

  // ============================================
  // RESEAUX SOCIAUX
  // ============================================
  social: {
    facebook: 'https://facebook.com/romuo.ch',
    instagram: 'https://instagram.com/romuo.ch',
    linkedin: 'https://linkedin.com/company/romuo',
  },

  // ============================================
  // CONFORMITE SUISSE
  // ============================================
  legal: {
    vatNumber: 'CHE-XXX.XXX.XXX TVA',
    vatRate: 8.1, // Taux TVA Suisse 2024
    dataProtection: 'nLPD', // Nouvelle Loi sur la Protection des Donnees
    cookieConsent: true,
    termsUrl: '/conditions-generales',
    privacyUrl: '/politique-confidentialite',
  },
};

// Export des helpers
export const formatCHF = SWISS_CONFIG.currency.format;
export const getVehiclePrice = (vehicleId) => SWISS_CONFIG.pricing.vehicles[vehicleId];
export const getCities = () => [...SWISS_CONFIG.cities.romande, ...SWISS_CONFIG.cities.other];
export const getAirports = () => SWISS_CONFIG.airports;

export default SWISS_CONFIG;
