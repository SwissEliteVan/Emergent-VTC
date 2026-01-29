import { Car, Bus, Users } from 'lucide-react';

// ==========================================================
// SERVICES ROMUO - Voiture, Van, Bus
// ==========================================================

export const VEHICLE_TYPES = [
  {
    id: 'voiture',
    name: 'Voiture',
    shortName: 'Voiture',
    description: 'Confort et elegance pour vos deplacements',
    vehicleModel: 'Berline Premium',
    icon: Car,
    basePrice: 8,
    pricePerKm: 3.5,
    capacity: 4,
    luggage: 3,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop',
    features: [
      'Berline haut de gamme',
      'Climatisation automatique',
      'Sieges cuir confortables',
      'Chauffeur professionnel',
      'Bouteille d\'eau offerte',
      'Chargeurs USB'
    ],
    badge: 'POPULAIRE',
    popular: true,
    idealFor: 'Trajets quotidiens, rendez-vous, aeroports'
  },
  {
    id: 'van',
    name: 'Van',
    shortName: 'Van',
    description: 'Espace et confort pour groupes et familles',
    vehicleModel: 'Van 7-9 places',
    icon: Users,
    basePrice: 15,
    pricePerKm: 5.5,
    capacity: 9,
    luggage: 8,
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop',
    features: [
      'Van spacieux 7-9 places',
      'Grand espace bagages',
      'Ideal familles et groupes',
      'Confort premium',
      'Climatisation zone arriere',
      'WiFi disponible'
    ],
    badge: 'FAMILLE',
    popular: false,
    idealFor: 'Familles, groupes d\'amis, sorties'
  },
  {
    id: 'bus',
    name: 'Bus',
    shortName: 'Bus',
    description: 'Transport de groupe jusqu\'a 50 personnes',
    vehicleModel: 'Minibus / Bus',
    icon: Bus,
    basePrice: 80,
    pricePerKm: 12,
    capacity: 50,
    luggage: 50,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop',
    features: [
      'Minibus 20 places ou Bus 50 places',
      'Ideal evenements et excursions',
      'Soute a bagages XXL',
      'Microphone pour guide',
      'Climatisation',
      'Prix degressif par personne'
    ],
    badge: 'GROUPE',
    popular: false,
    idealFor: 'Entreprises, associations, evenements'
  }
];

// ==========================================================
// OFFRES SPECIALES
// ==========================================================

export const SPECIAL_OFFERS = {
  youth: {
    id: 'youth',
    name: 'Tarif Jeune',
    description: 'Moins de 26 ans',
    discount: 15, // %
    badge: '-15%',
    color: 'green',
    conditions: 'Valable sur presentation d\'une piece d\'identite'
  },
  nightLine: {
    id: 'nightLine',
    name: 'Ligne Nocturne',
    description: 'Martigny - Lausanne',
    subtitle: 'Chaque week-end',
    schedules: ['Vendredi', 'Samedi'],
    departures: ['23h00', '01h00', '03h00'],
    route: {
      from: 'Martigny',
      to: 'Lausanne',
      stops: ['Sion', 'Montreux', 'Vevey']
    },
    priceFrom: 25,
    badge: 'NOCTAMBULES'
  },
  rideshare: {
    id: 'rideshare',
    name: 'Covoiturage',
    description: 'Partagez votre trajet',
    discount: 25, // %
    badge: '-25%',
    conditions: 'Prix par personne, minimum 2 passagers'
  }
};

// ==========================================================
// LIGNES REGULIERES
// ==========================================================

export const REGULAR_LINES = [
  {
    id: 'martigny-lausanne-night',
    name: 'Ligne Nocturne Martigny-Lausanne',
    type: 'night',
    from: 'Martigny',
    to: 'Lausanne',
    stops: ['Sion', 'Montreux', 'Vevey', 'Lausanne'],
    schedule: {
      days: ['Vendredi', 'Samedi'],
      departures: [
        { time: '23:00', from: 'Martigny' },
        { time: '01:00', from: 'Martigny' },
        { time: '03:00', from: 'Lausanne (retour)' }
      ]
    },
    priceFrom: 25,
    duration: '1h30',
    distance: 100
  }
];

// ==========================================================
// TRAJETS POPULAIRES
// ==========================================================

export const POPULAR_ROUTES = [
  {
    id: 'martigny-lausanne',
    from: 'Martigny',
    to: 'Lausanne',
    distance: 75,
    duration: '55 min',
    priceFrom: 270,
    description: 'Ligne directe'
  },
  {
    id: 'martigny-geneve',
    from: 'Martigny',
    to: 'Geneve Aeroport',
    distance: 110,
    duration: '1h20',
    priceFrom: 390,
    description: 'Transfert aeroport'
  },
  {
    id: 'lausanne-geneve',
    from: 'Lausanne',
    to: 'Geneve Aeroport',
    distance: 65,
    duration: '45 min',
    priceFrom: 235,
    description: 'Transfert aeroport'
  },
  {
    id: 'montreux-lausanne',
    from: 'Montreux',
    to: 'Lausanne',
    distance: 30,
    duration: '25 min',
    priceFrom: 115,
    description: 'Riviera'
  },
  {
    id: 'sion-lausanne',
    from: 'Sion',
    to: 'Lausanne',
    distance: 95,
    duration: '1h10',
    priceFrom: 340,
    description: 'Valais - Vaud'
  }
];

// ==========================================================
// CIBLES CLIENTELE
// ==========================================================

export const TARGET_AUDIENCES = [
  {
    id: 'youth',
    title: 'Jeunes',
    subtitle: 'Sorties du week-end',
    icon: 'party',
    description: 'Rentrez en toute securite apres vos soirees',
    benefit: 'Tarifs reduits -15%',
    cta: 'Decouvrir les tarifs jeunes'
  },
  {
    id: 'seniors',
    title: 'Seniors',
    subtitle: 'Courses quotidiennes',
    icon: 'heart',
    description: 'Medecin, courses, visites... on s\'occupe de tout',
    benefit: 'Service porte-a-porte',
    cta: 'Reserver un transport'
  },
  {
    id: 'nocar',
    title: 'Sans vehicule',
    subtitle: 'Liberte de deplacement',
    icon: 'map',
    description: 'Plus besoin de voiture pour vous deplacer',
    benefit: 'Disponible 7j/7',
    cta: 'Commander maintenant'
  },
  {
    id: 'business',
    title: 'Professionnels',
    subtitle: 'Trajets d\'affaires',
    icon: 'briefcase',
    description: 'Ponctualite et discretion pour vos rendez-vous',
    benefit: 'Facturation entreprise',
    cta: 'Ouvrir un compte pro'
  }
];

// ==========================================================
// TARIFS ADDITIONNELS
// ==========================================================

export const ADDITIONAL_FEES = {
  nightSurcharge: {
    label: 'Supplement nocturne',
    description: '22h00 - 06h00',
    amount: 10,
    currency: 'CHF',
    type: 'fixed'
  },
  airportPickup: {
    label: 'Prise en charge aeroport',
    description: 'Geneve, Zurich',
    amount: 15,
    currency: 'CHF',
    type: 'fixed'
  },
  waitingTime: {
    label: 'Temps d\'attente',
    description: 'Par tranche de 15 minutes',
    amount: 10,
    currency: 'CHF',
    type: 'per_unit'
  },
  childSeat: {
    label: 'Siege enfant',
    description: 'Sur demande',
    amount: 0,
    currency: 'CHF',
    type: 'fixed'
  }
};

// ==========================================================
// FONCTIONS UTILITAIRES
// ==========================================================

/**
 * Calcule le prix d'un trajet
 */
export const calculatePrice = (distance, vehicleType, options = {}) => {
  const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);
  if (!vehicle) return null;

  let total = vehicle.basePrice + (distance * vehicle.pricePerKm);

  // Reductions
  if (options.isYouth) {
    total *= (1 - SPECIAL_OFFERS.youth.discount / 100);
  }
  if (options.isRideshare) {
    total *= (1 - SPECIAL_OFFERS.rideshare.discount / 100);
  }

  // Supplements
  if (options.nightTime) total += ADDITIONAL_FEES.nightSurcharge.amount;
  if (options.airport) total += ADDITIONAL_FEES.airportPickup.amount;
  if (options.waitingTime) total += ADDITIONAL_FEES.waitingTime.amount * options.waitingTime;

  return {
    basePrice: vehicle.basePrice,
    distancePrice: Math.round(distance * vehicle.pricePerKm),
    discounts: options.isYouth || options.isRideshare ? 'Reduction appliquee' : null,
    additionalFees: total - vehicle.basePrice - (distance * vehicle.pricePerKm),
    total: Math.round(total),
    currency: 'CHF',
    distance: distance,
    vehicle: vehicle.name
  };
};

/**
 * Estime la distance entre deux villes
 */
export const estimateDistance = (from, to) => {
  const normalizedFrom = from.toLowerCase();
  const normalizedTo = to.toLowerCase();

  // Distances connues
  const distances = {
    'martigny-lausanne': 75,
    'martigny-geneve': 110,
    'martigny-sion': 30,
    'lausanne-geneve': 65,
    'lausanne-montreux': 30,
    'lausanne-vevey': 25,
    'montreux-vevey': 7,
    'sion-lausanne': 95,
    'sion-geneve': 160
  };

  const key1 = `${normalizedFrom}-${normalizedTo}`;
  const key2 = `${normalizedTo}-${normalizedFrom}`;

  if (distances[key1]) return distances[key1];
  if (distances[key2]) return distances[key2];

  // Distance par defaut
  return 30;
};

/**
 * Calcule tous les prix pour un trajet
 */
export const getAllPricesForRoute = (distance, options = {}) => {
  const prices = {};
  VEHICLE_TYPES.forEach(vehicle => {
    const priceData = calculatePrice(distance, vehicle.id, options);
    if (priceData) {
      prices[vehicle.id] = priceData.total;
    }
  });
  return prices;
};

/**
 * Formate un prix en CHF
 */
export const formatPrice = (amount) => {
  return `${Math.round(amount)} CHF`;
};
