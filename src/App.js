import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TitleBar from './components/TitleBar';
import Scene3D from './components/Scene3D';

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

    return () => {
      if (ipcRenderer) {
        ipcRenderer.removeAllListeners('file-new');
        ipcRenderer.removeAllListeners('file-opened');
        ipcRenderer.removeAllListeners('file-save');
        ipcRenderer.removeAllListeners('file-saved');
      }
    };
  }, [saveFile]); // Added saveFile to the dependency array

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
        <Scene3D 
          projectData={projectData} 
          updateProjectData={updateProjectData}
        />
      </div>
    </div>
  );
}

export default App;