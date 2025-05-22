import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  Grid, 
  Environment,
  CameraControls
} from '@react-three/drei';
import './Scene3D.css';
import Building from './Building';
import ContextMenu from './ContextMenu';

function Scene3D({ projectData, updateProjectData }) {
  const cameraControlsRef = useRef();
  const canvasContainerRef = useRef();
  const [cameraPosition] = useState([-5, 5, 5]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 },
  });

  // Handle key press for Shift+A
  const handleKeyDown = useCallback((event) => {
    // Only process Shift+A
    if (event.key === 'A' && event.shiftKey) {
      event.preventDefault();
      
      // Show context menu at current mouse position
      setContextMenu({
        visible: true,
        position: { x: event.clientX, y: event.clientY },
      });
    }
  }, []);

  // Handle click inside canvas to capture mouse position
  const handleCanvasClick = useCallback((event) => {
    // Store the click position, will be used when user presses Shift+A
    // We're not showing the context menu on click, only on Shift+A
    if (canvasContainerRef.current && canvasContainerRef.current.contains(event.target)) {
      // This is just to ensure the canvas is in focus for keyboard events
    }
  }, []);

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu]);

  // Handle context menu item selection
  const handleAddObject = useCallback((objectType) => {
    console.log(`Adding ${objectType} from context menu`);
    // Here you would add the object to the scene
    // For now, just log the action
  }, []);

  // Setup key event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleCanvasClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleCanvasClick);
    };
  }, [handleKeyDown, handleCanvasClick]);

  // Context menu items
  const menuItems = [
    {
      id: 'building',
      label: 'Building',
      category: 'Structure',
      icon: '/icons/building.png',
      action: () => handleAddObject('Building'),
    },
    {
      id: 'wall',
      label: 'Wall',
      category: 'Structure',
      icon: '/icons/wall.png',
      action: () => handleAddObject('Wall'),
    },
    {
      id: 'slab',
      label: 'Slab',
      category: 'Structure',
      icon: '/icons/building.png',
      action: () => handleAddObject('Slab'),
    },
    {
      id: 'door',
      label: 'Walk Door',
      category: 'Openings',
      icon: '/icons/door.png',
      action: () => handleAddObject('Door'),
    },
    {
      id: 'window',
      label: 'Window',
      category: 'Openings',
      icon: '/icons/window.png',
      action: () => handleAddObject('Window'),
    },
    {
      id: 'rollup',
      label: 'Roll-up Door',
      category: 'Openings',
      icon: '/icons/rollup.png',
      action: () => handleAddObject('RollupDoor'),
    },
    {
      id: 'track',
      label: 'Track Door',
      category: 'Openings',
      icon: '/icons/track.png',
      action: () => handleAddObject('TrackDoor'),
    },
    {
      id: 'awning',
      label: 'Awning',
      category: 'Accessories',
      icon: '/icons/awning.png',
      action: () => handleAddObject('Awning'),
    },
    {
      id: 'fan',
      label: 'Fan',
      category: 'Accessories',
      icon: '/icons/fan.png',
      action: () => handleAddObject('Fan'),
    },
    {
      id: 'opening',
      label: 'Opening',
      category: 'Accessories',
      icon: '/icons/opening.png',
      action: () => handleAddObject('Opening'),
    },
  ];

  return (
    <div className="scene-container" ref={canvasContainerRef}>
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

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu 
          position={contextMenu.position} 
          onClose={handleCloseContextMenu}
          items={menuItems}
        />
      )}
      
      {/* Shift+A Hint */}
      <div className="keyboard-hint">
        Press <kbd>Shift</kbd>+<kbd>A</kbd> to add objects
      </div>
    </div>
  );
}

export default Scene3D;