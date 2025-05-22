import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import path from 'path-browserify';
import './TitleBar.css';
import { CgMathMinus, CgMaximize, CgClose } from 'react-icons/cg';

const electron = window.electron;
const ipcRenderer = electron ? electron.ipcRenderer : null;

function TitleBar({ currentFile, dirty }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const menuRef = useRef(null);

  // Clear focus when clicking outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveDropdown(null);
        // Ensure all focused elements are blurred
        if (document.activeElement) {
          document.activeElement.blur();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to handle menu item selection and focus cleanup
  const handleMenuItemSelection = (callback) => {
    return () => {
      // Execute the callback function
      callback();
      
      // Close the dropdown
      setActiveDropdown(null);
      
      // Remove focus from any active element
      if (document.activeElement) {
        document.activeElement.blur();
      }
      
      // Set focus to the main container to ensure no menu items remain focused
      if (menuRef.current) {
        menuRef.current.focus();
      }
    };
  };

  // Handling window controls
  const handleMinimize = () => {
    if (ipcRenderer) {
      ipcRenderer.send('window-minimize');
    }
  };

  const handleMaximize = () => {
    if (ipcRenderer) {
      ipcRenderer.send('window-maximize');
    }
  };

  const handleClose = () => {
    if (ipcRenderer) {
      ipcRenderer.send('window-close');
    }
  };

  // Get the filename from the path or show Untitled
  const getFilename = () => {
    if (!currentFile) return 'Untitled';
    try {
      return path.basename(currentFile) + (dirty ? ' *' : '');
    } catch (error) {
      return currentFile.split(/[\\/]/).pop() + (dirty ? ' *' : '');
    }
  };
  
  // Base menu action handlers
  const baseHandleNewFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-new');
    }
  };

  const baseHandleOpenFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-open');
    }
  };

  const baseHandleSaveFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-save');
    }
  };

  const baseHandleSaveAsFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-save-as');
    }
  };

  const baseHandleExit = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-exit');
    }
  };

  const baseHandleUndo = () => {
    // Implement undo functionality
    console.log('Undo');
  };

  const baseHandleRedo = () => {
    // Implement redo functionality
    console.log('Redo');
  };

  const baseHandlePreferences = () => {
    // Open preferences dialog
    console.log('Preferences');
  };

  const baseHandleFullscreen = () => {
    if (ipcRenderer) {
      ipcRenderer.send('toggle-fullscreen');
    }
  };

  const baseHandleTogglePerspective = () => {
    // Toggle between perspective and orthographic camera
    console.log('Toggle Perspective/Orthographic');
  };

  const baseHandleSaveCameraPosition = (position) => {
    // Save camera position at slot 0-9
    console.log(`Save camera position ${position}`);
  };

  const baseHandleAddObject = (objectType) => {
    // Add object to scene
    console.log(`Add ${objectType}`);
  };

  const baseHandleRender = () => {
    // Render the scene
    console.log('Render');
  };

  const baseHandleRenderSettings = () => {
    // Open render settings
    console.log('Render Settings');
  };

  const baseHandleHelp = () => {
    // Open help documentation
    console.log('Help');
  };

  const baseHandleAbout = () => {
    // Show about dialog
    console.log('About Triangle');
  };

  // Wrapped handlers with focus management
  const handleNewFile = handleMenuItemSelection(baseHandleNewFile);
  const handleOpenFile = handleMenuItemSelection(baseHandleOpenFile);
  const handleSaveFile = handleMenuItemSelection(baseHandleSaveFile);
  const handleSaveAsFile = handleMenuItemSelection(baseHandleSaveAsFile);
  const handleExit = handleMenuItemSelection(baseHandleExit);
  const handleUndo = handleMenuItemSelection(baseHandleUndo);
  const handleRedo = handleMenuItemSelection(baseHandleRedo);
  const handlePreferences = handleMenuItemSelection(baseHandlePreferences);
  const handleFullscreen = handleMenuItemSelection(baseHandleFullscreen);
  const handleTogglePerspective = handleMenuItemSelection(baseHandleTogglePerspective);
  const handleRender = handleMenuItemSelection(baseHandleRender);
  const handleRenderSettings = handleMenuItemSelection(baseHandleRenderSettings);
  const handleHelp = handleMenuItemSelection(baseHandleHelp);
  const handleAbout = handleMenuItemSelection(baseHandleAbout);
  
  // For functions with parameters, we need to create closures
  const handleSaveCameraPosition = (position) => 
    handleMenuItemSelection(() => baseHandleSaveCameraPosition(position))();
  
  const handleAddObject = (objectType) => 
    handleMenuItemSelection(() => baseHandleAddObject(objectType))();

  return (
    <div className="title-bar" data-bs-theme="dark">
      <div className="title-bar-drag-area">
        <div className="app-icon">
          <img src="/triangle-icon.png" alt="Triangle" className="title-bar-icon" />
          <span>Triangle</span>
        </div>
        <Navbar variant="dark" className="custom-navbar" ref={menuRef} tabIndex="-1">
          <Nav className="me-auto">            <Dropdown
              show={activeDropdown === 'file'}
              onToggle={(isOpen) => {
                setActiveDropdown(isOpen ? 'file' : null);
                if (!isOpen) {
                  // Force blur when dropdown closes
                  if (document.activeElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-file" className="menu-toggle">
                File
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleNewFile}>
                  New <span className="shortcut">Ctrl+N</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleOpenFile}>
                  Open <span className="shortcut">Ctrl+O</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleSaveFile}>
                  Save <span className="shortcut">Ctrl+S</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleSaveAsFile}>
                  Save As <span className="shortcut">Ctrl+Shift+S</span>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleExit}>
                  Exit <span className="shortcut">Ctrl+Q</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>            <Dropdown
              show={activeDropdown === 'edit'}
              onToggle={(isOpen) => {
                setActiveDropdown(isOpen ? 'edit' : null);
                if (!isOpen) {
                  if (document.activeElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-edit" className="menu-toggle">
                Edit
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleUndo}>
                  Undo <span className="shortcut">Ctrl+Z</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleRedo}>
                  Redo <span className="shortcut">Ctrl+Shift+Z</span>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handlePreferences}>
                  Preferences
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>            <Dropdown
              show={activeDropdown === 'view'}
              onToggle={(isOpen) => {
                setActiveDropdown(isOpen ? 'view' : null);
                if (!isOpen) {
                  if (document.activeElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-view" className="menu-toggle">
                View
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleFullscreen}>
                  Fullscreen <span className="shortcut">F11</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleTogglePerspective}>
                  Toggle Perspective/Orthographic Mode <span className="shortcut">Numpad 5</span>
                </Dropdown.Item>
                <Dropdown.Divider />
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Dropdown.Item key={num} onClick={() => handleSaveCameraPosition(num)}>
                    Save Camera Position {num} <span className="shortcut">Ctrl+Alt+{num}</span>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>            <Dropdown
              show={activeDropdown === 'add'}
              onToggle={(isOpen) => {
                setActiveDropdown(isOpen ? 'add' : null);
                if (!isOpen) {
                  if (document.activeElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-add" className="menu-toggle">
                Add
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleAddObject('Building')}>
                  Building
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => handleAddObject('Slab')}>
                  Slab
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleAddObject('Wall')}>
                  Wall
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => handleAddObject('Door')}>
                  Door
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleAddObject('Window')}>
                  Window
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>            <Dropdown
              show={activeDropdown === 'render'}
              onToggle={(isOpen) => {
                setActiveDropdown(isOpen ? 'render' : null);
                if (!isOpen) {
                  if (document.activeElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-render" className="menu-toggle">
                Render
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleRender}>
                  Render <span className="shortcut">F12</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleRenderSettings}>
                  Render Settings
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>            <Dropdown
              show={activeDropdown === 'help'}
              onToggle={(isOpen) => {
                setActiveDropdown(isOpen ? 'help' : null);
                if (!isOpen) {
                  if (document.activeElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-help" className="menu-toggle">
                Help
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleHelp}>
                  Help <span className="shortcut">F1</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleAbout}>
                  About Triangle
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar>
        <div className="file-title">{getFilename()}</div>
      </div>
      <div className="window-controls">        <Button variant="link" className="window-control minimize" onClick={handleMinimize}>
          <CgMathMinus />
        </Button>
        <Button variant="link" className="window-control maximize" onClick={handleMaximize}>
          <CgMaximize />
        </Button>
        <Button variant="link" className="window-control close" onClick={handleClose}>
          <CgClose />
        </Button>
      </div>
    </div>
  );
}

export default TitleBar;