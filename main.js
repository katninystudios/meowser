const { app, BrowserWindow, ipcMain, webContents, session, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");

let mainWindow;

const whitelist = [ // we have to whitelist these, or youtube (for example) will refuse to load pfps and stuff
   // if you find another site that wont load certain elements that arent trackers, let us know!
   "googleusercontent.com",
   "gravatar.com",
   "https://yt3.ggpht.com",
   "https://firebasestorage.googleapis.com/",
   "https://avatars.githubusercontent.com/",
   "https://camo.githubusercontent.com/"
];

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

   // context menu
   const contextMenu = Menu.buildFromTemplate([
      {
         label: "Open Link in New Tab",
         click: (MenuItem, BrowserWindow, event) => {
            const selectedText = event.sender.getSelectedText();

            console.log("Opening:", selectedText);
            
            shell.openExternal(selectedText);
         },
      },
      { type: "separator" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
   ]);

   mainWindow.webContents.on("context-menu", (event) => {
      contextMenu.popup({ window: mainWindow });
   });

   // add adblocker logic
   fetchEasyList().then(domains => {
      blockedDomains = domains.concat([
         "youtube.com/get_video_info",
         "youtube.com/api/stats/ads",
         "doubleclick.net",
         "googleads.g.doubleclick.net",
      ]);
      addAdBlocker(session.defaultSession);
   }).catch(err => {
      console.error("Failed to load easylist:", err);
   });

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

// adblocker
function fetchEasyList() {
   return new Promise((resolve, reject) => {
      https.get("https://easylist.to/easylist/easylist.txt", (response) => {
         let data = ``;

         response.on("data", (chunk) => {
            data += chunk;
         });

         response.on("end", () => {
            const blockedDomains = [];
            const lines = data.split("\n");
            lines.forEach(line => {
               if (line.startsWith("||") && line.includes("^")) {
                  const domainMatch = line.match(/\|\|(.+?)\^/);
                  if (domainMatch && domainMatch[1]) {
                     blockedDomains.push(domainMatch[1]);
                  }
               }
            });
            resolve(blockedDomains);
         });
      }).on("error", (err) => {
         reject(err);
      });
   });
}

function addAdBlocker(session) {
   session.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (details, callback) => {
      const url = details.url;

      const isWhitelisted = whitelist.some(item => url.includes(item));

      if (isWhitelisted) {
         callback({ cancel: false });
      } else if (blockedDomains.some(domain => url.includes(domain))) {
         console.log(`Blocked: ${details.url}`);
         callback({ cancel: true });
      } else {
         callback({ cancel: false });
      }
   });
}