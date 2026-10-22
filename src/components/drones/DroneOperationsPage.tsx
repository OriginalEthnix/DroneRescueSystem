import React from 'react';
import { 
  Plane, 
  Battery, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle, 
  FastForward, 
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import type { DroneStatus, DroneMissionReport } from '../../types';


export const DroneOperationsPage: React.FC = () => {
  const { 
    state, 
    dispatchDrone, 
    abortMission, 
    advanceMission, 
    setActiveSection,
    resolveIncident
  } = useNetwork();

  const [selectedIncidentForDispatch, setSelectedIncidentForDispatch] = React.useState<string | null>(null);
  const [selectedDroneForDispatch, setSelectedDroneForDispatch] = React.useState<string | undefined>(undefined);
  const [activeReportModal, setActiveReportModal] = React.useState<DroneMissionReport | null>(null);

  const drones = Object.values(state.drones);
  const missions = Object.values(state.missions);
  const incidents = Object.values(state.incidents);

  // Filter dispatch-eligible incidents
  const eligibleIncidents = incidents.filter(
    (inc) => inc.dispatchEligible && inc.status !== 'RESOLVED' && !inc.assignedMissionId
  );

  const activeMissions = missions.filter((m) => m.status !== 'AVAILABLE');
  const availableDrones = drones.filter((d) => d.status === 'AVAILABLE');

  const getStatusBadge = (status: DroneStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'MISSION_ASSIGNED':
      case 'PRE_FLIGHT_CHECK':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse';
      case 'TAKEOFF':
      case 'EN_ROUTE':
      case 'APPROACHING_TARGET':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-pulse';
      case 'ARRIVED':
      case 'AERIAL_VERIFICATION':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40 animate-pulse';
      case 'MISSION_COMPLETE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'RETURNING_TO_BASE':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const candidateIncident = selectedIncidentForDispatch 
    ? state.incidents[selectedIncidentForDispatch] 
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Plane className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">Autonomous Drone Operations Command</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulated aerial reconnaissance fleet based at Darbhanga Command Hub. 11-stage mission state machine, real-time telemetry, and simulated aerial verifications.
          </p>
        </div>

        {/* Fleet KPI Pills */}
        <div className="flex items-center space-x-2 font-mono text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">UAV Fleet:</span>
          <span className="text-indigo-400 font-bold">{drones.length} Total</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">{availableDrones.length} Available</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">{activeMissions.length} Active Sorties</span>
        </div>
      </div>

      {/* Drone Fleet Cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Regional Reconnaissance Fleet (Darbhanga Base)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drones.map((drone) => {
            const activeMission = drone.currentMissionId ? state.missions[drone.currentMissionId] : null;

            return (
              <div 
                key={drone.id}
                className={`bg-slate-900/80 border rounded-xl p-5 transition-all flex flex-col justify-between ${
                  drone.status === 'AVAILABLE' 
                    ? 'border-slate-800 hover:border-slate-700' 
                    : 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-slate-800 mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${drone.status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'}`} />
                        <h4 className="font-mono font-bold text-slate-100 text-base">{drone.callsign}</h4>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {drone.id} • Base: Darbhanga Air Hub</p>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${getStatusBadge(drone.status)}`}>
                        {drone.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Drone Specs Grid */}
                  <div className="grid grid-cols-3 gap-2.5 font-mono text-xs mb-4">
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1 uppercase">
                        <Battery className="w-3 h-3 text-emerald-400" />
                        <span>Battery</span>
                      </div>
                      <div className="text-sm font-bold text-slate-200 mt-1">{drone.batteryPercentage}%</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Cruising Spd</div>
                      <div className="text-sm font-bold text-slate-200 mt-1">{drone.speedKmh} km/h</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Sorties Done</div>
                      <div className="text-sm font-bold text-slate-200 mt-1">{drone.totalMissionsCompleted} completed</div>
                    </div>
                  </div>

                  {/* Active Mission Block */}
                  {activeMission ? (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg space-y-2 mb-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-cyan-300 font-mono">SORTIE: {activeMission.id}</span>
                        <span className="text-[11px] font-mono text-slate-300">
                          Target: {activeMission.targetVillageId} ({activeMission.targetNodeId})
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${activeMission.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                        <span>Dist Remaining: <strong className="text-slate-200">{activeMission.distanceRemainingKm} km</strong></span>
                        <span>Phase: <strong className="text-cyan-400">{activeMission.status}</strong></span>
                      </div>

                      {/* Mission Manual Advance & Abort Buttons */}
                      <div className="flex items-center space-x-2 pt-2 border-t border-cyan-900/40">
                        <button
                          onClick={() => advanceMission(activeMission.id)}
                          className="flex-1 py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center space-x-1"
                          title="Advance mission to the next state transition"
                        >
                          <FastForward className="w-3.5 h-3.5" />
                          <span>Advance Phase</span>
                        </button>

                        <button
                          onClick={() => abortMission(activeMission.id)}
                          className="py-1 px-2.5 rounded bg-red-950/50 hover:bg-red-900/50 text-red-300 border border-red-500/40 font-mono text-xs font-bold"
                          title="Abort mission or initiate emergency return to base"
                        >
                          <span>{activeMission.status === 'PRE_FLIGHT_CHECK' || activeMission.status === 'MISSION_ASSIGNED' ? 'Cancel' : 'Return to Base'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-500 mb-3 italic">
                      UAV on standby at Darbhanga Regional Base. Awaiting mission assignment.
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    GPS: {drone.currentCoordinates.lat.toFixed(4)}°N, {drone.currentCoordinates.lng.toFixed(4)}°E
                  </span>

                  <button
                    onClick={() => setActiveSection('geographic')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium text-xs flex items-center space-x-1"
                  >
                    <span>Track on Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Eligible Incidents Ready for Dispatch */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Incidents Eligible for Aerial Drone Dispatch</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Hazards with Critical Severity or Risk Score &ge; 60/100 qualify for autonomous reconnaissance dispatch.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
            {eligibleIncidents.length} Pending
          </span>
        </div>

        {eligibleIncidents.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-lg text-slate-500 text-xs font-mono">
            No incidents currently requiring aerial verification dispatch.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {eligibleIncidents.map((inc) => (
              <div 
                key={inc.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-slate-100 text-sm">{inc.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-1">{inc.villageName} ({inc.district})</div>
                  <div className="text-[11px] text-cyan-400 font-mono">Node: {inc.nodeId} • Risk: {inc.riskScore}/100</div>
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2">{inc.triggerReason}</p>
                </div>

                <button
                  onClick={() => setSelectedIncidentForDispatch(inc.id)}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-950/40 transition-colors"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Configure Dispatch Sortie</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Drone Mission Reports */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Completed Aerial Verification Reports</span>
        </h3>
        {missions.filter((m) => m.report).length === 0 ? (
          <div className="p-6 text-center bg-slate-950/60 border border-slate-800 rounded-lg text-slate-500 text-xs font-mono">
            No completed mission reports recorded yet. Dispatch a drone to generate verification telemetry.
          </div>
        ) : (
          <div className="space-y-2">
            {missions
              .filter((m) => m.report)
              .map((m) => {
                const rep = m.report!;
                return (
                  <div 
                    key={rep.missionId}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-200">{rep.missionId}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-cyan-400 font-mono">Target: {rep.targetVillage}</span>
                        <span className="text-slate-500">•</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {rep.verificationResult}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">
                        Assigned UAV: {rep.assignedDrone} • Duration: {rep.missionDuration} • Status: {rep.finalStatus}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveReportModal(rep)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0"
                    >
                      Inspect Full Mission Report
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Dispatch Confirmation Modal (Master Prompt Section 8 Requirement) */}
      {candidateIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
                  <Plane className="w-4 h-4 text-cyan-400" />
                  <span>Authorize Autonomous Drone Dispatch</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Confirmation required prior to initializing pre-flight check and motor spool-up.
                </p>
              </div>
              <button 
                onClick={() => setSelectedIncidentForDispatch(null)}
                className="text-slate-400 hover:text-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Dispatch Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Incident ID</span>
                <span className="text-slate-200 font-bold">{candidateIncident.id}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Target Location</span>
                <span className="text-cyan-400 font-bold">{candidateIncident.villageName} ({candidateIncident.nodeId})</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Incident Severity</span>
                <span className="text-red-400 font-bold">{candidateIncident.severity}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Risk Score</span>
                <span className="text-red-400 font-bold">{candidateIncident.riskScore}/100</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Est. Distance from Base</span>
                <span className="text-slate-200 font-bold">~65 km</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Est. Time of Arrival (ETA)</span>
                <span className="text-slate-200 font-bold">~60 mins</span>
              </div>
            </div>

            {/* Dispatch Reason */}
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs">
              <span className="text-amber-400 font-bold block mb-1">Reason for Aerial Dispatch:</span>
              <p className="text-slate-300">{candidateIncident.triggerReason}</p>
            </div>

            {/* Drone Selection */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Assign Drone from Fleet:
              </label>
              <select
                value={selectedDroneForDispatch || ''}
                onChange={(e) => setSelectedDroneForDispatch(e.target.value || undefined)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
              >
                <option value="">Auto-Assign (Highest Battery & Available)</option>
                {drones.map((d) => (
                  <option 
                    key={d.id} 
                    value={d.id}
                    disabled={d.status !== 'AVAILABLE'}
                  >
                    {d.callsign} ({d.id}) — {d.status} (Battery: {d.batteryPercentage}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedIncidentForDispatch(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const success = dispatchDrone(candidateIncident.id, selectedDroneForDispatch);
                  if (success) {
                    setSelectedIncidentForDispatch(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mission Summary Report Modal (Master Prompt Feature 5) */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                  OFFICIAL UAV SORTIE REPORT
                </span>
                <h3 className="font-bold font-mono text-base text-slate-100 mt-1">
                  Mission Summary: {activeReportModal.missionId}
                </h3>
              </div>
              <button 
                onClick={() => setActiveReportModal(null)}
                className="text-slate-400 hover:text-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* 10 Required Report Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Mission ID</span>
                <span className="text-slate-200 font-bold">{activeReportModal.missionId}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Incident ID</span>
                <span className="text-cyan-400 font-bold">{activeReportModal.incidentId}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Target Village Sector</span>
                <span className="text-slate-200 font-bold">{activeReportModal.targetVillage}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Assigned UAV</span>
                <span className="text-slate-200 font-bold">{activeReportModal.assignedDrone}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Dispatch Time</span>
                <span className="text-slate-300">{new Date(activeReportModal.dispatchTime).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Simulated Arrival Time</span>
                <span className="text-slate-300">{new Date(activeReportModal.simulatedArrivalTime).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Total Duration</span>
                <span className="text-slate-200 font-bold">{activeReportModal.missionDuration}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Final Sortie Status</span>
                <span className="text-emerald-400 font-bold">{activeReportModal.finalStatus}</span>
              </div>
            </div>

            {/* Verification Result Callout */}
            <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-lg text-xs">
              <span className="text-purple-300 font-bold block mb-1">Simulated Aerial Observation Outcome:</span>
              <p className="font-mono text-purple-200 font-bold text-sm">{activeReportModal.verificationResult}</p>
            </div>

            {/* Operator Notes */}
            <div className="text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Operator Log Notes:</span>
              <p className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                {activeReportModal.operatorNotes}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  resolveIncident(activeReportModal.incidentId, `Resolved based on aerial sortie verification: ${activeReportModal.verificationResult}`);
                  setActiveReportModal(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark Incident Resolved</span>
              </button>

              <button
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
