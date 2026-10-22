# SESSION HANDOFF — SESSION 0: PROJECT AUDIT AND IMPLEMENTATION PLAN

## 1. Project Identity & Objective
- **Project Name:** Distributed Environmental Intelligence Network (Real-Time Hazard Monitoring & Autonomous Drone Response)
- **Target Deployment:** Rural geographic simulation in North Bihar, India (Darbhanga, Sitamarhi, Madhubani).
- **Core Mission:** A zero-backend, fully frontend-driven, enterprise-grade environmental command center simulating distributed IoT sensor telemetry, transparent rule-based risk calculation, threshold-based incident management, autonomous drone dispatch workflows, and geospatial map visualization.

---

## 2. Repository & Technical Audit
- **Initial Repository State:** The workspace folder `c:\Users\DELL\Desktop\Drone Rescue System` was empty at start. The authoritative specification was located in [MASTER_PROMPT.md](file:///c:/Users/DELL/Desktop/Drone%20Rescue%20System/MASTER_PROMPT.md).
- **Established Stack:**
  - **Framework & Build:** React 19, Vite 8, TypeScript 6
  - **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` integrated)
  - **Geospatial Mapping:** Leaflet 1.9, React-Leaflet 5, `@types/leaflet`
  - **Data Visualization & Telemetry Charts:** Recharts 2.15
  - **Icons:** Lucide React
  - **Status:** Scaffolded, all dependencies installed, build verified with `npm run build` (0 TypeScript / 0 bundler errors).

---

## 3. Architecture & Modular Design
To prevent code duplication and guarantee strict data consistency across all views:
```
src/
├── types/
│   └── index.ts                 # Authoritative shared data models
├── context/
│   └── NetworkContext.tsx       # Centralized ApplicationState store & actions
├── services/
│   ├── simulationEngine.ts      # Coherent sensor updates & 8 reproducible scenarios
│   ├── riskEngine.ts            # Transparent multi-factor scoring (0-100) with explainable factors
│   ├── alertService.ts          # Deduplicating threshold detector & incident lifecycle
│   ├── droneMissionService.ts   # Multi-state drone simulation & waypoint routing
│   ├── geographicService.ts     # Bihar coordinate reference, distances, and paths
│   ├── eventLogService.ts       # Chronological audit trail
│   └── storageService.ts        # LocalStorage persistence & clean reset
├── components/
│   ├── layout/                  # Sidebar, TopBar (with SIMULATION MODE badge)
│   ├── overview/                # KPI cards, Bihar map preview, activity feed
│   ├── monitoring/              # Searchable sensor node cards, filter bar, node details modal
│   ├── map/                     # Leaflet Bihar map, village markers, drone paths, animated drones
│   ├── incidents/               # Sortable incident management table, filter, detail/resolve modal
│   ├── drones/                  # Drone fleet cards, dispatch confirmation modal, mission progress tracker
│   ├── analytics/               # Recharts trends, cross-village risk comparison, severity distribution
│   ├── configuration/           # Threshold tuning, weight adjustments, simulation interval
│   ├── eventLog/                # Filterable chronological event stream
│   └── scenarios/               # One-click Scenario Simulator & Demonstration Mode runner
└── App.tsx
```

---

## 4. Shared Data Model Summary
All components consume from a single reactive state root (`ApplicationState`):
- **Villages:** 3 simulated locations (`VILLAGE-A` Darbhanga, `VILLAGE-B` Sitamarhi, `VILLAGE-C` Madhubani).
- **Sensor Nodes:** At least 2 nodes per village (6 total: `BIH-DAR-001`, `BIH-DAR-002`, `BIH-SIT-001`, etc.).
- **5 Sensor Types per Node:**
  1. Temperature: Normal range 27.0°C–28.0°C; warning >35°C, critical >40°C.
  2. Humidity: Normal range 45%–70%; warning >80%, critical >90%.
  3. Motion: PIR sensor with state, detection count, and last detection time.
  4. LiDAR: Distance in meters; normal >3.0m, warning 1.5m–3.0m, critical <1.5m.
  5. Vibration: Magnitude in g; normal <0.15g, warning 0.15g–0.30g, critical >0.30g.
- **Risk Score:** Transparent 0–100 scale clamped, categorised into Normal (0–29), Warning (30–59), High Risk (60–79), and Critical (80–100). Contributing factors are surfaced as human-readable strings.
- **Incidents:** Deduplicated active violations with lifecycle states: `ACTIVE` → `ACKNOWLEDGED` → `DRONE_REQUESTED` → `DRONE_EN_ROUTE` → `UNDER_INVESTIGATION` → `RESOLVED`.
- **Drones:** At least two simulated units (`DRONE-01`, `DRONE-02`) with battery management and the 10-phase mission lifecycle (`AVAILABLE`, `MISSION_ASSIGNED`, `PRE_FLIGHT_CHECK`, `TAKEOFF`, `EN_ROUTE`, `APPROACHING_TARGET`, `ARRIVED`, `AERIAL_VERIFICATION`, `MISSION_COMPLETE`, `RETURNING_TO_BASE`).

---

## 5. Requirement-to-Module Implementation Checklist

| # | Master Prompt Requirement | Planned Module | Verification Method |
|---|---|---|---|
| 1 | Local execution without backend/API keys | `Vite + React Context` | Local `npm run build && npm run preview` |
| 2 | 3 Bihar Village Locations (Darbhanga, Sitamarhi, Madhubani) | `geographicService.ts` | Map view & Overview page displays |
| 3 | Multiple sensor nodes per village (>= 2) | `types/index.ts`, `simulationEngine.ts` | Live Monitoring grid filter by village |
| 4 | 5 Sensor types per node (Temp, Hum, Motion, LiDAR, Vib) | `SensorNodeCard.tsx` | Node detail inspector shows all 5 metrics |
| 5 | Normal temperature starts 27°C–28°C | `simulationEngine.ts` | Verification on initial load and reset |
| 6 | Coherent simulation updates (every 2-3s) | `simulationEngine.ts` | Timer loop keeps smooth temporal continuity |
| 7 | Configurable thresholds | `configuration/`, `storageService.ts` | Configuration page updates live thresholds |
| 8 | Threshold-based alert generation | `alertService.ts` | Violation immediately creates incident |
| 9 | Multi-factor risk calculation (0-100) | `riskEngine.ts` | Unit test / live display with breakdown |
| 10 | Explainable alert triggers | `AlertPanel.tsx`, `IncidentTable.tsx` | Contributing factors listed in alert card |
| 11 | Eligible drone dispatch button | `DroneOperationsPage.tsx` | Shows for critical / >=60 risk incidents |
| 12 | Dispatch confirmation modal | `DroneDispatchModal.tsx` | Requires explicit operator confirmation |
| 13 | At least 2 simulated drones available | `droneMissionService.ts` | DRONE-01 and DRONE-02 visible in fleet |
| 14 | Prevent conflicting drone assignments | `droneMissionService.ts` | Validation prohibits dual-assignment |
| 15 | Drone mission path on Bihar map | `VillageMap.tsx` | Leaflet polyline & animated marker |
| 16 | 10-stage mission state progression | `droneMissionService.ts` | State progresses realistically |
| 17 | Simulated aerial verification outcome | `droneMissionService.ts` | Generates labeled simulated outcome |
| 18 | Consistent data across all 8 pages | `NetworkContext.tsx` | State changes in one view reflect everywhere |
| 19 | Chronological event log | `eventLogService.ts` | Audit trail of all system transitions |
| 20 | Pause / Resume / Reset simulation controls | `simulationEngine.ts` | Global controls in TopBar / Control Panel |
| 21 | 8 Scenario presets (A through H) | `scenarios/` | One-click triggers change exact node states |
| 22 | Demonstration Mode workflow (Steps 1-12) | `DemonstrationMode.tsx` | Automated step-by-step presentation runner |
| 23 | Export incident and mission reports (CSV/JSON) | `exportService.ts` | Browser file download |
| 24 | Prominent SIMULATION MODE badge | `TopBar.tsx` | Constant visual disclaimer in header |

---

## 6. Implementation Sequence & Order of Work
1. **Session 1 (Next): Core Engine & Shared State Foundation**
   - Implement `geographicService.ts`, `storageService.ts`, `riskEngine.ts`, `alertService.ts`, and `simulationEngine.ts`.
   - Implement `NetworkContext.tsx` with full state initialization, simulation interval loop, deduplicated incident creation, and localStorage persistence.
2. **Session 2: Command Center Shell & Monitoring Pages**
   - TopBar (with Simulation badge, metrics, pause/resume/reset), Sidebar navigation.
   - Overview Page (KPI metrics, activity feed, village status cards).
   - Live Monitoring Page (sensor grid, filtering, detailed node drawer, historical mini-charts).
3. **Session 3: Geospatial Map & Drone Operations Engine**
   - Bihar Leaflet Map integration (custom dark tiles, village markers, sensor markers, drone base, incident pulses).
   - Drone Operations Page, drone dispatch confirmation modal, flight path animation, 10-stage mission transitions, aerial verification reports.
4. **Session 4: Incidents, Scenarios, Analytics, Configuration, & Demonstration Mode**
   - Incident Management Table with filtering, status updates, and note-taking.
   - 8-Scenario Simulator panel + Guided Step-by-Step Demonstration Mode.
   - Analytics Page (Recharts multi-metric trends and risk distributions).
   - Configuration Page (thresholds, weights, simulation rate).
   - Event Log & CSV/JSON Export.

---

## 7. Commands for Verification
- **Run dev server:** `npm run dev`
- **Build production bundle:** `npm run build`
- **Preview production build:** `npm run preview`
- **Lint:** `npm run lint`

---

## 8. Status & Instructions for Next Session
- **Status:** Baseline foundation established. Vite, Tailwind CSS v4, Lucide React, Leaflet, and Recharts are installed and building cleanly. Core TypeScript contracts are established in `src/types/index.ts`.
- **Blockers:** None.
- **Instruction:** In Session 1, begin implementing the simulation engine, risk calculation engine, alert deduplication service, and `NetworkContext.tsx`.
