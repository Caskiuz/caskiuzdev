"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Robot 3D del chat: cabeza metálica con ojos que parpadean y antena con luz.
 * Escena mínima (sin environment) para que pese poco; se carga en diferido.
 */

function RobotHead() {
  const group = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const antennaTip = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.6) * 0.35;
      group.current.position.y = Math.sin(t * 1.4) * 0.06;
    }
    // Parpadeo cada ~3.2s
    const blink = t % 3.2 < 0.12 ? 0.12 : 1;
    for (const eye of [eyeL.current, eyeR.current]) {
      if (eye) eye.scale.y = blink;
    }
    if (antennaTip.current) {
      const pulse = 0.85 + Math.sin(t * 3) * 0.35;
      (antennaTip.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={group} position={[0, -0.05, 0]}>
      {/* Cabeza */}
      <mesh>
        <sphereGeometry args={[0.78, 48, 48]} />
        <meshStandardMaterial color="#dfe7f2" metalness={1} roughness={0.22} envMapIntensity={1.1} />
      </mesh>
      {/* Visor oscuro */}
      <mesh position={[0, 0.08, 0.5]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.86, 0.42, 0.42]} />
        <meshStandardMaterial color="#0b1324" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Ojos */}
      <mesh ref={eyeL} position={[-0.21, 0.09, 0.72]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh ref={eyeR} position={[0.21, 0.09, 0.72]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {/* Antena con luz */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} />
        <meshStandardMaterial color="#9aa7b8" metalness={1} roughness={0.3} />
      </mesh>
      <mesh ref={antennaTip} position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      {/* Cuello */}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.3, 20]} />
        <meshStandardMaterial color="#8fa0b5" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function ChatRobot3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 2.6], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={2.4} color="#e0f2fe" />
        <pointLight position={[-3, -1, 2]} intensity={3} color="#1d4ed8" />
        <RobotHead />
      </Suspense>
    </Canvas>
  );
}
