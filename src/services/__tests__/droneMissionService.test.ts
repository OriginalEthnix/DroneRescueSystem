import { describe, it, expect } from 'vitest';
import { 
  selectBestAvailableDrone, 
  createDroneMission, 
  stepDroneMission, 
  abortOrReturnDroneMission,
  NEXT_MISSION_STATUS_MAP
} from '../droneMissionService';
import { INITIAL_DRONES, INITIAL_VILLAGES } from '../../constants/initialState';
import type { Incident } from '../../types';

describe('Autonomous Drone Operations & Mission Lifecycle', () => {
  const dummyIncident: Incident = {
    id: 'INC-TEST-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    villageId: 'VILLAGE-B',
    villageName: 'Simulated Village B',
    district: 'Sitamarhi',
    nodeId: 'BIH-SIT-001',
    severity: 'CRITICAL',
    triggerReason: 'Structural vibration exceeded critical threshold',
    triggerSensor: 'vibration',
    triggerValue: '0.38g',
    configuredThreshold: '>= 0.30g',
    riskScore: 85,
    contributingConditions: ['Critical vibration', 'High humidity'],
    recommendedResponse: 'Dispatch drone reconnaissance',
    status: 'ACTIVE',
    dispatchEligible: true,
    priorityScore: 135,
    priorityExplanation: 'Critical Severity (+50)',
    assignedDroneId: null,
    assignedMissionId: null,
    verificationOutcome: null,
    operatorNotes: [],
  };

  it('selects the drone with highest battery among available units', () => {
    const selected = selectBestAvailableDrone(INITIAL_DRONES);
    expect(selected).not.toBeNull();
    expect(selected?.id).toBe('DRONE-01'); // 94% vs 87%
    expect(selected?.status).toBe('AVAILABLE');
  });

  it('creates a new drone mission in MISSION_ASSIGNED state with flight waypoints', () => {
    const drone = INITIAL_DRONES['DRONE-01'];
    const targetCoords = INITIAL_VILLAGES['VILLAGE-B'].coordinates;
    const mission = createDroneMission(drone, dummyIncident, targetCoords, 65.2);

    expect(mission.id).toMatch(/^MSN-/);
    expect(mission.droneId).toBe('DRONE-01');
    expect(mission.targetVillageId).toBe('VILLAGE-B');
    expect(mission.status).toBe('MISSION_ASSIGNED');
    expect(mission.routeCoordinates.length).toBeGreaterThan(10);
  });

  it('steps through all 11 mission stages sequentially to MISSION_COMPLETE and generates report', () => {
    const drone = { ...INITIAL_DRONES['DRONE-01'] };
    const targetCoords = INITIAL_VILLAGES['VILLAGE-B'].coordinates;
    let mission = createDroneMission(drone, dummyIncident, targetCoords, 65.2);
    let activeDrone = drone;

    const expectedOrder = [
      'PRE_FLIGHT_CHECK',
      'TAKEOFF',
      'EN_ROUTE',
      'APPROACHING_TARGET',
      'ARRIVED',
      'AERIAL_VERIFICATION',
      'MISSION_COMPLETE',
      'RETURNING_TO_BASE',
      'AVAILABLE',
    ];

    expectedOrder.forEach((expectedStatus) => {
      const res = stepDroneMission(mission, activeDrone);
      mission = res.updatedMission;
      activeDrone = res.updatedDrone;
      expect(mission.status).toBe(expectedStatus);
      expect(activeDrone.status).toBe(expectedStatus);
    });

    // Verify mission complete produced a valid report
    expect(mission.report).toBeDefined();
    expect(mission.report?.missionId).toBe(mission.id);
    expect(mission.report?.verificationResult).toBe('HAZARD_CONFIRMED');
    expect(activeDrone.totalMissionsCompleted).toBe(drone.totalMissionsCompleted + 1);
  });

  it('supports mission cancellation before takeoff', () => {
    const drone = { ...INITIAL_DRONES['DRONE-01'] };
    const targetCoords = INITIAL_VILLAGES['VILLAGE-B'].coordinates;
    const mission = createDroneMission(drone, dummyIncident, targetCoords, 65.2);

    const { updatedMission, updatedDrone } = abortOrReturnDroneMission(mission, drone);
    expect(updatedMission.status).toBe('AVAILABLE');
    expect(updatedDrone.status).toBe('AVAILABLE');
    expect(updatedDrone.currentMissionId).toBeNull();
  });

  it('supports emergency return-to-base mid-flight', () => {
    const drone = { ...INITIAL_DRONES['DRONE-01'], status: 'EN_ROUTE' as const };
    const targetCoords = INITIAL_VILLAGES['VILLAGE-B'].coordinates;
    const mission = {
      ...createDroneMission(drone, dummyIncident, targetCoords, 65.2),
      status: 'EN_ROUTE' as const,
    };

    const { updatedMission, updatedDrone } = abortOrReturnDroneMission(mission, drone);
    expect(updatedMission.status).toBe('RETURNING_TO_BASE');
    expect(updatedDrone.status).toBe('RETURNING_TO_BASE');
  });
});
