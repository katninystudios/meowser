const { app, BrowserWindow, ipcMain, webContents, shell } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
   const mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
         preload: path.join(__dirname, "preload.js"),
         contextIsolation: true,
         nodeIntegration: true,
         webviewTag: true,
         devTools: !app.isPackaged, // we no want users doing that during release builds :pensive:
      },
      autoHideMenuBar: true
   });

   mainWindow.loadFile("index.html");

   // this will allow us to open a new tab when the site requests it
   // thank you random guy on stackoverflow!! https://stackoverflow.com/questions/74945364/when-a-open-in-new-tab-link-is-clicked-in-a-webview-element-it-opens-a-popup
   mainWindow.webContents.on("did-attach-webview", (_, contents) => {
      contents.setWindowOpenHandler((details) => {
         mainWindow.webContents.send('open-url', details.url);
         return { action: 'deny' };
      });
   });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
   if (process.platform !== "darwin") {
      app.quit();
   }
});

app.on("activate", () => {
   if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
   }
});

// handle url hovered from the webview's preload script
ipcMain.on("url-hovered", (event, url) => {
   if (mainWindow) {
      mainWindow.webContents.send("display-url", url);
   }
});