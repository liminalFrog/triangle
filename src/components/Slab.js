import React, { useRef, useEffect } from 'react';
import { ELEMENT_CATEGORIES, ELEMENT_TYPES, DEFAULT_OBJECT_COLORS } from './constants';

function Slab({ 
  width = 20, 
  length = 40, 
  thickness = 0.5,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  slabType = "concrete"
}) {
  const slabRef = useRef();
  const meshRef = useRef();
    // Set up userData for selection and info display
  useEffect(() => {
    if (meshRef.current) {
      // Store slab properties in userData for selection and info display
      meshRef.current.userData = {
        isSelectable: true,
        elementCategory: ELEMENT_CATEGORIES.STRUCTURAL,
        elementType: ELEMENT_TYPES.SLAB,
        elementSubtype: slabType,
        properties: {
          width,
          length,
          thickness,
          position: [...position],
          rotation: [...rotation],
          slabType
        },
        // Store original emissive color for hover/selection effects
        originalEmissive: 0x000000
      };
    }
  }, [width, length, thickness, position, rotation, slabType]);
  // Create the slab mesh
  return (
    <group 
      ref={slabRef} 
      position={position} 
      rotation={rotation}
    >
      <mesh 
        ref={meshRef}
        position={[0, thickness/2, 0]} 
        receiveShadow
      >
        <boxGeometry args={[width, thickness, length]} />
        <meshStandardMaterial color={`#${DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.SLAB].toString(16)}`} />
      </mesh>
    </group>
  );
}

export default Slab;