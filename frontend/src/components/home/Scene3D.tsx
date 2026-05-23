'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function GlassOrb() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = clock.getElapsedTime() * 0.08;
    mesh.current.rotation.y = clock.getElapsedTime() * 0.12;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={mesh} castShadow>
        <icosahedronGeometry args={[1, 3]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          resolution={256}
          transmission={0.95}
          roughness={0.05}
          thickness={0.5}
          ior={1.5}
          chromaticAberration={0.04}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.08}
          color="#7C8CFF"
          attenuationColor="#A8B3CF"
          attenuationDistance={0.5}
        />
      </mesh>
    </Float>
  );
}

function GlassRing() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.4;
    mesh.current.rotation.z = clock.getElapsedTime() * 0.06;
  });

  return (
    <Float speed={0.8} floatIntensity={0.4}>
      <mesh ref={mesh} position={[1.8, -0.4, -0.5]}>
        <torusGeometry args={[0.6, 0.08, 16, 60]} />
        <meshStandardMaterial
          color="#A8B3CF"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

function SmallOrb({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.getElapsedTime() * 0.2;
  });
  return (
    <Float speed={2} floatIntensity={0.8} rotationIntensity={0.5}>
      <mesh ref={mesh} position={position}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color="#7C8CFF"
          metalness={0.8}
          roughness={0.15}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} color="#A8B3CF" />
          <directionalLight position={[-5, -5, 2]} intensity={0.3} color="#7C8CFF" />
          <pointLight position={[2, 2, 2]} intensity={0.6} color="#7C8CFF" />
          <Environment preset="city" />
          <GlassOrb />
          <GlassRing />
          <SmallOrb position={[-2.2, 1.2, -0.3]} />
          <SmallOrb position={[2.4, 1.5, -0.8]} />
          <SmallOrb position={[-1.8, -1.6, 0.2]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
