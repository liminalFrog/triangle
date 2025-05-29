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

// Selection colors for visual feedback
export const SELECTION_COLORS = {
  HOVER: 0x00ccff,   // Bright blue for hover
  SELECTED: 0x0066ff, // Deeper blue for selection
  MULTI_SELECTED: 0x0033cc // Dark blue for multi-selection
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
