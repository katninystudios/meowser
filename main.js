const { app, BrowserWindow, ipcMain, webContents, shell } = require("electron");
const path = require("path");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true, // enable context isolation
            nodeIntegration: false, // disable node intergration
            webviewTag: true, // allow the webview to render
        },
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