import React, { useState } from 'react';
import { 
  Radio, 
  Plane, 
  Compass, 
  Layers, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import { useNetwork } from '../../context/useNetwork';
import { LeafletMapView } from './LeafletMapView';
import { calculateHaversineDistanceKm } from '../../services/geographicService';
import type { VillageId } from '../../types';

export const GeographicIntelligencePage: React.FC = () => {
  const { 
    state, 
    selectVillage, 
    selectNode, 
    setActiveSection 
  } = useNetwork();

  const [useFallbackMap, setUseFallbackMap] = useState<boolean>(false);

  const villages = Object.values(state.villages);
  const sensorNodes = Object.values(state.sensorNodes);
  const drones = Object.values(state.drones);
  const missions = Object.values(state.missions);
  const incidents = Object.values(state.incidents);

  const selectedVillage = villages.find((v) => v.id === state.selectedVillageId) || villages[0];
  const selectedVillageNodes = selectedVillage ? selectedVillage.nodeIds.map((id) => state.sensorNodes[id]).filter(Boolean) : [];
  const selectedVillageIncidents = incidents.filter(
    (i) => i.villageId === selectedVillage?.id && i.status !== 'RESOLVED'
  );

  // Compute distance from Regional Drone Base to selected village
  const droneBase = drones[0]?.baseCoordinates || { lat: 26.1950, lng: 85.9140 };
  const distanceToBaseKm = selectedVillage 
    ? calculateHaversineDistanceKm(droneBase, selectedVillage.coordinates)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Geographic Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">Geographic Intelligence & Bihar Corridor Map</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time geospatial visualization of 3 rural Bihar sectors (Darbhanga, Sitamarhi, Madhubani). 
            Coordinates shown are clearly labeled approximate simulation coordinates.
          </p>
        </div>

        {/* Tile / Fallback Map Mode Toggle */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setUseFallbackMap(!useFallbackMap)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1.5 border border-slate-700 transition-colors"
            title="Toggle between live CartoDB OpenStreetMap tiles and high-contrast offline vector schematic"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Mode: {useFallbackMap ? 'Schematic Fallback' : 'Live Dark Tiles'}</span>
          </button>
        </div>
      </div>

      {/* Main Map + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Interactive Map View */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
          {/* Map Status Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>North Bihar Coverage Sector</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Center: 26.35°N, 85.80°E</span>
              <span className="text-cyan-400">Scale: 1:50,000 Tactical</span>
            </div>
          </div>

          {/* Map Container Viewport */}
          <div className="w-full h-[520px] rounded-lg overflow-hidden border border-slate-800 relative bg-slate-950">
            {!useFallbackMap ? (
              <LeafletMapView
                villages={villages}
                sensorNodes={sensorNodes}
                drones={drones}
                missions={missions}
                incidents={incidents}
                selectedVillageId={state.selectedVillageId}
                selectedNodeId={state.selectedNodeId}
                onSelectVillage={(id: VillageId) => selectVillage(id)}
                onSelectNode={(id: string) => selectNode(id)}
              />
            ) : (
              /* High-Contrast Labeled Geographic Fallback Canvas */
              <div className="w-full h-full p-6 flex flex-col justify-between bg-slate-950 relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950" />
                
                {/* Fallback Banner */}
                <div className="relative z-10 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-lg text-xs flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Geographic Schematic Fallback Mode Active (Offline / Non-Tile View)</span>
                </div>

                {/* 2D Sector Relative Placement Schema */}
                <div className="relative z-10 grid grid-cols-3 gap-6 my-auto">
                  {/* Village B: Sitamarhi (North-West) */}
                  <div 
                    onClick={() => selectVillage('VILLAGE-B')}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100 text-sm">Simulated Village B</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Sitamarhi</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Coord: 26.5937° N, 85.4894° E</p>
                    <div className="font-mono text-xs text-cyan-400">Nodes: BIH-SIT-001, 002</div>
                  </div>

                  {/* Village C: Madhubani (North-East) */}
                  <div 
                    onClick={() => selectVillage('VILLAGE-C')}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100 text-sm">Simulated Village C</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Madhubani</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Coord: 26.3544° N, 86.0717° E</p>
                    <div className="font-mono text-xs text-cyan-400">Nodes: BIH-MAD-001, 002</div>
                  </div>

                  {/* Village A: Darbhanga (South-Central) */}
                  <div 
                    onClick={() => selectVillage('VILLAGE-A')}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100 text-sm">Simulated Village A</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Darbhanga</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Coord: 26.1542° N, 85.8918° E</p>
                    <div className="font-mono text-xs text-cyan-400">Nodes: BIH-DAR-001, 002</div>
                  </div>
                </div>

                {/* Drone Hub Card in Fallback */}
                <div className="relative z-10 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-200 font-mono">Regional Base (Darbhanga Hub): 26.1950° N, 85.9140° E</span>
                  </div>
                  <span className="text-indigo-300 font-mono text-[11px]">2 Recon UAVs Ready</span>
                </div>
              </div>
            )}
          </div>

          {/* Map Legend (Master Prompt Section 2 & Section 9 Requirement) */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 text-xs">
            <div className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-2">
              Geographic Map Legend & Operational Indicators
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Normal / Safe (<strong className="font-mono text-emerald-400">&lt;30</strong>)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-300">Warning (<strong className="font-mono text-amber-400">30–59</strong>)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-slate-300">Critical / Hazard (<strong className="font-mono text-red-400">&ge;60</strong>)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-indigo-500" />
                <span className="text-slate-300">Drone Air Base</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-slate-400">Node Offline / Stale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Selected Village Deep Inspector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Village Selector Pills */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Select Monitored Sector:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {villages.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => selectVillage(v.id)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all text-center border ${
                      v.id === selectedVillage?.id
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40 font-bold'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="truncate">{v.name.replace('Simulated ', '')}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{v.district}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Village Card */}
            {selectedVillage && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{selectedVillage.name}</h3>
                    <p className="text-xs text-cyan-400 font-mono">District: {selectedVillage.district}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedVillage.status === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : selectedVillage.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {selectedVillage.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div><strong>Primary Hazard Concern:</strong> {selectedVillage.primaryConcern}</div>
                  <div className="font-mono text-[11px]">
                    <strong>Approx. Coordinates:</strong> {selectedVillage.coordinates.lat.toFixed(4)}° N, {selectedVillage.coordinates.lng.toFixed(4)}° E
                  </div>
                  <div className="font-mono text-[11px]">
                    <strong>Distance from UAV Base:</strong> <span className="text-slate-200 font-bold">{distanceToBaseKm} km</span> (~{(distanceToBaseKm / 65 * 60).toFixed(1)} mins flight)
                  </div>
                </div>

                {/* Village Risk Metric */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Aggregated Sector Risk:</span>
                  <span className={`font-mono font-bold text-sm ${
                    selectedVillage.currentRiskScore >= 60 ? 'text-red-400' : selectedVillage.currentRiskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedVillage.currentRiskScore}/100
                  </span>
                </div>

                {/* Village Sensor Nodes List */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 flex justify-between items-center">
                    <span>Associated Sensor Nodes ({selectedVillageNodes.length})</span>
                    <Radio className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="space-y-1.5">
                    {selectedVillageNodes.map((n) => (
                      <div 
                        key={n.nodeId}
                        onClick={() => selectNode(n.nodeId)}
                        className="p-2 rounded bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 text-xs font-mono flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <span className="text-cyan-400 font-bold">{n.nodeId}</span>
                          <span className="text-slate-500 text-[10px] ml-2">Temp: {n.sensors.temperature.value}°C</span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          n.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {n.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Alerts in this Village */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 flex justify-between items-center">
                    <span>Active Sector Alerts ({selectedVillageIncidents.length})</span>
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                  </div>
                  {selectedVillageIncidents.length === 0 ? (
                    <div className="p-2 rounded bg-slate-900/50 border border-slate-800 text-slate-500 text-xs italic">
                      No active alerts in this village sector.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedVillageIncidents.map((inc) => (
                        <div key={inc.id} className="p-2 rounded bg-red-950/30 border border-red-500/30 text-xs">
                          <div className="flex justify-between items-center font-mono">
                            <span className="font-bold text-red-300">{inc.id}</span>
                            <span className="text-red-400 font-bold">{inc.severity}</span>
                          </div>
                          <p className="text-slate-300 text-[11px] truncate mt-0.5">{inc.triggerReason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setActiveSection('monitoring')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between border border-slate-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Open Live Sensor Telemetry</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveSection('drones')}
              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-lg shadow-cyan-950/40"
            >
              <div className="flex items-center space-x-2">
                <Plane className="w-4 h-4" />
                <span>Open Drone Operations Hub</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
