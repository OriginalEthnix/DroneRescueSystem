/**
 * DroneSimulatorPage — Main entry point for the 3D Drone Simulator.
 *
 * Architecture:
 *   - Physics state lives in a mutable ref (physicsRef) updated inside the R3F
 *     animation loop via `useFrame` so it does NOT trigger React re-renders on
 *     every frame.
 *   - A separate React state (snapshot) is updated at ~10 Hz for the telemetry
 *     HUD so UI updates are affordable.
 *   - Camera mode ('tpp' | 'orbit') is stored in a React state for the UI toggle
 *     and mirrored into a ref (cameraModeRef) so the animation loop can read it
 *     without closures over stale state.
 *   - TPPCameraController runs inside useFrame and directly mutates camera.position /
 *     camera.lookAt using smooth interpolation — zero allocations per frame.
 *   - OrbitControls is enabled only in 'orbit' mode so it never fights TPP mode.
 *   - Keyboard listeners are attached at the document level, with guards to skip
 *     when focus is on an input element.
 *   - All active inputs are cleared on window blur and component unmount.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { Video, Orbit } from 'lucide-react';
import * as THREE from 'three';

import {
  stepDronePhysics,
  commandTakeoff,
  commandLand,
  commandReset,
  INITIAL_DRONE_STATE,
  INITIAL_INPUT,
  SCENE_OBSTACLES,
  PHYSICS,
  type DronePhysicsState,
  type InputState,
  type Obstacle,
} from './flightPhysics';
import { DroneModel } from './DroneModel';
import { FlightControlPanel } from './FlightControlPanel';
import { TelemetryHUD } from './TelemetryHUD';

// ─── Camera mode type ─────────────────────────────────────────────────────────
export type CameraMode = 'tpp' | 'orbit';

// ─── TPP camera configuration ────────────────────────────────────────────────
export interface TPPCameraConfig {
  /** Distance behind the drone along its yaw heading */
  FOLLOW_DISTANCE: number;
  /** Height above drone center for the camera */
  HEIGHT_OFFSET: number;
  /** Look-at target height above drone center */
  LOOK_ABOVE: number;
  /** Lead-ahead distance in front of drone center for look-at target */
  LEAD_AHEAD: number;
  /** Minimum camera Y above ground plane */
  MIN_CAMERA_Y: number;
  /** Position lerp rate per second */
  POS_LERP_SPEED: number;
  /** LookAt target lerp rate per second */
  TARGET_LERP_SPEED: number;
}

export const TPP_CONFIG: TPPCameraConfig = {
  FOLLOW_DISTANCE: 7.0,
  HEIGHT_OFFSET: 2.8,
  LOOK_ABOVE: 0.8,
  LEAD_AHEAD: 1.2,
  MIN_CAMERA_Y: 1.1,
  POS_LERP_SPEED: 7.0,
  TARGET_LERP_SPEED: 9.0,
};

/**
 * Pure function to calculate the ideal TPP camera position and lookAt target.
 * Exported for automated unit testing.
 *
 * Coordinate convention:
 *   -Z is Forward (North, towards obstacles).
 *   +Z is Backward (South).
 *   +X is Right (East), -X is Left (West).
 *
 * In flightPhysics, horizontal movement velocity gives:
 *   forwardVector = (sin(yawAngle), 0, cos(yawAngle)).
 *   For forward movement (-Z), yawAngle = Math.PI (sin=0, cos=-1).
 *   For rightward movement (+X), yawAngle = Math.PI/2 (sin=1, cos=0).
 *   For leftward movement (-X), yawAngle = -Math.PI/2 (sin=-1, cos=0).
 *   For backward movement (+Z), yawAngle = 0 (sin=0, cos=1).
 *
 * The camera must be positioned BEHIND the drone (opposite to the forward vector),
 * and aim towards a point near or slightly ahead of the drone center.
 */
export function calculateTPPCameraTargets(
  dronePos: { x: number; y: number; z: number },
  yawAngle: number,
  config: TPPCameraConfig = TPP_CONFIG,
  obstacles: Obstacle[] = [],
  distanceTravelled: number = 0
): { desiredPos: { x: number; y: number; z: number }; lookTarget: { x: number; y: number; z: number } } {
  // When at rest on the launchpad (distanceTravelled === 0 and yawAngle === 0),
  // the drone model is oriented facing forward towards -Z (North), so effective forward is -Z (yaw = Math.PI).
  const effectiveYaw = (yawAngle === 0 && distanceTravelled === 0) ? Math.PI : yawAngle;

  const fwdX = Math.sin(effectiveYaw);
  const fwdZ = Math.cos(effectiveYaw);

  let followDist: number = config.FOLLOW_DISTANCE;

  // Check obstacle clearance behind the drone to prevent camera clipping inside buildings
  if (obstacles.length > 0) {
    for (const obs of obstacles) {
      const testX = dronePos.x - fwdX * followDist;
      const testY = dronePos.y + config.HEIGHT_OFFSET;
      const testZ = dronePos.z - fwdZ * followDist;
      const margin = 0.8;
      const inside =
        Math.abs(testX - obs.position.x) < obs.halfSize.x + margin &&
        Math.abs(testY - obs.position.y) < obs.halfSize.y + margin &&
        Math.abs(testZ - obs.position.z) < obs.halfSize.z + margin;
      if (inside) {
        followDist = Math.max(3.0, followDist * 0.6);
        break;
      }
    }
  }

  // Camera is positioned BEHIND the drone (opposite to the forward vector)
  const desiredX = dronePos.x - fwdX * followDist;
  const desiredY = Math.max(config.MIN_CAMERA_Y, dronePos.y + config.HEIGHT_OFFSET);
  const desiredZ = dronePos.z - fwdZ * followDist;

  // Camera looks toward a point near the drone center and slightly ahead in the travel direction
  const lookTarget = {
    x: dronePos.x + fwdX * config.LEAD_AHEAD,
    y: dronePos.y + config.LOOK_ABOVE,
    z: dronePos.z + fwdZ * config.LEAD_AHEAD,
  };

  return {
    desiredPos: { x: desiredX, y: desiredY, z: desiredZ },
    lookTarget,
  };
}

// ─── Zero-allocation reusable vectors for animation loop ─────────────────────
const _desiredPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _smoothedTarget = new THREE.Vector3();

// ─── Inner Canvas Components (must live inside <Canvas>) ─────────────────────

interface DroneRigProps {
  physicsRef: React.MutableRefObject<DronePhysicsState>;
  inputRef: React.MutableRefObject<InputState>;
  commandRef: React.MutableRefObject<'takeoff' | 'land' | 'reset' | null>;
  onSnapshot: (s: DronePhysicsState) => void;
  resetSnapRef: React.MutableRefObject<boolean>;
}

let lastSnapshotTime = 0;

const DroneRig: React.FC<DroneRigProps> = ({
  physicsRef,
  inputRef,
  commandRef,
  onSnapshot,
  resetSnapRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Process one-shot commands
    const cmd = commandRef.current;
    if (cmd) {
      commandRef.current = null;
      if (cmd === 'takeoff') physicsRef.current = commandTakeoff(physicsRef.current);
      else if (cmd === 'land') physicsRef.current = commandLand(physicsRef.current);
      else if (cmd === 'reset') {
        physicsRef.current = commandReset();
        inputRef.current = { ...INITIAL_INPUT };
        resetSnapRef.current = true; // Signal camera to snap immediately on reset
      }
    }

    // Step physics
    physicsRef.current = stepDronePhysics(
      physicsRef.current,
      inputRef.current,
      delta,
      SCENE_OBSTACLES
    );

    // Apply to 3D mesh
    if (groupRef.current) {
      const s = physicsRef.current;
      groupRef.current.position.set(s.position.x, s.position.y, s.position.z);
      groupRef.current.rotation.set(s.pitchAngle, s.yawAngle, s.rollAngle);
    }

    // Publish snapshot at ~10 Hz to avoid React render pressure
    const now = performance.now();
    if (now - lastSnapshotTime > 100) {
      lastSnapshotTime = now;
      onSnapshot({ ...physicsRef.current });
    }
  });

  return (
    <group ref={groupRef}>
      <DroneModel propellerSpeed={25} />
      <pointLight color="#06b6d4" intensity={6} distance={8} decay={2} />
      <pointLight color="#ffffff" intensity={3} distance={5} decay={2} position={[0, 1.5, 0]} />
    </group>
  );
};

// ─── Third-Person Follow Camera Controller ────────────────────────────────────

interface TPPCameraControllerProps {
  physicsRef: React.MutableRefObject<DronePhysicsState>;
  cameraModeRef: React.MutableRefObject<CameraMode>;
  resetSnapRef: React.MutableRefObject<boolean>;
}

const TPPCameraController: React.FC<TPPCameraControllerProps> = ({
  physicsRef,
  cameraModeRef,
  resetSnapRef,
}) => {
  const isInitialized = useRef<boolean>(false);

  useFrame(({ camera }, delta) => {
    if (cameraModeRef.current !== 'tpp') {
      return; // Orbit controls take full precedence in orbit mode
    }

    const s = physicsRef.current;
    const { desiredPos, lookTarget } = calculateTPPCameraTargets(
      s.position,
      s.yawAngle,
      TPP_CONFIG,
      SCENE_OBSTACLES,
      s.distanceTravelled
    );

    _desiredPos.set(desiredPos.x, desiredPos.y, desiredPos.z);
    _lookTarget.set(lookTarget.x, lookTarget.y, lookTarget.z);

    // If first frame or explicit reset requested, snap camera immediately
    if (!isInitialized.current || resetSnapRef.current) {
      camera.position.copy(_desiredPos);
      _smoothedTarget.copy(_lookTarget);
      camera.lookAt(_smoothedTarget);
      isInitialized.current = true;
      resetSnapRef.current = false;
      return;
    }

    // Smooth frame-rate independent position lerp
    const safeDelta = Math.min(delta, 0.1);
    const posLerp = 1 - Math.exp(-TPP_CONFIG.POS_LERP_SPEED * safeDelta);
    camera.position.lerp(_desiredPos, posLerp);

    // Keep camera strictly above ground
    if (camera.position.y < TPP_CONFIG.MIN_CAMERA_Y) {
      camera.position.y = TPP_CONFIG.MIN_CAMERA_Y;
    }

    // Smooth target lerp for gaze tracking
    const targetLerp = 1 - Math.exp(-TPP_CONFIG.TARGET_LERP_SPEED * safeDelta);
    _smoothedTarget.lerp(_lookTarget, targetLerp);

    camera.lookAt(_smoothedTarget);
  });

  return null;
};

// Trajectory line rendered from trajectory history
const TrajectoryLine: React.FC<{ physicsRef: React.MutableRefObject<DronePhysicsState> }> = ({
  physicsRef,
}) => {
  const geoRef = useRef(new THREE.BufferGeometry());
  const matRef = useRef(
    new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.45 })
  );
  const lineObjRef = useRef(new THREE.Line(geoRef.current, matRef.current));

  useEffect(() => {
    return () => {
      geoRef.current.dispose();
      matRef.current.dispose();
    };
  }, []);

  useFrame(() => {
    const history = physicsRef.current.trajectoryHistory;
    if (history.length < 2) return;
    const points = history.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    geoRef.current.setFromPoints(points);
    geoRef.current.computeBoundingSphere();
    lineObjRef.current.geometry = geoRef.current;
  });

  return <primitive object={lineObjRef.current} />;
};

// Obstacle meshes
const ObstacleMeshes: React.FC<{ collisionState: boolean }> = ({ collisionState }) => {
  const obstacleColors = ['#1e3a5f', '#1a3a4a', '#162d3e', '#1e2d3a', '#152534'];
  return (
    <>
      {SCENE_OBSTACLES.map((obs, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          position={[obs.position.x, obs.position.y, obs.position.z]}
        >
          <boxGeometry args={[obs.halfSize.x * 2, obs.halfSize.y * 2, obs.halfSize.z * 2]} />
          <meshStandardMaterial
            color={collisionState ? '#7f1d1d' : obstacleColors[i % obstacleColors.length]}
            metalness={0.4}
            roughness={0.6}
            emissive={collisionState ? '#ef4444' : '#0ea5e9'}
            emissiveIntensity={collisionState ? 0.35 : 0.05}
          />
        </mesh>
      ))}
    </>
  );
};

// Coordinate axes
const CoordAxes: React.FC = () => (
  <>
    <Line points={[[0, 0.05, 0], [8, 0.05, 0]]} color="#ef4444" lineWidth={1.5} />
    <Line points={[[0, 0.05, 0], [0, 8, 0.05]]} color="#22c55e" lineWidth={1.5} />
    <Line points={[[0, 0.05, 0], [0, 0.05, -8]]} color="#3b82f6" lineWidth={1.5} />
  </>
);

// Home marker ring
const HomeMarker: React.FC = () => (
  <group position={[0, 0.04, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.9, 32]} />
      <meshStandardMaterial
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.15, 0.35, 32]} />
      <meshStandardMaterial
        color="#f59e0b"
        emissive="#f59e0b"
        emissiveIntensity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  </group>
);

// Altitude reference markers along the left boundary
const AltitudeMarkers: React.FC = () => {
  const altitudes = [5, 10, 15, 20, 30, 40];
  return (
    <>
      {altitudes.map((alt) => (
        <group key={alt} position={[-PHYSICS.BOUNDARY, alt, 0]}>
          <mesh>
            <boxGeometry args={[0.15, 0.06, 0.15]} />
            <meshStandardMaterial color="#0e7490" emissive="#06b6d4" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ─── Inner Scene (inside Canvas) ─────────────────────────────────────────────

interface InnerSceneProps {
  physicsRef: React.MutableRefObject<DronePhysicsState>;
  inputRef: React.MutableRefObject<InputState>;
  commandRef: React.MutableRefObject<'takeoff' | 'land' | 'reset' | null>;
  onSnapshot: (s: DronePhysicsState) => void;
  collisionState: boolean;
  cameraMode: CameraMode;
  cameraModeRef: React.MutableRefObject<CameraMode>;
  resetSnapRef: React.MutableRefObject<boolean>;
}

const InnerScene: React.FC<InnerSceneProps> = ({
  physicsRef,
  inputRef,
  commandRef,
  onSnapshot,
  collisionState,
  cameraMode,
  cameraModeRef,
  resetSnapRef,
}) => {
  return (
    <>
      {/* Third Person Follow Camera Controller */}
      <TPPCameraController
        physicsRef={physicsRef}
        cameraModeRef={cameraModeRef}
        resetSnapRef={resetSnapRef}
      />

      {/* OrbitControls enabled only in Orbit / Free Camera mode */}
      <OrbitControls
        makeDefault
        enabled={cameraMode === 'orbit'}
        enableDamping
        dampingFactor={0.07}
        minDistance={2}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2 - 0.01}
      />

      {/* Lighting */}
      <ambientLight intensity={0.55} color="#c7d2fe" />
      <directionalLight
        castShadow
        position={[20, 40, 20]}
        intensity={2.2}
        color="#e0f2fe"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight args={['#1e40af', '#0f172a', 0.5]} />

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0a1120" roughness={0.9} />
      </mesh>

      {/* Grid */}
      <Grid
        args={[100, 100]}
        cellSize={2}
        cellThickness={0.4}
        cellColor="#1e3a5f"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#0e7490"
        fadeDistance={120}
        fadeStrength={1}
        infiniteGrid={false}
      />

      <CoordAxes />
      <HomeMarker />
      <AltitudeMarkers />
      <ObstacleMeshes collisionState={collisionState} />
      <DroneRig
        physicsRef={physicsRef}
        inputRef={inputRef}
        commandRef={commandRef}
        onSnapshot={onSnapshot}
        resetSnapRef={resetSnapRef}
      />
      <TrajectoryLine physicsRef={physicsRef} />
      <fog attach="fog" args={['#060c18', 70, 140]} />
    </>
  );
};

// ─── Keyboard Mapping ─────────────────────────────────────────────────────────

const KEY_MAP: Record<string, keyof InputState> = {
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'forward',
  W: 'forward',
  s: 'backward',
  S: 'backward',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  ' ': 'up', // Space
};

const PREVENT_SCROLL_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

// ─── Main Page Component ──────────────────────────────────────────────────────

export const DroneSimulatorPage: React.FC = () => {
  // High-frequency mutable refs (no re-render on change)
  const physicsRef = useRef<DronePhysicsState>({ ...INITIAL_DRONE_STATE });
  const inputRef = useRef<InputState>({ ...INITIAL_INPUT });
  const commandRef = useRef<'takeoff' | 'land' | 'reset' | null>(null);

  // Camera mode state & mirror ref
  const [cameraMode, setCameraMode] = useState<CameraMode>('tpp');
  const cameraModeRef = useRef<CameraMode>('tpp');
  const resetSnapRef = useRef<boolean>(true); // Initial snap on first mount

  const handleCameraModeChange = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    cameraModeRef.current = mode;
  }, []);

  // Low-frequency React state for HUD
  const [snapshot, setSnapshot] = useState<DronePhysicsState>({ ...INITIAL_DRONE_STATE });

  const handleSnapshot = useCallback((s: DronePhysicsState) => {
    setSnapshot(s);
  }, []);

  // ── Input helpers ──────────────────────────────────────────────────────────
  const startInput = useCallback((key: keyof InputState) => {
    inputRef.current = { ...inputRef.current, [key]: true };
  }, []);

  const endInput = useCallback((key: keyof InputState) => {
    inputRef.current = { ...inputRef.current, [key]: false };
  }, []);

  const issueCommand = useCallback((cmd: 'takeoff' | 'land' | 'reset') => {
    commandRef.current = cmd;
  }, []);

  const clearAllInputs = useCallback(() => {
    inputRef.current = { ...INITIAL_INPUT };
  }, []);

  // ── Keyboard listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null): boolean => {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (PREVENT_SCROLL_KEYS.has(e.key)) e.preventDefault();

      const inputKey = KEY_MAP[e.key];
      if (inputKey) {
        startInput(inputKey);
      }

      // Shift = descend
      if (e.key === 'Shift') startInput('down');

      // One-shot commands
      if (e.key === 't' || e.key === 'T') issueCommand('takeoff');
      if (e.key === 'l' || e.key === 'L') issueCommand('land');
      if (e.key === 'r' || e.key === 'R') issueCommand('reset');

      // Camera mode shortcuts: C toggles camera mode
      if (e.key === 'c' || e.key === 'C') {
        handleCameraModeChange(cameraModeRef.current === 'tpp' ? 'orbit' : 'tpp');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const inputKey = KEY_MAP[e.key];
      if (inputKey) endInput(inputKey);
      if (e.key === 'Shift') endInput('down');
    };

    const onBlur = () => clearAllInputs();
    const onVisibilityChange = () => {
      if (document.hidden) clearAllInputs();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearAllInputs();
    };
  }, [startInput, endInput, issueCommand, clearAllInputs, handleCameraModeChange]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* ── Page Header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L8 6H4v4l-2 2 2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">3D Drone Simulator</h2>
            <p className="text-[10px] text-cyan-400 font-mono">
              Interactive Flight Simulation · Third-Person Follow Camera
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span className="px-2 py-1 bg-amber-900/30 border border-amber-700/40 rounded text-amber-400">
            ⚠ Simulated Only
          </span>
          <span className="px-2 py-1 bg-slate-800/60 border border-slate-700/40 rounded">
            ESP32 sensors are independent
          </span>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Telemetry sidebar */}
        <div className="hidden lg:flex flex-col p-3 gap-2 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-900/40">
          <TelemetryHUD snapshot={snapshot} />
        </div>

        {/* Centre: 3D Viewport */}
        <div className="relative flex-1 overflow-hidden">
          <Canvas
            shadows
            camera={{ position: [0, 3.3, 7.0], fov: 50, near: 0.1, far: 300 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: '#060c18', width: '100%', height: '100%' }}
          >
            <InnerScene
              physicsRef={physicsRef}
              inputRef={inputRef}
              commandRef={commandRef}
              onSnapshot={handleSnapshot}
              collisionState={snapshot.collisionState}
              cameraMode={cameraMode}
              cameraModeRef={cameraModeRef}
              resetSnapRef={resetSnapRef}
            />
          </Canvas>

          {/* Coordinate axis legend overlay */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 text-[9px] font-mono space-y-0.5 pointer-events-none z-10">
            <div className="text-slate-400 uppercase tracking-wider text-[8px] mb-1">
              Scene Axes
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500 inline-block" />X Right
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 inline-block" />Y Up
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" />Z Fwd
            </div>
          </div>

          {/* Camera Mode Selector — sleek top-right overlay */}
          <div className="absolute top-3 right-4 z-20 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-lg p-1 shadow-xl">
            <button
              onClick={() => handleCameraModeChange('tpp')}
              title="Third-Person Perspective Follow Camera (Hotkey: C)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                cameraMode === 'tpp'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>TPP Follow</span>
            </button>
            <button
              onClick={() => handleCameraModeChange('orbit')}
              title="Free Orbit Camera (Hotkey: C)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                cameraMode === 'orbit'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Orbit className="w-3.5 h-3.5 text-cyan-400" />
              <span>Orbit / Free</span>
            </button>
          </div>

          {/* Collision alert overlay — top-centre so it clears the right-side panel & camera mode */}
          {snapshot.collisionState && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-900/85 backdrop-blur-sm border border-red-500/60 rounded-lg px-3 py-1.5 text-[11px] font-mono text-red-300 animate-pulse z-10 pointer-events-none whitespace-nowrap">
              🔴 OBSTACLE COLLISION
            </div>
          )}

          {/* Flight Control Panel — compact on right side */}
          <FlightControlPanel
            onInputStart={startInput}
            onInputEnd={endInput}
            onTakeoff={() => issueCommand('takeoff')}
            onLand={() => issueCommand('land')}
            onReset={() => issueCommand('reset')}
          />

          {/* Mobile telemetry (compact) — shows on small screens */}
          <div className="lg:hidden absolute top-14 right-2 z-10 scale-90 origin-top-right">
            <TelemetryHUD snapshot={snapshot} />
          </div>
        </div>
      </div>
    </div>
  );
};

