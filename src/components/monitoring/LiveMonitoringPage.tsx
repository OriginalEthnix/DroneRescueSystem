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
  Battery
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';


export const LiveMonitoringPage: React.FC = () => {
  const { state, selectNode } = useNetwork();
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

  return (
    <div className="space-y-6">
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
          return (
            <div
              key={node.nodeId}
              onClick={() => selectNode(node.nodeId)}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200 cursor-pointer group"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="font-mono font-bold text-slate-100 text-sm group-hover:text-cyan-400 transition-colors">
                      {node.nodeId}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {node.villageId} • <span className="text-cyan-400">{node.district}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {node.status}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Risk: <span className="text-slate-300 font-bold">{node.riskScore}/100</span>
                  </div>
                </div>
              </div>

              {/* 5 Sensors Readout Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
                {/* Temperature */}
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Temp</div>
                    <div className="font-bold text-slate-200">
                      {node.sensors.temperature.value.toFixed(1)}°C
                    </div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Humidity</div>
                    <div className="font-bold text-slate-200">
                      {node.sensors.humidity.value}%
                    </div>
                  </div>
                </div>

                {/* LiDAR Distance */}
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">LiDAR Dist</div>
                    <div className="font-bold text-slate-200">
                      {node.sensors.lidar.value.toFixed(1)} m
                    </div>
                  </div>
                </div>

                {/* Vibration */}
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center space-x-2">
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
                  {node.sensors.motion.detected ? 'MOTION DETECTED' : 'CLEAR'}
                </span>
              </div>

              {/* Telemetry Health Footnotes */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3 text-cyan-400" />
                  <span>{node.signalQuality}% Signal ({node.latencyMs}ms)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Battery className="w-3 h-3 text-emerald-400" />
                  <span>{node.batteryLevel}% Battery</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
