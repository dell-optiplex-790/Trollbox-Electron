const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload Script active");

contextBridge.exposeInMainWorld('electronAPI', {
	onSocketReceive: function(callback) {
		ipcRenderer.on('socketReceive', (_event, value) => callback(value))
	},
	socketEmit: function(...data) {
		ipcRenderer.send('socketEmit', data);
	},
	onAppConfig: function(callback) {
		ipcRenderer.on('appConfig', (_event, value) => callback(value))
	},
	getAppConfig: function() {
		ipcRenderer.send('getAppConfig');
	},
	copy: function(text) {
		ipcRenderer.send('copy', text);
	}
});