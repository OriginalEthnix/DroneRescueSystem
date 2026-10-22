import type { ApplicationState, Village, SensorNode, Drone, ThresholdConfig, EventLogEntry } from '../types';


export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  temperature: {
    warningMin: 35.0,
    warningMax: 40.0,
    criticalMax: 40.0,
  },
  humidity: {
    warningMin: 80.0,
    warningMax: 90.0,
    criticalMax: 90.0,
  },
  lidar: {
    warningDistance: 3.0,
    criticalDistance: 1.5,
  },
  vibration: {
    warningG: 0.15,
    criticalG: 0.30,
  },
  riskScoring: {
    weights: {
      temperature: 15,
      humidity: 10,
      motion: 10,
      lidar: 35,
      vibration: 30,
      multiAnomalyMultiplier: 1.25,
    },
    categoryCutoffs: {
      normalMax: 29,
      warningMax: 59,
      highRiskMax: 79,
      criticalMax: 100,
    },
    droneDispatchThreshold: 60,
  },
  simulationIntervalMs: 2500,
  speedMultiplier: 1.0,
};

export const INITIAL_VILLAGES: Record<string, Village> = {
  'VILLAGE-A': {
    id: 'VILLAGE-A',
    name: 'Simulated Village A',
    district: 'Darbhanga',
    region: 'North Bihar',
    primaryConcern: 'Flood-related environmental changes & water inundation',
    coordinates: { lat: 26.1542, lng: 85.8918 },
    nodeIds: ['BIH-DAR-001', 'BIH-DAR-002'],
    currentRiskScore: 12,
    status: 'ONLINE',
    lastUpdated: new Date().toISOString(),
  },
  'VILLAGE-B': {
    id: 'VILLAGE-B',
    name: 'Simulated Village B',
    district: 'Sitamarhi',
    region: 'North Bihar',
    primaryConcern: 'Flooding, unusual environmental conditions, and infrastructure safety',
    coordinates: { lat: 26.5937, lng: 85.4894 },
    nodeIds: ['BIH-SIT-001', 'BIH-SIT-002'],
    currentRiskScore: 16,
    status: 'ONLINE',
    lastUpdated: new Date().toISOString(),
  },
  'VILLAGE-C': {
    id: 'VILLAGE-C',
    name: 'Simulated Village C',
    district: 'Madhubani',
    region: 'North Bihar',
    primaryConcern: 'Environmental anomalies and local infrastructure safety',
    coordinates: { lat: 26.3544, lng: 86.0717 },
    nodeIds: ['BIH-MAD-001', 'BIH-MAD-002'],
    currentRiskScore: 14,
    status: 'ONLINE',
    lastUpdated: new Date().toISOString(),
  },
};

const now = new Date().toISOString();

// Sensor history generation helper (initial normal baseline 27-28°C)
const createNormalHistory = (baseTemp: number, baseHum: number, baseDist: number) => {
  const points = [];
  const time = Date.now();
  for (let i = 10; i >= 0; i--) {
    points.push({
      timestamp: new Date(time - i * 15000).toISOString(),
      temperature: Number((baseTemp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      humidity: Math.round(baseHum + (Math.random() * 2 - 1)),
      vibration: Number((0.03 + Math.random() * 0.02).toFixed(2)),
      lidarDistance: Number((baseDist + (Math.random() * 0.1 - 0.05)).toFixed(2)),
      motionDetected: false,
      riskScore: 12,
    });
  }
  return points;
};

export const INITIAL_SENSOR_NODES: Record<string, SensorNode> = {
  'BIH-DAR-001': {
    nodeId: 'BIH-DAR-001',
    villageId: 'VILLAGE-A',
    district: 'Darbhanga',
    coordinates: { lat: 26.1555, lng: 85.8935 },
    status: 'ONLINE',
    lastUpdated: now,
    sensors: {
      temperature: { value: 27.4, unit: '°C', status: 'NORMAL', lastChanged: now },
      humidity: { value: 62, unit: '%', status: 'NORMAL', lastChanged: now },
      motion: { detected: false, lastDetectionTime: null, detectionCount: 0, status: 'NORMAL', lastChanged: now },
      lidar: { value: 4.8, unit: 'm', status: 'NORMAL', lastChanged: now },
      vibration: { value: 0.04, unit: 'g', status: 'NORMAL', lastChanged: now },
    },
    riskScore: 12,
    riskLevel: 'NORMAL',
    contributingFactors: ['All parameters within normal baseline limits'],
    signalQuality: 98,
    latencyMs: 42,
    batteryLevel: 94,
    history: createNormalHistory(27.4, 62, 4.8),
  },
  'BIH-DAR-002': {
    nodeId: 'BIH-DAR-002',
    villageId: 'VILLAGE-A',
    district: 'Darbhanga',
    coordinates: { lat: 26.1518, lng: 85.8892 },
    status: 'ONLINE',
    lastUpdated: now,
    sensors: {
      temperature: { value: 27.8, unit: '°C', status: 'NORMAL', lastChanged: now },
      humidity: { value: 65, unit: '%', status: 'NORMAL', lastChanged: now },
      motion: { detected: false, lastDetectionTime: null, detectionCount: 0, status: 'NORMAL', lastChanged: now },
      lidar: { value: 5.1, unit: 'm', status: 'NORMAL', lastChanged: now },
      vibration: { value: 0.03, unit: 'g', status: 'NORMAL', lastChanged: now },
    },
    riskScore: 11,
    riskLevel: 'NORMAL',
    contributingFactors: ['All parameters within normal baseline limits'],
    signalQuality: 95,
    latencyMs: 48,
    batteryLevel: 91,
    history: createNormalHistory(27.8, 65, 5.1),
  },
  'BIH-SIT-001': {
    nodeId: 'BIH-SIT-001',
    villageId: 'VILLAGE-B',
    district: 'Sitamarhi',
    coordinates: { lat: 26.5952, lng: 85.4912 },
    status: 'ONLINE',
    lastUpdated: now,
    sensors: {
      temperature: { value: 27.6, unit: '°C', status: 'NORMAL', lastChanged: now },
      humidity: { value: 64, unit: '%', status: 'NORMAL', lastChanged: now },
      motion: { detected: false, lastDetectionTime: null, detectionCount: 0, status: 'NORMAL', lastChanged: now },
      lidar: { value: 4.6, unit: 'm', status: 'NORMAL', lastChanged: now },
      vibration: { value: 0.05, unit: 'g', status: 'NORMAL', lastChanged: now },
    },
    riskScore: 14,
    riskLevel: 'NORMAL',
    contributingFactors: ['All parameters within normal baseline limits'],
    signalQuality: 92,
    latencyMs: 55,
    batteryLevel: 88,
    history: createNormalHistory(27.6, 64, 4.6),
  },
  'BIH-SIT-002': {
    nodeId: 'BIH-SIT-002',
    villageId: 'VILLAGE-B',
    district: 'Sitamarhi',
    coordinates: { lat: 26.5915, lng: 85.4868 },
    status: 'ONLINE',
    lastUpdated: now,
    sensors: {
      temperature: { value: 27.2, unit: '°C', status: 'NORMAL', lastChanged: now },
      humidity: { value: 59, unit: '%', status: 'NORMAL', lastChanged: now },
      motion: { detected: false, lastDetectionTime: null, detectionCount: 0, status: 'NORMAL', lastChanged: now },
      lidar: { value: 4.9, unit: 'm', status: 'NORMAL', lastChanged: now },
      vibration: { value: 0.04, unit: 'g', status: 'NORMAL', lastChanged: now },
    },
    riskScore: 12,
    riskLevel: 'NORMAL',
    contributingFactors: ['All parameters within normal baseline limits'],
    signalQuality: 89,
    latencyMs: 60,
    batteryLevel: 86,
    history: createNormalHistory(27.2, 59, 4.9),
  },
  'BIH-MAD-001': {
    nodeId: 'BIH-MAD-001',
    villageId: 'VILLAGE-C',
    district: 'Madhubani',
    coordinates: { lat: 26.3562, lng: 86.0741 },
    status: 'ONLINE',
    lastUpdated: now,
    sensors: {
      temperature: { value: 27.5, unit: '°C', status: 'NORMAL', lastChanged: now },
      humidity: { value: 66, unit: '%', status: 'NORMAL', lastChanged: now },
      motion: { detected: false, lastDetectionTime: null, detectionCount: 0, status: 'NORMAL', lastChanged: now },
      lidar: { value: 5.4, unit: 'm', status: 'NORMAL', lastChanged: now },
      vibration: { value: 0.03, unit: 'g', status: 'NORMAL', lastChanged: now },
    },
    riskScore: 13,
    riskLevel: 'NORMAL',
    contributingFactors: ['All parameters within normal baseline limits'],
    signalQuality: 96,
    latencyMs: 44,
    batteryLevel: 93,
    history: createNormalHistory(27.5, 66, 5.4),
  },
  'BIH-MAD-002': {
    nodeId: 'BIH-MAD-002',
    villageId: 'VILLAGE-C',
    district: 'Madhubani',
    coordinates: { lat: 26.3521, lng: 86.0685 },
    status: 'ONLINE',
    lastUpdated: now,
    sensors: {
      temperature: { value: 27.9, unit: '°C', status: 'NORMAL', lastChanged: now },
      humidity: { value: 63, unit: '%', status: 'NORMAL', lastChanged: now },
      motion: { detected: false, lastDetectionTime: null, detectionCount: 0, status: 'NORMAL', lastChanged: now },
      lidar: { value: 4.7, unit: 'm', status: 'NORMAL', lastChanged: now },
      vibration: { value: 0.04, unit: 'g', status: 'NORMAL', lastChanged: now },
    },
    riskScore: 13,
    riskLevel: 'NORMAL',
    contributingFactors: ['All parameters within normal baseline limits'],
    signalQuality: 94,
    latencyMs: 46,
    batteryLevel: 90,
    history: createNormalHistory(27.9, 63, 4.7),
  },
};

// Regional Drone Operations Base near Darbhanga Airport / Command HQ
export const DRONE_BASE_COORDINATES = { lat: 26.1950, lng: 85.9140 };

export const INITIAL_DRONES: Record<string, Drone> = {
  'DRONE-01': {
    id: 'DRONE-01',
    callsign: 'AeroScout-Alpha',
    baseCoordinates: DRONE_BASE_COORDINATES,
    currentCoordinates: DRONE_BASE_COORDINATES,
    status: 'AVAILABLE',
    batteryPercentage: 94,
    currentMissionId: null,
    speedKmh: 65,
    totalMissionsCompleted: 3,
  },
  'DRONE-02': {
    id: 'DRONE-02',
    callsign: 'AeroScout-Bravo',
    baseCoordinates: DRONE_BASE_COORDINATES,
    currentCoordinates: DRONE_BASE_COORDINATES,
    status: 'AVAILABLE',
    batteryPercentage: 87,
    currentMissionId: null,
    speedKmh: 70,
    totalMissionsCompleted: 5,
  },
};

export const INITIAL_EVENT_LOGS: EventLogEntry[] = [
  {
    id: 'LOG-INIT-001',
    timestamp: now,
    category: 'SYSTEM',
    severity: 'INFO',
    title: 'Distributed Network Online',
    description: 'Central Environmental Intelligence Monitoring initialized across 3 North Bihar sectors with 6 telemetry nodes.',
  },
  {
    id: 'LOG-INIT-002',
    timestamp: now,
    category: 'DRONE',
    severity: 'INFO',
    title: 'Autonomous Drone Fleet Ready',
    description: 'DRONE-01 and DRONE-02 stationed at Darbhanga Regional Base in AVAILABLE standby mode.',
  },
];

export const INITIAL_APPLICATION_STATE: ApplicationState = {
  simulationRunning: false,
  simulationSpeed: 1.0,
  activeScenario: 'NORMAL',
  lastTickTimestamp: now,
  activeSection: 'overview',
  villages: INITIAL_VILLAGES as Record<any, Village>,
  sensorNodes: INITIAL_SENSOR_NODES,
  drones: INITIAL_DRONES,
  missions: {},
  incidents: {},
  thresholds: DEFAULT_THRESHOLDS,
  eventLogs: INITIAL_EVENT_LOGS,
  selectedVillageId: null,
  selectedNodeId: null,
  selectedIncidentId: null,
  selectedDroneId: null,
};
