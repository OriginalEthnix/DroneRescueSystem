import { 
  X, 
  Layers, 
  HelpCircle, 
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import { evaluateMultiSensorCorrelations, CORRELATION_DISCLAIMER } from '../../services/correlationEngine';

interface MultiSensorCorrelationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiSensorCorrelationModal: React.FC<MultiSensorCorrelationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state } = useNetwork();

  if (!isOpen) return null;

  const nodes = Object.values(state.sensorNodes);

  // Compute which correlation rules are currently active across the network
  const activeCorrelationsMap = nodes.map((node) => {
    const rules = evaluateMultiSensorCorrelations(node, state.thresholds);
    return {
      nodeId: node.nodeId,
      villageId: node.villageId,
      district: node.district,
      rules,
    };
  }).filter((item) => item.rules.length > 0);

  const staticRulesCatalog = [
    {
      id: 'CORR-FLOOD-COLLAPSE',
      title: 'Critical LiDAR Proximity + Structural Vibration',
      category: 'FLOOD / COLLAPSE',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
      description: 'LiDAR range narrowing below critical threshold (<=1.5m) concurrently with mechanical vibration (>=0.15g or >=0.30g).',
      rationale: 'Indicates surging floodwaters striking infrastructure or embankment washaway. Demands highest operational dispatch prioritization.',
      scoreBonus: '+25 Risk pts',
      priorityBonus: '+35 Priority pts',
    },
    {
      id: 'CORR-MOTION-VIB',
      title: 'Dynamic Motion + Structural Vibration',
      category: 'STRUCTURAL DYNAMICS',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      description: 'PIR motion detected alongside elevated mechanical vibration.',
      rationale: 'Distinguishes ambient tremor from potential human movement or shifting debris under structural distress. Prompts reconnaissance investigation.',
      scoreBonus: '+18 Risk pts',
      priorityBonus: '+25 Priority pts',
    },
    {
      id: 'CORR-PROX-HUMIDITY',
      title: 'LiDAR Proximity Warning + High Atmospheric Humidity',
      category: 'FLASH FLOOD PRECURSOR',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      description: 'Progressive LiDAR proximity reduction (<=3.0m) paired with atmospheric humidity (>80%).',
      rationale: 'Precipitation saturation correlating with rising surface water runoff accumulation in low-lying rural drainage channels.',
      scoreBonus: '+14 Risk pts',
      priorityBonus: '+20 Priority pts',
    },
    {
      id: 'CORR-HEAT-HUMIDITY',
      title: 'Thermal-Atmospheric Compound Anomaly',
      category: 'ENVIRONMENTAL HAZARD',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      description: 'Elevated ambient temperature (>35°C) combined with relative humidity (>80%).',
      rationale: 'Heat-index stress condition accelerating moisture vapor pressure and dangerous microclimate overheating.',
      scoreBonus: '+12 Risk pts',
      priorityBonus: '+15 Priority pts',
    },
    {
      id: 'CORR-ISOLATED-MOTION',
      title: 'Isolated Perimeter Motion (Observation Rule)',
      category: 'PERIMETER SURVEILLANCE',
      badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
      description: 'PIR motion detected with all other environmental readings within normal baseline limits.',
      rationale: 'Passive wildlife or ambient dust shift. Recorded for observation without elevating hazard alert status or triggering emergency dispatch.',
      scoreBonus: '+4 Risk pts',
      priorityBonus: '+0 Priority pts',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Multi-Sensor Correlation Engine</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  Session 7 Feature 2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Explainable cross-sensor hazard detection and deterministic rule combinations.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/50">
          {/* Required Explicit Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start space-x-3 text-amber-200 text-xs">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase font-mono text-[11px]">
                Demonstration Parameter Governance (Master Prompt Section 12)
              </span>
              <p className="text-amber-300/90 text-xs mt-0.5 leading-relaxed">
                {CORRELATION_DISCLAIMER} These demonstration rules show how fusing multiple sensor modalities improves operational risk accuracy and incident triage over isolated sensor readings.
              </p>
            </div>
          </div>

          {/* Active Network Correlations */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Currently Active Sensor Correlations in Sector Network
              </h3>
              <span className="text-[11px] font-mono text-cyan-400">
                {activeCorrelationsMap.length} Node(s) Correlating
              </span>
            </div>

            {activeCorrelationsMap.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 text-xs font-mono flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>All network nodes reporting independent baseline values; zero correlation alerts triggered.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCorrelationsMap.map((item) => (
                  <div key={item.nodeId} className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div>
                        <span className="font-mono font-bold text-slate-100 text-sm">{item.nodeId}</span>
                        <span className="text-slate-400 text-xs ml-2 font-mono">({item.district} • {item.villageId})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {item.rules.length} Rule(s) Active
                      </span>
                    </div>

                    <div className="space-y-2">
                      {item.rules.map((rule) => (
                        <div key={rule.ruleId} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-start gap-4 text-xs font-mono">
                          <div>
                            <span className="font-bold text-purple-300 block text-xs font-sans">{rule.name}</span>
                            <p className="text-slate-300 text-[11px] font-sans mt-0.5 leading-relaxed">{rule.explanation}</p>
                            <span className="text-slate-500 text-[10px] block mt-1">Sensors: {rule.affectedSensors.join(', ')}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold block mb-1">
                              +{rule.scoreBonus} Risk
                            </span>
                            <span className="text-amber-400 text-[10px] block">
                              +{rule.priorityBonus} Priority
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configured Demonstration Rule Catalog */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Configured Demonstration Correlation Catalog
            </h3>
            <div className="space-y-2.5">
              {staticRulesCatalog.map((rule) => (
                <div key={rule.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-100">{rule.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${rule.badgeColor}`}>
                        {rule.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="text-cyan-400 font-bold">{rule.scoreBonus}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-amber-400 font-bold">{rule.priorityBonus}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-1.5">
                    <strong>Condition:</strong> {rule.description}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    <strong>Operational Impact:</strong> {rule.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Configurable demonstration rules for university presentation</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Engine
          </button>
        </div>
      </div>
    </div>
  );
};
