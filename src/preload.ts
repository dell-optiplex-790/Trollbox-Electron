const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	socketReceive: function(callback: (value: any) => void) {
		ipcRenderer.on('socketReceive', (_event: any, value: any) => callback(value))
	},
	socketEmit: function(...data: any) {
		ipcRenderer.send('socketEmit', data);
	},
	recieveConfig: function(callback: (value: any) => void) {
		ipcRenderer.on('recieveConfig', (_event: any, value: any) => callback(value))
	},
	getConfig: function() {
		ipcRenderer.send('getConfig');
		console.log("getConfig");
	},
	writeConfig: (newConfig: object) => {
        ipcRenderer.send('writeConfig', newConfig);
		console.log("writeConfig");
    },
	copy: function(text: string) {
		ipcRenderer.send('copy', text);
	}
});