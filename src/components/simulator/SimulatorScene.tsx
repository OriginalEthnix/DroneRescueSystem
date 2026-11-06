/**
 * SimulatorScene — Three.js / React Three Fiber scene containing:
 *  - Ground plane with grid
 *  - Coordinate axes
 *  - Altitude markers
 *  - Obstacle buildings
 *  - Flight trajectory line
 *  - Home marker
 *  - Drone model (positioned/oriented by physics state)
 *  - Lighting, shadows, OrbitControls
 */
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { DronePhysicsState } from './flightPhysics';
import { SCENE_OBSTACLES, PHYSICS } from './flightPhysics';
import { DroneModel } from './DroneModel';

// ─── Drone Positioner (inside Canvas) ────────────────────────────────────────

interface DroneRigProps {
  stateRef: React.MutableRefObject<DronePhysicsState>;
}

const DroneRig: React.FC<DroneRigProps> = ({ stateRef }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const s = stateRef.current;
    groupRef.current.position.set(s.position.x, s.position.y, s.position.z);
    groupRef.current.rotation.set(s.pitchAngle, s.yawAngle, s.rollAngle);
  });

  return (
    <group ref={groupRef}>
      <DroneModel propellerSpeed={25} />
      {/* Spotlight following the drone */}
      <pointLight color="#06b6d4" intensity={3} distance={6} decay={2} />
    </group>
  );
};

// ─── Trajectory Line ──────────────────────────────────────────────────────────

interface TrajectoryProps {
  stateRef: React.MutableRefObject<DronePhysicsState>;
}

const TrajectoryLine: React.FC<TrajectoryProps> = ({ stateRef }) => {
  const geoRef = useRef(new THREE.BufferGeometry());
  const matRef = useRef(new THREE.LineBasicMaterial({ color: '#06b6d4', opacity: 0.5, transparent: true }));
  const lineObjRef = useRef(new THREE.Line(geoRef.current, matRef.current));

  useFrame(() => {
    const history = stateRef.current.trajectoryHistory;
    if (history.length < 2) return;
    const points = history.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    geoRef.current.setFromPoints(points);
    geoRef.current.computeBoundingSphere();
    lineObjRef.current.geometry = geoRef.current;
  });

  return <primitive object={lineObjRef.current} />;
};

// ─── Altitude Markers ─────────────────────────────────────────────────────────

const AltitudeMarkers: React.FC = () => {
  const altitudes = [5, 10, 15, 20, 30];
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

// ─── Obstacles ────────────────────────────────────────────────────────────────

const ObstacleBuildings: React.FC<{ collisionState: boolean }> = ({ collisionState }) => {
  const colors = ['#1e3a5f', '#1a3a4a', '#162d3e', '#1e2d3a', '#152534'];

  return (
    <>
      {SCENE_OBSTACLES.map((obs, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          position={[obs.position.x, obs.position.y, obs.position.z]}
        >
          <boxGeometry
            args={[obs.halfSize.x * 2, obs.halfSize.y * 2, obs.halfSize.z * 2]}
          />
          <meshStandardMaterial
            color={collisionState ? '#7f1d1d' : colors[i % colors.length]}
            metalness={0.4}
            roughness={0.6}
            emissive={collisionState ? '#ef4444' : '#0ea5e9'}
            emissiveIntensity={collisionState ? 0.3 : 0.05}
          />
        </mesh>
      ))}
    </>
  );
};

// ─── Coordinate Axes ──────────────────────────────────────────────────────────

const CoordAxes: React.FC = () => (
  <>
    {/* X — red */}
    <Line points={[[0,0.02,0],[8,0.02,0]]} color="#ef4444" lineWidth={1.5} />
    {/* Y — green */}
    <Line points={[[0,0,0],[0,8,0]]} color="#22c55e" lineWidth={1.5} />
    {/* Z — blue */}
    <Line points={[[0,0.02,0],[0,0.02,-8]]} color="#3b82f6" lineWidth={1.5} />
  </>
);

// ─── Home Marker ──────────────────────────────────────────────────────────────

const HomeMarker: React.FC = () => (
  <group position={[0, 0.02, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.85, 32]} />
      <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} side={THREE.DoubleSide} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.15, 0.35, 32]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

// ─── Inner Scene ──────────────────────────────────────────────────────────────

interface InnerSceneProps {
  stateRef: React.MutableRefObject<DronePhysicsState>;
  collisionState: boolean;
}

const InnerScene: React.FC<InnerSceneProps> = ({ stateRef, collisionState }) => {
  return (
    <>
      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        minDistance={3}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2 - 0.02}
      />

      {/* Lighting */}
      <ambientLight intensity={0.35} color="#c7d2fe" />
      <directionalLight
        castShadow
        position={[20, 40, 20]}
        intensity={1.8}
        color="#e0f2fe"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight args={['#1e40af', '#0f172a', 0.4]} />

      {/* Ground Grid */}
      <Grid
        position={[0, 0, 0]}
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

      {/* Ground plane (receives shadows) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0b1220" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Coordinate Axes */}
      <CoordAxes />

      {/* Home Marker */}
      <HomeMarker />

      {/* Altitude Markers */}
      <AltitudeMarkers />

      {/* Obstacles */}
      <ObstacleBuildings collisionState={collisionState} />

      {/* Drone */}
      <DroneRig stateRef={stateRef} />

      {/* Trajectory */}
      <TrajectoryLine stateRef={stateRef} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#060c18', 60, 130]} />
    </>
  );
};

// ─── Public Canvas Component ──────────────────────────────────────────────────

interface SimulatorSceneProps {
  stateRef: React.MutableRefObject<DronePhysicsState>;
  collisionState: boolean;
}

export const SimulatorScene: React.FC<SimulatorSceneProps> = ({ stateRef, collisionState }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [18, 14, 22], fov: 55, near: 0.1, far: 300 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#060c18' }}
    >
      <InnerScene stateRef={stateRef} collisionState={collisionState} />
    </Canvas>
  );
};
