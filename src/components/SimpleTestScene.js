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

// Grid component for CAD-style visualization with Imperial units
function Grid({ 
  sizeInFeet = 50, 
  colorCenterLine = 0x666666, 
  colorFeet = 0x444444, 
  colorInches = 0x222222 
}) {
  const gridRef = useRef();
  
  useEffect(() => {
    if (gridRef.current) {
      // Clear any existing grids
      gridRef.current.clear();
      
      // Convert feet to Three.js units (1 foot = 1 unit)
      const size = sizeInFeet;
      
      // Main grid - 1 foot intervals
      const feetGrid = new THREE.GridHelper(size, size, colorCenterLine, colorFeet);
      feetGrid.position.y = 0; // Position at ground level
      
      // Fine grid - 1 inch intervals (12 divisions per foot)
      const inchGrid = new THREE.GridHelper(size, size * 12, colorInches, colorInches);
      inchGrid.position.y = 0.01; // Slightly above main grid
      inchGrid.material.opacity = 0.3;
      inchGrid.material.transparent = true;
      
      // Add both grids to the group
      gridRef.current.add(feetGrid);
      gridRef.current.add(inchGrid);
    }
  }, [sizeInFeet, colorCenterLine, colorFeet, colorInches]);
  
  return <group ref={gridRef} />;
}

// Simple hover and selection manager with multi-selection support
function TestSelectionManager({ selectedObjects, setSelectedObjects, isSelectMode }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const { scene, camera, raycaster, mouse } = useThree();
  const lastMousePos = useRef(new THREE.Vector2(-999, -999));
    useFrame(() => {
    // Only check for hover in Select Mode
    if (!isSelectMode) {      // Clear any existing hover state when in View Mode
      if (hoveredItem) {
        setHoveredItem(null);
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

// Test cube component - 1x1 foot cube
function TestCube({ position, name }) {
  const meshRef = useRef();
  
  // Add more comprehensive properties for testing the InfoPanel
  const cubeProperties = {
    name: name,
    position: position,
    dimensions: [12, 12, 12], // 12 inches x 12 inches x 12 inches
    dimensionsDisplay: "1' x 1' x 1'",
    volume: 1.0, // 1 cubic foot
    volumeDisplay: "1 ft³",
    surfaceArea: 6.0, // 6 square feet
    surfaceAreaDisplay: "6 ft²",
    color: '#0077ff',
    material: 'Standard Material',
    castShadow: false,
    receiveShadow: false,
    mass: 50, // 50 lbs (approximate for a 1ft cube of wood)
    massDisplay: "50 lbs",
    density: 0.8, // Wood density in lbs/ft³
    densityDisplay: "50 lbs/ft³",
    temperature: 68.0, // Room temperature in Fahrenheit
    temperatureDisplay: "68°F",
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
        elementSubtype: 'Cube (1 ft³)',
        properties: cubeProperties
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
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
            // Clear selection when switching to View Mode
          if (!newMode) {
            setSelectedObjects([]);
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
        <directionalLight position={[10, 10, 5]} intensity={1} />        {/* Camera - adjusted for Imperial scale */}
        <PerspectiveCamera makeDefault position={[10, 8, 10]} />
        <OrbitControls />
        
        {/* Imperial Grid - 50 feet x 50 feet with foot and inch markings */}
        <Grid sizeInFeet={50} />
        
        {/* Test objects - 1x1 foot cubes positioned on foot boundaries */}
        <TestCube position={[0, 0.5, 0]} name="Cube1" />
        <TestCube position={[4, 0.5, 0]} name="Cube2" />
        <TestCube position={[0, 0.5, 4]} name="Cube3" />
        
        {/* Optional: Invisible ground plane for shadows/interaction */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} visible={false}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial />
        </mesh>{/* Selection and click handling */}
        <TestSelectionManager 
          selectedObjects={selectedObjects}
          setSelectedObjects={setSelectedObjects}
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
