import { Car, Sparkles, Users } from 'lucide-react';

export const VEHICLE_TYPES = [
  {
    id: 'eco',
    name: 'Eco',
    description: 'Véhicule économique et confortable pour vos trajets quotidiens',
    icon: Car,
    basePrice: 6,
    pricePerKm: 3,
    capacity: 4,
    features: [
      'Véhicule récent et climatisé',
      'Chauffeur professionnel',
      'Eau minérale offerte',
      'Wi-Fi gratuit'
    ],
    image: '🚗'
  },
  {
    id: 'berline',
    name: 'Berline Luxe',
    description: 'Mercedes Classe E ou équivalent pour un confort premium',
    icon: Sparkles,
    basePrice: 10,
    pricePerKm: 5,
    capacity: 4,
    features: [
      'Mercedes Classe E ou BMW Série 5',
      'Sièges en cuir',
      'Boissons premium offertes',
      'Chargeurs smartphone',
      'Wi-Fi haut débit'
    ],
    image: '🚙',
    popular: true
  },
  {
    id: 'van',
    name: 'Van Premium',
    description: 'Mercedes Vito ou V-Class pour groupes jusqu\'à 7 personnes',
    icon: Users,
    basePrice: 15,
    pricePerKm: 7,
    capacity: 7,
    features: [
      'Mercedes Vito ou V-Class',
      'Espace bagages généreux',
      'Sièges confortables',
      'Parfait pour groupes et familles',
      'Boissons et snacks offerts'
    ],
    image: '🚐'
  }
];

// Tarifs additionnels
export const ADDITIONAL_FEES = {
  nightSurcharge: {
    description: 'Supplément nocturne (22h - 6h)',
    amount: 5,
    currency: 'CHF'
  },
  airportPickup: {
    description: 'Prise en charge aéroport',
    amount: 10,
    currency: 'CHF'
  },
  waitingTime: {
    description: 'Temps d\'attente par 15 minutes',
    amount: 8,
    currency: 'CHF'
  }
};

// Zones de service
export const SERVICE_ZONES = {
  primary: {
    name: 'Zone principale',
    cities: ['Vevey', 'Montreux', 'La Tour-de-Peilz', 'Clarens', 'Chillon'],
    description: 'Service disponible 24/7'
  },
  extended: {
    name: 'Zone étendue',
    cities: ['Lausanne', 'Genève', 'Sion', 'Fribourg', 'Berne'],
    description: 'Service disponible sur réservation'
  }
};
