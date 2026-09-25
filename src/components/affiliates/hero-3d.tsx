"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Lightformer, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * Emblema metálico 3D de la red de afiliados:
 * - Anillo cromado giratorio con la "C" de Caskiuz en metal pulido
 * - Doble hélice de ADN en bandas digitales transparentes que se entrelazan
 *   atravesando el centro del anillo (una banda cromada + una banda de luz azul)
 * - Pares de bases (rungs) y nodos de datos recorriendo las hebras
 * - Partículas y luces azules
 * Escena ligera (sin HDR externo): el environment se genera con Lightformers.
 */

const STRAND_RADIUS = 1.05;
const HELIX_HEIGHT = 3.8;
const HELIX_TURNS = 2.3;
const CURVE_SAMPLES = 96;

function buildHelixCurve(strand: 0 | 1): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const t = i / CURVE_SAMPLES;
    const angle = t * Math.PI * 2 * HELIX_TURNS + (strand === 1 ? Math.PI : 0);
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * STRAND_RADIUS,
        (t - 0.5) * HELIX_HEIGHT,
        Math.sin(angle) * STRAND_RADIUS
      )
    );
  }
  return new THREE.CatmullRomCurve3(points);
}

function DnaHelix() {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);

  const curveA = useMemo(() => buildHelixCurve(0), []);
  const curveB = useMemo(() => buildHelixCurve(1), []);

  const tubeA = useMemo(() => new THREE.TubeGeometry(curveA, 200, 0.07, 8, false), [curveA]);
  const tubeB = useMemo(() => new THREE.TubeGeometry(curveB, 200, 0.07, 8, false), [curveB]);

  // Pares de bases: barras finas que conectan las dos hebras
  const rungs = useMemo(() => {
    const list: { position: THREE.Vector3; quaternion: THREE.Quaternion; length: number }[] = [];
    const count = 11;
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const a = curveA.getPointAt(t);
      const b = curveB.getPointAt(t);
      const dir = b.clone().sub(a);
      const length = dir.length();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      list.push({
        position: a.clone().add(b).multiplyScalar(0.5),
        quaternion,
        length,
      });
    }
    return list;
  }, [curveA, curveB]);

  // Nodos de datos que recorren las hebras (efecto digital)
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    // La hélice gira en sentido contrario al anillo: efecto de entrelazado
    if (group.current) group.current.rotation.y -= 0.0016;

    nodeRefs.current.forEach((node, idx) => {
      if (!node) return;
      const strand = idx % 2 === 0 ? curveA : curveB;
      const offset = Math.floor(idx / 2) * 0.3;
      const t = ((time * 0.16 + offset) % 1 + 1) % 1;
      node.position.copy(strand.getPointAt(t));
    });
  });

  return (
    <group ref={group}>
      {/* Banda cromada (transparente, metal pulido) */}
      <mesh geometry={tubeA}>
        <meshPhysicalMaterial
          color="#eef3fa"
          metalness={0.95}
          roughness={0.12}
          transparent
          opacity={0.55}
          envMapIntensity={1.8}
          clearcoat={1}
          clearcoatRoughness={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Banda digital azul (transparente, luminosa) */}
      <mesh geometry={tubeB}>
        <meshStandardMaterial
          color="#7dd3fc"
          metalness={0.45}
          roughness={0.22}
          transparent
          opacity={0.5}
          emissive="#0ea5e9"
          emissiveIntensity={1.3}
          depthWrite={false}
        />
      </mesh>

      {/* Pares de bases */}
      {rungs.map((rung, i) => (
        <mesh key={i} position={rung.position} quaternion={rung.quaternion}>
          <cylinderGeometry args={[0.018, 0.018, rung.length, 6]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Nodos de datos viajando por las hebras */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[i % 2 === 0 ? 0.075 : 0.06, 16, 16]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#e0f2fe" : "#38bdf8"}
            emissive={i % 2 === 0 ? "#7dd3fc" : "#0ea5e9"}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function MetalC() {
  // Material cromado para el texto 3D
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
      {/* "C" cromada en relieve, por delante de la hélice */}
      <Text
        fontSize={1.75}
        characters="C"
        material={textMaterial}
        position={[0, 0.02, 0.62]}
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
      <DnaHelix />
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
