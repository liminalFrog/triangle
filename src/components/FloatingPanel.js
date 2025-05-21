import React, { useState, useRef, useEffect } from 'react';
import './FloatingPanel.css';

function FloatingPanel({ title, position, defaultWidth, children }) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef(null);
  const resizerRef = useRef(null);

  // Handle resize dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isDragging && panelRef.current) {
      // Calculate new width based on mouse position and panel position
      let newWidth;
      
      if (position === 'left') {
        newWidth = e.clientX - panelRef.current.getBoundingClientRect().left;
      } else { // right
        newWidth = panelRef.current.getBoundingClientRect().right - e.clientX;
      }
      
      // Set a minimum width to ensure panel is always usable
      if (newWidth >= 100) {
        setWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div 
      className={`floating-panel ${position} ${isCollapsed ? 'collapsed' : ''}`} 
      ref={panelRef}
      style={{ width: isCollapsed ? 'auto' : `${width}px` }}
    >
      <div className="panel-header">
        <button 
          className="collapse-button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '>' : '<'}
        </button>
        <span className="panel-title">{title}</span>
        <div className="panel-controls">
          {/* Panel-specific controls can go here */}
        </div>
      </div>
      {!isCollapsed && (
        <>
          <div className="panel-content">
            {children}
          </div>
          <div 
            className={`panel-resizer ${position}`}
            ref={resizerRef}
            onMouseDown={handleMouseDown}
          >
            <div className="resizer-handle"></div>
          </div>
        </>
      )}
    </div>
  );
}

export default FloatingPanel;
