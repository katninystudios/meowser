const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    handle: (channel, callback) => {
        ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
    }
});