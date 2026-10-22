import React from 'react';
import { Construction, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import type { NavigationSection } from '../../types';
import { useNetwork } from '../../context/useNetwork';





interface SectionPlaceholderProps {
  title: string;
  sectionKey: NavigationSection;
  subtitle: string;
  milestone: string;
  plannedFeatures: string[];
}

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({
  title,
  subtitle,
  milestone,
  plannedFeatures,
}) => {
  const { setActiveSection } = useNetwork();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
              {milestone}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
        </div>

        <button
          onClick={() => setActiveSection('overview')}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 self-start md:self-auto"
        >
          <span>Return to Overview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Explicit Incomplete State Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
          <Construction className="w-6 h-6 animate-pulse" />
        </div>

        <div>
          <h3 className="font-bold text-slate-100 text-base">Module Staged for Incremental Session Delivery</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
            Per the project implementation plan, this section navigation is fully active and wired to the central state model. 
            Detailed UI views will be implemented incrementally in subsequent sessions.
          </p>
        </div>

        {/* Planned Features List */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 text-left space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Planned Functional Deliverables for this Module:</span>
          </div>
          <ul className="space-y-1.5">
            {plannedFeatures.map((feat, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                <span className="text-cyan-400 font-mono text-[11px]">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-center space-x-2 text-[11px] text-emerald-400 pt-2 font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Central state contract established in src/types/index.ts</span>
        </div>
      </div>
    </div>
  );
};
