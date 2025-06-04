import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Material definitions
const MATERIALS = {
  BUILDING: {
    STANDARD: new THREE.MeshStandardMaterial({ color: 0x888888 }),
    SELECTED: new THREE.MeshStandardMaterial({ color: 0x4CAF50, emissive: 0x004400 }),
    HOVERED: new THREE.MeshStandardMaterial({ color: 0x2196F3, emissive: 0x001144 })
  },
  WALL: {
    STANDARD: new THREE.MeshStandardMaterial({ color: 0x666666 }),
    SELECTED: new THREE.MeshStandardMaterial({ color: 0xFF9800, emissive: 0x442200 }),
    HOVERED: new THREE.MeshStandardMaterial({ color: 0xFFC107, emissive: 0x331100 })
  },
  ROOF: {
    STANDARD: new THREE.MeshStandardMaterial({ color: 0x444444 }),
    SELECTED: new THREE.MeshStandardMaterial({ color: 0x9C27B0, emissive: 0x220044 }),
    HOVERED: new THREE.MeshStandardMaterial({ color: 0xE91E63, emissive: 0x330011 })
  }
};

// Grid component for CAD-style visualization
function Grid({ sizeInFeet = 50 }) {
  const gridRef = useRef();
  
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.clear();
      
      const size = sizeInFeet;
      const feetGrid = new THREE.GridHelper(size, size, 0x666666, 0x444444);
      feetGrid.position.y = 0;
      
      const inchGrid = new THREE.GridHelper(size, size * 12, 0x222222, 0x222222);
      inchGrid.position.y = 0.01;
      inchGrid.material.opacity = 0.3;
      inchGrid.material.transparent = true;
      
      gridRef.current.add(feetGrid);
      gridRef.current.add(inchGrid);
    }
  }, [sizeInFeet]);
  
  return <group ref={gridRef} />;
}

// Individual Wall component with roof cutting support
function Wall({ 
  id,
  buildingId,
  position, 
  rotation, 
  dimensions, 
  properties,
  isSelected,
  isHovered,
  onWallClick,
  buildingProperties // Pass building properties for roof cutting
}) {
  const meshRef = useRef();
  const [width, height, thickness] = dimensions;
  
  // Create roof-cut wall geometry
  const wallGeometry = useMemo(() => {
    if (!buildingProperties || buildingProperties.walls.heightToEaves) {
      // Standard rectangular wall
      return new THREE.BoxGeometry(width, height, thickness);
    }
      // Create wall geometry that's cut by roof shape
    const { side } = properties;
    const { width: buildingWidth, eaveHeight } = buildingProperties;
    const roofPitch = buildingProperties.roof.pitch / 12; // Convert to decimal
      // Calculate roof cutting based on wall side
    let wallShape;
    
    if (side === 'north' || side === 'south') {
      // Front/back walls - cut by gable ends
      const roofRise = (buildingWidth / 2) * roofPitch;
      const peakHeight = eaveHeight + roofRise;
      
      wallShape = new THREE.Shape();
      wallShape.moveTo(-width / 2, 0);
      wallShape.lineTo(width / 2, 0);
      wallShape.lineTo(width / 2, eaveHeight);
      
      // Create gable cut line
      if (height > eaveHeight) {
        const cutWidth = width / 2;
        
        // Right side of gable
        wallShape.lineTo(cutWidth, eaveHeight);
        wallShape.lineTo(0, Math.min(peakHeight, height));
        wallShape.lineTo(-cutWidth, eaveHeight);
      }
      
      wallShape.lineTo(-width / 2, eaveHeight);
      wallShape.closePath();
      
      const extrudeSettings = {
        depth: thickness,
        bevelEnabled: false
      };      const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
      geometry.translate(0, -height / 2, -thickness / 2); // Center the geometry vertically
      return geometry;    } else {
      // East/West walls (eave walls) - simple rectangular walls that extend to eave height
      const eaveWallHeight = Math.min(height, eaveHeight);
      return new THREE.BoxGeometry(width, eaveWallHeight, thickness);
    }
  }, [width, height, thickness, properties, buildingProperties]);
  
  const material = isSelected ? MATERIALS.WALL.SELECTED : 
                  isHovered ? MATERIALS.WALL.HOVERED : 
                  MATERIALS.WALL.STANDARD;

  return (
    <mesh
      ref={meshRef}      position={position}
      rotation={rotation}
      geometry={wallGeometry}
      material={material.clone()}
      onClick={(e) => {
        e.stopPropagation();
        console.log('Wall clicked!', { id, buildingId, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey });
        // Extract only needed properties from the React Three Fiber event
        const eventInfo = {
          shiftKey: e.shiftKey || false,
          ctrlKey: e.ctrlKey || false
        };
        onWallClick(id, buildingId, eventInfo);
      }}
      userData={{
        type: 'wall',
        id,
        buildingId,
        selectable: true,
        properties
      }}
    />
  );
}

// Individual Roof component
function Roof({ 
  id,
  buildingId,
  position,
  dimensions,
  properties,
  isSelected,
  isHovered,
  onRoofClick
}) {
  const meshRef = useRef();
  const { shape, pitch, overhang } = properties;
  
  // Create roof geometry based on shape
  const roofGeometry = useMemo(() => {
    const [width, length] = dimensions;
    const rise = (width / 2) * (pitch / 12); // Calculate rise from pitch (in:ft ratio)
    
    switch (shape) {
      case 'gable':        const roofShape = new THREE.Shape();
        roofShape.moveTo(-length / 2, 0);
        roofShape.lineTo(length / 2, 0);
        roofShape.lineTo(length / 2, rise);
        roofShape.lineTo(0, rise * 2);
        roofShape.lineTo(-length / 2, rise);
        roofShape.closePath();
        
        const geometry = new THREE.ExtrudeGeometry(roofShape, {
          depth: width + (overhang * 2),
          bevelEnabled: false,
          curveSegments: 1
        });
        // Center the geometry - ExtrudeGeometry extrudes in +Z, but we need it centered
        geometry.translate(0, 0, -(width + (overhang * 2)) / 2);
        return geometry;
      
      case 'skillion':
        const skillionGeom = new THREE.BoxGeometry(
          width + (overhang * 2), 
          0.5, 
          length + (overhang * 2)
        );
        skillionGeom.rotateZ(Math.atan(rise / (width / 2)));
        return skillionGeom;
      
      case 'hipped':
        // TODO: Implement hipped roof geometry
        return new THREE.BoxGeometry(
          width + (overhang * 2), 
          rise, 
          length + (overhang * 2)
        );
      
      default:
        return new THREE.BoxGeometry(
          width + (overhang * 2), 
          0.5, 
          length + (overhang * 2)        );
    }
  }, [dimensions, shape, pitch, overhang]);
  
  const material = isSelected ? MATERIALS.ROOF.SELECTED : 
                  isHovered ? MATERIALS.ROOF.HOVERED : 
                  MATERIALS.ROOF.STANDARD;
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={roofGeometry}      material={material.clone()}
      onClick={(e) => {
        e.stopPropagation();
        console.log('Roof clicked!', { id, buildingId, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey });
        // Extract only needed properties from the React Three Fiber event
        const eventInfo = {
          shiftKey: e.shiftKey || false,
          ctrlKey: e.ctrlKey || false
        };
        onRoofClick(id, buildingId, eventInfo);
      }}
      userData={{
        type: 'roof',
        id,
        buildingId,
        selectable: true,
        properties
      }}
    >
    </mesh>
  );
}

// Helper function to calculate wall alignment offset
function getWallAlignmentOffset(wall, alignment, wallThickness) {
  if (alignment === 'center') {
    return { x: 0, z: 0 };
  }
  
  const offset = wallThickness / 2;
  const { side } = wall.properties;
  
  switch (alignment) {
    case 'inside':
      // Move wall inward (toward building center)
      switch (side) {
        case 'north': return { x: 0, z: -offset }; // Move south (toward center)
        case 'south': return { x: 0, z: offset };  // Move north (toward center)
        case 'east': return { x: -offset, z: 0 };  // Move west (toward center)
        case 'west': return { x: offset, z: 0 };   // Move east (toward center)
        default: return { x: 0, z: 0 };
      }
    case 'outside':
      // Move wall outward (away from building center)
      switch (side) {
        case 'north': return { x: 0, z: offset };  // Move north (away from center)
        case 'south': return { x: 0, z: -offset }; // Move south (away from center)
        case 'east': return { x: offset, z: 0 };   // Move east (away from center)
        case 'west': return { x: -offset, z: 0 };  // Move west (away from center)
        default: return { x: 0, z: 0 };
      }
    default:
      return { x: 0, z: 0 };
  }
}

// Building component - combines walls and roof
function Building({ 
  building, 
  selectedElement, 
  selectedElements = [], // Add multi-selection support
  hoveredElement,
  onElementClick,
  wallAlignments = {}
}) {
  const groupRef = useRef();
  const { id, position, properties } = building;
  const { width, length, eaveHeight, elevation } = properties;
  
  // Check if element is selected (either single or multi-selection)
  const isElementSelected = (elementId, elementType) => {
    // Check single selection
    if (selectedElement?.id === elementId) return true;
    
    // Check multi-selection
    return selectedElements.some(el => el.id === elementId && el.type === elementType);
  };
  
  // Check if entire building is selected in multi-selection
  const isBuildingSelected = selectedElements.some(el => el.id === id && el.type === 'building');

  const wallThickness = 0.5; // 6 inches
  const wallHeight = properties.walls.heightToEaves ? eaveHeight : properties.walls.height;// Calculate wall positions with alignment offsets
  const getWallHeight = (side) => {
    // East/West walls (eave walls) only extend to eave height when heightToEaves is false
    if ((side === 'east' || side === 'west') && !properties.walls.heightToEaves) {
      return Math.min(wallHeight, eaveHeight);
    }
    return wallHeight;
  };

  const walls = [
    {
      id: `${id}_wall_north`,
      position: [0, getWallHeight('north') / 2 + elevation, length / 2],
      rotation: [0, 0, 0],
      dimensions: [width, getWallHeight('north'), wallThickness],
      properties: { ...building.properties.walls, side: 'north' }
    },
    {
      id: `${id}_wall_south`,
      position: [0, getWallHeight('south') / 2 + elevation, -length / 2],
      rotation: [0, 0, 0],
      dimensions: [width, getWallHeight('south'), wallThickness],
      properties: { ...building.properties.walls, side: 'south' }
    },
    {
      id: `${id}_wall_east`,
      position: [width / 2, getWallHeight('east') / 2 + elevation, 0],
      rotation: [0, Math.PI / 2, 0],
      dimensions: [length, getWallHeight('east'), wallThickness],
      properties: { ...building.properties.walls, side: 'east' }
    },
    {
      id: `${id}_wall_west`,
      position: [-width / 2, getWallHeight('west') / 2 + elevation, 0],
      rotation: [0, Math.PI / 2, 0],
      dimensions: [length, getWallHeight('west'), wallThickness],
      properties: { ...building.properties.walls, side: 'west' }
    }
  ].map(wall => {
    const alignment = wallAlignments[wall.id] || 'center';
    const alignmentOffset = getWallAlignmentOffset(wall, alignment, wallThickness);
    
    return {
      ...wall,
      position: [
        wall.position[0] + alignmentOffset.x,
        wall.position[1],
        wall.position[2] + alignmentOffset.z
      ]
    };
  });// Calculate roof position
  const roofId = `${id}_roof`;
  const roofPosition = [0, eaveHeight + elevation, 0]; // Position at eave height, not above it
  
  return (
    <group ref={groupRef} position={position} rotation={[0, building.rotation || 0, 0]}>      {/* Render walls */}
      {walls.map(wall => (
        <Wall
          key={wall.id}
          id={wall.id}
          buildingId={id}
          position={wall.position}
          rotation={wall.rotation}
          dimensions={wall.dimensions}
          properties={wall.properties}
          isSelected={isElementSelected(wall.id, 'wall') || isBuildingSelected}
          isHovered={hoveredElement?.id === wall.id}
          onWallClick={(wallId, wallBuildingId, eventInfo) => {
            console.log('Building.onWallClick called:', { wallId, wallBuildingId, eventInfo });
            onElementClick(wallId, 'wall', wallBuildingId, eventInfo);
          }}
          buildingProperties={properties}
        />
      ))}
      
      {/* Render roof */}
      <Roof
        id={roofId}
        buildingId={id}
        position={roofPosition}
        dimensions={[width, length]}
        properties={building.properties.roof}
        isSelected={isElementSelected(roofId, 'roof') || isBuildingSelected}
        isHovered={hoveredElement?.id === roofId}
        onRoofClick={(roofId, roofBuildingId, eventInfo) => {
          console.log('Building.onRoofClick called:', { roofId, roofBuildingId, eventInfo });
          onElementClick(roofId, 'roof', roofBuildingId, eventInfo);
        }}
      />
    </group>
  );
}

// Selection and hover handler
function SelectionHandler({ 
  buildings, 
  selectedElement, 
  setSelectedElement,
  selectedElements = [], // Add multi-selection support
  setSelectedElements,
  hoveredElement,
  setHoveredElement,
  tabCycleEnabled,
  setTabCycleEnabled,
  wallAlignments,
  setWallAlignments
}) {
  const { scene, raycaster, camera, mouse } = useThree();
  const [selectableElements, setSelectableElements] = useState([]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const lastMousePos = useRef(new THREE.Vector2(-999, -999));
  
  // Update selectable elements when hovering
  useFrame(() => {
    // Only update hover if not in tab cycling mode and mouse has moved
    const mouseMoved = Math.abs(mouse.x - lastMousePos.current.x) > 0.001 || 
                      Math.abs(mouse.y - lastMousePos.current.y) > 0.001;
    
    if (!mouseMoved && tabCycleEnabled) return; // Don't interfere with tab cycling
    
    lastMousePos.current.copy(mouse);
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Find all selectable objects under cursor
    const selectables = intersects
      .filter(intersect => intersect.object.userData?.selectable)
      .map(intersect => ({
        object: intersect.object,
        userData: intersect.object.userData
      }));
    
    setSelectableElements(selectables);
    
    // Only update hover if not in tab cycling mode
    if (!tabCycleEnabled) {
      if (selectables.length > 0) {
        // Default hover behavior - highlight the building first
        const buildingElement = selectables.find(s => s.userData.type === 'building') || selectables[0];
        if (buildingElement && hoveredElement?.id !== buildingElement.userData.id) {
          setHoveredElement({
            id: buildingElement.userData.id,
            type: buildingElement.userData.type,
            buildingId: buildingElement.userData.buildingId
          });
        }
      } else {
        setHoveredElement(null);
      }
    }
  });
    // Handle Tab key cycling
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle Tab for wall alignment when a wall is selected
      if (event.key === 'Tab' && selectedElement?.type === 'wall') {
        event.preventDefault();
        
        const wallId = selectedElement.id;
        const currentAlignment = wallAlignments[wallId] || 'center';
        const alignments = ['center', 'inside', 'outside'];
        const currentIndex = alignments.indexOf(currentAlignment);
        const nextIndex = (currentIndex + 1) % alignments.length;
        const nextAlignment = alignments[nextIndex];
        
        setWallAlignments(prev => ({
          ...prev,
          [wallId]: nextAlignment
        }));
        
        return;
      }
      
      // Original Tab cycling logic for element selection
      if (event.key === 'Tab' && selectableElements.length > 0) {
        event.preventDefault();
        
        if (!tabCycleEnabled) {
          // Start tab cycling
          setTabCycleEnabled(true);
          setCurrentTabIndex(0);
          
          // Highlight the first element (building)
          const element = selectableElements[0];
          setHoveredElement({
            id: element.userData.id,
            type: element.userData.type,
            buildingId: element.userData.buildingId
          });
        } else {
          // Continue cycling
          const nextIndex = (currentTabIndex + 1) % selectableElements.length;
          setCurrentTabIndex(nextIndex);
          
          const element = selectableElements[nextIndex];
          setHoveredElement({
            id: element.userData.id,
            type: element.userData.type,
            buildingId: element.userData.buildingId
          });
        }
      }
    };
    
    const handleMouseMove = () => {
      // Reset tab cycling when mouse moves significantly
      if (tabCycleEnabled) {
        setTabCycleEnabled(false);
        setCurrentTabIndex(0);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
      return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [selectableElements, currentTabIndex, tabCycleEnabled, setHoveredElement, setTabCycleEnabled, selectedElement, wallAlignments, setWallAlignments]);
  
  return null;
}

// Mouse tracking for placement mode
function MouseTracker({ placementMode, setMousePosition, placementAlignment, placementRotation, placementBuilding }) {
  const { raycaster, camera, mouse } = useThree();
  
  useFrame(() => {
    if (!placementMode || !placementBuilding) return;
    
    // Cast ray to ground plane (y = 0)
    raycaster.setFromCamera(mouse, camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);
    
    if (intersection) {
      // Snap to grid (1 foot intervals)
      let snappedX = Math.round(intersection.x);
      let snappedZ = Math.round(intersection.z);      // Apply alignment offset based on current alignment mode
      const wallThickness = 0.5; // 6 inches
      
      // Calculate alignment offsets - account for rotation
      let offsetX = 0, offsetZ = 0;
      
      if (placementAlignment !== 'center') {
        const offset = wallThickness / 2;
        const multiplier = placementAlignment === 'inside' ? 1 : -1; // inside moves inward, outside moves outward
        
        // Apply offset based on rotation - we need to consider which wall face should align with grid
        // For 0 rotation (building aligned with axes):
        // - Inside: building moves +offset so inside faces align with grid 
        // - Outside: building moves -offset so outside faces align with grid
        
        // Rotate the offset vector by the placement rotation
        const cos = Math.cos(placementRotation);
        const sin = Math.sin(placementRotation);
        
        // Base offset vector (for 0 rotation)
        const baseOffsetX = multiplier * offset;
        const baseOffsetZ = multiplier * offset;
        
        // Rotate the offset to match building orientation
        offsetX = baseOffsetX * cos - baseOffsetZ * sin;
        offsetZ = baseOffsetX * sin + baseOffsetZ * cos;
      }
      // For 'center', no offset needed - walls center on grid
      
      setMousePosition([snappedX + offsetX, 0, snappedZ + offsetZ]);
    }
  });
  
  return null;
}

// Placement building preview
function PlacementPreview({ 
  placementBuilding, 
  mousePosition, 
  placementRotation, 
  placementMode 
}) {
  if (!placementMode || !placementBuilding) return null;
  
  // Create translucent white materials
  const placementMaterials = {
    WALL: new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5,
      emissive: 0x111111
    }),
    ROOF: new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5,
      emissive: 0x111111
    })
  };
  
  return (
    <group 
      position={mousePosition} 
      rotation={[0, placementRotation, 0]}
    >
      <PlacementBuilding 
        building={placementBuilding}
        materials={placementMaterials}
      />
    </group>
  );
}

// Placement building component (simplified version without interaction)
function PlacementBuilding({ building, materials }) {
  const { properties } = building;
  const { width, length, eaveHeight, elevation } = properties;
    const wallThickness = 0.5;
  const wallHeight = properties.walls.heightToEaves ? eaveHeight : properties.walls.height;
  // Calculate wall positions
  const getPlacementWallHeight = (side) => {
    // East/West walls (eave walls) only extend to eave height when heightToEaves is false
    if ((side === 'east' || side === 'west') && !properties.walls.heightToEaves) {
      return Math.min(wallHeight, eaveHeight);
    }
    return wallHeight;
  };

  const walls = [
    {
      position: [0, getPlacementWallHeight('north') / 2 + elevation, length / 2],
      rotation: [0, 0, 0],
      dimensions: [width, getPlacementWallHeight('north'), wallThickness],
      side: 'north'
    },
    {
      position: [0, getPlacementWallHeight('south') / 2 + elevation, -length / 2],
      rotation: [0, 0, 0],
      dimensions: [width, getPlacementWallHeight('south'), wallThickness],
      side: 'south'
    },
    {
      position: [width / 2, getPlacementWallHeight('east') / 2 + elevation, 0],
      rotation: [0, Math.PI / 2, 0],
      dimensions: [length, getPlacementWallHeight('east'), wallThickness],
      side: 'east'
    },
    {
      position: [-width / 2, getPlacementWallHeight('west') / 2 + elevation, 0],
      rotation: [0, Math.PI / 2, 0],
      dimensions: [length, getPlacementWallHeight('west'), wallThickness],
      side: 'west'
    }
  ];

  // Create placement wall geometry with roof cutting
  const createPlacementWallGeometry = (wall) => {
    const [wallWidth, wallHeightDim, thickness] = wall.dimensions;
    
    if (properties.walls.heightToEaves) {
      return new THREE.BoxGeometry(wallWidth, wallHeightDim, thickness);
    }
    
    // Create roof-cut geometry for placement preview
    const { side } = wall;
    const roofPitch = properties.roof.pitch / 12;
    
    if (side === 'north' || side === 'south') {
      // Front/back walls - cut by gable ends
      const roofRise = (width / 2) * roofPitch;
      const peakHeight = eaveHeight + roofRise;
      
      const wallShape = new THREE.Shape();
      wallShape.moveTo(-wallWidth / 2, 0);
      wallShape.lineTo(wallWidth / 2, 0);
      wallShape.lineTo(wallWidth / 2, eaveHeight);
      
      // Create gable cut line
      if (wallHeightDim > eaveHeight) {
        const cutWidth = wallWidth / 2;
        
        // Right side of gable
        wallShape.lineTo(cutWidth, eaveHeight);
        wallShape.lineTo(0, Math.min(peakHeight, wallHeightDim));
        wallShape.lineTo(-cutWidth, eaveHeight);
      }
      
      wallShape.lineTo(-wallWidth / 2, eaveHeight);
      wallShape.closePath();
      
      const extrudeSettings = {
        depth: thickness,
        bevelEnabled: false
      };      const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
      geometry.translate(0, -wallHeightDim / 2, -thickness / 2); // Center the geometry vertically
      return geometry;    } else {
      // East/West walls (eave walls) - extend to eave height only
      const eaveWallHeight = Math.min(wallHeightDim, eaveHeight);
      return new THREE.BoxGeometry(wallWidth, eaveWallHeight, thickness);
    }
  };

  // Roof geometry - correct positioning and shape
  const roofPitch = properties.roof.pitch; // 3:12 pitch
  const roofRise = (width / 2) * (roofPitch / 12); // Rise = run * (pitch/12)
  const roofPosition = [0, eaveHeight + elevation, 0]; // Position at eave height, not above it
  // Create proper gable roof shape
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-length / 2, 0);
  roofShape.lineTo(length / 2, 0);
  roofShape.lineTo(length / 2, roofRise);
  roofShape.lineTo(0, roofRise * 2);
  roofShape.lineTo(-length / 2, roofRise);
  roofShape.closePath();
    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
    depth: width + (properties.roof.overhang * 2), // Add overhang
    bevelEnabled: false,
    curveSegments: 1 // Ensure clean geometry
  });
  
  // Center the geometry - ExtrudeGeometry extrudes in +Z, but we need it centered
  roofGeometry.translate(0, 0, -(width + (properties.roof.overhang * 2)) / 2);

  return (
    <group>
      {/* Walls */}
      {walls.map((wall, index) => (
        <mesh
          key={`placement-wall-${index}`}
          position={wall.position}
          rotation={wall.rotation}
          material={materials.WALL}
          geometry={createPlacementWallGeometry(wall)}
        />
      ))}
        {/* Roof */}
      <mesh
        position={roofPosition}
        material={materials.ROOF}
        geometry={roofGeometry}
      >
      </mesh>
    </group>
  );
}

// Placement controls handler
function PlacementControls({ 
  placementMode, 
  placeBuildingAtPosition, 
  cancelPlacement, 
  setPlacementRotation,
  placementAlignment,
  setPlacementAlignment
}) {
  useEffect(() => {
    if (!placementMode) return;
      const handleKeyDown = (event) => {
      switch (event.key) {
        case ' ': // Spacebar - rotate
          event.preventDefault();
          setPlacementRotation(prev => (prev + Math.PI / 2) % (Math.PI * 2));
          break;
        case 'Tab': // Tab - cycle wall alignment
          event.preventDefault();
          setPlacementAlignment(prev => {
            const alignments = ['center', 'inside', 'outside'];
            const currentIndex = alignments.indexOf(prev);
            const nextIndex = (currentIndex + 1) % alignments.length;
            return alignments[nextIndex];
          });
          break;
        case 'Escape': // Escape - cancel
          event.preventDefault();
          cancelPlacement();
          break;
        default:
          // No action for other keys
          break;
      }
    };
    
    const handleClick = (event) => {
      // Only handle clicks on canvas area, not UI
      if (event.target.tagName === 'CANVAS') {
        placeBuildingAtPosition();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
      return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [placementMode, placeBuildingAtPosition, cancelPlacement, setPlacementRotation, setPlacementAlignment]);
  
  return null;
}

// Main Building Scene component
function BuildingScene({ onSetPlacementTrigger }) {  const [buildings, setBuildings] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]); // For multi-selection
  const [hoveredElement, setHoveredElement] = useState(null);
  const [tabCycleEnabled, setTabCycleEnabled] = useState(false);
  const [nextBuildingId, setNextBuildingId] = useState(1);
  
  // Placement mode state
  const [placementMode, setPlacementMode] = useState(false);
  const [placementBuilding, setPlacementBuilding] = useState(null);
  const [placementRotation, setPlacementRotation] = useState(0);
  const [mousePosition, setMousePosition] = useState([0, 0, 0]);
  const [placementAlignment, setPlacementAlignment] = useState('center'); // 'inside', 'center', 'outside'
  
  // Wall alignment state for selected walls
  const [wallAlignments, setWallAlignments] = useState({}); // wallId -> alignment
    // Start building placement mode
  const startBuildingPlacement = useCallback(() => {
    const newBuilding = {
      id: `building_${nextBuildingId}`,
      position: [0, 0, 0],      properties: {
        width: 10,
        length: 10, 
        eaveHeight: 10,
        elevation: 0,
        walls: {
          visibility: true,
          wainscot: false,
          girtType: 'standard',
          girtWidth: 6,
          sheetingType: 'corrugated',
          exteriorMaterial: 'galvalume',
          interiorMaterial: 'matte_white',
          heightToEaves: false, // Walls extend past eaves
          height: 12 // Extend walls 2 feet past eaves for roof cutting
        },roof: {
          shape: 'gable',
          exteriorMaterial: 'galvalume',
          pitch: 3, // 3:12 pitch
          overhang: 0, // Removed overhang for better visibility
          soffit: true,
          soffitMaterial: 'matte_white',
          purlinType: 'standard',
          purlinThickness: 0.25
        }
      }
    };
      setPlacementBuilding(newBuilding);
    setPlacementMode(true);
    setPlacementRotation(0);
    setPlacementAlignment('center'); // Reset to center alignment
  }, [nextBuildingId]);
  
  // Register the placement function with parent
  useEffect(() => {
    if (onSetPlacementTrigger) {
      onSetPlacementTrigger(() => startBuildingPlacement);
    }
  }, [onSetPlacementTrigger, startBuildingPlacement]);
  
  // Place the building at current mouse position
  const placeBuildingAtPosition = useCallback(() => {
    if (placementBuilding) {
      const finalBuilding = {
        ...placementBuilding,
        position: [...mousePosition],
        rotation: placementRotation
      };
      
      setBuildings(prev => [...prev, finalBuilding]);
      setNextBuildingId(prev => prev + 1);
      setPlacementMode(false);
      setPlacementBuilding(null);
      setPlacementRotation(0);
    }
  }, [placementBuilding, mousePosition, placementRotation]);
    // Cancel placement mode
  const cancelPlacement = useCallback(() => {
    setPlacementMode(false);
    setPlacementBuilding(null);
    setPlacementRotation(0);
    setPlacementAlignment('center');
  }, []);
  // Add keyboard event handler for Esc key deselection
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Esc key - clear all selections
      if (event.key === 'Escape') {
        event.preventDefault();
        console.log('Esc pressed: Clearing all selections');
        setSelectedElement(null);
        setSelectedElements([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle element selection with multi-selection support
  const handleElementClick = useCallback((elementId, elementType, buildingId, event = null) => {
    // Debug logging
    console.log('handleElementClick called:', {
      elementId,
      elementType,
      buildingId,
      event,
      shiftKey: event?.shiftKey,
      ctrlKey: event?.ctrlKey
    });
    
    const isShiftClick = event?.shiftKey;
    const isCtrlShiftClick = event?.ctrlKey && event?.shiftKey;
    
    console.log('Click type detected:', {
      isShiftClick,
      isCtrlShiftClick,
      regularClick: !isShiftClick && !isCtrlShiftClick
    });
    
    if (!elementId) {
      // Click-off deselection: Clear all selections when clicking empty space
      console.log('Click-off detected: Clearing all selections');
      setSelectedElement(null);
      setSelectedElements([]);
      return;
    }

    if (isCtrlShiftClick) {
      // Ctrl+Shift+Click: Select/deselect entire building
      const newElement = {
        id: buildingId,
        type: 'building',
        buildingId: buildingId
      };
      
      setSelectedElements(prev => {
        const isAlreadySelected = prev.some(el => el.id === buildingId && el.type === 'building');
        if (isAlreadySelected) {
          // Remove building from selection
          return prev.filter(el => !(el.id === buildingId && el.type === 'building'));
        } else {
          // Add building to selection
          return [...prev, newElement];
        }
      });
      
      // Clear single selection when multi-selecting
      setSelectedElement(null);
    } else if (isShiftClick) {
      // Shift+Click: Add/remove individual element to multi-selection
      const newElement = {
        id: elementId,
        type: elementType,
        buildingId: buildingId
      };
      
      setSelectedElements(prev => {
        const isAlreadySelected = prev.some(el => el.id === elementId && el.type === elementType);
        if (isAlreadySelected) {
          // Remove element from selection
          return prev.filter(el => !(el.id === elementId && el.type === elementType));
        } else {
          // Add element to selection
          return [...prev, newElement];
        }
      });
      
      // Clear single selection when multi-selecting
      setSelectedElement(null);
    } else {
      // Regular click: Single selection
      setSelectedElement({
        id: elementId,
        type: elementType,
        buildingId: buildingId
      });
      setSelectedElements([]); // Clear multi-selection
    }
  }, []);
  // Click handler component for detecting clicks on empty space
  function ClickHandler({ onElementClick }) {
    const { scene, raycaster, camera, mouse } = useThree();
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
    
    const handlePointerDown = useCallback((event) => {
      setIsMouseDown(true);
      setMouseDownPos({ x: event.clientX, y: event.clientY });
    }, []);
    
    const handlePointerUp = useCallback((event) => {
      if (!isMouseDown) return;
      
      // Check if this was a click (not a drag)
      const deltaX = Math.abs(event.clientX - mouseDownPos.x);
      const deltaY = Math.abs(event.clientY - mouseDownPos.y);
      const isClick = deltaX < 5 && deltaY < 5; // 5px tolerance for click vs drag
      
      if (isClick) {
        // Manually perform raycasting using current mouse position
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Find the first selectable object
        const firstSelectableIntersect = intersects.find(intersect => {
          return intersect.object.userData?.selectable;
        });
        
        // Check if modifier keys are pressed
        const isShiftClick = event.shiftKey;
        const isCtrlShiftClick = event.ctrlKey && event.shiftKey;
        
        if (!firstSelectableIntersect) {
          // Clicked on empty space - only clear if no modifier keys
          if (!isShiftClick && !isCtrlShiftClick && !event.altKey) {
            console.log('Empty space click detected: Clearing selections');
            onElementClick(null, null, null, { shiftKey: false, ctrlKey: false });
          }
        }
        // If we found a selectable object, let the mesh onClick handler deal with it
      }
      
      setIsMouseDown(false);
    }, [scene, raycaster, camera, mouse, onElementClick, isMouseDown, mouseDownPos]);
    
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
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>      {/* Debug UI */}
      {(selectedElement || selectedElements.length > 0 || hoveredElement || placementMode) && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          fontSize: '12px'
        }}>
          {placementMode && (
            <div style={{ marginBottom: '8px', color: '#4CAF50' }}>
              <div>Placement Mode: Building</div>
              <div>Alignment: {placementAlignment}</div>
              <div>Rotation: {Math.round(placementRotation * 180 / Math.PI)}°</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>
                Spacebar: Rotate | Tab: Cycle Alignment | Esc: Cancel
              </div>
            </div>
          )}
          
          {selectedElement && (
            <div style={{ marginBottom: '8px' }}>
              <div>Selected: {selectedElement.type} ({selectedElement.id})</div>
              <div>Building: {selectedElement.buildingId}</div>
              {selectedElement.type === 'wall' && (
                <div>
                  <div>Alignment: {wallAlignments[selectedElement.id] || 'center'}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>Tab: Cycle Alignment</div>
                </div>
              )}
            </div>
          )}
          
          {selectedElements.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#FF9800' }}>Multi-Selection ({selectedElements.length}):</div>
              {selectedElements.map((el, index) => (
                <div key={index} style={{ fontSize: '10px', opacity: 0.8, marginLeft: '10px' }}>
                  {el.type}: {el.id}
                </div>
              ))}              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                Shift+Click: Select elements | Ctrl+Shift+Click: Select buildings<br/>
                Esc: Clear selection | Click empty space: Clear selection
              </div>
            </div>
          )}
          
          {hoveredElement && !selectedElement && selectedElements.length === 0 && (
            <div style={{ opacity: 0.7 }}>
              <div>Hovered: {hoveredElement.type} ({hoveredElement.id})</div>
              {tabCycleEnabled && <div>Tab cycling enabled</div>}
            </div>
          )}
        </div>      )}
      
      {/* 3D Scene */}
      <Canvas
        camera={{ 
          position: [30, 25, 30], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}        shadows
        tabIndex={0} // Make canvas focusable
        style={{ outline: 'none' }} // Remove focus outline
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Grid */}
        <Grid sizeInFeet={100} />
          {/* Buildings */}        {buildings.map(building => (
          <Building
            key={building.id}
            building={building}
            selectedElement={selectedElement}
            selectedElements={selectedElements}
            hoveredElement={hoveredElement}
            onElementClick={handleElementClick}
            wallAlignments={wallAlignments}
          />
        ))}        {/* Selection and interaction handlers */}
        <ClickHandler onElementClick={handleElementClick} />
        <SelectionHandler
          buildings={buildings}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          selectedElements={selectedElements}
          setSelectedElements={setSelectedElements}
          hoveredElement={hoveredElement}
          setHoveredElement={setHoveredElement}
          tabCycleEnabled={tabCycleEnabled}
          setTabCycleEnabled={setTabCycleEnabled}
          wallAlignments={wallAlignments}
          setWallAlignments={setWallAlignments}
        />
        {/* Removed global ClickHandler - using mesh onClick handlers instead */}
          {/* Placement system components */}
        <MouseTracker 
          placementMode={placementMode}
          setMousePosition={setMousePosition}
          placementAlignment={placementAlignment}
          placementRotation={placementRotation}
          placementBuilding={placementBuilding}
        />
        
        <PlacementPreview
          placementBuilding={placementBuilding}
          mousePosition={mousePosition}
          placementRotation={placementRotation}
          placementMode={placementMode}
        />
        
        <PlacementControls
          placementMode={placementMode}
          placeBuildingAtPosition={placeBuildingAtPosition}
          cancelPlacement={cancelPlacement}
          setPlacementRotation={setPlacementRotation}
          placementAlignment={placementAlignment}
          setPlacementAlignment={setPlacementAlignment}
        />
      </Canvas>
    </div>
  );
}

export default BuildingScene;
