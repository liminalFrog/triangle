import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  OrbitControls
} from '@react-three/drei';
import * as THREE from 'three';
import InfoPanel from './InfoPanel';
import FloatingPanel from './FloatingPanel';
import { HIGHLIGHT_MATERIALS } from './constants';

// Simple hover and selection manager with multi-selection support
function TestSelectionManager({ selectedObjects, setSelectedObjects, setHoveredObject, isSelectMode }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const { scene, camera, raycaster, mouse } = useThree();
  const lastMousePos = useRef(new THREE.Vector2(-999, -999));
    useFrame(() => {
    // Only check for hover in Select Mode
    if (!isSelectMode) {
      // Clear any existing hover state when in View Mode
      if (hoveredItem) {
        setHoveredItem(null);
        setHoveredObject(null);
      }
      return;
    }
    
    // Only check for hover if mouse actually moved
    const mouseMoved = Math.abs(mouse.x - lastMousePos.current.x) > 0.001 || 
                      Math.abs(mouse.y - lastMousePos.current.y) > 0.001;
    
    if (!mouseMoved) return;
    
    lastMousePos.current.copy(mouse);
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersections with test objects
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Find first object with userData.isTestObject
    const testObject = intersects.find(intersect => 
      intersect.object.userData?.isTestObject
    )?.object;
    
    if (testObject !== hoveredItem) {
      console.log('Hover changed:', testObject?.userData?.name || 'none');
      setHoveredItem(testObject || null);
      setHoveredObject(testObject || null);
    }
  });
  // Apply materials based on state
  useFrame(() => {
    scene.traverse((obj) => {
      if (obj.userData?.isTestObject) {
        const isSelected = selectedObjects.includes(obj);
        const isHovered = isSelectMode && hoveredItem === obj; // Only show hover in Select Mode
        
        if (isSelected) {
          // Use your new HIGHLIGHT_MATERIALS for selected state
          obj.material = HIGHLIGHT_MATERIALS.SELECTED.clone();
        } else if (isHovered) {
          // Use your new HIGHLIGHT_MATERIALS for hover state
          obj.material = HIGHLIGHT_MATERIALS.HOVER.clone();
        } else {
          // Use default blue material for normal state
          obj.material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
        }
      }
    });
  });
  
  return null;
}

// Test cube component
function TestCube({ position, name }) {
  const meshRef = useRef();
  
  // Add more comprehensive properties for testing the InfoPanel
  const cubeProperties = {
    name: name,
    position: position,
    dimensions: [2, 2, 2],
    volume: 8.0,
    surfaceArea: 24.0,
    color: '#0077ff',
    material: 'Standard Material',
    castShadow: false,
    receiveShadow: false,
    mass: 1.5,
    density: 0.1875,
    temperature: 20.0,
    status: 'Active',
    created: new Date().toISOString().split('T')[0],
    lastModified: new Date().toLocaleTimeString()
  };
  
  return (
    <mesh 
      ref={meshRef}
      position={position}
      userData={{ 
        isTestObject: true, 
        name,
        elementCategory: 'Test Objects',
        elementType: 'Geometric Primitive',
        elementSubtype: 'Cube',
        properties: cubeProperties
      }}
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={0x0077ff} />
    </mesh>
  );
}

// Click handler with multi-selection support
function ClickHandler({ onObjectClick, isSelectMode }) {
  const { scene, raycaster, camera, mouse } = useThree();
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  
  const handlePointerDown = useCallback((event) => {
    if (!isSelectMode) return;
    
    setIsMouseDown(true);
    setMouseDownPos({ x: event.clientX, y: event.clientY });
  }, [isSelectMode]);
  
  const handlePointerUp = useCallback((event) => {
    if (!isSelectMode || !isMouseDown) return;
    
    // Check if this was a click (not a drag)
    const deltaX = Math.abs(event.clientX - mouseDownPos.x);
    const deltaY = Math.abs(event.clientY - mouseDownPos.y);
    const isClick = deltaX < 5 && deltaY < 5; // 5px tolerance for click vs drag
    
    if (isClick) {
      // Manually perform raycasting using current mouse position
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const testObject = intersects.find(intersect => 
        intersect.object.userData?.isTestObject
      )?.object;
      
      const isShiftPressed = event.shiftKey;
      console.log('Clicked:', testObject?.userData?.name || 'background', 'Shift:', isShiftPressed);
      onObjectClick(testObject || null, isShiftPressed);
    }
    
    setIsMouseDown(false);
  }, [scene, raycaster, camera, mouse, onObjectClick, isSelectMode, isMouseDown, mouseDownPos]);
  
  // Set up global event listeners
  useEffect(() => {
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerUp]);
  
  return null;
}

function SimpleTestScene({ onModeChange }) {
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false); // Start in View Mode
  
  // Generate selection info for InfoPanel
  const generateSelectionInfo = useCallback(() => {
    if (selectedObjects.length === 0) {
      return null;
    }
    
    if (selectedObjects.length === 1) {
      // Single selection
      const obj = selectedObjects[0];
      const userData = obj.userData;
      
      return {
        category: userData.elementCategory || 'Unknown',
        type: userData.elementType || 'Unknown',
        subtype: userData.elementSubtype || 'Unknown',
        properties: userData.properties || {}
      };
    }
    
    // Multi-selection
    const firstObj = selectedObjects[0];
    const userData = firstObj.userData;
    
    // Check if all selected objects are of the same type
    const allSameCategory = selectedObjects.every(obj => 
      obj.userData.elementCategory === userData.elementCategory
    );
    const allSameType = selectedObjects.every(obj => 
      obj.userData.elementType === userData.elementType
    );
    const allSameSubtype = selectedObjects.every(obj => 
      obj.userData.elementSubtype === userData.elementSubtype
    );
    
    return {
      multiSelection: true,
      count: selectedObjects.length,
      category: allSameCategory ? userData.elementCategory : 'Mixed',
      type: allSameType ? userData.elementType : 'Mixed',
      subtype: allSameSubtype ? userData.elementSubtype : 'Mixed'
    };
  }, [selectedObjects]);
  
  const selectionInfo = generateSelectionInfo();
    // Handle Tab key to toggle between View Mode and Select Mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        event.preventDefault(); // Prevent default tab behavior
        setIsSelectMode(prev => {
          const newMode = !prev;
          console.log(`Switched to ${newMode ? 'Select' : 'View'} Mode`);
          
          // Notify parent component of mode change
          if (onModeChange) {
            onModeChange(newMode ? 'Select' : 'View');
          }
          
          // Clear selection and hover when switching to View Mode
          if (!newMode) {
            setSelectedObjects([]);
            setHoveredObject(null);
          }
          
          return newMode;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange]);
  
  const handleObjectClick = useCallback((object, isShiftPressed) => {
    if (!object) {
      // Clicked on background - clear selection if not holding shift
      if (!isShiftPressed) {
        setSelectedObjects([]);
      }
      return;
    }
    
    if (isShiftPressed) {
      // Multi-selection mode: toggle the object in the selection
      setSelectedObjects(prev => {
        const isAlreadySelected = prev.includes(object);
        if (isAlreadySelected) {
          // Remove from selection
          return prev.filter(obj => obj !== object);
        } else {
          // Add to selection
          return [...prev, object];
        }
      });
    } else {
      // Single selection mode: select only this object
      setSelectedObjects([object]);
    }
  }, []);    return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas>
        <color attach="background" args={['#1e1e1e']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls />
        
        {/* Test objects */}
        <TestCube position={[0, 0, 0]} name="Cube1" />
        <TestCube position={[4, 0, 0]} name="Cube2" />
        <TestCube position={[0, 4, 0]} name="Cube3" />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#333" />
        </mesh>
          {/* Selection and click handling */}
        <TestSelectionManager 
          selectedObjects={selectedObjects}
          setSelectedObjects={setSelectedObjects}
          setHoveredObject={setHoveredObject}
          isSelectMode={isSelectMode}
        />
        <ClickHandler 
          onObjectClick={handleObjectClick} 
          isSelectMode={isSelectMode}
        />      </Canvas>
      
      {/* Properties FloatingPanel on the right side */}
      <FloatingPanel
        title="Properties"
        icon="info-sm"
        position="right"
        topbottom="top"
        defaultWidth={320}
      >
        <InfoPanel selectionInfo={selectionInfo} />
      </FloatingPanel>
    </div>
  );
}

export default SimpleTestScene;
