import { randomUUID } from "crypto";

const reservations = [];

export function createReservation({
  customer,
  pickup,
  dropoff,
  pickupTime,
  vehicleType,
  distanceKm,
  priceQuote
}) {
  const reservation = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    customer,
    pickup,
    dropoff,
    pickupTime,
    vehicleType,
    distanceKm,
    priceQuote
  };

  reservations.unshift(reservation);
  return reservation;
}

export function listReservations() {
  return reservations;
}
