// Multi-Agent Proximal Policy Optimization (MAPPO) Controller
// Centralized Training with Decentralized Execution (CTDE)
// Decentralized Actor: pi(a|o_i) [8 -> 32 -> 16 -> 5]
// Centralized Critic: V(S) [18 -> 48 -> 24 -> 1]

import { NeuralNetwork, type SerializedModel } from './neuralNet';
import { SwarmDisasterEnv } from './mappoEnvironment';

export interface Transition {
  agentId: string;
  obs: number[];
  action: number;
  logProb: number;
  reward: number;
  value: number;
  globalState: number[];
  done: boolean;
}

export interface TrainingEpisodeMetrics {
  episode: number;
  totalReward: number;
  averageRewardPerAgent: number;
  targetsRescued: number;
  hazardCollisions: number;
  swarmCollisions: number;
  steps: number;
  criticLoss: number;
  actorLoss: number;
}

export interface SerializedMAPPO {
  actorModel: SerializedModel;
  criticModel: SerializedModel;
  trainedEpisodes: number;
  bestReward: number;
}

export class MAPPOTrainer {
  public actor: NeuralNetwork;
  public critic: NeuralNetwork;
  public clipEps: number = 0.2;
  public gamma: number = 0.95;
  public gaeLambda: number = 0.92;
  public lrActor: number = 0.003;
  public lrCritic: number = 0.005;

  public history: TrainingEpisodeMetrics[] = [];
  public totalTrainedEpisodes: number = 0;

  constructor(
    obsDim: number = 8,
    actionDim: number = 5,
    globalStateDim: number = 18,
    savedModel?: SerializedMAPPO
  ) {
    if (savedModel) {
      this.actor = new NeuralNetwork(savedModel.actorModel.layerSizes, savedModel.actorModel);
      this.critic = new NeuralNetwork(savedModel.criticModel.layerSizes, savedModel.criticModel);
      this.totalTrainedEpisodes = savedModel.trainedEpisodes || 0;
    } else {
      // Actor: 8 -> 32 -> 16 -> 5
      this.actor = new NeuralNetwork([obsDim, 32, 16, actionDim]);
      // Centralized Critic: 18 -> 48 -> 24 -> 1
      this.critic = new NeuralNetwork([globalStateDim, 48, 24, 1]);
    }
  }

  /**
   * Selects an action for an agent given local observation.
   * In training, samples from categorical distribution; in inference, selects argmax.
   */
  selectAction(
    obs: number[],
    deterministic: boolean = false
  ): { action: number; actionProb: number; logProb: number; probs: number[] } {
    const { output: probs } = this.actor.forward(obs, 'softmax');

    if (deterministic) {
      let bestA = 0;
      let maxP = -1;
      for (let a = 0; a < probs.length; a++) {
        if (probs[a] > maxP) {
          maxP = probs[a];
          bestA = a;
        }
      }
      const safeP = Math.max(1e-8, maxP);
      return { action: bestA, actionProb: safeP, logProb: Math.log(safeP), probs };
    }

    // Categorical sampling
    const rand = Math.random();
    let cumulative = 0;
    let selectedAction = 0;
    for (let a = 0; a < probs.length; a++) {
      cumulative += probs[a];
      if (rand <= cumulative) {
        selectedAction = a;
        break;
      }
    }

    const prob = Math.max(1e-8, probs[selectedAction]);
    return {
      action: selectedAction,
      actionProb: prob,
      logProb: Math.log(prob),
      probs,
    };
  }

  /**
   * Evaluates state value using Centralized Critic V(S).
   */
  getValue(globalState: number[]): number {
    const { output } = this.critic.forward(globalState, 'linear');
    return output[0];
  }

  /**
   * Collects 1 episode rollout and performs true PPO gradient parameter updates.
   */
  trainSingleEpisode(env: SwarmDisasterEnv): TrainingEpisodeMetrics {
    const transitions: Transition[] = [];
    let obsMap = env.reset(2, 3);
    let episodeReward = 0;
    let targetsRescued = 0;
    let hazardCollisions = 0;
    let swarmCollisions = 0;

    let done = false;

    // 1. Rollout trajectory collection
    while (!done) {
      const globalState = env.getGlobalState();
      const value = this.getValue(globalState);
      const actions: Record<string, number> = {};

      for (const agent of env.agents) {
        if (!agent.active) continue;
        const obs = obsMap[agent.id];
        const { action, logProb } = this.selectAction(obs, false);
        actions[agent.id] = action;

        // Store step metadata
        transitions.push({
          agentId: agent.id,
          obs,
          action,
          logProb,
          reward: 0, // Filled after step
          value,
          globalState,
          done: false,
        });
      }

      const stepRes = env.step(actions);
      obsMap = stepRes.observations;
      hazardCollisions += stepRes.info.hazardCollisions;
      swarmCollisions += stepRes.info.swarmCollisions;

      // Assign rewards to the latest transitions
      const latestTransitions = transitions.slice(-env.agents.filter((a) => a.active).length);
      for (const t of latestTransitions) {
        const r = stepRes.rewards[t.agentId] || 0;
        t.reward = r;
        t.done = stepRes.dones[t.agentId];
        episodeReward += r;
      }

      targetsRescued = env.agents.reduce((sum, a) => sum + a.targetsRescued, 0);
      done = Object.values(stepRes.dones).every(Boolean) || stepRes.info.missionComplete;
    }

    // 2. Compute Generalized Advantage Estimation (GAE) and Discounted Returns
    const T = transitions.length;
    const returns: number[] = new Array(T).fill(0);
    const advantages: number[] = new Array(T).fill(0);

    let gae = 0;
    for (let t = T - 1; t >= 0; t--) {
      const nextVal = t === T - 1 || transitions[t].done ? 0 : transitions[t + 1].value;
      const delta = transitions[t].reward + this.gamma * nextVal - transitions[t].value;
      gae = delta + this.gamma * this.gaeLambda * (transitions[t].done ? 0 : gae);
      advantages[t] = gae;
      returns[t] = advantages[t] + transitions[t].value;
    }

    // Normalize advantages
    const meanAdv = advantages.reduce((a, b) => a + b, 0) / Math.max(1, T);
    const varAdv = advantages.reduce((sum, a) => sum + (a - meanAdv) ** 2, 0) / Math.max(1, T);
    const stdAdv = Math.sqrt(varAdv) + 1e-8;
    const normAdvantages = advantages.map((a) => (a - meanAdv) / stdAdv);

    // 3. Centralized Critic Parameter Updates (MSE Loss backprop)
    let criticLossSum = 0;
    for (let t = 0; t < T; t++) {
      const trans = transitions[t];
      const targetReturn = returns[t];

      // Forward pass to get activations
      const { output, activations } = this.critic.forward(trans.globalState, 'linear');
      const predictedVal = output[0];
      const error = predictedVal - targetReturn;
      criticLossSum += 0.5 * error * error;

      // Backward pass for Critic
      const gradW: number[][][] = [];
      const gradB: number[][] = [];

      let delta = [error]; // dLoss / dz for linear output

      for (let l = this.critic.layers.length - 1; l >= 0; l--) {
        const layer = this.critic.layers[l];
        const prevA = activations[l];

        // Gradient for biases
        gradB.unshift([...delta]);

        // Gradient for weights: delta * prevA^T
        const layerGradW: number[][] = [];
        for (let i = 0; i < delta.length; i++) {
          const row: number[] = [];
          for (let j = 0; j < prevA.length; j++) {
            row.push(delta[i] * prevA[j]);
          }
          layerGradW.push(row);
        }
        gradW.unshift(layerGradW);

        // Propagate delta to previous layer
        if (l > 0) {
          const nextDelta: number[] = new Array(prevA.length).fill(0);
          for (let j = 0; j < prevA.length; j++) {
            let sum = 0;
            for (let i = 0; i < delta.length; i++) {
              sum += delta[i] * layer.weights[i][j];
            }
            // ReLU derivative
            nextDelta[j] = prevA[j] > 0 ? sum : 0;
          }
          delta = nextDelta;
        }
      }

      this.critic.applyGradients(gradW, gradB, this.lrCritic, 1.0);
    }

    // 4. Decentralized Actor Parameter Updates (PPO Clipped Objective)
    let actorLossSum = 0;
    for (let t = 0; t < T; t++) {
      const trans = transitions[t];
      const adv = normAdvantages[t];

      const { output: currProbs, activations } = this.actor.forward(trans.obs, 'softmax');
      const currProb = Math.max(1e-8, currProbs[trans.action]);
      const currLogProb = Math.log(currProb);

      const ratio = Math.exp(currLogProb - trans.logProb);
      const surr1 = ratio * adv;
      const surr2 = Math.min(Math.max(ratio, 1.0 - this.clipEps), 1.0 + this.clipEps) * adv;
      const ppoLoss = -Math.min(surr1, surr2);
      actorLossSum += ppoLoss;

      // Softmax policy gradient with advantage scaling
      // dLoss/dz_k = currProbs[k] - (k === action ? 1 : 0)
      const isClipped = (adv > 0 && ratio > 1.0 + this.clipEps) || (adv < 0 && ratio < 1.0 - this.clipEps);
      const policyGradientScale = isClipped ? 0 : -adv * ratio;

      let delta: number[] = currProbs.map((p, idx) => {
        const indicator = idx === trans.action ? 1 : 0;
        return (p - indicator) * policyGradientScale;
      });

      // Backward pass for Actor
      const gradW: number[][][] = [];
      const gradB: number[][] = [];

      for (let l = this.actor.layers.length - 1; l >= 0; l--) {
        const layer = this.actor.layers[l];
        const prevA = activations[l];

        gradB.unshift([...delta]);

        const layerGradW: number[][] = [];
        for (let i = 0; i < delta.length; i++) {
          const row: number[] = [];
          for (let j = 0; j < prevA.length; j++) {
            row.push(delta[i] * prevA[j]);
          }
          layerGradW.push(row);
        }
        gradW.unshift(layerGradW);

        if (l > 0) {
          const nextDelta: number[] = new Array(prevA.length).fill(0);
          for (let j = 0; j < prevA.length; j++) {
            let sum = 0;
            for (let i = 0; i < delta.length; i++) {
              sum += delta[i] * layer.weights[i][j];
            }
            nextDelta[j] = prevA[j] > 0 ? sum : 0;
          }
          delta = nextDelta;
        }
      }

      this.actor.applyGradients(gradW, gradB, this.lrActor, 0.5);
    }

    this.totalTrainedEpisodes++;

    const metrics: TrainingEpisodeMetrics = {
      episode: this.totalTrainedEpisodes,
      totalReward: Number(episodeReward.toFixed(2)),
      averageRewardPerAgent: Number((episodeReward / env.agents.length).toFixed(2)),
      targetsRescued,
      hazardCollisions,
      swarmCollisions,
      steps: env.currentStep,
      criticLoss: Number((criticLossSum / Math.max(1, T)).toFixed(4)),
      actorLoss: Number((actorLossSum / Math.max(1, T)).toFixed(4)),
    };

    this.history.push(metrics);
    return metrics;
  }

  /**
   * Runs multiple training episodes and tracks learning progression.
   */
  trainEpisodes(
    env: SwarmDisasterEnv,
    numEpisodes: number = 10,
    onStep?: (metrics: TrainingEpisodeMetrics) => void
  ): TrainingEpisodeMetrics[] {
    const results: TrainingEpisodeMetrics[] = [];
    for (let i = 0; i < numEpisodes; i++) {
      const metrics = this.trainSingleEpisode(env);
      results.push(metrics);
      if (onStep) onStep(metrics);
    }
    return results;
  }

  /**
   * Serializes models to JSON for local export / browser persistence.
   */
  exportMAPPO(): SerializedMAPPO {
    const bestReward = this.history.length > 0
      ? Math.max(...this.history.map((h) => h.totalReward))
      : 0;

    return {
      actorModel: this.actor.exportModel(),
      criticModel: this.critic.exportModel(),
      trainedEpisodes: this.totalTrainedEpisodes,
      bestReward,
    };
  }
}
