/**
 * Unit tests for the flight physics engine.
 * Run with: npx vitest run src/components/simulator/__tests__/flightPhysics.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  stepDronePhysics,
  commandTakeoff,
  commandLand,
  commandReset,
  getAltitude,
  getHorizontalSpeed,
  getHeadingDegrees,
  INITIAL_DRONE_STATE,
  INITIAL_INPUT,
  PHYSICS,
  type DronePhysicsState,
} from '../flightPhysics';

// Helper: run n frames of physics
function runFrames(
  state: DronePhysicsState,
  input = INITIAL_INPUT,
  frames = 1,
  dt = 0.016,
): DronePhysicsState {
  let s = state;
  for (let i = 0; i < frames; i++) {
    s = stepDronePhysics(s, input, dt, []);
  }
  return s;
}

describe('commandReset', () => {
  it('returns initial state', () => {
    const s = commandReset();
    expect(s.flightStatus).toBe('GROUNDED');
    expect(s.batteryLevel).toBe(100);
    expect(s.position.y).toBe(PHYSICS.GROUND_Y);
    expect(s.velocity.x).toBe(0);
    expect(s.trajectoryHistory).toHaveLength(0);
  });
});

describe('commandTakeoff', () => {
  it('transitions to TAKING_OFF from GROUNDED', () => {
    const s = commandTakeoff(INITIAL_DRONE_STATE);
    expect(s.flightStatus).toBe('TAKING_OFF');
  });

  it('does nothing if already flying', () => {
    const flying = { ...INITIAL_DRONE_STATE, flightStatus: 'FLYING' as const };
    const s = commandTakeoff(flying);
    expect(s.flightStatus).toBe('FLYING');
  });

  it('eventually reaches FLYING status and target altitude', () => {
    let s = commandTakeoff(INITIAL_DRONE_STATE);
    s = runFrames(s, INITIAL_INPUT, 500, 0.05);
    expect(s.flightStatus).toBe('FLYING');
    expect(s.position.y).toBeGreaterThanOrEqual(PHYSICS.TAKEOFF_TARGET_Y - 0.2);
  });
});

describe('commandLand', () => {
  it('transitions to LANDING from FLYING', () => {
    const flying = { ...INITIAL_DRONE_STATE, flightStatus: 'FLYING' as const, position: { x: 0, y: 8, z: 0 } };
    const s = commandLand(flying);
    expect(s.flightStatus).toBe('LANDING');
  });

  it('eventually reaches GROUNDED at ground level', () => {
    let s: DronePhysicsState = {
      ...INITIAL_DRONE_STATE,
      flightStatus: 'LANDING',
      position: { x: 0, y: 8, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
    };
    s = runFrames(s, INITIAL_INPUT, 500, 0.05);
    expect(s.flightStatus).toBe('GROUNDED');
    expect(s.position.y).toBeLessThanOrEqual(PHYSICS.GROUND_Y + 0.01);
  });
});

describe('Movement and damping', () => {
  it('accelerates right when right input is active', () => {
    let s: DronePhysicsState = { ...INITIAL_DRONE_STATE, flightStatus: 'FLYING', position: { x: 0, y: 8, z: 0 } };
    const input = { ...INITIAL_INPUT, right: true };
    s = runFrames(s, input, 30);
    expect(s.velocity.x).toBeGreaterThan(0);
    expect(s.position.x).toBeGreaterThan(0);
  });

  it('decelerates after releasing input', () => {
    let s: DronePhysicsState = {
      ...INITIAL_DRONE_STATE,
      flightStatus: 'FLYING',
      position: { x: 0, y: 8, z: 0 },
      velocity: { x: 5, y: 0, z: 0 },
    };
    s = runFrames(s, INITIAL_INPUT, 60);
    expect(Math.abs(s.velocity.x)).toBeLessThan(1);
  });

  it('does not exceed max horizontal speed', () => {
    let s: DronePhysicsState = { ...INITIAL_DRONE_STATE, flightStatus: 'FLYING', position: { x: 0, y: 8, z: 0 } };
    const input = { ...INITIAL_INPUT, forward: true };
    s = runFrames(s, input, 200);
    const speed = getHorizontalSpeed(s);
    expect(speed).toBeLessThanOrEqual(PHYSICS.MAX_HORIZONTAL_SPEED + 0.01);
  });
});

describe('Altitude constraints', () => {
  it('cannot go below ground level', () => {
    let s: DronePhysicsState = {
      ...INITIAL_DRONE_STATE,
      flightStatus: 'FLYING',
      position: { x: 0, y: PHYSICS.GROUND_Y + 0.1, z: 0 },
      velocity: { x: 0, y: -10, z: 0 },
    };
    s = runFrames(s, INITIAL_INPUT, 30);
    expect(s.position.y).toBeGreaterThanOrEqual(PHYSICS.GROUND_Y - 0.01);
  });

  it('cannot exceed max altitude', () => {
    let s: DronePhysicsState = {
      ...INITIAL_DRONE_STATE,
      flightStatus: 'FLYING',
      position: { x: 0, y: PHYSICS.MAX_ALTITUDE_Y - 0.1, z: 0 },
      velocity: { x: 0, y: 10, z: 0 },
    };
    s = runFrames(s, INITIAL_INPUT, 30);
    expect(s.position.y).toBeLessThanOrEqual(PHYSICS.MAX_ALTITUDE_Y + 0.01);
  });
});

describe('Battery drain', () => {
  it('drains battery during flight', () => {
    let s: DronePhysicsState = {
      ...INITIAL_DRONE_STATE,
      flightStatus: 'FLYING',
      position: { x: 0, y: 8, z: 0 },
    };
    const input = { ...INITIAL_INPUT, forward: true };
    s = runFrames(s, input, 300, 0.05);
    expect(s.batteryLevel).toBeLessThan(100);
    expect(s.batteryLevel).toBeGreaterThanOrEqual(0);
  });

  it('does not drain battery on ground', () => {
    let s = runFrames(INITIAL_DRONE_STATE, INITIAL_INPUT, 120);
    expect(s.batteryLevel).toBe(100);
  });
});

describe('Heading', () => {
  it('returns 0-360', () => {
    const h = getHeadingDegrees(INITIAL_DRONE_STATE);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });
});

describe('Collision resolution', () => {
  it('prevents passing through an obstacle', () => {
    const obstacle = {
      position: { x: 0, y: 5, z: -5 },
      halfSize: { x: 2, y: 5, z: 2 },
    };
    let s: DronePhysicsState = {
      ...INITIAL_DRONE_STATE,
      flightStatus: 'FLYING',
      position: { x: 0, y: 5, z: 1 },
      velocity: { x: 0, y: 0, z: -10 },
    };
    for (let i = 0; i < 60; i++) {
      s = stepDronePhysics(s, INITIAL_INPUT, 0.016, [obstacle]);
    }
    // The drone should not have passed through the obstacle centre
    expect(s.position.z).toBeGreaterThan(obstacle.position.z - obstacle.halfSize.z - 2);
  });
});

describe('getAltitude', () => {
  it('returns 0 at ground level', () => {
    expect(getAltitude(INITIAL_DRONE_STATE)).toBeCloseTo(0, 1);
  });
});
