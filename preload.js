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
   getTheme: () => ipcRenderer.invoke("get-theme"),
   setTheme: (channel, data) => ipcRenderer.invoke(channel, data)
});

// detect when a link is hovered
contextBridge.exposeInMainWorld("link", {
   sendLinkHover: (href) => ipcRenderer.send("link-hover", href),
   sendLinkUnhover: () => ipcRenderer.send("link-unhover"),
   on: (channel, callback) => {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
   },
});

// window.addEventListener("DOMContentLoaded", () => {
//    document.addEventListener("mouseover", (event) => {
//       if (event.target.tagName === "A" && event.target.href) {
//          window.link.sendLinkHover(event.target.href);
//       }
//    });

//    document.addEventListener("mouseout", (event) => {
//       if (event.target.tagName === "A") {
//          window.link.sendLinkUnhover();
//       }
//    });
// });

console.log(`Platform: ${process.platform} - Arch: ${process.arch}`);