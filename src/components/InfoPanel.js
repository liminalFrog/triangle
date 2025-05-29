import React from 'react';
import './InfoPanel.css';

function InfoPanel({ selectionInfo }) {
  // If no element is selected, show default info
  if (!selectionInfo) {
    return (
      <div className="info-panel">
        <div className="panel-section">
          <h3 className="panel-section-title">Properties</h3>
          <div className="property-list">
            <div className="property-info">
              <span>No element selected</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // For multi-selection, display count and type information
  if (selectionInfo.multiSelection) {
    const { count, category, type, subtype } = selectionInfo;
    
    return (
      <div className="info-panel multi-selection">
        <div className="panel-section">
          <h3 className="panel-section-title">Multiple Selection</h3>
          <div className="property-list">
            <div className="property-row">
              <span className="property-name">Count</span>
              <div className="property-value">{count} elements</div>
            </div>
            <div className="property-row">
              <span className="property-name">Category</span>
              <div className="property-value">{category}</div>
            </div>
            <div className="property-row">
              <span className="property-name">Type</span>
              <div className="property-value">{type}</div>
            </div>
            <div className="property-row">
              <span className="property-name">Subtype</span>
              <div className="property-value">{subtype}</div>
            </div>
          </div>
        </div>
        
        <div className="panel-section">
          <h3 className="panel-section-title">Selection Info</h3>
          <div className="property-list">
            <div className="property-info">
              <span>Multiple elements selected. Use the SS shortcut to select all elements of this type.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For single selection, display element properties
  const { category, type, subtype, properties } = selectionInfo;
  
  // Helper function to format property values for display
  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.map(v => typeof v === 'number' ? v.toFixed(2) : v).join(', ');
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return value.toString();
  };

  return (
    <div className="info-panel">
      <div className="panel-section">
        <h3 className="panel-section-title">Element Info</h3>
        <div className="property-list">
          <div className="property-row">
            <span className="property-name">Category</span>
            <div className="property-value">{category}</div>
          </div>
          <div className="property-row">
            <span className="property-name">Type</span>
            <div className="property-value">{type}</div>
          </div>
          <div className="property-row">
            <span className="property-name">Subtype</span>
            <div className="property-value">{subtype}</div>
          </div>
        </div>
      </div>
      
      <div className="panel-section">
        <h3 className="panel-section-title">Properties</h3>
        <div className="property-list">
          {properties && Object.entries(properties).map(([key, value]) => (
            <div className="property-row" key={key}>
              <span className="property-name">{key}</span>
              <div className="property-value">{formatValue(value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InfoPanel;
