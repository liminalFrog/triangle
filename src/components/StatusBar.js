import React from 'react';
import './StatusBar.css';

function StatusBar({ viewType = 'Perspective', mode = 'View' }) {
  return (
    <div className="status-bar">
      <div className="status-section">
        <span className="status-label">X:</span>
        <span className="status-value">0.00</span>
      </div>
      <div className="status-section">
        <span className="status-label">Y:</span>
        <span className="status-value">0.00</span>
      </div>
      <div className="status-section">
        <span className="status-label">Z:</span>
        <span className="status-value">0.00</span>
      </div>
      <div className="status-divider"></div>
      <div className="status-section">
        <span className="status-label">Mode:</span>
        <span className="status-value">{mode}</span>
      </div>
      <div className="status-section">
        <span className="status-label">View:</span>
        <span className="status-value">{viewType}</span>
      </div>
      <div className="status-section right">
        <span className="status-info">Triangle v0.1.0</span>
      </div>
    </div>
  );
}

export default StatusBar;
