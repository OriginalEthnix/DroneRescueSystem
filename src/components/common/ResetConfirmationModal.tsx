import React from 'react';
import { RotateCcw, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBaseline: () => void;
  onConfirmFactory: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmBaseline,
  onConfirmFactory,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 id="reset-modal-title" className="text-base font-bold text-slate-100">
                System Reset Confirmation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select an operational reset mode. System safeguards prevent unintended data loss.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close reset modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Reset Options */}
        <div className="p-5 space-y-4 text-xs">
          {/* Option 1: Safe Sensor Baseline Reset */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200 text-sm">Restore Sensor Baseline</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  Returns all environmental telemetry (temperature 27°C, humidity 65%, vibration 0.03g) to normal baseline. 
                  <strong className="text-slate-300 font-semibold"> Preserves all existing incident records, active drone missions, and audit event logs.</strong>
                </p>
                <button
                  onClick={() => {
                    onConfirmBaseline();
                    onClose();
                  }}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-semibold transition-colors shadow-sm flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Sensor Baseline (Keep History)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Full Factory Reset */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-red-500/40 transition-colors">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200 text-sm">Factory System Reset</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                    DESTRUCTIVE
                  </span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  Clears local browser cache (localStorage), purges all incident histories, resets drones to stand-by, and reloads initial out-of-the-box state.
                </p>
                <button
                  onClick={() => {
                    onConfirmFactory();
                    onClose();
                  }}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 font-semibold transition-colors shadow-sm flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Wipe All Data & Factory Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
