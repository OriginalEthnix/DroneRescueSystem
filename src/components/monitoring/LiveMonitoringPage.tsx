import React from 'react';
import { 
  Radio, 
  Search, 
  Filter, 
  Thermometer, 
  Droplets, 
  Activity, 
  Compass, 
  Gauge,
  Wifi,
  Battery,
  AlertTriangle,
  RotateCcw,
  PowerOff
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import type { SimulationScenarioId } from '../../types';

export const LiveMonitoringPage: React.FC = () => {
  const { 
    state, 
    setScenario, 
    toggleNodeOffline
  } = useNetwork();

  
  const [search, setSearch] = React.useState('');
  const [districtFilter, setDistrictFilter] = React.useState<string>('ALL');

  const nodes = Object.values(state.sensorNodes).filter((node) => {
    const matchesSearch = 
      node.nodeId.toLowerCase().includes(search.toLowerCase()) ||
      node.district.toLowerCase().includes(search.toLowerCase()) ||
      node.villageId.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = districtFilter === 'ALL' || node.district === districtFilter;
    return matchesSearch && matchesDistrict;
  });

  const scenarioPresets: { id: SimulationScenarioId; label: string; desc: string; badge: string }[] = [
    { id: 'NORMAL', label: 'Scenario A: Normal Baseline', desc: 'All nodes calibrated to 27°C-28°C normal limits', badge: 'bg-emerald-500/20 text-emerald-400' },
    { id: 'TEMP_ANOMALY', label: 'Scenario B: Temperature Rise', desc: 'Node temperature rises above warning threshold (>35°C)', badge: 'bg-amber-500/20 text-amber-400' },
    { id: 'HIGH_HUMIDITY', label: 'Scenario C: High Humidity', desc: 'Atmospheric humidity rises above warning threshold (>80%)', badge: 'bg-blue-500/20 text-blue-400' },
    { id: 'STRUCTURAL_VIBRATION', label: 'Scenario D: Vibration Hazard', desc: 'Vibration crosses critical threshold (0.38g >= 0.30g)', badge: 'bg-red-500/20 text-red-400' },
    { id: 'PROXIMITY_HAZARD', label: 'Scenario E: LiDAR Proximity', desc: 'LiDAR distance falls below critical threshold (1.1m <= 1.5m)', badge: 'bg-red-500/20 text-red-400' },
    { id: 'COMBINED_ANOMALY', label: 'Scenario F: Combined Anomaly', desc: 'Step 4 of demo: Temp, 86% Hum, Motion, 1.1m LiDAR, 0.37g Vib', badge: 'bg-purple-500/20 text-purple-400' },
    { id: 'MULTI_VILLAGE', label: 'Scenario G: Multi-Village Hazard', desc: 'Village B & Village C simultaneously trigger alerts', badge: 'bg-pink-500/20 text-pink-400' },
    { id: 'NODE_OFFLINE', label: 'Scenario H: Node Offline', desc: 'Node disconnected; readings marked stale', badge: 'bg-slate-700 text-slate-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Scenario Trigger Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Reproducible Simulation Scenario Simulator
              </h3>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Inject deterministic multi-sensor anomalies into the live network state to test threshold detections.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-mono text-slate-400">
              Active Scenario: <span className="text-cyan-400 font-bold">{state.activeScenario}</span>
            </span>
            <button
              onClick={() => setScenario('NORMAL')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 border border-slate-700"
              title="Reset all nodes back to normal baseline"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Reset to Normal</span>
            </button>
          </div>
        </div>

        {/* 8 Preset Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {scenarioPresets.map((sc) => {
            const isActive = state.activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setScenario(sc.id)}
                className={`p-2 rounded-lg text-left transition-all border flex flex-col justify-between ${
                  isActive
                    ? 'bg-cyan-950/80 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
                title={sc.desc}
              >
                <div className="text-[11px] font-bold text-slate-200 line-clamp-1">{sc.label.split(':')[1]}</div>
                <div className="text-[9px] text-slate-400 mt-1 line-clamp-1">{sc.label.split(':')[0]}</div>
                <span className={`px-1 py-0.2 rounded text-[8px] font-mono mt-1 self-start ${sc.badge}`}>
                  {isActive ? 'ACTIVE' : 'READY'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header and Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">Live Environmental Telemetry Grid</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time multi-sensor telemetry across distributed nodes in North Bihar. Initial temperatures calibrated to normal baseline 27°C–28°C.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search node or district..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-44 md:w-56"
            />
          </div>

          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            {(['ALL', 'Darbhanga', 'Sitamarhi', 'Madhubani'] as const).map((dist) => (
              <button
                key={dist}
                onClick={() => setDistrictFilter(dist)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  districtFilter === dist
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dist}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Node Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const isOffline = node.status === 'OFFLINE' || node.isStale;

          return (
            <div
              key={node.nodeId}
              className={`bg-slate-900/80 border rounded-xl p-4 transition-all duration-200 flex flex-col justify-between ${
                node.status === 'CRITICAL'
                  ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  : node.status === 'WARNING'
                  ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : isOffline
                  ? 'border-slate-800 opacity-75'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isOffline 
                          ? 'bg-slate-600' 
                          : node.status === 'CRITICAL' 
                          ? 'bg-red-500 animate-ping' 
                          : node.status === 'WARNING'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-400'
                      }`} />
                      <h3 className="font-mono font-bold text-slate-100 text-sm">
                        {node.nodeId}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {node.villageId} • <span className="text-cyan-400">{node.district}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isOffline
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : node.status === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : node.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {node.status}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Risk: <span className={`font-bold ${
                        node.riskScore >= 60 ? 'text-red-400' : node.riskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{node.riskScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* Stale Warning Banner if offline */}
                {isOffline && (
                  <div className="mb-3 p-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-amber-400 flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Telemetry Stale: Node offline or signal disconnected.</span>
                  </div>
                )}

                {/* 5 Sensors Readout Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
                  {/* Temperature */}
                  <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
                    node.sensors.temperature.status === 'CRITICAL'
                      ? 'bg-red-950/40 border-red-500/40'
                      : node.sensors.temperature.status === 'WARNING'
                      ? 'bg-amber-950/40 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Temp</div>
                      <div className="font-bold text-slate-200">
                        {node.sensors.temperature.value.toFixed(1)}°C
                      </div>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
                    node.sensors.humidity.status === 'CRITICAL'
                      ? 'bg-red-950/40 border-red-500/40'
                      : node.sensors.humidity.status === 'WARNING'
                      ? 'bg-amber-950/40 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Humidity</div>
                      <div className="font-bold text-slate-200">
                        {node.sensors.humidity.value}%
                      </div>
                    </div>
                  </div>

                  {/* LiDAR Distance */}
                  <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
                    node.sensors.lidar.status === 'CRITICAL'
                      ? 'bg-red-950/40 border-red-500/40'
                      : node.sensors.lidar.status === 'WARNING'
                      ? 'bg-amber-950/40 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">LiDAR Dist</div>
                      <div className="font-bold text-slate-200">
                        {node.sensors.lidar.value.toFixed(1)} m
                      </div>
                    </div>
                  </div>

                  {/* Vibration */}
                  <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
                    node.sensors.vibration.status === 'CRITICAL'
                      ? 'bg-red-950/40 border-red-500/40'
                      : node.sensors.vibration.status === 'WARNING'
                      ? 'bg-amber-950/40 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Vibration</div>
                      <div className="font-bold text-slate-200">
                        {node.sensors.vibration.value.toFixed(2)} g
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motion Sensor Status Full-width */}
                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs mb-3">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-500" />
                    <span>PIR Motion Sensor:</span>
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${
                    node.sensors.motion.detected ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                  }`}>
                    {node.sensors.motion.detected ? `MOTION DETECTED (${node.sensors.motion.detectionCount}x)` : 'CLEAR'}
                  </span>
                </div>

                {/* Contributing Risk Factors */}
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-3 text-[11px]">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Risk Factors</div>
                  <ul className="space-y-0.5 text-slate-300">
                    {node.contributingFactors.slice(0, 2).map((factor, idx) => (
                      <li key={idx} className="truncate text-[10px] text-slate-400">
                        • {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Telemetry & Node Offline Toggle */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3 text-cyan-400" />
                  <span>{node.signalQuality}% Signal ({node.latencyMs}ms)</span>
                </span>

                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1">
                    <Battery className="w-3 h-3 text-emerald-400" />
                    <span>{node.batteryLevel.toFixed(1)}%</span>
                  </span>
                  
                  {/* Node Online/Offline Toggle */}
                  <button
                    onClick={() => toggleNodeOffline(node.nodeId)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                    title={isOffline ? 'Re-connect node to network' : 'Simulate signal loss / node disconnect'}
                  >
                    <PowerOff className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
