Distributed Environmental Intelligence Network
An Intelligent Sensor-Based Hazard Monitoring and Autonomous Drone Dispatch System

ROLE:
Act as a senior full-stack developer, UI/UX designer, IoT systems architect, and frontend simulation engineer.

Your task is to design and implement a complete, professional, highly interactive web application that simulates a Distributed Environmental Intelligence Network.

This project combines:
1. Distributed environmental sensor nodes.
2. Real-time environmental data monitoring.
3. Threshold-based hazard detection.
4. Multi-sensor data fusion.
5. Geographic monitoring of rural villages in Bihar, India.
6. Autonomous drone dispatch simulation.
7. Live incident tracking.
8. A centralized monitoring and command dashboard.

IMPORTANT:
This is a demonstration and simulation of an intelligent monitoring system.

Unless actual hardware or backend integrations are explicitly configured, sensor values, alerts, drone movements, and dispatch operations must be simulated. Never falsely represent simulated operations as real hardware telemetry or actual drone flights.

Build the actual working frontend, not just a static mockup or design concept.

==================================================
1. PROJECT BACKGROUND AND OBJECTIVE
==================================================

The Distributed Environmental Intelligence Network is a decentralized environmental monitoring architecture designed to identify potentially dangerous conditions in rural and remote areas.

Distributed sensor nodes continuously monitor environmental parameters and transmit readings to a central monitoring dashboard.

An intelligent risk engine analyzes these readings and determines whether a monitored location requires attention.

When a sensor reading crosses a configured threshold, or multiple sensor readings collectively indicate a potentially dangerous situation, the system should:

- Generate an alert.
- Identify the affected village.
- Calculate and display a risk score.
- Highlight the affected sensor node.
- Explain which conditions triggered the alert.
- Recommend an appropriate response.
- Provide an option to dispatch a drone for aerial verification.
- Simulate the drone mission and update its status.
- Record the incident and its response in an incident history.

The objective is to demonstrate how distributed sensing, edge intelligence, geospatial visualization, and autonomous aerial verification could work together.

The application should look like a professional environmental intelligence command center rather than a generic IoT dashboard.

==================================================
2. GEOGRAPHIC SIMULATION: THREE BIHAR VILLAGES
==================================================

Create a simulation covering three fictionalized monitoring locations in Bihar, India.

Use the following locations:

VILLAGE 1:
Name: Simulated Village A
District: Darbhanga
Region: North Bihar
Primary monitoring concern: Flood-related environmental changes.

VILLAGE 2:
Name: Simulated Village B
District: Sitamarhi
Region: North Bihar
Primary monitoring concern: Flooding, unusual environmental conditions, and infrastructure safety.

VILLAGE 3:
Name: Simulated Village C
District: Madhubani
Region: North Bihar
Primary monitoring concern: Environmental anomalies and local infrastructure safety.

These are simulation labels, not verified real village names.

Display all three monitoring locations on an interactive map of Bihar.

Use actual village coordinates only if they can be verified. Otherwise, use clearly labeled approximate simulation coordinates within the respective districts.

Each village must have:
- A unique village ID.
- A district name.
- A geographic location.
- At least two simulated sensor nodes.
- A unique node identifier for each sensor node.
- A current risk score.
- A current operational status.
- A collection of sensor readings.
- An incident history.
- Drone mission availability.
- A last-updated timestamp.

Users must be able to select any village and inspect its sensor nodes and readings.

The map should visually distinguish:
- Normal locations.
- Locations requiring attention.
- Locations with active critical alerts.
- Locations with a drone mission in progress.
- Offline or disconnected nodes.

Provide a map legend explaining the different markers and colors.

==================================================
3. SENSOR NODE ARCHITECTURE
==================================================

Each sensor node must simulate five types of environmental and physical sensors.

SENSOR 1: TEMPERATURE

Display:
- Current temperature in degrees Celsius.
- Configured minimum and maximum values.
- Current sensor status.
- A small historical temperature chart.
- A visual indication when the reading crosses a threshold.

Normal simulation range:
27°C–28°C.

Use an initial reading between 27°C and 28°C for every normal node.

Configurable warning threshold:
Temperature greater than 35°C.

Configurable critical threshold:
Temperature greater than 40°C.

These thresholds must be configurable through the dashboard.

The initial readings must remain in the requested 27°C–28°C range unless the user enables a simulation scenario that intentionally changes the values.

SENSOR 2: HUMIDITY

Display:
- Current relative humidity as a percentage.
- Normal, warning, or critical status.
- A historical humidity chart.
- Configurable thresholds.

Suggested initial normal range:
45%–70%.

Suggested warning threshold:
Humidity greater than 80%.

Suggested critical threshold:
Humidity greater than 90%.

Make these thresholds configurable.

Explain that humidity thresholds are demonstration parameters and may need to be adjusted for the intended real-world hazard.

SENSOR 3: MOTION

Simulate a motion sensor such as a PIR sensor.

Display:
- Motion detected or no motion.
- Last detection time.
- Detection count.
- Sensor operational status.

Provide realistic simulation events such as:
- No movement detected.
- Brief movement detected.
- Repeated movement detected.
- Unexpected movement near a monitored location.

Motion alone must not automatically imply a dangerous situation.

The system should evaluate motion alongside the other sensor readings and the configured monitoring rules.

SENSOR 4: LIDAR

Simulate a LiDAR distance sensor.

Display:
- Measured distance in meters.
- Distance trend.
- Sensor status.
- Warning and critical conditions.
- A small visual representation of distance to a detected surface or object.

Suggested demonstration thresholds:
- Above 3.0 meters: normal.
- Between 1.5 and 3.0 meters: warning.
- Below 1.5 meters: critical proximity alert.

Allow the user to modify these values.

For environmental monitoring, LiDAR may represent the distance to a nearby surface, a water-level reference, or an obstacle, depending on the selected simulation mode.

Clearly identify what the simulated distance measurement represents.

Do not claim that LiDAR directly measures flood depth unless the sensor configuration and reference geometry support that interpretation.

SENSOR 5: VIBRATION

Simulate a vibration sensor or accelerometer-based vibration measurement.

Display:
- Current vibration magnitude.
- Measurement unit.
- Baseline value.
- Recent vibration history.
- Warning and critical status.

Use a clearly defined simulated measurement, such as vibration acceleration in g.

Suggested demonstration thresholds:
- Below 0.15 g: normal.
- 0.15 g–0.30 g: warning.
- Above 0.30 g: critical.

These are illustrative software thresholds, not universal safety standards.

Provide configurable thresholds and simulated vibration events.

==================================================
4. SENSOR NODE DASHBOARD
==================================================

Create a dedicated sensor monitoring section.

Each node should appear as a modern dashboard card.

Example:

NODE ID: BIH-DAR-001
LOCATION: Simulated Village A
STATUS: ONLINE
TEMPERATURE: 27.6°C
HUMIDITY: 64%
MOTION: NOT DETECTED
LIDAR DISTANCE: 4.8 m
VIBRATION: 0.04 g
RISK SCORE: 12/100
LAST UPDATED: Just now

Use appropriate icons and visual indicators for each sensor.

Provide clear status labels:
- NORMAL
- WARNING
- CRITICAL
- OFFLINE

Use green for normal, amber for warning, red for critical, and gray for offline.

Do not rely on colors alone; always include readable status labels.

Each card should support:
- Clicking to open detailed node information.
- Viewing recent readings.
- Viewing sensor history.
- Checking active alerts.
- Inspecting the node's village.
- Viewing its connectivity status.

Add a sensor grid with filters for:
- Village.
- District.
- Node status.
- Sensor type.
- Alert severity.

==================================================
5. REAL-TIME SENSOR SIMULATION ENGINE
==================================================

Implement a functional simulation engine.

The dashboard should not depend on manually hardcoded static cards.

Generate and maintain sensor data using a centralized simulation state.

Suggested implementation:
- Update sensor readings every 2–3 seconds.
- Use small random fluctuations for normal readings.
- Keep normal temperatures within the requested 27°C–28°C range.
- Keep normal humidity within its configured normal range.
- Occasionally generate motion events.
- Gradually vary simulated LiDAR distance.
- Generate small baseline vibration changes.
- Generate an alert only when the configured rules are satisfied.

Important:
Do not independently randomize every sensor value without maintaining state.

The simulation should behave coherently over time.

For example:
- A normal sensor should remain normal until an event or scenario changes its values.
- A triggered incident should remain visible until acknowledged or resolved.
- An active drone mission should continue progressing even while sensor readings update.
- Historical charts should retain recent data.
- The risk score should respond to the current readings.
- Repeated sensor updates should not create duplicate incidents for the same uninterrupted event.

Provide a global simulation control panel with:

1. Start Simulation.
2. Pause Simulation.
3. Reset Simulation.
4. Simulation Speed.
5. Trigger Warning Scenario.
6. Trigger Critical Scenario.
7. Trigger Custom Scenario.

The user must be able to pause the simulation without losing the current state.

The reset button should restore the initial normal readings and clear simulation-generated active missions after confirmation.

Display a visible SIMULATION MODE badge.

==================================================
6. INTELLIGENT RISK ENGINE
==================================================

Implement a transparent, rule-based risk engine that evaluates the sensor readings.

Do not use arbitrary risk scores that are disconnected from the sensor values.

The risk engine should evaluate:
- Temperature deviation.
- Humidity deviation.
- Motion activity.
- LiDAR distance.
- Vibration magnitude.
- Sensor connectivity.
- The combination of simultaneous anomalies.

Produce a risk score between 0 and 100.

Suggested risk categories:

0–29:
NORMAL

30–59:
WARNING

60–79:
HIGH RISK

80–100:
CRITICAL

These categories are demonstration settings and should be configurable.

The scoring logic should be understandable and explainable.

For every elevated risk score, show the reasons behind it.

Example:

RISK SCORE: 78/100
STATUS: HIGH RISK

Contributing factors:
- LiDAR distance crossed the configured proximity threshold.
- Vibration exceeded its warning threshold.
- Repeated motion events were detected.
- Multiple anomalies occurred within the same monitoring window.

The user should be able to inspect exactly which rules contributed to the score.

Use a weighted scoring system or another transparent deterministic approach.

Ensure that risk scores are clamped between 0 and 100.

Avoid double-counting the same persistent reading on every update.

Critical individual conditions should be handled through explicit rules rather than being obscured by an average score.

For example, a critical LiDAR proximity reading can trigger a critical alert even if the temperature is normal.

Separate:
- Sensor status.
- Overall risk score.
- Alert severity.
- Recommended response.

Do not treat these as interchangeable concepts.

==================================================
7. THRESHOLD-BASED ALERT SYSTEM
==================================================

This is one of the most important features.

When any configured threshold is crossed, the system should create an alert.

Example:

ALERT ID: INC-2026-001
LOCATION: Simulated Village B
NODE: BIH-SIT-001
SEVERITY: CRITICAL
TRIGGER: Vibration exceeded the configured critical threshold.
TEMPERATURE: 27.8°C
HUMIDITY: 86%
MOTION: DETECTED
LIDAR: 1.1 m
VIBRATION: 0.37 g
RISK SCORE: 91/100
STATUS: ACTIVE

The exact values above are illustrative.

The alert interface must display:
- Unique incident ID.
- Date and time.
- Affected village.
- Affected sensor node.
- Triggering sensor.
- Triggering value.
- Configured threshold.
- Risk score.
- Alert severity.
- Contributing conditions.
- Recommended response.
- Incident status.

Provide alert statuses:
- Active.
- Acknowledged.
- Drone Requested.
- Drone En Route.
- Under Investigation.
- Resolved.

Allow users to:
- Acknowledge an alert.
- Inspect its details.
- Dispatch a drone.
- View the related village on the map.
- View the associated sensor node.
- Add investigation notes.
- Resolve the incident.

Do not automatically mark an incident resolved merely because a sensor reading returns to normal.

Require an explicit resolution action or a clearly defined simulated verification workflow.

Prevent duplicate alerts for the same continuous threshold violation.

Create a new incident only when appropriate, such as when a previously resolved condition occurs again.

==================================================
8. DRONE DISPATCH SYSTEM
==================================================

Implement a complete interactive drone dispatch simulation.

A drone dispatch option must appear when:
- A configured critical threshold is crossed.
- The risk score reaches a configurable dispatch threshold.
- Multiple sensor anomalies satisfy a predefined combined-risk rule.

The dispatch threshold should be configurable.

Suggested default:
Risk score of 60 or above, subject to the configured dispatch rules.

For warning-level alerts, provide an option to request manual verification if appropriate.

The dashboard should present a clear action button:

[ DISPATCH DRONE ]

When the user clicks the button, open a dispatch confirmation modal.

The modal should display:
- Incident ID.
- Target village.
- Target sensor node.
- Incident severity.
- Reason for dispatch.
- Drone availability.
- Estimated distance to the target.
- Estimated time to arrival.
- Battery status.
- Mission priority.

Provide buttons:
[ CONFIRM DISPATCH ]
[ CANCEL ]

Do not start the simulated mission until the user confirms dispatch.

After confirmation, create a simulated drone mission and update the interface.

Suggested mission states:

1. AVAILABLE
2. MISSION ASSIGNED
3. PRE-FLIGHT CHECK
4. TAKEOFF
5. EN ROUTE
6. APPROACHING TARGET
7. ARRIVED
8. AERIAL VERIFICATION
9. MISSION COMPLETE
10. RETURNING TO BASE
11. AVAILABLE

Use realistic but simulated progress transitions.

Show:
- Drone ID.
- Current mission.
- Target village.
- Mission status.
- Battery percentage.
- Estimated arrival time.
- Distance remaining.
- Mission elapsed time.
- Current simulated position.
- Mission history.

Create at least two simulated drones.

Example:

DRONE-01
Status: AVAILABLE
Battery: 94%

DRONE-02
Status: AVAILABLE
Battery: 87%

Allow the system to assign an available drone based on distance, battery, and mission priority.

If no drone is available, show a clear message and provide an option to queue the mission.

Do not assign the same drone to two simultaneous missions.

Add mission cancellation controls before takeoff and a safe simulated return-to-base workflow for missions already in progress.

==================================================
9. DRONE FLIGHT AND MAP SIMULATION
==================================================

Create an interactive geographic map centered on Bihar.

Use a mapping library such as Leaflet with OpenStreetMap tiles, provided the application can access the required map resources.

Show:
- Three village locations.
- Sensor node markers.
- Drone base.
- Drone positions.
- Incident locations.
- Mission routes.
- Affected monitoring zones.

When a drone is dispatched:
- Draw a route from the drone base to the target village.
- Animate the drone marker along the route.
- Update the mission progress.
- Update the estimated remaining distance.
- Update the mission status.
- Highlight the target incident.

When the drone reaches the target:
- Show an aerial verification phase.
- Simulate a verification result.
- Add the result to the incident record.
- Let the operator decide whether the incident should be escalated or marked resolved.

Example verification outcomes:
- Hazard confirmed.
- Hazard not confirmed.
- Further investigation required.

The verification result must be generated by the simulation and clearly labeled as simulated.

Never claim that an actual aerial image, GPS reading, or physical drone observation was obtained.

If live map tiles are unavailable, provide a useful fallback map view or clearly labeled geographic simulation.

==================================================
10. PROFESSIONAL COMMAND-CENTER UI
==================================================

Design the application as an enterprise-grade environmental intelligence platform.

Visual inspiration:
- Modern disaster response command centers.
- Aviation mission control dashboards.
- Professional IoT monitoring platforms.
- Dark, high-contrast operational interfaces.

Suggested design:
- Dark navy or charcoal background.
- Subtle borders and card separation.
- Clear typography.
- Restrained green, amber, red, and blue status accents.
- Well-organized information hierarchy.
- Minimal unnecessary gradients.
- Consistent icons.
- Smooth, purposeful animations.
- Responsive layouts.

Avoid:
- Generic template appearance.
- Excessive neon effects.
- Excessive rounded cards.
- Huge decorative headings.
- Randomly moving elements.
- Unnecessary animations.
- Fake live data labels without a simulation indicator.

The interface must look suitable for a university project demonstration to faculty members.

Add the following application header:

DISTRIBUTED ENVIRONMENTAL INTELLIGENCE NETWORK

Subtitle:
Real-Time Hazard Monitoring & Autonomous Drone Response

Display:
- System status.
- Simulation mode.
- Active alerts.
- Online sensor nodes.
- Available drones.
- Last simulation update.

==================================================
11. APPLICATION PAGES AND SECTIONS
==================================================

Create a sidebar with the following sections.

A. OVERVIEW

Display:
- Total sensor nodes.
- Online nodes.
- Active incidents.
- Critical incidents.
- Available drones.
- Active drone missions.
- Average environmental risk.
- Recent alerts.

Include a map preview and a real-time activity feed.

B. LIVE MONITORING

Display all sensor nodes in a searchable and filterable grid.

Show live simulated sensor readings and historical charts.

Allow the operator to inspect individual nodes.

C. GEOGRAPHIC INTELLIGENCE

Show the Bihar map, village markers, sensor nodes, drone base, incidents, and mission routes.

Allow users to select a village and inspect its monitoring data.

D. INCIDENT MANAGEMENT

Display a sortable incident table.

Include:
- Incident ID.
- Village.
- Sensor node.
- Severity.
- Trigger.
- Risk score.
- Time detected.
- Current status.
- Available actions.

E. DRONE OPERATIONS

Display all simulated drones and their mission statuses.

Include mission assignment, dispatch confirmation, mission progress, battery status, and mission history.

F. ANALYTICS

Display:
- Temperature trends.
- Humidity trends.
- Vibration trends.
- LiDAR distance trends.
- Motion event frequency.
- Village-level risk comparisons.
- Incident frequency.
- Alert severity distribution.
- Drone response times.

Use meaningful charts with labels and legends.

G. CONFIGURATION

Allow operators to configure:
- Sensor warning thresholds.
- Sensor critical thresholds.
- Risk scoring weights.
- Overall risk categories.
- Drone dispatch threshold.
- Simulation update frequency.
- Simulation speed.
- Village monitoring settings.

H. EVENT LOG

Maintain a chronological log of:
- Sensor threshold crossings.
- Risk score changes.
- Alerts created.
- Alerts acknowledged.
- Drone dispatch requests.
- Drone mission transitions.
- Verification outcomes.
- Incident resolution.

==================================================
12. ADVANCED FEATURES AND CREATIVE IMPROVEMENTS
==================================================

Add the following features where practical.

FEATURE 1: SCENARIO SIMULATOR

Provide one-click scenarios.

Scenario A: Normal Conditions
All nodes report normal readings.

Scenario B: Temperature Anomaly
A selected node's temperature rises above its configured warning threshold.

Scenario C: High Humidity
Humidity increases and triggers a warning.

Scenario D: Structural Vibration
Vibration exceeds its critical threshold.

Scenario E: Proximity Hazard
LiDAR reports a distance below the configured critical threshold.

Scenario F: Combined Sensor Anomaly
Multiple sensors at one node report abnormal values.

Scenario G: Multi-Village Incident
Two or more villages report anomalies simultaneously.

Scenario H: Sensor Node Offline
A node stops transmitting readings.

Each scenario should produce a meaningful and reproducible result.

Provide a reset option for returning to normal conditions.

FEATURE 2: MULTI-SENSOR CORRELATION

Demonstrate how combined readings can improve the prioritization of incidents.

Example:
An isolated motion event may only require observation.

Repeated motion combined with abnormal vibration may warrant investigation.

Critical LiDAR proximity combined with unusual vibration may justify a higher-priority response.

Clearly explain why a combination of readings changes the risk level.

Do not present these correlations as validated scientific conclusions. They are demonstration rules that can be adjusted for the intended deployment.

FEATURE 3: NETWORK HEALTH

Display:
- Number of connected nodes.
- Number of disconnected nodes.
- Simulated signal quality.
- Simulated communication latency.
- Last successful transmission.
- Node battery level, if included in the simulation.

Provide a network-health visualization.

If a node goes offline, mark its readings as stale rather than silently continuing to present them as live measurements.

FEATURE 4: ALERT PRIORITIZATION

Rank incidents using:
- Severity.
- Risk score.
- Number of affected nodes.
- Age of the incident.
- Mission availability.

Explain the prioritization criteria.

FEATURE 5: DRONE MISSION REPORT

After a simulated mission completes, generate a mission summary containing:
- Mission ID.
- Incident ID.
- Target village.
- Assigned drone.
- Dispatch time.
- Simulated arrival time.
- Verification result.
- Mission duration.
- Final status.
- Operator notes.

Allow the user to inspect the report.

FEATURE 6: DEMONSTRATION MODE

Create a presentation-friendly mode for faculty demonstrations.

It should:
- Show a clean overview.
- Make all three villages visible.
- Highlight active incidents.
- Make threshold violations obvious.
- Provide a prominent drone dispatch button.
- Show the drone mission progression.
- Display a final simulated verification report.

Include a guided demonstration sequence that the operator can start manually.

FEATURE 7: EXPORT

Allow incident records and mission summaries to be exported as CSV or JSON.

If possible, allow the operator to export a simple printable mission report.

==================================================
13. TECHNICAL IMPLEMENTATION
==================================================

Use a modern, maintainable frontend stack.

Preferred technologies:
- React.
- Vite.
- TypeScript or JavaScript.
- Tailwind CSS.
- Recharts for data visualization.
- React Leaflet and Leaflet for maps.
- Lucide React for icons.

You may use equivalent technologies if there is a strong technical reason.

Organize the code into reusable components.

Suggested components:

App
Sidebar
TopBar
OverviewPage
LiveMonitoringPage
SensorNodeCard
SensorDetailPanel
VillageMap
VillageDetailsPanel
RiskScoreCard
AlertPanel
IncidentTable
DroneOperationsPage
DroneDispatchModal
DroneMissionTracker
AnalyticsPage
ConfigurationPage
EventLog
ScenarioSimulator

Suggested logical modules:

simulationEngine
sensorService
riskEngine
alertService
droneMissionService
geographicService
eventLogService
storageService

Separate business logic from UI components.

Use a shared application state so that sensor readings, risk scores, alerts, map markers, and drone missions stay synchronized.

Do not generate separate inconsistent mock datasets for different screens.

The same incident must appear consistently in:
- The overview.
- The map.
- The incident management table.
- The drone operations page.
- The event log.

Persist useful simulation state in localStorage so that refreshing the browser does not immediately erase all information.

Provide an explicit reset option.

If no backend is available, implement the complete simulation in the frontend.

Do not require AWS credentials or API keys for the basic demonstration.

Keep the architecture ready for future integration with:
- Real sensor hardware.
- MQTT or HTTP telemetry.
- LoRaWAN gateways.
- An API backend.
- A database.
- A drone control interface.

Do not claim these integrations exist unless they are actually implemented and configured.

==================================================
14. SUGGESTED DATA MODEL
==================================================

Create a centralized data model for sensor nodes.

Example:

{
  "nodeId": "BIH-DAR-001",
  "villageId": "VILLAGE-A",
  "district": "Darbhanga",
  "status": "ONLINE",
  "lastUpdated": "ISO_TIMESTAMP",
  "sensors": {
    "temperature": {
      "value": 27.6,
      "unit": "°C",
      "status": "NORMAL"
    },
    "humidity": {
      "value": 64,
      "unit": "%",
      "status": "NORMAL"
    },
    "motion": {
      "detected": false,
      "status": "NORMAL"
    },
    "lidar": {
      "distance": 4.8,
      "unit": "m",
      "status": "NORMAL"
    },
    "vibration": {
      "value": 0.04,
      "unit": "g",
      "status": "NORMAL"
    }
  },
  "riskScore": 12,
  "riskLevel": "NORMAL"
}

This is an illustrative structure.

Adapt it to the final application architecture.

Create corresponding data models for:
- Villages.
- Sensor nodes.
- Sensor readings.
- Incidents.
- Drones.
- Drone missions.
- Alert history.
- Event logs.
- Threshold configurations.

Use unique IDs and timestamps consistently.

==================================================
15. FUNCTIONAL REQUIREMENTS
==================================================

The finished application must satisfy the following requirements.

1. The frontend must start successfully.

2. The overview must display all three Bihar monitoring locations.

3. Each village must have multiple simulated sensor nodes.

4. Each sensor node must show all five sensor types.

5. Normal temperature readings must start between 27°C and 28°C.

6. Sensor values must update coherently during the simulation.

7. Thresholds must be configurable.

8. Crossing a threshold must create an alert.

9. Risk scores must be calculated using actual sensor readings and explicit rules.

10. The dashboard must explain why an alert was generated.

11. A drone dispatch action must appear for eligible incidents.

12. Dispatch must require user confirmation.

13. At least two simulated drones must be available initially.

14. The same drone must not be assigned to conflicting simultaneous missions.

15. Confirmed dispatch must create a visible mission.

16. The drone marker must progress along the simulated mission route.

17. Mission states must update over time.

18. The mission must produce a simulated verification result.

19. Incident information must remain consistent across application pages.

20. The event log must record important actions.

21. Users must be able to pause and resume the simulation.

22. Users must be able to trigger warning and critical scenarios.

23. Users must be able to return the system to its initial state.

24. The interface must work on desktop and mobile screens.

25. All important buttons must perform their intended actions.

26. No navigation item should lead to an empty placeholder page.

27. No critical functionality should depend on a paid API.

28. The application must display clear loading, empty, and error states where appropriate.

29. The user must be able to complete a full demonstration without manually editing source code.

30. The application must clearly distinguish simulated information from real telemetry.

==================================================
16. REQUIRED DEMONSTRATION WORKFLOW
==================================================

The application must support the following end-to-end demonstration.

STEP 1:
Open the dashboard.

Display three monitored villages in Bihar.

All sensor nodes initially report normal conditions.

Temperature readings should be between 27°C and 28°C.

STEP 2:
Open the live monitoring page.

Select a sensor node in Simulated Village B.

Inspect temperature, humidity, motion, LiDAR distance, and vibration readings.

STEP 3:
Open the scenario simulator.

Trigger the Combined Sensor Anomaly scenario for the selected node.

STEP 4:
The selected node's sensor readings change to reflect the scenario.

For example:
- Temperature: 27.8°C.
- Humidity: 86%.
- Motion: DETECTED.
- LiDAR distance: 1.1 m.
- Vibration: 0.37 g.

These are illustrative simulated values.

STEP 5:
The risk engine recalculates the node's risk score.

The interface highlights the abnormal readings and explains which thresholds were crossed.

STEP 6:
A critical incident is created.

The alert appears in the overview, incident management page, map, and event log.

STEP 7:
The operator clicks DISPATCH DRONE.

A confirmation modal displays the incident details and available drones.

STEP 8:
The operator confirms the dispatch.

An available drone is assigned to the incident.

STEP 9:
The drone changes to MISSION ASSIGNED, performs simulated pre-flight checks, takes off, and follows the route to the selected village.

The map and mission tracker update continuously.

STEP 10:
The drone reaches the destination and begins simulated aerial verification.

STEP 11:
The simulation generates a verification outcome, such as HAZARD CONFIRMED.

The incident record is updated with the verification result.

STEP 12:
The operator reviews the mission report and chooses the next action.

The system should demonstrate how distributed sensing, intelligent risk assessment, incident management, and drone dispatch work together.

==================================================
17. DESIGN QUALITY AND FINAL DELIVERY
==================================================

Deliver a polished, usable, working application.

Prioritize:
- Functional behavior.
- Professional visual design.
- Consistent application state.
- Clear risk explanations.
- Smooth drone mission visualization.
- Reliable scenario simulation.
- Maintainable code.
- A successful live demonstration.

Do not return only:
- A design description.
- A static HTML mockup.
- A collection of disconnected components.
- A screenshot.
- A nonfunctional dashboard.
- Pseudocode in place of implementation.

Actually implement the application.

If you have access to a coding environment, create the files and verify the application runs.

If you cannot create files directly, provide complete, copy-paste-ready code with clear file names and setup instructions.

Do not omit required imports, components, styles, dependencies, or configuration files.

Avoid unnecessary complexity.

The core application must work locally without requiring a real drone, real sensors, or a remote backend.

Before finishing, verify the complete demonstration workflow, including:

1. Normal sensor readings.
2. Threshold crossing.
3. Risk score recalculation.
4. Alert creation.
5. Drone dispatch confirmation.
6. Drone mission progression.
7. Simulated aerial verification.
8. Incident history updates.
9. Simulation reset.

FINAL OBJECTIVE:

Build a professional, interactive Distributed Environmental Intelligence Network dashboard that demonstrates how sensor nodes distributed across three Bihar villages can detect abnormal environmental conditions, prioritize incidents, and initiate simulated autonomous drone missions for further investigation.

The application should be impressive enough for a live university project demonstration while remaining understandable, technically coherent, and straightforward to run.
