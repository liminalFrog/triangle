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
  HOVER: 0x333333,
  SELECTED: 0x0088ff,
  MULTI_SELECTED: 0x00aaff
};
