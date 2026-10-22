import { describe, it, expect } from 'vitest';
import { 
  calculateHaversineDistanceKm, 
  generateFlightWaypoints, 
  calculateFlightEtaMinutes 
} from '../geographicService';
import { INITIAL_VILLAGES, DRONE_BASE_COORDINATES } from '../../constants/initialState';

describe('Geographic Service & Haversine Distance Calculations', () => {
  it('calculates realistic distances from Regional Drone Base to North Bihar villages', () => {
    const villageA = INITIAL_VILLAGES['VILLAGE-A'].coordinates; // Darbhanga sector
    const villageB = INITIAL_VILLAGES['VILLAGE-B'].coordinates; // Sitamarhi sector
    const villageC = INITIAL_VILLAGES['VILLAGE-C'].coordinates; // Madhubani sector

    const distA = calculateHaversineDistanceKm(DRONE_BASE_COORDINATES, villageA);
    const distB = calculateHaversineDistanceKm(DRONE_BASE_COORDINATES, villageB);
    const distC = calculateHaversineDistanceKm(DRONE_BASE_COORDINATES, villageC);

    // Darbhanga base to local Darbhanga village should be very close (~4-10 km)
    expect(distA).toBeGreaterThan(2);
    expect(distA).toBeLessThan(15);

    // Base to Sitamarhi is roughly 50-70 km
    expect(distB).toBeGreaterThan(30);
    expect(distB).toBeLessThan(80);

    // Base to Madhubani is roughly 20-40 km
    expect(distC).toBeGreaterThan(15);
    expect(distC).toBeLessThan(50);
  });

  it('generates smooth sequential waypoints along the flight corridor', () => {
    const start = DRONE_BASE_COORDINATES;
    const dest = INITIAL_VILLAGES['VILLAGE-B'].coordinates;
    const waypoints = generateFlightWaypoints(start, dest, 10);

    expect(waypoints.length).toBe(11);
    expect(waypoints[0].lat).toBeCloseTo(start.lat, 4);
    expect(waypoints[0].lng).toBeCloseTo(start.lng, 4);
    expect(waypoints[10].lat).toBeCloseTo(dest.lat, 4);
    expect(waypoints[10].lng).toBeCloseTo(dest.lng, 4);
  });

  it('calculates plausible flight ETAs based on drone cruising speed', () => {
    const distanceKm = 65; // ~65 km to Sitamarhi
    const eta = calculateFlightEtaMinutes(distanceKm, 65); // 65 km/h
    expect(eta).toBe(60); // 60 minutes
  });
});
