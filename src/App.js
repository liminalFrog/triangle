import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TitleBar from './components/TitleBar';
import Scene3D from './components/Scene3D';
import StatusBar from './components/StatusBar';
import FloatingPanel from './components/FloatingPanel';
import ElementsPanel from './components/ElementsPanel';
import InfoPanel from './components/InfoPanel';

const electron = window.electron;
const ipcRenderer = electron ? electron.ipcRenderer : null;

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [projectData, setProjectData] = useState({ 
    // Default initial data
    scene: {
      objects: []
    } 
  });
  const [dirty, setDirty] = useState(false);

  // Use useCallback to memoize the saveFile function
  const saveFile = useCallback((filePath) => {
    if (ipcRenderer) {
      const content = JSON.stringify(projectData, null, 2);
      ipcRenderer.send('save-file-content', { filePath, content });
    }
  }, [projectData]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl key combinations
    if (e.ctrlKey) {
      if (e.shiftKey) {
        // Ctrl+Shift combinations
        switch (e.key.toLowerCase()) {
          case 's': // Ctrl+Shift+S (Save As)
            e.preventDefault();
            if (ipcRenderer) ipcRenderer.send('menu-save-as');
            break;
          case 'z': // Ctrl+Shift+Z (Redo)
            e.preventDefault();
            console.log('Redo');
            break;
          default:
            break;
        }
      } else if (e.altKey) {
        // Ctrl+Alt combinations (Save Camera Position)
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 0 && num <= 9) {
          e.preventDefault();
          console.log(`Save camera position ${num}`);
        }
      } else {
        // Simple Ctrl combinations
        switch (e.key.toLowerCase()) {
          case 'n': // Ctrl+N (New)
            e.preventDefault();
            if (ipcRenderer) ipcRenderer.send('menu-new');
            break;
          case 'o': // Ctrl+O (Open)
            e.preventDefault();
            if (ipcRenderer) ipcRenderer.send('menu-open');
            break;
          case 's': // Ctrl+S (Save)
            e.preventDefault();
            if (ipcRenderer) ipcRenderer.send('menu-save');
            break;
          case 'z': // Ctrl+Z (Undo)
            e.preventDefault();
            console.log('Undo');
            break;
          case 'q': // Ctrl+Q (Exit)
            e.preventDefault();
            if (ipcRenderer) ipcRenderer.send('menu-exit');
            break;
          default:
            break;
        }
      }
    } else {
      // Function key shortcuts
      switch (e.key) {
        case 'F1': // F1 (Help)
          e.preventDefault();
          console.log('Help');
          break;
        case 'F11': // F11 (Fullscreen)
          e.preventDefault();
          if (ipcRenderer) ipcRenderer.send('toggle-fullscreen');
          break;
        case 'F12': // F12 (Render)
          e.preventDefault();
          console.log('Render');
          break;
        case 'NumPad5': // Numpad 5 (Toggle Perspective/Orthographic)
        case '5': // For some keyboards
          if (e.code === 'Numpad5') {
            e.preventDefault();
            console.log('Toggle Perspective/Orthographic');
          }
          break;
        default:
          break;
      }
    }
  }, []);

  useEffect(() => {
    if (ipcRenderer) {
      // Listen for file-new event
      ipcRenderer.on('file-new', () => {
        setCurrentFile(null);
        setProjectData({ 
          scene: {
            objects: []
          } 
        });
        setDirty(false);
      });

      // Listen for file-opened event
      ipcRenderer.on('file-opened', (event, { filePath, data }) => {
        try {
          const jsonData = JSON.parse(data);
          setCurrentFile(filePath);
          setProjectData(jsonData);
          setDirty(false);
        } catch (error) {
          console.error("Failed to parse file:", error);
        }
      });

      // Listen for file-save event
      ipcRenderer.on('file-save', (event, filePath) => {
        saveFile(filePath);
      });

      // Listen for file-saved event
      ipcRenderer.on('file-saved', (event, filePath) => {
        setCurrentFile(filePath);
        setDirty(false);
      });
    }

    // Add event listener for keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (ipcRenderer) {
        ipcRenderer.removeAllListeners('file-new');
        ipcRenderer.removeAllListeners('file-opened');
        ipcRenderer.removeAllListeners('file-save');
        ipcRenderer.removeAllListeners('file-saved');
      }
      
      // Remove event listener for keyboard shortcuts
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveFile, handleKeyDown]); 

  const updateProjectData = (newData) => {
    setProjectData(newData);
    setDirty(true);
  };

  return (
    <div className="app-container">
      <TitleBar 
        currentFile={currentFile}
        dirty={dirty}
      />
      <div className="content-area">
        {/* Left floating panel (Elements) */}
        <FloatingPanel
          title="Elements"
          position="left"
          defaultWidth={300}
        >
          <ElementsPanel />
        </FloatingPanel>
        
        {/* Right floating panel (Info) */}
        <FloatingPanel
          title="Info"
          position="right"
          defaultWidth={200}
        >
          <InfoPanel />
        </FloatingPanel>
        
        <Scene3D 
          projectData={projectData} 
          updateProjectData={updateProjectData}
        />
        
        {/* Status bar at the bottom */}
        <StatusBar />
      </div>
    </div>
  );
}

export default App;