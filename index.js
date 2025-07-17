"use strict";

const DateTime = luxon.DateTime;
const onSocketReceive = window.electronAPI.onSocketReceive;
const socketEmit = window.electronAPI.socketEmit;

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
    room.innerHTML = name;
    rooms.appendChild(room);
};

function createMessage(timestamp, nick, color, content) {
    const message = document.createElement("span");
    message.className = "message";

    const messageTimestamp = document.createElement("span");
    messageTimestamp.className = "timestamp";
    messageTimestamp.innerHTML = timestamp;
    message.appendChild(messageTimestamp);

    const messageNick = document.createElement("span");
    messageNick.className = "name";
    messageNick.innerHTML = nick;
    messageNick.style = 'color:' + color + ';';
    message.appendChild(messageNick);

    const messageContent = document.createElement("span");
    messageContent.className = "content";
    messageContent.innerHTML = content;
    message.appendChild(messageContent);

    chat.appendChild(message);
    chat.lastChild.scrollIntoView(true);
};

function createUser(nick, color, blocked, bot) {
    const user = document.createElement("span");
    user.className = "user";
    user.innerHTML = nick;
    if (color) {
        user.style = "color: " + color + ";";
    };
    if (blocked) {
        user.classList.add("blocked");
    };
    if (bot) {
        user.classList.add("bot");
    };
    users.appendChild(user);
};



onSocketReceive(function (event) {

    if (event.name === "connect") {
        console.log("Connected");
        socketEmit("user joined", "Ruxvania", "lavender", "", "");

    } else if (event.name === "message") {
        const date = DateTime.fromMillis(event.data.date);
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        const parsedContent = he.decode(event.data.msg).replace(/(?:\r\n|\r|\n)/g, '<br>');
        createMessage(timestamp, event.data.nick, event.data.color, parsedContent);

    } else if (event.name === "user joined") {
        const timestamp = DateTime.now().toLocaleString(DateTime.TIME_SIMPLE);
        const content = event.data.nick + " joined teh trollbox."
        createMessage(timestamp, ">", "lime", content);

    } else if (event.name === "user left") {
        const timestamp = DateTime.now().toLocaleString(DateTime.TIME_SIMPLE);
        const content = event.data.nick + " left teh trollbox."
        createMessage(timestamp, "<", "red", content);

    } else if (event.name === "update users") {
        users.innerHTML = "";
        for (let userLocation in event.data) {
            let user = event.data[userLocation]
            createUser(user.nick, user.color, false, user.isBot);
        };
        users.firstChild.classList.add("king");
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