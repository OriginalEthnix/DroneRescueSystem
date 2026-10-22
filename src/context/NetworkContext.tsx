import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ApplicationState, NavigationSection, VillageId, SimulationScenarioId, SensorNode, ThresholdConfig } from '../types';

import { INITIAL_APPLICATION_STATE } from '../constants/initialState';
import { stepNormalNode, applyScenarioToNodes, updateVillagesFromNodes } from '../services/simulationEngine';
import { calculateNodeRisk } from '../services/riskEngine';
import { processAlertsForNodes } from '../services/alertService';

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
  setScenario: (scenario: SimulationScenarioId, targetNodeId?: string) => void;
  toggleNodeOffline: (nodeId: string) => void;
  acknowledgeIncident: (incidentId: string) => void;
  resolveIncident: (incidentId: string, notes?: string) => void;
  addIncidentNote: (incidentId: string, note: string) => void;
  updateThresholds: (thresholds: Partial<ThresholdConfig>) => void;
}


const NetworkContext = createContext<NetworkContextValue | null>(null);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ApplicationState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.villages && parsed.sensorNodes && parsed.drones) {
          return {
            ...parsed,
            simulationRunning: false, // Default paused on fresh load for safety
            activeSection: 'overview',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to restore saved network state, using clean defaults', e);
    }
    return INITIAL_APPLICATION_STATE;
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);


  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist network state to localStorage', e);
    }
  }, [state]);

  /**
   * Central Simulation Clock Tick
   * Runs only when simulationRunning is true.
   * Updates sensor nodes smoothly, evaluates risks, updates village aggregates,
   * while keeping existing incidents and drone missions intact.
   */
  const handleSimulationTick = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.simulationRunning) return;

    const timestamp = new Date().toISOString();
    const thresholds = currentState.thresholds;
    const currentNodes = currentState.sensorNodes;
    const updatedNodes: Record<string, SensorNode> = {};

    Object.keys(currentNodes).forEach((id) => {
      const node = currentNodes[id];

      // If a scenario forced an anomaly or offline, let it persist or gently fluctuate
      let steppedNode = stepNormalNode(node, thresholds, timestamp);

      // Recalculate transparent risk based on new values
      const riskResult = calculateNodeRisk(steppedNode, thresholds);
      steppedNode = {
        ...steppedNode,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        contributingFactors: riskResult.contributingFactors,
      };

      updatedNodes[id] = steppedNode;
    });

    const updatedVillages = updateVillagesFromNodes(currentState.villages, updatedNodes, timestamp);

    // Process threshold alerts and update deduplicated incidents
    const { updatedIncidents, newLogs } = processAlertsForNodes(
      updatedNodes,
      updatedVillages,
      currentState.incidents,
      thresholds,
      currentState.drones,
      timestamp
    );

    setState((prev) => ({
      ...prev,
      lastTickTimestamp: timestamp,
      sensorNodes: updatedNodes,
      villages: updatedVillages,
      incidents: updatedIncidents,
      eventLogs: newLogs.length > 0 ? [...newLogs, ...prev.eventLogs] : prev.eventLogs,
      // Drones and missions remain intact
    }));
  }, []);


  // Timer loop with speed control and leak prevention
  useEffect(() => {
    if (!state.simulationRunning) return;

    const intervalMs = Math.max(
      500,
      Math.round(state.thresholds.simulationIntervalMs / state.simulationSpeed)
    );

    const timer = setInterval(() => {
      handleSimulationTick();
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [state.simulationRunning, state.simulationSpeed, state.thresholds.simulationIntervalMs, handleSimulationTick]);

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

  const setScenario = (scenario: SimulationScenarioId, targetNodeId: string = 'BIH-SIT-001') => {
    setState((prev) => {
      const timestamp = new Date().toISOString();
      const mutatedNodes = applyScenarioToNodes(scenario, prev.sensorNodes, prev.thresholds, targetNodeId, timestamp);

      // Recalculate risks for mutated nodes
      const evaluatedNodes: Record<string, SensorNode> = {};
      Object.keys(mutatedNodes).forEach((id) => {
        const node = mutatedNodes[id];
        const risk = calculateNodeRisk(node, prev.thresholds);
        evaluatedNodes[id] = {
          ...node,
          riskScore: risk.score,
          riskLevel: risk.level,
          contributingFactors: risk.contributingFactors,
        };
      });

      const updatedVillages = updateVillagesFromNodes(prev.villages, evaluatedNodes, timestamp);

      const { updatedIncidents, newLogs } = processAlertsForNodes(
        evaluatedNodes,
        updatedVillages,
        prev.incidents,
        prev.thresholds,
        prev.drones,
        timestamp
      );

      return {
        ...prev,
        activeScenario: scenario,
        lastTickTimestamp: timestamp,
        sensorNodes: evaluatedNodes,
        villages: updatedVillages,
        incidents: updatedIncidents,
        eventLogs: newLogs.length > 0 ? [...newLogs, ...prev.eventLogs] : prev.eventLogs,
      };
    });
  };


  const toggleNodeOffline = (nodeId: string) => {
    setState((prev) => {
      const node = prev.sensorNodes[nodeId];
      if (!node) return prev;
      const isNowOffline = node.status !== 'OFFLINE';
      const timestamp = new Date().toISOString();

      const updatedNode: SensorNode = {
        ...node,
        status: isNowOffline ? 'OFFLINE' : 'ONLINE',
        isStale: isNowOffline,
        signalQuality: isNowOffline ? 0 : 92,
        latencyMs: isNowOffline ? 9999 : 45,
        lastUpdated: timestamp,
        lastSuccessfulTransmission: isNowOffline ? node.lastSuccessfulTransmission : timestamp,
      };

      const risk = calculateNodeRisk(updatedNode, prev.thresholds);
      updatedNode.riskScore = risk.score;
      updatedNode.riskLevel = risk.level;
      updatedNode.contributingFactors = risk.contributingFactors;

      const updatedNodes = { ...prev.sensorNodes, [nodeId]: updatedNode };
      const updatedVillages = updateVillagesFromNodes(prev.villages, updatedNodes, timestamp);

      return {
        ...prev,
        sensorNodes: updatedNodes,
        villages: updatedVillages,
      };
    });
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


  const addIncidentNote = (incidentId: string, note: string) => {

    setState((prev) => {
      const incident = prev.incidents[incidentId];
      if (!incident) return prev;
      return {
        ...prev,
        incidents: {
          ...prev.incidents,
          [incidentId]: {
            ...incident,
            operatorNotes: [...incident.operatorNotes, note],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const updateThresholds = (newThresholds: Partial<ThresholdConfig>) => {
    setState((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        ...newThresholds,
      },
    }));
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
        toggleNodeOffline,
        acknowledgeIncident,
        resolveIncident,
        addIncidentNote,
        updateThresholds,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );

};

export { NetworkContext };
