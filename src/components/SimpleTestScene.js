import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  OrbitControls
} from '@react-three/drei';
import * as THREE from 'three';

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
          obj.material.color.setHex(0x00ff00); // Green for selected
        } else if (isHovered) {
          obj.material.color.setHex(0xff0000); // Red for hovered
        } else {
          obj.material.color.setHex(0x0077ff); // Blue for normal
        }
      }
    });
  });
  
  return null;
}

// Test cube component
function TestCube({ position, name }) {
  const meshRef = useRef();
  
  return (
    <mesh 
      ref={meshRef}
      position={position}
      userData={{ isTestObject: true, name }}
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={0x0077ff} />
    </mesh>
  );
}

// Click handler with multi-selection support
function ClickHandler({ onObjectClick, isSelectMode }) {
  const { scene, raycaster } = useThree();
  
  const handleClick = useCallback((event) => {
    // Only handle clicks in Select Mode
    if (!isSelectMode) return;
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    const testObject = intersects.find(intersect => 
      intersect.object.userData?.isTestObject
    )?.object;
    
    const isShiftPressed = event.shiftKey;
    console.log('Clicked:', testObject?.userData?.name || 'background', 'Shift:', isShiftPressed);
    onObjectClick(testObject || null, isShiftPressed);
  }, [scene, raycaster, onObjectClick, isSelectMode]);
  
  return (
    <mesh onClick={handleClick} visible={false}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function SimpleTestScene() {
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false); // Start in View Mode
  
  // Handle Tab key to toggle between View Mode and Select Mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        event.preventDefault(); // Prevent default tab behavior
        setIsSelectMode(prev => {
          const newMode = !prev;
          console.log(`Switched to ${newMode ? 'Select' : 'View'} Mode`);
          
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
  }, []);
  
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
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
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
        />
      </Canvas>
        {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '5px',
          color: isSelectMode ? '#4CAF50' : '#FF9800'
        }}>
          Mode: {isSelectMode ? 'SELECT' : 'VIEW'}
        </div>
        <div>Hovered: {hoveredObject?.userData?.name || 'none'}</div>
        <div>Selected: {selectedObjects.length > 0 ? 
          selectedObjects.map(obj => obj.userData.name).join(', ') : 
          'none'}</div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          <div>Tab: Toggle View/Select Mode</div>
          {isSelectMode && (
            <div>Click to select, Shift+click for multi-selection</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimpleTestScene;
