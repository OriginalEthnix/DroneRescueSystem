import type { SensorNode, ThresholdConfig } from '../types';

/**
 * Multi-Sensor Correlation Engine
 * 
 * Demonstrates explainable combinations of motion, vibration, LiDAR, and other configured readings.
 * 
 * IMPORTANT DISCLAIMER (Per Master Prompt Section 12):
 * Treat these as configurable demonstration rules, not scientifically validated conclusions.
 */

export interface CorrelationEvaluation {
  ruleId: string;
  name: string;
  category: 'STRUCTURAL' | 'FLOOD' | 'PERIMETER' | 'ENVIRONMENTAL';
  severityWeight: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoreBonus: number;
  priorityBonus: number;
  summary: string;
  explanation: string;
  affectedSensors: string[];
}

export const CORRELATION_DISCLAIMER = 
  'Configurable demonstration rules — not scientifically validated conclusions.';

/**
 * Evaluates active multi-sensor correlation rules for a given sensor node.
 */
export const evaluateMultiSensorCorrelations = (
  node: SensorNode,
  thresholds: ThresholdConfig
): CorrelationEvaluation[] => {
  if (node.status === 'OFFLINE' || node.isStale) {
    return [];
  }

  const activeRules: CorrelationEvaluation[] = [];

  const temp = node.sensors.temperature.value;
  const hum = node.sensors.humidity.value;
  const lidar = node.sensors.lidar.value;
  const vib = node.sensors.vibration.value;
  const motion = node.sensors.motion.detected;

  const isLidarCritical = lidar <= thresholds.lidar.criticalDistance;
  const isLidarWarning = lidar <= thresholds.lidar.warningDistance;
  const isVibCritical = vib >= thresholds.vibration.criticalG;
  const isVibWarning = vib >= thresholds.vibration.warningG;
  const isHumWarning = hum > thresholds.humidity.warningMin;
  const isTempWarning = temp > thresholds.temperature.warningMin;

  // 1. Critical LiDAR Proximity + Structural Vibration (Surge / Embankment Collapse)
  if (isLidarCritical && (isVibCritical || isVibWarning)) {
    activeRules.push({
      ruleId: 'CORR-FLOOD-COLLAPSE',
      name: 'Rapid Proximity Inundation & Structural Distress',
      category: 'FLOOD',
      severityWeight: 'CRITICAL',
      scoreBonus: 25,
      priorityBonus: 35,
      summary: 'Critical LiDAR proximity (<1.5m) coupled with structural vibration',
      explanation: 'Rapid water level rise or obstacle proximity occurring simultaneously with mechanical vibrations indicates active flood surge striking foundation pilings or embankment destabilization. Demands highest operational priority.',
      affectedSensors: ['lidar', 'vibration'],
    });
  } 
  // 2. Motion + Abnormal Vibration (Debris Movement / Structural Shift)
  else if (motion && (isVibCritical || isVibWarning)) {
    activeRules.push({
      ruleId: 'CORR-MOTION-VIB',
      name: 'Dynamic Motion & Mechanical Vibration Correlation',
      category: 'STRUCTURAL',
      severityWeight: 'HIGH',
      scoreBonus: 18,
      priorityBonus: 25,
      summary: 'Perimeter motion detected alongside abnormal structural oscillation',
      explanation: 'Repeated movement detected concurrently with abnormal structural vibration warrants immediate investigation to distinguish mechanical tremor from human activity or shifting debris in a compromised perimeter.',
      affectedSensors: ['motion', 'vibration'],
    });
  }

  // 3. LiDAR Proximity Warning + High Atmospheric Humidity (Flash Flood Precursor)
  if (isLidarWarning && isHumWarning && !activeRules.some(r => r.ruleId === 'CORR-FLOOD-COLLAPSE')) {
    activeRules.push({
      ruleId: 'CORR-PROX-HUMIDITY',
      name: 'Atmospheric Saturation & Rising Water Precursor',
      category: 'FLOOD',
      severityWeight: 'MEDIUM',
      scoreBonus: 14,
      priorityBonus: 20,
      summary: 'LiDAR distance reduction coinciding with high ambient humidity',
      explanation: 'Elevated humidity (>80%) paired with progressive reduction in ground-to-surface LiDAR distance strongly correlates with localized rain runoff accumulation and drainage saturation.',
      affectedSensors: ['lidar', 'humidity'],
    });
  }

  // 4. High Humidity + Elevated Temperature (Thermal-Moisture Stress Anomaly)
  if (isHumWarning && isTempWarning) {
    activeRules.push({
      ruleId: 'CORR-HEAT-HUMIDITY',
      name: 'Thermal-Atmospheric Compound Anomaly',
      category: 'ENVIRONMENTAL',
      severityWeight: 'MEDIUM',
      scoreBonus: 12,
      priorityBonus: 15,
      summary: 'High ambient humidity combined with elevated temperature',
      explanation: 'Concurrent high humidity (>80%) and elevated temperature (>35°C) creates hazardous heat-index conditions and accelerated moisture vapor pressure.',
      affectedSensors: ['temperature', 'humidity'],
    });
  }

  // 5. Isolated Motion Event (Observation Only)
  if (motion && !isLidarWarning && !isVibWarning && !isHumWarning && !isTempWarning) {
    activeRules.push({
      ruleId: 'CORR-ISOLATED-MOTION',
      name: 'Isolated Perimeter Motion',
      category: 'PERIMETER',
      severityWeight: 'LOW',
      scoreBonus: 4,
      priorityBonus: 0,
      summary: 'Isolated motion detected without accompanying environmental anomalies',
      explanation: 'Isolated PIR motion event with all physical and environmental parameters normal. Requires passive logging and observation without escalating emergency dispatch status.',
      affectedSensors: ['motion'],
    });
  }

  return activeRules;
};
