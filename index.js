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

function createMessage(timestamp, nick, color, home, content, system) {
    const message = document.createElement("span");
    message.className = "message";

    const messageTimestamp = document.createElement("span");
    messageTimestamp.className = "timestamp";
    messageTimestamp.innerHTML = timestamp;
    message.appendChild(messageTimestamp);

    const user = document.createElement("span");
    if(system) {
        user.innerHTML = nick;
    } else {
        const caption = document.createElement("bdi");
        caption.innerHTML = nick;
        caption.title = home;
        caption.addEventListener('click', (event) => {
            copy(event.target.title);
        })
        user.appendChild(caption);
    }
    if (color) {
        user.style = "color: " + color.split(';')[0] + ";";
    };
    if(system) {
        user.className = "user";
        user.style.marginRight = "1.5ch";
    } else {
        user.className = "name";
    }
    message.appendChild(user);

    const messageContent = document.createElement("span");
    messageContent.className = "content";
    messageContent.innerHTML = content;
    message.appendChild(messageContent);

    chat.appendChild(message);
};

function createUser(nick, color, home, blocked, bot, HTMLout) {
    const user = document.createElement("span");
    user.style.fontWeight = "bold";
    user.className = "user";
    const caption = document.createElement("bdi");
    caption.innerHTML = nick;
    caption.title = home;
    caption.addEventListener('click', (event) => {
        copy(event.target.title);
    })
    user.appendChild(caption);
    if (color) {
        user.style = "color: " + color + ";";
    };
    if (blocked) {
        user.classList.add("blocked");
    };
    if (bot) {
        user.classList.add("bot");
    };
    if(!HTMLout) {
        users.appendChild(user);
    } else {
        caption.setAttribute("onclick", "copy('" + home + "');");
        return user.outerHTML;
    }
};



onSocketReceive(function (event) {
    if (event.name === "connect") {
        console.log("Connected");
        getAppConfig();
    } else if (event.name === "message") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        const parsedContent = he.decode(event.data.msg).replace(/(?:\r\n|\r|\n)/g, '<br>');
        createMessage(timestamp, event.data.nick, event.data.color, event.data.home, parsedContent, event.data.home==='trollbox', false);
        chat.lastChild.scrollIntoView(true);
    } else if (event.name === "update users") {
        users.innerHTML = "";
        rooms.innerHTML = "";
        let roomsList = [];
        for (let user in event.data) {
            let userLocation = event.data[user]
            createUser(userLocation.nick, userLocation.color, userLocation.home, false, userLocation.isBot);
            if(!roomsList.includes(userLocation.room)) {
                roomsList.push(userLocation.room);
                createRoom(userLocation.room);
                console.log(1)
            }
        };
        users.firstChild.classList.add("king");
    } else if (event.name === "user joined") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        createMessage(timestamp, ">", "lightgreen", "trollbox", createUser(event.data.nick, event.data.color, event.data.home, false, false, true) + " has joined!", true);
    } else if (event.name === "user left") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        createMessage(timestamp, "<", "tomato", "trollbox", createUser(event.data.nick, event.data.color, event.data.home, false, false, true) + " has left!", true);
    };
});





let chatInputSent = false;

chatInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter' && event.shiftKey === false) {
        sendChatInput();
        clearChatInput();
    }
});

sendButton.addEventListener("click", sendChatInput);

function sendChatInput() {
    if (chatInput.value !== '') {
        socketEmit("message", chatInput.value);
    };
};

socketEmit("message", ""); // connect, please!

function clearChatInput() {
    chatInput.value = "";
    chatInput.innerHTML = '';
};