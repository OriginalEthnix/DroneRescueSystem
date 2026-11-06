import { describe, it, expect } from 'vitest';
import {
  MinHeap,
  latLngToGrid,
  gridToLatLng,
  runPathfinding,
  calculateAStarFlightRoute,
  DEFAULT_HAZARD_OBSTACLES,
} from '../daa/pathfinding';
import {
  runGreedyTaskAllocation,
  runHungarianTaskAllocation,
  compareTaskAllocationAlgorithms,
} from '../daa/taskAllocation';
import { NeuralNetwork } from '../ai/neuralNet';
import { SwarmDisasterEnv } from '../ai/mappoEnvironment';
import { MAPPOTrainer } from '../ai/mappoAgent';
import type { Drone, Incident, Coordinates } from '../../types';

describe('DAA Pathfinding Engine: A* Search & Dijkstra Algorithm', () => {
  it('MinHeap correctly inserts and pops minimum priority items', () => {
    const heap = new MinHeap();
    heap.insert({ x: 1, y: 1 }, 10);
    heap.insert({ x: 2, y: 2 }, 3);
    heap.insert({ x: 3, y: 3 }, 7);
    heap.insert({ x: 4, y: 4 }, 1);

    expect(heap.size).toBe(4);
    expect(heap.pop()?.priority).toBe(1);
    expect(heap.pop()?.priority).toBe(3);
    expect(heap.pop()?.priority).toBe(7);
    expect(heap.pop()?.priority).toBe(10);
    expect(heap.isEmpty()).toBe(true);
  });

  it('A* finds the shortest path on an unobstructed grid', () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(0));
    const start = { x: 1, y: 1 };
    const goal = { x: 5, y: 5 };

    const result = runPathfinding(grid, start, goal, 'A*', 'octile', true);

    expect(result.found).toBe(true);
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual(start);
    expect(result.path[result.path.length - 1]).toEqual(goal);
    // 4 diagonal steps of cost sqrt(2) ≈ 5.656
    expect(result.cost).toBeCloseTo(4 * Math.SQRT2, 1);
  });

  it('A* successfully detours around impassable obstacle barriers', () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(0));
    // Erect a vertical barrier across x = 3 for y = 0..6
    for (let y = 0; y <= 6; y++) {
      grid[y][3] = 1;
    }

    const start = { x: 1, y: 3 };
    const goal = { x: 6, y: 3 };

    const result = runPathfinding(grid, start, goal, 'A*', 'octile', true);

    expect(result.found).toBe(true);
    // Path must not pass through any blocked cell
    result.path.forEach((p) => {
      expect(grid[p.y][p.x]).toBe(0);
    });
    // Path should go around the barrier (at y >= 7)
    const passedUnder = result.path.some((p) => p.y >= 7);
    expect(passedUnder).toBe(true);
  });

  it('A* gracefully handles completely unreachable targets surrounded by obstacles', () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(0));
    // Enclose (5, 5) with a 3x3 wall box
    grid[4][4] = 1; grid[4][5] = 1; grid[4][6] = 1;
    grid[5][4] = 1;                 grid[5][6] = 1;
    grid[6][4] = 1; grid[6][5] = 1; grid[6][6] = 1;

    const start = { x: 0, y: 0 };
    const goal = { x: 5, y: 5 };

    const result = runPathfinding(grid, start, goal, 'A*', 'octile', true);

    expect(result.found).toBe(false);
    expect(result.path).toHaveLength(0);
    expect(result.unreachableReason).toBeDefined();
  });

  it('Dijkstra expands more or equal nodes than A* while arriving at identical optimal path cost', () => {
    const grid = Array.from({ length: 15 }, () => Array(15).fill(0));
    // Add scattered hazard blocks
    grid[5][5] = 1; grid[6][5] = 1; grid[7][5] = 1;

    const start = { x: 1, y: 1 };
    const goal = { x: 12, y: 12 };

    const astarRes = runPathfinding(grid, start, goal, 'A*', 'octile', true);
    const dijkstraRes = runPathfinding(grid, start, goal, 'Dijkstra', 'dijkstra_zero', true);

    expect(astarRes.found).toBe(true);
    expect(dijkstraRes.found).toBe(true);
    expect(astarRes.cost).toBeCloseTo(dijkstraRes.cost, 1);
    // A* guided by heuristic should expand fewer nodes than blind Dijkstra exploration
    expect(astarRes.expandedNodes).toBeLessThanOrEqual(dijkstraRes.expandedNodes);
  });

  it('Geographic projection accurately converts GPS coordinates and executes A* route', () => {
    const startGps: Coordinates = { lat: 26.1950, lng: 85.9140 }; // Darbhanga Base
    const targetGps: Coordinates = { lat: 26.5937, lng: 85.4894 }; // Sitamarhi

    const gridPt = latLngToGrid(startGps);
    expect(gridPt.x).toBeGreaterThanOrEqual(0);
    expect(gridPt.y).toBeGreaterThanOrEqual(0);

    const reconverted = gridToLatLng(gridPt);
    expect(reconverted.lat).toBeCloseTo(startGps.lat, 0);

    const flightRoute = calculateAStarFlightRoute(startGps, targetGps, DEFAULT_HAZARD_OBSTACLES);
    expect(flightRoute.waypoints.length).toBeGreaterThan(1);
    expect(flightRoute.result.found).toBe(true);
    expect(flightRoute.usedAStar).toBe(true);
  });
});

describe('DAA Multi-Drone Task Allocation: Greedy vs Hungarian (Kuhn-Munkres)', () => {
  const dummyDrones: Drone[] = [
    {
      id: 'DRONE-01',
      callsign: 'Alpha',
      baseCoordinates: { lat: 26.195, lng: 85.914 },
      currentCoordinates: { lat: 26.195, lng: 85.914 },
      status: 'AVAILABLE',
      batteryPercentage: 90,
      currentMissionId: null,
      speedKmh: 65,
      totalMissionsCompleted: 2,
      missionHistory: [],
    },
    {
      id: 'DRONE-02',
      callsign: 'Bravo',
      baseCoordinates: { lat: 26.195, lng: 85.914 },
      currentCoordinates: { lat: 26.195, lng: 85.914 },
      status: 'AVAILABLE',
      batteryPercentage: 65,
      currentMissionId: null,
      speedKmh: 70,
      totalMissionsCompleted: 4,
      missionHistory: [],
    },
  ];

  const dummyIncidents: Incident[] = [
    {
      id: 'INC-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      villageId: 'VILLAGE-B',
      villageName: 'Simulated Village B',
      district: 'Sitamarhi',
      nodeId: 'BIH-SIT-001',
      severity: 'CRITICAL',
      triggerReason: 'Structural Hazard',
      triggerSensor: 'vibration',
      triggerValue: '0.65g',
      configuredThreshold: '0.30g',
      riskScore: 88,
      contributingConditions: [],
      recommendedResponse: 'Dispatch',
      status: 'ACTIVE',
      dispatchEligible: true,
      priorityScore: 92,
      priorityExplanation: 'Critical risk',
      assignedDroneId: null,
      assignedMissionId: null,
      verificationOutcome: null,
      operatorNotes: [],
    },
    {
      id: 'INC-002',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      villageId: 'VILLAGE-C',
      villageName: 'Simulated Village C',
      district: 'Madhubani',
      nodeId: 'BIH-MAD-001',
      severity: 'WARNING',
      triggerReason: 'High Temperature',
      triggerSensor: 'temperature',
      triggerValue: '38C',
      configuredThreshold: '35C',
      riskScore: 62,
      contributingConditions: [],
      recommendedResponse: 'Inspect',
      status: 'ACTIVE',
      dispatchEligible: true,
      priorityScore: 65,
      priorityExplanation: 'Warning risk',
      assignedDroneId: null,
      assignedMissionId: null,
      verificationOutcome: null,
      operatorNotes: [],
    },
  ];

  const villageMap: Record<string, Coordinates> = {
    'VILLAGE-B': { lat: 26.5937, lng: 85.4894 },
    'VILLAGE-C': { lat: 26.3544, lng: 86.0717 },
  };

  it('Both Greedy and Hungarian allocate drones without duplicate assignments', () => {
    const greedyRes = runGreedyTaskAllocation(dummyDrones, dummyIncidents, villageMap);
    const hungarianRes = runHungarianTaskAllocation(dummyDrones, dummyIncidents, villageMap);

    expect(greedyRes.assignments.length).toBe(2);
    expect(hungarianRes.assignments.length).toBe(2);

    // Verify uniqueness of assigned drones
    const greedyDroneIds = greedyRes.assignments.map((a) => a.droneId);
    expect(new Set(greedyDroneIds).size).toBe(2);

    const hungarianDroneIds = hungarianRes.assignments.map((a) => a.droneId);
    expect(new Set(hungarianDroneIds).size).toBe(2);
  });

  it('Hungarian algorithm achieves equal or lower total cost than Greedy allocation', () => {
    const comp = compareTaskAllocationAlgorithms(dummyDrones, dummyIncidents, villageMap);

    expect(comp.hungarian.totalCost).toBeLessThanOrEqual(comp.greedy.totalCost + 0.01);
    expect(comp.explanation).toBeDefined();
  });
});

describe('AI Multi-Agent RL: Neural Network & MAPPO Training Engine', () => {
  it('NeuralNetwork forward pass outputs valid probabilities with Softmax', () => {
    const net = new NeuralNetwork([8, 16, 5]);
    const input = [0.1, 0.2, 0.9, -0.3, 0.4, 0.5, 0.8, 0.6];
    const { output } = net.forward(input, 'softmax');

    expect(output).toHaveLength(5);
    const sum = output.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
    output.forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });

  it('NeuralNetwork parameter update alters weights after backprop gradients', () => {
    const net = new NeuralNetwork([4, 8, 2]);
    const initialWeightVal = net.layers[0].weights[0][0];

    // Dummy gradients
    const gradW = net.layers.map((l) =>
      Array.from({ length: l.biases.length }, () => new Array(l.weights[0].length).fill(0.1))
    );
    const gradB = net.layers.map((l) => new Array(l.biases.length).fill(0.1));

    net.applyGradients(gradW, gradB, 0.05);
    const newWeightVal = net.layers[0].weights[0][0];

    expect(newWeightVal).not.toBe(initialWeightVal);
  });

  it('SwarmDisasterEnv advances agents, docks verifications, and calculates rewards', () => {
    const env = new SwarmDisasterEnv(15, 15, 2, 2, 10);
    const initialObs = env.reset(2, 2);

    expect(Object.keys(initialObs)).toHaveLength(2);
    expect(initialObs['agent-0']).toHaveLength(8);

    // Step agents North
    const stepResult = env.step({ 'agent-0': 1, 'agent-1': 1 });

    expect(stepResult.observations['agent-0']).toBeDefined();
    expect(stepResult.rewards['agent-0']).toBeDefined();
    expect(typeof stepResult.rewards['agent-0']).toBe('number');
    expect(stepResult.globalState.length).toBeGreaterThan(0);
  });

  it('MAPPOTrainer executes a full training episode and exports serializable model', () => {
    const env = new SwarmDisasterEnv(12, 12, 2, 2, 15);
    const trainer = new MAPPOTrainer(8, 5, 18);

    const metrics = trainer.trainSingleEpisode(env);

    expect(metrics.episode).toBe(1);
    expect(typeof metrics.totalReward).toBe('number');
    expect(metrics.steps).toBeGreaterThan(0);
    expect(metrics.criticLoss).toBeGreaterThanOrEqual(0);

    const exported = trainer.exportMAPPO();
    expect(exported.actorModel.layerSizes).toEqual([8, 32, 16, 5]);
    expect(exported.criticModel.layerSizes).toEqual([18, 48, 24, 1]);
    expect(exported.trainedEpisodes).toBe(1);

    // Verify model can be loaded back into a new trainer instance
    const restoredTrainer = new MAPPOTrainer(8, 5, 18, exported);
    expect(restoredTrainer.totalTrainedEpisodes).toBe(1);
  });
});
