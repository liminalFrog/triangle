import React from 'react';
import { useRef } from 'react';
import * as THREE from 'three';
import Wall from './Wall';

// Constants for architectural measurements
// Using standard architectural dimensions in feet
const INCH = 1/12; // 1 inch in feet
const WALL_THICKNESS = 6 * INCH; // 6 inches
const BUILDING_WIDTH = 20; // 20 feet wide (along X axis)
const BUILDING_LENGTH = 40; // 40 feet long (along Z axis)
const EAVE_HEIGHT = 14; // 14 feet eave height
const ROOF_SLOPE = 4/12; // 4:12 pitch
const DOOR_WIDTH = 3; // 3 feet
const DOOR_HEIGHT = 7; // 7 feet

function Building({ position = [0, 0, 0] }) {
  const groupRef = useRef();
  
  // Calculate roof peak height based on building width and slope
  const roofRise = (BUILDING_WIDTH / 2) * ROOF_SLOPE;
  const peakHeight = EAVE_HEIGHT + roofRise;

  return (
    <group ref={groupRef} position={position}>      {/* Slab/Foundation */}
      <mesh 
        position={[0, INCH * 6, 0]} 
        receiveShadow
      >
        <boxGeometry args={[BUILDING_WIDTH + WALL_THICKNESS, INCH * 12, BUILDING_LENGTH + WALL_THICKNESS]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
        {/* Gabled Roof */}
      <mesh 
        position={[0, EAVE_HEIGHT, 0]} 
        rotation={[0, Math.PI/2, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry 
          args={[
            new THREE.Shape()
              .moveTo(-BUILDING_LENGTH/2, 0)
              .lineTo(BUILDING_LENGTH/2, 0)
              .lineTo(BUILDING_LENGTH/2, roofRise)
              .lineTo(0, 2 * roofRise)  // Peak at center, twice the rise height
              .lineTo(-BUILDING_LENGTH/2, roofRise)
              .lineTo(-BUILDING_LENGTH/2, 0),
            {
              depth: BUILDING_WIDTH,
              bevelEnabled: false
            }
          ]}
        >
          <meshStandardMaterial color="#8b4513" side={THREE.DoubleSide} />
        </extrudeGeometry>
      </mesh>      {/* North Wall (back) */}
      <Wall 
        width={BUILDING_WIDTH} 
        height={EAVE_HEIGHT}
        thickness={WALL_THICKNESS}
        position={[0, EAVE_HEIGHT/2, -BUILDING_LENGTH/2]}
        wallType="exterior"
      />
      
      {/* South Wall (front) with door */}
      <Wall 
        width={BUILDING_WIDTH} 
        height={EAVE_HEIGHT}
        thickness={WALL_THICKNESS}
        position={[0, EAVE_HEIGHT/2, BUILDING_LENGTH/2]}
        rotation={[0, Math.PI, 0]}
        hasDoor={true}
        doorWidth={DOOR_WIDTH}
        doorHeight={DOOR_HEIGHT}
        doorPosition={[-BUILDING_WIDTH/4, 0, 0]} // Positioned off-center
        wallType="exterior"
      />
      
      {/* East Wall */}
      <Wall 
        width={BUILDING_LENGTH} 
        height={EAVE_HEIGHT}
        thickness={WALL_THICKNESS}
        position={[BUILDING_WIDTH/2, EAVE_HEIGHT/2, 0]}
        rotation={[0, Math.PI/2, 0]}
        wallType="exterior"
      />
      
      {/* West Wall */}
      <Wall 
        width={BUILDING_LENGTH} 
        height={EAVE_HEIGHT}
        thickness={WALL_THICKNESS}
        position={[-BUILDING_WIDTH/2, EAVE_HEIGHT/2, 0]}
        rotation={[0, -Math.PI/2, 0]}
        wallType="exterior"
      />
      
      {/* Interior wall - partition */}
      <Wall 
        width={BUILDING_WIDTH} 
        height={EAVE_HEIGHT}
        thickness={WALL_THICKNESS/2}
        position={[0, EAVE_HEIGHT/2, -BUILDING_LENGTH/4]}
        hasDoor={true}
        doorWidth={DOOR_WIDTH}
        doorHeight={DOOR_HEIGHT}
        doorPosition={[BUILDING_WIDTH/4, 0, 0]}
        wallType="interior"
      />
    </group>  );
}

export default Building;