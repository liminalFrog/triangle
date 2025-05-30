import React, { useRef, useEffect } from 'react';
import { ELEMENT_CATEGORIES, ELEMENT_TYPES, DEFAULT_MATERIALS } from './constants';

function Door({ 
  width = 3, 
  height = 7,
  thickness = 0.1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  doorType = "standard"
}) {
  const doorRef = useRef();
  const meshRef = useRef();
  
  // Set up userData for selection and info display
  useEffect(() => {
    if (meshRef.current) {
      // Store door properties in userData for selection and info display
      meshRef.current.userData = {
        isSelectable: true,
        elementCategory: ELEMENT_CATEGORIES.OPENING,
        elementType: ELEMENT_TYPES.DOOR,
        elementSubtype: doorType,
        properties: {
          width,
          height,
          thickness,
          position: [...position],
          rotation: [...rotation],
          doorType
        },
        // Store original emissive color for hover/selection effects
        originalEmissive: 0x000000
      };
    }
  }, [width, height, thickness, position, rotation, doorType]);

  // Create the door mesh
  return (
    <group 
      ref={doorRef} 
      position={position} 
      rotation={rotation}
    >      <mesh 
        ref={meshRef}
        position={[0, 0, 0]} 
        castShadow
        material={DEFAULT_MATERIALS[ELEMENT_TYPES.DOOR].clone()}
      >
        <boxGeometry args={[width, height, thickness]} />
      </mesh>
    </group>
  );
}

export default Door;