import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertCircle, 
  Radio, 
  Plane, 
  Clock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

import { useNetwork } from '../../context/useNetwork';


export const TopBar: React.FC = () => {
  const { 
    state, 
    toggleSimulation, 
    setSimulationSpeed, 
    resetSimulation 
  } = useNetwork();

  const activeIncidents = Object.values(state.incidents).filter(
    (inc) => inc.status !== 'RESOLVED'
  );
  const criticalIncidentsCount = activeIncidents.filter((inc) => inc.severity === 'CRITICAL').length;
  const onlineNodesCount = Object.values(state.sensorNodes).filter((n) => n.status === 'ONLINE').length;
  const totalNodesCount = Object.keys(state.sensorNodes).length;
  const availableDronesCount = Object.values(state.drones).filter((d) => d.status === 'AVAILABLE').length;
  const totalDronesCount = Object.keys(state.drones).length;

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--:--';
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      {/* Title & Simulation Badge */}
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-sm md:text-base tracking-wide text-slate-100 uppercase">
              Distributed Environmental Intelligence Network
            </h1>
            {/* Required prominent simulation disclaimer badge */}
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Simulation Mode</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-normal">
            Real-Time Hazard Monitoring & Autonomous Drone Response
          </p>
        </div>
      </div>

      {/* KPI Counters & Telemetry Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* System Health */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-slate-400">System:</span>
          <span className="font-mono font-medium text-[11px] text-emerald-400">READY</span>
        </div>

        {/* Active Incidents */}
        <div className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-2 ${
          criticalIncidentsCount > 0 
            ? 'bg-red-950/50 border-red-500/50 text-red-300' 
            : activeIncidents.length > 0
            ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}>
          <AlertCircle className={`w-3.5 h-3.5 ${criticalIncidentsCount > 0 ? 'text-red-400 animate-bounce' : 'text-slate-400'}`} />
          <span className="text-[11px] text-slate-400">Alerts:</span>
          <span className="font-mono font-bold text-[11px]">
            {activeIncidents.length}
            {criticalIncidentsCount > 0 && <span className="text-red-400 ml-1">({criticalIncidentsCount} CRIT)</span>}
          </span>
        </div>

        {/* Online Nodes */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-400">Nodes:</span>
          <span className="font-mono font-medium text-[11px] text-slate-200">
            {onlineNodesCount}/{totalNodesCount}
          </span>
        </div>

        {/* Available Drones */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
          <Plane className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400">Drones:</span>
          <span className="font-mono font-medium text-[11px] text-indigo-300">
            {availableDronesCount}/{totalDronesCount} AVAIL
          </span>
        </div>

        {/* Last Simulation Clock */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] text-slate-400">Updated:</span>
          <span className="font-mono text-[11px] text-slate-300">
            {formatTimestamp(state.lastTickTimestamp)}
          </span>
        </div>

        {/* Simulation Controls Group */}
        <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm ${
              state.simulationRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
            title={state.simulationRunning ? 'Pause real-time simulation updates' : 'Start real-time simulation engine'}
          >
            {state.simulationRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Simulate</span>
              </>
            )}
          </button>

          {/* Speed multiplier selector */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  state.simulationSpeed === spd
                    ? 'bg-cyan-900/80 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Run simulation at ${spd}x speed`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              if (window.confirm('Reset the simulation back to initial normal baseline (27°C-28°C) and clear active missions?')) {
                resetSimulation();
              }
            }}
            className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
            title="Reset system to initial normal state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
