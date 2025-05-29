import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
import InfoPanel from './InfoPanel';
import { VIEW_TYPE, SELECTION_COLORS } from './constants';

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
    position: new THREE.Vector3(-15, 15, 30),
    target: new THREE.Vector3(0, 7, 0),
    isPerspective: true,
    viewType: VIEW_TYPE.PERSPECTIVE
  });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const lastKeyPressRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  // State variables
  const [cameraPosition] = useState([-15, 15, 30]);
  const [isPerspective, setIsPerspective] = useState(true);
  const [currentViewType, setCurrentViewType] = useState(VIEW_TYPE.PERSPECTIVE);
  const [lastSideView, setLastSideView] = useState(VIEW_TYPE.RIGHT); // Default to east side
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 },
  });  
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [selectionInfo, setSelectionInfo] = useState(null);
  const [multiSelectionActive, setMultiSelectionActive] = useState(false);
  // Use the setter but not the value directly in this component
  const [, setHoveredObject] = useState(null);

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
  
  // Function to handle element selection
  const handleSelectElement = useCallback((object, addToSelection = false) => {
    if (!object) {
      // Clear selection if no object is provided
      setSelectedObject(null);
      setSelectedObjects([]);
      setSelectionInfo(null);
      setMultiSelectionActive(false);
      return;
    }
    
    // Find the object or its parent that has userData.elementType
    let targetObject = object;
    while (targetObject && !targetObject.userData?.elementType) {
      targetObject = targetObject.parent;
    }
    
    // If we found a valid element
    if (targetObject && targetObject.userData?.elementType) {
      // If we're adding to selection (multi-select mode)
      if (addToSelection || multiSelectionActive) {
        setMultiSelectionActive(true);
        
        // Create a new array with the existing selection plus the new object
        const updatedSelection = [...selectedObjects];
        
        // Check if the object is already selected
        const existingIndex = updatedSelection.findIndex(obj => obj.uuid === targetObject.uuid);
        
        if (existingIndex >= 0) {
          // Object already selected, remove it (toggle selection)
          updatedSelection.splice(existingIndex, 1);
        } else {
          // Add the object to selection
          updatedSelection.push(targetObject);
        }
        
        setSelectedObjects(updatedSelection);
        setSelectedObject(targetObject); // Keep track of the most recently selected object
        
        // Update selection info for the InfoPanel
        if (updatedSelection.length === 0) {
          // If we've deselected everything
          setSelectionInfo(null);
          setMultiSelectionActive(false);
        } else if (updatedSelection.length === 1) {
          // If there's just one object selected
          const obj = updatedSelection[0];
          setSelectionInfo({
            id: obj.uuid,
            category: obj.userData.elementCategory || 'unknown',
            type: obj.userData.elementType || 'unknown',
            subtype: obj.userData.elementSubtype || 'standard',
            properties: obj.userData.properties || {},
            multiSelection: false
          });
        } else {
          // Multiple objects selected
          // Group objects by type/subtype for the info panel
          const elementType = targetObject.userData.elementType;
          const elementSubtype = targetObject.userData.elementSubtype;
          
          setSelectionInfo({
            count: updatedSelection.length,
            category: targetObject.userData.elementCategory || 'unknown',
            type: elementType || 'unknown',
            subtype: elementSubtype || 'standard',
            multiSelection: true,
            // For multiple selections, we don't show individual properties
            // but we can show aggregate information
            objects: updatedSelection.map(obj => ({
              id: obj.uuid,
              type: obj.userData.elementType,
              subtype: obj.userData.elementSubtype
            }))
          });
        }
      } else {
        // Single selection mode
        setSelectedObject(targetObject);
        setSelectedObjects([targetObject]);
        
        // Get element info for display in the InfoPanel
        const elementInfo = {
          id: targetObject.uuid,
          category: targetObject.userData.elementCategory || 'unknown',
          type: targetObject.userData.elementType || 'unknown',
          subtype: targetObject.userData.elementSubtype || 'standard',
          properties: targetObject.userData.properties || {},
          multiSelection: false
        };
        
        setSelectionInfo(elementInfo);
        console.log('Selected:', elementInfo);
      }
    }
  }, [multiSelectionActive, selectedObjects]);
  
  // Function to select all elements of the same type
  const selectSameType = useCallback(() => {
    if (!selectedObject) return;
    
    const targetType = selectedObject.userData.elementType;
    const targetSubtype = selectedObject.userData.elementSubtype;
    
    console.log(`Selecting all elements of type: ${targetType}, subtype: ${targetSubtype}`);
    
    // Find all scene objects using camera and scene directly
    const camera = cameraControlsRef.current?.camera;
    const scene = camera?.parent;
    if (!scene) return;
    
    // Collect all matching elements
    const matchingElements = [];
    scene.traverse((object) => {
      if (object.userData?.isSelectable && 
          object.userData?.elementType === targetType &&
          object.userData?.elementSubtype === targetSubtype) {
        matchingElements.push(object);
      }
    });
    
    console.log(`Found ${matchingElements.length} matching elements`);
    
    // No matching elements found
    if (matchingElements.length === 0) return;
    
    // Set multi-selection state
    setMultiSelectionActive(true);
    setSelectedObjects(matchingElements);
    
    // Update the info panel with information about all selected elements
    setSelectionInfo({
      count: matchingElements.length,
      category: selectedObject.userData.elementCategory || 'unknown',
      type: targetType || 'unknown',
      subtype: targetSubtype || 'standard',
      multiSelection: true,
      objects: matchingElements.map(obj => ({
        id: obj.uuid,
        type: obj.userData.elementType,
        subtype: obj.userData.elementSubtype
      }))
    });
    
    console.log(`Selected ${matchingElements.length} elements of type ${targetType}`);
  }, [selectedObject]);
  
  // Handle mouse move for hover effects
  const handleCanvasMouseMove = useCallback((event) => {
    if (canvasContainerRef.current) {
      // Calculate mouse position in normalized device coordinates
      // Use canvasContainerRef instead of event.currentTarget
      const rect = canvasContainerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
  }, []);
  
  // SelectionManager component - handles raycasting and selection highlighting
  // This component must be used inside a Canvas
  function SelectionManager({ 
    raycaster, 
    mouse, 
    selectedObjects, 
    multiSelectionActive,
    setHoveredObject
  }) {
    const [hoveredItem, setHoveredItem] = useState(null);
    const { scene, camera } = useThree();
    
    // Use the useFrame hook (which must be used inside a Canvas)
    useFrame(() => {
      if (!raycaster || !scene || !camera) return;
      
      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections with selectable objects
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Find the first intersected object that has userData.isSelectable
      const firstSelectableObject = intersects.find(intersect => {
        let obj = intersect.object;
        while (obj && !obj.userData?.isSelectable) {
          obj = obj.parent;
        }
        return obj?.userData?.isSelectable;
      });
      
      // If we found a hoverable object
      if (firstSelectableObject) {
        let targetObject = firstSelectableObject.object;
        while (targetObject && !targetObject.userData?.isSelectable) {
          targetObject = targetObject.parent;
        }
        
        // Only apply hover effect if the object is not already selected
        const isAlreadySelected = selectedObjects.some(obj => obj.uuid === targetObject.uuid);
        
        if (targetObject !== hoveredItem) {
          // Unhover the previous object
          if (hoveredItem && hoveredItem.material) {
            // Only reset hover effect if the object is not in the selection
            const isPrevSelected = selectedObjects.some(obj => obj.uuid === hoveredItem.uuid);
            if (!isPrevSelected) {
              hoveredItem.material.emissive.setHex(hoveredItem.userData.originalEmissive || 0);
            }
          }
          
          // Hover the new object
          if (targetObject && targetObject.material && !isAlreadySelected) {
            targetObject.userData.originalEmissive = targetObject.material.emissive.getHex();
            targetObject.material.emissive.setHex(SELECTION_COLORS.HOVER);
          }
          
          setHoveredItem(targetObject);
          setHoveredObject(targetObject);
        }
      } else if (hoveredItem) {
        // No hoverable object found, reset the previous one
        const isHoveredSelected = selectedObjects.some(obj => obj.uuid === hoveredItem.uuid);
        if (hoveredItem.material && !isHoveredSelected) {
          hoveredItem.material.emissive.setHex(hoveredItem.userData.originalEmissive || 0);
        }
        setHoveredItem(null);
        setHoveredObject(null);
      }
      
      // Update visual feedback for selected objects
      selectedObjects.forEach(obj => {
        if (obj && obj.material) {
          // Set a distinct color for selected objects
          const selectionColor = multiSelectionActive ? SELECTION_COLORS.MULTI_SELECTED : SELECTION_COLORS.SELECTED;
          obj.material.emissive.setHex(selectionColor);
        }
      });
    });
    
    return null; // This component doesn't render anything visually
  }
  
  // Handle click to select objects
  const handleCanvasClick = useCallback((event) => {
    if (canvasContainerRef.current && canvasContainerRef.current.contains(event.target)) {
      // Calculate mouse position in normalized device coordinates 
      // Use canvasContainerRef instead of event.currentTarget
      const rect = canvasContainerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Get the current camera directly
      const camera = cameraControlsRef.current?.camera;
      // Get the scene (the top parent, which is always the scene)
      const scene = camera?.parent;
      
      if (!raycasterRef.current || !scene || !camera) return;
      
      // Perform raycasting in the click handler instead of useFrame
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);
      
      // Find the first selectable object
      const firstSelectableIntersect = intersects.find(intersect => {
        let obj = intersect.object;
        while (obj && !obj.userData?.isSelectable) {
          obj = obj.parent;
        }
        return obj?.userData?.isSelectable;
      });
      
      // Check if shift key is pressed for multi-selection
      const addToSelection = event.shiftKey;
      
      if (firstSelectableIntersect) {
        let targetObject = firstSelectableIntersect.object;
        while (targetObject && !targetObject.userData?.isSelectable) {
          targetObject = targetObject.parent;
        }
        
        handleSelectElement(targetObject, addToSelection);
      } else if (!addToSelection) {
        // Clicked on empty space with no shift key, deselect all
        handleSelectElement(null);
      }
    }
  }, [handleSelectElement]);

  // Handle SS keyboard shortcut to select all same type
  const handleKeyDown = useCallback((event) => {
    // Original numpad handling
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

    // Add SS shortcut handling
    if (event.key === 's' || event.key === 'S') {
      // Track the s key being pressed for SS combination
      if (lastKeyPressRef.current === 's' || lastKeyPressRef.current === 'S') {
        // SS combination detected
        selectSameType();
        lastKeyPressRef.current = null; // Reset after using the combination
      } else {
        lastKeyPressRef.current = 's';
        // Clear the tracking after a delay
        setTimeout(() => {
          if (lastKeyPressRef.current === 's') {
            lastKeyPressRef.current = null;
          }
        }, 500); // 500ms window to press SS
      }
    } else {
      lastKeyPressRef.current = event.key;
    }
  }, [selectSameType, handleNumpadKey]);

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
    window.addEventListener('mousemove', handleCanvasMouseMove);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, [handleKeyDown, handleCanvasClick, handleCanvasMouseMove]);

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
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[-10, 20, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-camera-near={0.5}
          shadow-camera-far={100}
        />
        <directionalLight 
          position={[10, 10, -10]} 
          intensity={0.8} 
          castShadow={false} 
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
        
        {/* Ground Plane */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#557d55" />
        </mesh>
        
        {/* Selection Manager - handles raycasting and object highlighting */}
        <SelectionManager 
          raycaster={raycasterRef.current}
          mouse={mouseRef.current}
          selectedObjects={selectedObjects}
          multiSelectionActive={multiSelectionActive}
          setHoveredObject={setHoveredObject}
        />
      </Canvas>

      {/* Info Panel for Selected Elements */}
      <div className="info-panel-container">
        <InfoPanel selectionInfo={selectionInfo} />
      </div>

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
