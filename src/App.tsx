import React, { useState } from 'react';
import { useNetwork } from './context/useNetwork';

import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { OverviewPage } from './components/overview/OverviewPage';
import { LiveMonitoringPage } from './components/monitoring/LiveMonitoringPage';
import { GeographicIntelligencePage } from './components/map/GeographicIntelligencePage';
import { IncidentManagementPage } from './components/incidents/IncidentManagementPage';
import { DroneOperationsPage } from './components/drones/DroneOperationsPage';
import { AlgorithmsLaboratoryPage } from './components/algorithms/AlgorithmsLaboratoryPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { ConfigurationPage } from './components/configuration/ConfigurationPage';
import { EventLogPage } from './components/eventLog/EventLogPage';
import { DemonstrationMode } from './components/scenarios/DemonstrationMode';
import { ScenarioSimulatorModal } from './components/scenarios/ScenarioSimulatorModal';
import { NetworkHealthModal } from './components/network/NetworkHealthModal';
import { MultiSensorCorrelationModal } from './components/analytics/MultiSensorCorrelationModal';
import { ResetConfirmationModal } from './components/common/ResetConfirmationModal';
import { DroneSimulatorPage } from './components/simulator/DroneSimulatorPage';

export const AppContent: React.FC = () => {
  const { state, resetSimulation } = useNetwork();
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isNetworkHealthOpen, setIsNetworkHealthOpen] = useState<boolean>(false);
  const [isCorrelationsOpen, setIsCorrelationsOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  const renderActiveSection = () => {
    switch (state.activeSection) {
      case 'overview':
        return <OverviewPage />;
      case 'monitoring':
        return <LiveMonitoringPage />;
      case 'geographic':
        return <GeographicIntelligencePage />;
      case 'incidents':
        return <IncidentManagementPage />;
      case 'drones':
        return <DroneOperationsPage />;
      case 'ai-algorithms':
        return <AlgorithmsLaboratoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'configuration':
        return <ConfigurationPage />;
      case 'event-log':
        return <EventLogPage />;
      case 'drone-simulator':
        return <DroneSimulatorPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation (Responsive Drawer on Mobile, Fixed on Desktop) */}
      <Sidebar 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar with Header & Telemetry */}
        <TopBar 
          onOpenDemo={() => setIsDemoOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenNetworkHealth={() => setIsNetworkHealthOpen(true)}
          onOpenCorrelations={() => setIsCorrelationsOpen(true)}
          onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        {/* Scrollable Viewport — full-bleed for simulator, padded for all others */}
        {state.activeSection === 'drone-simulator' ? (
          <main className="flex-1 overflow-hidden">
            {renderActiveSection()}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/50">
            <div className="max-w-7xl mx-auto">
              {renderActiveSection()}
            </div>
          </main>
        )}
      </div>

      {/* Scenario Simulator Modal (All 8 Scenarios A to H) */}
      <ScenarioSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Network Health Diagnostics Modal */}
      <NetworkHealthModal
        isOpen={isNetworkHealthOpen}
        onClose={() => setIsNetworkHealthOpen(false)}
      />

      {/* Multi-Sensor Correlation Engine Modal */}
      <MultiSensorCorrelationModal
        isOpen={isCorrelationsOpen}
        onClose={() => setIsCorrelationsOpen(false)}
      />

      {/* Guided 12-Step Faculty Demonstration Runner */}
      <DemonstrationMode
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />

      {/* Explicit System Reset Confirmation Modal */}
      <ResetConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirmBaseline={() => resetSimulation('baseline')}
        onConfirmFactory={() => resetSimulation('factory')}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
