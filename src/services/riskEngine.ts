import type { SensorNode, ThresholdConfig, RiskLevel } from '../types';

export interface RiskEvaluationResult {
  score: number;
  level: RiskLevel;
  contributingFactors: string[];
}

/**
 * Deterministically computes an explainable risk score (0-100) based on real sensor telemetry.
 * Honors explicit individual rules (e.g. Critical LiDAR or Critical Vibration triggers elevated risk)
 * and multi-sensor compounding rules.
 */
export const calculateNodeRisk = (
  node: SensorNode,
  thresholds: ThresholdConfig
): RiskEvaluationResult => {
  if (node.status === 'OFFLINE' || node.isStale) {
    return {
      score: 50,
      level: 'WARNING',
      contributingFactors: ['Telemetry Stale: Node offline or signal disconnected'],
    };
  }

  const factors: string[] = [];
  let baseScore = 10; // Baseline ambient environmental score

  const temp = node.sensors.temperature.value;
  const hum = node.sensors.humidity.value;
  const lidar = node.sensors.lidar.value;
  const vib = node.sensors.vibration.value;
  const motion = node.sensors.motion.detected;

  let anomalyCount = 0;

  // 1. Temperature Evaluation
  if (temp > thresholds.temperature.criticalMax) {
    baseScore += 35;
    anomalyCount++;
    factors.push(`Critical temperature breach: ${temp.toFixed(1)}°C (Threshold >${thresholds.temperature.criticalMax}°C)`);
  } else if (temp > thresholds.temperature.warningMin) {
    baseScore += 18;
    anomalyCount++;
    factors.push(`Elevated ambient temperature: ${temp.toFixed(1)}°C (Warning >${thresholds.temperature.warningMin}°C)`);
  }

  // 2. Humidity Evaluation
  if (hum > thresholds.humidity.criticalMax) {
    baseScore += 25;
    anomalyCount++;
    factors.push(`Critical atmospheric saturation: ${hum}% (Threshold >${thresholds.humidity.criticalMax}%)`);
  } else if (hum > thresholds.humidity.warningMin) {
    baseScore += 14;
    anomalyCount++;
    factors.push(`High humidity detected: ${hum}% (Warning >${thresholds.humidity.warningMin}%)`);
  }

  // 3. LiDAR Proximity Evaluation (Critical for flood water rising or obstacle collapse)
  if (lidar <= thresholds.lidar.criticalDistance) {
    baseScore += 45;
    anomalyCount++;
    factors.push(`Critical proximity hazard: LiDAR distance at ${lidar.toFixed(1)}m (Threshold <=${thresholds.lidar.criticalDistance}m)`);
  } else if (lidar <= thresholds.lidar.warningDistance) {
    baseScore += 22;
    anomalyCount++;
    factors.push(`Proximity caution: LiDAR distance narrowed to ${lidar.toFixed(1)}m (Warning <=${thresholds.lidar.warningDistance}m)`);
  }

  // 4. Structural Vibration Evaluation
  if (vib >= thresholds.vibration.criticalG) {
    baseScore += 45;
    anomalyCount++;
    factors.push(`Severe structural vibration: ${vib.toFixed(2)}g (Threshold >=${thresholds.vibration.criticalG}g)`);
  } else if (vib >= thresholds.vibration.warningG) {
    baseScore += 20;
    anomalyCount++;
    factors.push(`Abnormal mechanical vibration: ${vib.toFixed(2)}g (Warning >=${thresholds.vibration.warningG}g)`);
  }

  // 5. PIR Motion Evaluation (Context-dependent)
  if (motion) {
    if (anomalyCount > 0) {
      baseScore += 12;
      factors.push('Active movement detected concurrently with anomalous conditions');
    } else {
      factors.push('Isolated brief motion detected within monitored perimeter');
    }
  }

  // Multi-Anomaly Compounding Rule
  if (anomalyCount >= 2) {
    baseScore = Math.round(baseScore * thresholds.riskScoring.weights.multiAnomalyMultiplier);
    factors.push(`Multi-sensor compounding: ${anomalyCount} concurrent hazard indicators detected`);
  }

  // If no anomalies triggered
  if (factors.length === 0) {
    factors.push('All parameters within normal baseline limits');
  }

  // Clamp score strictly between 0 and 100
  const finalScore = Math.min(100, Math.max(0, baseScore));

  // Determine Categorical Level based on configured cutoffs
  const cutoffs = thresholds.riskScoring.categoryCutoffs;
  let level: RiskLevel = 'NORMAL';
  if (finalScore > cutoffs.highRiskMax) {
    level = 'CRITICAL';
  } else if (finalScore > cutoffs.warningMax) {
    level = 'HIGH RISK';
  } else if (finalScore > cutoffs.normalMax) {
    level = 'WARNING';
  }

  return {
    score: finalScore,
    level,
    contributingFactors: factors,
  };
};
