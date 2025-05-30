import React from 'react';
import { useRef, useEffect } from 'react';
import { ELEMENT_CATEGORIES, ELEMENT_TYPES, DEFAULT_MATERIALS } from './constants';

function Wall({ 
  width = 10, 
  height = 8, 
  thickness = 0.5,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  hasDoor = false,
  doorWidth = 3,
  doorHeight = 7,
  doorPosition = [0, 0, 0],
  hasWindows = false,
  windows = [],
  wallType = "standard"
}) {
  const wallRef = useRef();
  const meshRef = useRef();
  
  // Adjust width to account for wall thickness at corners
  // This ensures walls connect properly at corners
  const adjustedWidth = width + thickness;
    // Set up userData for selection and info display
  useEffect(() => {
    if (meshRef.current) {
      // Store wall properties in userData for selection and info display
      meshRef.current.userData = {
        isSelectable: true,
        elementCategory: ELEMENT_CATEGORIES.STRUCTURAL,
        elementType: ELEMENT_TYPES.WALL,
        elementSubtype: wallType,
        properties: {
          width,
          height,
          thickness,
          position: [...position],
          rotation: [...rotation],
          hasDoor,
          hasWindows,
          doorWidth: hasDoor ? doorWidth : null,
          doorHeight: hasDoor ? doorHeight : null,
          doorPosition: hasDoor ? [...doorPosition] : null,
          windows: hasWindows ? windows : []
        }
      };
    }
  }, [width, height, thickness, position, rotation, wallType, hasDoor, doorWidth, doorHeight, doorPosition, hasWindows, windows]);
    // Door cutout if needed
  if (hasDoor) {
    // Create door cutout shape (3D CSG operations would be better, but for now we'll use a different approach)
    return (
      <group position={position} rotation={rotation} ref={wallRef}>        {/* Main wall */}
        <mesh castShadow receiveShadow ref={meshRef}>
          <boxGeometry args={[adjustedWidth, height, thickness]} />
          <primitive object={DEFAULT_MATERIALS[ELEMENT_TYPES.WALL].clone()} />
        </mesh>
        
        {/* Door representation - green box to indicate door location */}
        <mesh 
          position={[
            doorPosition[0], 
            doorPosition[1] - (height - doorHeight) / 2, 
            doorPosition[2] - thickness / 2 - 0.01
          ]}
        >
          <boxGeometry args={[doorWidth, doorHeight, thickness * 0.1]} />
          <primitive object={DEFAULT_MATERIALS[ELEMENT_TYPES.DOOR].clone()} attach="material" />
        </mesh></group>
    );
  }
    // Standard wall without openings
  return (
    <group position={position} rotation={rotation} ref={wallRef}>
      <mesh castShadow receiveShadow ref={meshRef}>
        <boxGeometry args={[adjustedWidth, height, thickness]} />
        <primitive object={DEFAULT_MATERIALS[ELEMENT_TYPES.WALL].clone()} />
      </mesh>
    </group>
  );
}

export default Wall;