const { app, BrowserWindow, Menu, ipcMain, clipboard, shell } = require('electron');
const path = require('node:path');
const io = require("socket.io-client");
const fs = require('fs');
const configPath = path.join(__dirname, 'config.json');

if(!fs.existsSync(configPath)) {
	fs.writeFileSync(configPath, JSON.stringify({
        nick: "anonymous",
        color: "#bf6a28",
        blocks: [],
        embedImages: false,
        embedYoutube: false,
        debug: false,
		server: "ws://www.windows93.net:8081" // IMPORTANT: use a server
	}, null, 2));
}


// configs
let _config: {nick: string, color: string, blocks: Array<Block>, embedImages: boolean, embedYoutube: boolean, font: string | undefined, debug: boolean, server: string} = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if(!_config.server) {
	_config.server = "www.windows93.net:8081";
	fs.writeFileSync(configPath, JSON.stringify(_config, null, 2), 'utf8');
}

process.stdout.write('\x1b]0;Debug logs\x07')

let transportOptions = {};
if(_config.server == "ws://www.windows93.net:8081") {
	// duct tape fix
	transportOptions = {
		polling: {
			extraHeaders: {
				"Accept-Encoding": "identity",
				"Accept-Language": "en-US,en;",
				"Cache-Control": "no-cache",
				"Connection": "keep-alive",
				"Cookie": "",
				"Host": "www.windows93.net:8081",
				"Origin": "http://www.windows93.net",
				"Pragma": "no-cache",
				"Referer": 'http://www.windows93.net/trollbox/index.php',
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0"
			}
		}
	}
}

// Socket

if(_config.debug) {
	console.log('[debug:connection] Server:', `${_config.server}`, '\nTransport options:', transportOptions);
}

let socket = io(_config.server, {
	forceNew: true,
	transportOptions
});


// Electron stuff

if(!_config.debug) {
	Menu.setApplicationMenu(null);
}

const createWindow = () => {
	const win = new BrowserWindow({
		width: 950,
		height: 750,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			nodeIntegrationInWorker: false,
			preload: path.join(__dirname, "preload.js"),
			devTools: !!_config.debug
		},
		icon: path.join(__dirname, "icon.png")
	});

	win.webContents.setWindowOpenHandler((url: string) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	win.loadFile('index.html')

	function sendEventToWindow(name: string, data: object) {
		win.webContents.send('socketReceive', {
			name: name,
			data: data
		})
	};

	socket.removeAllListeners();

	ipcMain.on('getConfig', function() {
		_config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		win.webContents.send("recieveConfig", _config);
	});

	// Connection-related events
	socket.on('connect', function (data: object) {
		sendEventToWindow("connect", data);
		console.log("Connected");
	});

	socket.on("connect_error", (error: object) => {
		sendEventToWindow("connect_error", error);
		if (!socket.active) {
			console.error(error);
			socket.connect();
		}
	});

	socket.on("disconnect", (reason: object) => {
		sendEventToWindow("disconnect", reason);
		if (!socket.active) {
			console.error(reason);
			socket.connect();
		}
	});

	// Trollbox events

	socket.on('update history', function (data: object) {
		sendEventToWindow("update history", data);
	});

	socket.on('update users', function (data: object) {
		sendEventToWindow("update users", data);
	});

	socket.on('user joined', function (data: object) {
		sendEventToWindow("user joined", data);
	});

	socket.on('user left', function (data: object) {
		sendEventToWindow("user left", data);
	});

	socket.on('user change nick', function (data: object) {
		sendEventToWindow("user change nick", data);
	});

	socket.on('message', function (data: object) {
		sendEventToWindow("message", data);
	});

	socket.on('cmd', function (data: object) {
		sendEventToWindow("cmd", data);
		console.log("Remote command received: " + data);
	});
};

function handleSocketEmit(_event: any, data: Array<any>) {
	socket.emit(...data);
};

app.whenReady().then(() => {
	ipcMain.on('socketEmit', handleSocketEmit);
	ipcMain.on('copy', function(_event: any, text: string) {
		clipboard.writeText(text);
	});
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	})
});

app.on('window-all-closed', () => {
	socket.destroy()
	app.quit()
});

ipcMain.on('writeConfig', (_event: any, newConfig: object) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        console.log("Config updated.");
    } catch (error) {
        console.error("Failed to write config: ", error);
    }
});


// removed: activity log