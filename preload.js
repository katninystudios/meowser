const { contextBridge, ipcRenderer } = require('electron');
const path = require("path");

contextBridge.exposeInMainWorld('api', {
   dirname: () => __dirname,
   send: (channel, data) => {
      let validChannels = ['hover-link'];
      if (validChannels.includes(channel)) {
         ipcRenderer.send(channel, data);
      }
   },
   handle: (channel, callback) => {
      const validChannels = ['hover-link'];
      if (validChannels.includes(channel)) {
         ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
      }
   }
});

contextBridge.exposeInMainWorld("electronAPI", {
   sendLinkHover: (url) => ipcRenderer.send("link-hover", url)
});

const hoverDiv = document.getElementById("link-preview");

ipcRenderer.on("link-hover", (event, url) => {
   if (url) {
      hoverDiv.style.display = "block";
      hoverDiv.innerText = url;
   } else {
      hoverDiv.style.display = "none";
   }
});