import React, { useState } from 'react';
import { useNetwork } from './context/useNetwork';

import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { OverviewPage } from './components/overview/OverviewPage';
import { LiveMonitoringPage } from './components/monitoring/LiveMonitoringPage';
import { GeographicIntelligencePage } from './components/map/GeographicIntelligencePage';
import { IncidentManagementPage } from './components/incidents/IncidentManagementPage';
import { DroneOperationsPage } from './components/drones/DroneOperationsPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { ConfigurationPage } from './components/configuration/ConfigurationPage';
import { EventLogPage } from './components/eventLog/EventLogPage';
import { DemonstrationMode } from './components/scenarios/DemonstrationMode';

export const AppContent: React.FC = () => {
  const { state } = useNetwork();
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);

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
      case 'analytics':
        return <AnalyticsPage />;
      case 'configuration':
        return <ConfigurationPage />;
      case 'event-log':
        return <EventLogPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar with Header & Telemetry */}
        <TopBar onOpenDemo={() => setIsDemoOpen(true)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* Guided 12-Step Faculty Demonstration Runner */}
      <DemonstrationMode
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
