import React from 'react';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function Building({ position = [0, 0, 0] }) {
  const groupRef = useRef();
  
  // Small rotation animation for demonstration
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Base of the building (cube) */}
      <mesh 
        position={[0, 1, 0]} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#4682b4" />
      </mesh>
      
      {/* Roof of the building (triangular prism) */}
      <mesh 
        position={[0, 2.75, 0]} 
        castShadow
      >
        <coneGeometry args={[1.5, 1.5, 4, 1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  );
}

export default Building;