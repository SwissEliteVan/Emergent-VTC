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

export function getReservationById(id) {
  return reservations.find((reservation) => reservation.id === id);
}

export function confirmReservation(id) {
  const reservation = getReservationById(id);

  if (!reservation) {
    return null;
  }

  reservation.status = "confirmed";
  reservation.confirmedAt = new Date().toISOString();
  return reservation;
}

export function listReservations() {
  return reservations;
}
