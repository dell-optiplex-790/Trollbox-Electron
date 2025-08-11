import { app, BrowserWindow, Menu, ipcMain, clipboard, shell } from 'electron';
import path from 'node:path';
import io from "socket.io-client";
import fs from 'fs';
import { join } from 'path';

// Socket

export let socket = await io('ws://www.windows93.net:8081', {
	forceNew: true,
	transportOptions: {
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
});

let config = JSON.parse(fs.readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));

if(!fs.existsSync(join(import.meta.dirname, 'activity.log'))) {
	fs.writeFileSync(join(import.meta.dirname, 'activity.log'), '=========== BEGIN LOG ==============', 'utf8'); // create the file
}
if(!fs.existsSync(join(import.meta.dirname, 'activity.json'))) {
	fs.writeFileSync(join(import.meta.dirname, 'activity.json'), '[]', 'utf8'); // create the file
}

// Electron things

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
			preload: path.join(import.meta.dirname, "preload.cjs"),
			devTools: !!config.debug
		},
		icon: path.join(import.meta.dirname, "icon.png")
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
		config = JSON.parse(fs.readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));
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
        fs.writeFileSync(join(import.meta.dirname, 'config.json'), JSON.stringify(newConfig, null, 2), 'utf8');
        console.log("Config updated.");
    } catch (error) {
        console.error("Failed to write config: ", error);
    }
});

ipcMain.on('log', (_event, log) => {
	var _log = log;
	const logKeys = "nick;color;home;content;trusted".split(";")
	for(let i = 0; i < logKeys.length; i++) {
		if(typeof log[logKeys[i]] === "undefined") {return;}
		_log[logKeys[i]] = log[logKeys[i]].toString();
	}
	var date = new Date(Date.now())
	let activityJSON = JSON.parse(fs.readFileSync(join(import.meta.dirname, 'activity.json'), 'utf8'))
	activityJSON.push(_log);
	let logEntry = "";
	logEntry += date.toLocaleString("en-US") + "\t" // add date/time
	logEntry += "[color = " + _log.color.split(';')[0] + ", home = " + _log.home + "]\t" // add additional info
	if(log.trusted) { // nick logic
		logEntry += _log.nick + "\t"
	} else {
		logEntry += "[" + _log.nick + "]\t"
	}
	logEntry += _log.content // add message content
	try {
        fs.writeFileSync(join(import.meta.dirname, 'activity.log'), fs.readFileSync(join(import.meta.dirname, 'activity.log'), 'utf8') + '\n' + logEntry, 'utf8');
		fs.writeFileSync(join(import.meta.dirname, 'activity.json'), JSON.stringify(activityJSON), 'utf8');
        console.log("Activity log updated.");
    } catch (error) {
        console.error("Failed to write to activity log: ", error);
    }
})