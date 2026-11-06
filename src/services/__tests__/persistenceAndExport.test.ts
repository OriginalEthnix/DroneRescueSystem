import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  validateAndMigrateState, 
  loadApplicationState, 
  saveApplicationState, 
  clearApplicationState, 
  restoreSensorBaseline,
  STORAGE_KEY 
} from '../persistenceService';
import { 
  exportIncidentsToCSV, 
  exportIncidentsToJSON, 
  exportMissionsToCSV, 
  exportMissionsToJSON, 
  formatPrintableMissionReport 
} from '../exportService';
import { INITIAL_APPLICATION_STATE, DEFAULT_THRESHOLDS } from '../../constants/initialState';
import type { Incident, DroneMission, DroneMissionReport, ApplicationState } from '../../types';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

describe('Session 8 — Persistence Service & Schema Migration', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new LocalStorageMock();
    vi.restoreAllMocks();
  });

  it('safely handles non-object, null, and empty inputs by returning clean initial state', () => {
    const fromNull = validateAndMigrateState(null);
    expect(fromNull.simulationRunning).toBe(false);
    expect(Object.keys(fromNull.villages).length).toBe(3);
    expect(Object.keys(fromNull.sensorNodes).length).toBe(6);

    const fromArray = validateAndMigrateState(['invalid', 'state']);
    expect(fromArray.simulationRunning).toBe(false);

    const fromString = validateAndMigrateState('just a string');
    expect(fromString.villages).toBeDefined();
  });

  it('guarantees simulationRunning is false on restoration for operator safety', () => {
    const rawState = {
      ...INITIAL_APPLICATION_STATE,
      simulationRunning: true, // was running when persisted
    };
    const restored = validateAndMigrateState(rawState);
    expect(restored.simulationRunning).toBe(false);
  });

  it('safely restores and validates partial thresholds with fallbacks', () => {
    const corruptedPayload = {
      thresholds: {
        temperature: { warningMin: 'invalid', criticalMax: 45.0 },
      },
    };
    const migrated = validateAndMigrateState(corruptedPayload);
    expect(migrated.thresholds.temperature.warningMin).toBe(DEFAULT_THRESHOLDS.temperature.warningMin);
    expect(migrated.thresholds.temperature.criticalMax).toBe(45.0);
    expect(migrated.thresholds.humidity.warningMin).toBe(DEFAULT_THRESHOLDS.humidity.warningMin);
  });

  it('safely restores partial sensor nodes and repairs NaN values', () => {
    const corruptedPayload = {
      sensorNodes: {
        'BIH-SIT-001': {
          sensors: {
            temperature: { value: NaN },
            humidity: { value: 88 },
          },
          riskScore: 'not-a-number',
          status: 'INVALID_STATUS',
        },
      },
    };
    const migrated = validateAndMigrateState(corruptedPayload);
    const node = migrated.sensorNodes['BIH-SIT-001'];
    expect(node).toBeDefined();
    expect(isNaN(node.sensors.temperature.value)).toBe(false);
    expect(typeof node.riskScore).toBe('number');
    expect(node.status).toBe('ONLINE');
  });

  it('safely handles corrupted/malformed localStorage JSON string without crashing', () => {
    (globalThis as any).localStorage.setItem(STORAGE_KEY, '{ malformed json: missing quotes & bracket ');
    const state = loadApplicationState();
    expect(state).toBeDefined();
    expect(state.simulationRunning).toBe(false);
    expect(Object.keys(state.villages).length).toBe(3);
  });

  it('persists and reloads application state accurately', () => {
    const sampleIncident: Incident = {
      id: 'INC-TEST-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      villageId: 'VILLAGE-B',
      villageName: 'Simulated Village B',
      district: 'Sitamarhi',
      nodeId: 'BIH-SIT-001',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      riskScore: 78,
      priorityScore: 88,
      priorityExplanation: 'High risk thermal anomaly',
      recommendedResponse: 'Dispatch UAV reconnaissance',
      triggerSensor: 'temperature',
      triggerValue: '41.5°C',
      configuredThreshold: '40.0°C',
      triggerReason: 'Severe thermal excursion',
      contributingConditions: ['High ambient heat'],
      operatorNotes: ['Deploy immediate UAV verification'],
      dispatchEligible: true,
      assignedDroneId: null,
      assignedMissionId: null,
      verificationOutcome: null,
    };

    const testState: ApplicationState = {
      ...INITIAL_APPLICATION_STATE,
      activeScenario: 'TEMP_ANOMALY',
      simulationSpeed: 2.0,
      incidents: {
        'INC-TEST-001': sampleIncident,
      },
    };

    saveApplicationState(testState);
    const loaded = loadApplicationState();

    expect(loaded.activeScenario).toBe('TEMP_ANOMALY');
    expect(loaded.simulationSpeed).toBe(2.0);
    expect(loaded.incidents['INC-TEST-001']).toBeDefined();
    expect(loaded.incidents['INC-TEST-001'].operatorNotes).toContain('Deploy immediate UAV verification');
  });

  it('caps event logs at 200 items to protect localStorage quota', () => {
    const massiveLogs = Array.from({ length: 300 }, (_, i) => ({
      id: `LOG-${i}`,
      timestamp: new Date().toISOString(),
      category: 'SENSOR' as const,
      severity: 'INFO' as const,
      title: `Event ${i}`,
      description: `Test event log ${i}`,
    }));

    const stateWithManyLogs: ApplicationState = {
      ...INITIAL_APPLICATION_STATE,
      eventLogs: massiveLogs,
    };

    saveApplicationState(stateWithManyLogs);
    const restored = loadApplicationState();
    expect(restored.eventLogs.length).toBeLessThanOrEqual(200);
  });

  it('restoreSensorBaseline returns sensors to normal while preserving incidents and sortie logs', () => {
    const sampleIncident: Incident = {
      id: 'INC-SAVED-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      villageId: 'VILLAGE-B',
      villageName: 'Simulated Village B',
      district: 'Sitamarhi',
      nodeId: 'BIH-SIT-001',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      riskScore: 92,
      priorityScore: 95,
      priorityExplanation: 'Critical structural vibration hazard',
      recommendedResponse: 'Immediate evacuation alert and UAV dispatch',
      triggerSensor: 'vibration',
      triggerValue: '0.45g',
      configuredThreshold: '0.30g',
      triggerReason: 'Structural anomaly',
      contributingConditions: [],
      operatorNotes: ['Do not wipe this record!'],
      dispatchEligible: true,
      assignedDroneId: null,
      assignedMissionId: null,
      verificationOutcome: null,
    };

    const stateWithAnomalies: ApplicationState = {
      ...INITIAL_APPLICATION_STATE,
      activeScenario: 'STRUCTURAL_VIBRATION',
      incidents: {
        'INC-SAVED-001': sampleIncident,
      },
    };

    const resetState = restoreSensorBaseline(stateWithAnomalies);

    expect(resetState.activeScenario).toBe('NORMAL');
    expect(resetState.sensorNodes['BIH-SIT-001'].sensors.vibration.value).toBe(0.05);
    expect(resetState.sensorNodes['BIH-SIT-001'].sensors.temperature.value).toBe(27.6);
    expect(resetState.incidents['INC-SAVED-001']).toBeDefined();
    expect(resetState.incidents['INC-SAVED-001'].operatorNotes).toContain('Do not wipe this record!');
  });

  it('clearApplicationState removes data from localStorage', () => {
    (globalThis as any).localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATION_STATE));
    expect((globalThis as any).localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearApplicationState();
    expect((globalThis as any).localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('Session 8 — Export Service', () => {
  const sampleIncident: Incident = {
    id: 'INC-2026-001',
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z',
    villageId: 'VILLAGE-B',
    villageName: 'Simulated Village B',
    district: 'Sitamarhi',
    nodeId: 'BIH-SIT-001',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    riskScore: 85,
    priorityScore: 92,
    priorityExplanation: 'Thermal excursion exceeding maximum safe levels',
    recommendedResponse: 'Deploy autonomous reconnaissance UAV',
    triggerSensor: 'temperature',
    triggerValue: '42.1°C',
    configuredThreshold: '40.0°C',
    triggerReason: 'Severe thermal excursion (42.1°C > 40.0°C)',
    contributingConditions: ['High ambient heat', 'Elevated humidity'],
    operatorNotes: ['Notes with "double quotes", and commas, plus\nnewlines'],
    dispatchEligible: true,
    assignedDroneId: null,
    assignedMissionId: null,
    verificationOutcome: null,
  };

  const sampleMission: DroneMission = {
    id: 'MSN-2026-001',
    droneId: 'DRONE-01',
    incidentId: 'INC-2026-001',
    targetVillageId: 'VILLAGE-B',
    targetNodeId: 'BIH-SIT-001',
    status: 'AERIAL_VERIFICATION',
    progressPercent: 65,
    priority: 'HIGH',
    startTime: '2026-10-22T10:05:00Z',
    estimatedArrivalTime: '2026-10-22T10:15:00Z',
    targetCoordinates: { lat: 26.5937, lng: 85.4894 },
    routeCoordinates: [{ lat: 26.1542, lng: 85.8918 }, { lat: 26.5937, lng: 85.4894 }],
    distanceTotalKm: 12.5,
    distanceRemainingKm: 4.2,
    actualArrivalTime: null,
    completionTime: null,
    verificationOutcome: 'HAZARD_CONFIRMED',
    operatorNotes: 'Target visual contact established, thermal signature verified',
  };

  const sampleReport: DroneMissionReport = {
    missionId: 'MSN-2026-001',
    incidentId: 'INC-2026-001',
    targetVillage: 'Simulated Village B',
    assignedDrone: 'AeroScout-Alpha (DRONE-01)',
    dispatchTime: '2026-10-22T10:05:00Z',
    simulatedArrivalTime: '2026-10-22T10:15:00Z',
    verificationResult: 'HAZARD_CONFIRMED',
    missionDuration: '14.2 minutes',
    finalStatus: 'MISSION_COMPLETE',
    operatorNotes: 'Automated optical detection verified thermal plume at coordinates.',
  };

  it('formats printable mission report with all 10 required fields', () => {
    const text = formatPrintableMissionReport(sampleReport);
    expect(text).toContain('UAV AERIAL RECONNAISSANCE MISSION REPORT');
    expect(text).toContain('MSN-2026-001');
    expect(text).toContain('INC-2026-001');
    expect(text).toContain('Simulated Village B');
    expect(text).toContain('AeroScout-Alpha (DRONE-01)');
    expect(text).toContain('2026-10-22T10:05:00Z');
    expect(text).toContain('2026-10-22T10:15:00Z');
    expect(text).toContain('HAZARD_CONFIRMED');
    expect(text).toContain('14.2 minutes');
    expect(text).toContain('MISSION_COMPLETE');
    expect(text).toContain('Automated optical detection verified thermal plume at coordinates.');
  });

  it('exports Incidents and Missions without errors using browser DOM mocks', () => {
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    (globalThis as any).document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };
    (globalThis as any).URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };

    expect(() => exportIncidentsToCSV([sampleIncident])).not.toThrow();
    expect(mockAnchor.click).toHaveBeenCalled();

    expect(() => exportIncidentsToJSON([sampleIncident])).not.toThrow();
    expect(() => exportMissionsToCSV([sampleMission])).not.toThrow();
    expect(() => exportMissionsToJSON([sampleMission])).not.toThrow();
  });
});
