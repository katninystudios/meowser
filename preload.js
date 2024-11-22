const { contextBridge, ipcRenderer } = require('electron');
const path = require("path");

contextBridge.exposeInMainWorld('api', {
   dirname: () => __dirname,
   send: (channel, data) => {
      let validChannels = ['hover-link', "open-url"];
      if (validChannels.includes(channel)) {
         ipcRenderer.send(channel, data);
      }
   },
   handle: (channel, callback) => {
      const validChannels = ['hover-link', "open-url"];
      if (validChannels.includes(channel)) {
         ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
      }
   },
   receive: (channel, callback) => {
      const validChannels = ["display-url"];
      if (validChannels.includes(channel)) {
         console.log(`valid: ${channel}`);
         ipcRenderer.on(channel, (event, ...args) => callback(...args));
      }
   }
});

contextBridge.exposeInMainWorld("versions", {
   node: () => process.versions.node,
   chrome: () => process.versions.chrome,
   electron: () => process.versions.electron
});

contextBridge.exposeInMainWorld("theme", {
   getTheme: () => ipcRenderer.invoke("get-theme")
});

console.log(`Platform: ${process.platform} - Arch: ${process.arch}`);