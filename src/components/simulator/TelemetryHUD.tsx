/**
 * TelemetryHUD — Live telemetry sidebar panel.
 *
 * Receives a snapshot of the physics state (updated via React state
 * at ~10 Hz via requestAnimationFrame polling) and renders it in a
 * styled command-console format.
 *
 * Clearly labelled "SIMULATED TELEMETRY" to distinguish from real hardware.
 */
import React from 'react';
import type { DronePhysicsState, FlightStatus } from './flightPhysics';
import { getAltitude, getHeadingDegrees, getHorizontalSpeed } from './flightPhysics';

interface TelemetryHUDProps {
  snapshot: DronePhysicsState;
}

const STATUS_STYLES: Record<FlightStatus, string> = {
  GROUNDED:   'text-slate-400 bg-slate-800/60 border-slate-600/50',
  TAKING_OFF: 'text-yellow-300 bg-yellow-900/40 border-yellow-500/50 animate-pulse',
  FLYING:     'text-cyan-300 bg-cyan-900/40 border-cyan-500/50',
  LANDING:    'text-amber-300 bg-amber-900/40 border-amber-500/50 animate-pulse',
  COLLISION:  'text-red-300 bg-red-900/40 border-red-500/50 animate-pulse',
};

const STATUS_LABELS: Record<FlightStatus, string> = {
  GROUNDED:   '⬛ GROUNDED',
  TAKING_OFF: '🟡 TAKING OFF',
  FLYING:     '🟢 FLYING',
  LANDING:    '🟠 LANDING',
  COLLISION:  '🔴 COLLISION',
};

interface TelemetryRowProps {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}

const TelemetryRow: React.FC<TelemetryRowProps> = ({ label, value, accent, warn }) => (
  <div className="flex justify-between items-center py-0.5 px-0.5">
    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{label}</span>
    <span
      className={`text-[11px] font-mono font-semibold tabular-nums ${
        warn ? 'text-red-400' : accent ? 'text-cyan-300' : 'text-slate-200'
      }`}
    >
      {value}
    </span>
  </div>
);

// Simple compass ring rendered with CSS
const CompassRose: React.FC<{ heading: number }> = ({ heading }) => (
  <div className="flex flex-col items-center gap-1 my-1">
    <div className="relative w-16 h-16">
      {/* Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/40 bg-slate-900/60" />
      {/* Tick marks */}
      {['N','E','S','W'].map((dir, i) => (
        <span
          key={dir}
          className="absolute text-[8px] font-bold font-mono text-cyan-400/80"
          style={{
            top: i === 0 ? '2px' : i === 2 ? 'auto' : '50%',
            bottom: i === 2 ? '2px' : 'auto',
            left: i === 3 ? '2px' : i === 1 ? 'auto' : '50%',
            right: i === 1 ? '2px' : 'auto',
            transform: (i === 0 || i === 2) ? 'translateX(-50%)' : 'translateY(-50%)',
          }}
        >
          {dir}
        </span>
      ))}
      {/* Needle */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <div className="relative w-full h-full">
          {/* North (red) */}
          <div
            className="absolute left-1/2 bg-red-500 rounded-t-full"
            style={{ width: 3, height: '30%', top: '20%', transform: 'translateX(-50%)' }}
          />
          {/* South (slate) */}
          <div
            className="absolute left-1/2 bg-slate-500 rounded-b-full"
            style={{ width: 3, height: '26%', top: '50%', transform: 'translateX(-50%)' }}
          />
        </div>
      </div>
      {/* Centre dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-cyan-400" />
      </div>
    </div>
    <span className="text-[10px] font-mono text-cyan-300">{heading}°</span>
  </div>
);

// Battery bar
const BatteryBar: React.FC<{ level: number }> = ({ level }) => {
  const color = level > 50 ? 'bg-emerald-500' : level > 20 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className={`text-[11px] font-mono font-bold ${level > 50 ? 'text-emerald-400' : level > 20 ? 'text-amber-400' : 'text-red-400'}`}>
        {level.toFixed(1)}%
      </span>
    </div>
  );
};

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ snapshot }) => {
  const altitude   = getAltitude(snapshot);
  const hSpeed     = getHorizontalSpeed(snapshot);
  const heading    = getHeadingDegrees(snapshot);
  const statusStyle = STATUS_STYLES[snapshot.flightStatus];
  const statusLabel = STATUS_LABELS[snapshot.flightStatus];

  const flightMins = Math.floor(snapshot.flightTimeSeconds / 60);
  const flightSecs = Math.floor(snapshot.flightTimeSeconds % 60);

  return (
    <div className="flex flex-col gap-2 w-56 select-none">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-xl">
        <div className="text-[9px] font-mono text-cyan-500 tracking-widest uppercase mb-2 border-b border-slate-700/60 pb-1.5 text-center">
          ⚠ Simulated Telemetry ⚠
        </div>

        {/* Flight Status */}
        <div className={`text-[11px] font-mono font-bold text-center rounded-lg px-2 py-1.5 mb-2 border ${statusStyle}`}>
          {statusLabel}
        </div>

        {/* Position */}
        <div className="space-y-0.5 mb-2">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Position</div>
          <TelemetryRow label="X" value={`${snapshot.position.x.toFixed(2)} m`} accent />
          <TelemetryRow label="Y" value={`${snapshot.position.y.toFixed(2)} m`} accent />
          <TelemetryRow label="Z" value={`${snapshot.position.z.toFixed(2)} m`} accent />
          <TelemetryRow label="Alt" value={`${altitude.toFixed(2)} m`} accent />
        </div>

        {/* Velocity */}
        <div className="space-y-0.5 mb-2">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Velocity</div>
          <TelemetryRow label="H-Speed" value={`${hSpeed.toFixed(2)} m/s`} />
          <TelemetryRow label="V-Speed" value={`${snapshot.velocity.y.toFixed(2)} m/s`} />
        </div>

        {/* Compass */}
        <div className="space-y-0.5 mb-2">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider text-center">Heading</div>
          <CompassRose heading={heading} />
        </div>

        {/* Distance & Time */}
        <div className="space-y-0.5 mb-2">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Mission</div>
          <TelemetryRow label="Dist" value={`${snapshot.distanceTravelled.toFixed(1)} m`} />
          <TelemetryRow label="Time" value={`${flightMins}m ${flightSecs.toString().padStart(2,'0')}s`} />
        </div>

        {/* Collision */}
        <TelemetryRow
          label="Obstacle"
          value={snapshot.collisionState ? 'BLOCKED' : 'CLEAR'}
          warn={snapshot.collisionState}
        />

        {/* Battery */}
        <div className="mt-2">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">Battery</div>
          <BatteryBar level={snapshot.batteryLevel} />
        </div>
      </div>

      {/* Coord Convention Legend */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/40 rounded-xl p-2 shadow-lg">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1 text-center">
          Coord System
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block shrink-0" />
            <span className="text-slate-300">X — Right (+) / Left (−)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block shrink-0" />
            <span className="text-slate-300">Y — Up (+) / Down (−)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block shrink-0" />
            <span className="text-slate-300">Z — Fwd (−) / Back (+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
