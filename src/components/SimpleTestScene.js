import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  OrbitControls
} from '@react-three/drei';
import * as THREE from 'three';
import InfoPanel from './InfoPanel';
import FloatingPanel from './FloatingPanel';
import ContextMenu from './ContextMenu';
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
function TestCube({ position, name, id }) {
  const meshRef = useRef();
  
  // Add more comprehensive properties for testing the InfoPanel
  const cubeProperties = {
    id: id,
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
        id,
        name,
        elementCategory: 'Test Objects',
        elementType: 'Geometric Primitive',
        elementSubtype: 'Cube (1 ft³)',
        properties: cubeProperties
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={0x0077ff} />
    </mesh>  );
}

// Building component - renders building from drawing points
function Building({ id, name, mode, points, position }) {
  const meshRef = useRef();
    // Generate building geometry from points
  const buildingGeometry = useMemo(() => {
    console.log(`Building component rendering - mode: ${mode}, points:`, points);
    
    if (!points || points.length < 2) return null;
    
    if (mode === 'lines') {
      // Create line geometry for lines mode
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      points.forEach(point => {
        positions.push(point.x, point.y, point.z);
      });
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      console.log('Created line geometry for building');
      return { type: 'line', geometry };
      
    } else if (mode === 'rectangle') {
      // Create extruded building for rectangle mode
      const shape = new THREE.Shape();
      
      // Move to first point
      if (points.length > 0) {
        shape.moveTo(points[0].x, points[0].z);
        
        // Add lines to other points
        for (let i = 1; i < points.length; i++) {
          shape.lineTo(points[i].x, points[i].z);
        }
      }
      
      // Extrude the shape to create a 3D building
      const extrudeSettings = {
        depth: 10, // 10 feet tall building
        bevelEnabled: false
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Rotate geometry to be upright
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, 0, 0); // Keep building at ground level
      
      console.log('Created mesh geometry for rectangle building');
      return { type: 'mesh', geometry };
    }
    
    return null;
  }, [mode, points]);
  
  console.log(`Building component - geometry result:`, buildingGeometry);
  
  if (!buildingGeometry) {
    console.log('Building geometry is null, no building will be rendered');
    return null;
  }
  
  // Building properties for InfoPanel
  const buildingProperties = {
    id: id,
    name: name,
    position: position,
    mode: mode,
    pointCount: points?.length || 0,
    dimensions: mode === 'rectangle' && points?.length >= 4 
      ? [
          Math.abs(points[2].x - points[0].x) * 12, // Convert to inches
          Math.abs(points[2].z - points[0].z) * 12,
          120 // 10 feet = 120 inches
        ]
      : [0, 0, 0],
    dimensionsDisplay: mode === 'rectangle' && points?.length >= 4
      ? `${Math.abs(points[2].x - points[0].x)}' x ${Math.abs(points[2].z - points[0].z)}' x 10'`
      : 'N/A',
    volume: mode === 'rectangle' && points?.length >= 4
      ? Math.abs(points[2].x - points[0].x) * Math.abs(points[2].z - points[0].z) * 10
      : 0,
    volumeDisplay: mode === 'rectangle' && points?.length >= 4
      ? `${Math.abs(points[2].x - points[0].x) * Math.abs(points[2].z - points[0].z) * 10} ft³`
      : 'N/A',
    color: mode === 'lines' ? '#00ff00' : '#888888',
    material: mode === 'lines' ? 'Line Material' : 'Building Material',
    buildingType: mode === 'lines' ? 'Outline' : 'Solid Building',
    status: 'Active',
    created: new Date().toISOString().split('T')[0],
    lastModified: new Date().toLocaleTimeString()
  };
  
  if (buildingGeometry.type === 'line') {
    return (
      <group>
        {/* Create tube geometry for better line visibility */}        {points && points.map((point, index) => {
          if (index === 0) return null;
          const startPoint = points[index - 1];
          const endPoint = point;
          
          // Create tube geometry
          const curve = new THREE.LineCurve3(startPoint, endPoint);
          const tubeGeometry = new THREE.TubeGeometry(curve, 1, 0.05, 8, false);
          
          return (
            <mesh key={`line-${index}`} geometry={tubeGeometry} position={position}>
              <meshBasicMaterial color={0x00ff00} />
            </mesh>
          );
        })}
        
        {/* Add glow effect with larger tubes */}
        {points && points.map((point, index) => {
          if (index === 0) return null;
          const startPoint = points[index - 1];
          const endPoint = point;
          
          const curve = new THREE.LineCurve3(startPoint, endPoint);
          const glowGeometry = new THREE.TubeGeometry(curve, 1, 0.1, 8, false);
          
          return (
            <mesh key={`glow-${index}`} geometry={glowGeometry} position={position}>
              <meshBasicMaterial 
                color={0x88ff88} 
                transparent={true} 
                opacity={0.3} 
              />
            </mesh>
          );
        })}
        
        {/* Add vertex markers at points */}
        {points && points.map((point, index) => (
          <mesh key={`vertex-${index}`} position={[point.x + position[0], point.y + position[1], point.z + position[2]]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={0x00ff00} />
          </mesh>
        ))}
        
        {/* Keep the original line for userData */}
        <line
          ref={meshRef}
          geometry={buildingGeometry.geometry}
          position={position}
          userData={{
            isTestObject: true,
            id,
            name,
            elementCategory: 'Buildings',
            elementType: 'Building Structure',
            elementSubtype: mode === 'lines' ? 'Building Outline' : 'Solid Building',
            properties: buildingProperties
          }}
          visible={false}
        >
          <lineBasicMaterial color={0x00ff00} />
        </line>
      </group>
    );
  } else if (buildingGeometry.type === 'mesh') {
    return (
      <mesh
        ref={meshRef}
        geometry={buildingGeometry.geometry}
        position={position}
        userData={{
          isTestObject: true,
          id,
          name,
          elementCategory: 'Buildings',
          elementType: 'Building Structure',
          elementSubtype: 'Solid Building',
          properties: buildingProperties
        }}
      >
        <meshStandardMaterial color={0x888888} />
      </mesh>
    );
  }
  
  return null;
}

// Camera controller for zoom-to-selection functionality
function CameraController({ selectedObjects, onZoomToSelection }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  
  // Set up ref for OrbitControls
  useEffect(() => {
    const controls = document.querySelector('canvas').parentElement.querySelector('[data-camera-controls]');
    if (controls) {
      controlsRef.current = controls;
    }
  }, []);
  
  // Handle zoom to selection
  useEffect(() => {
    const handleZoom = () => {
      if (selectedObjects.length === 0) {
        console.log('No objects selected to zoom to');
        return;
      }
      
      // Calculate bounding box of all selected objects
      const box = new THREE.Box3();
      selectedObjects.forEach(obj => {
        const objBox = new THREE.Box3().setFromObject(obj);
        box.union(objBox);
      });
      
      if (box.isEmpty()) return;
      
      // Get box center and size
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
        // Calculate camera distance to frame the objects nicely with more comfortable spacing
      const fov = camera.fov * (Math.PI / 180); // Convert to radians
      const distance = maxSize / (2 * Math.tan(fov / 2)) * 3.0; // Increased from 1.5 to 3.0 for more distance
      
      // Position camera at an angle above and to the side of the selection
      const cameraOffset = new THREE.Vector3(distance * 0.8, distance * 0.6, distance * 0.8);
      const newPosition = center.clone().add(cameraOffset);
      
      // Update camera position and target
      camera.position.copy(newPosition);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      
      console.log(`Zoomed to ${selectedObjects.length} selected object(s)`);
    };
    
    if (onZoomToSelection) {
      onZoomToSelection.current = handleZoom;
    }
  }, [selectedObjects, camera, onZoomToSelection]);
  
  return null;
}
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

// Mouse position tracker for dimension display
function MousePositionTracker({ setMousePosition, isDrawing }) {
  const { raycaster, mouse, camera } = useThree();
  
  // Grid plane for raycasting (same as in DrawingHandler)
  const gridPlane = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100);
    geometry.rotateX(-Math.PI / 2); // Make it horizontal
    const material = new THREE.MeshBasicMaterial({ 
      visible: false,
      side: THREE.DoubleSide 
    });
    return new THREE.Mesh(geometry, material);
  }, []);

  // Snap point to grid intersections (1-foot grid)
  const snapToGrid = useCallback((point) => {
    const snappedX = Math.round(point.x);
    const snappedZ = Math.round(point.z);
    return new THREE.Vector3(snappedX, 0, snappedZ);
  }, []);

  useFrame(() => {
    if (!isDrawing) {
      setMousePosition(null);
      return;
    }

    // Update raycaster with current mouse position
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(gridPlane);
    
    if (intersects.length > 0) {
      const worldPoint = snapToGrid(intersects[0].point);
      setMousePosition(worldPoint);
    } else {
      setMousePosition(null);
    }
  });

  return null;
}

// Grid intersection detection and drawing handler
function DrawingHandler({ 
  isDrawing, 
  drawingMode, 
  drawingPoints, 
  setDrawingPoints, 
  previewGeometry, 
  setPreviewGeometry,
  onFinishDrawing 
}) {
  const { scene, raycaster, camera, mouse } = useThree();
  
  // Create invisible grid plane for intersection detection
  const gridPlane = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100);
    geometry.rotateX(-Math.PI / 2); // Make it horizontal
    const material = new THREE.MeshBasicMaterial({ 
      visible: false,
      side: THREE.DoubleSide 
    });
    return new THREE.Mesh(geometry, material);
  }, []);
  
  // Snap point to grid intersections (1-foot grid)
  const snapToGrid = useCallback((point) => {
    const snappedX = Math.round(point.x);
    const snappedZ = Math.round(point.z);
    return new THREE.Vector3(snappedX, 0, snappedZ);
  }, []);
  
  // Handle mouse click for drawing
  const handleDrawingClick = useCallback((event) => {
    if (!isDrawing) return;
    
    // Perform raycasting to find intersection with grid plane
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(gridPlane);
    
    if (intersects.length > 0) {
      const point = snapToGrid(intersects[0].point);
        if (drawingMode === 'lines') {
        setDrawingPoints(prev => {
          const newPoints = [...prev, point];
          
          // Check if clicking on the first point to close the line
          if (prev.length > 2) {
            const firstPoint = prev[0];
            const distanceToFirst = point.distanceTo(firstPoint);
            if (distanceToFirst < 0.5) { // Within 0.5 feet of first point
              console.log('Line drawing: Clicked near first point, closing line');
              const closedPoints = [...prev, firstPoint]; // Close with first point
              setTimeout(() => onFinishDrawing(closedPoints), 0);
              return closedPoints;
            }
          }
          
          // For lines mode, each click adds a point
          // Double-click or right-click finishes the drawing
          if (event.detail === 2 || event.button === 2) { // Double-click or right-click
            setTimeout(() => onFinishDrawing(), 0);
            return newPoints;
          }
          
          return newPoints;
        });} else if (drawingMode === 'rectangle') {
        setDrawingPoints(prev => {
          console.log(`Rectangle drawing - previous points count: ${prev.length}`);
          if (prev.length === 0) {
            // First click - start corner
            console.log('Rectangle: First click at', point);
            return [point];
          } else if (prev.length === 1) {
            // Second click - finish rectangle
            const startPoint = prev[0];
            const endPoint = point;
            console.log('Rectangle: Second click at', point);
            console.log('Rectangle: Creating corners from', startPoint, 'to', endPoint);
            
            // Create rectangle corners
            const corners = [
              startPoint,
              new THREE.Vector3(endPoint.x, 0, startPoint.z),
              endPoint,
              new THREE.Vector3(startPoint.x, 0, endPoint.z),
              startPoint // Close the rectangle
            ];
            
            console.log('Rectangle: Created corners array:', corners);
            console.log('Rectangle: Calling onFinishDrawing directly with corners');
            // Call onFinishDrawing directly with the corners instead of relying on state
            onFinishDrawing(corners);
            return corners;
          }
          return prev;
        });
      }
    }
  }, [isDrawing, drawingMode, raycaster, mouse, camera, gridPlane, snapToGrid, setDrawingPoints, onFinishDrawing]);
  
  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isDrawing) {
        setDrawingPoints([]);
        setPreviewGeometry(null);
        onFinishDrawing();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, setDrawingPoints, setPreviewGeometry, onFinishDrawing]);
  
  // Set up click event listener
  useEffect(() => {
    if (isDrawing) {
      window.addEventListener('click', handleDrawingClick);
      return () => window.removeEventListener('click', handleDrawingClick);
    }
  }, [isDrawing, handleDrawingClick]);
  
  // Add grid plane to scene
  useEffect(() => {
    if (isDrawing) {
      scene.add(gridPlane);
      return () => scene.remove(gridPlane);
    }
  }, [isDrawing, scene, gridPlane]);
  
  // Update preview geometry based on current drawing points
  useEffect(() => {
    if (!isDrawing || drawingPoints.length === 0) {
      setPreviewGeometry(null);
      return;
    }
    
    if (drawingMode === 'lines' && drawingPoints.length > 0) {
      // Create line preview
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      drawingPoints.forEach(point => {
        positions.push(point.x, point.y, point.z);
      });
      
      // Add current mouse position as preview
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(gridPlane);
      if (intersects.length > 0) {
        const previewPoint = snapToGrid(intersects[0].point);
        positions.push(previewPoint.x, previewPoint.y, previewPoint.z);
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      setPreviewGeometry({ type: 'line', geometry });
      
    } else if (drawingMode === 'rectangle' && drawingPoints.length === 1) {
      // Create rectangle preview
      const startPoint = drawingPoints[0];
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(gridPlane);
      if (intersects.length > 0) {
        const endPoint = snapToGrid(intersects[0].point);
        
        const positions = [
          startPoint.x, startPoint.y, startPoint.z,
          endPoint.x, startPoint.y, startPoint.z,
          endPoint.x, endPoint.y, endPoint.z,
          startPoint.x, endPoint.y, endPoint.z,
          startPoint.x, startPoint.y, startPoint.z // Close rectangle
        ];
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        setPreviewGeometry({ type: 'line', geometry });
      }
    }
  }, [isDrawing, drawingMode, drawingPoints, mouse, camera, raycaster, gridPlane, snapToGrid, setPreviewGeometry]);
  
  return null;
}

// Preview geometry renderer
function DrawingPreview({ previewGeometry }) {
  if (!previewGeometry) return null;
  
  if (previewGeometry.type === 'line') {
    // Extract points from the line geometry for creating tubes
    const positions = previewGeometry.geometry.attributes.position.array;
    const points = [];
    
    for (let i = 0; i < positions.length; i += 3) {
      points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
    }
    
    return (
      <group>
        {/* Create tube segments for preview */}
        {points.map((point, index) => {
          if (index === 0) return null;
          const startPoint = points[index - 1];
          const endPoint = point;
          
          const curve = new THREE.LineCurve3(startPoint, endPoint);
          const tubeGeometry = new THREE.TubeGeometry(curve, 1, 0.06, 8, false);
          
          return (
            <mesh key={`preview-${index}`} geometry={tubeGeometry}>
              <meshBasicMaterial color={0x00ffff} />
            </mesh>
          );
        })}
        
        {/* Add glow effect */}
        {points.map((point, index) => {
          if (index === 0) return null;
          const startPoint = points[index - 1];
          const endPoint = point;
          
          const curve = new THREE.LineCurve3(startPoint, endPoint);
          const glowGeometry = new THREE.TubeGeometry(curve, 1, 0.12, 8, false);
          
          return (
            <mesh key={`preview-glow-${index}`} geometry={glowGeometry}>
              <meshBasicMaterial 
                color={0x88ffff} 
                transparent={true} 
                opacity={0.4} 
              />
            </mesh>
          );
        })}
        
        {/* Add vertex markers for preview */}
        {points.map((point, index) => (
          <mesh key={`preview-vertex-${index}`} position={[point.x, point.y + 0.02, point.z]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={0x00ffff} />
          </mesh>
        ))}
      </group>
    );
  }
  
  return null;
}

// Grid intersection highlighter - shows glowing dot at snap position
function GridIntersectionHighlight({ isDrawing }) {
  const { scene, raycaster, camera, mouse } = useThree();
  const [snapPosition, setSnapPosition] = useState(null);
  
  // Create invisible grid plane for intersection detection
  const gridPlane = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100);
    geometry.rotateX(-Math.PI / 2); // Make it horizontal
    const material = new THREE.MeshBasicMaterial({ 
      visible: false,
      side: THREE.DoubleSide 
    });
    return new THREE.Mesh(geometry, material);
  }, []);
  
  // Snap point to grid intersections (1-foot grid)
  const snapToGrid = useCallback((point) => {
    const snappedX = Math.round(point.x);
    const snappedZ = Math.round(point.z);
    return new THREE.Vector3(snappedX, 0, snappedZ);
  }, []);
  
  // Update snap position on mouse move
  useFrame(() => {
    if (!isDrawing) {
      setSnapPosition(null);
      return;
    }
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(gridPlane);
    
    if (intersects.length > 0) {
      const snappedPoint = snapToGrid(intersects[0].point);
      setSnapPosition(snappedPoint);
    } else {
      setSnapPosition(null);
    }
  });
  
  // Add grid plane to scene when drawing
  useEffect(() => {
    if (isDrawing) {
      scene.add(gridPlane);
      return () => scene.remove(gridPlane);
    }
  }, [isDrawing, scene, gridPlane]);
  
  if (!snapPosition) return null;
  
  return (
    <group position={[snapPosition.x, snapPosition.y + 0.05, snapPosition.z]}>
      {/* Main bright dot */}
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial 
          color={0xffff00} 
          transparent={true} 
          opacity={0.9}
        />
      </mesh>
      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial 
          color={0xffff88} 
          transparent={true} 
          opacity={0.3}
        />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial 
          color={0xffff44} 
          transparent={true} 
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

// Dimension display component for drawing mode
function DimensionDisplay({ 
  isDrawing, 
  drawingMode, 
  drawingPoints, 
  mousePosition, 
  onDimensionInput,
  setDimensionInputActive
}) {
  const [inputValues, setInputValues] = useState({ length: '', width: '' });
  const [activeInput, setActiveInput] = useState('length');
  const [showInputs, setShowInputs] = useState(false);
  const inputRef = useRef(null);
  const widthInputRef = useRef(null);

  // Notify parent when dimension input becomes active/inactive
  useEffect(() => {
    setDimensionInputActive(showInputs);
  }, [showInputs, setDimensionInputActive]);

  // Calculate dimensions based on current drawing state
  const dimensions = useMemo(() => {
    if (!isDrawing || drawingPoints.length === 0) return null;

    if (drawingMode === 'lines' && drawingPoints.length > 0 && mousePosition) {
      // For lines mode, show distance from last point to cursor
      const lastPoint = drawingPoints[drawingPoints.length - 1];
      const distance = Math.sqrt(
        Math.pow(mousePosition.x - lastPoint.x, 2) + 
        Math.pow(mousePosition.z - lastPoint.z, 2)
      );
      return {
        length: distance.toFixed(2),
        display: `${distance.toFixed(2)}'`
      };    } else if (drawingMode === 'rectangle' && drawingPoints.length === 1 && mousePosition) {
      // For rectangle mode, show width and length
      const startPoint = drawingPoints[0];
      // Width is X direction (left/right), Length is Z direction (forward/back)
      const width = Math.abs(mousePosition.x - startPoint.x);
      const length = Math.abs(mousePosition.z - startPoint.z);
      return {
        width: width.toFixed(2),
        length: length.toFixed(2),
        display: `${length.toFixed(2)}' × ${width.toFixed(2)}'` // Show as Length × Width
      };
    }
    return null;
  }, [isDrawing, drawingMode, drawingPoints, mousePosition]);

  // Handle keyboard input for dimensions
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isDrawing) return;

      // Enter key - confirm input and finish drawing with specified dimension
      if (event.key === 'Enter' && showInputs) {
        event.preventDefault();
        const length = parseFloat(inputValues.length) || 0;
        const width = parseFloat(inputValues.width) || 0;
        
        if (length > 0) {
          onDimensionInput(length, width);
        }
        setShowInputs(false);
        setInputValues({ length: '', width: '' });
      }
      // Tab key - switch between inputs in rectangle mode
      else if (event.key === 'Tab' && drawingMode === 'rectangle' && showInputs) {
        event.preventDefault();
        setActiveInput(prev => prev === 'length' ? 'width' : 'length');
        setTimeout(() => {
          if (activeInput === 'length') {
            widthInputRef.current?.focus();
          } else {
            inputRef.current?.focus();
          }
        }, 0);
      }
      // Number keys or backspace - start typing dimension
      else if ((event.key.match(/[0-9.]/) || event.key === 'Backspace') && !showInputs) {
        event.preventDefault();
        setShowInputs(true);
        setInputValues({ 
          length: event.key === 'Backspace' ? '' : event.key, 
          width: '' 
        });
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      // Escape - cancel input
      else if (event.key === 'Escape' && showInputs) {
        event.preventDefault();
        setShowInputs(false);
        setInputValues({ length: '', width: '' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, showInputs, inputValues, activeInput, drawingMode, onDimensionInput]);

  // Update input values when dimensions change
  useEffect(() => {
    if (dimensions && !showInputs) {
      setInputValues({
        length: dimensions.length || '',
        width: dimensions.width || ''
      });
    }
  }, [dimensions, showInputs]);

  if (!isDrawing || !dimensions) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        {drawingMode === 'lines' ? 'Line Length' : 'Rectangle Dimensions'}
      </div>
      
      {!showInputs ? (
        <div style={{ fontSize: '16px', color: '#00ff00' }}>
          {dimensions.display}
        </div>
      ) : (
        <div>
          {drawingMode === 'lines' ? (
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Length (feet):</label>
              <input
                ref={inputRef}
                type="text"
                value={inputValues.length}
                onChange={(e) => setInputValues(prev => ({ ...prev, length: e.target.value }))}
                style={{
                  background: '#333',
                  border: '1px solid #555',
                  color: 'white',
                  padding: '4px',
                  borderRadius: '3px',
                  width: '80px'
                }}
                autoFocus
              />
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Length (feet):</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValues.length}
                  onChange={(e) => setInputValues(prev => ({ ...prev, length: e.target.value }))}
                  style={{
                    background: activeInput === 'length' ? '#444' : '#333',
                    border: `1px solid ${activeInput === 'length' ? '#00ff00' : '#555'}`,
                    color: 'white',
                    padding: '4px',
                    borderRadius: '3px',
                    width: '80px'
                  }}
                  autoFocus={activeInput === 'length'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px' }}>Width (feet):</label>
                <input
                  ref={widthInputRef}
                  type="text"
                  value={inputValues.width}
                  onChange={(e) => setInputValues(prev => ({ ...prev, width: e.target.value }))}
                  style={{
                    background: activeInput === 'width' ? '#444' : '#333',
                    border: `1px solid ${activeInput === 'width' ? '#00ff00' : '#555'}`,
                    color: 'white',
                    padding: '4px',
                    borderRadius: '3px',
                    width: '80px'
                  }}
                  autoFocus={activeInput === 'width'}
                />
              </div>
            </div>
          )}
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#aaa' }}>
            Press Enter to confirm, Esc to cancel
            {drawingMode === 'rectangle' && ', Tab to switch fields'}
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleTestScene({ onModeChange, onBuildingClick }) {
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false); // Start in View Mode
    // Dynamic objects state - manage objects that can be created/deleted
  const [objects, setObjects] = useState([
    { id: 'cube1', position: [0, 0.5, 0], name: 'Cube1' },
    { id: 'cube2', position: [4, 0.5, 0], name: 'Cube2' },
    { id: 'cube3', position: [0, 0.5, 4], name: 'Cube3' }
  ]);
    // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // 'lines' or 'rectangle'
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [previewGeometry, setPreviewGeometry] = useState(null);
  const [mousePosition, setMousePosition] = useState(null);
  const [dimensionInputActive, setDimensionInputActive] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, items: [] });
  
  // Undo/Redo system
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Save state to history for undo/redo
  const saveToHistory = useCallback((action, previousState, newState) => {
    const newHistoryEntry = {
      action,
      previousState,
      newState,
      timestamp: Date.now()
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryEntry);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);
  
  // Delete selected objects
  const deleteSelectedObjects = useCallback(() => {
    if (selectedObjects.length === 0) return;
    
    const previousObjects = [...objects];
    const selectedIds = selectedObjects.map(obj => obj.userData.id);
    const newObjects = objects.filter(obj => !selectedIds.includes(obj.id));
    
    // Save to history
    saveToHistory('delete', previousObjects, newObjects);
    
    // Update state
    setObjects(newObjects);
    setSelectedObjects([]);
    
    console.log(`Deleted ${selectedObjects.length} object(s)`);
  }, [selectedObjects, objects, saveToHistory]);
  
  // Undo action
  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    
    const entry = history[historyIndex];
    setObjects(entry.previousState);
    setSelectedObjects([]);
    setHistoryIndex(prev => prev - 1);
    
    console.log(`Undid: ${entry.action}`);
  }, [history, historyIndex]);
    // Redo action
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const entry = history[historyIndex + 1];
    setObjects(entry.newState);
    setSelectedObjects([]);
    setHistoryIndex(prev => prev + 1);
    
    console.log(`Redid: ${entry.action}`);  }, [history, historyIndex]);
    // Ref for zoom to selection function
  const zoomToSelectionRef = useRef();
  
  // Building drawing functions
  const startDrawing = useCallback((mode) => {
    setIsDrawing(true);
    setDrawingMode(mode);
    setDrawingPoints([]);
    setContextMenu({ visible: false, x: 0, y: 0, items: [] });
    console.log(`Started drawing in ${mode} mode`);
  }, []);  const stopDrawing = useCallback((finalPoints = null) => {
    const pointsToUse = finalPoints || drawingPoints;
    console.log(`stopDrawing called - points.length: ${pointsToUse.length}, drawingMode: ${drawingMode}`);
    console.log('Points to use:', pointsToUse);
    
    if (pointsToUse.length > 1) {
      // Create building geometry from points
      const previousObjects = [...objects];
      const newBuilding = {
        id: `building_${Date.now()}`,
        type: 'building',
        mode: drawingMode,
        points: [...pointsToUse],
        position: [0, 0, 0], // Buildings are positioned at origin with points defining shape
        name: `Building_${objects.filter(obj => obj.type === 'building').length + 1}`
      };
      const newObjects = [...objects, newBuilding];
      
      // Save to history
      saveToHistory('create_building', previousObjects, newObjects);
      setObjects(newObjects);
      
      console.log(`✓ Created building with ${pointsToUse.length} points in ${drawingMode} mode`);
      console.log('Building object:', newBuilding);
      console.log('Drawing points:', pointsToUse);
    } else {
      console.log(`✗ Not creating building - insufficient points (${pointsToUse.length})`);
    }
    
    setIsDrawing(false);
    setDrawingMode(null);
    setDrawingPoints([]);
    setPreviewGeometry(null);
  }, [drawingPoints, drawingMode, objects, saveToHistory]);

  // Handle dimension input to create geometry with specified dimensions
  const handleDimensionInput = useCallback((length, width = 0) => {
    console.log(`Dimension input - Length: ${length}, Width: ${width}, Mode: ${drawingMode}`);
    
    if (!isDrawing || drawingPoints.length === 0) {
      console.log('Cannot create geometry: not drawing or no points');
      return;
    }

    if (drawingMode === 'lines' && drawingPoints.length > 0) {
      // For lines mode, create a line of specified length from the last point
      const lastPoint = drawingPoints[drawingPoints.length - 1];
      
      // Calculate direction based on current mouse position or default to positive X
      let direction = new THREE.Vector3(1, 0, 0); // Default direction
      if (mousePosition) {
        direction = new THREE.Vector3(
          mousePosition.x - lastPoint.x,
          0,
          mousePosition.z - lastPoint.z
        ).normalize();
      }
      
      // Create end point at specified distance
      const endPoint = new THREE.Vector3(
        lastPoint.x + direction.x * length,
        lastPoint.y,
        lastPoint.z + direction.z * length
      );
      
      // Create final points array
      const finalPoints = [...drawingPoints, endPoint];
      stopDrawing(finalPoints);    } else if (drawingMode === 'rectangle' && drawingPoints.length === 1) {
      // For rectangle mode, create rectangle with specified dimensions
      const startPoint = drawingPoints[0];
      
      // Use current mouse position to determine direction, or default to positive directions
      let endPoint;
      if (mousePosition) {
        // Determine direction based on current mouse position relative to start point
        const directionX = mousePosition.x >= startPoint.x ? 1 : -1;
        const directionZ = mousePosition.z >= startPoint.z ? 1 : -1;
        
        endPoint = new THREE.Vector3(
          startPoint.x + directionX * (width || length), // Width in X direction
          startPoint.y,
          startPoint.z + directionZ * length  // Length in Z direction
        );
      } else {
        // Fallback to positive directions if no mouse position
        endPoint = new THREE.Vector3(
          startPoint.x + (width || length), // Width in X direction
          startPoint.y,
          startPoint.z + length  // Length in Z direction
        );
      }
      
      // Create rectangle corners using the same logic as normal rectangle drawing
      const corners = [
        startPoint,
        new THREE.Vector3(endPoint.x, 0, startPoint.z),
        endPoint,
        new THREE.Vector3(startPoint.x, 0, endPoint.z),
        startPoint // Close the rectangle
      ];
      
      console.log(`Creating rectangle with dimensions length=${length}, width=${width || length} from point:`, startPoint);
      console.log('Rectangle corners:', corners);
      stopDrawing(corners);
    }  }, [isDrawing, drawingMode, drawingPoints, mousePosition, stopDrawing]);
    // Handle right-click context menu
  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    // Don't show context menu on right-click anymore
    // Context menu is now triggered by Shift+A
  }, []);
  // Handle context menu display
  const showContextMenu = useCallback((event, menuType = 'library') => {
    let menuItems = [];
    
    if (menuType === 'library') {
      menuItems = [
        {
          id: 'building',
          label: 'Building',
          category: 'Library',
          action: () => showContextMenu(event, 'building')
        },
        {
          id: 'wall',
          label: 'Wall',
          category: 'Library',
          action: () => console.log('Wall selected')
        },
        {
          id: 'awning',
          label: 'Awning',
          category: 'Library',
          action: () => console.log('Awning selected')
        },
        {
          id: 'door',
          label: 'Walk Door',
          category: 'Library',
          action: () => console.log('Door selected')
        },
        {
          id: 'window',
          label: 'Window',
          category: 'Library',
          action: () => console.log('Window selected')
        },
        {
          id: 'rollup',
          label: 'Roll-up Door',
          category: 'Library',
          action: () => console.log('Roll-up Door selected')
        },
        {
          id: 'track',
          label: 'Track Door',
          category: 'Library',
          action: () => console.log('Track Door selected')
        },
        {
          id: 'fan',
          label: 'Fan',
          category: 'Library',
          action: () => console.log('Fan selected')
        },
        {
          id: 'opening',
          label: 'Opening',
          category: 'Library',
          action: () => console.log('Opening selected')
        }
      ];
    } else if (menuType === 'building') {
      menuItems = [
        {
          id: 'draw-lines',
          label: 'Draw Lines',
          category: 'Building',
          action: () => startDrawing('lines')
        },
        {
          id: 'draw-rectangle',
          label: 'Draw Rectangle',
          category: 'Building',
          action: () => startDrawing('rectangle')
        }
      ];
    } else if (menuType === 'wall') {
      menuItems = [
        {
          id: 'draw-wall',
          label: 'Draw Lines',
          category: 'Wall',
          action: () => console.log('Draw Wall selected')
        },
        {
          id: 'draw-wall-rectangle',
          label: 'Draw Rectangle',
          category: 'Wall',
          action: () => console.log('Draw Wall Rectangle selected')
        }
      ];
    } else if (menuType === 'awning') {
      menuItems = [
        {
          id: 'draw-awning',
          label: 'Draw Lines',
          category: 'Awning',
          action: () => console.log('Draw Awning selected')
        },
        {
          id: 'draw-awning-rectangle',
          label: 'Draw Rectangle',
          category: 'Awning',
          action: () => console.log('Draw Awning Rectangle selected')
        }
      ];
    }
    
    
    setContextMenu({
      visible: true,
      x: event.clientX || window.innerWidth / 2,
      y: event.clientY || window.innerHeight / 2,
      items: menuItems
    });
  }, [startDrawing]);
    const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, items: [] });
  }, []);
    // Handle building click from ElementsPanel
  const handleBuildingClick = useCallback(() => {
    // Create a synthetic event for the context menu positioning
    const syntheticEvent = {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2
    };
    showContextMenu(syntheticEvent, 'building');
  }, [showContextMenu]);
  
  // Pass building click handler to parent
  useEffect(() => {
    if (onBuildingClick) {
      onBuildingClick(handleBuildingClick);
    }
  }, [onBuildingClick, handleBuildingClick]);
  
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
    };  }, [selectedObjects]);
  
  const selectionInfo = generateSelectionInfo();
  
  // Handle keyboard shortcuts: Tab (mode toggle), Delete, Ctrl+Z (undo), Ctrl+Y (redo), Numpad 9 (zoom to selection)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't handle Tab key when dimension input is active
      if (event.key === 'Tab' && dimensionInputActive) {
        return; // Let dimension input component handle it
      }
      
      // Tab key - toggle between View Mode and Select Mode
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
      
      // Delete key - delete selected objects (only in Select Mode)
      else if (event.key === 'Delete' && isSelectMode) {
        event.preventDefault();
        deleteSelectedObjects();
      }
      
      // Ctrl+Z - undo
      else if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z - redo
      else if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'Z')) {
        event.preventDefault();
        redo();
      }
        // Numpad 9 - zoom to selection
      else if (event.code === 'Numpad9') {
        event.preventDefault();
        if (zoomToSelectionRef.current) {
          zoomToSelectionRef.current();
        }
      }
        // Shift+A - show library context menu
      else if (event.shiftKey && event.key === 'A') {
        event.preventDefault();
        showContextMenu(event, 'library');
      }
    };    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange, isSelectMode, deleteSelectedObjects, undo, redo, showContextMenu, dimensionInputActive]);
  
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
      <Canvas onContextMenu={handleContextMenu}>
        <color attach="background" args={['#1e1e1e']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />        {/* Camera - adjusted for Imperial scale */}
        <PerspectiveCamera makeDefault position={[10, 8, 10]} />
        <OrbitControls />
          {/* Imperial Grid - 50 feet x 50 feet with foot and inch markings */}
        <Grid sizeInFeet={50} />
          {/* Dynamic objects - cubes and buildings */}        {objects.map(obj => {
          console.log('Rendering object:', obj.id, obj.type, obj.mode);
          if (obj.type === 'building') {
            console.log(`Rendering building ${obj.id} with ${obj.points?.length || 0} points in ${obj.mode} mode`);
            return (
              <Building
                key={obj.id}
                id={obj.id}
                name={obj.name}
                mode={obj.mode}
                points={obj.points}
                position={obj.position}
              />
            );
          } else {
            // Default to TestCube for backward compatibility
            return (
              <TestCube 
                key={obj.id}
                id={obj.id}
                position={obj.position} 
                name={obj.name} 
              />
            );
          }
        })}
        
        {/* Optional: Invisible ground plane for shadows/interaction */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} visible={false}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial />
        </mesh>        {/* Selection and click handling */}
        <TestSelectionManager 
          selectedObjects={selectedObjects}
          setSelectedObjects={setSelectedObjects}
          isSelectMode={isSelectMode}
        />
        <ClickHandler 
          onObjectClick={handleObjectClick} 
          isSelectMode={isSelectMode}
        />        <CameraController 
          selectedObjects={selectedObjects}
          onZoomToSelection={zoomToSelectionRef}
        />
          {/* Drawing components */}
        <DrawingHandler
          isDrawing={isDrawing}
          drawingMode={drawingMode}
          drawingPoints={drawingPoints}
          setDrawingPoints={setDrawingPoints}
          previewGeometry={previewGeometry}
          setPreviewGeometry={setPreviewGeometry}
          onFinishDrawing={stopDrawing}        />
        <DrawingPreview previewGeometry={previewGeometry} />
        <GridIntersectionHighlight isDrawing={isDrawing} />
        <MousePositionTracker setMousePosition={setMousePosition} isDrawing={isDrawing} />
      </Canvas>
      
      {/* Properties FloatingPanel on the right side */}
      <FloatingPanel
        title="Properties"
        icon="info-sm"
        position="right"
        topbottom="top"
        defaultWidth={320}
      >
        <InfoPanel selectionInfo={selectionInfo} />
        
        {/* Keyboard shortcuts info */}
        <div style={{ 
          margin: '16px', 
          padding: '12px', 
          backgroundColor: '#2d2d2d', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#cccccc'
        }}>          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Keyboard Shortcuts:</div>
          <div>• <strong>Tab:</strong> Toggle View/Select Mode</div>
          <div>• <strong>Delete:</strong> Delete selected objects</div>
          <div>• <strong>Ctrl+Z:</strong> Undo</div>
          <div>• <strong>Ctrl+Y:</strong> Redo</div>
          <div>• <strong>Numpad 9:</strong> Zoom to selection</div>
          <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
            History: {historyIndex + 1}/{history.length} 
            {historyIndex >= 0 && ` (Can undo: ${historyIndex + 1})`}
            {historyIndex < history.length - 1 && ` (Can redo: ${history.length - historyIndex - 1})`}
          </div>        </div>
      </FloatingPanel>
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu 
          position={{ x: contextMenu.x, y: contextMenu.y }}
          items={contextMenu.items} 
          onClose={closeContextMenu} 
        />
      )}      {/* Dimension Display */}
      <DimensionDisplay
        isDrawing={isDrawing}
        drawingMode={drawingMode}
        drawingPoints={drawingPoints}
        mousePosition={mousePosition}
        onDimensionInput={handleDimensionInput}
        setDimensionInputActive={setDimensionInputActive}
      />
    </div>
  );
}

export default SimpleTestScene;
