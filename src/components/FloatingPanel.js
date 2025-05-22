import React, { useState, useRef, useEffect } from 'react';
import './FloatingPanel.css';

function FloatingPanel({ title, position, topbottom, defaultWidth, children }) {
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef(null);
  const resizerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Handle resize dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Set up and clean up event listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRef.current && panelRef.current) {
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
      isDraggingRef.current = false;
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position]); // Only re-run if position changes

  return (
    <div 
      className={`floating-panel ${position} ${topbottom} ${isCollapsed ? 'collapsed' : ''}`} 
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
