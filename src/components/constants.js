import * as THREE from 'three';

// Element categories for organization
export const ELEMENT_CATEGORIES = {
  STRUCTURAL: 'structural',
  ENVELOPE: 'envelope',
  OPENING: 'opening',
  FIXTURE: 'fixture'
};

// Element types within categories
export const ELEMENT_TYPES = {
  // Structural elements
  WALL: 'wall',
  COLUMN: 'column',
  BEAM: 'beam',
  SLAB: 'slab',
  
  // Envelope elements
  ROOF: 'roof',
  CEILING: 'ceiling',
  
  // Opening elements
  DOOR: 'door',
  WINDOW: 'window',
  
  // Fixture elements
  AWNING: 'awning'
};

// View types for camera controls
export const VIEW_TYPE = {
  PERSPECTIVE: 'perspective',
  FRONT: 'front', // South
  BACK: 'back',  // North
  LEFT: 'left',  // West
  RIGHT: 'right', // East
  TOP: 'top',
  BOTTOM: 'bottom'
};

// Selection states for raycast interaction
export const SELECTION_STATES = {
  NONE: 'none',
  HOVERED: 'hovered',
  SELECTED: 'selected',
  MULTI_SELECTED: 'multi-selected'
};

export const HIGHLIGHT_MATERIALS = {
  HOVER: new THREE.MeshStandardMaterial({
    color: 0x00ccff,
    emissive: 0x00ccff,
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9
  }),
  SELECTED: new THREE.MeshStandardMaterial({
    color: 0x0066ff,
    emissive: 0x0066ff,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.2,
    transparent: true,
    opacity: 0.95
  }),
  MULTI_SELECTED: new THREE.MeshStandardMaterial({
    color: 0x0033cc,
    emissive: 0x0033cc,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 1.0
  }),
  HAS_ERROR: new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.5,
    roughness: 0.5,
    metalness: 0.1,
    transparent: true,
    opacity: 0.8
  })
};

// Default object colors for different element types
export const DEFAULT_OBJECT_COLORS = {
  [ELEMENT_TYPES.WALL]: 0x505050, // Dark gray
  [ELEMENT_TYPES.COLUMN]: 0x888888, // Medium gray
  [ELEMENT_TYPES.BEAM]: 0xaaaaaa, // Light gray
  [ELEMENT_TYPES.SLAB]: 0xaaaaaa, // Concrete color
  [ELEMENT_TYPES.ROOF]: 0xcccccc, // Light concrete
  [ELEMENT_TYPES.CEILING]: 0xffffff, // White
  [ELEMENT_TYPES.DOOR]: 0x00ff00, // Green for doors
  [ELEMENT_TYPES.WINDOW]: 0x0000ff, // Blue for windows
  [ELEMENT_TYPES.AWNING]: 0xffa500 // Orange for awnings
};

// Default materials for different element types
export const DEFAULT_MATERIALS = {
  [ELEMENT_TYPES.WALL]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.WALL],
    roughness: 0.8,
    metalness: 0.1
  }),
  [ELEMENT_TYPES.COLUMN]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.COLUMN],
    roughness: 0.7,
    metalness: 0.2
  }),
  [ELEMENT_TYPES.BEAM]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.BEAM],
    roughness: 0.7,
    metalness: 0.2
  }),
  [ELEMENT_TYPES.SLAB]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.SLAB],
    roughness: 0.9,
    metalness: 0.0
  }),
  [ELEMENT_TYPES.ROOF]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.ROOF],
    roughness: 0.8,
    metalness: 0.0
  }),
  [ELEMENT_TYPES.CEILING]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.CEILING],
    roughness: 0.6,
    metalness: 0.0
  }),
  [ELEMENT_TYPES.DOOR]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.DOOR],
    roughness: 0.5,
    metalness: 0.1
  }),
  [ELEMENT_TYPES.WINDOW]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.WINDOW],
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.8
  }),
  [ELEMENT_TYPES.AWNING]: new THREE.MeshStandardMaterial({
    color: DEFAULT_OBJECT_COLORS[ELEMENT_TYPES.AWNING],
    roughness: 0.6,
    metalness: 0.0
  })
};
