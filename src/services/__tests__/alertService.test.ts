import { describe, it, expect } from 'vitest';
import { DEFAULT_THRESHOLDS, INITIAL_SENSOR_NODES, INITIAL_VILLAGES, INITIAL_DRONES } from '../../constants/initialState';
import { calculateNodeRisk } from '../riskEngine';
import { processAlertsForNodes } from '../alertService';
import { applyScenarioToNodes } from '../simulationEngine';
import type { Incident } from '../../types';

describe('Risk Engine & Alert Incident Management', () => {
  it('keeps normal baseline nodes within NORMAL risk (0-29)', () => {
    Object.values(INITIAL_SENSOR_NODES).forEach((node) => {
      const risk = calculateNodeRisk(node, DEFAULT_THRESHOLDS);
      expect(risk.score).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.riskScoring.categoryCutoffs.normalMax);
      expect(risk.level).toBe('NORMAL');
      expect(risk.contributingFactors).toContain('All parameters within normal baseline limits');
    });
  });

  it('immediately elevates isolated Critical LiDAR proximity (< 1.5m) to CRITICAL risk', () => {
    const mutated = applyScenarioToNodes('PROXIMITY_HAZARD', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, 'BIH-SIT-001');
    const target = mutated['BIH-SIT-001'];
    expect(target.sensors.lidar.value).toBe(1.1);

    const risk = calculateNodeRisk(target, DEFAULT_THRESHOLDS);
    expect(risk.score).toBeGreaterThanOrEqual(45); // individual critical rule applied
    expect(risk.contributingFactors.some((f) => f.includes('Critical proximity hazard'))).toBe(true);
  });

  it('immediately elevates isolated Critical Vibration (>= 0.30g) to elevated risk with factors', () => {
    const mutated = applyScenarioToNodes('STRUCTURAL_VIBRATION', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, 'BIH-SIT-001');
    const target = mutated['BIH-SIT-001'];
    expect(target.sensors.vibration.value).toBe(0.38);

    const risk = calculateNodeRisk(target, DEFAULT_THRESHOLDS);
    expect(risk.score).toBeGreaterThanOrEqual(45);
    expect(risk.contributingFactors.some((f) => f.includes('Severe structural vibration'))).toBe(true);
  });

  it('creates an incident when threshold is crossed and deduplicates on subsequent ticks', () => {
    const mutated = applyScenarioToNodes('COMBINED_ANOMALY', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, 'BIH-SIT-001');
    
    // First alert processing tick
    const { updatedIncidents, newLogs } = processAlertsForNodes(
      mutated,
      INITIAL_VILLAGES,
      {},
      DEFAULT_THRESHOLDS,
      INITIAL_DRONES
    );

    const incidentsList = Object.values(updatedIncidents);
    expect(incidentsList.length).toBe(1);
    const incident = incidentsList[0];
    expect(incident.severity).toBe('CRITICAL');
    expect(incident.nodeId).toBe('BIH-SIT-001');
    expect(incident.status).toBe('ACTIVE');
    expect(incident.dispatchEligible).toBe(true);
    expect(newLogs.length).toBe(1);

    // Second alert processing tick for the same continuous anomaly (should NOT duplicate)
    const secondPass = processAlertsForNodes(
      mutated,
      INITIAL_VILLAGES,
      updatedIncidents,
      DEFAULT_THRESHOLDS,
      INITIAL_DRONES
    );

    expect(Object.values(secondPass.updatedIncidents).length).toBe(1); // deduplication preserved
    expect(secondPass.newLogs.length).toBe(0); // no duplicate log entry
  });

  it('permits a new incident when a previously resolved condition recurs', () => {
    const mutated = applyScenarioToNodes('COMBINED_ANOMALY', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, 'BIH-SIT-001');
    
    // Create initial incident
    const firstPass = processAlertsForNodes(
      mutated,
      INITIAL_VILLAGES,
      {},
      DEFAULT_THRESHOLDS,
      INITIAL_DRONES
    );

    const incId = Object.keys(firstPass.updatedIncidents)[0];
    // Manually mark as RESOLVED by operator
    const resolvedState: Record<string, Incident> = {
      [incId]: {
        ...firstPass.updatedIncidents[incId],
        status: 'RESOLVED',
      },
    };

    // When condition recurs or persists after explicit resolution
    const recurrencePass = processAlertsForNodes(
      mutated,
      INITIAL_VILLAGES,
      resolvedState,
      DEFAULT_THRESHOLDS,
      INITIAL_DRONES
    );

    // Should create a brand new incident while keeping the resolved one in history
    const allIncidents = Object.values(recurrencePass.updatedIncidents);
    expect(allIncidents.length).toBe(2);
    expect(allIncidents.filter((i) => i.status === 'RESOLVED').length).toBe(1);
    expect(allIncidents.filter((i) => i.status === 'ACTIVE').length).toBe(1);
  });
});
