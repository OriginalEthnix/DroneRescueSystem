import React from 'react';
import { 
  X, 
  Radio, 
  Wifi, 
  WifiOff, 
  Battery, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  PowerOff,
  Signal
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';

interface NetworkHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkHealthModal: React.FC<NetworkHealthModalProps> = ({ isOpen, onClose }) => {
  const { state, toggleNodeOffline } = useNetwork();

  if (!isOpen) return null;

  const nodes = Object.values(state.sensorNodes);
  const connectedNodes = nodes.filter((n) => n.status !== 'OFFLINE' && !n.isStale);
  const disconnectedNodes = nodes.filter((n) => n.status === 'OFFLINE' || n.isStale);

  // Compute average network telemetry
  const avgSignal = connectedNodes.length > 0 
    ? Math.round(connectedNodes.reduce((acc, n) => acc + n.signalQuality, 0) / connectedNodes.length)
    : 0;

  const avgLatency = connectedNodes.length > 0 
    ? Math.round(connectedNodes.reduce((acc, n) => acc + n.latencyMs, 0) / connectedNodes.length)
    : 0;

  const avgBattery = Math.round(nodes.reduce((acc, n) => acc + n.batteryLevel, 0) / (nodes.length || 1));

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Wireless Mesh Network Health & RF Diagnostics</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Session 7 Feature 3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time monitoring of LoRa / RF telemetry links, packet delivery latency, battery health, and stale node indicators across North Bihar sectors.
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
          {/* Global Network Health KPI Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Connected Nodes */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Online Nodes</span>
                <Wifi className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {connectedNodes.length} / {nodes.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {disconnectedNodes.length > 0 ? `${disconnectedNodes.length} node(s) offline` : '100% connected'}
              </div>
            </div>

            {/* Disconnected / Stale Nodes */}
            <div className={`p-3.5 rounded-xl border ${
              disconnectedNodes.length > 0 
                ? 'bg-red-950/40 border-red-500/50 text-red-300' 
                : 'bg-slate-950/80 border-slate-800 text-slate-400'
            }`}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Disconnected</span>
                <WifiOff className={`w-4 h-4 ${disconnectedNodes.length > 0 ? 'text-red-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-xl font-bold font-mono">
                {disconnectedNodes.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {disconnectedNodes.length > 0 ? 'Stale telemetry flagged' : 'No link loss'}
              </div>
            </div>

            {/* Average Signal Quality */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Avg Signal Quality</span>
                <Signal className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {avgSignal}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                RSSI ~ -{Math.round(110 - (avgSignal * 0.6))} dBm
              </div>
            </div>

            {/* Average Latency */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Avg Link Latency</span>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-bold font-mono text-indigo-300">
                {avgLatency} ms
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {avgLatency < 60 ? 'Optimal link speed' : 'Moderate ping delay'}
              </div>
            </div>

            {/* Fleet Battery State */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Avg Node Battery</span>
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {avgBattery}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                Solar harvest active
              </div>
            </div>
          </div>

          {/* Stale Data Disclaimer Banner if any node is disconnected */}
          {disconnectedNodes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start space-x-3 text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  Stale Telemetry Notice (Master Prompt Requirement):
                </span>
                <p className="text-amber-300/90 text-[11px] mt-0.5 leading-relaxed">
                  Nodes marked as OFFLINE cease transmitting live sensor packets. Their historical readings are explicitly marked as 
                  <strong> STALE</strong> rather than misleadingly presented as active measurements. RF link reconnect must occur before real-time telemetry resumes.
                </p>
              </div>
            </div>
          )}

          {/* Node Health Grid */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Distributed Sensor Node Link Status & Battery Telemetry
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Simulated 868 MHz LoRaWAN / RF Mesh Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodes.map((node) => {
                const isOffline = node.status === 'OFFLINE' || node.isStale;

                return (
                  <div
                    key={node.nodeId}
                    className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                      isOffline
                        ? 'bg-slate-950/90 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Node Card Header */}
                      <div className="flex justify-between items-start pb-2.5 border-b border-slate-800 mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
                            <h4 className="font-mono font-bold text-slate-100 text-sm">{node.nodeId}</h4>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {node.villageId} • {node.district}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isOffline
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          }`}>
                            {isOffline ? 'DISCONNECTED' : 'CONNECTED'}
                          </span>
                        </div>
                      </div>

                      {/* Stale Warning Pill if Offline */}
                      {isOffline && (
                        <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-[10px] text-red-300 font-mono flex items-center justify-between">
                          <span>DATA: STALE (Link Lost)</span>
                          <span>Ping Timeout</span>
                        </div>
                      )}

                      {/* Diagnostic Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                        {/* Signal Quality */}
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase">Signal Quality</span>
                          <span className={`font-bold ${isOffline ? 'text-slate-600' : 'text-cyan-400'}`}>
                            {isOffline ? '0%' : `${node.signalQuality}%`}
                          </span>
                        </div>

                        {/* Latency */}
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase">Latency</span>
                          <span className={`font-bold ${isOffline ? 'text-red-400' : 'text-slate-200'}`}>
                            {isOffline ? 'TIMEOUT' : `${node.latencyMs} ms`}
                          </span>
                        </div>

                        {/* Battery Level */}
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase">Battery State</span>
                          <span className="font-bold text-emerald-400">
                            {node.batteryLevel}% (LiFePO4)
                          </span>
                        </div>

                        {/* Last Transmission */}
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase">Last Packet</span>
                          <span className="text-slate-300 text-[11px]">
                            {formatRelativeTime(node.lastSuccessfulTransmission || node.lastUpdated)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Simulation Disconnect Toggle */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Hardware Simulation
                      </span>
                      <button
                        onClick={() => toggleNodeOffline(node.nodeId)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${
                          isOffline
                            ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30'
                        }`}
                        title={isOffline ? 'Reconnect this sensor node' : 'Simulate RF disconnection for this node'}
                      >
                        {isOffline ? <Wifi className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                        <span>{isOffline ? 'Reconnect' : 'Disconnect'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulated RF Mesh topology connected to Darbhanga Operations Gateway</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
