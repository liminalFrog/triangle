import React from 'react';
import './InfoPanel.css';

function InfoPanel() {
  return (
    <div className="info-panel">
      <div className="panel-section">
        <h3 className="panel-section-title">Properties</h3>
        <div className="property-list">
          <div className="property-row">
            <span className="property-name">Position</span>
            <div className="property-values">
              <div className="property-value">X: 0.00</div>
              <div className="property-value">Y: 0.00</div>
              <div className="property-value">Z: 0.00</div>
            </div>
          </div>
          <div className="property-row">
            <span className="property-name">Rotation</span>
            <div className="property-values">
              <div className="property-value">X: 0.00</div>
              <div className="property-value">Y: 0.00</div>
              <div className="property-value">Z: 0.00</div>
            </div>
          </div>
          <div className="property-row">
            <span className="property-name">Scale</span>
            <div className="property-values">
              <div className="property-value">X: 1.00</div>
              <div className="property-value">Y: 1.00</div>
              <div className="property-value">Z: 1.00</div>
            </div>
          </div>
        </div>
      </div>
      <div className="panel-section">
        <h3 className="panel-section-title">Materials</h3>
        <div className="material-list">
          <div className="material-item">
            <div className="material-color" style={{ backgroundColor: '#4682b4' }}></div>
            <span className="material-name">Steel Blue</span>
          </div>
          <div className="material-item">
            <div className="material-color" style={{ backgroundColor: '#8b4513' }}></div>
            <span className="material-name">Saddle Brown</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoPanel;
