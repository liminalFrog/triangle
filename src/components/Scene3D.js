import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  Grid, 
  Environment,
  CameraControls
} from '@react-three/drei';
import './Scene3D.css';
import Building from './Building';

function Scene3D({ projectData, updateProjectData }) {
  const cameraControlsRef = useRef();
  const [cameraPosition] = useState([-5, 5, 5]);

  return (
    <div className="scene-container">
      <Canvas shadows className="canvas">
        <color attach="background" args={['#1e1e1e']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />
        
        {/* Environment and helpers */}
        <Environment preset="city" />
        <Grid 
          infiniteGrid 
          cellSize={1}
          cellThickness={0.5}
          sectionSize={3}
          sectionThickness={1}
          fadeDistance={50}
          fadeStrength={1.5}
        />
        
        {/* Camera and Controls */}
        <PerspectiveCamera 
          makeDefault 
          position={cameraPosition} 
        />
        <CameraControls 
          ref={cameraControlsRef} 
          maxPolarAngle={Math.PI / 2}
          minDistance={1}
          maxDistance={100}
          dollySpeed={0.5}
          smoothTime={0.25}
        />
        
        {/* Scene Objects */}
        <Building position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}

export default Scene3D;