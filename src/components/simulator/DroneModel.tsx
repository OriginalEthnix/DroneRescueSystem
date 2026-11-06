/**
 * DroneModel — Detailed 3D Quadcopter built from Three.js primitives.
 *
 * Structure:
 *   Central body (hexagonal-ish box + dome camera)
 *   Four arms (thin cylinders rotated ±45°)
 *   Four motor housings (cylinders on arm tips)
 *   Four propellers (two thin boxes per motor)
 *   Landing gear (four legs)
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface DroneModelProps {
  propellerSpeed?: number; // rotations per second (0 = stopped)
}

const ARM_LENGTH = 1.5;
const ARM_ANGLES = [45, -45, 135, -135].map((deg) => (deg * Math.PI) / 180);
const PROP_COLORS = ['#06b6d4', '#06b6d4', '#f59e0b', '#f59e0b']; // CW/CCW tints

export const DroneModel: React.FC<DroneModelProps> = ({ propellerSpeed = 25 }) => {
  const groupRef = useRef<Group>(null);
  const prop0 = useRef<Group>(null);
  const prop1 = useRef<Group>(null);
  const prop2 = useRef<Group>(null);
  const prop3 = useRef<Group>(null);
  const propRefs = [prop0, prop1, prop2, prop3];

  useFrame((_, delta) => {
    const rps = propellerSpeed * delta * Math.PI * 2;
    propRefs.forEach((ref, i) => {
      if (ref.current) {
        // Alternate CW / CCW
        ref.current.rotation.y += i % 2 === 0 ? rps : -rps;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* ── Central Body ── */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.4, 0.35, 1.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Body accent plate */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[1.1, 0.06, 1.1]} />
        <meshStandardMaterial color="#0e7490" metalness={0.9} roughness={0.2} emissive="#06b6d4" emissiveIntensity={0.15} />
      </mesh>

      {/* Front indicator strip */}
      <mesh position={[0, 0.19, -0.55]}>
        <boxGeometry args={[0.6, 0.04, 0.08]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.8} />
      </mesh>

      {/* Camera gimbal mount */}
      <mesh position={[0, -0.22, -0.55]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Camera lens */}
      <mesh position={[0, -0.22, -0.68]}>
        <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.6} roughness={0.1} emissive="#38bdf8" emissiveIntensity={0.4} />
      </mesh>

      {/* ── Arms & Motors & Propellers ── */}
      {ARM_ANGLES.map((angle, i) => {
        const armX = Math.sin(angle) * ARM_LENGTH;
        const armZ = Math.cos(angle) * ARM_LENGTH;
        const PropRef = propRefs[i];

        return (
          <group key={i}>
            {/* Arm */}
            <mesh
              castShadow
              position={[armX / 2, 0, armZ / 2]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[ARM_LENGTH, 0.14, 0.28]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Motor housing */}
            <mesh castShadow position={[armX, 0.1, armZ]}>
              <cylinderGeometry args={[0.22, 0.18, 0.25, 16]} />
              <meshStandardMaterial color="#0e7490" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Motor top cap */}
            <mesh position={[armX, 0.24, armZ]}>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Propeller group — spins */}
            <group ref={PropRef} position={[armX, 0.3, armZ]}>
              {/* Blade 1 */}
              <mesh>
                <boxGeometry args={[0.9, 0.025, 0.12]} />
                <meshStandardMaterial
                  color={PROP_COLORS[i]}
                  transparent
                  opacity={0.82}
                  metalness={0.3}
                  roughness={0.5}
                />
              </mesh>
              {/* Blade 2 (perpendicular) */}
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[0.9, 0.025, 0.12]} />
                <meshStandardMaterial
                  color={PROP_COLORS[i]}
                  transparent
                  opacity={0.82}
                  metalness={0.3}
                  roughness={0.5}
                />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* ── Landing Gear ── */}
      {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].map(([lx, lz], i) => (
        <group key={`leg-${i}`} position={[lx, 0, lz]}>
          {/* Vertical strut */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.28, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.22, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ── Status LEDs ── */}
      {/* Front-left: green */}
      <mesh position={[-0.5, 0.19, -0.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} />
      </mesh>
      {/* Front-right: green */}
      <mesh position={[0.5, 0.19, -0.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} />
      </mesh>
      {/* Rear-left: red */}
      <mesh position={[-0.5, 0.19, 0.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
      {/* Rear-right: red */}
      <mesh position={[0.5, 0.19, 0.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
};
