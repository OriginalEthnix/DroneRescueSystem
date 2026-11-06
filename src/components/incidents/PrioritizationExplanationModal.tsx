import React from 'react';
import { 
  X, 
  ArrowUpDown, 
  Layers, 
  Sparkles
} from 'lucide-react';
import type { Incident } from '../../types';

interface PrioritizationExplanationModalProps {
  incident: Incident | null;
  allIncidents: Incident[];
  isOpen: boolean;
  onClose: () => void;
}

export const PrioritizationExplanationModal: React.FC<PrioritizationExplanationModalProps> = ({
  incident,
  allIncidents,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !incident) return null;

  const breakdown = incident.priorityBreakdown;

  // Find rank among all active incidents
  const activeSorted = [...allIncidents]
    .filter((i) => i.status !== 'RESOLVED')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const currentRank = activeSorted.findIndex((i) => i.id === incident.id) + 1;
  const totalActive = activeSorted.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Alert Prioritization Breakdown</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Rank #{currentRank || 1} of {totalActive}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Incident: {incident.id} • Village: {incident.villageName} ({incident.nodeId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/50">
          {/* Top Score Summary Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-slate-950 to-cyan-950/40 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                Composite Operational Priority Score
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-cyan-300">
                  {incident.priorityScore}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 200 Max Weighted Points</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {incident.severity === 'CRITICAL'
                  ? 'High urgency: Demands immediate operator arbitration and UAV flight sortie.'
                  : 'Moderate urgency: Continuous telemetry monitoring and queued inspection.'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-right font-mono text-xs">
              <span className="text-slate-500 block uppercase text-[10px]">Severity</span>
              <span className={`font-bold ${incident.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                {incident.severity}
              </span>
              <span className="text-slate-500 block uppercase text-[10px] mt-1">Risk Index</span>
              <span className="font-bold text-slate-200">{incident.riskScore}/100</span>
            </div>
          </div>

          {/* 5 Prioritization Criteria Table */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Prioritization Formula & Weight Distribution
              </h3>
              <span className="text-[11px] font-mono text-cyan-400">
                Master Prompt Section 12 Feature 4
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {breakdown ? (
                breakdown.factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block text-xs">
                        {factor.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        {factor.detail}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs shrink-0">
                      +{factor.score} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400">
                  Priority explanation: {incident.priorityExplanation}
                </div>
              )}
            </div>
          </div>

          {/* Comparative Ranking Analysis (Why This Incident Ranks Above Another) */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Comparative Ranking Justification</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Incidents are sorted deterministically so that the most urgent multi-hazard event in a populated rural sector receives aerial resources first.
              An incident with <strong>CRITICAL</strong> severity (+50) and elevated risk score (+45–95) ranks ahead of <strong>WARNING</strong> incidents (+20), 
              even if older, because life-safety and floodwall failure take precedence over isolated ambient temperature changes.
            </p>

            {activeSorted.length > 1 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                <span className="text-slate-500 block uppercase text-[10px]">Current Active Queue Ranking:</span>
                {activeSorted.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.id}
                    className={`flex justify-between items-center py-1 px-2 rounded ${
                      item.id === incident.id ? 'bg-cyan-950/50 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <span>#{idx + 1} {item.id} ({item.villageName})</span>
                    <span>Score: {item.priorityScore} • {item.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Deterministic 5-criteria ranking engine</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
