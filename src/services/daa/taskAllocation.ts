// DAA Multi-Drone Task Allocation Engine
// Implements:
// 1. Greedy Task Allocation: O(M log M + M * N)
// 2. Optimal Hungarian Algorithm (Kuhn-Munkres): O(K^3)
// Provides side-by-side benchmarking and pedagogical optimality gap analysis.

import type { Drone, Incident, Coordinates } from '../../types';
import { calculateHaversineDistanceKm } from '../geographicService';

export interface AllocationAssignment {
  droneId: string;
  droneCallsign: string;
  incidentId: string;
  incidentSummary: string;
  distanceKm: number;
  individualCost: number;
}

export interface UnassignedEntity {
  id: string;
  type: 'DRONE' | 'INCIDENT';
  reason: string;
}

export interface TaskAllocationResult {
  algorithm: 'GREEDY' | 'HUNGARIAN_OPTIMAL';
  assignments: AllocationAssignment[];
  unassigned: UnassignedEntity[];
  totalCost: number;
  totalDistanceKm: number;
  executionTimeMs: number;
  costMatrix: number[][];
  matrixDroneLabels: string[];
  matrixIncidentLabels: string[];
}

export interface AllocationBenchmarkComparison {
  greedy: TaskAllocationResult;
  hungarian: TaskAllocationResult;
  costDifference: number;
  distanceDifferenceKm: number;
  optimalityGapPercent: number;
  hungarianIsBetter: boolean;
  explanation: string;
}

/**
 * Calculates a multi-criteria cost between a drone and an incident.
 * Lower cost represents a more suitable pairing.
 *
 * Cost components:
 * - Geodesic flight distance (km)
 * - Drone battery deficit (prefer high battery)
 * - Incident priority bonus (reduces cost for urgent incidents to prioritize them)
 */
export const calculateAssignmentCost = (
  drone: Drone,
  incident: Incident,
  targetCoords: Coordinates
): { cost: number; distanceKm: number } => {
  const distanceKm = calculateHaversineDistanceKm(drone.baseCoordinates, targetCoords);

  // Approximate battery consumption (~0.8% per 5km = 0.16% / km round-trip)
  const roundTripKm = distanceKm * 2;
  const estimatedBatteryRequired = (roundTripKm * 0.16) + 15; // 15% safety margin

  // Infeasible assignment penalty if battery is insufficient
  if (drone.batteryPercentage < estimatedBatteryRequired) {
    return { cost: 9999 + distanceKm, distanceKm };
  }

  // Weightings for multi-criteria optimization
  const wDist = 1.0;
  const wBattery = 0.4;
  const wUrgency = 0.8;

  const batteryDeficit = 100 - drone.batteryPercentage;
  const urgencyWeight = incident.priorityScore || incident.riskScore || 50;

  // Offset cost to ensure strictly positive values for Hungarian matrix
  const rawCost = (wDist * distanceKm) + (wBattery * batteryDeficit) - (wUrgency * urgencyWeight * 0.5) + 100;
  const normalizedCost = Number(Math.max(1, rawCost).toFixed(2));

  return { cost: normalizedCost, distanceKm };
};

/**
 * Algorithm 1: Greedy Task Allocation
 * 
 * Strategy:
 * 1. Sort incidents by priority (descending).
 * 2. For each incident, greedily select the available drone with minimum cost.
 * 3. Mark the drone as assigned to prevent duplicate dispatch.
 * 
 * Complexity:
 * - Sorting incidents: O(M log M)
 * - Matching: O(M * N)
 * - Total Time: O(M log M + M * N)
 * - Space: O(M + N)
 */
export const runGreedyTaskAllocation = (
  drones: Drone[],
  incidents: Incident[],
  villageCoordsMap: Record<string, Coordinates>
): TaskAllocationResult => {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const availableDrones = drones.filter((d) => d.status === 'AVAILABLE' && d.batteryPercentage >= 25);
  const unassignedIncidents = incidents.filter((i) => i.status !== 'RESOLVED' && !i.assignedMissionId);

  // Sort incidents by priority descending
  const sortedIncidents = [...unassignedIncidents].sort(
    (a, b) => (b.priorityScore || b.riskScore) - (a.priorityScore || a.riskScore)
  );

  const usedDroneIds = new Set<string>();
  const assignments: AllocationAssignment[] = [];
  const unassigned: UnassignedEntity[] = [];

  let totalCost = 0;
  let totalDistanceKm = 0;

  // Build cost matrix for display/benchmarking
  const costMatrix: number[][] = [];
  const matrixDroneLabels: string[] = availableDrones.map((d) => d.callsign);
  const matrixIncidentLabels: string[] = sortedIncidents.map((i) => i.id);

  for (let i = 0; i < availableDrones.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < sortedIncidents.length; j++) {
      const drone = availableDrones[i];
      const incident = sortedIncidents[j];
      const coords = villageCoordsMap[incident.villageId] || drone.baseCoordinates;
      const { cost } = calculateAssignmentCost(drone, incident, coords);
      row.push(cost);
    }
    costMatrix.push(row);
  }

  // Greedy selection
  for (const incident of sortedIncidents) {
    const coords = villageCoordsMap[incident.villageId] || { lat: 26.195, lng: 85.914 };
    let bestDrone: Drone | null = null;
    let bestCost = Infinity;
    let bestDist = 0;

    for (const drone of availableDrones) {
      if (usedDroneIds.has(drone.id)) continue;

      const { cost, distanceKm } = calculateAssignmentCost(drone, incident, coords);
      if (cost < bestCost) {
        bestCost = cost;
        bestDrone = drone;
        bestDist = distanceKm;
      }
    }

    if (bestDrone && bestCost < 9000) {
      usedDroneIds.add(bestDrone.id);
      assignments.push({
        droneId: bestDrone.id,
        droneCallsign: bestDrone.callsign,
        incidentId: incident.id,
        incidentSummary: `${incident.id} (${incident.villageName} - ${incident.severity})`,
        distanceKm: bestDist,
        individualCost: bestCost,
      });
      totalCost += bestCost;
      totalDistanceKm += bestDist;
    } else {
      unassigned.push({
        id: incident.id,
        type: 'INCIDENT',
        reason: bestDrone ? 'Insufficient drone battery for flight range' : 'No available UAV left in fleet',
      });
    }
  }

  // Record idle drones
  availableDrones.forEach((d) => {
    if (!usedDroneIds.has(d.id)) {
      unassigned.push({
        id: d.id,
        type: 'DRONE',
        reason: 'Fleet reserve / surplus drone',
      });
    }
  });

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    algorithm: 'GREEDY',
    assignments,
    unassigned,
    totalCost: Number(totalCost.toFixed(2)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    executionTimeMs: Number((t1 - t0).toFixed(3)),
    costMatrix,
    matrixDroneLabels,
    matrixIncidentLabels,
  };
};

/**
 * Algorithm 2: Hungarian Algorithm (Kuhn-Munkres)
 * 
 * Globally optimal combinatorial solver for the Bipartite Matching assignment problem.
 * Finds the bijection between drones and incidents that minimizes the sum of total assignment costs.
 * 
 * Complexity:
 * - Padding to square K x K: O(K^2)
 * - Matrix reduction and augmenting path alternating tree search: O(K^3)
 * - Space: O(K^2)
 */
export const runHungarianTaskAllocation = (
  drones: Drone[],
  incidents: Incident[],
  villageCoordsMap: Record<string, Coordinates>
): TaskAllocationResult => {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const availableDrones = drones.filter((d) => d.status === 'AVAILABLE' && d.batteryPercentage >= 25);
  const unassignedIncidents = incidents.filter((i) => i.status !== 'RESOLVED' && !i.assignedMissionId);

  const numDrones = availableDrones.length;
  const numIncidents = unassignedIncidents.length;

  if (numDrones === 0 || numIncidents === 0) {
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      algorithm: 'HUNGARIAN_OPTIMAL',
      assignments: [],
      unassigned: [
        ...availableDrones.map((d) => ({ id: d.id, type: 'DRONE' as const, reason: 'No active incidents' })),
        ...unassignedIncidents.map((i) => ({ id: i.id, type: 'INCIDENT' as const, reason: 'No available drones' })),
      ],
      totalCost: 0,
      totalDistanceKm: 0,
      executionTimeMs: Number((t1 - t0).toFixed(3)),
      costMatrix: [],
      matrixDroneLabels: [],
      matrixIncidentLabels: [],
    };
  }

  // Cost matrix construction
  const originalCostMatrix: number[][] = [];
  const distanceMatrix: number[][] = [];

  for (let i = 0; i < numDrones; i++) {
    originalCostMatrix[i] = [];
    distanceMatrix[i] = [];
    for (let j = 0; j < numIncidents; j++) {
      const drone = availableDrones[i];
      const incident = unassignedIncidents[j];
      const coords = villageCoordsMap[incident.villageId] || drone.baseCoordinates;
      const { cost, distanceKm } = calculateAssignmentCost(drone, incident, coords);
      originalCostMatrix[i][j] = cost;
      distanceMatrix[i][j] = distanceKm;
    }
  }

  // Pad to square K x K matrix for Kuhn-Munkres
  const K = Math.max(numDrones, numIncidents);
  const BIG_VAL = 10000;
  const cost: number[][] = Array.from({ length: K }, (_, r) =>
    Array.from({ length: K }, (_, c) => {
      if (r < numDrones && c < numIncidents) {
        return originalCostMatrix[r][c];
      }
      return BIG_VAL; // Dummy pad
    })
  );

  // Hungarian algorithm implementation (Jonker-Volgenant / augmenting path style O(K^3))
  const u = new Array(K + 1).fill(0);
  const v = new Array(K + 1).fill(0);
  const p = new Array(K + 1).fill(0);
  const way = new Array(K + 1).fill(0);

  for (let i = 1; i <= K; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(K + 1).fill(Infinity);
    const used = new Array(K + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= K; j++) {
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= K; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  // Extract optimal matchings
  // p[j] contains the row (drone) assigned to column j (incident) (1-indexed)
  const assignments: AllocationAssignment[] = [];
  const assignedDrones = new Set<string>();
  const assignedIncidents = new Set<string>();

  let totalCost = 0;
  let totalDistanceKm = 0;

  for (let j = 1; j <= K; j++) {
    const droneIndex = p[j] - 1;
    const incidentIndex = j - 1;

    if (droneIndex < numDrones && incidentIndex < numIncidents) {
      const drone = availableDrones[droneIndex];
      const incident = unassignedIncidents[incidentIndex];
      const assignmentCost = originalCostMatrix[droneIndex][incidentIndex];
      const distKm = distanceMatrix[droneIndex][incidentIndex];

      if (assignmentCost < 9000) {
        assignments.push({
          droneId: drone.id,
          droneCallsign: drone.callsign,
          incidentId: incident.id,
          incidentSummary: `${incident.id} (${incident.villageName} - ${incident.severity})`,
          distanceKm: distKm,
          individualCost: assignmentCost,
        });
        assignedDrones.add(drone.id);
        assignedIncidents.add(incident.id);
        totalCost += assignmentCost;
        totalDistanceKm += distKm;
      }
    }
  }

  // Identify unassigned drones or incidents
  const unassigned: UnassignedEntity[] = [];
  availableDrones.forEach((d) => {
    if (!assignedDrones.has(d.id)) {
      unassigned.push({ id: d.id, type: 'DRONE', reason: 'Fleet surplus' });
    }
  });

  unassignedIncidents.forEach((i) => {
    if (!assignedIncidents.has(i.id)) {
      unassigned.push({ id: i.id, type: 'INCIDENT', reason: 'No available drone pairing' });
    }
  });

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    algorithm: 'HUNGARIAN_OPTIMAL',
    assignments,
    unassigned,
    totalCost: Number(totalCost.toFixed(2)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    executionTimeMs: Number((t1 - t0).toFixed(3)),
    costMatrix: originalCostMatrix,
    matrixDroneLabels: availableDrones.map((d) => d.callsign),
    matrixIncidentLabels: unassignedIncidents.map((i) => i.id),
  };
};

/**
 * Runs a side-by-side benchmark comparing Greedy vs Hungarian Task Allocation.
 */
export const compareTaskAllocationAlgorithms = (
  drones: Drone[],
  incidents: Incident[],
  villageCoordsMap: Record<string, Coordinates>
): AllocationBenchmarkComparison => {
  const greedy = runGreedyTaskAllocation(drones, incidents, villageCoordsMap);
  const hungarian = runHungarianTaskAllocation(drones, incidents, villageCoordsMap);

  const costDifference = Number((greedy.totalCost - hungarian.totalCost).toFixed(2));
  const distanceDifferenceKm = Number((greedy.totalDistanceKm - hungarian.totalDistanceKm).toFixed(2));
  const optimalityGapPercent = greedy.totalCost > 0
    ? Number(((costDifference / greedy.totalCost) * 100).toFixed(1))
    : 0;

  const hungarianIsBetter = costDifference > 0.05;

  const explanation = hungarianIsBetter
    ? `The Hungarian algorithm achieved a ${optimalityGapPercent}% lower overall operational cost than Greedy allocation. Greedy made locally optimal choices that starved subsequent incidents, forcing distant or battery-compromised pairings. Hungarian examined the full bipartite cost matrix to optimize globally.`
    : `Both algorithms yielded comparable costs in this configuration. When fleet density matches incident spread uniformly, Greedy heuristics often closely track the optimal Hungarian solution with O(M log M) runtime overhead.`;

  return {
    greedy,
    hungarian,
    costDifference,
    distanceDifferenceKm,
    optimalityGapPercent,
    hungarianIsBetter,
    explanation,
  };
};
