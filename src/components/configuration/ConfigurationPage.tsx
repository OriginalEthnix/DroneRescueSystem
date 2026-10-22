import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  RotateCcw, 
  Save, 
  CheckCircle, 
  Thermometer, 
  Droplets, 
  Compass, 
  Gauge,
  Plane
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import { DEFAULT_THRESHOLDS } from '../../constants/initialState';
import type { ThresholdConfig } from '../../types';

export const ConfigurationPage: React.FC = () => {
  const { state, updateThresholds, resetSimulation } = useNetwork();

  const [formThresholds, setFormThresholds] = useState<ThresholdConfig>(state.thresholds);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    updateThresholds(formThresholds);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all thresholds and weights back to default values?')) {
      setFormThresholds(DEFAULT_THRESHOLDS);
      updateThresholds(DEFAULT_THRESHOLDS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">System Thresholds & Risk Engine Configuration</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Tune environmental hazard warning and critical thresholds, scoring weights, simulation tick rate, and drone dispatch boundaries.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Configuration updated successfully! New thresholds are actively evaluated across all simulation ticks.</span>
        </div>
      )}

      {/* Grid of Configuration Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Environmental Sensor Thresholds */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Sensor Hazard Thresholds</span>
          </h3>

          {/* Temperature */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>Temperature Thresholds (°C)</span>
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Warning (&gt;)</span>
                <input
                  type="number"
                  step="0.5"
                  value={formThresholds.temperature.warningMin}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    temperature: { ...formThresholds.temperature, warningMin: parseFloat(e.target.value) || 35 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Critical (&gt;)</span>
                <input
                  type="number"
                  step="0.5"
                  value={formThresholds.temperature.criticalMax}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    temperature: { ...formThresholds.temperature, criticalMax: parseFloat(e.target.value) || 40 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>Atmospheric Humidity Thresholds (%)</span>
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Warning (&gt;)</span>
                <input
                  type="number"
                  value={formThresholds.humidity.warningMin}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    humidity: { ...formThresholds.humidity, warningMin: parseFloat(e.target.value) || 80 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Critical (&gt;)</span>
                <input
                  type="number"
                  value={formThresholds.humidity.criticalMax}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    humidity: { ...formThresholds.humidity, criticalMax: parseFloat(e.target.value) || 90 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>

          {/* LiDAR Distance */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>LiDAR Distance Thresholds (meters)</span>
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Warning Distance (&le;)</span>
                <input
                  type="number"
                  step="0.1"
                  value={formThresholds.lidar.warningDistance}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    lidar: { ...formThresholds.lidar, warningDistance: parseFloat(e.target.value) || 3.0 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Critical Proximity (&le;)</span>
                <input
                  type="number"
                  step="0.1"
                  value={formThresholds.lidar.criticalDistance}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    lidar: { ...formThresholds.lidar, criticalDistance: parseFloat(e.target.value) || 1.5 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>

          {/* Vibration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Structural Vibration Thresholds (g)</span>
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Warning (&ge;)</span>
                <input
                  type="number"
                  step="0.01"
                  value={formThresholds.vibration.warningG}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    vibration: { ...formThresholds.vibration, warningG: parseFloat(e.target.value) || 0.15 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Critical (&ge;)</span>
                <input
                  type="number"
                  step="0.01"
                  value={formThresholds.vibration.criticalG}
                  onChange={(e) => setFormThresholds({
                    ...formThresholds,
                    vibration: { ...formThresholds.vibration, criticalG: parseFloat(e.target.value) || 0.30 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Risk Engine & Drone Dispatch Weights */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Plane className="w-4 h-4 text-indigo-400" />
            <span>Risk Scoring & Dispatch Boundaries</span>
          </h3>

          {/* Drone Dispatch Threshold */}
          <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">Autonomous Dispatch Eligibility Cutoff:</span>
              <span className="text-cyan-400 font-mono font-bold">{formThresholds.riskScoring.droneDispatchThreshold}/100</span>
            </div>
            <input
              type="range"
              min="40"
              max="90"
              value={formThresholds.riskScoring.droneDispatchThreshold}
              onChange={(e) => setFormThresholds({
                ...formThresholds,
                riskScoring: { ...formThresholds.riskScoring, droneDispatchThreshold: parseInt(e.target.value) || 60 }
              })}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500">
              Incidents with risk score meeting or exceeding this threshold automatically present the [DISPATCH DRONE] action button.
            </p>
          </div>

          {/* Multi-Anomaly Multiplier */}
          <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">Multi-Sensor Compounding Factor:</span>
              <span className="text-purple-400 font-mono font-bold">{formThresholds.riskScoring.weights.multiAnomalyMultiplier}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.05"
              value={formThresholds.riskScoring.weights.multiAnomalyMultiplier}
              onChange={(e) => setFormThresholds({
                ...formThresholds,
                riskScoring: {
                  ...formThresholds.riskScoring,
                  weights: { ...formThresholds.riskScoring.weights, multiAnomalyMultiplier: parseFloat(e.target.value) || 1.25 }
                }
              })}
              className="w-full accent-purple-500"
            />
            <p className="text-[10px] text-slate-500">
              Multiplier applied to the cumulative hazard score when 2 or more sensors report simultaneous anomalies.
            </p>
          </div>

          {/* Simulation Tick Frequency */}
          <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">Simulation Update Interval:</span>
              <span className="text-emerald-400 font-mono font-bold">{formThresholds.simulationIntervalMs} ms</span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000"
              step="250"
              value={formThresholds.simulationIntervalMs}
              onChange={(e) => setFormThresholds({
                ...formThresholds,
                simulationIntervalMs: parseInt(e.target.value) || 2500
              })}
              className="w-full accent-emerald-500"
            />
            <p className="text-[10px] text-slate-500">
              Frequency of coherent environmental sensor drift (master prompt default: 2000–3000 ms).
            </p>
          </div>

          {/* Factory Reset Danger Zone */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Wipe all local simulation history, reset drones, clear alerts, and restore fresh initial state?')) {
                  resetSimulation();
                }
              }}
              className="w-full py-2 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-500/40 text-xs font-mono font-bold transition-colors"
            >
              Factory Reset Application LocalStorage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
