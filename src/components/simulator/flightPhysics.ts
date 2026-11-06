/**
 * Flight Physics Engine for 3D Drone Simulator
 *
 * Coordinate Convention:
 *   X — horizontal right
 *   Y — altitude (up)
 *   Z — horizontal depth (negative = forward / north)
 *
 * This module is pure TypeScript with no React dependencies so it can be
 * imported in unit tests without a DOM environment.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const PHYSICS = {
  /** Maximum horizontal speed (m/s) */
  MAX_HORIZONTAL_SPEED: 8,
  /** Maximum vertical speed (m/s) */
  MAX_VERTICAL_SPEED: 4,
  /** Horizontal acceleration (m/s²) */
  HORIZONTAL_ACCEL: 12,
  /** Vertical acceleration (m/s²) */
  VERTICAL_ACCEL: 6,
  /** Damping factor applied each frame (0 = no damping, 1 = instant stop) */
  DAMPING: 0.88,
  /** Minimum altitude (ground level) */
  GROUND_Y: 0.5,
  /** Maximum altitude */
  MAX_ALTITUDE_Y: 50,
  /** Target altitude for TAKEOFF command */
  TAKEOFF_TARGET_Y: 8,
  /** Battery drain per second while flying (%) */
  BATTERY_DRAIN_FLYING: 0.08,
  /** Battery drain per second while hovering (%) */
  BATTERY_DRAIN_HOVER: 0.02,
  /** Maximum tilt angle in radians */
  MAX_TILT: 0.35,
  /** Tilt smoothing factor */
  TILT_SMOOTHING: 0.12,
  /** Trajectory history max points */
  MAX_TRAJECTORY_POINTS: 200,
  /** Scene boundary (half-size of the ground plane) */
  BOUNDARY: 48,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlightStatus =
  | 'GROUNDED'
  | 'TAKING_OFF'
  | 'FLYING'
  | 'LANDING'
  | 'COLLISION';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
}

export interface DronePhysicsState {
  position: Vec3;
  velocity: Vec3;
  /** Roll angle (tilt left/right, radians) */
  rollAngle: number;
  /** Pitch angle (tilt forward/backward, radians) */
  pitchAngle: number;
  /** Yaw angle (heading, radians) */
  yawAngle: number;
  flightStatus: FlightStatus;
  batteryLevel: number;
  distanceTravelled: number;
  collisionState: boolean;
  trajectoryHistory: Vec3[];
  /** Accumulated flight time in seconds */
  flightTimeSeconds: number;
}

export interface Obstacle {
  position: Vec3;
  halfSize: Vec3; // AABB half-extents
}

// ─── Initial State ────────────────────────────────────────────────────────────

export const INITIAL_DRONE_STATE: DronePhysicsState = {
  position: { x: 0, y: PHYSICS.GROUND_Y, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  rollAngle: 0,
  pitchAngle: 0,
  yawAngle: 0,
  flightStatus: 'GROUNDED',
  batteryLevel: 100,
  distanceTravelled: 0,
  collisionState: false,
  trajectoryHistory: [],
  flightTimeSeconds: 0,
};

export const INITIAL_INPUT: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  forward: false,
  backward: false,
};

// ─── Scene Obstacles ──────────────────────────────────────────────────────────

export const SCENE_OBSTACLES: Obstacle[] = [
  // Building cluster 1 — left side
  { position: { x: -15, y: 3, z: -10 }, halfSize: { x: 2, y: 3, z: 2 } },
  { position: { x: -18, y: 2, z: -6 },  halfSize: { x: 1.5, y: 2, z: 1.5 } },
  // Building cluster 2 — right side
  { position: { x: 14, y: 4, z: -12 },  halfSize: { x: 2, y: 4, z: 2 } },
  { position: { x: 18, y: 2.5, z: -8 }, halfSize: { x: 1.5, y: 2.5, z: 1.5 } },
  // Tall pillar — center-far
  { position: { x: 0, y: 5, z: -20 },   halfSize: { x: 1, y: 5, z: 1 } },
  // Low barrier — mid-left
  { position: { x: -8, y: 0.75, z: -5 },halfSize: { x: 4, y: 0.75, z: 1 } },
  // Low barrier — mid-right
  { position: { x: 8, y: 0.75, z: -5 }, halfSize: { x: 4, y: 0.75, z: 1 } },
  // Far structures
  { position: { x: -20, y: 3.5, z: -25 },halfSize: { x: 2, y: 3.5, z: 2 } },
  { position: { x: 20, y: 3.5, z: -25 }, halfSize: { x: 2, y: 3.5, z: 2 } },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function vecLength(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecScale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/**
 * AABB collision: returns true if a sphere centred at `pos` with radius
 * `radius` overlaps the AABB described by `obs`.
 */
function sphereAABBOverlap(pos: Vec3, radius: number, obs: Obstacle): boolean {
  const dx = Math.max(0, Math.abs(pos.x - obs.position.x) - obs.halfSize.x);
  const dy = Math.max(0, Math.abs(pos.y - obs.position.y) - obs.halfSize.y);
  const dz = Math.max(0, Math.abs(pos.z - obs.position.z) - obs.halfSize.z);
  return dx * dx + dy * dy + dz * dz < radius * radius;
}

/**
 * Push the drone out of the first overlapping obstacle.
 * Returns the resolved position and whether a collision occurred.
 */
function resolveCollisions(
  pos: Vec3,
  velocity: Vec3,
  droneRadius: number,
  obstacles: Obstacle[],
): { position: Vec3; velocity: Vec3; collision: boolean } {
  let resolvedPos = { ...pos };
  let resolvedVel = { ...velocity };
  let collision = false;

  for (const obs of obstacles) {
    if (!sphereAABBOverlap(resolvedPos, droneRadius, obs)) continue;
    collision = true;

    // Push out along the axis with the smallest overlap
    const dx = resolvedPos.x - obs.position.x;
    const dy = resolvedPos.y - obs.position.y;
    const dz = resolvedPos.z - obs.position.z;

    const overlapX = obs.halfSize.x + droneRadius - Math.abs(dx);
    const overlapY = obs.halfSize.y + droneRadius - Math.abs(dy);
    const overlapZ = obs.halfSize.z + droneRadius - Math.abs(dz);

    if (overlapX <= overlapY && overlapX <= overlapZ) {
      resolvedPos.x += Math.sign(dx) * overlapX;
      resolvedVel.x = 0;
    } else if (overlapY <= overlapX && overlapY <= overlapZ) {
      resolvedPos.y += Math.sign(dy) * overlapY;
      resolvedVel.y = 0;
    } else {
      resolvedPos.z += Math.sign(dz) * overlapZ;
      resolvedVel.z = 0;
    }
  }

  return { position: resolvedPos, velocity: resolvedVel, collision };
}

// ─── Main Physics Step ────────────────────────────────────────────────────────

/**
 * Advances the drone physics by one frame.
 *
 * @param state   Current drone state (treated as immutable)
 * @param input   Current held-input snapshot
 * @param dt      Elapsed time since last frame (seconds), clamped internally
 * @param obstacles Scene obstacles for collision resolution
 * @returns       New drone state
 */
export function stepDronePhysics(
  state: DronePhysicsState,
  input: InputState,
  dt: number,
  obstacles: Obstacle[] = SCENE_OBSTACLES,
): DronePhysicsState {
  // Guard against runaway dt (e.g., tab was in the background)
  const safeDt = clamp(dt, 0, 0.1);

  let { position, velocity, rollAngle, pitchAngle, yawAngle, flightStatus,
        batteryLevel, distanceTravelled, trajectoryHistory, flightTimeSeconds } = state;

  // Clone mutable copies
  let pos = { ...position };
  let vel = { ...velocity };

  const isTakingOff  = flightStatus === 'TAKING_OFF';
  const isFlying     = flightStatus === 'FLYING';
  const isLanding    = flightStatus === 'LANDING';
  const isAirborne   = isTakingOff || isFlying || isLanding;

  // ── Takeoff Transition ──
  if (isTakingOff) {
    vel.y = PHYSICS.MAX_VERTICAL_SPEED * 0.7;
    if (pos.y >= PHYSICS.TAKEOFF_TARGET_Y) {
      vel.y = 0;
      flightStatus = 'FLYING';
    }
  }

  // ── Landing Transition ──
  if (isLanding) {
    // Damp horizontal movement
    vel.x *= 0.85;
    vel.z *= 0.85;
    vel.y = -PHYSICS.MAX_VERTICAL_SPEED * 0.5;
    if (pos.y <= PHYSICS.GROUND_Y) {
      pos.y = PHYSICS.GROUND_Y;
      vel = { x: 0, y: 0, z: 0 };
      flightStatus = 'GROUNDED';
    }
  }

  // ── Player Input (only while FLYING) ──
  if (isFlying) {
    // Horizontal direction from input
    let dirX = 0;
    let dirZ = 0;
    let dirY = 0;

    if (input.right)    dirX += 1;
    if (input.left)     dirX -= 1;
    if (input.forward)  dirZ -= 1;
    if (input.backward) dirZ += 1;
    if (input.up)       dirY += 1;
    if (input.down)     dirY -= 1;

    // Normalise diagonal horizontal movement
    const hMag = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (hMag > 1) {
      dirX /= hMag;
      dirZ /= hMag;
    }

    // Apply acceleration
    vel.x += dirX * PHYSICS.HORIZONTAL_ACCEL * safeDt;
    vel.z += dirZ * PHYSICS.HORIZONTAL_ACCEL * safeDt;
    vel.y += dirY * PHYSICS.VERTICAL_ACCEL * safeDt;

    // Apply damping when no input on that axis
    if (!input.left && !input.right)     vel.x *= Math.pow(PHYSICS.DAMPING, safeDt * 60);
    if (!input.forward && !input.backward) vel.z *= Math.pow(PHYSICS.DAMPING, safeDt * 60);
    if (!input.up && !input.down)        vel.y *= Math.pow(PHYSICS.DAMPING, safeDt * 60);

    // Clamp speeds
    vel.x = clamp(vel.x, -PHYSICS.MAX_HORIZONTAL_SPEED, PHYSICS.MAX_HORIZONTAL_SPEED);
    vel.z = clamp(vel.z, -PHYSICS.MAX_HORIZONTAL_SPEED, PHYSICS.MAX_HORIZONTAL_SPEED);
    vel.y = clamp(vel.y, -PHYSICS.MAX_VERTICAL_SPEED, PHYSICS.MAX_VERTICAL_SPEED);
  }

  // ── Integrate Position ──
  if (isAirborne) {
    pos = vecAdd(pos, vecScale(vel, safeDt));

    // Clamp altitude
    pos.y = clamp(pos.y, PHYSICS.GROUND_Y, PHYSICS.MAX_ALTITUDE_Y);
    if (pos.y === PHYSICS.GROUND_Y && vel.y < 0) vel.y = 0;
    if (pos.y === PHYSICS.MAX_ALTITUDE_Y && vel.y > 0) vel.y = 0;

    // Clamp scene boundary
    pos.x = clamp(pos.x, -PHYSICS.BOUNDARY, PHYSICS.BOUNDARY);
    pos.z = clamp(pos.z, -PHYSICS.BOUNDARY, PHYSICS.BOUNDARY);
  }

  // ── Collision Resolution ──
  let collisionState = false;
  if (isAirborne) {
    const droneRadius = 1.2;
    const { position: resolvedPos, velocity: resolvedVel, collision } =
      resolveCollisions(pos, vel, droneRadius, obstacles);
    pos = resolvedPos;
    vel = resolvedVel;
    collisionState = collision;
  }

  // ── Validate position is finite ──
  if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)) {
    pos = { ...position }; // rollback
    vel = { x: 0, y: 0, z: 0 };
  }

  // ── Tilt / Orientation ──
  const targetRoll  = isFlying ? (-vel.x / PHYSICS.MAX_HORIZONTAL_SPEED) * PHYSICS.MAX_TILT : 0;
  const targetPitch = isFlying ? (vel.z / PHYSICS.MAX_HORIZONTAL_SPEED) * PHYSICS.MAX_TILT : 0;

  const newRoll  = rollAngle  + (targetRoll  - rollAngle)  * clamp(PHYSICS.TILT_SMOOTHING * safeDt * 60, 0, 1);
  const newPitch = pitchAngle + (targetPitch - pitchAngle) * clamp(PHYSICS.TILT_SMOOTHING * safeDt * 60, 0, 1);

  // Derive yaw from horizontal velocity direction when moving
  const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  let newYaw = yawAngle;
  if (hSpeed > 0.3 && isFlying) {
    const targetYaw = Math.atan2(vel.x, vel.z);
    const yawDelta = ((targetYaw - yawAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    newYaw = yawAngle + yawDelta * clamp(0.06 * safeDt * 60, 0, 1);
  }

  // ── Distance Travelled ──
  const moveDelta = vecLength({
    x: pos.x - position.x,
    y: pos.y - position.y,
    z: pos.z - position.z,
  });
  const newDistance = distanceTravelled + moveDelta;

  // ── Battery Drain ──
  const isActiveFlight = isFlying && (hSpeed > 0.1 || Math.abs(vel.y) > 0.1);
  const drainRate = isActiveFlight
    ? PHYSICS.BATTERY_DRAIN_FLYING
    : isAirborne ? PHYSICS.BATTERY_DRAIN_HOVER : 0;
  const newBattery = clamp(batteryLevel - drainRate * safeDt, 0, 100);

  // ── Trajectory History ──
  const newHistory = isFlying && moveDelta > 0.3
    ? [...trajectoryHistory.slice(-PHYSICS.MAX_TRAJECTORY_POINTS + 1), { ...pos }]
    : trajectoryHistory;

  // ── Flight Time ──
  const newFlightTime = isAirborne ? flightTimeSeconds + safeDt : flightTimeSeconds;

  return {
    position: pos,
    velocity: vel,
    rollAngle: newRoll,
    pitchAngle: newPitch,
    yawAngle: newYaw,
    flightStatus,
    batteryLevel: newBattery,
    distanceTravelled: newDistance,
    collisionState,
    trajectoryHistory: newHistory,
    flightTimeSeconds: newFlightTime,
  };
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

export function commandTakeoff(state: DronePhysicsState): DronePhysicsState {
  if (state.flightStatus !== 'GROUNDED') return state;
  return { ...state, flightStatus: 'TAKING_OFF', velocity: { x: 0, y: 0, z: 0 } };
}

export function commandLand(state: DronePhysicsState): DronePhysicsState {
  if (state.flightStatus !== 'FLYING') return state;
  return { ...state, flightStatus: 'LANDING' };
}

export function commandReset(): DronePhysicsState {
  return { ...INITIAL_DRONE_STATE, trajectoryHistory: [] };
}

// ─── Derived Telemetry Helpers ────────────────────────────────────────────────

export function getHeadingDegrees(state: DronePhysicsState): number {
  // Convert yaw radians to compass bearing (0° = North / +Z direction inverted)
  const deg = (((-state.yawAngle * 180) / Math.PI) + 360) % 360;
  return Math.round(deg);
}

export function getHorizontalSpeed(state: DronePhysicsState): number {
  return Math.sqrt(state.velocity.x ** 2 + state.velocity.z ** 2);
}

export function getAltitude(state: DronePhysicsState): number {
  return Math.max(0, state.position.y - PHYSICS.GROUND_Y);
}
