import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  OrthographicCamera,
  Grid, 
  Environment,
  CameraControls
} from '@react-three/drei';
import * as THREE from 'three';
import './Scene3D.css';
import Building from './Building';
import ContextMenu from './ContextMenu';

// Camera view types
const VIEW_TYPE = {
  PERSPECTIVE: 'perspective',
  FRONT: 'front', // South
  BACK: 'back',  // North
  LEFT: 'left',  // West
  RIGHT: 'right', // East
  TOP: 'top',
  BOTTOM: 'bottom'
};

// Helper function to determine view type from camera direction
const determineViewType = (direction) => {
  const absX = Math.abs(direction.x);
  const absY = Math.abs(direction.y);
  const absZ = Math.abs(direction.z);
  
  if (absY > absX && absY > absZ) {
    // Mainly looking up/down
    if (direction.y > 0) {
      return VIEW_TYPE.BOTTOM;
    } else {
      return VIEW_TYPE.TOP;
    }
  } else if (absX > absZ) {
    // Mainly looking east/west
    if (direction.x > 0) {
      return VIEW_TYPE.LEFT;
    } else {
      return VIEW_TYPE.RIGHT;
    }
  } else {
    // Mainly looking north/south
    if (direction.z > 0) {
      return VIEW_TYPE.BACK;
    } else {
      return VIEW_TYPE.FRONT;
    }
  }
};

function Scene3D({ projectData, updateProjectData, updateViewType }) {
  const cameraControlsRef = useRef();
  const canvasContainerRef = useRef();
  const [cameraPosition] = useState([-5, 5, 5]);
  const [isPerspective, setIsPerspective] = useState(true);
  const [currentViewType, setCurrentViewType] = useState(VIEW_TYPE.PERSPECTIVE);
  const [lastSideView, setLastSideView] = useState(VIEW_TYPE.RIGHT); // Default to east side
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 },
  });

  // Update status bar when view type changes
  useEffect(() => {
    if (updateViewType) {
      updateViewType(isPerspective ? 'Perspective' : currentViewType.charAt(0).toUpperCase() + currentViewType.slice(1));
    }
  }, [isPerspective, currentViewType, updateViewType]);
  // Function to handle numpad camera movements
  const handleNumpadKey = useCallback((key) => {
    if (!cameraControlsRef.current) return;
    
    const controls = cameraControlsRef.current;
    const degToRad = THREE.MathUtils.degToRad;
    
    switch (key) {      case '1': // Front view (South)
        controls.reset();
        controls.setLookAt(0, 1, 10, 0, 1, 0, true); // Look at center from south
        setIsPerspective(false); // Always switch to orthographic mode
        setCurrentViewType(VIEW_TYPE.FRONT);
        // Force immediate update to ensure the view changes properly
        controls.update(0);
        break;
          case '3': // Side view (East/West toggle)
        controls.reset();
        if (currentViewType === VIEW_TYPE.LEFT && !isPerspective) {
          // If currently in west view, switch to east
          controls.setLookAt(10, 1, 0, 0, 1, 0, true);
          setLastSideView(VIEW_TYPE.RIGHT);
          setCurrentViewType(VIEW_TYPE.RIGHT);
        } else if (currentViewType === VIEW_TYPE.RIGHT && !isPerspective) {
          // If currently in east view, switch to west
          controls.setLookAt(-10, 1, 0, 0, 1, 0, true);
          setLastSideView(VIEW_TYPE.LEFT);
          setCurrentViewType(VIEW_TYPE.LEFT);
        } else {
          // Not in a side view or in perspective mode, go to the last side view or default (east)
          if (lastSideView === VIEW_TYPE.LEFT) {
            controls.setLookAt(-10, 1, 0, 0, 1, 0, true);
            setCurrentViewType(VIEW_TYPE.LEFT);
          } else {
            controls.setLookAt(10, 1, 0, 0, 1, 0, true);
            setCurrentViewType(VIEW_TYPE.RIGHT);
          }
        }
        setIsPerspective(false); // Always switch to orthographic mode
        // Force immediate update to ensure the view changes properly
        controls.update(0);
        break;
          case '7': // Top view
        controls.reset();
        controls.setLookAt(0, 10, 0, 0, 0, 0, true); // Look at center from above
        setIsPerspective(false); // Always switch to orthographic mode
        setCurrentViewType(VIEW_TYPE.TOP);
        // Force immediate update to ensure the view changes properly
        controls.update(0);
        break;case '5': // Toggle perspective/orthographic
        // Store the current camera position and target
        const position = new THREE.Vector3();
        const target = new THREE.Vector3();
        controls.getPosition(position);
        controls.getTarget(target);
        
        // Calculate the direction vector and distance for consistent view
        const direction = new THREE.Vector3().subVectors(target, position).normalize();
        const distance = position.distanceTo(target);
        
        // Toggle the perspective mode
        const newIsPerspective = !isPerspective;
        setIsPerspective(newIsPerspective);
        
        if (!newIsPerspective) {
          // Switching to orthographic mode
          const viewType = determineViewType(direction);
          setCurrentViewType(viewType);
          
          // Update side view tracking if needed
          if (viewType === VIEW_TYPE.LEFT || viewType === VIEW_TYPE.RIGHT) {
            setLastSideView(viewType);
          }
        } else {
          // Switching to perspective mode
          setCurrentViewType(VIEW_TYPE.PERSPECTIVE);
        }
        
        // Apply the same view direction and distance after a short delay
        // This ensures the camera maintains its position after the mode switch
        setTimeout(() => {
          // Set camera to the same position and target to maintain the view angle
          controls.setLookAt(
            target.x - direction.x * distance,
            target.y - direction.y * distance,
            target.z - direction.z * distance,
            target.x, target.y, target.z,
            true
          );
        }, 10);
        break;
        
      case '4': // Rotate 15 degrees left (counter-clockwise)
        controls.rotate(degToRad(-15), 0, true);
        break;
        
      case '6': // Rotate 15 degrees right (clockwise)
        controls.rotate(degToRad(15), 0, true);
        break;
          case '8': // Rotate 15 degrees forward (look down)
        controls.rotate(0, degToRad(-15), true);
        break;
        
      case '2': // Rotate 15 degrees backward (look up)
        controls.rotate(0, degToRad(15), true);
        break;
      
      case '9': // Reserved for future use
        // Functionality removed as requested
        break;
        
      default:
        break;
    }
  }, [cameraControlsRef, isPerspective, currentViewType, lastSideView]);  // Handle key press for Shift+A and Numpad keys
  const handleKeyDown = useCallback((event) => {
    // Handle Shift+A for context menu
    if (event.key === 'A' && event.shiftKey) {
      event.preventDefault();
      
      if (canvasContainerRef.current) {
        // Get the canvas container's bounding rectangle
        const rect = canvasContainerRef.current.getBoundingClientRect();
        
        // Get the current mouse position from the event
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // Ensure the mouse is over the canvas
        if (
          mouseX >= rect.left && 
          mouseX <= rect.right &&
          mouseY >= rect.top && 
          mouseY <= rect.bottom
        ) {
          // Show context menu exactly at mouse position
          setContextMenu({
            visible: true,
            position: { 
              x: mouseX, 
              y: mouseY 
            },
          });
        }
      }
      return;
    }
      // Handle numpad keys for camera control
    // Check for numpad keys or numlock-off number keys with specific codes
    const numpadKeys = {
      'Numpad0': '0',
      'Numpad1': '1',
      'Numpad2': '2',
      'Numpad3': '3',
      'Numpad4': '4',
      'Numpad5': '5',
      'Numpad6': '6',
      'Numpad7': '7',
      'Numpad8': '8',
      'Numpad9': '9',
    };
    
    // Handle numpad keys specifically
    if (event.code in numpadKeys) {
      event.preventDefault();
      const key = numpadKeys[event.code];
      handleNumpadKey(key);
    }
    // Handle number keys if they're from the numpad (KeyboardEvent.location === 3 means numpad)
    else if (event.location === 3 && event.key >= '0' && event.key <= '9') {
      event.preventDefault();
      handleNumpadKey(event.key);
    }
  }, [handleNumpadKey]);

  // Handle click inside canvas to capture mouse position
  const handleCanvasClick = useCallback((event) => {
    // Store the click position, will be used when user presses Shift+A
    // We're not showing the context menu on click, only on Shift+A
    if (canvasContainerRef.current && canvasContainerRef.current.contains(event.target)) {
      // This is just to ensure the canvas is in focus for keyboard events
    }
  }, []);

  // Handle mouse movement to track cursor position on canvas
  const handleMouseMove = useCallback((event) => {
    if (canvasContainerRef.current && canvasContainerRef.current.contains(event.target)) {
      // Store the mouse position for use with Shift+A context menu
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
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleKeyDown, handleCanvasClick, handleMouseMove]);

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
        
        {/* Camera and Controls */}        {isPerspective ? (
          <PerspectiveCamera 
            makeDefault 
            position={cameraPosition} 
            fov={35}
            near={0.1}
            far={1000}
          />
        ) : (
          <OrthographicCamera 
            makeDefault 
            position={cameraPosition} 
            zoom={50} 
            near={0.1}
            far={1000}
          />
        )}
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
        />      )}      {/* Keyboard Hints */}      <div className="keyboard-hint">
        Press <kbd>Shift</kbd>+<kbd>A</kbd> to add objects | Numpad: <kbd>1</kbd>Front <kbd>3</kbd>Side <kbd>7</kbd>Top <kbd>5</kbd>Toggle <kbd>2</kbd><kbd>4</kbd><kbd>6</kbd><kbd>8</kbd>Rotate
      </div>
    </div>
  );
}

export default Scene3D;