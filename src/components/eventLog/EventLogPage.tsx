import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  ShieldAlert, 
  Plane, 
  Cpu, 
  UserCheck, 
  Activity, 
  Eye, 
  X, 
  Copy, 
  Check, 
  ArrowUpDown 
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import type { EventLogEntry, VillageId } from '../../types';

export const EventLogPage: React.FC = () => {
  const { state, setActiveSection, selectVillage, selectIncident, selectDrone } = useNetwork();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<EventLogEntry | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const logs = state.eventLogs || [];

  // Filter logs
  const filteredLogs = logs.filter((entry) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      !search ||
      entry.id.toLowerCase().includes(q) ||
      entry.title.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      (entry.nodeId && entry.nodeId.toLowerCase().includes(q)) ||
      (entry.villageId && entry.villageId.toLowerCase().includes(q)) ||
      (entry.incidentId && entry.incidentId.toLowerCase().includes(q)) ||
      (entry.droneId && entry.droneId.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'ALL' || entry.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || entry.severity === severityFilter;
    const matchesVillage = villageFilter === 'ALL' || entry.villageId === villageFilter;

    return matchesSearch && matchesCategory && matchesSeverity && matchesVillage;
  });

  // Sort logs by timestamp
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  // KPI calculations
  const totalCount = logs.length;
  const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;
  const droneCount = logs.filter((l) => l.category === 'DRONE').length;
  const thresholdCount = logs.filter((l) => l.category === 'THRESHOLD' || l.category === 'ALERT').length;

  // CSV Exporter (RFC 4180 compliant)
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Log_ID', 'Category', 'Severity', 'Title', 'Description', 'Village_ID', 'Node_ID', 'Incident_ID', 'Drone_ID'];
    
    const escapeCsvField = (field: string | undefined | null) => {
      if (field === undefined || field === null) return '""';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = sortedLogs.map((log) => [
      escapeCsvField(log.timestamp),
      escapeCsvField(log.id),
      escapeCsvField(log.category),
      escapeCsvField(log.severity),
      escapeCsvField(log.title),
      escapeCsvField(log.description),
      escapeCsvField(log.villageId || ''),
      escapeCsvField(log.nodeId || ''),
      escapeCsvField(log.incidentId || ''),
      escapeCsvField(log.droneId || ''),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_event_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Exporter
  const handleExportJSON = () => {
    const jsonString = JSON.stringify(sortedLogs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_event_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyEntryJson = (entry: EventLogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Category Icon & Badge
  const getCategoryBadge = (category: EventLogEntry['category']) => {
    switch (category) {
      case 'SENSOR':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>SENSOR</span>
          </span>
        );
      case 'THRESHOLD':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>THRESHOLD</span>
          </span>
        );
      case 'RISK':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/60">
            <Activity className="w-3 h-3 text-purple-400" />
            <span>RISK</span>
          </span>
        );
      case 'ALERT':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800/60">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>ALERT</span>
          </span>
        );
      case 'DRONE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/60">
            <Plane className="w-3 h-3 text-blue-400" />
            <span>DRONE</span>
          </span>
        );
      case 'SYSTEM':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>SYSTEM</span>
          </span>
        );
      case 'OPERATOR':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <UserCheck className="w-3 h-3 text-slate-400" />
            <span>OPERATOR</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span>{category}</span>
          </span>
        );
    }
  };

  // Severity Badge
  const getSeverityBadge = (severity: EventLogEntry['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            WARNING
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            SUCCESS
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">Audit Trail & Chronological Event Stream</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Immutable operational event stream recording environmental fluctuations, risk shifts, autonomous drone sorties, and operator interventions.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors shadow-sm"
            title="Download audit trail as RFC 4180 CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 border border-cyan-500/30 transition-colors shadow-sm"
            title="Download audit trail as formatted JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs block">Total Logged Events</span>
          <span className="text-2xl font-bold text-slate-100 mt-1 block">{totalCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Chronological buffer</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs block">Critical Events</span>
          <span className={`text-2xl font-bold mt-1 block ${criticalCount > 0 ? 'text-red-400' : 'text-slate-100'}`}>
            {criticalCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Hazard & threshold spikes</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs block">Drone Sortie Events</span>
          <span className="text-2xl font-bold text-blue-400 mt-1 block">{droneCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Dispatches & transitions</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs block">Threshold Breaches</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{thresholdCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Environmental limits</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by title, description, node, incident, or drone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Categories</option>
              <option value="SENSOR" className="bg-slate-900">Sensor</option>
              <option value="THRESHOLD" className="bg-slate-900">Threshold</option>
              <option value="RISK" className="bg-slate-900">Risk Engine</option>
              <option value="ALERT" className="bg-slate-900">Alert / Incident</option>
              <option value="DRONE" className="bg-slate-900">Drone Ops</option>
              <option value="SYSTEM" className="bg-slate-900">System</option>
              <option value="OPERATOR" className="bg-slate-900">Operator</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Severities</option>
              <option value="CRITICAL" className="bg-slate-900">Critical</option>
              <option value="WARNING" className="bg-slate-900">Warning</option>
              <option value="INFO" className="bg-slate-900">Info</option>
              <option value="SUCCESS" className="bg-slate-900">Success</option>
            </select>
          </div>

          {/* Village Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Sectors</option>
              <option value="VILLAGE-A" className="bg-slate-900">Sector Alpha (Darbhanga)</option>
              <option value="VILLAGE-B" className="bg-slate-900">Sector Bravo (Sitamarhi)</option>
              <option value="VILLAGE-C" className="bg-slate-900">Sector Charlie (Madhubani)</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title={`Sort order: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Event Stream Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audit Stream ({sortedLogs.length} entries)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Sorted by timestamp ({sortOrder === 'desc' ? 'descending' : 'ascending'})
          </span>
        </div>

        {sortedLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">No log entries matched your filter parameters</p>
            <p className="text-slate-500 text-xs mt-1">Try resetting the search keyword or selecting "All Categories".</p>
            <button
              onClick={() => { setSearch(''); setCategoryFilter('ALL'); setSeverityFilter('ALL'); setVillageFilter('ALL'); }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-4">Event Title & Details</th>
                  <th className="py-3 px-3">Entity References</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {sortedLogs.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getCategoryBadge(entry.category)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getSeverityBadge(entry.severity)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {entry.title}
                      </div>
                      <div className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">
                        {entry.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                      <div className="flex flex-wrap gap-1">
                        {entry.villageId && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              selectVillage(entry.villageId as VillageId);
                              setActiveSection('geographic');
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer hover:text-cyan-300 border border-slate-700"
                            title="View village on map"
                          >
                            {state.villages[entry.villageId]?.district || entry.villageId}
                          </span>
                        )}
                        {entry.nodeId && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSection('monitoring');
                            }}
                            className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-mono text-[10px] cursor-pointer border border-cyan-800/50"
                            title="Inspect sensor node"
                          >
                            {entry.nodeId}
                          </span>
                        )}
                        {entry.incidentId && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              selectIncident(entry.incidentId || null);
                              setActiveSection('incidents');
                            }}
                            className="px-1.5 py-0.5 rounded bg-red-950/80 hover:bg-red-900 text-red-300 font-mono text-[10px] cursor-pointer border border-red-800/50"
                            title="View incident details"
                          >
                            {entry.incidentId}
                          </span>
                        )}
                        {entry.droneId && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              selectDrone(entry.droneId || null);
                              setActiveSection('drones');
                            }}
                            className="px-1.5 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-300 font-mono text-[10px] cursor-pointer border border-blue-800/50"
                            title="Inspect drone sortie"
                          >
                            {entry.droneId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="View raw entry payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Payload & Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Audit Log Payload — {selectedEntry.id}</h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-100">{selectedEntry.title}</h4>
                  <p className="text-xs text-slate-400">{selectedEntry.description}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {getCategoryBadge(selectedEntry.category)}
                  {getSeverityBadge(selectedEntry.severity)}
                </div>
              </div>

              {/* Entity metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Timestamp</span>
                  <span className="text-slate-200 font-mono">{selectedEntry.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Sector Village</span>
                  <span className="text-slate-200">
                    {selectedEntry.villageId ? state.villages[selectedEntry.villageId]?.name || selectedEntry.villageId : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Telemetry Node</span>
                  <span className="text-slate-200 font-mono">{selectedEntry.nodeId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Incident ID</span>
                  <span className="text-slate-200 font-mono">{selectedEntry.incidentId || 'N/A'}</span>
                </div>
              </div>

              {/* JSON Payload viewer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-400">Raw JSON Payload</span>
                  <button
                    onClick={() => copyEntryJson(selectedEntry)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedEntry, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
