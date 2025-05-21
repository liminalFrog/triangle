import React from 'react';
import './ElementsPanel.css';

function ElementsPanel() {
  return (
    <div className="elements-panel">
      <div className="panel-section">
        <h3 className="panel-section-title">Scene Objects</h3>
        <div className="object-list">
          <div className="object-item">
            <span className="object-icon">□</span>
            <span className="object-name">Building</span>
          </div>
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
        <div className="library-categories">
          <div className="category-item">Buildings</div>
          <div className="category-item">Furniture</div>
          <div className="category-item">Decorations</div>
          <div className="category-item">Lighting</div>
        </div>
      </div>
    </div>
  );
}

export default ElementsPanel;
