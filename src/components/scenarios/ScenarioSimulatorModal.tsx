import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Zap, 
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import type { SimulationScenarioId } from '../../types';

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScenarioMeta {
  id: SimulationScenarioId;
  code: string;
  title: string;
  category: 'BASELINE' | 'SINGLE_SENSOR' | 'STRUCTURAL' | 'PROXIMITY' | 'COMPOUND' | 'MULTI_SECTOR' | 'NETWORK';
  badgeColor: string;
  description: string;
  simulatedReadings: string;
  expectedRiskScore: string;
  expectedIncident: string;
  supportsTargetNode: boolean;
}

const SCENARIO_METADATA: ScenarioMeta[] = [
  {
    id: 'NORMAL',
    code: 'Scenario A',
    title: 'Normal Baseline Conditions',
    category: 'BASELINE',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    description: 'All distributed nodes report normal baseline telemetry. Strictly bounds temperatures to 27.0°C–28.0°C, normal humidity (45%–70%), stable LiDAR (~4.8m), and baseline micro-vibrations (0.04g).',
    simulatedReadings: 'Temp: 27.6°C • Hum: 64% • Motion: None • LiDAR: 4.8m • Vib: 0.04g',
    expectedRiskScore: '12 / 100 (NORMAL)',
    expectedIncident: 'Zero alerts triggered; network status ONLINE',
    supportsTargetNode: false,
  },
  {
    id: 'TEMP_ANOMALY',
    code: 'Scenario B',
    title: 'Temperature Anomaly',
    category: 'SINGLE_SENSOR',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    description: 'Elevates selected node ambient temperature above the configured warning threshold (>35°C), simulating rapid heat index buildup.',
    simulatedReadings: 'Temp: 37.4°C (WARNING) • Hum: 62% • Motion: None • LiDAR: 4.8m • Vib: 0.04g',
    expectedRiskScore: '28–35 / 100 (WARNING)',
    expectedIncident: 'WARNING incident created with trigger "Elevated ambient temperature"',
    supportsTargetNode: true,
  },
  {
    id: 'HIGH_HUMIDITY',
    code: 'Scenario C',
    title: 'High Humidity Anomaly',
    category: 'SINGLE_SENSOR',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    description: 'Surges relative humidity above configured warning threshold (>80%), indicating heavy rainfall or monsoon air saturation.',
    simulatedReadings: 'Temp: 27.5°C • Hum: 87% (WARNING) • Motion: None • LiDAR: 4.6m • Vib: 0.04g',
    expectedRiskScore: '24–32 / 100 (WARNING)',
    expectedIncident: 'WARNING incident created with trigger "High atmospheric humidity"',
    supportsTargetNode: true,
  },
  {
    id: 'STRUCTURAL_VIBRATION',
    code: 'Scenario D',
    title: 'Structural Vibration Hazard',
    category: 'STRUCTURAL',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    description: 'Vibration magnitude crosses critical threshold (>=0.30g), simulating mechanical failure, foundation shift, or seismic tremors.',
    simulatedReadings: 'Temp: 27.6°C • Hum: 60% • Motion: None • LiDAR: 4.8m • Vib: 0.38g (CRITICAL)',
    expectedRiskScore: '55–65 / 100 (HIGH RISK / CRITICAL)',
    expectedIncident: 'CRITICAL incident created; eligible for immediate drone dispatch',
    supportsTargetNode: true,
  },
  {
    id: 'PROXIMITY_HAZARD',
    code: 'Scenario E',
    title: 'Proximity Hazard (LiDAR Obstacle / Water Rise)',
    category: 'PROXIMITY',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    description: 'LiDAR rangefinder detects proximity distance below critical threshold (<=1.5m), simulating flash flood surface rise or obstacle collapse.',
    simulatedReadings: 'Temp: 27.4°C • Hum: 68% • Motion: None • LiDAR: 1.1m (CRITICAL) • Vib: 0.04g',
    expectedRiskScore: '55–65 / 100 (HIGH RISK / CRITICAL)',
    expectedIncident: 'CRITICAL incident created; triggers flood reconnaissance flight recommendation',
    supportsTargetNode: true,
  },
  {
    id: 'COMBINED_ANOMALY',
    code: 'Scenario F',
    title: 'Combined Multi-Sensor Anomaly',
    category: 'COMPOUND',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    description: 'Multiple concurrent sensor anomalies across humidity, motion, LiDAR, and vibration. Evaluates deterministic compounding rules and multi-sensor correlations.',
    simulatedReadings: 'Temp: 27.8°C • Hum: 86% • Motion: DETECTED • LiDAR: 1.1m • Vib: 0.37g',
    expectedRiskScore: '92–98 / 100 (CRITICAL)',
    expectedIncident: 'CRITICAL compound incident; triggers priority score 92+ and auto-dispatch eligibility',
    supportsTargetNode: true,
  },
  {
    id: 'MULTI_VILLAGE',
    code: 'Scenario G',
    title: 'Multi-Village Concurrent Incident',
    category: 'MULTI_SECTOR',
    badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
    description: 'Simultaneously triggers alerts across multiple villages (Village B: Sitamarhi & Village C: Madhubani) to test fleet arbitration and priority ranking.',
    simulatedReadings: 'Village B (BIH-SIT-001): LiDAR 1.2m, Vib 0.34g • Village C (BIH-MAD-001): Hum 88%, Temp 36.5°C',
    expectedRiskScore: 'Village B: 85 (CRITICAL) • Village C: 48 (WARNING)',
    expectedIncident: 'Two simultaneous sector incidents; demonstrates alert ranking criteria',
    supportsTargetNode: false,
  },
  {
    id: 'NODE_OFFLINE',
    code: 'Scenario H',
    title: 'Sensor Node Offline / Telemetry Stale',
    category: 'NETWORK',
    badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
    description: 'Simulates RF transceiver failure or battery depletion. The node stops transmitting live packets and is clearly flagged with STALE telemetry.',
    simulatedReadings: 'Status: OFFLINE • Signal: 0% • Latency: 9999ms • Data: STALE (last cached)',
    expectedRiskScore: '50 / 100 (WARNING - Network Stale Alert)',
    expectedIncident: 'Node marked OFFLINE; RF alert logged; data presented with stale badge',
    supportsTargetNode: true,
  },
];

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { state, setScenario, resetSimulation } = useNetwork();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('BIH-SIT-001');
  const [activeScenarioDetail, setActiveScenarioDetail] = useState<ScenarioMeta>(SCENARIO_METADATA[5]); // Default F
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const nodeOptions = Object.values(state.sensorNodes).map((n) => ({
    id: n.nodeId,
    label: `${n.nodeId} (${n.district} - ${n.villageId})`,
  }));

  const handleTriggerScenario = (sc: ScenarioMeta) => {
    setActiveScenarioDetail(sc);
    if (sc.supportsTargetNode) {
      setScenario(sc.id, selectedNodeId);
      setLastActionMessage(`Successfully injected ${sc.code} (${sc.title}) into target node [${selectedNodeId}].`);
    } else {
      setScenario(sc.id);
      setLastActionMessage(`Successfully activated ${sc.code} (${sc.title}) across target sectors.`);
    }

    setTimeout(() => {
      setLastActionMessage(null);
    }, 4000);
  };

  const handleReset = () => {
    resetSimulation();
    setLastActionMessage('System successfully reset: All nodes restored to normal 27°C–28°C baseline conditions.');
    setTimeout(() => {
      setLastActionMessage(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Deterministic Scenario Simulator</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Session 7 Specification
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute reproducible multi-sensor environmental anomalies (Scenarios A through H) with immediate risk recalculation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shadow-sm"
              title="Reset all sensor nodes back to clean normal baseline (27°C-28°C)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset to Normal</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Bar */}
        {lastActionMessage && (
          <div className="px-5 py-2.5 bg-cyan-950/80 border-b border-cyan-500/30 flex items-center space-x-2 text-xs text-cyan-200 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">{lastActionMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/50">
          {/* Target Node Selection Toolbar */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Target Node For Anomaly Injection:
              </label>
              <p className="text-[11px] text-slate-400">
                Single-sensor, compound, and offline scenarios will be applied to this selected node.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                {nodeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-800">
                Status: {state.sensorNodes[selectedNodeId]?.status || 'ONLINE'}
              </span>
            </div>
          </div>

          {/* 8 Scenarios Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Available Test Scenarios (Master Prompt Section 12)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {SCENARIO_METADATA.map((sc) => {
                const isSelected = activeScenarioDetail.id === sc.id;
                const isCurrentlyActive = state.activeScenario === sc.id;

                return (
                  <div
                    key={sc.id}
                    className={`rounded-xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                    onClick={() => setActiveScenarioDetail(sc)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">
                          {sc.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${sc.badgeColor}`}>
                          {isCurrentlyActive ? 'ACTIVE' : sc.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-xs mb-1.5 leading-snug">
                        {sc.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed mb-3">
                        {sc.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">
                        {sc.supportsTargetNode ? selectedNodeId : 'All Villages'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerScenario(sc);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                          isCurrentlyActive
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 hover:bg-cyan-700 text-slate-200'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>Inject</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Scenario Deep Inspection Card */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold mr-2">
                  {activeScenarioDetail.code}
                </span>
                <span className="text-sm font-bold text-slate-100">
                  {activeScenarioDetail.title} — Expected Behavioral Contract
                </span>
              </div>
              <button
                onClick={() => handleTriggerScenario(activeScenarioDetail)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-cyan-950/50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trigger This Scenario Now</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-mono text-[10px] uppercase mb-1">
                  1. Injected Sensor Telemetry
                </span>
                <p className="font-mono text-slate-200 leading-relaxed">
                  {activeScenarioDetail.simulatedReadings}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-mono text-[10px] uppercase mb-1">
                  2. Risk Engine Output
                </span>
                <p className="font-mono text-cyan-300 font-bold leading-relaxed">
                  {activeScenarioDetail.expectedRiskScore}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-mono text-[10px] uppercase mb-1">
                  3. Incident Generation & Actions
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {activeScenarioDetail.expectedIncident}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Note: Sensor changes take effect immediately across all dashboard pages (Overview, Live Monitoring, Map, Incident Management, and Analytics).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Deterministic simulation rules per project specification</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
