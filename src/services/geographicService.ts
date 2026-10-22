import type { Coordinates } from '../types';

/**
 * Calculates Great-Circle distance in Kilometers between two coordinates using the Haversine formula.
 */
export const calculateHaversineDistanceKm = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
};

/**
 * Generates an array of interpolated waypoints between two coordinates for flight simulation.
 */
export const generateFlightWaypoints = (
  start: Coordinates,
  destination: Coordinates,
  steps: number = 20
): Coordinates[] => {
  const waypoints: Coordinates[] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    waypoints.push({
      lat: Number((start.lat + (destination.lat - start.lat) * fraction).toFixed(6)),
      lng: Number((start.lng + (destination.lng - start.lng) * fraction).toFixed(6)),
    });
  }
  return waypoints;
};

/**
 * Calculates Estimated Time of Arrival (ETA) in minutes at a given drone speed (km/h).
 */
export const calculateFlightEtaMinutes = (distanceKm: number, speedKmh: number = 65): number => {
  if (speedKmh <= 0) return 0;
  const hours = distanceKm / speedKmh;
  return Number((hours * 60).toFixed(1));
};
