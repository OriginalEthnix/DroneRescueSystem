import type { 
  SensorNode, 
  ThresholdConfig, 
  Incident, 
  AlertSeverity, 
  EventLogEntry, 
  Village, 
  Drone
} from '../types';

let incidentCounter = 1;

/**
 * Prioritize an incident based on severity, risk score, age, and available drone assets.
 */
export const calculateIncidentPriority = (
  severity: AlertSeverity,
  riskScore: number,
  createdAt: string,
  drones: Record<string, Drone>
): { score: number; explanation: string } => {
  let score = riskScore;
  const factors: string[] = [];

  if (severity === 'CRITICAL') {
    score += 50;
    factors.push('Critical Severity (+50)');
  } else if (severity === 'WARNING') {
    score += 20;
    factors.push('Warning Severity (+20)');
  }

  // Age factor: older unresolved incidents gain slight urgency
  const ageMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (ageMinutes > 5) {
    score += Math.min(15, ageMinutes * 2);
    factors.push(`Unresolved for ${ageMinutes}m (+${Math.min(15, ageMinutes * 2)})`);
  }

  // Asset availability factor
  const availableDrones = Object.values(drones).filter((d) => d.status === 'AVAILABLE').length;
  if (availableDrones > 0) {
    factors.push(`${availableDrones} Aerial drone(s) available for immediate sortie`);
  } else {
    factors.push('Drone fleet currently committed to other sectors');
  }

  return {
    score,
    explanation: factors.join(' • '),
  };
};

/**
 * Detects threshold violations and generates or updates incidents with strict deduplication.
 * Does NOT auto-resolve incidents when values normalize, requiring explicit operator action.
 */
export const processAlertsForNodes = (
  nodes: Record<string, SensorNode>,
  villages: Record<string, Village>,
  existingIncidents: Record<string, Incident>,
  thresholds: ThresholdConfig,
  drones: Record<string, Drone>,
  timestamp: string = new Date().toISOString()
): { updatedIncidents: Record<string, Incident>; newLogs: EventLogEntry[] } => {
  const updatedIncidents = { ...existingIncidents };
  const newLogs: EventLogEntry[] = [];

  Object.values(nodes).forEach((node) => {
    if (node.status === 'OFFLINE' || node.isStale) {
      return;
    }

    const village = villages[node.villageId];
    const villageName = village ? village.name : node.villageId;

    const temp = node.sensors.temperature.value;
    const hum = node.sensors.humidity.value;
    const lidar = node.sensors.lidar.value;
    const vib = node.sensors.vibration.value;

    let triggerSeverity: AlertSeverity | null = null;
    let triggerSensor: 'temperature' | 'humidity' | 'motion' | 'lidar' | 'vibration' | 'multi' = 'temperature';
    let triggerReason = '';
    let triggerValue = '';
    let configuredThreshold = '';
    let recommendedResponse = '';

    // Check Critical Conditions First
    if (vib >= thresholds.vibration.criticalG) {
      triggerSeverity = 'CRITICAL';
      triggerSensor = 'vibration';
      triggerReason = `Structural vibration crossed critical threshold (${vib.toFixed(2)}g >= ${thresholds.vibration.criticalG}g)`;
      triggerValue = `${vib.toFixed(2)}g`;
      configuredThreshold = `>= ${thresholds.vibration.criticalG}g`;
      recommendedResponse = 'Urgent aerial drone verification of structural integrity and ground displacement.';
    } else if (lidar <= thresholds.lidar.criticalDistance) {
      triggerSeverity = 'CRITICAL';
      triggerSensor = 'lidar';
      triggerReason = `Proximity hazard: LiDAR distance breached safety minimum (${lidar.toFixed(1)}m <= ${thresholds.lidar.criticalDistance}m)`;
      triggerValue = `${lidar.toFixed(1)}m`;
      configuredThreshold = `<= ${thresholds.lidar.criticalDistance}m`;
      recommendedResponse = 'Dispatch autonomous drone to inspect floodwater inundation or road blockage.';
    } else if (temp > thresholds.temperature.criticalMax) {
      triggerSeverity = 'CRITICAL';
      triggerSensor = 'temperature';
      triggerReason = `Extreme ambient temperature (${temp.toFixed(1)}°C > ${thresholds.temperature.criticalMax}°C)`;
      triggerValue = `${temp.toFixed(1)}°C`;
      configuredThreshold = `> ${thresholds.temperature.criticalMax}°C`;
      recommendedResponse = 'Aerial thermal inspection and immediate local disaster response alert.';
    } else if (hum > thresholds.humidity.criticalMax) {
      triggerSeverity = 'CRITICAL';
      triggerSensor = 'humidity';
      triggerReason = `Critical atmospheric saturation (${hum}% > ${thresholds.humidity.criticalMax}%)`;
      triggerValue = `${hum}%`;
      configuredThreshold = `> ${thresholds.humidity.criticalMax}%`;
      recommendedResponse = 'Monitor flood corridors and assess moisture vulnerability.';
    } else if (node.riskScore >= 60) {
      // Combined anomaly elevating overall risk
      triggerSeverity = node.riskScore >= 80 ? 'CRITICAL' : 'WARNING';
      triggerSensor = 'multi';
      triggerReason = `Composite risk threshold breached (${node.riskScore}/100)`;
      triggerValue = `Risk ${node.riskScore}`;
      configuredThreshold = `>= 60/100`;
      recommendedResponse = 'Request drone verification to cross-examine sensor anomalies.';
    } else if (vib >= thresholds.vibration.warningG) {
      triggerSeverity = 'WARNING';
      triggerSensor = 'vibration';
      triggerReason = `Elevated vibration detected (${vib.toFixed(2)}g >= ${thresholds.vibration.warningG}g)`;
      triggerValue = `${vib.toFixed(2)}g`;
      configuredThreshold = `>= ${thresholds.vibration.warningG}g`;
      recommendedResponse = 'Continuous monitoring; prepare drone for verification if sustained.';
    } else if (lidar <= thresholds.lidar.warningDistance) {
      triggerSeverity = 'WARNING';
      triggerSensor = 'lidar';
      triggerReason = `LiDAR proximity alert (${lidar.toFixed(1)}m <= ${thresholds.lidar.warningDistance}m)`;
      triggerValue = `${lidar.toFixed(1)}m`;
      configuredThreshold = `<= ${thresholds.lidar.warningDistance}m`;
      recommendedResponse = 'Monitor water level trend; prepare flood surveillance flight.';
    } else if (temp > thresholds.temperature.warningMin) {
      triggerSeverity = 'WARNING';
      triggerSensor = 'temperature';
      triggerReason = `Elevated temperature warning (${temp.toFixed(1)}°C > ${thresholds.temperature.warningMin}°C)`;
      triggerValue = `${temp.toFixed(1)}°C`;
      configuredThreshold = `> ${thresholds.temperature.warningMin}°C`;
      recommendedResponse = 'Inspect node telemetry; monitor for rising heat index.';
    } else if (hum > thresholds.humidity.warningMin) {
      triggerSeverity = 'WARNING';
      triggerSensor = 'humidity';
      triggerReason = `High humidity alert (${hum}% > ${thresholds.humidity.warningMin}%)`;
      triggerValue = `${hum}%`;
      configuredThreshold = `> ${thresholds.humidity.warningMin}%`;
      recommendedResponse = 'Check weather radar and evaluate flood hazard risk.';
    }

    if (triggerSeverity) {
      // DEDUPLICATION: Check if there is already an ACTIVE or UNRESOLVED incident for this node
      const existingActive = Object.values(updatedIncidents).find(
        (inc) => inc.nodeId === node.nodeId && inc.status !== 'RESOLVED'
      );

      const dispatchEligible = triggerSeverity === 'CRITICAL' || node.riskScore >= thresholds.riskScoring.droneDispatchThreshold;
      const priority = calculateIncidentPriority(triggerSeverity, node.riskScore, existingActive ? existingActive.createdAt : timestamp, drones);

      if (existingActive) {
        // Update the existing uninterrupted incident (refresh score and latest trigger values without creating a duplicate)
        updatedIncidents[existingActive.id] = {
          ...existingActive,
          updatedAt: timestamp,
          severity: triggerSeverity === 'CRITICAL' ? 'CRITICAL' : existingActive.severity,
          triggerReason,
          triggerValue,
          riskScore: node.riskScore,
          contributingConditions: node.contributingFactors,
          dispatchEligible,
          priorityScore: priority.score,
          priorityExplanation: priority.explanation,
        };
      } else {
        // Genuinely new or recurred incident
        const incidentId = `INC-${new Date().getFullYear()}-${String(incidentCounter++).padStart(3, '0')}`;
        
        const newIncident: Incident = {
          id: incidentId,
          createdAt: timestamp,
          updatedAt: timestamp,
          villageId: node.villageId,
          villageName,
          district: node.district,
          nodeId: node.nodeId,
          severity: triggerSeverity,
          triggerReason,
          triggerSensor,
          triggerValue,
          configuredThreshold,
          riskScore: node.riskScore,
          contributingConditions: node.contributingFactors,
          recommendedResponse,
          status: 'ACTIVE',
          dispatchEligible,
          priorityScore: priority.score,
          priorityExplanation: priority.explanation,
          assignedDroneId: null,
          assignedMissionId: null,
          verificationOutcome: null,
          operatorNotes: [],
        };

        updatedIncidents[incidentId] = newIncident;

        newLogs.push({
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp,
          category: 'ALERT',
          severity: triggerSeverity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          title: `${triggerSeverity} Alert: ${node.nodeId}`,
          description: `${triggerReason} in ${villageName} (${node.district}). Recommended: ${recommendedResponse}`,
          villageId: node.villageId,
          nodeId: node.nodeId,
          incidentId,
        });
      }
    }
  });

  return { updatedIncidents, newLogs };
};
