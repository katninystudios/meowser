const { app, BrowserWindow, ipcMain, webContents, session } = require("electron");
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

   // // set our browser's useragent
   const filter = {
      urls: ["*://*/*"]
   }

   session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      // originally wanted it to be "Meowser", but so many websites broke when i did
      // so now we're just chrome (silently sobs in corner)
      details.requestHeaders["User-Agent"] = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
      callback({ requestHeaders: details.requestHeaders })
   })
}

app.on("window-all-closed", () => {
   if (process.platform !== "darwin") {
      app.quit();
   }
});

app.on("ready", () => {
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