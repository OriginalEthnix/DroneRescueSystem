import { describe, it, expect } from 'vitest';
import { calculateNodeRisk } from '../riskEngine';
import { DEFAULT_THRESHOLDS, INITIAL_SENSOR_NODES } from '../../constants/initialState';
import type { SensorNode } from '../../types';

describe('Deterministic Risk Engine Scoring', () => {
  it('computes low baseline risk score for normal sensor readings', () => {
    const normalNode = INITIAL_SENSOR_NODES['BIH-DAR-001'];
    const result = calculateNodeRisk(normalNode, DEFAULT_THRESHOLDS);

    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.level).toBe('NORMAL');
    expect(result.contributingFactors).toContain('All parameters within normal baseline limits');
  });

  it('marks offline node as WARNING with 50 score and stale flag', () => {
    const offlineNode: SensorNode = {
      ...INITIAL_SENSOR_NODES['BIH-DAR-001'],
      status: 'OFFLINE',
      isStale: true,
    };
    const result = calculateNodeRisk(offlineNode, DEFAULT_THRESHOLDS);

    expect(result.score).toBe(50);
    expect(result.level).toBe('WARNING');
    expect(result.contributingFactors[0]).toContain('Telemetry Stale');
  });

  it('elevates risk for isolated critical vibration breach', () => {
    const node: SensorNode = {
      ...INITIAL_SENSOR_NODES['BIH-SIT-001'],
      sensors: {
        ...INITIAL_SENSOR_NODES['BIH-SIT-001'].sensors,
        vibration: { value: 0.38, unit: 'g', status: 'CRITICAL', lastChanged: new Date().toISOString() },
      },
    };
    const result = calculateNodeRisk(node, DEFAULT_THRESHOLDS);

    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.contributingFactors.some((f) => f.includes('Severe structural vibration'))).toBe(true);
  });

  it('applies multi-sensor compounding multiplier when multiple anomalies occur simultaneously', () => {
    const compoundNode: SensorNode = {
      ...INITIAL_SENSOR_NODES['BIH-SIT-001'],
      sensors: {
        ...INITIAL_SENSOR_NODES['BIH-SIT-001'].sensors,
        lidar: { value: 1.1, unit: 'm', status: 'CRITICAL', lastChanged: new Date().toISOString() },
        vibration: { value: 0.35, unit: 'g', status: 'CRITICAL', lastChanged: new Date().toISOString() },
        motion: { detected: true, detectionCount: 5, lastDetectionTime: new Date().toISOString(), status: 'WARNING', lastChanged: new Date().toISOString() },
      },
    };
    const result = calculateNodeRisk(compoundNode, DEFAULT_THRESHOLDS);

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.level).toBe('CRITICAL');
    expect(result.contributingFactors.some((f) => f.includes('Multi-sensor compounding'))).toBe(true);
  });

  it('strictly clamps risk score between 0 and 100 even with extreme inputs', () => {
    const extremeNode: SensorNode = {
      ...INITIAL_SENSOR_NODES['BIH-SIT-001'],
      sensors: {
        temperature: { value: 95.0, unit: '°C', status: 'CRITICAL', lastChanged: new Date().toISOString() },
        humidity: { value: 100, unit: '%', status: 'CRITICAL', lastChanged: new Date().toISOString() },
        lidar: { value: 0.1, unit: 'm', status: 'CRITICAL', lastChanged: new Date().toISOString() },
        vibration: { value: 5.0, unit: 'g', status: 'CRITICAL', lastChanged: new Date().toISOString() },
        motion: { detected: true, detectionCount: 50, lastDetectionTime: new Date().toISOString(), status: 'CRITICAL', lastChanged: new Date().toISOString() },
      },
    };
    const result = calculateNodeRisk(extremeNode, DEFAULT_THRESHOLDS);

    expect(result.score).toBe(100);
    expect(result.level).toBe('CRITICAL');
  });
});
