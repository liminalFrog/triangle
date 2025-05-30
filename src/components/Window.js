import React, { useRef, useEffect } from 'react';
import { ELEMENT_CATEGORIES, ELEMENT_TYPES, DEFAULT_MATERIALS } from './constants';

function Window({ 
  width = 3, 
  height = 4,
  thickness = 0.1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  windowType = "standard"
}) {
  const windowRef = useRef();
  const meshRef = useRef();
  
  // Set up userData for selection and info display
  useEffect(() => {
    if (meshRef.current) {
      // Store window properties in userData for selection and info display
      meshRef.current.userData = {
        isSelectable: true,
        elementCategory: ELEMENT_CATEGORIES.OPENING,
        elementType: ELEMENT_TYPES.WINDOW,
        elementSubtype: windowType,
        properties: {
          width,
          height,
          thickness,
          position: [...position],
          rotation: [...rotation],
          windowType
        },
        // Store original emissive color for hover/selection effects
        originalEmissive: 0x000000
      };
    }
  }, [width, height, thickness, position, rotation, windowType]);

  // Create the window mesh
  return (
    <group 
      ref={windowRef} 
      position={position} 
      rotation={rotation}
    >      <mesh 
        ref={meshRef}
        position={[0, 0, 0]} 
        castShadow
        material={DEFAULT_MATERIALS[ELEMENT_TYPES.WINDOW].clone()}
      >
        <boxGeometry args={[width, height, thickness]} />
      </mesh>
    </group>
  );
}

export default Window;