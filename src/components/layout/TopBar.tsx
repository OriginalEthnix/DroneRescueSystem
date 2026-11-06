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
  ShieldCheck,
  Menu
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';

interface TopBarProps {
  onOpenDemo?: () => void;
  onOpenSimulator?: () => void;
  onOpenNetworkHealth?: () => void;
  onOpenCorrelations?: () => void;
  onOpenResetConfirm?: () => void;
  onToggleMobileNav?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onOpenDemo,
  onOpenSimulator,
  onOpenNetworkHealth,
  onOpenCorrelations,
  onOpenResetConfirm,
  onToggleMobileNav
}) => {
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
  const onlineNodesCount = Object.values(state.sensorNodes).filter((n) => n.status === 'ONLINE' && !n.isStale).length;
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

  const handleResetClick = () => {
    if (onOpenResetConfirm) {
      onOpenResetConfirm();
    } else {
      // Safe fallback: restore baseline without wiping data
      resetSimulation('baseline');
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
      {/* Left Area: Title, Badges, and Subtitle */}
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 md:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 shrink-0 mt-0.5"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          {/* Row 1: Project Title + Simulation Mode Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-extrabold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-[26px] text-slate-100 tracking-tight leading-tight">
              AI-Based Multi-Agent Swarm Robot System for Autonomous Disaster and Rescue Using Reinforcement Learning
            </h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Simulation Mode</span>
            </span>
          </div>

          {/* Row 2: Action Feature Launcher Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {onOpenSimulator && (
              <button
                onClick={onOpenSimulator}
                className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shrink-0"
                title="Open 8-Scenario Simulator (Scenarios A through H)"
                aria-label="Open 8-Scenario Simulator"
              >
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                <span>Scenarios (A–H)</span>
              </button>
            )}

            {onOpenNetworkHealth && (
              <button
                onClick={onOpenNetworkHealth}
                className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                title="Open Wireless Mesh Network Health & RF Diagnostics"
                aria-label="Open Wireless Mesh Network Health"
              >
                <Radio className="w-2.5 h-2.5 text-blue-400" />
                <span>Network Health</span>
              </button>
            )}

            {onOpenCorrelations && (
              <button
                onClick={onOpenCorrelations}
                className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
                title="Open Multi-Sensor Correlation Engine"
                aria-label="Open Multi-Sensor Correlation Engine"
              >
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span>Correlations</span>
              </button>
            )}

            {onOpenDemo && (
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 shrink-0"
                title="Launch Guided 12-Step Faculty Demonstration Runner"
                aria-label="Launch Guided Faculty Demonstration Runner"
              >
                <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                <span>Demo Runner</span>
              </button>
            )}
          </div>

          {/* Row 3: Subtitle */}
          <p className="text-[11px] text-slate-400 font-normal leading-tight">
            Real-Time Hazard Monitoring, Multi-Agent Swarm Coordination & Autonomous Drone Rescue Dispatch
          </p>
        </div>
      </div>

      {/* Right Control Area: 2 Neatly Aligned Rows Matching Reference Layout */}
      <div className="flex flex-col items-start lg:items-end gap-1.5 shrink-0">
        {/* Top Row: System Health, Alerts, Nodes */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* System Health */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-400">System:</span>
            <span className="font-mono font-medium text-[11px] text-emerald-400">READY</span>
          </div>

          {/* Active Incidents */}
          <div className={`px-2.5 py-1 rounded-lg border flex items-center space-x-2 ${
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
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">Nodes:</span>
            <span className="font-mono font-medium text-[11px] text-slate-200">
              {onlineNodesCount}/{totalNodesCount}
            </span>
          </div>
        </div>

        {/* Bottom Row: Drones, Updated Timestamp, Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Available Drones */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
            <Plane className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] text-slate-400">Drones:</span>
            <span className="font-mono font-medium text-[11px] text-indigo-300">
              {availableDronesCount}/{totalDronesCount} AVAIL
            </span>
          </div>

          {/* Last Simulation Clock */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-400">Updated:</span>
            <span className="font-mono text-[11px] text-slate-300">
              {formatTimestamp(state.lastTickTimestamp)}
            </span>
          </div>

          {/* Simulation Controls Group */}
          <div className="flex items-center space-x-1 pl-1">
            <button
              onClick={toggleSimulation}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                state.simulationRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
              title={state.simulationRunning ? 'Pause real-time simulation updates' : 'Start real-time simulation engine'}
              aria-label={state.simulationRunning ? 'Pause real-time simulation' : 'Start real-time simulation'}
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
                  className={`px-1.5 py-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    state.simulationSpeed === spd
                      ? 'bg-cyan-900/80 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Run simulation at ${spd}x speed`}
                  aria-label={`Set simulation speed to ${spd}x`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Reset button */}
            <button
              onClick={handleResetClick}
              className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Open system reset options"
              aria-label="Open system reset confirmation dialog"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
