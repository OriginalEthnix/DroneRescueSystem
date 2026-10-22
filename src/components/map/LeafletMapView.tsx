import React, { useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  Polyline, 
  useMap 
} from 'react-leaflet';
import {
  BIHAR_MAP_CENTER,
  BIHAR_DEFAULT_ZOOM,
  createVillageIcon,
  createSensorNodeIcon,
  createDroneBaseIcon,
  createDroneMarkerIcon
} from './mapUtils';
import type { Village, SensorNode, Drone, DroneMission, Incident, VillageId } from '../../types';


interface MapViewControllerProps {
  selectedVillage: Village | null;
  selectedNode: SensorNode | null;
}

// Controller component to smoothly fly to selected locations
export const MapViewController: React.FC<MapViewControllerProps> = ({ selectedVillage, selectedNode }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedNode) {
      map.flyTo([selectedNode.coordinates.lat, selectedNode.coordinates.lng], 13, { duration: 1.2 });
    } else if (selectedVillage) {
      map.flyTo([selectedVillage.coordinates.lat, selectedVillage.coordinates.lng], 11, { duration: 1.2 });
    }
  }, [selectedVillage, selectedNode, map]);

  return null;
};


interface LeafletMapViewProps {
  villages: Village[];
  sensorNodes: SensorNode[];
  drones: Drone[];
  missions: DroneMission[];
  incidents: Incident[];
  selectedVillageId: VillageId | null;
  selectedNodeId: string | null;
  onSelectVillage: (id: VillageId) => void;
  onSelectNode: (id: string) => void;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  villages,
  sensorNodes,
  drones,
  missions,
  incidents,
  selectedVillageId,
  selectedNodeId,
  onSelectVillage,
  onSelectNode,
}) => {
  const selectedVillage = villages.find((v) => v.id === selectedVillageId) || null;
  const selectedNode = sensorNodes.find((n) => n.nodeId === selectedNodeId) || null;

  return (
    <MapContainer
      center={[BIHAR_MAP_CENTER.lat, BIHAR_MAP_CENTER.lng]}
      zoom={BIHAR_DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl"
      style={{ background: '#0b0f19' }}
    >
      {/* Dark Matter CartoDB / OpenStreetMap accessible tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />

      <MapViewController 
        selectedVillage={selectedVillage} 
        selectedNode={selectedNode} 
      />

      {/* 1. Affected Monitoring Zones (Hazard Pulses / Circles) */}
      {villages.map((village) => {
        const villageIncidents = incidents.filter(
          (i) => i.villageId === village.id && i.status !== 'RESOLVED'
        );
        const hasCritical = villageIncidents.some((i) => i.severity === 'CRITICAL');
        const hasWarning = villageIncidents.some((i) => i.severity === 'WARNING');

        const circleColor = hasCritical ? '#ef4444' : hasWarning ? '#f59e0b' : '#06b6d4';

        return (
          <Circle
            key={`zone-${village.id}`}
            center={[village.coordinates.lat, village.coordinates.lng]}
            radius={hasCritical ? 7500 : 5000}
            pathOptions={{
              color: circleColor,
              fillColor: circleColor,
              fillOpacity: hasCritical ? 0.2 : 0.08,
              dashArray: hasCritical ? '4, 4' : undefined,
              weight: hasCritical ? 2 : 1,
            }}
          />
        );
      })}

      {/* 2. Mission Routes (Base -> Target Village/Node) */}
      {missions
        .filter((m) => m.status !== 'AVAILABLE')
        .map((m) => {
          return (
            <Polyline
              key={`route-${m.id}`}
              positions={m.routeCoordinates.map((c) => [c.lat, c.lng])}
              pathOptions={{
                color: '#38bdf8',
                weight: 3,
                dashArray: '6, 8',
                opacity: 0.85,
              }}
            />
          );
        })}

      {/* 3. Drone Operations Base Marker */}
      {drones.length > 0 && (
        <Marker
          position={[drones[0].baseCoordinates.lat, drones[0].baseCoordinates.lng]}
          icon={createDroneBaseIcon()}
        >
          <Popup className="custom-popup">
            <div className="p-2 text-xs font-mono space-y-1">
              <div className="font-bold text-indigo-400">Regional Drone Operations Command</div>
              <div className="text-slate-300">Station: Darbhanga Air Terminal Hub</div>
              <div className="text-slate-400 text-[10px]">Fleet Standby: 2 Tactical Reconnaissance UAVs</div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* 4. Active Drone In-Flight Markers */}
      {drones
        .filter((d) => d.status !== 'AVAILABLE')
        .map((drone) => (
          <Marker
            key={`flight-${drone.id}`}
            position={[drone.currentCoordinates.lat, drone.currentCoordinates.lng]}
            icon={createDroneMarkerIcon(drone.callsign, drone.status)}
          >
            <Popup className="custom-popup">
              <div className="p-2 text-xs font-mono space-y-1">
                <div className="font-bold text-cyan-400">{drone.callsign} ({drone.id})</div>
                <div className="text-slate-300">Status: {drone.status}</div>
                <div className="text-slate-300">Battery: {drone.batteryPercentage}%</div>
                <div className="text-slate-300">Cruising Speed: {drone.speedKmh} km/h</div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* 5. Village Markers */}
      {villages.map((village) => (
        <Marker
          key={village.id}
          position={[village.coordinates.lat, village.coordinates.lng]}
          icon={createVillageIcon(village.status, village.name)}
          eventHandlers={{
            click: () => onSelectVillage(village.id),
          }}
        >
          <Popup className="custom-popup">
            <div className="p-2 text-xs font-sans space-y-1.5 max-w-xs">
              <div className="font-bold text-slate-100 text-sm">{village.name}</div>
              <div className="text-cyan-400 font-mono text-[11px]">
                District: {village.district} (Approximate Simulation Coordinates: {village.coordinates.lat.toFixed(4)}, {village.coordinates.lng.toFixed(4)})
              </div>
              <div className="text-slate-400 text-[11px]">{village.primaryConcern}</div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px] font-mono">
                <span>Risk Index: <strong className="text-slate-200">{village.currentRiskScore}/100</strong></span>
                <span className={`font-bold ${village.status === 'CRITICAL' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {village.status}
                </span>
              </div>
              <button
                onClick={() => onSelectVillage(village.id)}
                className="w-full mt-2 py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] text-center block"
              >
                Inspect Village Telemetry
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* 6. Individual Sensor Node Markers */}
      {sensorNodes.map((node) => (
        <Marker
          key={node.nodeId}
          position={[node.coordinates.lat, node.coordinates.lng]}
          icon={createSensorNodeIcon(node.nodeId, node.status, node.isStale)}
          eventHandlers={{
            click: () => onSelectNode(node.nodeId),
          }}
        >
          <Popup className="custom-popup">
            <div className="p-2 text-xs font-mono space-y-1">
              <div className="font-bold text-cyan-400">{node.nodeId}</div>
              <div className="text-slate-300">Sector: {node.villageId} ({node.district})</div>
              <div className="text-slate-300">Temp: {node.sensors.temperature.value}°C</div>
              <div className="text-slate-300">Humidity: {node.sensors.humidity.value}%</div>
              <div className="text-slate-300">LiDAR Dist: {node.sensors.lidar.value}m</div>
              <div className="text-slate-300">Vibration: {node.sensors.vibration.value}g</div>
              <div className="text-slate-400 text-[10px]">
                Status: {node.status} {node.isStale ? '(STALE)' : ''}
              </div>
              <button
                onClick={() => onSelectNode(node.nodeId)}
                className="w-full mt-1.5 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px] text-center block"
              >
                View Node Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
