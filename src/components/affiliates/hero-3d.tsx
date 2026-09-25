"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Lightformer, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * Emblema metálico 3D de la red de afiliados: anillo cromado giratorio
 * con la "C" de Caskiuz en metal pulido, partículas y luces azules.
 * Escena ligera (sin HDR externo): el environment se genera con Lightformers.
 */

function MetalC() {
  // Material cromado compartido por el texto 3D
  const textMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8ecf1",
        metalness: 1,
        roughness: 0.22,
        envMapIntensity: 1.2,
      }),
    []
  );

  return (
    <group>
      {/* Anillo principal cromado */}
      <mesh castShadow>
        <torusGeometry args={[2.1, 0.5, 64, 128]} />
        <meshStandardMaterial
          color="#c7d2e0"
          metalness={1}
          roughness={0.18}
          envMapIntensity={1.4}
        />
      </mesh>
      {/* Anillo interior azul neón */}
      <mesh>
        <torusGeometry args={[1.62, 0.07, 24, 128]} />
        <meshStandardMaterial
          color="#38bdf8"
          metalness={0.9}
          roughness={0.3}
          emissive="#0ea5e9"
          emissiveIntensity={1.6}
        />
      </mesh>
      {/* "C" cromada en relieve */}
      <Text
        fontSize={1.9}
        characters="C"
        material={textMaterial}
        position={[0, 0.02, 0.3]}
      >
        C
      </Text>
    </group>
  );
}

function Emblem() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  return (
    <group ref={group}>
      <MetalC />
      {/* Esferas metálicas orbitando */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 2.9, Math.sin(angle) * 0.6, Math.sin(angle) * 0.8]}
          >
            <sphereGeometry args={[0.16, 32, 32]} />
            <meshStandardMaterial
              color="#9fb4d8"
              metalness={1}
              roughness={0.15}
              envMapIntensity={1.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[6, 6, 6]} intensity={2.2} color="#7dd3fc" />
        <directionalLight position={[-6, -3, 4]} intensity={1.2} color="#1d4ed8" />
        <pointLight position={[0, 3, 4]} intensity={6} color="#3b82f6" />

        <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
          <Emblem />
        </Float>

        <Sparkles
          count={90}
          scale={[11, 6, 6]}
          size={2.2}
          speed={0.35}
          color="#93c5fd"
          opacity={0.55}
        />

        <Environment resolution={64}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="rect" intensity={6} position={[0, 5, -9]} scale={[10, 10, 1]} color="#e8ecf1" />
            <Lightformer form="rect" intensity={4} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} color="#3b82f6" />
            <Lightformer form="rect" intensity={3} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} color="#38bdf8" />
            <Lightformer form="ring" intensity={4} position={[0, 2, 9]} scale={4} color="#cbd5e1" />
          </group>
        </Environment>
      </Suspense>
    </Canvas>
  );
}
