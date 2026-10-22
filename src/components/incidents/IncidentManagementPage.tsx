import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle, 
  CheckCheck, 
  Plane, 
  FileText, 
  MapPin, 
  Plus, 
  Eye, 
  ArrowUpDown
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import type { Incident, AlertSeverity, IncidentStatus } from '../../types';

export const IncidentManagementPage: React.FC = () => {
  const { 
    state, 
    acknowledgeIncident, 
    resolveIncident, 
    addIncidentNote, 
    setActiveSection,
    selectVillage
  } = useNetwork();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'priorityScore' | 'createdAt' | 'riskScore'>('priorityScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  
  // Incident Detail Modal State
  const [activeModalIncident, setActiveModalIncident] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState('');

  const incidents = Object.values(state.incidents);

  // Filter & Search
  const filtered = incidents.filter((inc) => {
    const matchesSearch = 
      inc.id.toLowerCase().includes(search.toLowerCase()) ||
      inc.villageName.toLowerCase().includes(search.toLowerCase()) ||
      inc.nodeId.toLowerCase().includes(search.toLowerCase()) ||
      inc.triggerReason.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'createdAt') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'ACKNOWLEDGED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'DRONE_REQUESTED':
      case 'DRONE_EN_ROUTE':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'UNDER_INVESTIGATION':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    return severity === 'CRITICAL'
      ? 'bg-red-500/20 text-red-400 border-red-500/40'
      : severity === 'WARNING'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Incident Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-100">Threshold Alert & Incident Management</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Centralized triage of environmental alerts, automated priority scoring, operator acknowledgments, and aerial dispatch workflows.
          </p>
        </div>

        {/* Priority Legend Badge */}
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Total Incidents:</span>
          <span className="text-slate-100 font-bold">{incidents.length}</span>
          <span className="text-slate-600">|</span>
          <span className="text-red-400 font-bold">
            {incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length} Critical
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">
            {incidents.filter((i) => i.status === 'RESOLVED').length} Resolved
          </span>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, village, or trigger..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-56 md:w-64"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
            <span className="text-slate-500 px-2 text-[10px] uppercase font-mono">Severity:</span>
            {['ALL', 'CRITICAL', 'WARNING'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  severityFilter === sev
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
            <Filter className="w-3 h-3 text-slate-500 ml-2 mr-1" />
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((stat) => (
              <button
                key={stat}
                onClick={() => setStatusFilter(stat)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === stat
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 text-[11px] font-mono">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
          >
            <option value="priorityScore">Priority Score (Highest)</option>
            <option value="riskScore">Risk Score</option>
            <option value="createdAt">Time Detected</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Incident Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-3">Location & Node</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Trigger Reason</th>
                <th className="py-3 px-3 text-center">Risk Score</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    No matching incidents found.
                  </td>
                </tr>
              ) : (
                sorted.map((inc) => {
                  return (
                    <tr 
                      key={inc.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID & Timestamp */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-200">{inc.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Location & Node */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-200">{inc.villageName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">
                          {inc.nodeId} ({inc.district})
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(inc.severity)}`}>
                          {inc.severity}
                        </span>
                      </td>

                      {/* Trigger Reason */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="text-slate-300 font-medium truncate" title={inc.triggerReason}>
                          {inc.triggerReason}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          Value: {inc.triggerValue} (Thresh: {inc.configuredThreshold})
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className={`font-bold ${
                          inc.riskScore >= 80 ? 'text-red-400' : inc.riskScore >= 60 ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {inc.riskScore}/100
                        </span>
                      </td>

                      {/* Priority Score */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <div className="inline-block px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-[11px]" title={inc.priorityExplanation}>
                          {inc.priorityScore}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(inc.status)}`}>
                          {inc.status}
                        </span>
                      </td>

                      {/* Available Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Inspect Modal Button */}
                          <button
                            onClick={() => setActiveModalIncident(inc)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                            title="Inspect Incident Details & Operator Notes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Acknowledge Button */}
                          {inc.status === 'ACTIVE' && (
                            <button
                              onClick={() => acknowledgeIncident(inc.id)}
                              className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-mono text-[10px] transition-colors flex items-center space-x-1"
                              title="Acknowledge Alert"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Ack</span>
                            </button>
                          )}

                          {/* Dispatch Drone Action */}
                          {inc.dispatchEligible && inc.status !== 'RESOLVED' && (
                            <button
                              onClick={() => {
                                selectVillage(inc.villageId);
                                setActiveSection('drones');
                              }}
                              className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] font-bold transition-colors flex items-center space-x-1 shadow-sm"
                              title="Dispatch Drone for Aerial Verification"
                            >
                              <Plane className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* Resolve Button */}
                          {inc.status !== 'RESOLVED' && (
                            <button
                              onClick={() => {
                                const notes = window.prompt(`Enter resolution notes for incident ${inc.id}:`, 'Verified and resolved by field operator.');
                                if (notes !== null) {
                                  resolveIncident(inc.id, notes);
                                }
                              }}
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] transition-colors flex items-center space-x-1"
                              title="Mark incident resolved"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail & Investigation Notes Modal */}
      {activeModalIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(activeModalIncident.severity)}`}>
                    {activeModalIncident.severity}
                  </span>
                  <h3 className="font-bold font-mono text-base text-slate-100">{activeModalIncident.id}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Location: <span className="text-slate-200 font-semibold">{activeModalIncident.villageName}</span> ({activeModalIncident.district}) • Node: <span className="text-cyan-400 font-mono">{activeModalIncident.nodeId}</span>
                </p>
              </div>

              <button
                onClick={() => setActiveModalIncident(null)}
                className="text-slate-400 hover:text-slate-100 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Incident Diagnostic Details */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Trigger Sensor</span>
                <span className="text-slate-200 font-bold">{activeModalIncident.triggerSensor.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Trigger Value vs Thresh</span>
                <span className="text-slate-200 font-bold">{activeModalIncident.triggerValue} ({activeModalIncident.configuredThreshold})</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Risk Score</span>
                <span className="text-red-400 font-bold">{activeModalIncident.riskScore}/100</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Priority Ranking</span>
                <span className="text-cyan-400 font-bold">{activeModalIncident.priorityScore} pts</span>
              </div>
            </div>

            {/* Contributing Conditions */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Rule Engine Contributing Factors:
              </div>
              <ul className="space-y-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300">
                {activeModalIncident.contributingConditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Response */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-xs">
              <span className="text-cyan-400 font-bold block mb-1">Recommended Response:</span>
              <p className="text-slate-300">{activeModalIncident.recommendedResponse}</p>
            </div>

            {/* Investigation Notes Feed */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Operator Investigation Notes ({activeModalIncident.operatorNotes.length}):</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {activeModalIncident.operatorNotes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No notes recorded yet.</p>
                ) : (
                  activeModalIncident.operatorNotes.map((note, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      • {note}
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add operational investigation note..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newNote.trim()) {
                      addIncidentNote(activeModalIncident.id, newNote.trim());
                      setActiveModalIncident({
                        ...activeModalIncident,
                        operatorNotes: [...activeModalIncident.operatorNotes, newNote.trim()],
                      });
                      setNewNote('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newNote.trim()) {
                      addIncidentNote(activeModalIncident.id, newNote.trim());
                      setActiveModalIncident({
                        ...activeModalIncident,
                        operatorNotes: [...activeModalIncident.operatorNotes, newNote.trim()],
                      });
                      setNewNote('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  selectVillage(activeModalIncident.villageId);
                  setActiveModalIncident(null);
                  setActiveSection('geographic');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Locate on Map</span>
              </button>

              <div className="flex items-center space-x-2">
                {activeModalIncident.dispatchEligible && activeModalIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      selectVillage(activeModalIncident.villageId);
                      setActiveModalIncident(null);
                      setActiveSection('drones');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>Dispatch Drone</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveModalIncident(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
