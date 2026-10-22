import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Thermometer, 
  Compass, 
  ShieldAlert,
  Plane
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useNetwork } from '../../context/useNetwork';

export const AnalyticsPage: React.FC = () => {
  const { state } = useNetwork();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('BIH-SIT-001');

  const selectedNode = state.sensorNodes[selectedNodeId] || Object.values(state.sensorNodes)[0];
  const chartHistory = selectedNode ? selectedNode.history.map((pt, idx) => ({
    time: pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `T-${idx}`,
    temperature: pt.temperature,
    humidity: pt.humidity,
    vibration: pt.vibration,
    lidar: pt.lidarDistance,
    risk: pt.riskScore,
  })) : [];

  // Cross-Village Risk Comparison Data
  const villageRiskData = Object.values(state.villages).map((v) => ({
    name: v.name.replace('Simulated ', ''),
    district: v.district,
    riskScore: v.currentRiskScore,
  }));

  // Alert Severity Distribution Data
  const incidents = Object.values(state.incidents);
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = incidents.filter((i) => i.severity === 'WARNING').length;
  const infoCount = incidents.filter((i) => i.severity === 'INFO').length;

  const severityPieData = [
    { name: 'Critical', value: criticalCount || (incidents.length === 0 ? 0 : 0), color: '#ef4444' },
    { name: 'Warning', value: warningCount || (incidents.length === 0 ? 0 : 0), color: '#f59e0b' },
    { name: 'Info / Resolved', value: infoCount || (incidents.length === 0 ? 1 : 0), color: '#06b6d4' },
  ].filter((d) => d.value > 0);

  // Drone Sortie Duration Benchmarks
  const droneStats = Object.values(state.drones).map((d) => ({
    name: d.callsign,
    battery: d.batteryPercentage,
    completed: d.totalMissionsCompleted,
    speed: d.speedKmh,
  }));

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">Environmental Telemetry & Mission Analytics</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Empirical telemetry trends, multi-sensor cross-correlations, village risk benchmarks, and drone reconnaissance analytics.
          </p>
        </div>

        {/* Node Selector for Time-Series Analysis */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono">Inspect Node:</span>
          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500/50"
          >
            {Object.values(state.sensorNodes).map((node) => (
              <option key={node.nodeId} value={node.nodeId}>
                {node.nodeId} ({node.villageId} - {node.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 1: Temperature & Humidity Multi-Series Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Humidity Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>Temperature (°C) & Humidity (%) History</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Node: {selectedNode.nodeId}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartHistory}>
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vibration & LiDAR Distance Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>LiDAR Distance (m) & Vibration (g)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Real-Time Sensor Fusion</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartHistory}>
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="lidar" name="LiDAR Dist (m)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vibration" name="Vibration (g)" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Village Risk Comparison & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cross-Village Risk Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Cross-Village Risk Index Comparison (0–100)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">North Bihar Sector Benchmark</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={villageRiskData}>
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                />
                <Bar dataKey="riskScore" name="Risk Score" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Severity Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Alert Severity Distribution</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Active incident breakdown across all 3 Bihar sectors.
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-center text-xs font-mono pt-2 border-t border-slate-800">
            <div>
              <span className="text-red-400 font-bold block">{criticalCount}</span>
              <span className="text-slate-500 text-[10px]">Critical</span>
            </div>
            <div>
              <span className="text-amber-400 font-bold block">{warningCount}</span>
              <span className="text-slate-500 text-[10px]">Warning</span>
            </div>
            <div>
              <span className="text-cyan-400 font-bold block">{incidents.length}</span>
              <span className="text-slate-500 text-[10px]">Total Incidents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Drone Reconnaissance Readiness Telemetry */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Plane className="w-4 h-4 text-indigo-400" />
          <span>Autonomous Drone Fleet Telemetry & Readiness</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {droneStats.map((d) => (
            <div key={d.name} className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between items-center text-xs font-mono">
              <div>
                <span className="font-bold text-slate-100 text-sm">{d.name}</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Cruising Speed: {d.speed} km/h • Sorties Completed: {d.completed}</p>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold text-sm">{d.battery}% Battery</span>
                <span className="text-slate-500 text-[10px] block">Darbhanga Station</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
