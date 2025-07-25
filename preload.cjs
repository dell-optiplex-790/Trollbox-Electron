const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload Script active");

contextBridge.exposeInMainWorld('electronAPI', {
	socketReceive: function(callback) {
		ipcRenderer.on('socketReceive', (_event, value) => callback(value))
	},
	socketEmit: function(...data) {
		ipcRenderer.send('socketEmit', data);
	},
	recieveConfig: function(callback) {
		ipcRenderer.on('recieveConfig', (_event, value) => callback(value))
	},
	getConfig: function() {
		ipcRenderer.send('getConfig');
		console.log("getConfig");
	},
	writeConfig: (newConfig) => {
        ipcRenderer.send('writeConfig', newConfig);
		console.log("writeConfig");
    },
	copy: function(text) {
		ipcRenderer.send('copy', text);
	},
});