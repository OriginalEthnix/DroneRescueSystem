/**
 * Unit tests for the Third-Person Perspective (TPP) Follow Camera logic.
 * Run with: npx vitest run src/components/simulator/__tests__/tppCamera.test.ts
 */
import { describe, it, expect } from 'vitest';
import { calculateTPPCameraTargets, TPP_CONFIG } from '../DroneSimulatorPage';
import { PHYSICS, type Obstacle } from '../flightPhysics';

describe('TPP Follow Camera Logic', () => {
  it('positions camera behind the drone on launchpad facing North (-Z)', () => {
    const dronePos = { x: 0, y: PHYSICS.GROUND_Y, z: 0 };
    const yaw = 0;
    const distanceTravelled = 0;
    const { desiredPos, lookTarget } = calculateTPPCameraTargets(
      dronePos,
      yaw,
      TPP_CONFIG,
      [],
      distanceTravelled
    );

    // Initial orientation: drone faces North (-Z) towards runway/obstacles.
    // Camera is placed behind the drone (+Z, South) by FOLLOW_DISTANCE.
    expect(desiredPos.x).toBeCloseTo(0, 2);
    expect(desiredPos.z).toBeCloseTo(TPP_CONFIG.FOLLOW_DISTANCE, 2);
    expect(desiredPos.y).toBeGreaterThanOrEqual(TPP_CONFIG.MIN_CAMERA_Y);
    expect(desiredPos.y).toBeCloseTo(PHYSICS.GROUND_Y + TPP_CONFIG.HEIGHT_OFFSET, 2);

    // Look target is aimed ahead of the drone (-Z, North) and slightly above center
    expect(lookTarget.x).toBeCloseTo(0, 2);
    expect(lookTarget.y).toBeCloseTo(PHYSICS.GROUND_Y + TPP_CONFIG.LOOK_ABOVE, 2);
    expect(lookTarget.z).toBeCloseTo(-TPP_CONFIG.LEAD_AHEAD, 2);
  });

  it('keeps camera behind the drone when flying forward (yaw = PI)', () => {
    const dronePos = { x: 0, y: 10.0, z: -25.0 };
    const yaw = Math.PI; // Forward velocity heading in flightPhysics
    const { desiredPos, lookTarget } = calculateTPPCameraTargets(dronePos, yaw, TPP_CONFIG, [], 10);

    // Drone is moving North (-Z). Camera must be behind at +Z (+7.0 relative to drone).
    expect(desiredPos.x).toBeCloseTo(0, 2);
    expect(desiredPos.y).toBeCloseTo(10.0 + TPP_CONFIG.HEIGHT_OFFSET, 2);
    expect(desiredPos.z).toBeCloseTo(-25.0 + TPP_CONFIG.FOLLOW_DISTANCE, 2);

    // Look target must be ahead in the travel direction (-Z)
    expect(lookTarget.x).toBeCloseTo(0, 2);
    expect(lookTarget.y).toBeCloseTo(10.0 + TPP_CONFIG.LOOK_ABOVE, 2);
    expect(lookTarget.z).toBeCloseTo(-25.0 - TPP_CONFIG.LEAD_AHEAD, 2);
  });

  it('smoothly follows drone heading when turning 90 degrees right (yaw = PI/2)', () => {
    const dronePos = { x: 10, y: 8, z: 0 };
    const yaw = Math.PI / 2; // Moving right (+X)
    const { desiredPos, lookTarget } = calculateTPPCameraTargets(dronePos, yaw, TPP_CONFIG, [], 10);

    // Drone is moving right (+X). Camera must be behind at -X (-7.0 relative to drone).
    expect(desiredPos.x).toBeCloseTo(10 - TPP_CONFIG.FOLLOW_DISTANCE, 2);
    expect(desiredPos.z).toBeCloseTo(0, 2);

    // Look target is ahead in the travel direction (+X)
    expect(lookTarget.x).toBeCloseTo(10 + TPP_CONFIG.LEAD_AHEAD, 2);
    expect(lookTarget.z).toBeCloseTo(0, 2);
  });

  it('smoothly follows drone heading when turning 90 degrees left (yaw = -PI/2)', () => {
    const dronePos = { x: -10, y: 8, z: 0 };
    const yaw = -Math.PI / 2; // Moving left (-X)
    const { desiredPos, lookTarget } = calculateTPPCameraTargets(dronePos, yaw, TPP_CONFIG, [], 10);

    // Drone is moving left (-X). Camera must be behind at +X (+7.0 relative to drone).
    expect(desiredPos.x).toBeCloseTo(-10 + TPP_CONFIG.FOLLOW_DISTANCE, 2);
    expect(desiredPos.z).toBeCloseTo(0, 2);

    // Look target is ahead in the travel direction (-X)
    expect(lookTarget.x).toBeCloseTo(-10 - TPP_CONFIG.LEAD_AHEAD, 2);
    expect(lookTarget.z).toBeCloseTo(0, 2);
  });

  it('smoothly follows drone heading when moving backward (yaw = 0, distance > 0)', () => {
    const dronePos = { x: 0, y: 8, z: 15 };
    const yaw = 0; // Moving backward (+Z)
    const { desiredPos, lookTarget } = calculateTPPCameraTargets(dronePos, yaw, TPP_CONFIG, [], 10);

    // Drone is moving backward (+Z). Camera must be behind at -Z (-7.0 relative to drone).
    expect(desiredPos.x).toBeCloseTo(0, 2);
    expect(desiredPos.z).toBeCloseTo(15 - TPP_CONFIG.FOLLOW_DISTANCE, 2);

    // Look target is ahead in travel direction (+Z)
    expect(lookTarget.x).toBeCloseTo(0, 2);
    expect(lookTarget.z).toBeCloseTo(15 + TPP_CONFIG.LEAD_AHEAD, 2);
  });

  it('clamps camera altitude so it never goes below MIN_CAMERA_Y even when grounded', () => {
    const dronePos = { x: 0, y: 0, z: 0 };
    const yaw = Math.PI;
    const { desiredPos } = calculateTPPCameraTargets(
      dronePos,
      yaw,
      {
        ...TPP_CONFIG,
        HEIGHT_OFFSET: 0.1, // Intentionally low offset
        MIN_CAMERA_Y: 1.5,
      },
      [],
      10
    );

    expect(desiredPos.y).toBeGreaterThanOrEqual(1.5);
  });

  it('pulls camera closer when an obstacle is directly behind the drone', () => {
    const dronePos = { x: 0, y: 5, z: 0 };
    const yaw = Math.PI; // Moving forward (-Z), so behind drone is +Z
    const obstacle: Obstacle = {
      position: { x: 0, y: 5 + TPP_CONFIG.HEIGHT_OFFSET, z: 6.5 },
      halfSize: { x: 2, y: 2, z: 2 },
    };

    const withoutObstacle = calculateTPPCameraTargets(dronePos, yaw, TPP_CONFIG, [], 10);
    const withObstacle = calculateTPPCameraTargets(dronePos, yaw, TPP_CONFIG, [obstacle], 10);

    // Camera should pull closer (+Z should be smaller than normal follow distance)
    expect(withObstacle.desiredPos.z).toBeLessThan(withoutObstacle.desiredPos.z);
    expect(withObstacle.desiredPos.z).toBeGreaterThanOrEqual(3.0);
  });

  it('target lookAt point rises during climb and lowers during descent without jitter', () => {
    const climbLow = calculateTPPCameraTargets({ x: 0, y: 2, z: 0 }, Math.PI, TPP_CONFIG, [], 10);
    const climbHigh = calculateTPPCameraTargets({ x: 0, y: 12, z: 0 }, Math.PI, TPP_CONFIG, [], 10);

    expect(climbHigh.lookTarget.y).toBeGreaterThan(climbLow.lookTarget.y);
    expect(climbHigh.desiredPos.y).toBeGreaterThan(climbLow.desiredPos.y);
    expect(climbHigh.desiredPos.y - climbLow.desiredPos.y).toBeCloseTo(10, 2);
  });
});
