import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';

interface DemoStep {
  stepNumber: number;
  title: string;
  category: 'SETUP' | 'HAZARD' | 'RISK' | 'INCIDENT' | 'DISPATCH' | 'FLIGHT' | 'VERIFY' | 'RESOLUTION';
  section: 'overview' | 'monitoring' | 'geographic' | 'incidents' | 'drones' | 'analytics' | 'configuration' | 'event-log';
  explanation: string;
  technicalDetails: string;
  execute: (ctx: ReturnType<typeof useNetwork>) => void;
}

const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Baseline Normal Telemetry State',
    category: 'SETUP',
    section: 'overview',
    explanation: 'Establish healthy baseline environmental conditions across Darbhanga, Sitamarhi, and Madhubani. All 6 nodes report normal 27°C–28°C baseline telemetry, no motion, stable LiDAR ~5m, and low structural vibration (<0.05g).',
    technicalDetails: 'Simulation reset to pristine initialState. Zero active alerts, aggregate network risk ~12/100, both UAVs available on base standby.',
    execute: (ctx) => {
      ctx.resetSimulation();
      ctx.setActiveSection('overview');
    },
  },
  {
    stepNumber: 2,
    title: 'Inspect Live Telemetry Grid',
    category: 'SETUP',
    section: 'monitoring',
    explanation: 'Inspect the Live Monitoring telemetry grid across all 3 sectors. Each node maintains bounded real-time telemetry, 90%+ signal quality, 40-60ms latency, and historical sparkline trends.',
    technicalDetails: 'Nodes BIH-DAR-001/002, BIH-SIT-001/002, and BIH-MAD-001/002 report valid telemetry. Fast filtering & search ready.',
    execute: (ctx) => {
      ctx.setActiveSection('monitoring');
    },
  },
  {
    stepNumber: 3,
    title: 'Trigger Multi-Hazard Compound Anomaly',
    category: 'HAZARD',
    section: 'monitoring',
    explanation: 'Simulate a severe environmental flash flood and structural destabilization event in Sector Bravo (Sitamarhi) by injecting Scenario F into node BIH-SIT-001.',
    technicalDetails: 'Values injected: Humidity 86% (Warning), Motion DETECTED, LiDAR distance 1.1m (Critical proximity <1.5m), Structural vibration 0.37g (Critical >0.30g).',
    execute: (ctx) => {
      ctx.setScenario('COMBINED_ANOMALY', 'BIH-SIT-001');
      ctx.selectNode('BIH-SIT-001');
      ctx.setActiveSection('monitoring');
      if (!ctx.state.simulationRunning) {
        ctx.toggleSimulation();
      }
    },
  },
  {
    stepNumber: 4,
    title: 'Transparent Risk Engine Scoring',
    category: 'RISK',
    section: 'monitoring',
    explanation: 'The deterministic risk scoring engine recalculates risk score to 92/100 (CRITICAL). Contributing conditions are explicitly cataloged rather than hidden in a black-box.',
    technicalDetails: 'Score weights: LiDAR (40%), Vibration (30%), Humidity (15%), Motion (10%), Temperature (5%). Compounding multiplier applied for multiple simultaneous anomalies.',
    execute: (ctx) => {
      ctx.selectNode('BIH-SIT-001');
      ctx.setActiveSection('monitoring');
    },
  },
  {
    stepNumber: 5,
    title: 'Deduplicated Incident & Alert Generation',
    category: 'INCIDENT',
    section: 'incidents',
    explanation: 'An automated incident is created with status ACTIVE and severity CRITICAL. The alert deduplication engine prevents alert fatigue from persistent threshold violations.',
    technicalDetails: 'Incident assigned unique ID, village Sector Bravo, trigger reason, threshold references, priority score 92, and recommended response "IMMEDIATE_DRONE_DISPATCH".',
    execute: (ctx) => {
      ctx.setActiveSection('incidents');
    },
  },
  {
    stepNumber: 6,
    title: 'Operator Incident Review & Acknowledgment',
    category: 'INCIDENT',
    section: 'incidents',
    explanation: 'Human-in-the-loop: An operator reviews the incoming hazard alert, examines the contributing conditions, acknowledges the incident, and logs operational notes.',
    technicalDetails: 'Incident status transitions to ACKNOWLEDGED. Audit trail records operator ID and timestamp to maintain accountability.',
    execute: (ctx) => {
      const activeInc = Object.values(ctx.state.incidents).find(i => i.nodeId === 'BIH-SIT-001') || Object.values(ctx.state.incidents)[0];
      if (activeInc) {
        ctx.acknowledgeIncident(activeInc.id);
        ctx.addIncidentNote(activeInc.id, 'Operator confirmed compound telemetry spike. Reconnaissance UAV dispatched for aerial validation.');
        ctx.selectIncident(activeInc.id);
      }
      ctx.setActiveSection('incidents');
    },
  },
  {
    stepNumber: 7,
    title: 'Fleet Arbitration & Dispatch Modal',
    category: 'DISPATCH',
    section: 'drones',
    explanation: 'The system evaluates the autonomous UAV fleet stationed at Darbhanga Regional Base. DRONE-01 ("AeroScout-Alpha") is selected based on battery (94%) and proximity.',
    technicalDetails: 'Dispatches mission for the active incident. Calculates 65.4 km flight path to Sitamarhi target coordinates with ~60 min flight window and safety reserves.',
    execute: (ctx) => {
      const activeInc = Object.values(ctx.state.incidents).find(i => i.nodeId === 'BIH-SIT-001') || Object.values(ctx.state.incidents)[0];
      if (activeInc) {
        ctx.dispatchDrone(activeInc.id, 'DRONE-01');
      }
      ctx.setActiveSection('drones');
    },
  },
  {
    stepNumber: 8,
    title: 'Takeoff & En-Route Transit Animation',
    category: 'FLIGHT',
    section: 'geographic',
    explanation: 'DRONE-01 executes automated pre-flight checks, takes off, and transitions into EN_ROUTE cruising at 65 km/h along the 20-waypoint flight corridor toward Sitamarhi.',
    technicalDetails: 'Animated Leaflet flight polyline updates dynamically. Battery discharges proportionally (0.4% per step). Geographic intelligence shows drone marker moving across North Bihar.',
    execute: (ctx) => {
      const mission = Object.values(ctx.state.missions)[0];
      if (mission && (mission.status === 'MISSION_ASSIGNED' || mission.status === 'PRE_FLIGHT_CHECK')) {
        ctx.advanceMission(mission.id); // TAKEOFF
        ctx.advanceMission(mission.id); // EN_ROUTE
      }
      ctx.setActiveSection('geographic');
    },
  },
  {
    stepNumber: 9,
    title: 'Target Airspace Arrival & Scan Pattern',
    category: 'FLIGHT',
    section: 'geographic',
    explanation: 'DRONE-01 enters Sector Bravo airspace, reduces altitude, and establishes an autonomous orbital reconnaissance pattern over node BIH-SIT-001.',
    technicalDetails: 'Mission transitions: APPROACHING_TARGET -> ARRIVED -> AERIAL_VERIFICATION. Distance remaining drops to <1.0 km.',
    execute: (ctx) => {
      const mission = Object.values(ctx.state.missions)[0];
      if (mission) {
        // Advance to AERIAL_VERIFICATION
        if (mission.status === 'EN_ROUTE') ctx.advanceMission(mission.id);
        if (mission.status === 'APPROACHING_TARGET') ctx.advanceMission(mission.id);
        if (mission.status === 'ARRIVED') ctx.advanceMission(mission.id);
      }
      ctx.setActiveSection('geographic');
    },
  },
  {
    stepNumber: 10,
    title: 'Simulated Aerial Hazard Verification',
    category: 'VERIFY',
    section: 'drones',
    explanation: 'Onboard simulated multispectral sensors complete thermal scan and ground proximity assessment: Outcome HAZARD_CONFIRMED (water surge & structural displacement detected).',
    technicalDetails: 'Simulated mission outcome tagged as HAZARD_CONFIRMED. Incident status shifts to UNDER_INVESTIGATION with verification outcome attached.',
    execute: (ctx) => {
      const mission = Object.values(ctx.state.missions)[0];
      if (mission && mission.status === 'AERIAL_VERIFICATION') {
        ctx.advanceMission(mission.id); // Triggers MISSION_COMPLETE + report generation
      }
      ctx.setActiveSection('drones');
    },
  },
  {
    stepNumber: 11,
    title: 'Mission Summary Report & Incident Resolution',
    category: 'RESOLUTION',
    section: 'drones',
    explanation: 'A 10-field official Mission Summary Report is generated. Operator reviews flight telemetry, verified aerial findings, and marks the incident formally RESOLVED.',
    technicalDetails: 'Report fields: Mission ID, Incident ID, Target Coordinates, Assigned UAV, Dispatch Time, Arrival Time, Outcome, Duration, Final Status, Operator Notes.',
    execute: (ctx) => {
      const activeInc = Object.values(ctx.state.incidents).find(i => i.nodeId === 'BIH-SIT-001') || Object.values(ctx.state.incidents)[0];
      if (activeInc) {
        ctx.resolveIncident(activeInc.id, 'Aerial imagery confirmed structural displacement and flood surge. District Disaster Management Authority dispatched.');
      }
      ctx.setActiveSection('drones');
    },
  },
  {
    stepNumber: 12,
    title: 'Autonomous RTB & Network Normalization',
    category: 'RESOLUTION',
    section: 'overview',
    explanation: 'DRONE-01 executes autonomous Return-To-Base (RETURNING_TO_BASE -> AVAILABLE) landing back at Darbhanga Air Base. System returns to clean operational ready state.',
    technicalDetails: 'UAV battery status preserved, mission archived in sortie history. Network telemetry available in Analytics and complete audit trail in Event Log.',
    execute: (ctx) => {
      const mission = Object.values(ctx.state.missions)[0];
      if (mission && (mission.status === 'MISSION_COMPLETE' || mission.status === 'RETURNING_TO_BASE')) {
        ctx.advanceMission(mission.id); // AVAILABLE
      }
      ctx.setActiveSection('overview');
    },
  },
];

interface DemonstrationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemonstrationMode: React.FC<DemonstrationModeProps> = ({ isOpen, onClose }) => {
  const network = useNetwork();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoTimerSeconds, setAutoTimerSeconds] = useState<number>(7);

  const currentStep = DEMO_STEPS[currentStepIndex];

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setAutoTimerSeconds((prev) => {
        if (prev <= 1) {
          // Advance to next step
          if (currentStepIndex < DEMO_STEPS.length - 1) {
            const nextIdx = currentStepIndex + 1;
            setCurrentStepIndex(nextIdx);
            DEMO_STEPS[nextIdx].execute(network);
            return 7;
          } else {
            setIsAutoPlaying(false);
            return 7;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isAutoPlaying, currentStepIndex, network]);

  if (!isOpen) return null;

  const goToStep = (index: number) => {
    if (index >= 0 && index < DEMO_STEPS.length) {
      setCurrentStepIndex(index);
      DEMO_STEPS[index].execute(network);
      setAutoTimerSeconds(7);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    setAutoTimerSeconds(7);
  };

  const getCategoryColor = (cat: DemoStep['category']) => {
    switch (cat) {
      case 'SETUP': return 'text-cyan-400 bg-cyan-950/80 border-cyan-800/60';
      case 'HAZARD': return 'text-amber-400 bg-amber-950/80 border-amber-800/60';
      case 'RISK': return 'text-purple-400 bg-purple-950/80 border-purple-800/60';
      case 'INCIDENT': return 'text-red-400 bg-red-950/80 border-red-800/60';
      case 'DISPATCH': return 'text-blue-400 bg-blue-950/80 border-blue-800/60';
      case 'FLIGHT': return 'text-sky-400 bg-sky-950/80 border-sky-800/60';
      case 'VERIFY': return 'text-yellow-400 bg-yellow-950/80 border-yellow-800/60';
      case 'RESOLUTION': return 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60';
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-5">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Guided Faculty Demonstration Runner
          </span>
          <span className="text-[11px] text-slate-400">
            (12 Master Workflow Steps)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Auto play toggle */}
          <button
            onClick={toggleAutoPlay}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 border transition-colors ${
              isAutoPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Auto ({autoTimerSeconds}s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto-Play</span>
              </>
            )}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Exit Demonstration Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Dots Bar */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between overflow-x-auto gap-1">
        {DEMO_STEPS.map((s, idx) => (
          <button
            key={s.stepNumber}
            onClick={() => goToStep(idx)}
            className={`flex-1 min-w-[24px] py-1 text-center rounded text-[10px] font-mono font-bold transition-all ${
              idx === currentStepIndex
                ? 'bg-cyan-500 text-slate-950 scale-105 shadow-md shadow-cyan-500/30'
                : idx < currentStepIndex
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                : 'bg-slate-800/60 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
            title={`Step ${s.stepNumber}: ${s.title}`}
          >
            {s.stepNumber}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(currentStep.category)}`}>
              {currentStep.category}
            </span>
            <span className="text-xs font-mono text-cyan-400">
              STEP {currentStep.stepNumber} OF {DEMO_STEPS.length}
            </span>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-slate-400 uppercase font-mono">
              View: {currentStep.section}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <span>{currentStep.title}</span>
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.explanation}
          </p>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] text-cyan-300/80 font-mono">
            💡 <span className="text-slate-400">Technical Context:</span> {currentStep.technicalDetails}
          </div>
        </div>

        {/* Action & Navigation Controls */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => currentStep.execute(network)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-900/30 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-Execute Step</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium flex items-center justify-center space-x-1 border border-slate-700"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === DEMO_STEPS.length - 1}
              className="flex-1 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs flex items-center justify-center space-x-1 shadow-md shadow-cyan-600/30"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
