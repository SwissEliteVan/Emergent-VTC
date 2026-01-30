import { Car, Users, Bus } from 'lucide-react';

// ==========================================================
// ROMUO.CH - Vehicle Types & Pricing
// Swiss VTC Service - All prices in CHF
// ==========================================================

export const VEHICLE_TYPES = [
  {
    id: 'eco',
    name: 'Eco',
    model: 'Toyota Prius',
    description: 'Economique et ecologique',
    icon: Car,
    basePrice: 6.00,
    pricePerKm: 2.50,
    capacity: 4,
    luggage: 2,
    waitTime: '3-5 min',
    priceRange: { min: 25, max: 30 },
    features: [
      'Vehicule hybride',
      'Climatisation',
      '4 places',
    ],
  },
  {
    id: 'berline',
    name: 'Berline',
    model: 'Mercedes Classe E',
    description: 'Confort et elegance',
    icon: Car,
    basePrice: 10.00,
    pricePerKm: 3.50,
    capacity: 4,
    luggage: 3,
    waitTime: '4-6 min',
    priceRange: { min: 45, max: 50 },
    features: [
      'Berline premium',
      'Sieges cuir',
      'WiFi gratuit',
    ],
    popular: true,
  },
  {
    id: 'van',
    name: 'Van',
    model: 'Mercedes V-Class',
    description: 'Espace pour groupes et familles',
    icon: Users,
    basePrice: 15.00,
    pricePerKm: 4.50,
    capacity: 7,
    luggage: 6,
    waitTime: '5-8 min',
    priceRange: { min: 65, max: 80 },
    features: [
      'Van luxe 7 places',
      'Grand coffre',
      'Confort premium',
    ],
  },
  {
    id: 'bus',
    name: 'Bus',
    model: 'Mercedes Sprinter',
    description: 'Transport de groupe jusqu\'a 20 personnes',
    icon: Bus,
    basePrice: 25.00,
    pricePerKm: 6.00,
    capacity: 20,
    luggage: 20,
    waitTime: '10-15 min',
    priceRange: { min: 95, max: 120 },
    features: [
      'Minibus 20 places',
      'Ideal evenements',
      'Climatisation zone',
    ],
  },
];

// ==========================================================
// PRICE CALCULATION
// ==========================================================

/**
 * Calculate price for a given distance and vehicle type
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} vehicleId - Vehicle type ID
 * @returns {number} - Estimated price in CHF
 */
export const calculatePrice = (distanceKm, vehicleId) => {
  const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleId);
  if (!vehicle || !distanceKm) return null;

  const total = vehicle.basePrice + (distanceKm * vehicle.pricePerKm);
  return Math.round(total);
};

/**
 * Calculate all vehicle prices for a given distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} - Object with vehicle IDs as keys and prices as values
 */
export const calculateAllPrices = (distanceKm) => {
  if (!distanceKm) return {};

  const prices = {};
  VEHICLE_TYPES.forEach(vehicle => {
    prices[vehicle.id] = calculatePrice(distanceKm, vehicle.id);
  });
  return prices;
};

/**
 * Format price in CHF
 * @param {number} amount - Amount in CHF
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return '--';
  return `${Math.round(amount)} CHF`;
};

/**
 * Get vehicle by ID
 * @param {string} vehicleId - Vehicle type ID
 * @returns {Object|null} - Vehicle object or null
 */
export const getVehicleById = (vehicleId) => {
  return VEHICLE_TYPES.find(v => v.id === vehicleId) || null;
};

// ==========================================================
// SWISS CITIES - For autocomplete suggestions (Pickup only)
// ==========================================================

export const SWISS_CITIES = [
  { name: 'Geneve', canton: 'GE', lat: 46.2044, lon: 6.1432 },
  { name: 'Lausanne', canton: 'VD', lat: 46.5197, lon: 6.6323 },
  { name: 'Montreux', canton: 'VD', lat: 46.4312, lon: 6.9107 },
  { name: 'Vevey', canton: 'VD', lat: 46.4628, lon: 6.8418 },
  { name: 'Nyon', canton: 'VD', lat: 46.3833, lon: 6.2398 },
  { name: 'Morges', canton: 'VD', lat: 46.5117, lon: 6.4992 },
  { name: 'Yverdon-les-Bains', canton: 'VD', lat: 46.7785, lon: 6.6410 },
  { name: 'Sion', canton: 'VS', lat: 46.2333, lon: 7.3667 },
  { name: 'Martigny', canton: 'VS', lat: 46.1028, lon: 7.0736 },
  { name: 'Sierre', canton: 'VS', lat: 46.2919, lon: 7.5353 },
  { name: 'Monthey', canton: 'VS', lat: 46.2544, lon: 6.9544 },
  { name: 'Fribourg', canton: 'FR', lat: 46.8065, lon: 7.1620 },
  { name: 'Neuchatel', canton: 'NE', lat: 46.9900, lon: 6.9293 },
  { name: 'Bern', canton: 'BE', lat: 46.9480, lon: 7.4474 },
  { name: 'Zurich', canton: 'ZH', lat: 47.3769, lon: 8.5417 },
  { name: 'Basel', canton: 'BS', lat: 47.5596, lon: 7.5886 },
];

// ==========================================================
// DRIVER DATA (Mock)
// ==========================================================

export const MOCK_DRIVER = {
  name: 'Marc Dubois',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  rating: 4.9,
  trips: 1247,
  vehicle: {
    brand: 'Mercedes',
    model: 'Classe E',
    color: 'Noir',
    plate: 'VD 123 456',
  },
};
