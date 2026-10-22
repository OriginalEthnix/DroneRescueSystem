import L from 'leaflet';

export const BIHAR_MAP_CENTER = { lat: 26.35, lng: 85.8 };
export const BIHAR_DEFAULT_ZOOM = 9;

export const createVillageIcon = (status: string, villageName: string) => {
  const color = 
    status === 'CRITICAL' ? '#ef4444' : 
    status === 'WARNING' ? '#f59e0b' : '#10b981';
  
  const pulseClass = status === 'CRITICAL' ? 'animate-ping' : '';

  return L.divIcon({
    className: 'custom-village-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: ${color}; opacity: 0.25;" class="${pulseClass}"></div>
        <div style="width: 24px; height: 24px; border-radius: 9999px; background: #0f172a; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color}80;">
          <div style="width: 8px; height: 8px; border-radius: 9999px; background: ${color};"></div>
        </div>
        <div style="margin-top: 4px; padding: 2px 6px; border-radius: 4px; background: #020617ee; border: 1px solid ${color}60; color: #f8fafc; font-size: 10px; font-weight: bold; white-space: nowrap; font-family: monospace; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">
          ${villageName} [${status}]
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

export const createSensorNodeIcon = (nodeId: string, status: string, isStale?: boolean) => {
  const color = isStale || status === 'OFFLINE' ? '#64748b' :
    status === 'CRITICAL' ? '#ef4444' :
    status === 'WARNING' ? '#f59e0b' : '#06b6d4';

  return L.divIcon({
    className: 'custom-sensor-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="width: 14px; height: 14px; border-radius: 3px; background: #0f172a; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center;">
          <div style="width: 4px; height: 4px; border-radius: 1px; background: ${color};"></div>
        </div>
        <div style="padding: 1px 4px; border-radius: 3px; background: #020617ee; border: 1px solid ${color}50; color: #cbd5e1; font-size: 9px; font-family: monospace; white-space: nowrap; margin-top: 2px;">
          ${nodeId}
        </div>
      </div>
    `,
    iconSize: [20, 26],
    iconAnchor: [10, 26],
  });
};

export const createDroneBaseIcon = () => {
  return L.divIcon({
    className: 'custom-drone-base-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: #1e1b4b; border: 2px solid #818cf8; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(129, 140, 248, 0.4);">
          <span style="font-size: 14px;">🛸</span>
        </div>
        <div style="margin-top: 2px; padding: 2px 6px; border-radius: 4px; background: #020617; border: 1px solid #818cf8; color: #c7d2fe; font-size: 10px; font-weight: bold; font-family: monospace;">
          DRONE BASE (Darbhanga Hub)
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

export const createDroneMarkerIcon = (callsign: string, status: string) => {
  return L.divIcon({
    className: 'custom-drone-active-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #082f49; border: 2.5px solid #38bdf8; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(56, 189, 248, 0.6); animation: spin 4s linear infinite;">
          <span style="font-size: 16px;">✈️</span>
        </div>
        <div style="margin-top: 3px; padding: 1px 5px; border-radius: 3px; background: #0369a1; color: #fff; font-size: 9px; font-weight: bold; font-family: monospace; white-space: nowrap;">
          ${callsign} [${status}]
        </div>
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 22],
  });
};
