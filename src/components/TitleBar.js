import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import path from 'path-browserify'; // Fix import statement
import './TitleBar.css';

const electron = window.electron;
const ipcRenderer = electron ? electron.ipcRenderer : null;

function TitleBar({ currentFile, dirty }) {
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

  return (
    <div className="title-bar">
      <div className="title-bar-drag-area">
        <div className="app-icon">
          <img src="/triangle-icon.png" alt="Triangle" className="title-bar-icon" />
          <span>Triangle</span>
        </div>
        <Navbar variant="dark" className="custom-navbar">
          <Nav className="me-auto">
            <Nav.Link href="#file">File</Nav.Link>
            <Nav.Link href="#edit">Edit</Nav.Link>
            <Nav.Link href="#view">View</Nav.Link>
            <Nav.Link href="#add">Add</Nav.Link>
            <Nav.Link href="#render">Render</Nav.Link>
            <Nav.Link href="#help">Help</Nav.Link>
          </Nav>
        </Navbar>
        <div className="file-title">{getFilename()}</div>
      </div>
      <div className="window-controls">
        <Button variant="link" className="window-control minimize" onClick={handleMinimize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
          </svg>
        </Button>
        <Button variant="link" className="window-control maximize" onClick={handleMaximize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor"></rect>
          </svg>
        </Button>
        <Button variant="link" className="window-control close" onClick={handleClose}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path stroke="currentColor" strokeWidth="1.1" d="M3,3 L9,9 M9,3 L3,9"></path>
          </svg>
        </Button>
      </div>
    </div>
  );
}

export default TitleBar;