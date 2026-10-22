import React, { createContext, useState, useEffect } from 'react';

import type { ApplicationState, NavigationSection, VillageId, SimulationScenarioId } from '../types';

import { INITIAL_APPLICATION_STATE } from '../constants/initialState';

const STORAGE_KEY = 'BIHAR_DRONE_RESCUE_STATE_V1';

interface NetworkContextValue {
  state: ApplicationState;
  setActiveSection: (section: NavigationSection) => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  resetSimulation: () => void;
  selectVillage: (id: VillageId | null) => void;
  selectNode: (id: string | null) => void;
  selectIncident: (id: string | null) => void;
  selectDrone: (id: string | null) => void;
  setScenario: (scenario: SimulationScenarioId) => void;
  acknowledgeIncident: (incidentId: string) => void;
  resolveIncident: (incidentId: string, notes?: string) => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ApplicationState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify key integrity
        if (parsed.villages && parsed.sensorNodes && parsed.drones) {
          return {
            ...parsed,
            // default simulation to paused upon load for stability
            simulationRunning: false,
            activeSection: 'overview',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to restore saved network state, using clean defaults', e);
    }
    return INITIAL_APPLICATION_STATE;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist network state to localStorage', e);
    }
  }, [state]);

  const setActiveSection = (section: NavigationSection) => {
    setState((prev) => ({ ...prev, activeSection: section }));
  };

  const toggleSimulation = () => {
    setState((prev) => ({
      ...prev,
      simulationRunning: !prev.simulationRunning,
      lastTickTimestamp: new Date().toISOString(),
    }));
  };

  const setSimulationSpeed = (speed: number) => {
    setState((prev) => ({ ...prev, simulationSpeed: speed }));
  };

  const resetSimulation = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setState({
      ...INITIAL_APPLICATION_STATE,
      lastTickTimestamp: new Date().toISOString(),
    });
  };

  const selectVillage = (id: VillageId | null) => {
    setState((prev) => ({ ...prev, selectedVillageId: id }));
  };

  const selectNode = (id: string | null) => {
    setState((prev) => ({ ...prev, selectedNodeId: id }));
  };

  const selectIncident = (id: string | null) => {
    setState((prev) => ({ ...prev, selectedIncidentId: id }));
  };

  const selectDrone = (id: string | null) => {
    setState((prev) => ({ ...prev, selectedDroneId: id }));
  };

  const setScenario = (scenario: SimulationScenarioId) => {
    setState((prev) => ({ ...prev, activeScenario: scenario }));
  };

  const acknowledgeIncident = (incidentId: string) => {
    setState((prev) => {
      const incident = prev.incidents[incidentId];
      if (!incident) return prev;
      return {
        ...prev,
        incidents: {
          ...prev.incidents,
          [incidentId]: {
            ...incident,
            status: 'ACKNOWLEDGED',
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const resolveIncident = (incidentId: string, notes?: string) => {
    setState((prev) => {
      const incident = prev.incidents[incidentId];
      if (!incident) return prev;
      return {
        ...prev,
        incidents: {
          ...prev.incidents,
          [incidentId]: {
            ...incident,
            status: 'RESOLVED',
            updatedAt: new Date().toISOString(),
            operatorNotes: notes ? [...incident.operatorNotes, notes] : incident.operatorNotes,
          },
        },
      };
    });
  };

  return (
    <NetworkContext.Provider
      value={{
        state,
        setActiveSection,
        toggleSimulation,
        setSimulationSpeed,
        resetSimulation,
        selectVillage,
        selectNode,
        selectIncident,
        selectDrone,
        setScenario,
        acknowledgeIncident,
        resolveIncident,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export { NetworkContext };

