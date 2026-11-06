import type { 
  SensorNode, 
  ThresholdConfig, 
  Incident, 
  AlertSeverity, 
  EventLogEntry, 
  Village, 
  Drone,
  PriorityBreakdown
} from '../types';

let incidentCounter = 1;

/**
 * Prioritize an incident based on all 5 criteria (Master Prompt Feature 4):
 * 1. Severity (Critical, Warning, Info)
 * 2. Risk score (0-100)
 * 3. Number of affected nodes in village/sector
 * 4. Age of the unresolved incident
 * 5. Drone mission availability
 * Plus multi-sensor correlation bonuses.
 */
export const calculateIncidentPriority = (
  severity: AlertSeverity,
  riskScore: number,
  createdAt: string,
  drones: Record<string, Drone>,
  affectedNodesCount: number = 1,
  correlationsCount: number = 0
): { score: number; explanation: string; breakdown: PriorityBreakdown } => {
  const factors: { label: string; score: number; detail: string }[] = [];

  // 1. Severity Score
  let severityScore = 0;
  if (severity === 'CRITICAL') {
    severityScore = 50;
    factors.push({ label: 'Severity Bonus', score: 50, detail: 'CRITICAL alert status (+50)' });
  } else if (severity === 'WARNING') {
    severityScore = 20;
    factors.push({ label: 'Severity Bonus', score: 20, detail: 'WARNING alert status (+20)' });
  } else {
    severityScore = 5;
    factors.push({ label: 'Severity Bonus', score: 5, detail: 'INFORMATIONAL alert status (+5)' });
  }

  // 2. Risk Score Direct Component
  const riskScoreComponent = Math.round(riskScore);
  factors.push({ label: 'Calculated Risk', score: riskScoreComponent, detail: `Baseline risk index: ${riskScoreComponent}/100 (+${riskScoreComponent})` });

  // 3. Number of Affected Nodes in Village/Sector
  let affectedNodesScore = 0;
  if (affectedNodesCount > 1) {
    affectedNodesScore = Math.min(30, (affectedNodesCount - 1) * 15);
    factors.push({
      label: 'Multi-Node Sector Hazard',
      score: affectedNodesScore,
      detail: `${affectedNodesCount} nodes currently anomalous in sector (+${affectedNodesScore})`,
    });
  }

  // 4. Age of Incident (unresolved duration urgency)
  const ageMinutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  let ageScore = 0;
  if (ageMinutes > 0) {
    ageScore = Math.min(20, ageMinutes * 2);
    factors.push({
      label: 'Unresolved Duration',
      score: ageScore,
      detail: `Unresolved for ${ageMinutes}m (+${ageScore})`,
    });
  }

  // 5. Fleet / Mission Readiness
  const availableDrones = Object.values(drones).filter((d) => d.status === 'AVAILABLE').length;
  let fleetReadinessScore = 0;
  if (availableDrones > 0) {
    fleetReadinessScore = 10;
    factors.push({
      label: 'UAV Standby Readiness',
      score: 10,
      detail: `${availableDrones} UAV(s) available for immediate dispatch (+10)`,
    });
  } else {
    fleetReadinessScore = 0;
    factors.push({
      label: 'UAV Standby Readiness',
      score: 0,
      detail: 'Fleet committed; sortie queued (+0)',
    });
  }

  // 6. Multi-Sensor Correlation Bonus
  let correlationScore = 0;
  if (correlationsCount > 0) {
    correlationScore = Math.min(25, correlationsCount * 12);
    factors.push({
      label: 'Sensor Correlation Bonus',
      score: correlationScore,
      detail: `${correlationsCount} cross-sensor correlation rules active (+${correlationScore})`,
    });
  }

  const totalScore = severityScore + riskScoreComponent + affectedNodesScore + ageScore + fleetReadinessScore + correlationScore;
  const explanationSummary = factors.map((f) => `${f.label}: +${f.score}`).join(' • ');

  const breakdown: PriorityBreakdown = {
    totalScore,
    severityScore,
    riskScoreComponent,
    affectedNodesScore,
    ageScore,
    fleetReadinessScore,
    correlationScore,
    summary: explanationSummary,
    factors,
  };

  return {
    score: totalScore,
    explanation: explanationSummary,
    breakdown,
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

      const affectedInVillage = Object.values(nodes).filter(
        (n) => n.villageId === node.villageId && (n.status === 'WARNING' || n.status === 'CRITICAL' || n.riskScore >= 40)
      ).length;

      const correlationFactors = node.contributingFactors.filter((f) => f.includes('[Correlation Rule]'));
      const correlationsCount = correlationFactors.length;

      const dispatchEligible = triggerSeverity === 'CRITICAL' || node.riskScore >= thresholds.riskScoring.droneDispatchThreshold;
      const priority = calculateIncidentPriority(
        triggerSeverity, 
        node.riskScore, 
        existingActive ? existingActive.createdAt : timestamp, 
        drones,
        affectedInVillage,
        correlationsCount
      );

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
          priorityBreakdown: priority.breakdown,
          correlations: correlationFactors,
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
          priorityBreakdown: priority.breakdown,
          correlations: correlationFactors,
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
