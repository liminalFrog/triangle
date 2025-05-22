import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

function ContextMenu({ position, onClose, items }) {
  const menuRef = useRef(null);

  // Handle clicking outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Handle ESC key to close the menu
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  // If position is off-screen, adjust it
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedLeft = position.x;
      let adjustedTop = position.y;

      // Check if menu goes beyond the right edge
      if (position.x + menuRect.width > viewportWidth) {
        adjustedLeft = viewportWidth - menuRect.width - 10;
      }

      // Check if menu goes beyond the bottom edge
      if (position.y + menuRect.height > viewportHeight) {
        adjustedTop = viewportHeight - menuRect.height - 10;
      }

      // Apply adjusted position
      menuRef.current.style.left = `${adjustedLeft}px`;
      menuRef.current.style.top = `${adjustedTop}px`;
    }
  }, [position]);

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
  return (
    <div 
      className="context-menu" 
      ref={menuRef} 
      style={{ 
        position: 'fixed',
        left: `${position.x}px`, 
        top: `${position.y}px`,
        zIndex: 1000
      }}
    >
      {Object.entries(groupedItems).map(([category, categoryItems], index) => (
        <div key={category} className="menu-group">
          {index > 0 && <div className="menu-divider"></div>}
          <div className="menu-category">{category}</div>
          {categoryItems.map((item) => (
            <div 
              key={item.id} 
              className="menu-item"
              onClick={() => {
                item.action();
                onClose();
              }}
            >
              {item.icon && (
                <span className="menu-item-icon">
                  <img src={item.icon} alt={item.label} />
                </span>
              )}
              <span className="menu-item-label">{item.label}</span>
              {item.shortcut && (
                <span className="menu-item-shortcut">{item.shortcut}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ContextMenu;