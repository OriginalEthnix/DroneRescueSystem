import type { 
  Drone, 
  DroneMission, 
  DroneStatus, 
  VerificationOutcome, 
  DroneMissionReport, 
  Coordinates, 
  EventLogEntry, 
  Incident 
} from '../types';
import { generateFlightWaypoints } from './geographicService';
import { calculateAStarFlightRoute, DEFAULT_HAZARD_OBSTACLES } from './daa/pathfinding';

let missionCounter = 1;

/**
 * Interpolates an arbitrary waypoint sequence into a target number of smooth flight waypoints.
 */
export const interpolateTrajectory = (coords: Coordinates[], steps: number = 20): Coordinates[] => {
  if (coords.length < 2) return coords;
  let totalDist = 0;
  const segmentDists: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const d = Math.hypot(coords[i + 1].lat - coords[i].lat, coords[i + 1].lng - coords[i].lng);
    segmentDists.push(d);
    totalDist += d;
  }
  if (totalDist === 0) return generateFlightWaypoints(coords[0], coords[coords.length - 1], steps);

  const waypoints: Coordinates[] = [{ ...coords[0] }];
  const stepDist = totalDist / steps;

  for (let s = 1; s < steps; s++) {
    const targetD = s * stepDist;
    let accumulated = 0;
    for (let i = 0; i < segmentDists.length; i++) {
      if (accumulated + segmentDists[i] >= targetD || i === segmentDists.length - 1) {
        const segFrac = segmentDists[i] === 0 ? 0 : (targetD - accumulated) / segmentDists[i];
        waypoints.push({
          lat: Number((coords[i].lat + (coords[i + 1].lat - coords[i].lat) * segFrac).toFixed(6)),
          lng: Number((coords[i].lng + (coords[i + 1].lng - coords[i].lng) * segFrac).toFixed(6)),
        });
        break;
      }
      accumulated += segmentDists[i];
    }
  }
  waypoints.push({ ...coords[coords.length - 1] });
  return waypoints;
};

/**
 * 11-Stage Mission Lifecycle Transitions (Master Prompt Section 8):
 * 1. AVAILABLE
 * 2. MISSION_ASSIGNED
 * 3. PRE_FLIGHT_CHECK
 * 4. TAKEOFF
 * 5. EN_ROUTE
 * 6. APPROACHING_TARGET
 * 7. ARRIVED
 * 8. AERIAL_VERIFICATION
 * 9. MISSION_COMPLETE
 * 10. RETURNING_TO_BASE
 * 11. AVAILABLE
 */
export const NEXT_MISSION_STATUS_MAP: Record<DroneStatus, DroneStatus> = {
  AVAILABLE: 'MISSION_ASSIGNED',
  MISSION_ASSIGNED: 'PRE_FLIGHT_CHECK',
  PRE_FLIGHT_CHECK: 'TAKEOFF',
  TAKEOFF: 'EN_ROUTE',
  EN_ROUTE: 'APPROACHING_TARGET',
  APPROACHING_TARGET: 'ARRIVED',
  ARRIVED: 'AERIAL_VERIFICATION',
  AERIAL_VERIFICATION: 'MISSION_COMPLETE',
  MISSION_COMPLETE: 'RETURNING_TO_BASE',
  RETURNING_TO_BASE: 'AVAILABLE',
};

/**
 * Select the optimal drone from the fleet based on battery, distance, and mission priority.
 */
export const selectBestAvailableDrone = (
  drones: Record<string, Drone>
): Drone | null => {
  const available = Object.values(drones).filter(
    (d) => d.status === 'AVAILABLE' && d.batteryPercentage >= 25 && !d.currentMissionId
  );

  if (available.length === 0) return null;

  // Prioritize highest battery level
  return available.sort((a, b) => b.batteryPercentage - a.batteryPercentage)[0];
};

/**
 * Creates a new drone mission upon confirmed operator dispatch.
 */
export const createDroneMission = (
  drone: Drone,
  incident: Incident,
  targetCoordinates: Coordinates,
  distanceTotalKm: number,
  timestamp: string = new Date().toISOString()
): DroneMission => {
  const missionId = `MSN-${new Date().getFullYear()}-${String(missionCounter++).padStart(3, '0')}`;
  
  // Calculate obstacle-avoiding trajectory using DAA A* Search Engine
  const astar = calculateAStarFlightRoute(drone.baseCoordinates, targetCoordinates, DEFAULT_HAZARD_OBSTACLES);
  const routeWaypoints = (astar.usedAStar && astar.waypoints.length >= 2)
    ? interpolateTrajectory(astar.waypoints, 20)
    : generateFlightWaypoints(drone.baseCoordinates, targetCoordinates, 20);

  return {
    id: missionId,
    droneId: drone.id,
    incidentId: incident.id,
    targetVillageId: incident.villageId,
    targetNodeId: incident.nodeId,
    targetCoordinates,
    routeCoordinates: routeWaypoints,
    status: 'MISSION_ASSIGNED',
    progressPercent: 0,
    startTime: timestamp,
    estimatedArrivalTime: new Date(Date.now() + (distanceTotalKm / drone.speedKmh) * 3600000).toISOString(),
    actualArrivalTime: null,
    completionTime: null,
    distanceTotalKm,
    distanceRemainingKm: distanceTotalKm,
    priority: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    verificationOutcome: null,
    operatorNotes: '',
    pathfindingDetails: {
      algorithm: astar.usedAStar ? 'A*' : 'Direct',
      expandedNodes: astar.result.expandedNodes,
      executionTimeMs: astar.result.executionTimeMs,
      cost: astar.result.cost,
      avoidedHazards: DEFAULT_HAZARD_OBSTACLES.map((h) => h.name),
    },
  };
};

/**
 * Generate a simulated aerial verification outcome.
 */
export const generateSimulatedVerificationOutcome = (
  incident: Incident
): VerificationOutcome => {
  if (incident.severity === 'CRITICAL' || incident.riskScore >= 75) {
    return 'HAZARD_CONFIRMED';
  } else if (incident.riskScore >= 45) {
    return 'FURTHER_INVESTIGATION_REQUIRED';
  } else {
    return 'HAZARD_NOT_CONFIRMED';
  }
};

/**
 * Advances a mission through its 11-stage state lifecycle.
 * Updates simulated drone position, distance remaining, and battery consumption.
 */
export const stepDroneMission = (
  mission: DroneMission,
  drone: Drone,
  timestamp: string = new Date().toISOString()
): { updatedMission: DroneMission; updatedDrone: Drone; newLog?: EventLogEntry } => {
  const currentStatus = mission.status;
  const nextStatus = NEXT_MISSION_STATUS_MAP[currentStatus] || 'AVAILABLE';

  let nextProgress = mission.progressPercent;
  let nextDistance = mission.distanceRemainingKm;
  let nextBattery = Math.max(5, drone.batteryPercentage - 1.2); // battery consumption per leg
  let nextCoords: Coordinates = drone.currentCoordinates;
  let actualArrival = mission.actualArrivalTime;
  let completionTime = mission.completionTime;
  let verificationOutcome = mission.verificationOutcome;
  let report = mission.report;
  let logEntry: EventLogEntry | undefined;

  const totalWaypoints = mission.routeCoordinates.length;

  switch (nextStatus) {
    case 'PRE_FLIGHT_CHECK':
      nextProgress = 5;
      logEntry = {
        id: `LOG-DRN-${Date.now()}`,
        timestamp,
        category: 'DRONE',
        severity: 'INFO',
        title: `${drone.id} Pre-Flight Check`,
        description: `${drone.callsign} running diagnostic checks and GPS calibration. Battery: ${nextBattery.toFixed(0)}%.`,
        droneId: drone.id,
      };
      break;

    case 'TAKEOFF':
      nextProgress = 10;
      logEntry = {
        id: `LOG-DRN-${Date.now()}`,
        timestamp,
        category: 'DRONE',
        severity: 'INFO',
        title: `${drone.id} Airborne`,
        description: `${drone.callsign} airborne from Darbhanga Hub ascending to cruising altitude (120m AGL).`,
        droneId: drone.id,
      };
      break;

    case 'EN_ROUTE': {
      nextProgress = 40;
      const midIndex = Math.floor(totalWaypoints / 2);
      nextCoords = mission.routeCoordinates[midIndex] || mission.targetCoordinates;
      nextDistance = Number((mission.distanceTotalKm * 0.5).toFixed(1));
      break;
    }

    case 'APPROACHING_TARGET': {
      nextProgress = 80;
      const nearIndex = Math.min(totalWaypoints - 2, Math.floor(totalWaypoints * 0.85));
      nextCoords = mission.routeCoordinates[nearIndex] || mission.targetCoordinates;
      nextDistance = Number((mission.distanceTotalKm * 0.15).toFixed(1));
      break;
    }

    case 'ARRIVED':
      nextProgress = 100;
      nextCoords = mission.targetCoordinates;
      nextDistance = 0;
      actualArrival = timestamp;
      logEntry = {
        id: `LOG-DRN-${Date.now()}`,
        timestamp,
        category: 'DRONE',
        severity: 'SUCCESS',
        title: `${drone.id} On-Station`,
        description: `${drone.callsign} arrived at ${mission.targetNodeId} in ${mission.targetVillageId}. Hovering for sensor telemetry cross-verification.`,
        droneId: drone.id,
      };
      break;

    case 'AERIAL_VERIFICATION':
      nextProgress = 100;
      verificationOutcome = 'HAZARD_CONFIRMED';
      logEntry = {
        id: `LOG-DRN-${Date.now()}`,
        timestamp,
        category: 'DRONE',
        severity: 'WARNING',
        title: `Aerial Reconnaissance Completed`,
        description: `Simulated optical/multispectral observation outcome: [${verificationOutcome}] at ${mission.targetNodeId}.`,
        droneId: drone.id,
      };
      break;

    case 'MISSION_COMPLETE': {
      nextProgress = 100;
      completionTime = timestamp;

      // Generate the complete mission report required by Section 12 & Session 5
      const durationMins = Math.max(1, Math.round((new Date(timestamp).getTime() - new Date(mission.startTime).getTime()) / 60000));
      const outcomeText = verificationOutcome || 'HAZARD_CONFIRMED';

      const finalReport: DroneMissionReport = {
        missionId: mission.id,
        incidentId: mission.incidentId,
        targetVillage: mission.targetVillageId,
        assignedDrone: `${drone.callsign} (${drone.id})`,
        dispatchTime: mission.startTime,
        simulatedArrivalTime: actualArrival || timestamp,
        verificationResult: outcomeText,
        missionDuration: `${durationMins} minutes`,
        finalStatus: 'MISSION_COMPLETE',
        operatorNotes: mission.operatorNotes || 'Simulated aerial verification completed successfully.',
      };

      report = finalReport;
      break;
    }

    case 'RETURNING_TO_BASE': {
      nextProgress = 50;
      const midIndex = Math.floor(totalWaypoints / 2);
      nextCoords = mission.routeCoordinates[midIndex] || drone.baseCoordinates;
      nextDistance = Number((mission.distanceTotalKm * 0.5).toFixed(1));
      logEntry = {
        id: `LOG-DRN-${Date.now()}`,
        timestamp,
        category: 'DRONE',
        severity: 'INFO',
        title: `${drone.id} Returning to Base`,
        description: `${drone.callsign} departing target sector and returning to Darbhanga Operations Base.`,
        droneId: drone.id,
      };
      break;
    }

    case 'AVAILABLE':
      nextProgress = 0;
      nextCoords = drone.baseCoordinates;
      nextDistance = 0;
      logEntry = {
        id: `LOG-DRN-${Date.now()}`,
        timestamp,
        category: 'DRONE',
        severity: 'SUCCESS',
        title: `${drone.id} Landed & Ready`,
        description: `${drone.callsign} landed at Darbhanga Hub, battery at ${nextBattery.toFixed(0)}%. Ready for next mission assignment.`,
        droneId: drone.id,
      };
      break;
  }

  const updatedMission: DroneMission = {
    ...mission,
    status: nextStatus,
    progressPercent: nextProgress,
    distanceRemainingKm: nextDistance,
    actualArrivalTime: actualArrival,
    completionTime,
    verificationOutcome,
    report,
  };

  const updatedDrone: Drone = {
    ...drone,
    status: nextStatus,
    currentCoordinates: nextCoords,
    batteryPercentage: Number(nextBattery.toFixed(1)),
    currentMissionId: nextStatus === 'AVAILABLE' ? null : mission.id,
    totalMissionsCompleted: nextStatus === 'AVAILABLE' ? drone.totalMissionsCompleted + 1 : drone.totalMissionsCompleted,
    missionHistory: nextStatus === 'AVAILABLE' && !drone.missionHistory.includes(mission.id)
      ? [...drone.missionHistory, mission.id]
      : drone.missionHistory,
  };

  return { updatedMission, updatedDrone, newLog: logEntry };
};

/**
 * Aborts a mission before takeoff or initiates return-to-base mid-flight.
 */
export const abortOrReturnDroneMission = (
  mission: DroneMission,
  drone: Drone,
  timestamp: string = new Date().toISOString()
): { updatedMission: DroneMission; updatedDrone: Drone; log: EventLogEntry } => {
  const isPreFlight = mission.status === 'MISSION_ASSIGNED' || mission.status === 'PRE_FLIGHT_CHECK';

  if (isPreFlight) {
    // Immediate cancellation
    return {
      updatedMission: {
        ...mission,
        status: 'AVAILABLE',
        completionTime: timestamp,
        operatorNotes: 'Mission cancelled by operator before takeoff.',
      },
      updatedDrone: {
        ...drone,
        status: 'AVAILABLE',
        currentMissionId: null,
      },
      log: {
        id: `LOG-ABORT-${Date.now()}`,
        timestamp,
        category: 'DRONE',
        severity: 'INFO',
        title: `Mission ${mission.id} Cancelled`,
        description: `Pre-flight sortie for ${drone.callsign} cancelled before departure.`,
        droneId: drone.id,
      },
    };
  }

  // Mid-flight: initiate Return-to-Base
  return {
    updatedMission: {
      ...mission,
      status: 'RETURNING_TO_BASE',
      operatorNotes: 'Mission aborted mid-flight. Drone returning to base.',
    },
    updatedDrone: {
      ...drone,
      status: 'RETURNING_TO_BASE',
    },
    log: {
      id: `LOG-RTB-${Date.now()}`,
      timestamp,
      category: 'DRONE',
      severity: 'WARNING',
      title: `${drone.id} Return to Base Ordered`,
      description: `Operator initiated emergency return-to-base for ${drone.callsign}.`,
      droneId: drone.id,
    },
  };
};
