import { describe, it, expect } from 'vitest';
import { DEFAULT_THRESHOLDS, INITIAL_SENSOR_NODES } from '../../constants/initialState';
import { stepNormalNode, applyScenarioToNodes } from '../simulationEngine';
import { calculateNodeRisk } from '../riskEngine';


describe('Simulation Engine Baseline & Constraints', () => {
  it('strictly initialises normal node temperatures between 27.0°C and 28.0°C', () => {
    Object.values(INITIAL_SENSOR_NODES).forEach((node) => {
      const temp = node.sensors.temperature.value;
      expect(temp).toBeGreaterThanOrEqual(27.0);
      expect(temp).toBeLessThanOrEqual(28.0);
      expect(node.status).toBe('ONLINE');
      expect(node.riskScore).toBeLessThan(30);
    });
  });

  it('keeps normal temperature bounded within 27°C-28°C during coherent fluctuations', () => {
    let node = INITIAL_SENSOR_NODES['BIH-DAR-001'];
    const now = new Date().toISOString();
    for (let i = 0; i < 50; i++) {
      node = stepNormalNode(node, DEFAULT_THRESHOLDS, now);
      expect(node.sensors.temperature.value).toBeGreaterThanOrEqual(27.0);
      expect(node.sensors.temperature.value).toBeLessThanOrEqual(28.0);
      expect(node.sensors.humidity.value).toBeGreaterThanOrEqual(45);
      expect(node.sensors.humidity.value).toBeLessThanOrEqual(70);
      expect(node.sensors.vibration.value).toBeLessThan(0.15); // normal vibration limit
      expect(node.sensors.lidar.value).toBeGreaterThan(3.0); // normal distance limit
    }
  });

  it('applies Scenario F (Combined Anomaly) matching Step 4 of the master prompt', () => {
    const updatedNodes = applyScenarioToNodes('COMBINED_ANOMALY', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, 'BIH-SIT-001');
    const target = updatedNodes['BIH-SIT-001'];
    expect(target.sensors.temperature.value).toBe(27.8);
    expect(target.sensors.humidity.value).toBe(86);
    expect(target.sensors.motion.detected).toBe(true);
    expect(target.sensors.lidar.value).toBe(1.1);
    expect(target.sensors.vibration.value).toBe(0.37);

    const risk = calculateNodeRisk(target, DEFAULT_THRESHOLDS);
    expect(risk.score).toBeGreaterThanOrEqual(80); // CRITICAL
    expect(risk.level).toBe('CRITICAL');
    expect(risk.contributingFactors.length).toBeGreaterThan(2);
  });

  it('marks node readings as stale when a node goes offline (Scenario H)', () => {
    const updatedNodes = applyScenarioToNodes('NODE_OFFLINE', INITIAL_SENSOR_NODES, DEFAULT_THRESHOLDS, 'BIH-DAR-002');
    const target = updatedNodes['BIH-DAR-002'];
    expect(target.status).toBe('OFFLINE');
    expect(target.isStale).toBe(true);
    expect(target.signalQuality).toBe(0);
    expect(target.latencyMs).toBe(9999);
  });
});
