import type { 
  SensorNode, 
  ThresholdConfig, 
  SensorStatus, 
  SimulationScenarioId, 
  Village,
  HistoricalDataPoint
} from '../types';

export const MAX_HISTORY_POINTS = 25;

/**
 * Determine individual sensor status based on configured thresholds.
 */
export const evaluateSensorStatus = (
  type: 'temperature' | 'humidity' | 'lidar' | 'vibration',
  value: number,
  thresholds: ThresholdConfig
): SensorStatus => {
  switch (type) {
    case 'temperature':
      if (value > thresholds.temperature.criticalMax) return 'CRITICAL';
      if (value > thresholds.temperature.warningMin) return 'WARNING';
      return 'NORMAL';

    case 'humidity':
      if (value > thresholds.humidity.criticalMax) return 'CRITICAL';
      if (value > thresholds.humidity.warningMin) return 'WARNING';
      return 'NORMAL';

    case 'lidar':
      // Lower distance indicates closer proximity hazard
      if (value <= thresholds.lidar.criticalDistance) return 'CRITICAL';
      if (value <= thresholds.lidar.warningDistance) return 'WARNING';
      return 'NORMAL';

    case 'vibration':
      // Higher vibration indicates structural shake or earthquake/collapse
      if (value >= thresholds.vibration.criticalG) return 'CRITICAL';
      if (value >= thresholds.vibration.warningG) return 'WARNING';
      return 'NORMAL';

    default:
      return 'NORMAL';
  }
};

/**
 * Clamp a number to a fixed range.
 */
const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};

/**
 * Coherently fluctuates a normal sensor node.
 * Strictly preserves the 27°C–28°C normal constraint unless an anomaly is active.
 */
export const stepNormalNode = (
  node: SensorNode,
  thresholds: ThresholdConfig,
  timestamp: string
): SensorNode => {
  if (node.status === 'OFFLINE') {
    return {
      ...node,
      isStale: true,
      lastUpdated: timestamp,
    };
  }

  // 1. Temperature: Smooth bounded drift clamped strictly to 27.0°C - 28.0°C in normal conditions
  const currentTemp = node.sensors.temperature.value;
  const tempDelta = (Math.random() - 0.49) * 0.15; // smooth drift
  const nextTemp = Number(clamp(currentTemp + tempDelta, 27.0, 28.0).toFixed(1));
  const tempStatus = evaluateSensorStatus('temperature', nextTemp, thresholds);

  // 2. Humidity: Smooth bounded drift within 45% - 70% in normal conditions
  const currentHum = node.sensors.humidity.value;
  const humDelta = (Math.random() - 0.5) * 1.5;
  const nextHum = Math.round(clamp(currentHum + humDelta, 48, 68));
  const humStatus = evaluateSensorStatus('humidity', nextHum, thresholds);

  // 3. Motion: Occasional brief PIR event (5% probability)
  const hadMotion = node.sensors.motion.detected;
  const motionTriggered = Math.random() < 0.05;
  const nextMotionCount = motionTriggered ? node.sensors.motion.detectionCount + 1 : node.sensors.motion.detectionCount;
  const nextLastDetectionTime = motionTriggered ? timestamp : node.sensors.motion.lastDetectionTime;

  // 4. LiDAR Distance: Gradual subtle variation around baseline (~4.5m - 5.5m)
  const currentLidar = node.sensors.lidar.value;
  const lidarDelta = (Math.random() - 0.5) * 0.08;
  const nextLidar = Number(clamp(currentLidar + lidarDelta, 4.2, 5.8).toFixed(1));
  const lidarStatus = evaluateSensorStatus('lidar', nextLidar, thresholds);

  // 5. Vibration: Baseline micro-tremors (0.02g - 0.06g)
  const currentVib = node.sensors.vibration.value;
  const vibDelta = (Math.random() - 0.5) * 0.01;
  const nextVib = Number(clamp(currentVib + vibDelta, 0.02, 0.07).toFixed(2));
  const vibStatus = evaluateSensorStatus('vibration', nextVib, thresholds);

  // RF signal & latency small fluctuations
  const nextSignal = Math.round(clamp(node.signalQuality + (Math.random() * 2 - 1), 85, 100));
  const nextLatency = Math.round(clamp(node.latencyMs + (Math.random() * 4 - 2), 35, 75));
  // Very slow gradual battery discharge (0.01% every few steps)
  const nextBattery = Math.max(15, Number((node.batteryLevel - 0.005).toFixed(2)));

  // Bounded History Management
  const newHistoryPoint: HistoricalDataPoint = {
    timestamp,
    temperature: nextTemp,
    humidity: nextHum,
    vibration: nextVib,
    lidarDistance: nextLidar,
    motionDetected: motionTriggered,
    riskScore: node.riskScore,
  };

  const updatedHistory = [...node.history.slice(-(MAX_HISTORY_POINTS - 1)), newHistoryPoint];

  return {
    ...node,
    status: 'ONLINE',
    isStale: false,
    lastSuccessfulTransmission: timestamp,
    lastUpdated: timestamp,
    signalQuality: nextSignal,
    latencyMs: nextLatency,
    batteryLevel: nextBattery,
    sensors: {
      temperature: {
        value: nextTemp,
        unit: '°C',
        status: tempStatus,
        lastChanged: tempStatus !== node.sensors.temperature.status ? timestamp : node.sensors.temperature.lastChanged,
      },
      humidity: {
        value: nextHum,
        unit: '%',
        status: humStatus,
        lastChanged: humStatus !== node.sensors.humidity.status ? timestamp : node.sensors.humidity.lastChanged,
      },
      motion: {
        detected: motionTriggered,
        lastDetectionTime: nextLastDetectionTime,
        detectionCount: nextMotionCount,
        status: motionTriggered ? 'WARNING' : 'NORMAL',
        lastChanged: motionTriggered !== hadMotion ? timestamp : node.sensors.motion.lastChanged,
      },
      lidar: {
        value: nextLidar,
        unit: 'm',
        status: lidarStatus,
        lastChanged: lidarStatus !== node.sensors.lidar.status ? timestamp : node.sensors.lidar.lastChanged,
      },
      vibration: {
        value: nextVib,
        unit: 'g',
        status: vibStatus,
        lastChanged: vibStatus !== node.sensors.vibration.status ? timestamp : node.sensors.vibration.lastChanged,
      },
    },
    history: updatedHistory,
  };
};

/**
 * Apply Scenario Presets (Scenarios A through H) in a deterministic and reproducible manner.
 */
export const applyScenarioToNodes = (
  scenario: SimulationScenarioId,
  currentNodes: Record<string, SensorNode>,
  _thresholds: ThresholdConfig,
  targetNodeId: string = 'BIH-SIT-001',
  timestamp: string = new Date().toISOString()
): Record<string, SensorNode> => {

  const nodes = { ...currentNodes };

  switch (scenario) {
    case 'NORMAL':
      // Reset all nodes to calibrated normal baseline
      Object.keys(nodes).forEach((id) => {
        const node = nodes[id];
        nodes[id] = {
          ...node,
          status: 'ONLINE',
          isStale: false,
          lastSuccessfulTransmission: timestamp,
          lastUpdated: timestamp,
          riskScore: 12,
          riskLevel: 'NORMAL',
          contributingFactors: ['All parameters within normal baseline limits'],
          sensors: {
            temperature: { value: 27.6, unit: '°C', status: 'NORMAL', lastChanged: timestamp },
            humidity: { value: 64, unit: '%', status: 'NORMAL', lastChanged: timestamp },
            motion: { detected: false, lastDetectionTime: null, detectionCount: 0, status: 'NORMAL', lastChanged: timestamp },
            lidar: { value: 4.8, unit: 'm', status: 'NORMAL', lastChanged: timestamp },
            vibration: { value: 0.04, unit: 'g', status: 'NORMAL', lastChanged: timestamp },
          },
        };
      });
      break;

    case 'TEMP_ANOMALY': {
      // Scenario B: Selected node temperature rises above warning threshold (>35°C, e.g. 37.2°C)
      const target = nodes[targetNodeId] || nodes['BIH-SIT-001'];
      if (target) {
        const tempVal = 37.4;
        nodes[target.nodeId] = {
          ...target,
          status: 'WARNING',
          lastUpdated: timestamp,
          sensors: {
            ...target.sensors,
            temperature: { value: tempVal, unit: '°C', status: 'WARNING', lastChanged: timestamp },
          },
        };
      }
      break;
    }

    case 'HIGH_HUMIDITY': {
      // Scenario C: Humidity increases and triggers warning (>80%, e.g. 86%)
      const target = nodes[targetNodeId] || nodes['BIH-SIT-001'];
      if (target) {
        const humVal = 87;
        nodes[target.nodeId] = {
          ...target,
          status: 'WARNING',
          lastUpdated: timestamp,
          sensors: {
            ...target.sensors,
            humidity: { value: humVal, unit: '%', status: 'WARNING', lastChanged: timestamp },
          },
        };
      }
      break;
    }

    case 'STRUCTURAL_VIBRATION': {
      // Scenario D: Vibration exceeds critical threshold (>0.30g, e.g. 0.38g)
      const target = nodes[targetNodeId] || nodes['BIH-SIT-001'];
      if (target) {
        const vibVal = 0.38;
        nodes[target.nodeId] = {
          ...target,
          status: 'CRITICAL',
          lastUpdated: timestamp,
          sensors: {
            ...target.sensors,
            vibration: { value: vibVal, unit: 'g', status: 'CRITICAL', lastChanged: timestamp },
          },
        };
      }
      break;
    }

    case 'PROXIMITY_HAZARD': {
      // Scenario E: LiDAR reports distance below critical threshold (<1.5m, e.g. 1.1m water/obstacle proximity)
      const target = nodes[targetNodeId] || nodes['BIH-SIT-001'];
      if (target) {
        const lidarVal = 1.1;
        nodes[target.nodeId] = {
          ...target,
          status: 'CRITICAL',
          lastUpdated: timestamp,
          sensors: {
            ...target.sensors,
            lidar: { value: lidarVal, unit: 'm', status: 'CRITICAL', lastChanged: timestamp },
          },
        };
      }
      break;
    }

    case 'COMBINED_ANOMALY': {
      // Scenario F & Step 4 of Demo Workflow:
      // Temp: 27.8°C, Humidity: 86%, Motion: DETECTED, LiDAR: 1.1m, Vibration: 0.37g
      const target = nodes[targetNodeId] || nodes['BIH-SIT-001'];
      if (target) {
        nodes[target.nodeId] = {
          ...target,
          status: 'CRITICAL',
          lastUpdated: timestamp,
          sensors: {
            temperature: { value: 27.8, unit: '°C', status: 'NORMAL', lastChanged: timestamp },
            humidity: { value: 86, unit: '%', status: 'WARNING', lastChanged: timestamp },
            motion: {
              detected: true,
              lastDetectionTime: timestamp,
              detectionCount: target.sensors.motion.detectionCount + 1,
              status: 'WARNING',
              lastChanged: timestamp,
            },
            lidar: { value: 1.1, unit: 'm', status: 'CRITICAL', lastChanged: timestamp },
            vibration: { value: 0.37, unit: 'g', status: 'CRITICAL', lastChanged: timestamp },
          },
        };
      }
      break;
    }

    case 'MULTI_VILLAGE': {
      // Scenario G: Multiple villages report anomalies simultaneously (Village B & Village C)
      const nodeB = nodes['BIH-SIT-001'];
      const nodeC = nodes['BIH-MAD-001'];
      if (nodeB) {
        nodes['BIH-SIT-001'] = {
          ...nodeB,
          status: 'CRITICAL',
          lastUpdated: timestamp,
          sensors: {
            ...nodeB.sensors,
            lidar: { value: 1.2, unit: 'm', status: 'CRITICAL', lastChanged: timestamp },
            vibration: { value: 0.34, unit: 'g', status: 'CRITICAL', lastChanged: timestamp },
          },
        };
      }
      if (nodeC) {
        nodes['BIH-MAD-001'] = {
          ...nodeC,
          status: 'WARNING',
          lastUpdated: timestamp,
          sensors: {
            ...nodeC.sensors,
            humidity: { value: 88, unit: '%', status: 'WARNING', lastChanged: timestamp },
            temperature: { value: 36.5, unit: '°C', status: 'WARNING', lastChanged: timestamp },
          },
        };
      }
      break;
    }

    case 'NODE_OFFLINE': {
      // Scenario H: A node stops transmitting readings and becomes stale
      const target = nodes[targetNodeId] || nodes['BIH-DAR-002'];
      if (target) {
        nodes[target.nodeId] = {
          ...target,
          status: 'OFFLINE',
          isStale: true,
          signalQuality: 0,
          latencyMs: 9999,
          lastUpdated: timestamp,
        };
      }
      break;
    }

    default:
      break;
  }

  return nodes;
};

/**
 * Update village statuses based on their aggregated node states.
 */
export const updateVillagesFromNodes = (
  villages: Record<string, Village>,
  nodes: Record<string, SensorNode>,
  timestamp: string
): Record<string, Village> => {
  const updatedVillages = { ...villages };

  Object.keys(updatedVillages).forEach((vId) => {
    const village = updatedVillages[vId];
    const villageNodes = village.nodeIds.map((nId) => nodes[nId]).filter(Boolean);

    let maxScore = 0;
    let hasCritical = false;
    let hasWarning = false;

    villageNodes.forEach((n) => {
      maxScore = Math.max(maxScore, n.riskScore);
      if (n.status === 'CRITICAL') hasCritical = true;
      if (n.status === 'WARNING') hasWarning = true;
    });

    const status = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'ONLINE';

    updatedVillages[vId] = {
      ...village,
      currentRiskScore: maxScore || 12,
      status,
      lastUpdated: timestamp,
    };
  });

  return updatedVillages;
};
