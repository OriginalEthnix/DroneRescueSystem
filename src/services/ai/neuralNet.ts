// Lightweight, Pure TypeScript Neural Network Library
// Provides Multi-Layer Perceptrons with forward/backward passes, Adam optimizer,
// and parameter export/import for Reinforcement Learning (MAPPO).

export interface LayerWeights {
  weights: number[][]; // [fan_out, fan_in]
  biases: number[];     // [fan_out]
}

export interface SerializedModel {
  layerSizes: number[];
  layers: LayerWeights[];
}

export class NeuralNetwork {
  public layerSizes: number[];
  public layers: LayerWeights[];

  // Adam optimizer velocity and momentum caches
  private mWeights: number[][][] = [];
  private vWeights: number[][][] = [];
  private mBiases: number[][] = [];
  private vBiases: number[][] = [];
  private t: number = 0;

  constructor(layerSizes: number[], pretrained?: SerializedModel) {
    this.layerSizes = [...layerSizes];
    this.layers = [];

    if (pretrained && pretrained.layers.length === layerSizes.length - 1) {
      this.layers = JSON.parse(JSON.stringify(pretrained.layers));
    } else {
      // He / Xavier initialization
      for (let l = 0; l < layerSizes.length - 1; l++) {
        const fanIn = layerSizes[l];
        const fanOut = layerSizes[l + 1];
        const std = Math.sqrt(2.0 / fanIn);

        const weights: number[][] = [];
        for (let i = 0; i < fanOut; i++) {
          const row: number[] = [];
          for (let j = 0; j < fanIn; j++) {
            // Box-Muller Gaussian random
            row.push(this.gaussianRandom(0, std));
          }
          weights.push(row);
        }

        const biases: number[] = new Array(fanOut).fill(0.01);
        this.layers.push({ weights, biases });
      }
    }

    // Initialize Adam caches
    for (const layer of this.layers) {
      const fanOut = layer.biases.length;
      const fanIn = layer.weights[0].length;
      this.mWeights.push(Array.from({ length: fanOut }, () => new Array(fanIn).fill(0)));
      this.vWeights.push(Array.from({ length: fanOut }, () => new Array(fanIn).fill(0)));
      this.mBiases.push(new Array(fanOut).fill(0));
      this.vBiases.push(new Array(fanOut).fill(0));
    }
  }

  private gaussianRandom(mean = 0, stdev = 1): number {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }

  /**
   * Forward pass through the network.
   * Returns:
   * - output: activations of final layer
   * - activations: list of activations per layer (including input)
   * - preActivations: list of pre-activation z vectors per layer
   */
  forward(
    input: number[],
    outputActivation: 'softmax' | 'linear' | 'tanh' = 'linear'
  ): {
    output: number[];
    activations: number[][];
    preActivations: number[][];
  } {
    const activations: number[][] = [[...input]];
    const preActivations: number[][] = [];

    let currentActivation = [...input];

    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l];
      const isLastLayer = l === this.layers.length - 1;
      const z: number[] = [];
      const nextA: number[] = [];

      for (let i = 0; i < layer.biases.length; i++) {
        let sum = layer.biases[i];
        const row = layer.weights[i];
        for (let j = 0; j < currentActivation.length; j++) {
          sum += row[j] * currentActivation[j];
        }
        z.push(sum);

        if (!isLastLayer) {
          // Hidden layers use ReLU
          nextA.push(Math.max(0, sum));
        } else {
          // Output layer activation
          if (outputActivation === 'linear') {
            nextA.push(sum);
          } else if (outputActivation === 'tanh') {
            nextA.push(Math.tanh(sum));
          }
        }
      }

      preActivations.push(z);

      if (isLastLayer && outputActivation === 'softmax') {
        // Numerically stable Softmax
        const maxZ = Math.max(...z);
        const expZ = z.map((val) => Math.exp(val - maxZ));
        const sumExp = expZ.reduce((acc, v) => acc + v, 0) || 1e-8;
        const softmaxA = expZ.map((val) => val / sumExp);
        activations.push(softmaxA);
        currentActivation = softmaxA;
      } else {
        activations.push(nextA);
        currentActivation = nextA;
      }
    }

    return {
      output: activations[activations.length - 1],
      activations,
      preActivations,
    };
  }

  /**
   * Performs Adam parameter updates with computed weight & bias gradients.
   */
  applyGradients(
    gradWeights: number[][][],
    gradBiases: number[][],
    learningRate: number = 0.001,
    clipNorm: number = 1.0
  ): void {
    this.t++;
    const beta1 = 0.9;
    const beta2 = 0.999;
    const eps = 1e-8;

    // Gradient clipping by global norm
    let totalNormSq = 0;
    for (let l = 0; l < this.layers.length; l++) {
      for (let i = 0; i < gradBiases[l].length; i++) {
        totalNormSq += gradBiases[l][i] * gradBiases[l][i];
        for (let j = 0; j < gradWeights[l][i].length; j++) {
          totalNormSq += gradWeights[l][i][j] * gradWeights[l][i][j];
        }
      }
    }
    const globalNorm = Math.sqrt(totalNormSq);
    const scale = globalNorm > clipNorm ? clipNorm / (globalNorm + 1e-8) : 1.0;

    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l];
      const mWeight = this.mWeights[l];
      const vWeight = this.vWeights[l];
      const mBias = this.mBiases[l];
      const vBias = this.vBiases[l];

      for (let i = 0; i < layer.biases.length; i++) {
        // Bias update
        const gb = gradBiases[l][i] * scale;
        mBias[i] = beta1 * mBias[i] + (1 - beta1) * gb;
        vBias[i] = beta2 * vBias[i] + (1 - beta2) * gb * gb;

        const mHatB = mBias[i] / (1 - Math.pow(beta1, this.t));
        const vHatB = vBias[i] / (1 - Math.pow(beta2, this.t));
        layer.biases[i] -= (learningRate * mHatB) / (Math.sqrt(vHatB) + eps);

        // Weights update
        for (let j = 0; j < layer.weights[i].length; j++) {
          const gw = gradWeights[l][i][j] * scale;
          mWeight[i][j] = beta1 * mWeight[i][j] + (1 - beta1) * gw;
          vWeight[i][j] = beta2 * vWeight[i][j] + (1 - beta2) * gw * gw;

          const mHatW = mWeight[i][j] / (1 - Math.pow(beta1, this.t));
          const vHatW = vWeight[i][j] / (1 - Math.pow(beta2, this.t));
          layer.weights[i][j] -= (learningRate * mHatW) / (Math.sqrt(vHatW) + eps);
        }
      }
    }
  }

  exportModel(): SerializedModel {
    return {
      layerSizes: [...this.layerSizes],
      layers: JSON.parse(JSON.stringify(this.layers)),
    };
  }
}
