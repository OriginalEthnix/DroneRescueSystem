import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileCheck, 
  ShieldCheck, 
  CheckCircle,
  Save,
  Copy
} from 'lucide-react';
import type { DroneMissionReport } from '../../types';
import { formatPrintableMissionReport } from '../../services/exportService';

interface MissionReportModalProps {
  report: DroneMissionReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes?: (missionId: string, notes: string) => void;
}

export const MissionReportModal: React.FC<MissionReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onSaveNotes,
}) => {
  const [operatorNotes, setOperatorNotes] = useState(report?.operatorNotes || '');
  const [prevReportId, setPrevReportId] = useState(report?.missionId);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Sync state when report changes without cascading effect renders
  if (report && report.missionId !== prevReportId) {
    setPrevReportId(report.missionId);
    setOperatorNotes(report.operatorNotes || '');
  }

  if (!isOpen || !report) return null;

  const handleSaveNotes = () => {
    if (onSaveNotes) {
      onSaveNotes(report.missionId, operatorNotes);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = formatPrintableMissionReport({
      ...report,
      operatorNotes,
    });
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const handleDownloadJSON = () => {
    const data = JSON.stringify({
      ...report,
      operatorNotes,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mission_Report_${report.missionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isConfirmed = report.verificationResult.toString().includes('CONFIRMED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header (Hidden in Print) */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">UAV Aerial Reconnaissance Mission Summary Report</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  10-Field Official Audit
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Mission ID: {report.missionId} • Associated Incident: {report.incidentId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shadow-sm"
              title="Print official mission report"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shadow-sm"
              title="Copy plain-text report to clipboard"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>{copiedSuccess ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shadow-sm"
              title="Download mission report as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-900/60 print:bg-white print:text-black">
          {/* Official Document Banner */}
          <div className="border-b border-slate-800 print:border-black pb-4 text-center">
            <h1 className="text-base md:text-lg font-bold uppercase tracking-wider text-slate-100 print:text-black leading-snug">
              AI-Based Multi-Agent Swarm Robot System for Autonomous Disaster and Rescue Using Reinforcement Learning
            </h1>
            <p className="text-xs text-cyan-400 print:text-slate-700 font-mono mt-1 uppercase">
              Autonomous Aerial Reconnaissance & Verification After-Action Report
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Command Station: Regional Drone Hub, Darbhanga Air Base, North Bihar
            </p>
          </div>

          {/* All 10 Required Specification Fields (Master Prompt Section 12 Feature 5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* 1. Mission ID */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                1. Mission ID
              </span>
              <span className="text-sm font-bold text-cyan-400 print:text-black">
                {report.missionId}
              </span>
            </div>

            {/* 2. Incident ID */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                2. Incident ID
              </span>
              <span className="text-sm font-bold text-amber-400 print:text-black">
                {report.incidentId}
              </span>
            </div>

            {/* 3. Target Village */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                3. Target Village / Sector
              </span>
              <span className="text-sm font-bold text-slate-100 print:text-black">
                {report.targetVillage} (North Bihar)
              </span>
            </div>

            {/* 4. Assigned Drone */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                4. Assigned Drone
              </span>
              <span className="text-sm font-bold text-indigo-300 print:text-black">
                {report.assignedDrone}
              </span>
            </div>

            {/* 5. Dispatch Time */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                5. Sortie Dispatch Time
              </span>
              <span className="text-slate-200 print:text-black">
                {report.dispatchTime}
              </span>
            </div>

            {/* 6. Simulated Arrival Time */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                6. Simulated Arrival Time
              </span>
              <span className="text-slate-200 print:text-black">
                {report.simulatedArrivalTime}
              </span>
            </div>

            {/* 7. Verification Result */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                7. Verification Result
              </span>
              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border mt-0.5 ${
                isConfirmed
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 print:bg-red-100 print:text-red-900'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 print:bg-emerald-100 print:text-emerald-900'
              }`}>
                {report.verificationResult}
              </span>
            </div>

            {/* 8. Mission Duration */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                8. Mission Duration
              </span>
              <span className="text-slate-200 print:text-black">
                {report.missionDuration}
              </span>
            </div>

            {/* 9. Final Status */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                9. Final Status
              </span>
              <span className="text-emerald-400 font-bold print:text-green-800">
                {report.finalStatus}
              </span>
            </div>

            {/* Autonomous Authorization Stamp */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block uppercase font-bold">
                Subsystem Integrity
              </span>
              <span className="text-cyan-400 print:text-black flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified by Autonomous Sortie Machine</span>
              </span>
            </div>
          </div>

          {/* 10. Operator Notes (Editable in UI) */}
          <div className="p-4 rounded-xl bg-slate-950/80 print:bg-white border border-slate-800 print:border-slate-400 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 print:text-black uppercase font-mono tracking-wider">
                10. Operator Notes & Mission Debrief
              </label>
              {savedSuccess && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Notes Saved to Record</span>
                </span>
              )}
            </div>

            <textarea
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="Enter operator debrief notes, ground verification details, or rescue follow-up actions..."
              rows={4}
              className="w-full bg-slate-900 print:bg-slate-50 border border-slate-700 print:border-slate-300 rounded-lg p-3 text-xs font-sans text-slate-200 print:text-black focus:outline-none focus:border-cyan-500 leading-relaxed"
            />

            {onSaveNotes && (
              <div className="flex justify-end pt-1 print:hidden">
                <button
                  onClick={handleSaveNotes}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Operator Notes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span className="font-mono text-[11px]">
            RFC 4180 / JSON export compatible data structure
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
