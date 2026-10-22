// Centralized TypeScript Type Definitions for Distributed Environmental Intelligence Network

export type VillageId = 'VILLAGE-A' | 'VILLAGE-B' | 'VILLAGE-C';

export type DistrictName = 'Darbhanga' | 'Sitamarhi' | 'Madhubani';

export type NodeOperationalStatus = 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export type RiskLevel = 'NORMAL' | 'WARNING' | 'HIGH RISK' | 'CRITICAL';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type IncidentStatus = 
  | 'ACTIVE' 
  | 'ACKNOWLEDGED' 
  | 'DRONE_REQUESTED' 
  | 'DRONE_EN_ROUTE' 
  | 'UNDER_INVESTIGATION' 
  | 'RESOLVED';

export type DroneStatus = 
  | 'AVAILABLE' 
  | 'MISSION_ASSIGNED' 
  | 'PRE_FLIGHT_CHECK' 
  | 'TAKEOFF' 
  | 'EN_ROUTE' 
  | 'APPROACHING_TARGET' 
  | 'ARRIVED' 
  | 'AERIAL_VERIFICATION' 
  | 'MISSION_COMPLETE' 
  | 'RETURNING_TO_BASE';

export type VerificationOutcome = 
  | 'HAZARD_CONFIRMED' 
  | 'HAZARD_NOT_CONFIRMED' 
  | 'FURTHER_INVESTIGATION_REQUIRED';

export type SimulationScenarioId = 
  | 'NORMAL' 
  | 'TEMP_ANOMALY' 
  | 'HIGH_HUMIDITY' 
  | 'STRUCTURAL_VIBRATION' 
  | 'PROXIMITY_HAZARD' 
  | 'COMBINED_ANOMALY' 
  | 'MULTI_VILLAGE' 
  | 'NODE_OFFLINE' 
  | 'CUSTOM';

// 1. Geographic and Village Model
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Village {
  id: VillageId;
  name: string; // e.g., "Simulated Village A"
  district: DistrictName;
  region: 'North Bihar';
  primaryConcern: string;
  coordinates: Coordinates;
  nodeIds: string[];
  currentRiskScore: number;
  status: NodeOperationalStatus;
  lastUpdated: string;
}

// 2. Sensor Readings and History
export interface SensorReading<T> {
  value: T;
  unit?: string;
  status: SensorStatus;
  lastChanged: string;
}

export interface MotionSensorReading {
  detected: boolean;
  lastDetectionTime: string | null;
  detectionCount: number;
  status: SensorStatus;
  lastChanged: string;
}

export interface NodeSensors {
  temperature: SensorReading<number>; // normal 27.0 - 28.0 °C
  humidity: SensorReading<number>;    // normal 45% - 70%
  motion: MotionSensorReading;        // PIR simulation
  lidar: SensorReading<number>;       // distance in meters
  vibration: SensorReading<number>;   // magnitude in g
}

export interface HistoricalDataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  vibration: number;
  lidarDistance: number;
  motionDetected: boolean;
  riskScore: number;
}

// 3. Sensor Node Model
export interface SensorNode {
  nodeId: string; // e.g. "BIH-DAR-001"
  villageId: VillageId;
  district: DistrictName;
  coordinates: Coordinates;
  status: NodeOperationalStatus;
  lastUpdated: string;
  sensors: NodeSensors;
  riskScore: number;
  riskLevel: RiskLevel;
  contributingFactors: string[];
  signalQuality: number; // percentage (0 - 100)
  latencyMs: number;
  batteryLevel: number; // percentage (0 - 100)
  history: HistoricalDataPoint[];
}

// 4. Threshold Configuration Model
export interface ThresholdConfig {
  temperature: {
    warningMin: number;
    warningMax: number;
    criticalMax: number;
  };
  humidity: {
    warningMin: number;
    warningMax: number;
    criticalMax: number;
  };
  lidar: {
    warningDistance: number; // <= 3.0m
    criticalDistance: number; // <= 1.5m
  };
  vibration: {
    warningG: number; // >= 0.15g
    criticalG: number; // >= 0.30g
  };
  riskScoring: {
    weights: {
      temperature: number;
      humidity: number;
      motion: number;
      lidar: number;
      vibration: number;
      multiAnomalyMultiplier: number;
    };
    categoryCutoffs: {
      normalMax: number;   // 29
      warningMax: number;  // 59
      highRiskMax: number; // 79
      criticalMax: number; // 100
    };
    droneDispatchThreshold: number; // default 60
  };
  simulationIntervalMs: number;
  speedMultiplier: number;
}

// 5. Incident Model
export interface Incident {
  id: string; // e.g. "INC-2026-001"
  createdAt: string;
  updatedAt: string;
  villageId: VillageId;
  villageName: string;
  district: DistrictName;
  nodeId: string;
  severity: AlertSeverity;
  triggerReason: string;
  triggerSensor: 'temperature' | 'humidity' | 'motion' | 'lidar' | 'vibration' | 'multi';
  triggerValue: string;
  configuredThreshold: string;
  riskScore: number;
  contributingConditions: string[];
  recommendedResponse: string;
  status: IncidentStatus;
  assignedDroneId: string | null;
  assignedMissionId: string | null;
  verificationOutcome: VerificationOutcome | null;
  operatorNotes: string[];
}

// 6. Drone Operations Model
export interface Drone {
  id: string; // e.g. "DRONE-01"
  callsign: string;
  baseCoordinates: Coordinates;
  currentCoordinates: Coordinates;
  status: DroneStatus;
  batteryPercentage: number;
  currentMissionId: string | null;
  speedKmh: number;
  totalMissionsCompleted: number;
}

export interface DroneMission {
  id: string; // e.g. "MSN-2026-001"
  droneId: string;
  incidentId: string;
  targetVillageId: VillageId;
  targetNodeId: string;
  targetCoordinates: Coordinates;
  routeCoordinates: Coordinates[]; // path from base to target
  status: DroneStatus;
  startTime: string;
  estimatedArrivalTime: string | null;
  actualArrivalTime: string | null;
  completionTime: string | null;
  distanceTotalKm: number;
  distanceRemainingKm: number;
  priority: 'HIGH' | 'CRITICAL';
  verificationOutcome: VerificationOutcome | null;
  operatorNotes: string;
}

// 7. Event Log Model
export interface EventLogEntry {
  id: string;
  timestamp: string;
  category: 'SENSOR' | 'THRESHOLD' | 'RISK' | 'ALERT' | 'DRONE' | 'SYSTEM' | 'OPERATOR';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  description: string;
  villageId?: VillageId;
  nodeId?: string;
  incidentId?: string;
  droneId?: string;
}

// 8. Navigation Destinations
export type NavigationSection = 
  | 'overview' 
  | 'monitoring' 
  | 'geographic' 
  | 'incidents' 
  | 'drones' 
  | 'analytics' 
  | 'configuration' 
  | 'event-log';

// 9. Global State Envelope
export interface ApplicationState {
  simulationRunning: boolean;
  simulationSpeed: number;
  activeScenario: SimulationScenarioId;
  lastTickTimestamp: string;
  activeSection: NavigationSection;
  villages: Record<VillageId, Village>;
  sensorNodes: Record<string, SensorNode>;
  drones: Record<string, Drone>;
  missions: Record<string, DroneMission>;
  incidents: Record<string, Incident>;
  thresholds: ThresholdConfig;
  eventLogs: EventLogEntry[];
  selectedVillageId: VillageId | null;
  selectedNodeId: string | null;
  selectedIncidentId: string | null;
  selectedDroneId: string | null;
}

