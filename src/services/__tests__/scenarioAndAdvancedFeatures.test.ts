import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_THRESHOLDS, 
  INITIAL_SENSOR_NODES, 
  INITIAL_VILLAGES, 
  INITIAL_DRONES
} from '../../constants/initialState';
import { applyScenarioToNodes, stepNormalNode } from '../simulationEngine';
import { calculateNodeRisk } from '../riskEngine';
import { processAlertsForNodes, calculateIncidentPriority } from '../alertService';
import { evaluateMultiSensorCorrelations } from '../correlationEngine';
import { formatPrintableMissionReport } from '../exportService';
import type { DroneMissionReport, SensorNode } from '../../types';

describe('SESSION 7 — Scenario Simulator and Advanced Features', () => {

  describe('1. Scenario Simulator — All Eight Scenarios (A through H)', () => {
    it('Scenario A: Normal Conditions resets all nodes to 27°C–28°C baseline', () => {
      // First mutate a node to high temp
      const dirtyNodes = applyScenarioToNodes('TEMP_ANOMALY', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, 'BIH-SIT-001');
      expect(dirtyNodes['BIH-SIT-001'].sensors.temperature.value).toBeGreaterThan(35);

      // Now apply Scenario A: NORMAL
      const resetNodes = applyScenarioToNodes('NORMAL', dirtyNodes, DEFAULT_THRESHOLDS);
      Object.values(resetNodes).forEach((node) => {
        expect(node.status).toBe('ONLINE');
        expect(node.isStale).toBe(false);
        expect(node.sensors.temperature.value).toBeGreaterThanOrEqual(27.0);
        expect(node.sensors.temperature.value).toBeLessThanOrEqual(28.0);
        expect(node.sensors.humidity.value).toBeLessThanOrEqual(70);
        expect(node.sensors.lidar.value).toBeGreaterThan(4.0);
        expect(node.sensors.vibration.value).toBeLessThan(0.10);
        expect(node.sensors.motion.detected).toBe(false);
      });
    });

    it('Scenario B: Temperature Anomaly raises selected node temperature above warning threshold', () => {
      const targetId = 'BIH-DAR-001';
      const nodes = applyScenarioToNodes('TEMP_ANOMALY', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, targetId);
      const target = nodes[targetId];

      expect(target.sensors.temperature.value).toBeGreaterThan(DEFAULT_THRESHOLDS.temperature.warningMin);
      expect(target.sensors.temperature.status).toBe('WARNING');

      const risk = calculateNodeRisk(target, DEFAULT_THRESHOLDS);
      expect(risk.score).toBeGreaterThan(20);

      const { updatedIncidents } = processAlertsForNodes(nodes, INITIAL_VILLAGES, {}, DEFAULT_THRESHOLDS, INITIAL_DRONES);
      const targetInc = Object.values(updatedIncidents).find((i) => i.nodeId === targetId);
      expect(targetInc).toBeDefined();
      expect(targetInc?.severity).toBe('WARNING');
      expect(targetInc?.triggerSensor).toBe('temperature');
    });

    it('Scenario C: High Humidity increases humidity above warning threshold (>80%)', () => {
      const targetId = 'BIH-MAD-001';
      const nodes = applyScenarioToNodes('HIGH_HUMIDITY', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, targetId);
      const target = nodes[targetId];

      expect(target.sensors.humidity.value).toBeGreaterThan(DEFAULT_THRESHOLDS.humidity.warningMin);
      expect(target.sensors.humidity.status).toBe('WARNING');

      const { updatedIncidents } = processAlertsForNodes(nodes, INITIAL_VILLAGES, {}, DEFAULT_THRESHOLDS, INITIAL_DRONES);
      const targetInc = Object.values(updatedIncidents).find((i) => i.nodeId === targetId);
      expect(targetInc).toBeDefined();
      expect(targetInc?.severity).toBe('WARNING');
      expect(targetInc?.triggerSensor).toBe('humidity');
    });

    it('Scenario D: Structural Vibration exceeds critical threshold (>=0.30g)', () => {
      const targetId = 'BIH-SIT-002';
      const nodes = applyScenarioToNodes('STRUCTURAL_VIBRATION', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, targetId);
      const target = nodes[targetId];

      expect(target.sensors.vibration.value).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.vibration.criticalG);
      expect(target.sensors.vibration.status).toBe('CRITICAL');

      const risk = calculateNodeRisk(target, DEFAULT_THRESHOLDS);
      expect(risk.score).toBeGreaterThanOrEqual(45);
      expect(risk.score).toBeLessThan(DEFAULT_THRESHOLDS.riskScoring.categoryCutoffs.warningMax); // 55 < 59 (Warning tier for single sensor)

      const { updatedIncidents } = processAlertsForNodes(nodes, INITIAL_VILLAGES, {}, DEFAULT_THRESHOLDS, INITIAL_DRONES);
      const targetInc = Object.values(updatedIncidents).find((i) => i.nodeId === targetId);
      expect(targetInc).toBeDefined();
      expect(targetInc?.severity).toBe('CRITICAL');
      expect(targetInc?.dispatchEligible).toBe(true);
    });

    it('Scenario E: Proximity Hazard reports distance below critical threshold (<=1.5m)', () => {
      const targetId = 'BIH-DAR-002';
      const nodes = applyScenarioToNodes('PROXIMITY_HAZARD', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, targetId);
      const target = nodes[targetId];

      expect(target.sensors.lidar.value).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.lidar.criticalDistance);
      expect(target.sensors.lidar.status).toBe('CRITICAL');

      const risk = calculateNodeRisk(target, DEFAULT_THRESHOLDS);
      expect(risk.score).toBeGreaterThanOrEqual(45);

      const { updatedIncidents } = processAlertsForNodes(nodes, INITIAL_VILLAGES, {}, DEFAULT_THRESHOLDS, INITIAL_DRONES);
      const targetInc = Object.values(updatedIncidents).find((i) => i.nodeId === targetId);
      expect(targetInc).toBeDefined();
      expect(targetInc?.severity).toBe('CRITICAL');
      expect(targetInc?.triggerSensor).toBe('lidar');
    });

    it('Scenario F: Combined Sensor Anomaly reports compound sensor anomalies and triggers high risk', () => {
      const targetId = 'BIH-SIT-001';
      const nodes = applyScenarioToNodes('COMBINED_ANOMALY', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, targetId);
      const target = nodes[targetId];

      expect(target.sensors.temperature.value).toBe(27.8);
      expect(target.sensors.humidity.value).toBe(86);
      expect(target.sensors.motion.detected).toBe(true);
      expect(target.sensors.lidar.value).toBe(1.1);
      expect(target.sensors.vibration.value).toBe(0.37);

      const risk = calculateNodeRisk(target, DEFAULT_THRESHOLDS);
      expect(risk.score).toBeGreaterThanOrEqual(80);
      expect(risk.level).toBe('CRITICAL');
      expect(risk.contributingFactors.some((f) => f.includes('Multi-sensor compounding'))).toBe(true);

      const { updatedIncidents } = processAlertsForNodes(nodes, INITIAL_VILLAGES, {}, DEFAULT_THRESHOLDS, INITIAL_DRONES);
      const targetInc = Object.values(updatedIncidents).find((i) => i.nodeId === targetId);
      expect(targetInc).toBeDefined();
      expect(targetInc?.severity).toBe('CRITICAL');
      expect(targetInc?.dispatchEligible).toBe(true);
    });

    it('Scenario G: Multi-Village Incident triggers anomalies in multiple villages simultaneously', () => {
      const nodes = applyScenarioToNodes('MULTI_VILLAGE', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS);
      
      const nodeB = nodes['BIH-SIT-001'];
      const nodeC = nodes['BIH-MAD-001'];

      expect(nodeB.villageId).toBe('VILLAGE-B');
      expect(nodeB.sensors.lidar.value).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.lidar.criticalDistance);

      expect(nodeC.villageId).toBe('VILLAGE-C');
      expect(nodeC.sensors.humidity.value).toBeGreaterThan(DEFAULT_THRESHOLDS.humidity.warningMin);

      const { updatedIncidents } = processAlertsForNodes(nodes, INITIAL_VILLAGES, {}, DEFAULT_THRESHOLDS, INITIAL_DRONES);
      const incB = Object.values(updatedIncidents).find((i) => i.nodeId === 'BIH-SIT-001');
      const incC = Object.values(updatedIncidents).find((i) => i.nodeId === 'BIH-MAD-001');

      expect(incB).toBeDefined();
      expect(incC).toBeDefined();
      expect(incB?.villageId).not.toBe(incC?.villageId);
    });

    it('Scenario H: Sensor Node Offline marks node OFFLINE with 0% signal and stale data', () => {
      const targetId = 'BIH-DAR-002';
      const nodes = applyScenarioToNodes('NODE_OFFLINE', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, targetId);
      const target = nodes[targetId];

      expect(target.status).toBe('OFFLINE');
      expect(target.isStale).toBe(true);
      expect(target.signalQuality).toBe(0);
      expect(target.latencyMs).toBe(9999);

      // Simulation clock tick should preserve stale offline state
      const ticked = stepNormalNode(target, DEFAULT_THRESHOLDS, new Date().toISOString());
      expect(ticked.status).toBe('OFFLINE');
      expect(ticked.isStale).toBe(true);
      expect(ticked.signalQuality).toBe(0);
    });
  });

  describe('2. Multi-Sensor Correlation Engine', () => {
    it('isolated motion only triggers observation rule without high risk escalation', () => {
      const normalNode = { ...INITIAL_SENSOR_NODES['BIH-DAR-001'] };
      const motionNode: SensorNode = {
        ...normalNode,
        sensors: {
          ...normalNode.sensors,
          motion: {
            detected: true,
            lastDetectionTime: new Date().toISOString(),
            detectionCount: 1,
            status: 'WARNING',
            lastChanged: new Date().toISOString(),
          },
        },
      };

      const correlations = evaluateMultiSensorCorrelations(motionNode, DEFAULT_THRESHOLDS);
      expect(correlations.length).toBe(1);
      expect(correlations[0].ruleId).toBe('CORR-ISOLATED-MOTION');
      expect(correlations[0].priorityBonus).toBe(0);
      expect(correlations[0].severityWeight).toBe('LOW');
    });

    it('motion + abnormal vibration triggers structural dynamics correlation', () => {
      const normalNode = { ...INITIAL_SENSOR_NODES['BIH-DAR-001'] };
      const compoundNode: SensorNode = {
        ...normalNode,
        sensors: {
          ...normalNode.sensors,
          motion: {
            detected: true,
            lastDetectionTime: new Date().toISOString(),
            detectionCount: 2,
            status: 'WARNING',
            lastChanged: new Date().toISOString(),
          },
          vibration: {
            value: 0.22,
            unit: 'g',
            status: 'WARNING',
            lastChanged: new Date().toISOString(),
          },
        },
      };

      const correlations = evaluateMultiSensorCorrelations(compoundNode, DEFAULT_THRESHOLDS);
      expect(correlations.some((r) => r.ruleId === 'CORR-MOTION-VIB')).toBe(true);
      const motionVibRule = correlations.find((r) => r.ruleId === 'CORR-MOTION-VIB')!;
      expect(motionVibRule.priorityBonus).toBeGreaterThanOrEqual(20);
      expect(motionVibRule.explanation).toContain('abnormal structural vibration');
    });

    it('critical LiDAR + abnormal vibration triggers highest flood/collapse correlation', () => {
      const normalNode = { ...INITIAL_SENSOR_NODES['BIH-SIT-001'] };
      const floodCollapseNode: SensorNode = {
        ...normalNode,
        sensors: {
          ...normalNode.sensors,
          lidar: {
            value: 1.1,
            unit: 'm',
            status: 'CRITICAL',
            lastChanged: new Date().toISOString(),
          },
          vibration: {
            value: 0.35,
            unit: 'g',
            status: 'CRITICAL',
            lastChanged: new Date().toISOString(),
          },
        },
      };

      const correlations = evaluateMultiSensorCorrelations(floodCollapseNode, DEFAULT_THRESHOLDS);
      expect(correlations.some((r) => r.ruleId === 'CORR-FLOOD-COLLAPSE')).toBe(true);
      const rule = correlations.find((r) => r.ruleId === 'CORR-FLOOD-COLLAPSE')!;
      expect(rule.severityWeight).toBe('CRITICAL');
      expect(rule.priorityBonus).toBe(35);
    });
  });

  describe('3. Alert Prioritization (All 5 Criteria)', () => {
    it('calculates priority across severity, risk, affected nodes, age, and drone availability', () => {
      const priority = calculateIncidentPriority(
        'CRITICAL',
        85,
        new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes old
        INITIAL_DRONES,
        2, // 2 affected nodes in sector
        1  // 1 correlation rule active
      );

      expect(priority.breakdown).toBeDefined();
      expect(priority.breakdown.severityScore).toBe(50); // CRITICAL (+50)
      expect(priority.breakdown.riskScoreComponent).toBe(85); // Risk score
      expect(priority.breakdown.affectedNodesScore).toBe(15); // Multi-node bonus
      expect(priority.breakdown.ageScore).toBeGreaterThanOrEqual(15); // Age bonus
      expect(priority.breakdown.fleetReadinessScore).toBe(10); // Available drone bonus
      expect(priority.breakdown.correlationScore).toBe(12); // Correlation bonus

      expect(priority.score).toBe(
        50 + 85 + 15 + priority.breakdown.ageScore + 10 + 12
      );
    });

    it('demonstrates why a critical multi-node hazard ranks above an isolated warning', () => {
      const critPriority = calculateIncidentPriority(
        'CRITICAL',
        92,
        new Date().toISOString(),
        INITIAL_DRONES,
        2,
        1
      );

      const warnPriority = calculateIncidentPriority(
        'WARNING',
        35,
        new Date(Date.now() - 5 * 60000).toISOString(),
        INITIAL_DRONES,
        1,
        0
      );

      expect(critPriority.score).toBeGreaterThan(warnPriority.score);
      expect(critPriority.breakdown.severityScore).toBeGreaterThan(warnPriority.breakdown.severityScore);
    });
  });

  describe('4. Drone Mission Reports (10 Fields & Inspection Consistency)', () => {
    it('generates and formats complete 10-field mission summary report', () => {
      const sampleReport: DroneMissionReport = {
        missionId: 'MSN-2026-001',
        incidentId: 'INC-2026-001',
        targetVillage: 'Simulated Village B',
        assignedDrone: 'AeroScout-Alpha (DRONE-01)',
        dispatchTime: '2026-10-22T10:00:00.000Z',
        simulatedArrivalTime: '2026-10-22T10:14:00.000Z',
        verificationResult: 'HAZARD_CONFIRMED',
        missionDuration: '14 minutes',
        finalStatus: 'MISSION_COMPLETE',
        operatorNotes: 'Thermal camera confirmed floodwater surge breaching north embankment.',
      };

      const printableText = formatPrintableMissionReport(sampleReport);
      expect(printableText).toContain('MSN-2026-001');
      expect(printableText).toContain('INC-2026-001');
      expect(printableText).toContain('Simulated Village B');
      expect(printableText).toContain('AeroScout-Alpha (DRONE-01)');
      expect(printableText).toContain('HAZARD_CONFIRMED');
      expect(printableText).toContain('14 minutes');
      expect(printableText).toContain('Thermal camera confirmed floodwater surge');
    });
  });
});
