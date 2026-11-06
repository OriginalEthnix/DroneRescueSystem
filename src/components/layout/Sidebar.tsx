import React from 'react';
import { 
  Activity, 
  Radio, 
  MapPin, 
  AlertTriangle, 
  Plane, 
  Cpu,
  BarChart3, 
  Settings, 
  ScrollText, 
  ShieldAlert,
  ChevronRight,
  X,
  Gamepad2
} from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';
import type { NavigationSection } from '../../types';

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { state, setActiveSection } = useNetwork();

  const activeIncidentsCount = Object.values(state.incidents).filter(
    (inc) => inc.status !== 'RESOLVED'
  ).length;

  const activeDronesCount = Object.values(state.drones).filter(
    (drone) => drone.status !== 'AVAILABLE'
  ).length;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'monitoring', label: 'Live Monitoring', icon: Radio, badge: Object.keys(state.sensorNodes).length },
    { id: 'geographic', label: 'Geographic Intelligence', icon: MapPin },
    { 
      id: 'incidents', 
      label: 'Incident Management', 
      icon: AlertTriangle, 
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30'
    },
    { 
      id: 'drones', 
      label: 'Drone Operations', 
      icon: Plane,
      badge: activeDronesCount > 0 ? activeDronesCount : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
    },
    { 
      id: 'ai-algorithms', 
      label: 'AI & DAA Algorithms', 
      icon: Cpu,
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'event-log', label: 'Event Log', icon: ScrollText, badge: state.eventLogs.length },
    { 
      id: 'drone-simulator', 
      label: '3D Drone Simulator', 
      icon: Gamepad2,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
    },
  ];

  const handleNavClick = (id: NavigationSection) => {
    setActiveSection(id);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col shrink-0 select-none transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Primary Navigation"
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 
                className="font-bold text-slate-100 text-xs tracking-wider uppercase leading-tight"
                title="AI-Based Multi-Agent Swarm Robot System for Autonomous Disaster and Rescue Using Reinforcement Learning"
              >
                AI Swarm Robot System
              </h1>
              <p className="text-[9px] text-cyan-400/90 font-mono tracking-tight uppercase">
                Disaster & Rescue
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 md:hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Command Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = state.activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Target Sectors Quick Status */}
        <div className="p-3 m-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px]">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>Active Sectors</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span className="truncate">Sim Village A (Darbhanga)</span>
              <span className="text-emerald-400 text-[10px]">NORMAL</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="truncate">Sim Village B (Sitamarhi)</span>
              <span className="text-emerald-400 text-[10px]">NORMAL</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="truncate">Sim Village C (Madhubani)</span>
              <span className="text-emerald-400 text-[10px]">NORMAL</span>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Core State Active</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
        </div>
      </aside>
    </>
  );
};
