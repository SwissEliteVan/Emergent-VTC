import { create } from 'zustand';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface Vehicle {
  id: string;
  name: string;
  description: string;
  base_fare: number;
  rate_per_km: number;
  capacity: number;
  icon: string;
}

interface RideState {
  pickup: Location | null;
  destination: Location | null;
  selectedVehicle: Vehicle | null;
  distanceKm: number;
  price: number;
  setPickup: (location: Location) => void;
  setDestination: (location: Location) => void;
  setSelectedVehicle: (vehicle: Vehicle) => void;
  setDistanceKm: (distance: number) => void;
  setPrice: (price: number) => void;
  resetRide: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  pickup: null,
  destination: null,
  selectedVehicle: null,
  distanceKm: 0,
  price: 0,
  setPickup: (location) => set({ pickup: location }),
  setDestination: (location) => set({ destination: location }),
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  setDistanceKm: (distance) => set({ distanceKm: distance }),
  setPrice: (price) => set({ price: price }),
  resetRide: () => set({
    pickup: null,
    destination: null,
    selectedVehicle: null,
    distanceKm: 0,
    price: 0
  })
}));