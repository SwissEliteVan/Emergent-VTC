import axios from 'axios';

// API Base URL - adjust for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Admin password from environment or default
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'romuo_admin_2024';

// =============================================================================
// PUBLIC API CALLS
// =============================================================================

export const vehicleApi = {
  getAll: () => api.get('/vehicles'),
  suggest: (numPassengers) => api.get(`/vehicles/suggest?num_passengers=${numPassengers}`),
};

export const zoneApi = {
  getAll: () => api.get('/zones'),
};

export const rideApi = {
  calculate: (data) => api.post('/rides/calculate', data),
  create: (data) => api.post('/rides', data),
  createGuest: (data) => api.post('/rides/guest', data),
  getById: (rideId) => api.get(`/rides/${rideId}`),
  getUserHistory: () => api.get('/rides/user/history'),
  cancel: (rideId) => api.post(`/rides/${rideId}/cancel`),
  getInvoice: (rideId) => api.get(`/rides/${rideId}/invoice`, { responseType: 'blob' }),
  track: (rideId) => api.get(`/rides/${rideId}/track`),
};

// =============================================================================
// ADMIN API CALLS
// =============================================================================

export const adminApi = {
  // Stats
  getStats: () => api.get(`/admin/stats?admin_password=${ADMIN_PASSWORD}`),

  // Dispatch
  getDispatchData: () => api.get(`/admin/dispatch?admin_password=${ADMIN_PASSWORD}`),

  // Rides
  getAllRides: (params = {}) => {
    const queryParams = new URLSearchParams({ admin_password: ADMIN_PASSWORD, ...params });
    return api.get(`/admin/rides?${queryParams}`);
  },
  getPendingRides: () => api.get(`/admin/rides/pending?admin_password=${ADMIN_PASSWORD}`),
  getCalendarRides: (start, end) =>
    api.get(`/admin/rides/calendar?admin_password=${ADMIN_PASSWORD}&start=${start}&end=${end}`),
  assignDriver: (rideId, driverId) =>
    api.post(`/admin/rides/${rideId}/assign?admin_password=${ADMIN_PASSWORD}&driver_id=${driverId}`),

  // Drivers CRUD
  getDrivers: () => api.get(`/admin/drivers?admin_password=${ADMIN_PASSWORD}`),
  createDriver: (data) => api.post(`/admin/drivers?admin_password=${ADMIN_PASSWORD}`, data),
  updateDriver: (driverId, data) =>
    api.put(`/admin/drivers/${driverId}?admin_password=${ADMIN_PASSWORD}`, data),
  deleteDriver: (driverId) =>
    api.delete(`/admin/drivers/${driverId}?admin_password=${ADMIN_PASSWORD}`),
  updateDriverStatus: (driverId, status) =>
    api.post(`/admin/drivers/${driverId}/status?admin_password=${ADMIN_PASSWORD}&status=${status}`),

  // Vehicles CRUD
  getVehicles: () => api.get(`/admin/vehicles?admin_password=${ADMIN_PASSWORD}`),
  createVehicle: (data) => api.post(`/admin/vehicles?admin_password=${ADMIN_PASSWORD}`, data),
  updateVehicle: (vehicleId, data) =>
    api.put(`/admin/vehicles/${vehicleId}?admin_password=${ADMIN_PASSWORD}`, data),
  deleteVehicle: (vehicleId) =>
    api.delete(`/admin/vehicles/${vehicleId}?admin_password=${ADMIN_PASSWORD}`),

  // Users
  getUsers: () => api.get(`/admin/users?admin_password=${ADMIN_PASSWORD}`),

  // Zones
  createZone: (data) => api.post(`/zones?admin_password=${ADMIN_PASSWORD}`, data),
  updateZone: (zoneId, data) =>
    api.put(`/zones/${zoneId}?admin_password=${ADMIN_PASSWORD}`, data),
  deleteZone: (zoneId) =>
    api.delete(`/zones/${zoneId}?admin_password=${ADMIN_PASSWORD}`),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return '-- CHF';
  return `${Math.round(amount)} CHF`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDistance = (km) => {
  if (!km) return '--';
  return `${km.toFixed(1)} km`;
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    assigned: 'Assigné',
    driver_en_route: 'En route',
    arrived: 'Arrivé',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    assigned: 'navy',
    driver_en_route: 'navy',
    arrived: 'gold',
    in_progress: 'navy',
    completed: 'success',
    cancelled: 'danger',
  };
  return colors[status] || 'gray';
};

export const getDriverStatusLabel = (status) => {
  const labels = {
    available: 'Disponible',
    busy: 'En course',
    offline: 'Hors ligne',
  };
  return labels[status] || status;
};

export const getVehicleCategory = (category) => {
  const labels = {
    eco: 'Eco',
    berline: 'Berline Luxe',
    van: 'Van Premium',
    bus: 'Bus',
  };
  return labels[category] || category;
};

export default api;
