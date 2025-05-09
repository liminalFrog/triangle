const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;
let recentFiles = [];
const RECENT_FILES_MAX = 10;
let currentFilePath = null;

// Load recent files from a settings file
function loadRecentFiles() {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      recentFiles = settings.recentFiles || [];
    } catch (error) {
      console.error("Error loading recent files:", error);
    }
  }
}

// Save recent files to a settings file
function saveRecentFiles() {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  
  try {
    const settings = { recentFiles };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error("Error saving recent files:", error);
  }
}

// Add a file to recent files list
function addRecentFile(filePath) {
  // Remove the file if it's already in the list
  recentFiles = recentFiles.filter(file => file !== filePath);
  
  // Add it to the beginning
  recentFiles.unshift(filePath);
  
  // Keep the list at max length
  if (recentFiles.length > RECENT_FILES_MAX) {
    recentFiles = recentFiles.slice(0, RECENT_FILES_MAX);
  }
  
  saveRecentFiles();
  buildMenu();
}

function createWindow() {
  // Load recent files at startup
  loadRecentFiles();

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  buildMenu();
}

function buildMenu() {
  // Build recent files menu items
  let recentFilesMenu = recentFiles.map((file, index) => {
    return {
      label: path.basename(file),
      click: () => openFile(file)
    };
  });
  
  if (recentFilesMenu.length === 0) {
    recentFilesMenu = [{ label: 'No Recent Files', enabled: false }];
  }

  const template = [
    {
      label: 'File',
      submenu: [
        { 
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('file-new');
            currentFilePath = null;
          }
        },
        { 
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => showOpenDialog()
        },
        {
          label: 'Recent Files',
          submenu: recentFilesMenu
        },
        { type: 'separator' },
        { 
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (currentFilePath) {
              mainWindow.webContents.send('file-save', currentFilePath);
            } else {
              showSaveDialog();
            }
          }
        },
        { 
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => showSaveDialog()
        },
        { type: 'separator' },
        { 
          label: 'Exit',
          role: 'quit'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Add',
      submenu: [
        { label: 'Placeholder 1' },
        { label: 'Placeholder 2' }
      ]
    },
    {
      label: 'Render',
      submenu: [
        { label: 'Placeholder 1' },
        { label: 'Placeholder 2' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Triangle',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About Triangle',
              message: 'Triangle v0.1.0\n3D Modeling Application'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function showOpenDialog() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Triangle Files', extensions: ['tri'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      openFile(result.filePaths[0]);
    }
  }).catch(err => {
    console.error(err);
  });
}

function openFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    mainWindow.webContents.send('file-opened', { filePath, data });
    currentFilePath = filePath;
    addRecentFile(filePath);
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to open file: ${error.message}`);
  }
}

function showSaveDialog() {
  dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Triangle Files', extensions: ['tri'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled) {
      mainWindow.webContents.send('file-save', result.filePath);
      currentFilePath = result.filePath;
      addRecentFile(result.filePath);
    }
  }).catch(err => {
    console.error(err);
  });
}

// IPC handlers
ipcMain.on('save-file-content', (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content);
    event.reply('file-saved', filePath);
    currentFilePath = filePath;
    addRecentFile(filePath);
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to save file: ${error.message}`);
  }
});

// IPC handlers for window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Menu action handlers
ipcMain.on('menu-new', () => {
  mainWindow.webContents.send('file-new');
  currentFilePath = null;
});

ipcMain.on('menu-open', () => {
  showOpenDialog();
});

ipcMain.on('menu-save', () => {
  if (currentFilePath) {
    mainWindow.webContents.send('file-save', currentFilePath);
  } else {
    showSaveDialog();
  }
});

ipcMain.on('menu-save-as', () => {
  showSaveDialog();
});

ipcMain.on('menu-exit', () => {
  app.quit();
});

ipcMain.on('toggle-fullscreen', () => {
  if (mainWindow) {
    const isFullScreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullScreen);
  }
});

// You could add these as well for other menu actions if needed
ipcMain.on('add-object', (event, objectType) => {
  // This would just relay the message back to the renderer process
  if (mainWindow) {
    mainWindow.webContents.send('add-object', objectType);
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});