import type { Incident, DroneMission, DroneMissionReport } from '../types';

/**
 * Data Export Service (Session 7 Feature 7)
 * 
 * Provides client-side RFC 4180 compliant CSV and structured JSON exports
 * for Incidents, Drone Missions, and printable Mission After-Action Reports.
 */

const downloadFile = (content: string, filename: string, mimeType: string) => {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const escapeCsvValue = (val: unknown): string => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (Array.isArray(val)) {
    str = val.join('; ');
  }
  // If string contains commas, newlines, or quotes, enclose in quotes and double internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Exports Incident records as standard CSV
 */
export const exportIncidentsToCSV = (incidents: Incident[]): void => {
  const headers = [
    'Incident ID',
    'Created At',
    'Village',
    'District',
    'Node ID',
    'Severity',
    'Status',
    'Risk Score',
    'Priority Score',
    'Trigger Sensor',
    'Trigger Value',
    'Configured Threshold',
    'Trigger Reason',
    'Assigned Drone',
    'Assigned Mission',
    'Verification Outcome',
    'Contributing Conditions',
    'Recommended Response',
    'Operator Notes'
  ];

  const rows = incidents.map((inc) => [
    escapeCsvValue(inc.id),
    escapeCsvValue(inc.createdAt),
    escapeCsvValue(inc.villageName),
    escapeCsvValue(inc.district),
    escapeCsvValue(inc.nodeId),
    escapeCsvValue(inc.severity),
    escapeCsvValue(inc.status),
    escapeCsvValue(inc.riskScore),
    escapeCsvValue(inc.priorityScore),
    escapeCsvValue(inc.triggerSensor),
    escapeCsvValue(inc.triggerValue),
    escapeCsvValue(inc.configuredThreshold),
    escapeCsvValue(inc.triggerReason),
    escapeCsvValue(inc.assignedDroneId || 'N/A'),
    escapeCsvValue(inc.assignedMissionId || 'N/A'),
    escapeCsvValue(inc.verificationOutcome || 'PENDING'),
    escapeCsvValue(inc.contributingConditions),
    escapeCsvValue(inc.recommendedResponse),
    escapeCsvValue(inc.operatorNotes),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `DEIN_Incidents_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Exports Incident records as formatted JSON
 */
export const exportIncidentsToJSON = (incidents: Incident[]): void => {
  const payload = {
    exportType: 'DEIN_INCIDENTS_AUDIT',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    totalCount: incidents.length,
    incidents,
  };
  const jsonContent = JSON.stringify(payload, null, 2);
  const filename = `DEIN_Incidents_Export_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonContent, filename, 'application/json');
};

/**
 * Exports Drone Missions as standard CSV
 */
export const exportMissionsToCSV = (missions: DroneMission[]): void => {
  const headers = [
    'Mission ID',
    'Drone ID',
    'Incident ID',
    'Target Village',
    'Target Node',
    'Status',
    'Progress (%)',
    'Priority',
    'Start Time',
    'Estimated Arrival',
    'Actual Arrival',
    'Completion Time',
    'Total Distance (km)',
    'Remaining Distance (km)',
    'Verification Outcome',
    'Operator Notes'
  ];

  const rows = missions.map((m) => [
    escapeCsvValue(m.id),
    escapeCsvValue(m.droneId),
    escapeCsvValue(m.incidentId),
    escapeCsvValue(m.targetVillageId),
    escapeCsvValue(m.targetNodeId),
    escapeCsvValue(m.status),
    escapeCsvValue(m.progressPercent),
    escapeCsvValue(m.priority),
    escapeCsvValue(m.startTime),
    escapeCsvValue(m.estimatedArrivalTime || 'N/A'),
    escapeCsvValue(m.actualArrivalTime || 'N/A'),
    escapeCsvValue(m.completionTime || 'N/A'),
    escapeCsvValue(m.distanceTotalKm),
    escapeCsvValue(m.distanceRemainingKm),
    escapeCsvValue(m.verificationOutcome || 'PENDING'),
    escapeCsvValue(m.operatorNotes || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `DEIN_UAV_Missions_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Exports Drone Missions as formatted JSON
 */
export const exportMissionsToJSON = (missions: DroneMission[]): void => {
  const payload = {
    exportType: 'DEIN_MISSIONS_AUDIT',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    totalCount: missions.length,
    missions,
  };
  const jsonContent = JSON.stringify(payload, null, 2);
  const filename = `DEIN_UAV_Missions_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonContent, filename, 'application/json');
};

/**
 * Formats a clean printable mission report text/HTML
 */
export const formatPrintableMissionReport = (report: DroneMissionReport): string => {
  return `
================================================================================
     AI-BASED MULTI-AGENT SWARM ROBOT SYSTEM FOR AUTONOMOUS DISASTER
                AND RESCUE USING REINFORCEMENT LEARNING
               UAV AERIAL RECONNAISSANCE MISSION REPORT
================================================================================

MISSION IDENTIFICATION
--------------------------------------------------------------------------------
Mission Reference ID     : ${report.missionId}
Associated Incident ID   : ${report.incidentId}
Target Operational Sector: ${report.targetVillage}
Assigned Aerial Asset    : ${report.assignedDrone}

CHRONOLOGY & TIMING
--------------------------------------------------------------------------------
Sortie Dispatch Time     : ${report.dispatchTime}
Target Arrival Time      : ${report.simulatedArrivalTime}
Total Mission Duration   : ${report.missionDuration}
Final Execution Status   : ${report.finalStatus}

AERIAL SURVEILLANCE & VERIFICATION OUTCOME
--------------------------------------------------------------------------------
Verification Result      : [ ${report.verificationResult} ]

OPERATOR FIELD & AUDIT NOTES
--------------------------------------------------------------------------------
${report.operatorNotes || 'No specific field notes recorded.'}

================================================================================
Report Generated: ${new Date().toISOString()}
Verified by Autonomous Aerial Dispatch & Multi-Agent Swarm Subsystem (North Bihar Command)
================================================================================
`.trim();
};
