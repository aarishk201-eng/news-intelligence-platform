'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PresentationControls } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import { Suspense, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { MathUtils } from 'three';
import { threejsOptimization } from '@/lib/performance-utils';

function Sculpture({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<Group>(null);

  const glass = useMemo(
    () => ({
      transmission: 1,
      thickness: 0.55,
      roughness: 0.16,
      ior: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.22,
    }),
    []
  );

  useFrame((state) => {
    if (!group.current || reduceMotion) return;

    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.12;
    group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, Math.sin(t * 0.2) * 0.08, 0.06);
    group.current.position.y = Math.sin(t * 0.35) * 0.06;
  }, 1); // Priority 1: render after default (0), before UI (2+)

  return (
    <group ref={group}>
      {/* Main form - optimized geometry */}
      <mesh>
        <torusKnotGeometry args={[1.05, 0.32, 220, 24]} />
        <meshPhysicalMaterial
          {...glass}
          color="#C9D0FF"
          attenuationColor="#0A0A0A"
          attenuationDistance={1.7}
        />
      </mesh>

      {/* Secondary ring */}
      <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.55, 0.06, 16, 96]} />
        <meshPhysicalMaterial
          {...glass}
          roughness={0.2}
          thickness={0.35}
          color="#A8B3CF"
          attenuationColor="#0A0A0A"
          attenuationDistance={1.9}
        />
      </mesh>

      {/* Faceted accent - low poly for performance */}
      <mesh position={[0.25, -0.25, 0.55]} scale={0.55}>
        <icosahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial
          {...glass}
          roughness={0.14}
          thickness={0.4}
          color="#EDEFFF"
          attenuationColor="#0A0A0A"
          attenuationDistance={2.1}
        />
      </mesh>
    </group>
  );
}

export function GlassSculptureCanvas({
  className,
}: {
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={threejsOptimization.dpr}
        camera={{ position: [0, 0, 5.8], fov: 42 }}
        gl={{
          antialias: threejsOptimization.antialias,
          alpha: threejsOptimization.alpha,
          powerPreference: threejsOptimization.powerPreference,
        }}
        frameloop={reduceMotion ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          {/* Optimized lighting - minimal light count */}
          <ambientLight intensity={0.45} />
          <directionalLight position={[4, 3, 4]} intensity={0.85} />
          <directionalLight position={[-3, -2, 2]} intensity={0.35} />

          <Sculpture reduceMotion={!!reduceMotion} />

          {/* Studio reflections - preset reduces computation */}
          <Environment preset="studio" blur={0.6} />
        </Suspense>
      </Canvas>
    </div>
  );
}

