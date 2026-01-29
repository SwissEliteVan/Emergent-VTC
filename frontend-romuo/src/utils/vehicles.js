import { Car, Sparkles, Users } from 'lucide-react';

// Véhicules avec photos Tesla
export const VEHICLE_TYPES = [
  {
    id: 'eco',
    name: 'Tesla Model 3',
    description: 'Électrique, silencieux et confortable',
    vehicleModel: 'Tesla Model 3 Standard Range',
    icon: Car,
    basePrice: 8,
    pricePerKm: 3.5,
    capacity: 4,
    luggage: 2,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop',
    features: [
      'Véhicule 100% électrique',
      'Conduite autonome niveau 2',
      'Écran tactile 15 pouces',
      'Chauffeur professionnel certifié',
      'Eau minérale offerte',
      'Chargeur smartphone USB-C'
    ],
    badge: 'ECO'
  },
  {
    id: 'berline',
    name: 'Tesla Model S',
    description: 'Luxe électrique, performances exceptionnelles',
    vehicleModel: 'Tesla Model S Long Range',
    icon: Sparkles,
    basePrice: 12,
    pricePerKm: 5,
    capacity: 4,
    luggage: 3,
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop',
    features: [
      'Tesla Model S haut de gamme',
      'Accélération 0-100 km/h en 3.2s',
      'Sièges en cuir premium chauffants',
      'Système audio 22 haut-parleurs',
      'Boissons premium offertes',
      'Chargeurs sans fil',
      'Wi-Fi Starlink haut débit'
    ],
    popular: true,
    badge: 'PREMIUM'
  },
  {
    id: 'van',
    name: 'Tesla Model X',
    description: 'SUV électrique 7 places avec portes Falcon Wing',
    vehicleModel: 'Tesla Model X Long Range',
    icon: Users,
    basePrice: 18,
    pricePerKm: 7,
    capacity: 7,
    luggage: 6,
    image: 'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=800&auto=format&fit=crop',
    features: [
      'Tesla Model X avec portes papillon',
      'Espace XXL pour 7 passagers',
      'Mode bioweapon defense (filtration air)',
      'Parfait pour familles et groupes',
      'Coffre avant et arrière généreux',
      'Boissons et snacks premium',
      'Système audio immersif'
    ],
    badge: 'FAMILLE'
  }
];

// Trajets populaires prédéfinis
export const POPULAR_ROUTES = [
  {
    id: 'vevey-montreux',
    from: 'Vevey',
    to: 'Montreux',
    distance: 7,
    duration: '12 min',
    image: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&auto=format&fit=crop',
    description: 'Riviera vaudoise'
  },
  {
    id: 'vevey-lausanne',
    from: 'Vevey',
    to: 'Lausanne',
    distance: 25,
    duration: '25 min',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400&auto=format&fit=crop',
    description: 'Centre-ville'
  },
  {
    id: 'vevey-geneve-airport',
    from: 'Vevey',
    to: 'Aéroport Genève',
    distance: 95,
    duration: '1h 10min',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&auto=format&fit=crop',
    description: 'Transfert aéroport'
  },
  {
    id: 'vevey-zurich-airport',
    from: 'Vevey',
    to: 'Aéroport Zurich',
    distance: 220,
    duration: '2h 30min',
    image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&auto=format&fit=crop',
    description: 'Transfert longue distance'
  },
  {
    id: 'custom',
    from: '',
    to: '',
    distance: 0,
    duration: '',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&auto=format&fit=crop',
    description: 'Trajet personnalisé'
  }
];

// Suggestions de villes pour autocomplete
export const CITY_SUGGESTIONS = [
  { name: 'Vevey', region: 'Vaud', distance: 0 },
  { name: 'Montreux', region: 'Vaud', distance: 7 },
  { name: 'La Tour-de-Peilz', region: 'Vaud', distance: 2 },
  { name: 'Clarens', region: 'Vaud', distance: 5 },
  { name: 'Villeneuve', region: 'Vaud', distance: 12 },
  { name: 'Lausanne', region: 'Vaud', distance: 25 },
  { name: 'Genève', region: 'Genève', distance: 90 },
  { name: 'Aéroport Genève (GVA)', region: 'Genève', distance: 95 },
  { name: 'Sion', region: 'Valais', distance: 60 },
  { name: 'Zurich', region: 'Zurich', distance: 210 },
  { name: 'Aéroport Zurich (ZRH)', region: 'Zurich', distance: 220 },
  { name: 'Berne', region: 'Berne', distance: 110 },
  { name: 'Fribourg', region: 'Fribourg', distance: 80 },
  { name: 'Interlaken', region: 'Berne', distance: 95 }
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
    description: 'Sur demande préalable',
    amount: 5,
    currency: 'CHF',
    type: 'fixed'
  },
  meetAndGreet: {
    label: 'Accueil personnalisé',
    description: 'Pancarte avec nom',
    amount: 15,
    currency: 'CHF',
    type: 'fixed'
  }
};

// Fonctions utilitaires
export const calculatePrice = (distance, vehicleType, options = {}) => {
  const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);
  if (!vehicle) return null;

  let total = vehicle.basePrice + (distance * vehicle.pricePerKm);

  // Ajouter les frais additionnels
  if (options.nightTime) total += ADDITIONAL_FEES.nightSurcharge.amount;
  if (options.airport) total += ADDITIONAL_FEES.airportPickup.amount;
  if (options.waitingTime) total += ADDITIONAL_FEES.waitingTime.amount * options.waitingTime;
  if (options.childSeat) total += ADDITIONAL_FEES.childSeat.amount;
  if (options.meetAndGreet) total += ADDITIONAL_FEES.meetAndGreet.amount;

  return {
    basePrice: vehicle.basePrice,
    distancePrice: distance * vehicle.pricePerKm,
    additionalFees: total - vehicle.basePrice - (distance * vehicle.pricePerKm),
    total: Math.round(total),
    currency: 'CHF',
    distance: distance,
    vehicle: vehicle.name
  };
};

export const estimateDistance = (from, to) => {
  const normalizedFrom = from.toLowerCase();
  const normalizedTo = to.toLowerCase();

  // Chercher dans les villes suggérées
  const toCity = CITY_SUGGESTIONS.find(city =>
    normalizedTo.includes(city.name.toLowerCase())
  );

  if (toCity) {
    return toCity.distance;
  }

  // Distance par défaut
  return 15;
};

export const getAllPricesForRoute = (distance) => {
  const prices = {};
  VEHICLE_TYPES.forEach(vehicle => {
    const priceData = calculatePrice(distance, vehicle.id);
    if (priceData) {
      prices[vehicle.id] = priceData.total;
    }
  });
  return prices;
};
