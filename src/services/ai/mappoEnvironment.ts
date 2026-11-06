// Multi-Agent Drone Swarm Disaster & Rescue Environment (MAPPO Grid Simulation)
// Formulates the cooperative Multi-Agent Markov Decision Process (MAMDP).

export interface AgentState {
  id: string;
  callsign: string;
  x: number;
  y: number;
  battery: number;
  active: boolean;
  totalSteps: number;
  targetsRescued: number;
}

export interface TargetIncident {
  id: string;
  x: number;
  y: number;
  urgency: number; // 1 (Minor), 2 (High), 3 (Critical)
  verified: boolean;
}

export interface HazardCell {
  x: number;
  y: number;
  label: string;
}

export interface StepResult {
  observations: Record<string, number[]>;
  rewards: Record<string, number>;
  dones: Record<string, boolean>;
  globalState: number[];
  info: {
    targetsRemaining: number;
    hazardCollisions: number;
    swarmCollisions: number;
    missionComplete: boolean;
    stepCount: number;
  };
}

export class SwarmDisasterEnv {
  public width: number;
  public height: number;
  public agents: AgentState[] = [];
  public targets: TargetIncident[] = [];
  public hazards: HazardCell[] = [];
  public currentStep: number = 0;
  public maxSteps: number = 50;

  constructor(
    width: number = 15,
    height: number = 15,
    numAgents: number = 2,
    numTargets: number = 3,
    maxSteps: number = 50
  ) {
    this.width = width;
    this.height = height;
    this.maxSteps = maxSteps;
    this.reset(numAgents, numTargets);
  }

  /**
   * Resets environment to deterministic or randomized initial configuration.
   */
  reset(numAgents: number = 2, numTargets: number = 3, _seed?: number): Record<string, number[]> {
    this.currentStep = 0;
    this.agents = [];
    this.targets = [];
    this.hazards = [];

    // Setup Swarm Agents at base station (south-center / airport)
    const callsigns = ['UAV-Alpha', 'UAV-Bravo', 'UAV-Charlie', 'UAV-Delta'];
    for (let i = 0; i < numAgents; i++) {
      this.agents.push({
        id: `agent-${i}`,
        callsign: callsigns[i % callsigns.length],
        x: Math.min(this.width - 1, 2 + i * 3),
        y: this.height - 2, // Near base
        battery: 100,
        active: true,
        totalSteps: 0,
        targetsRescued: 0,
      });
    }

    // Place Disaster Incidents across northern and central sectors
    const defaultTargetPositions = [
      { x: 3, y: 3, urgency: 3 },  // Critical North-West
      { x: 11, y: 4, urgency: 2 }, // High North-East
      { x: 7, y: 7, urgency: 1 },  // Moderate Center
      { x: 12, y: 10, urgency: 2 },
    ];

    for (let i = 0; i < numTargets; i++) {
      const pos = defaultTargetPositions[i % defaultTargetPositions.length];
      this.targets.push({
        id: `TGT-${i + 1}`,
        x: pos.x,
        y: pos.y,
        urgency: pos.urgency,
        verified: false,
      });
    }

    // Place Flood & Storm Hazard Obstacles (Bagmati & Kamla simulated corridors)
    const hazardCoords = [
      { x: 5, y: 5, label: 'Flash Flood' },
      { x: 6, y: 5, label: 'Flash Flood' },
      { x: 7, y: 5, label: 'Flash Flood' },
      { x: 9, y: 8, label: 'Convective Storm' },
      { x: 9, y: 9, label: 'Convective Storm' },
    ];
    this.hazards = hazardCoords.filter((h) => h.x < this.width && h.y < this.height);

    const initialObs: Record<string, number[]> = {};
    for (const agent of this.agents) {
      initialObs[agent.id] = this.getAgentObservation(agent.id);
    }
    return initialObs;
  }

  /**
   * Generates local observation vector for agent i (Dimension: 8 features).
   * Features:
   * [norm_x, norm_y, norm_battery, rel_dx_target, rel_dy_target, dist_target, dist_hazard, dist_peer]
   */
  getAgentObservation(agentId: string): number[] {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) return new Array(8).fill(0);

    const normX = agent.x / (this.width - 1);
    const normY = agent.y / (this.height - 1);
    const normBattery = agent.battery / 100;

    // Find nearest unverified target
    let nearestDist = Infinity;
    let relDx = 0;
    let relDy = 0;

    const unverifiedTargets = this.targets.filter((t) => !t.verified);
    if (unverifiedTargets.length > 0) {
      for (const t of unverifiedTargets) {
        const d = Math.hypot(t.x - agent.x, t.y - agent.y);
        if (d < nearestDist) {
          nearestDist = d;
          relDx = (t.x - agent.x) / this.width;
          relDy = (t.y - agent.y) / this.height;
        }
      }
    }
    const normTargetDist = nearestDist === Infinity ? 1.0 : Math.min(1.0, nearestDist / Math.hypot(this.width, this.height));

    // Find nearest hazard
    let nearestHazardDist = Infinity;
    for (const h of this.hazards) {
      const d = Math.hypot(h.x - agent.x, h.y - agent.y);
      if (d < nearestHazardDist) nearestHazardDist = d;
    }
    const normHazardDist = Math.min(1.0, nearestHazardDist / Math.hypot(this.width, this.height));

    // Find nearest peer drone
    let nearestPeerDist = Infinity;
    for (const other of this.agents) {
      if (other.id !== agent.id && other.active) {
        const d = Math.hypot(other.x - agent.x, other.y - agent.y);
        if (d < nearestPeerDist) nearestPeerDist = d;
      }
    }
    const normPeerDist = nearestPeerDist === Infinity ? 1.0 : Math.min(1.0, nearestPeerDist / Math.hypot(this.width, this.height));

    return [
      normX,
      normY,
      normBattery,
      relDx,
      relDy,
      normTargetDist,
      normHazardDist,
      normPeerDist,
    ];
  }

  /**
   * Centralized global state vector S for Critic network.
   * Concatenates all local agent observations + remaining targets fraction.
   */
  getGlobalState(): number[] {
    const s: number[] = [];
    for (const agent of this.agents) {
      s.push(...this.getAgentObservation(agent.id));
    }
    const remainingTargets = this.targets.filter((t) => !t.verified).length;
    s.push(remainingTargets / Math.max(1, this.targets.length));
    s.push(this.currentStep / this.maxSteps);
    return s;
  }

  /**
   * Advances the multi-agent simulation by 1 step.
   * Actions: 0: HOVER, 1: UP, 2: RIGHT, 3: DOWN, 4: LEFT
   */
  step(actions: Record<string, number>): StepResult {
    this.currentStep++;
    const rewards: Record<string, number> = {};
    const dones: Record<string, boolean> = {};

    let hazardCollisions = 0;
    let swarmCollisions = 0;

    // 1. Move each agent and compute individual distance progression
    for (const agent of this.agents) {
      if (!agent.active) {
        rewards[agent.id] = 0;
        dones[agent.id] = true;
        continue;
      }

      agent.totalSteps++;
      const prevX = agent.x;
      const prevY = agent.y;

      // Distance to nearest target before move
      const prevUnverified = this.targets.filter((t) => !t.verified);
      const prevDist = prevUnverified.length > 0
        ? Math.min(...prevUnverified.map((t) => Math.hypot(t.x - prevX, t.y - prevY)))
        : 0;

      const act = actions[agent.id] ?? 0;
      let newX = agent.x;
      let newY = agent.y;

      // Action execution: 0: HOVER, 1: UP, 2: RIGHT, 3: DOWN, 4: LEFT
      if (act === 1) newY = Math.max(0, agent.y - 1);
      else if (act === 2) newX = Math.min(this.width - 1, agent.x + 1);
      else if (act === 3) newY = Math.min(this.height - 1, agent.y + 1);
      else if (act === 4) newX = Math.max(0, agent.x - 1);

      agent.x = newX;
      agent.y = newY;
      agent.battery = Math.max(0, agent.battery - 0.8); // Energy consumption

      let reward = -0.3; // Step penalty for fuel economy

      // Progress reward (shaping)
      if (prevUnverified.length > 0) {
        const currDist = Math.min(...prevUnverified.map((t) => Math.hypot(t.x - newX, t.y - newY)));
        reward += 2.5 * (prevDist - currDist);
      }

      // Check Hazard Collision
      const inHazard = this.hazards.some((h) => h.x === newX && h.y === newY);
      if (inHazard) {
        reward -= 15.0; // Severe hazard collision penalty
        hazardCollisions++;
      }

      // Battery depletion penalty
      if (agent.battery < 15) {
        reward -= 10.0;
      }

      rewards[agent.id] = reward;
    }

    // 2. Swarm collision checks (mutual inter-drone spacing)
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        const a1 = this.agents[i];
        const a2 = this.agents[j];
        if (a1.active && a2.active && a1.x === a2.x && a1.y === a2.y) {
          rewards[a1.id] -= 10.0; // Swarm collision penalty
          rewards[a2.id] -= 10.0;
          swarmCollisions++;
        }
      }
    }

    // 3. Target verification & rescue
    let anyTargetRescuedThisStep = false;
    for (const target of this.targets) {
      if (target.verified) continue;

      const inspectingAgent = this.agents.find(
        (a) => a.active && Math.hypot(a.x - target.x, a.y - target.y) <= 0.8
      );

      if (inspectingAgent) {
        target.verified = true;
        inspectingAgent.targetsRescued++;
        rewards[inspectingAgent.id] += 40.0 * target.urgency; // High reward for mission achievement
        anyTargetRescuedThisStep = true;
      }
    }

    // Team reward if all targets are verified
    const unverifiedRemaining = this.targets.filter((t) => !t.verified).length;
    const missionComplete = unverifiedRemaining === 0;

    if (missionComplete && anyTargetRescuedThisStep) {
      for (const agent of this.agents) {
        if (agent.active) {
          rewards[agent.id] += 30.0; // Shared swarm success bonus
        }
      }
    }

    // Termination conditions
    const isTimeout = this.currentStep >= this.maxSteps;
    for (const agent of this.agents) {
      dones[agent.id] = missionComplete || isTimeout || agent.battery <= 0;
    }

    const observations: Record<string, number[]> = {};
    for (const agent of this.agents) {
      observations[agent.id] = this.getAgentObservation(agent.id);
    }

    return {
      observations,
      rewards,
      dones,
      globalState: this.getGlobalState(),
      info: {
        targetsRemaining: unverifiedRemaining,
        hazardCollisions,
        swarmCollisions,
        missionComplete,
        stepCount: this.currentStep,
      },
    };
  }
}
