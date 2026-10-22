import { useNetwork } from './context/useNetwork';

import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { OverviewPage } from './components/overview/OverviewPage';
import { LiveMonitoringPage } from './components/monitoring/LiveMonitoringPage';
import { GeographicIntelligencePage } from './components/map/GeographicIntelligencePage';
import { IncidentManagementPage } from './components/incidents/IncidentManagementPage';
import { DroneOperationsPage } from './components/drones/DroneOperationsPage';
import { SectionPlaceholder } from './components/common/SectionPlaceholder';




export const AppContent: React.FC = () => {
  const { state } = useNetwork();

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
        return (
          <SectionPlaceholder
            sectionKey="analytics"
            title="Environmental Telemetry Analytics"
            subtitle="Long-term trend analysis, multi-sensor correlations, and village risk benchmarking."
            milestone="Scheduled: Session 4"
            plannedFeatures={[
              'Recharts multi-series historical trend charts (Temperature, Humidity, Vibration)',
              'LiDAR distance delta tracking and proximity hazard analysis',
              'Cross-village risk index comparison bar charts',
              'Drone response time distributions and sortie duration benchmarks'
            ]}
          />
        );
      case 'configuration':
        return (
          <SectionPlaceholder
            sectionKey="configuration"
            title="System Threshold & Risk Engine Configuration"
            subtitle="Customizable hazard thresholds, scoring weights, and simulation engine parameters."
            milestone="Scheduled: Session 4"
            plannedFeatures={[
              'Configurable temperature, humidity, LiDAR, and vibration thresholds',
              'Risk engine weight adjustment sliders (0-100 normalization)',
              'Drone automatic dispatch threshold cutoffs',
              'Simulation tick rate and speed multipliers'
            ]}
          />
        );
      case 'event-log':
        return (
          <SectionPlaceholder
            sectionKey="event-log"
            title="Audit Trail & Chronological Event Log"
            subtitle="Immutable operational event stream recording threshold breaches, drone flights, and resolutions."
            milestone="Scheduled: Session 4"
            plannedFeatures={[
              'Chronological event stream with category tags (SENSOR, THRESHOLD, DRONE, SYSTEM)',
              'Search and severity filtering',
              'Export audit logs as formatted JSON or CSV files',
              'Printable mission verification summaries'
            ]}
          />
        );
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
        <TopBar />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
