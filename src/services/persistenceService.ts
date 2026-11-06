import type { ApplicationState, SensorNode, Village, Drone, Incident, DroneMission, EventLogEntry, ThresholdConfig } from '../types';
import { INITIAL_APPLICATION_STATE, DEFAULT_THRESHOLDS, INITIAL_VILLAGES, INITIAL_SENSOR_NODES, INITIAL_DRONES } from '../constants/initialState';

export const STORAGE_KEY = 'BIHAR_DRONE_RESCUE_STATE_V1';

/**
 * Validates and migrates an unknown parsed object into a guaranteed valid ApplicationState.
 * Prevents runtime crashes from malformed, missing, or outdated schema versions stored in localStorage.
 */
export const validateAndMigrateState = (raw: unknown): ApplicationState => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...INITIAL_APPLICATION_STATE, lastTickTimestamp: new Date().toISOString() };
  }

  const data = raw as Partial<ApplicationState> & Record<string, any>;

  // 1. Thresholds validation
  const thresholds: ThresholdConfig = {
    temperature: {
      warningMin: typeof data.thresholds?.temperature?.warningMin === 'number' ? data.thresholds.temperature.warningMin : DEFAULT_THRESHOLDS.temperature.warningMin,
      warningMax: typeof data.thresholds?.temperature?.warningMax === 'number' ? data.thresholds.temperature.warningMax : DEFAULT_THRESHOLDS.temperature.warningMax,
      criticalMax: typeof data.thresholds?.temperature?.criticalMax === 'number' ? data.thresholds.temperature.criticalMax : DEFAULT_THRESHOLDS.temperature.criticalMax,
    },
    humidity: {
      warningMin: typeof data.thresholds?.humidity?.warningMin === 'number' ? data.thresholds.humidity.warningMin : DEFAULT_THRESHOLDS.humidity.warningMin,
      warningMax: typeof data.thresholds?.humidity?.warningMax === 'number' ? data.thresholds.humidity.warningMax : DEFAULT_THRESHOLDS.humidity.warningMax,
      criticalMax: typeof data.thresholds?.humidity?.criticalMax === 'number' ? data.thresholds.humidity.criticalMax : DEFAULT_THRESHOLDS.humidity.criticalMax,
    },
    lidar: {
      warningDistance: typeof data.thresholds?.lidar?.warningDistance === 'number' ? data.thresholds.lidar.warningDistance : DEFAULT_THRESHOLDS.lidar.warningDistance,
      criticalDistance: typeof data.thresholds?.lidar?.criticalDistance === 'number' ? data.thresholds.lidar.criticalDistance : DEFAULT_THRESHOLDS.lidar.criticalDistance,
    },
    vibration: {
      warningG: typeof data.thresholds?.vibration?.warningG === 'number' ? data.thresholds.vibration.warningG : DEFAULT_THRESHOLDS.vibration.warningG,
      criticalG: typeof data.thresholds?.vibration?.criticalG === 'number' ? data.thresholds.vibration.criticalG : DEFAULT_THRESHOLDS.vibration.criticalG,
    },
    riskScoring: {
      weights: {
        temperature: typeof data.thresholds?.riskScoring?.weights?.temperature === 'number' ? data.thresholds.riskScoring.weights.temperature : DEFAULT_THRESHOLDS.riskScoring.weights.temperature,
        humidity: typeof data.thresholds?.riskScoring?.weights?.humidity === 'number' ? data.thresholds.riskScoring.weights.humidity : DEFAULT_THRESHOLDS.riskScoring.weights.humidity,
        motion: typeof data.thresholds?.riskScoring?.weights?.motion === 'number' ? data.thresholds.riskScoring.weights.motion : DEFAULT_THRESHOLDS.riskScoring.weights.motion,
        lidar: typeof data.thresholds?.riskScoring?.weights?.lidar === 'number' ? data.thresholds.riskScoring.weights.lidar : DEFAULT_THRESHOLDS.riskScoring.weights.lidar,
        vibration: typeof data.thresholds?.riskScoring?.weights?.vibration === 'number' ? data.thresholds.riskScoring.weights.vibration : DEFAULT_THRESHOLDS.riskScoring.weights.vibration,
        multiAnomalyMultiplier: typeof data.thresholds?.riskScoring?.weights?.multiAnomalyMultiplier === 'number' ? data.thresholds.riskScoring.weights.multiAnomalyMultiplier : DEFAULT_THRESHOLDS.riskScoring.weights.multiAnomalyMultiplier,
      },
      categoryCutoffs: {
        normalMax: typeof data.thresholds?.riskScoring?.categoryCutoffs?.normalMax === 'number' ? data.thresholds.riskScoring.categoryCutoffs.normalMax : DEFAULT_THRESHOLDS.riskScoring.categoryCutoffs.normalMax,
        warningMax: typeof data.thresholds?.riskScoring?.categoryCutoffs?.warningMax === 'number' ? data.thresholds.riskScoring.categoryCutoffs.warningMax : DEFAULT_THRESHOLDS.riskScoring.categoryCutoffs.warningMax,
        highRiskMax: typeof data.thresholds?.riskScoring?.categoryCutoffs?.highRiskMax === 'number' ? data.thresholds.riskScoring.categoryCutoffs.highRiskMax : DEFAULT_THRESHOLDS.riskScoring.categoryCutoffs.highRiskMax,
        criticalMax: typeof data.thresholds?.riskScoring?.categoryCutoffs?.criticalMax === 'number' ? data.thresholds.riskScoring.categoryCutoffs.criticalMax : DEFAULT_THRESHOLDS.riskScoring.categoryCutoffs.criticalMax,
      },
      droneDispatchThreshold: typeof data.thresholds?.riskScoring?.droneDispatchThreshold === 'number' ? data.thresholds.riskScoring.droneDispatchThreshold : DEFAULT_THRESHOLDS.riskScoring.droneDispatchThreshold,
    },
    simulationIntervalMs: typeof data.thresholds?.simulationIntervalMs === 'number' && data.thresholds.simulationIntervalMs >= 500 ? data.thresholds.simulationIntervalMs : DEFAULT_THRESHOLDS.simulationIntervalMs,
    speedMultiplier: typeof data.thresholds?.speedMultiplier === 'number' ? data.thresholds.speedMultiplier : DEFAULT_THRESHOLDS.speedMultiplier,
  };

  // 2. Villages validation
  const villages: Record<string, Village> = {};
  Object.keys(INITIAL_VILLAGES).forEach((vId) => {
    const initV = (INITIAL_VILLAGES as Record<string, Village>)[vId];
    const savedV = data.villages && typeof data.villages === 'object' ? (data.villages as Record<string, any>)[vId] : null;
    if (savedV && typeof savedV === 'object') {
      villages[vId] = {
        ...initV,
        ...savedV,
        currentRiskScore: typeof savedV.currentRiskScore === 'number' && !isNaN(savedV.currentRiskScore) ? savedV.currentRiskScore : initV.currentRiskScore,
        status: savedV.status === 'ONLINE' || savedV.status === 'OFFLINE' || savedV.status === 'DEGRADED' || savedV.status === 'WARNING' || savedV.status === 'CRITICAL' ? savedV.status : initV.status,
      };
    } else {
      villages[vId] = { ...initV };
    }
  });

  // 3. Sensor Nodes validation
  const sensorNodes: Record<string, SensorNode> = {};
  Object.keys(INITIAL_SENSOR_NODES).forEach((nId) => {
    const initN = INITIAL_SENSOR_NODES[nId];
    const savedN = data.sensorNodes && typeof data.sensorNodes === 'object' ? data.sensorNodes[nId] : null;
    if (savedN && typeof savedN === 'object') {
      const savedSensors = savedN.sensors && typeof savedN.sensors === 'object' ? savedN.sensors : null;

      const tempVal = savedSensors?.temperature && typeof savedSensors.temperature.value === 'number' && !isNaN(savedSensors.temperature.value)
        ? savedSensors.temperature.value
        : initN.sensors.temperature.value;

      const humVal = savedSensors?.humidity && typeof savedSensors.humidity.value === 'number' && !isNaN(savedSensors.humidity.value)
        ? savedSensors.humidity.value
        : initN.sensors.humidity.value;

      const vibVal = savedSensors?.vibration && typeof savedSensors.vibration.value === 'number' && !isNaN(savedSensors.vibration.value)
        ? savedSensors.vibration.value
        : initN.sensors.vibration.value;

      const lidarVal = savedSensors?.lidar && typeof savedSensors.lidar.value === 'number' && !isNaN(savedSensors.lidar.value)
        ? savedSensors.lidar.value
        : initN.sensors.lidar.value;

      const motionDetected = savedSensors?.motion && typeof savedSensors.motion.detected === 'boolean'
        ? savedSensors.motion.detected
        : initN.sensors.motion.detected;

      sensorNodes[nId] = {
        ...initN,
        ...savedN,
        status: savedN.status === 'ONLINE' || savedN.status === 'OFFLINE' || savedN.status === 'WARNING' || savedN.status === 'CRITICAL' ? savedN.status : initN.status,
        riskScore: typeof savedN.riskScore === 'number' && !isNaN(savedN.riskScore) ? savedN.riskScore : initN.riskScore,
        riskLevel: savedN.riskLevel || initN.riskLevel,
        signalQuality: typeof savedN.signalQuality === 'number' && !isNaN(savedN.signalQuality) ? savedN.signalQuality : (initN.signalQuality ?? 95),
        latencyMs: typeof savedN.latencyMs === 'number' && !isNaN(savedN.latencyMs) ? savedN.latencyMs : (initN.latencyMs ?? 45),
        isStale: typeof savedN.isStale === 'boolean' ? savedN.isStale : (initN.isStale ?? false),
        sensors: {
          temperature: {
            ...initN.sensors.temperature,
            ...(savedSensors?.temperature || {}),
            value: tempVal,
          },
          humidity: {
            ...initN.sensors.humidity,
            ...(savedSensors?.humidity || {}),
            value: humVal,
          },
          vibration: {
            ...initN.sensors.vibration,
            ...(savedSensors?.vibration || {}),
            value: vibVal,
          },
          lidar: {
            ...initN.sensors.lidar,
            ...(savedSensors?.lidar || {}),
            value: lidarVal,
          },
          motion: {
            ...initN.sensors.motion,
            ...(savedSensors?.motion || {}),
            detected: motionDetected,
          },
        },
        history: Array.isArray(savedN.history) && savedN.history.length > 0 ? savedN.history : initN.history,
      };
    } else {
      sensorNodes[nId] = { ...initN };
    }
  });

  // 4. Drones validation
  const drones: Record<string, Drone> = {};
  Object.keys(INITIAL_DRONES).forEach((dId) => {
    const initD = INITIAL_DRONES[dId];
    const savedD = data.drones && typeof data.drones === 'object' ? data.drones[dId] : null;
    if (savedD && typeof savedD === 'object') {
      drones[dId] = {
        ...initD,
        ...savedD,
        batteryPercentage: typeof savedD.batteryPercentage === 'number' && !isNaN(savedD.batteryPercentage) ? Math.min(100, Math.max(0, savedD.batteryPercentage)) : initD.batteryPercentage,
        speedKmh: typeof savedD.speedKmh === 'number' && !isNaN(savedD.speedKmh) ? savedD.speedKmh : initD.speedKmh,
        missionHistory: Array.isArray(savedD.missionHistory) ? savedD.missionHistory : [],
      };
    } else {
      drones[dId] = { ...initD };
    }
  });

  // 5. Incidents validation
  const incidents: Record<string, Incident> = {};
  const rawIncidents = data.incidents;
  if (rawIncidents && typeof rawIncidents === 'object' && !Array.isArray(rawIncidents)) {
    const incMap = rawIncidents as Record<string, any>;
    Object.keys(incMap).forEach((iId) => {
      const inc = incMap[iId];
      if (inc && typeof inc === 'object' && inc.id && inc.villageName) {
        incidents[iId] = {
          ...inc,
          operatorNotes: Array.isArray(inc.operatorNotes) ? inc.operatorNotes : [],
          contributingConditions: Array.isArray(inc.contributingConditions) ? inc.contributingConditions : [],
          riskScore: typeof inc.riskScore === 'number' && !isNaN(inc.riskScore) ? inc.riskScore : 0,
          priorityScore: typeof inc.priorityScore === 'number' && !isNaN(inc.priorityScore) ? inc.priorityScore : 0,
        };
      }
    });
  }

  // 6. Drone Missions validation
  const missions: Record<string, DroneMission> = {};
  const rawMissions = data.missions;
  if (rawMissions && typeof rawMissions === 'object' && !Array.isArray(rawMissions)) {
    const misMap = rawMissions as Record<string, any>;
    Object.keys(misMap).forEach((mId) => {
      const m = misMap[mId];
      if (m && typeof m === 'object' && m.id && m.droneId) {
        missions[mId] = {
          ...m,
          progressPercent: typeof m.progressPercent === 'number' && !isNaN(m.progressPercent) ? Math.min(100, Math.max(0, m.progressPercent)) : 0,
          distanceTotalKm: typeof m.distanceTotalKm === 'number' && !isNaN(m.distanceTotalKm) ? m.distanceTotalKm : 10,
          distanceRemainingKm: typeof m.distanceRemainingKm === 'number' && !isNaN(m.distanceRemainingKm) ? m.distanceRemainingKm : 0,
        };
      }
    });
  }

  // 7. Event Logs validation (cap at 200 recent entries)
  let eventLogs: EventLogEntry[] = INITIAL_APPLICATION_STATE.eventLogs;
  if (Array.isArray(data.eventLogs)) {
    const validLogs = data.eventLogs.filter((l) => l && typeof l === 'object' && l.id && l.title);
    if (validLogs.length > 0) {
      eventLogs = validLogs.slice(0, 200);
    }
  }

  return {
    ...INITIAL_APPLICATION_STATE,
    ...data,
    simulationRunning: false, // For safety, always pause simulation on fresh boot / refresh
    simulationSpeed: typeof data.simulationSpeed === 'number' && data.simulationSpeed > 0 ? data.simulationSpeed : 1.0,
    activeScenario: typeof data.activeScenario === 'string' ? data.activeScenario : 'NORMAL',
    lastTickTimestamp: new Date().toISOString(),
    activeSection: typeof data.activeSection === 'string' ? data.activeSection : 'overview',
    thresholds,
    villages: villages as any,
    sensorNodes,
    drones,
    incidents,
    missions,
    eventLogs,
    selectedVillageId: data.selectedVillageId || null,
    selectedNodeId: data.selectedNodeId || null,
    selectedIncidentId: data.selectedIncidentId || null,
    selectedDroneId: data.selectedDroneId || null,
  };
};

/**
 * Safely loads state from localStorage with validation and fallback.
 */
export const loadApplicationState = (): ApplicationState => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return validateAndMigrateState(parsed);
      }
    }
  } catch (error) {
    console.warn('DEIN Persistence: Failed to load state from localStorage, falling back to clean initial state', error);
  }
  return { ...INITIAL_APPLICATION_STATE, lastTickTimestamp: new Date().toISOString() };
};

/**
 * Safely persists state to localStorage.
 * Truncates eventLogs to 200 items to avoid localStorage 5MB quota errors.
 */
export const saveApplicationState = (state: ApplicationState): boolean => {
  try {
    if (typeof localStorage !== 'undefined') {
      const payload = {
        ...state,
        eventLogs: state.eventLogs ? state.eventLogs.slice(0, 200) : [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    }
    return false;
  } catch (error) {
    console.error('DEIN Persistence: Failed to save application state to localStorage', error);
    return false;
  }
};

/**
 * Removes the persisted state from localStorage.
 */
export const clearApplicationState = (): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('DEIN Persistence: Failed to clear localStorage', error);
  }
};

/**
 * Non-destructive reset:
 * Restores sensor nodes and villages to normal baseline values (27-28°C, normal humidity, low vibration)
 * without deleting historical incidents, active missions, or audit event logs.
 */
export const restoreSensorBaseline = (currentState: ApplicationState): ApplicationState => {
  const timestamp = new Date().toISOString();
  const resetNodes: Record<string, SensorNode> = {};

  Object.keys(INITIAL_SENSOR_NODES).forEach((id) => {
    const initial = INITIAL_SENSOR_NODES[id];
    resetNodes[id] = {
      ...initial,
      lastUpdated: timestamp,
      status: 'ONLINE',
      isStale: false,
      signalQuality: 95,
      latencyMs: 40,
      riskScore: 12,
      riskLevel: 'NORMAL',
      contributingFactors: ['All parameters within normal baseline limits'],
      sensors: {
        temperature: { ...initial.sensors.temperature, value: initial.sensors.temperature.value, status: 'NORMAL', lastChanged: timestamp },
        humidity: { ...initial.sensors.humidity, value: initial.sensors.humidity.value, status: 'NORMAL', lastChanged: timestamp },
        motion: { ...initial.sensors.motion, detected: false, status: 'NORMAL', lastChanged: timestamp },
        lidar: { ...initial.sensors.lidar, value: initial.sensors.lidar.value, status: 'NORMAL', lastChanged: timestamp },
        vibration: { ...initial.sensors.vibration, value: initial.sensors.vibration.value, status: 'NORMAL', lastChanged: timestamp },
      },
    };
  });

  const resetVillages: Record<string, Village> = {};
  Object.keys(INITIAL_VILLAGES).forEach((id) => {
    const initial = INITIAL_VILLAGES[id];
    resetVillages[id] = {
      ...initial,
      currentRiskScore: 12,
      status: 'ONLINE',
      lastUpdated: timestamp,
    };
  });

  const log: EventLogEntry = {
    id: `LOG-RESET-${Date.now()}`,
    timestamp,
    category: 'SYSTEM',
    severity: 'INFO',
    title: 'Sensor Baseline Restored',
    description: 'Environmental telemetry returned to normal baseline conditions. Incident and sortie audit records preserved.',
  };

  return {
    ...currentState,
    activeScenario: 'NORMAL',
    lastTickTimestamp: timestamp,
    sensorNodes: resetNodes,
    villages: resetVillages as any,
    eventLogs: [log, ...currentState.eventLogs],
  };
};
