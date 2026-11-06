/**
 * FlightControlPanel — Compact floating button panel anchored to the
 * right side of the 3D viewport so it never covers the drone.
 *
 * Layout (top→bottom):
 *   Header label
 *   D-pad row  (FWD · UP   · —  )
 *              (LEFT· BACK · RIGHT)
 *   Alt row    (— · DOWN · —)
 *   Separator
 *   Command row (TAKEOFF · LAND · RESET)
 *   Keyboard hint (tiny)
 *
 * Hold-buttons use mousedown/touchstart → fire; mouseup/mouseleave/touchend → release.
 */
import React from 'react';
import type { InputState } from './flightPhysics';

interface ButtonConfig {
  label: string;
  icon: string;
  key: keyof InputState | 'takeoff' | 'land' | 'reset';
  hold: boolean;
  className?: string;
}

// ── Held movement buttons (ordered for a 3×2 D-pad grid) ─────────────────────
//   Col 0   Col 1   Col 2
//  [FWD]   [UP]    [—]
//  [LEFT]  [BACK]  [RIGHT]
const DPAD: ButtonConfig[] = [
  { label: 'FWD',   icon: '▲', key: 'forward',  hold: true },
  { label: 'UP',    icon: '⬆', key: 'up',       hold: true },
  { label: 'LEFT',  icon: '◀', key: 'left',     hold: true },
  { label: 'BACK',  icon: '▼', key: 'backward', hold: true },
  { label: 'RIGHT', icon: '▶', key: 'right',    hold: true },
];

const DOWN_BTN: ButtonConfig = { label: 'DOWN', icon: '⬇', key: 'down', hold: true };

const CMD_BUTTONS: ButtonConfig[] = [
  { label: 'TKO', icon: '🛫', key: 'takeoff', hold: false,
    className: 'bg-emerald-900/60 border-emerald-500/50 hover:bg-emerald-800/80 text-emerald-300' },
  { label: 'LND', icon: '🛬', key: 'land',    hold: false,
    className: 'bg-amber-900/60 border-amber-500/50 hover:bg-amber-800/80 text-amber-300' },
  { label: 'RST', icon: '↺',  key: 'reset',   hold: false,
    className: 'bg-red-900/60 border-red-500/50 hover:bg-red-800/80 text-red-300' },
];

// ── Prop interfaces ───────────────────────────────────────────────────────────
interface FlightControlPanelProps {
  onInputStart: (key: keyof InputState) => void;
  onInputEnd:   (key: keyof InputState) => void;
  onTakeoff: () => void;
  onLand:    () => void;
  onReset:   () => void;
}

interface HoldButtonProps extends FlightControlPanelProps {
  cfg: ButtonConfig;
  /** Extra Tailwind classes for sizing — applied on top of defaults */
  sizeClass?: string;
}

// ── Individual button ─────────────────────────────────────────────────────────
const HoldButton: React.FC<HoldButtonProps> = ({
  cfg, sizeClass = 'px-1.5 py-1.5',
  onInputStart, onInputEnd, onTakeoff, onLand, onReset,
}) => {
  const down = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (cfg.hold) onInputStart(cfg.key as keyof InputState);
    else if (cfg.key === 'takeoff') onTakeoff();
    else if (cfg.key === 'land')    onLand();
    else if (cfg.key === 'reset')   onReset();
  };
  const up = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (cfg.hold) onInputEnd(cfg.key as keyof InputState);
  };

  return (
    <button
      className={`
        select-none touch-none flex flex-col items-center justify-center gap-0
        rounded-md border font-bold font-mono uppercase
        transition-all duration-75 active:scale-90
        ${sizeClass}
        ${cfg.className ?? 'bg-slate-800/75 border-slate-600/50 hover:bg-cyan-900/50 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300'}
      `}
      onMouseDown={down}
      onMouseUp={up}
      onMouseLeave={up}
      onTouchStart={down}
      onTouchEnd={up}
      onContextMenu={(e) => e.preventDefault()}
      draggable={false}
    >
      <span className="text-[13px] leading-none">{cfg.icon}</span>
      <span className="text-[8px] leading-none tracking-wide mt-0.5">{cfg.label}</span>
    </button>
  );
};

// ── Panel ─────────────────────────────────────────────────────────────────────
export const FlightControlPanel: React.FC<FlightControlPanelProps> = (props) => (
  <div
    className={`
      absolute right-4 top-1/2 -translate-y-1/2
      w-[9.5rem]
      bg-slate-900/92 backdrop-blur-md
      border border-slate-700/60 rounded-xl
      p-2 shadow-2xl z-20 select-none
    `}
  >
    {/* ── Header ── */}
    <div className="text-center text-[9px] font-mono text-cyan-400 tracking-widest uppercase mb-1.5 border-b border-slate-700/50 pb-1">
      Controls
    </div>

    {/* ── D-pad: 3 cols — FWD/UP/_ then LEFT/BACK/RIGHT ── */}
    <div className="grid grid-cols-3 gap-1 mb-1">
      <HoldButton cfg={DPAD[0]} {...props} />  {/* FWD */}
      <HoldButton cfg={DPAD[1]} {...props} />  {/* UP  */}
      <div />                                   {/* empty */}
      <HoldButton cfg={DPAD[2]} {...props} />  {/* LEFT */}
      <HoldButton cfg={DPAD[3]} {...props} />  {/* BACK */}
      <HoldButton cfg={DPAD[4]} {...props} />  {/* RIGHT */}
    </div>

    {/* ── DOWN centred ── */}
    <div className="flex justify-center mb-2">
      <HoldButton cfg={DOWN_BTN} {...props} />
    </div>

    {/* ── Command buttons ── */}
    <div className="grid grid-cols-3 gap-1 mb-1.5">
      {CMD_BUTTONS.map((cfg) => (
        <HoldButton key={cfg.key} cfg={cfg} {...props} />
      ))}
    </div>

    {/* ── Keyboard hint ── */}
    <div className="border-t border-slate-700/40 pt-1 text-[7.5px] text-slate-500 font-mono text-center leading-snug">
      WASD/↑↓←→ · Spc↑ · Shft↓<br />
      T=TKO · L=LND · R=RST · C=Cam
    </div>
  </div>
);
