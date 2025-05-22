import React, { useState } from 'react';
import { Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import path from 'path-browserify';
import './TitleBar.css';
import { CgMathMinus, CgMinimize, CgMaximize, CgClose } from 'react-icons/cg';

const electron = window.electron;
const ipcRenderer = electron ? electron.ipcRenderer : null;

function TitleBar({ currentFile, dirty }) {
  const [activeDropdown, setActiveDropdown] = useState(null);

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

  // Menu handlers
  const handleNewFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-new');
    }
  };

  const handleOpenFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-open');
    }
  };

  const handleSaveFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-save');
    }
  };

  const handleSaveAsFile = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-save-as');
    }
  };

  const handleExit = () => {
    if (ipcRenderer) {
      ipcRenderer.send('menu-exit');
    }
  };

  const handleUndo = () => {
    // Implement undo functionality
    console.log('Undo');
  };

  const handleRedo = () => {
    // Implement redo functionality
    console.log('Redo');
  };

  const handlePreferences = () => {
    // Open preferences dialog
    console.log('Preferences');
  };

  const handleFullscreen = () => {
    if (ipcRenderer) {
      ipcRenderer.send('toggle-fullscreen');
    }
  };

  const handleTogglePerspective = () => {
    // Toggle between perspective and orthographic camera
    console.log('Toggle Perspective/Orthographic');
  };

  const handleSaveCameraPosition = (position) => {
    // Save camera position at slot 0-9
    console.log(`Save camera position ${position}`);
  };

  const handleAddObject = (objectType) => {
    // Add object to scene
    console.log(`Add ${objectType}`);
  };

  const handleRender = () => {
    // Render the scene
    console.log('Render');
  };

  const handleRenderSettings = () => {
    // Open render settings
    console.log('Render Settings');
  };

  const handleHelp = () => {
    // Open help documentation
    console.log('Help');
  };

  const handleAbout = () => {
    // Show about dialog
    console.log('About Triangle');
  };

  return (
    <div className="title-bar" data-bs-theme="dark">
      <div className="title-bar-drag-area">
        <div className="app-icon">
          <img src="/triangle-icon.png" alt="Triangle" className="title-bar-icon" />
          <span>Triangle</span>
        </div>
        <Navbar variant="dark" className="custom-navbar">
          <Nav className="me-auto">
            <Dropdown
              show={activeDropdown === 'file'}
              onToggle={(isOpen) => setActiveDropdown(isOpen ? 'file' : null)}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-file">
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
            </Dropdown>

            <Dropdown
              show={activeDropdown === 'edit'}
              onToggle={(isOpen) => setActiveDropdown(isOpen ? 'edit' : null)}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-edit">
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
            </Dropdown>

            <Dropdown
              show={activeDropdown === 'view'}
              onToggle={(isOpen) => setActiveDropdown(isOpen ? 'view' : null)}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-view">
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
            </Dropdown>

            <Dropdown
              show={activeDropdown === 'add'}
              onToggle={(isOpen) => setActiveDropdown(isOpen ? 'add' : null)}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-add">
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
            </Dropdown>

            <Dropdown
              show={activeDropdown === 'render'}
              onToggle={(isOpen) => setActiveDropdown(isOpen ? 'render' : null)}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-render">
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
            </Dropdown>

            <Dropdown
              show={activeDropdown === 'help'}
              onToggle={(isOpen) => setActiveDropdown(isOpen ? 'help' : null)}
              align="start"
            >
              <Dropdown.Toggle as={Nav.Link} id="dropdown-help">
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
      <div className="window-controls">
        <Button variant="link" className="window-control minimize" onClick={handleMinimize}>
          <CgMathMinus />
        </Button>
        <Button variant="link" className="window-control maximize" onClick={handleMaximize}>
          {ipcRenderer && ipcRenderer.send('window-maximize') ? (
            <CgMinimize />
          ) : (
            <CgMaximize />
          )}
        </Button>
        <Button variant="link" className="window-control close" onClick={handleClose}>
          <CgClose />
        </Button>
      </div>
    </div>
  );
}

export default TitleBar;