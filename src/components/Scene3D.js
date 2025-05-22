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

// Helper function to determine view type based on camera direction
const determineViewType = (direction) => {
  const tolerance = 0.9; // Threshold for determining primary axis alignment
  
  if (Math.abs(direction.y) > tolerance) {
    return direction.y > 0 ? VIEW_TYPE.BOTTOM : VIEW_TYPE.TOP;
  }
  
  if (Math.abs(direction.z) > tolerance) {
    return direction.z > 0 ? VIEW_TYPE.BACK : VIEW_TYPE.FRONT;
  }
  
  if (Math.abs(direction.x) > tolerance) {
    return direction.x > 0 ? VIEW_TYPE.LEFT : VIEW_TYPE.RIGHT;
  }
  
  return VIEW_TYPE.PERSPECTIVE;
};

function Scene3D({ projectData, updateProjectData, updateViewType }) {
  const cameraControlsRef = useRef();
  const canvasContainerRef = useRef();
  const lastCameraStateRef = useRef({
    position: new THREE.Vector3(-5, 5, 5),
    target: new THREE.Vector3(0, 0, 0),
    isPerspective: true,
    viewType: VIEW_TYPE.PERSPECTIVE
  });
  
  // State variables
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

  // Store camera state with target
  const saveCameraState = useCallback((overrides = {}) => {
    if (!cameraControlsRef.current) return;
    
    const position = new THREE.Vector3();
    const target = new THREE.Vector3();
    cameraControlsRef.current.getPosition(position);
    cameraControlsRef.current.getTarget(target);
    
    lastCameraStateRef.current = {
      position: position.clone(),
      target: target.clone(),
      isPerspective: overrides.isPerspective ?? isPerspective,
      viewType: overrides.viewType ?? currentViewType
    };
  }, [isPerspective, currentViewType]);

  // Function to restore camera state with smooth transition
  const restoreCameraState = useCallback((newIsPerspective = null, immediate = false) => {
    if (!cameraControlsRef.current) return;
    
    const state = lastCameraStateRef.current;

    const usePerspective = newIsPerspective !== null ? newIsPerspective : state.isPerspective;
    
    cameraControlsRef.current.setLookAt(
      state.position.x, state.position.y, state.position.z,
      state.target.x, state.target.y, state.target.z,
      !immediate // Enable transition unless immediate is true
    );
    
    if (usePerspective !== isPerspective) {
      setIsPerspective(usePerspective);
    }
    
    if (state.viewType !== currentViewType) {
      setCurrentViewType(state.viewType);
    }

    cameraControlsRef.current.update(0);
  }, [isPerspective, currentViewType]);

  // Set up controls change handler with state updates
  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (controls) {
      const handleControlsChange = () => {
        if (!controls) return;

        // Get current camera direction
        const position = new THREE.Vector3();
        const target = new THREE.Vector3();
        controls.getPosition(position);
        controls.getTarget(target);
        const direction = new THREE.Vector3().subVectors(target, position).normalize();
        
        // Update view type based on current direction
        const newViewType = determineViewType(direction);
        if (newViewType !== currentViewType) {
          setCurrentViewType(newViewType);
          // Update side view tracking if needed
          if (newViewType === VIEW_TYPE.LEFT || newViewType === VIEW_TYPE.RIGHT) {
            setLastSideView(newViewType);
          }
        }
        
        // Save the new state
        saveCameraState({ viewType: newViewType });
      };
      
      controls.addEventListener('control', handleControlsChange);
      controls.addEventListener('controlstart', handleControlsChange);
      
      return () => {
        controls.removeEventListener('control', handleControlsChange);
        controls.removeEventListener('controlstart', handleControlsChange);
      };
    }
  }, [saveCameraState, currentViewType]);

  // Function to handle numpad camera movements with improved state management
  const handleNumpadKey = useCallback((key) => {
    if (!cameraControlsRef.current) return;
    
    const controls = cameraControlsRef.current;
    const degToRad = THREE.MathUtils.degToRad;
    
    switch (key) {
      case '1': // Front/Back view toggle (South/North)
        if (currentViewType === VIEW_TYPE.FRONT && !isPerspective) {
          // Switch from front to back
          lastCameraStateRef.current = {
            position: new THREE.Vector3(0, 1, -10),
            target: new THREE.Vector3(0, 1, 0),
            isPerspective: false,
            viewType: VIEW_TYPE.BACK
          };
        } else if (currentViewType === VIEW_TYPE.BACK && !isPerspective) {
          // Switch from back to front
          lastCameraStateRef.current = {
            position: new THREE.Vector3(0, 1, 10),
            target: new THREE.Vector3(0, 1, 0),
            isPerspective: false,
            viewType: VIEW_TYPE.FRONT
          };
        } else {
          // Coming from perspective or another view - go to front view
          lastCameraStateRef.current = {
            position: isPerspective ? new THREE.Vector3(0, 2, 15) : new THREE.Vector3(0, 1, 10),
            target: new THREE.Vector3(0, 1, 0),
            isPerspective: isPerspective,
            viewType: VIEW_TYPE.FRONT
          };
        }
        restoreCameraState(isPerspective, false);
        break;

      case '3': // Side view toggle (East/West)
        if (currentViewType === VIEW_TYPE.LEFT && !isPerspective) {
          // Switch from west to east
          lastCameraStateRef.current = {
            position: new THREE.Vector3(10, 1, 0),
            target: new THREE.Vector3(0, 1, 0),
            isPerspective: false,
            viewType: VIEW_TYPE.RIGHT
          };
          setLastSideView(VIEW_TYPE.RIGHT);
        } else if (currentViewType === VIEW_TYPE.RIGHT && !isPerspective) {
          // Switch from east to west
          lastCameraStateRef.current = {
            position: new THREE.Vector3(-10, 1, 0),
            target: new THREE.Vector3(0, 1, 0),
            isPerspective: false,
            viewType: VIEW_TYPE.LEFT
          };
          setLastSideView(VIEW_TYPE.LEFT);
        } else {
          // Coming from perspective or another view
          const position = isPerspective ? new THREE.Vector3(15, 2, 0) : new THREE.Vector3(10, 1, 0);
          if (lastSideView === VIEW_TYPE.LEFT) {
            lastCameraStateRef.current = {
              position: position.multiplyScalar(-1), // Flip for left side
              target: new THREE.Vector3(0, 1, 0),
              isPerspective: isPerspective,
              viewType: VIEW_TYPE.LEFT
            };
          } else {
            lastCameraStateRef.current = {
              position: position,
              target: new THREE.Vector3(0, 1, 0),
              isPerspective: isPerspective,
              viewType: VIEW_TYPE.RIGHT
            };
          }
        }
        restoreCameraState(isPerspective, false);
        break;

      case '7': // Top view
        lastCameraStateRef.current = {
          position: isPerspective ? new THREE.Vector3(0, 15, 0) : new THREE.Vector3(0, 10, 0),
          target: new THREE.Vector3(0, 0, 0),
          isPerspective: isPerspective,
          viewType: VIEW_TYPE.TOP
        };
        restoreCameraState(isPerspective, false);
        break;

      case '5': // Toggle perspective/orthographic only, maintain position
        const position = new THREE.Vector3();
        const target = new THREE.Vector3();
        controls.getPosition(position);
        controls.getTarget(target);
        
        const newIsPerspective = !isPerspective;
        const direction = new THREE.Vector3().subVectors(target, position).normalize();
        const viewType = determineViewType(direction);
        
        // Update the camera state before restoring
        lastCameraStateRef.current = {
          position: position.clone(),
          target: target.clone(),
          isPerspective: newIsPerspective,
          viewType: viewType
        };
        
        // Apply the changes through restoreCameraState
        restoreCameraState(newIsPerspective, false);
        
        // Update side view tracking if needed
        if (viewType === VIEW_TYPE.LEFT || viewType === VIEW_TYPE.RIGHT) {
          setLastSideView(viewType);
        }
        break;
        
      case '4': // Rotate left
        controls.rotate(degToRad(-15), 0, true);
        break;
        
      case '6': // Rotate right
        controls.rotate(degToRad(15), 0, true);
        break;
        
      case '8': // Look down
        controls.rotate(0, degToRad(-15), true);
        break;
        
      case '2': // Look up
        controls.rotate(0, degToRad(15), true);
        break;
        
      default:
        break;
    }
    
    controls.update(0);
  }, [currentViewType, isPerspective, lastSideView, restoreCameraState]);

  // Handle numpad keys only (Shift+A is handled by the global event listener)
  const handleKeyDown = useCallback((event) => {
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
    // Handle number keys if they're from the numpad (KeyboardEvent.location === 3)
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

  // Add a global mouse position tracker
  useEffect(() => {
    let lastKnownMouseX = 0;
    let lastKnownMouseY = 0;
    
    const trackMousePosition = (e) => {
      lastKnownMouseX = e.clientX;
      lastKnownMouseY = e.clientY;
    };
    
    // Global tracker for Shift+A menu
    window.addEventListener('mousemove', trackMousePosition);
    
    // Add the Shift+A handler directly to the window
    const handleShiftA = (e) => {
      if (e.key === 'A' && e.shiftKey && canvasContainerRef.current) {
        e.preventDefault();
        
        // Get the canvas container's bounding rectangle
        const rect = canvasContainerRef.current.getBoundingClientRect();
        
        // Check if the mouse is over our canvas
        if (
          lastKnownMouseX >= rect.left && 
          lastKnownMouseX <= rect.right &&
          lastKnownMouseY >= rect.top && 
          lastKnownMouseY <= rect.bottom
        ) {
          setContextMenu({
            visible: true,
            position: { 
              x: lastKnownMouseX, 
              y: lastKnownMouseY 
            },
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleShiftA);
    
    return () => {
      window.removeEventListener('mousemove', trackMousePosition);
      window.removeEventListener('keydown', handleShiftA);
    };
  }, [canvasContainerRef]);

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
        <Environment preset="sunset" />
        <Grid 
          infiniteGrid 
          cellSize={1}
          cellThickness={0.5}
          sectionSize={10}
          sectionThickness={1}
          fadeDistance={300}
          fadeStrength={2}
        />
        
        {/* Camera and Controls */}        
        {isPerspective ? (
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
        />
      )}

      {/* Keyboard Hints */}
      <div className="keyboard-hint">
        Press <kbd>Shift</kbd>+<kbd>A</kbd> to add objects | Numpad: <kbd>1</kbd>Front <kbd>3</kbd>Side <kbd>7</kbd>Top <kbd>5</kbd>Toggle <kbd>2</kbd><kbd>4</kbd><kbd>6</kbd><kbd>8</kbd>Rotate
      </div>
    </div>
  );
}

export default Scene3D;