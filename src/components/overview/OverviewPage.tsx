import React from 'react';
import { 
  Building2, 
  Radio, 
  AlertTriangle, 
  Plane, 
  MapPin, 
  Compass, 
  ArrowUpRight,
  TrendingDown,
  Clock
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';


export const OverviewPage: React.FC = () => {
  const { state, setActiveSection, selectVillage, selectNode } = useNetwork();

  const villages = Object.values(state.villages);
  const sensorNodes = Object.values(state.sensorNodes);
  const incidents = Object.values(state.incidents);
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const criticalIncidents = activeIncidents.filter((i) => i.severity === 'CRITICAL');
  const availableDrones = Object.values(state.drones).filter((d) => d.status === 'AVAILABLE');
  const activeMissions = Object.values(state.missions).filter((m) => m.status !== 'AVAILABLE');

  // Compute average network risk score
  const avgRisk = Math.round(
    sensorNodes.reduce((acc, curr) => acc + curr.riskScore, 0) / (sensorNodes.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Bihar Sector Command Center</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Monitoring 3 rural districts (Darbhanga, Sitamarhi, Madhubani) with distributed multi-sensor environmental nodes. 
              Integrated with rule-based automated risk telemetry and simulated autonomous drone aerial verification.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setActiveSection('monitoring')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Inspect Nodes</span>
            </button>
            <button
              onClick={() => setActiveSection('geographic')}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-lg shadow-cyan-950/40"
            >
              <MapPin className="w-4 h-4" />
              <span>Interactive Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Nodes */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Total Nodes</span>
            <Radio className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{sensorNodes.length}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center space-x-1">
            <span>100% telemetry online</span>
          </div>
        </div>

        {/* Online Nodes */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Online Nodes</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {sensorNodes.filter((n) => n.status === 'ONLINE').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">0 disconnected</div>
        </div>

        {/* Active Incidents */}
        <div className={`p-3.5 rounded-xl border ${
          activeIncidents.length > 0 
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' 
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-400">Active Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${activeIncidents.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl font-bold font-mono">{activeIncidents.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold violations</div>
        </div>

        {/* Critical Alerts */}
        <div className={`p-3.5 rounded-xl border ${
          criticalIncidents.length > 0 
            ? 'bg-red-950/40 border-red-500/50 text-red-200' 
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-400">Critical Alerts</span>
            <span className={`w-2 h-2 rounded-full ${criticalIncidents.length > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
          </div>
          <div className="text-xl font-bold font-mono text-red-400">{criticalIncidents.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Immediate priority</div>
        </div>

        {/* Available Drones */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Avail Drones</span>
            <Plane className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">{availableDrones.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Darbhanga Hub</div>
        </div>

        {/* Active Missions */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Missions Active</span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">{activeMissions.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Air sorties en route</div>
        </div>

        {/* Average Risk */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Avg Risk Score</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">{avgRisk}/100</div>
          <div className="text-[10px] text-slate-500 mt-0.5 uppercase">NORMAL STATUS</div>
        </div>
      </div>

      {/* Bihar Village Summary Grid */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Monitored Bihar Locations</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">North Bihar Geographic Sector</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {villages.map((village) => {
            const villageNodes = village.nodeIds.map((id) => state.sensorNodes[id]).filter(Boolean);

            return (

              <div 
                key={village.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{village.name}</h4>
                    <p className="text-xs text-cyan-400 font-mono">District: {village.district}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    village.status === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : village.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {village.status}
                  </span>
                </div>

                <p className="text-slate-400 text-xs mb-3 line-clamp-2">
                  {village.primaryConcern}
                </p>

                {/* Node Pill List */}
                <div className="space-y-1.5 mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Sensor Nodes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {villageNodes.map((node) => (
                      <button
                        key={node.nodeId}
                        onClick={() => {
                          selectNode(node.nodeId);
                          setActiveSection('monitoring');
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center space-x-1 border border-slate-700/60"
                        title="Click to view sensor telemetry"
                      >
                        <Radio className="w-2.5 h-2.5 text-cyan-400" />
                        <span>{node.nodeId}</span>
                        <span className="text-[9px] text-slate-400">({node.sensors.temperature.value}°C)</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div className="font-mono text-slate-400 text-[11px]">
                    Risk Score: <span className="text-slate-200 font-bold">{village.currentRiskScore}/100</span>
                  </div>
                  <button
                    onClick={() => {
                      selectVillage(village.id);
                      setActiveSection('geographic');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center space-x-1 font-medium"
                  >
                    <span>View Map</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Map Preview & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Snapshot & Quick Nav */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Geographic Intelligence Overview</span>
              </h3>
              <button 
                onClick={() => setActiveSection('geographic')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Expand Live Map →
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Geographic monitoring of simulated flood corridors in North Bihar. Sensor nodes stream localized temperature, humidity, LiDAR distance, and structural vibration metrics.
            </p>
          </div>

          <div 
            onClick={() => setActiveSection('geographic')}
            className="h-56 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all p-4 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/80 to-slate-950" />
            <div className="relative z-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-cyan-950/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div className="font-semibold text-sm text-slate-200">Interactive Bihar Map Engine</div>
              <p className="text-slate-400 text-xs max-w-sm">
                Click to inspect active village coordinates, sensor telemetry markers, drone base at Darbhanga, and simulated flight trajectories.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Real-Time Event Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Audit Feed</span>
            </h3>
            <button 
              onClick={() => setActiveSection('event-log')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              All Logs →
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[260px] pr-1">
            {state.eventLogs.slice(0, 5).map((log) => (
              <div 
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px]">{log.title}</span>
                  <span className="font-mono text-[9px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] line-clamp-2">{log.description}</p>
                <div className="flex items-center space-x-1.5 pt-0.5">
                  <span className={`px-1 py-0.2 rounded text-[9px] font-mono uppercase ${
                    log.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400'
                      : log.severity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-cyan-400'
                  }`}>
                    {log.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
