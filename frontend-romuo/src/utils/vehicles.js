import { Car, Sparkles, Users } from 'lucide-react';

export const VEHICLE_TYPES = [
  {
    id: 'eco',
    name: 'Eco',
    description: 'Confortable et économique pour vos trajets quotidiens',
    vehicleModel: 'Volkswagen Passat ou similaire',
    icon: Car,
    basePrice: 6,
    pricePerKm: 3,
    capacity: 4,
    luggage: 2,
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&auto=format&fit=crop',
    features: [
      'Véhicule récent et climatisé',
      'Chauffeur professionnel certifié',
      'Eau minérale offerte',
      'Wi-Fi gratuit à bord',
      'Chargeur smartphone USB'
    ]
  },
  {
    id: 'berline',
    name: 'Berline Luxe',
    description: 'Confort premium pour vos déplacements d\'affaires',
    vehicleModel: 'Mercedes Classe E, BMW Série 5',
    icon: Sparkles,
    basePrice: 10,
    pricePerKm: 5,
    capacity: 4,
    luggage: 3,
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&auto=format&fit=crop',
    features: [
      'Mercedes Classe E ou BMW Série 5',
      'Sièges en cuir chauffants',
      'Boissons premium offertes',
      'Chargeurs sans fil',
      'Wi-Fi haut débit',
      'Journal du jour'
    ],
    popular: true
  },
  {
    id: 'van',
    name: 'Van Premium',
    description: 'Idéal pour groupes et familles avec bagages',
    vehicleModel: 'Mercedes Vito, V-Class',
    icon: Users,
    basePrice: 15,
    pricePerKm: 7,
    capacity: 7,
    luggage: 6,
    image: 'https://images.unsplash.com/photo-1664574654529-b60630f33fdb?w=800&auto=format&fit=crop',
    features: [
      'Mercedes Vito ou V-Class',
      'Espace bagages XXL',
      '7 sièges confortables',
      'Parfait pour groupes et événements',
      'Boissons et snacks offerts',
      'Système audio premium'
    ]
  }
];

// Tarifs additionnels
export const ADDITIONAL_FEES = {
  nightSurcharge: {
    label: 'Supplément nocturne',
    description: '22h00 - 06h00',
    amount: 5,
    currency: 'CHF',
    type: 'fixed'
  },
  airportPickup: {
    label: 'Prise en charge aéroport',
    description: 'Genève, Zurich',
    amount: 10,
    currency: 'CHF',
    type: 'fixed'
  },
  waitingTime: {
    label: 'Temps d\'attente',
    description: 'Par tranche de 15 minutes',
    amount: 8,
    currency: 'CHF',
    type: 'per_unit'
  },
  childSeat: {
    label: 'Siège enfant',
    description: 'Sur demande',
    amount: 5,
    currency: 'CHF',
    type: 'fixed'
  }
};

// Zones de service avec distances estimées depuis Vevey
export const SERVICE_ZONES = {
  local: {
    name: 'Zone locale',
    cities: [
      { name: 'Vevey', distance: 0 },
      { name: 'Montreux', distance: 7 },
      { name: 'La Tour-de-Peilz', distance: 2 },
      { name: 'Clarens', distance: 5 },
      { name: 'Villeneuve', distance: 12 }
    ],
    description: 'Service immédiat 24/7',
    responseTime: '5-10 min'
  },
  regional: {
    name: 'Zone régionale',
    cities: [
      { name: 'Lausanne', distance: 25 },
      { name: 'Genève Aéroport', distance: 95 },
      { name: 'Sion', distance: 60 },
      { name: 'Fribourg', distance: 80 }
    ],
    description: 'Réservation recommandée',
    responseTime: '15-30 min'
  },
  extended: {
    name: 'Zone étendue',
    cities: [
      { name: 'Zurich Aéroport', distance: 220 },
      { name: 'Berne', distance: 110 },
      { name: 'Interlaken', distance: 95 }
    ],
    description: 'Sur réservation uniquement',
    responseTime: 'Selon disponibilité'
  }
};

// Fonctions utilitaires
export const calculatePrice = (distance, vehicleType, options = {}) => {
  const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);
  if (!vehicle) return null;

  let total = vehicle.basePrice + (distance * vehicle.pricePerKm);

  // Ajouter les frais additionnels
  if (options.nightTime) {
    total += ADDITIONAL_FEES.nightSurcharge.amount;
  }
  if (options.airport) {
    total += ADDITIONAL_FEES.airportPickup.amount;
  }
  if (options.waitingTime) {
    total += ADDITIONAL_FEES.waitingTime.amount * options.waitingTime;
  }
  if (options.childSeat) {
    total += ADDITIONAL_FEES.childSeat.amount;
  }

  return {
    basePrice: vehicle.basePrice,
    distancePrice: distance * vehicle.pricePerKm,
    additionalFees: total - vehicle.basePrice - (distance * vehicle.pricePerKm),
    total: total,
    currency: 'CHF',
    distance: distance,
    vehicle: vehicle.name
  };
};

export const estimateDistance = (from, to) => {
  // Simuler le calcul de distance (en production, utiliser une vraie API)
  // Pour l'instant, distances estimées depuis Vevey
  const destinations = {
    'montreux': 7,
    'lausanne': 25,
    'geneve': 95,
    'sion': 60,
    'zurich': 220,
    'berne': 110
  };

  const normalizedTo = to.toLowerCase();
  for (const [city, distance] of Object.entries(destinations)) {
    if (normalizedTo.includes(city)) {
      return distance;
    }
  }

  // Distance par défaut
  return 15;
};
