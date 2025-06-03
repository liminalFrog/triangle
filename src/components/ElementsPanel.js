import React from 'react';
import './ElementsPanel.css';

function ElementsPanel({ onStartBuildingPlacement }) {  // Handle click on a library object
  const handleLibraryItemClick = (objectType) => {
    console.log(`Selected library item: ${objectType}`);
    
    // Handle specific object types
    if (objectType === 'Building' && onStartBuildingPlacement) {
      onStartBuildingPlacement();
      // Remove focus from the button immediately
      setTimeout(() => document.activeElement?.blur(), 0);
    }
    
    // This function would eventually add other objects to the scene
  };

  return (
    <div className="elements-panel">
      <div className="panel-section">
        <h3 className="panel-section-title">Scene Objects</h3>
        <div className="object-list">
          <div className="object-item">
            <span className="object-icon">▭</span>
            <span className="object-name">Ground</span>
          </div>
          <div className="object-item">
            <span className="object-icon">◎</span>
            <span className="object-name">Light_001</span>
          </div>
          <div className="object-item">
            <span className="object-icon">⚲</span>
            <span className="object-name">Camera</span>
          </div>
        </div>
      </div>
      <div className="panel-section">
        <h3 className="panel-section-title">Library</h3>
        <div className="icon-grid">          <button 
            className="icon-button" 
            title="Building"
            onClick={() => handleLibraryItemClick('Building')}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus
            style={{ outline: 'none' }} // Remove focus outline
          >
            <img src="/icons/building.png" alt="Building" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Wall"
            onClick={() => handleLibraryItemClick('Wall')}
          >
            <img src="/icons/wall.png" alt="Wall" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Awning"
            onClick={() => handleLibraryItemClick('Awning')}
          >
            <img src="/icons/awning.png" alt="Awning" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Walk Door"
            onClick={() => handleLibraryItemClick('Door')}
          >
            <img src="/icons/door.png" alt="Walk Door" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Window"
            onClick={() => handleLibraryItemClick('Window')}
          >
            <img src="/icons/window.png" alt="Window" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Roll-up Door"
            onClick={() => handleLibraryItemClick('RollupDoor')}
          >
            <img src="/icons/rollup.png" alt="Roll-up Door" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Track Door"
            onClick={() => handleLibraryItemClick('TrackDoor')}
          >
            <img src="/icons/track.png" alt="Track Door" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Fan"
            onClick={() => handleLibraryItemClick('Fan')}
          >
            <img src="/icons/fan.png" alt="Fan" className="icon-image" />
          </button>
          <button 
            className="icon-button" 
            title="Opening"
            onClick={() => handleLibraryItemClick('Opening')}
          >
            <img src="/icons/opening.png" alt="Opening" className="icon-image" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ElementsPanel;
