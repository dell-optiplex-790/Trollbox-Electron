"use strict";

const DateTime = luxon.DateTime;
const onSocketReceive = window.electronAPI.onSocketReceive;
const socketEmit = window.electronAPI.socketEmit;
const getAppConfig = window.electronAPI.getAppConfig;
const onAppConfig = window.electronAPI.onAppConfig;
const copy = window.electronAPI.copy;
window.copy = copy;

onAppConfig((config) => {
    window.config = config;
    settingsButton.innerText = config.nick;
    socketEmit("user joined", config.nick||"anonymous", config.color||"", "", "");
})

const rooms = document.getElementById("rooms");
const chat = document.getElementById("chat");
const settings = document.getElementById("settings");
const users = document.getElementById("users");
const settingsButton = document.getElementById("settingsButton");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

function createRoom(name) {
    const room = document.createElement("span");
    room.className = "room";
    room.innerText = name;
    room.addEventListener('click', (event) => {
        socketEmit('message', '/r ' + event.target.innerText)
    })
    rooms.appendChild(room);
};

function createMessage(timestamp, nick, color, home, content, trusted) {
    const message = document.createElement("span");
    message.className = "message";

    const messageTimestamp = document.createElement("span");
    messageTimestamp.className = "timestamp";
    messageTimestamp.innerText = timestamp;
    message.appendChild(messageTimestamp);

    const user = createUser(nick, color, home, false, false);
    message.appendChild(user);

    const messageContent = document.createElement("span");
    messageContent.className = "content";
    if (trusted) {
        content = " " + he.decode(content);
        messageContent.innerHTML = content;
    } else {
        content = ": " + he.decode(content);
        messageContent.innerText = content;
    };
    message.appendChild(messageContent);

    chat.appendChild(message);
    chat.lastChild.scrollIntoView(true);
};

function createUser(nick, color, home, blocked, bot) {
    const user = document.createElement("span");
    user.style.fontWeight = "bold";
    user.className = "user";
    const bdiWrapper = document.createElement("bdi");
    bdiWrapper.innerText = he.decode(nick);
    bdiWrapper.title = home;
    bdiWrapper.addEventListener('click', (event) => {
        copy(event.target.title);
    })
    user.appendChild(bdiWrapper);
    if (color) {
        user.style = "color: " + color + ";";
    };
    if (blocked) {
        user.classList.add("blocked");
    };
    if (bot) {
        user.classList.add("bot");
    };
    bdiWrapper.setAttribute("onclick", "copy('" + home + "');");
    return user;
};



onSocketReceive(function (event) {
    if (event.name === "connect") {
        console.log("Connected");
        getAppConfig();
    } else if (event.name === "message") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        const parsedContent = he.decode(event.data.msg).replace(/(?:\r\n|\r|\n)/g, '\n');
        createMessage(timestamp, event.data.nick, event.data.color, event.data.home, parsedContent, event.data.home==='trollbox', false);
    } else if (event.name === "update users") {
        users.innerHTML = "";
        rooms.innerHTML = "";
        let roomsList = [];
        for (let user in event.data) {
            let userLocation = event.data[user]
            let createdUser = createUser(userLocation.nick, userLocation.color, userLocation.home, false, userLocation.isBot);
            users.appendChild(createdUser);
            if(!roomsList.includes(userLocation.room)) {
                roomsList.push(userLocation.room);
                createRoom(userLocation.room);
            }
        };
        users.firstChild.classList.add("king");
    } else if (event.name === "user joined") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        createMessage(timestamp, ">", "lightgreen", "client",
            createUser(event.data.nick, event.data.color, event.data.home, false, false, true).outerHTML + " has joined!", true);
    } else if (event.name === "user left") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        createMessage(timestamp, "<", "tomato", "client",
            createUser(event.data.nick, event.data.color, event.data.home, false, false, true).outerHTML + " has left!", true);
    };
});



chatInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter' && event.shiftKey === false) {
        sendChatInput();
        clearChatInput();
    }
});

sendButton.addEventListener("click", () => {
    sendChatInput();
    clearChatInput();
});

function sendChatInput() {
    if (chatInput.value !== '') {
        socketEmit("message", chatInput.value);
    };
};

function clearChatInput() {
    chatInput.value = "";
    chatInput.innerHTML = '';
};

settingsButton.addEventListener("click", toggleSettings);

function toggleSettings() {
    if (settings.classList.contains("hidden")) {
        settings.classList.remove("hidden");
        chat.classList.add("hidden");
    } else {
        settings.classList.add("hidden");
        chat.classList.remove("hidden");
    };
};

socketEmit("message", "") // fix for connection without needing to send a msg
