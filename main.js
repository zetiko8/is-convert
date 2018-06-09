// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')

'use strict';

var mainWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 800,
    resizable: true,
    width: 800
  });
  
  mainWindow.webContents.openDevTools()
  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/app/windows/mainWindow/index.html');
  

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {

    mainWindow = null
  })
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

