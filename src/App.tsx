import { useNetwork } from './context/useNetwork';

import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { OverviewPage } from './components/overview/OverviewPage';
import { LiveMonitoringPage } from './components/monitoring/LiveMonitoringPage';
import { IncidentManagementPage } from './components/incidents/IncidentManagementPage';
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
        return (
          <SectionPlaceholder
            sectionKey="geographic"
            title="Geographic Intelligence & Bihar Mapping"
            subtitle="Geospatial monitoring of Bihar villages, sensor locations, drone base, and flight paths."
            milestone="Scheduled: Session 3"
            plannedFeatures={[
              'Interactive Leaflet map centered on North Bihar (Darbhanga, Sitamarhi, Madhubani)',
              'Sensor node geospatial markers with live status badges',
              'Regional Drone Base marker with active telemetry',
              'Real-time animated drone flight route progression and waypoint tracking',
              'Hazard-affected monitoring zones with color-coded alerts'
            ]}
          />
        );
      case 'incidents':
        return <IncidentManagementPage />;

      case 'drones':
        return (
          <SectionPlaceholder
            sectionKey="drones"
            title="Autonomous Drone Operations Center"
            subtitle="Fleet telemetry, mission assignment, simulated pre-flight checks, and aerial verification."
            milestone="Scheduled: Session 3"
            plannedFeatures={[
              'DRONE-01 and DRONE-02 real-time fleet cards (Battery, Speed, Sortie count)',
              '10-stage mission state machine (Takeoff -> En Route -> Verification -> Return)',
              'Interactive Dispatch Confirmation modal with ETA and distance estimation',
              'Simulated aerial verification outcome generation (HAZARD CONFIRMED, etc.)'
            ]}
          />
        );
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
