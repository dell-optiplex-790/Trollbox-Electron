const { app, BrowserWindow, Menu, ipcMain, clipboard, shell } = require('electron');
const path = require('node:path');
const io = require("socket.io-client");
const fs = require('fs');
var { join } = require('path');

// configs
let config = JSON.parse(fs.readFileSync(join(__dirname, 'config.json'), 'utf8'));

if(!fs.existsSync(join(__dirname, 'activity.log'))) {
	fs.writeFileSync(join(__dirname, 'activity.log'), '=========== BEGIN LOG ==============', 'utf8'); // create the file
}
if(!fs.existsSync(join(__dirname, 'activity.json'))) {
	fs.writeFileSync(join(__dirname, 'activity.json'), '[]', 'utf8'); // create the file
}
if(!config.server) {
	config.server = "www.windows93.net:8081";
	fs.writeFileSync(join(__dirname, 'config.json'), JSON.stringify(config, null, 2), 'utf8');
}

process.stdout.write('\x1b]0;Debug logs\x07')

let transportOptions = {};
if(config.server == "ws://www.windows93.net:8081") {
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

if(config.debug) {
	console.log('[debug:connection] Server:', `${config.server}`, '\nTransport options:', transportOptions);
}

let socket = io(config.server, {
	forceNew: true,
	transportOptions
});


// Electron stuff

if(!config.debug) {
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
			preload: path.join(__dirname, "preload.cjs"),
			devTools: !!config.debug
		},
		icon: path.join(__dirname, "icon.png")
	});

	win.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	win.loadFile('index.html')

	function sendEventToWindow(name, data) {
		win.webContents.send('socketReceive', {
			name: name,
			data: data
		})
	};

	socket.removeAllListeners();

	ipcMain.on('getConfig', function() {
		config = JSON.parse(fs.readFileSync(join(__dirname, 'config.json'), 'utf8'));
		win.webContents.send("recieveConfig", config);
	});

	// Connection-related events
	socket.on('connect', function (data) {
		sendEventToWindow("connect", data);
		console.log("Connected");
	});

	socket.on("connect_error", (error) => {
		sendEventToWindow("connect_error", error);
		if (!socket.active) {
			console.error(error);
			socket.connect();
		}
	});

	socket.on("disconnect", (reason) => {
		sendEventToWindow("disconnect", reason);
		if (!socket.active) {
			console.error(reason);
			socket.connect();
		}
	});

	// Trollbox events

	socket.on('update history', function (data) {
		sendEventToWindow("update history", data);
	});

	socket.on('update users', function (data) {
		sendEventToWindow("update users", data);
	});

	socket.on('user joined', function (data) {
		sendEventToWindow("user joined", data);
	});

	socket.on('user left', function (data) {
		sendEventToWindow("user left", data);
	});

	socket.on('user change nick', function (data) {
		sendEventToWindow("user change nick", data);
	});

	socket.on('message', function (data) {
		sendEventToWindow("message", data);
	});

	socket.on('cmd', function (data) {
		sendEventToWindow("cmd", data);
		console.log("Remote command received: " + data);
	});
};

function handleSocketEmit(_event, data) {
	socket.emit(...data);
};

app.whenReady().then(() => {
	ipcMain.on('socketEmit', handleSocketEmit);
	ipcMain.on('copy', function(_event, text) {
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

ipcMain.on('writeConfig', (_event, newConfig) => {
    try {
        fs.writeFileSync(join(__dirname, 'config.json'), JSON.stringify(newConfig, null, 2), 'utf8');
        console.log("Config updated.");
    } catch (error) {
        console.error("Failed to write config: ", error);
    }
});


// removed: activity log