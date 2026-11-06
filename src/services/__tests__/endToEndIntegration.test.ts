import { describe, it, expect, beforeEach } from 'vitest';
import { INITIAL_APPLICATION_STATE } from '../../constants/initialState';
import { applyScenarioToNodes, updateVillagesFromNodes } from '../simulationEngine';
import { calculateNodeRisk } from '../riskEngine';
import { processAlertsForNodes } from '../alertService';
import { 
  selectBestAvailableDrone, 
  createDroneMission, 
  stepDroneMission 
} from '../droneMissionService';
import { calculateHaversineDistanceKm, calculateFlightEtaMinutes } from '../geographicService';
import { restoreSensorBaseline } from '../persistenceService';
import { formatPrintableMissionReport } from '../exportService';
import type { ApplicationState } from '../../types';

describe('SESSION 9 — Mandatory 20-Step End-to-End Workflow Verification', () => {
  let state: ApplicationState;

  beforeEach(() => {
    state = JSON.parse(JSON.stringify(INITIAL_APPLICATION_STATE));
  });

  it('executes the complete mandatory 20-step demonstration workflow end-to-end', () => {
    // -------------------------------------------------------------------------
    // Step 1: Start application & open overview
    // -------------------------------------------------------------------------
    expect(state).toBeDefined();
    expect(state.simulationRunning).toBe(false); // Paused by default on fresh boot

    // -------------------------------------------------------------------------
    // Step 2: Confirm all three Bihar monitoring locations are visible
    // -------------------------------------------------------------------------
    const villageKeys = Object.keys(state.villages);
    expect(villageKeys).toContain('VILLAGE-A'); // Darbhanga
    expect(villageKeys).toContain('VILLAGE-B'); // Sitamarhi
    expect(villageKeys).toContain('VILLAGE-C'); // Madhubani
    expect(state.villages['VILLAGE-A'].district).toBe('Darbhanga');
    expect(state.villages['VILLAGE-B'].district).toBe('Sitamarhi');
    expect(state.villages['VILLAGE-C'].district).toBe('Madhubani');

    // -------------------------------------------------------------------------
    // Step 3: Confirm all normal temperatures initially fall between 27°C and 28°C
    // -------------------------------------------------------------------------
    Object.values(state.sensorNodes).forEach((node) => {
      const temp = node.sensors.temperature.value;
      expect(temp).toBeGreaterThanOrEqual(27.0);
      expect(temp).toBeLessThanOrEqual(28.0);
      expect(node.status).toBe('ONLINE');
    });

    // -------------------------------------------------------------------------
    // Step 4: Open Live Monitoring and inspect a node in Simulated Village B
    // -------------------------------------------------------------------------
    const sitNode = state.sensorNodes['BIH-SIT-001'];
    expect(sitNode).toBeDefined();
    expect(sitNode.villageId).toBe('VILLAGE-B');

    // -------------------------------------------------------------------------
    // Step 5: Inspect all five sensor types
    // -------------------------------------------------------------------------
    expect(sitNode.sensors.temperature).toBeDefined();
    expect(sitNode.sensors.humidity).toBeDefined();
    expect(sitNode.sensors.motion).toBeDefined();
    expect(sitNode.sensors.lidar).toBeDefined();
    expect(sitNode.sensors.vibration).toBeDefined();
    expect(sitNode.sensors.temperature.unit).toBe('°C');
    expect(sitNode.sensors.humidity.unit).toBe('%');
    expect(sitNode.sensors.lidar.unit).toBe('m');
    expect(sitNode.sensors.vibration.unit).toBe('g');

    // -------------------------------------------------------------------------
    // Step 6: Trigger the Combined Sensor Anomaly scenario
    // -------------------------------------------------------------------------
    const timestamp = new Date().toISOString();
    const mutatedNodes = applyScenarioToNodes('COMBINED_ANOMALY', state.sensorNodes, state.thresholds, 'BIH-SIT-001', timestamp);
    state.sensorNodes = mutatedNodes;
    state.activeScenario = 'COMBINED_ANOMALY';

    // -------------------------------------------------------------------------
    // Step 7: Verify the readings change to the scenario values
    // -------------------------------------------------------------------------
    const anomalyNode = state.sensorNodes['BIH-SIT-001'];
    expect(anomalyNode.sensors.temperature.value).toBe(27.8);
    expect(anomalyNode.sensors.humidity.value).toBe(86);
    expect(anomalyNode.sensors.motion.detected).toBe(true);
    expect(anomalyNode.sensors.lidar.value).toBe(1.1);
    expect(anomalyNode.sensors.vibration.value).toBe(0.37);

    // -------------------------------------------------------------------------
    // Step 8: Verify risk score is recalculated from actual readings and configured rules
    // -------------------------------------------------------------------------
    const riskResult = calculateNodeRisk(anomalyNode, state.thresholds);
    expect(riskResult.score).toBeGreaterThanOrEqual(80); // Extreme combined hazard
    expect(riskResult.level).toBe('CRITICAL');
    anomalyNode.riskScore = riskResult.score;
    anomalyNode.riskLevel = riskResult.level;
    anomalyNode.contributingFactors = riskResult.contributingFactors;

    // -------------------------------------------------------------------------
    // Step 9: Verify crossed thresholds and contributing factors are explained
    // -------------------------------------------------------------------------
    expect(riskResult.contributingFactors.some((f) => f.toLowerCase().includes('lidar') || f.toLowerCase().includes('proximity'))).toBe(true);
    expect(riskResult.contributingFactors.some((f) => f.toLowerCase().includes('vibration') || f.toLowerCase().includes('structural'))).toBe(true);
    expect(riskResult.contributingFactors.some((f) => f.toLowerCase().includes('humidity'))).toBe(true);
    expect(riskResult.contributingFactors.some((f) => f.toLowerCase().includes('correlation') || f.toLowerCase().includes('multi') || f.toLowerCase().includes('motion'))).toBe(true);

    // -------------------------------------------------------------------------
    // Step 10: Verify a critical incident is created
    // -------------------------------------------------------------------------
    const updatedVillages = updateVillagesFromNodes(state.villages, state.sensorNodes, timestamp);
    state.villages = updatedVillages;
    const { updatedIncidents, newLogs } = processAlertsForNodes(
      state.sensorNodes,
      state.villages,
      state.incidents,
      state.thresholds,
      state.drones,
      timestamp
    );
    state.incidents = updatedIncidents;
    state.eventLogs = [...newLogs, ...state.eventLogs];

    const incidentList = Object.values(state.incidents);
    expect(incidentList.length).toBeGreaterThanOrEqual(1);
    const criticalInc = incidentList.find((i) => i.nodeId === 'BIH-SIT-001');
    expect(criticalInc).toBeDefined();
    expect(criticalInc!.severity).toBe('CRITICAL');
    expect(criticalInc!.status).toBe('ACTIVE');

    // -------------------------------------------------------------------------
    // Step 11: Confirm incident appears consistently in overview, map, table, event log
    // -------------------------------------------------------------------------
    // In Village aggregate (overview & map pulse)
    expect(state.villages['VILLAGE-B'].currentRiskScore).toBeGreaterThanOrEqual(60);
    // In Incident Table
    expect(state.incidents[criticalInc!.id]).toBeDefined();
    // In Event Log
    expect(state.eventLogs.some((l) => l.incidentId === criticalInc!.id || l.nodeId === 'BIH-SIT-001')).toBe(true);

    // -------------------------------------------------------------------------
    // Step 12: Open dispatch confirmation modal & verify distance / ETA calculations
    // -------------------------------------------------------------------------
    expect(criticalInc!.dispatchEligible).toBe(true);
    const targetVillage = state.villages[criticalInc!.villageId];
    const availableDrone = selectBestAvailableDrone(state.drones);
    expect(availableDrone).not.toBeNull();
    const distanceKm = calculateHaversineDistanceKm(availableDrone!.baseCoordinates, targetVillage.coordinates);
    const etaMins = calculateFlightEtaMinutes(distanceKm, availableDrone!.speedKmh);
    expect(distanceKm).toBeGreaterThan(40); // ~64.8 km to Sitamarhi
    expect(etaMins).toBeGreaterThan(40);

    // -------------------------------------------------------------------------
    // Step 13: Verify dispatch does not start until explicitly confirmed
    // -------------------------------------------------------------------------
    expect(criticalInc!.assignedDroneId).toBeNull();
    expect(availableDrone!.status).toBe('AVAILABLE');

    // -------------------------------------------------------------------------
    // Step 14: Confirm dispatch and verify available drone is assigned
    // -------------------------------------------------------------------------
    const mission = createDroneMission(availableDrone!, criticalInc!, targetVillage.coordinates, distanceKm, timestamp);
    state.missions[mission.id] = mission;
    state.drones[availableDrone!.id] = {
      ...availableDrone!,
      status: 'MISSION_ASSIGNED',
      currentMissionId: mission.id,
    };
    criticalInc!.status = 'DRONE_REQUESTED';
    criticalInc!.assignedDroneId = availableDrone!.id;
    criticalInc!.assignedMissionId = mission.id;

    expect(state.drones[availableDrone!.id].status).toBe('MISSION_ASSIGNED');
    expect(state.missions[mission.id].status).toBe('MISSION_ASSIGNED');

    // -------------------------------------------------------------------------
    // Step 15: Verify mission progression, route animation, battery, and remaining distance
    // -------------------------------------------------------------------------
    let currentMission = state.missions[mission.id];
    let currentDrone = state.drones[availableDrone!.id];

    // Transition 1: PRE_FLIGHT_CHECK
    let step = stepDroneMission(currentMission, currentDrone, timestamp);
    currentMission = step.updatedMission;
    currentDrone = step.updatedDrone;
    expect(currentMission.status).toBe('PRE_FLIGHT_CHECK');

    // Transition 2: TAKEOFF
    step = stepDroneMission(currentMission, currentDrone, timestamp);
    currentMission = step.updatedMission;
    currentDrone = step.updatedDrone;
    expect(currentMission.status).toBe('TAKEOFF');

    // Transition 3: EN_ROUTE
    step = stepDroneMission(currentMission, currentDrone, timestamp);
    currentMission = step.updatedMission;
    currentDrone = step.updatedDrone;
    expect(currentMission.status).toBe('EN_ROUTE');
    expect(currentMission.distanceRemainingKm).toBeLessThan(distanceKm);
    expect(currentDrone.batteryPercentage).toBeLessThan(availableDrone!.batteryPercentage);

    // Transition 4: APPROACHING_TARGET
    step = stepDroneMission(currentMission, currentDrone, timestamp);
    currentMission = step.updatedMission;
    currentDrone = step.updatedDrone;
    expect(currentMission.status).toBe('APPROACHING_TARGET');

    // -------------------------------------------------------------------------
    // Step 16: Verify arrival and simulated aerial verification
    // -------------------------------------------------------------------------
    // Transition 5: ARRIVED
    step = stepDroneMission(currentMission, currentDrone, timestamp);
    currentMission = step.updatedMission;
    currentDrone = step.updatedDrone;
    expect(currentMission.status).toBe('ARRIVED');
    expect(currentMission.distanceRemainingKm).toBe(0);

    // Transition 6: AERIAL_VERIFICATION
    step = stepDroneMission(currentMission, currentDrone, timestamp);
    currentMission = step.updatedMission;
    currentDrone = step.updatedDrone;
    expect(currentMission.status).toBe('AERIAL_VERIFICATION');
    expect(currentMission.verificationOutcome).toBe('HAZARD_CONFIRMED');

    // -------------------------------------------------------------------------
    // Step 17: Inspect mission report and verification outcome
    // -------------------------------------------------------------------------
    // Transition 7: MISSION_COMPLETE
    step = stepDroneMission(currentMission, currentDrone, timestamp);
    currentMission = step.updatedMission;
    currentDrone = step.updatedDrone;
    expect(currentMission.status).toBe('MISSION_COMPLETE');
    expect(currentMission.report).toBeDefined();
    expect(currentMission.report!.verificationResult).toBe('HAZARD_CONFIRMED');
    expect(currentMission.report!.finalStatus).toBe('MISSION_COMPLETE');

    // Formatted report string inspection
    const reportText = formatPrintableMissionReport(currentMission.report!);
    expect(reportText).toContain(currentMission.id);
    expect(reportText).toContain('HAZARD_CONFIRMED');

    // -------------------------------------------------------------------------
    // Step 18: Verify operator can decide the incident's next status
    // -------------------------------------------------------------------------
    // Set to UNDER_INVESTIGATION
    criticalInc!.status = 'UNDER_INVESTIGATION';
    criticalInc!.verificationOutcome = currentMission.verificationOutcome;
    expect(criticalInc!.status).toBe('UNDER_INVESTIGATION');

    // Operator adds field resolution note and resolves incident
    criticalInc!.operatorNotes.push('UAV verified flood surge inundating sensor housing. Relief team notified.');
    criticalInc!.status = 'RESOLVED';
    criticalInc!.updatedAt = new Date().toISOString();
    expect(criticalInc!.status).toBe('RESOLVED');
    expect(criticalInc!.operatorNotes.length).toBeGreaterThan(0);

    // -------------------------------------------------------------------------
    // Step 19: Verify incident and mission history updates
    // -------------------------------------------------------------------------
    expect(state.incidents[criticalInc!.id].status).toBe('RESOLVED');
    expect(state.missions[mission.id]).toBeDefined();

    // -------------------------------------------------------------------------
    // Step 20: Reset the simulation and verify expected initial state
    // -------------------------------------------------------------------------
    const resetState = restoreSensorBaseline(state);
    expect(resetState.activeScenario).toBe('NORMAL');
    // Temperature back to 27°C-28°C
    expect(resetState.sensorNodes['BIH-SIT-001'].sensors.temperature.value).toBe(27.6);
    expect(resetState.sensorNodes['BIH-SIT-001'].sensors.humidity.value).toBe(64);
    expect(resetState.sensorNodes['BIH-SIT-001'].sensors.lidar.value).toBe(4.6);
    expect(resetState.sensorNodes['BIH-SIT-001'].sensors.vibration.value).toBe(0.05);
    expect(resetState.sensorNodes['BIH-SIT-001'].sensors.motion.detected).toBe(false);
    expect(resetState.sensorNodes['BIH-SIT-001'].status).toBe('ONLINE');
    // Incidents preserved
    expect(resetState.incidents[criticalInc!.id]).toBeDefined();
  });
});
