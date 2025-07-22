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
});

const rooms = document.getElementById("rooms");
const chat = document.getElementById("chat");
const settings = document.getElementById("settings");
const users = document.getElementById("users");
const settingsButton = document.getElementById("settingsButton");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

function createLinks(string) {
    string = string.replace(
        /\bhttps?:\/\/[^\s<]+/gi,
        (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
    return string;
};

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

    const messageMetadata = document.createElement("span");
    messageMetadata.className = "messageMetadata";
    message.appendChild(messageMetadata);

    const messageTimestamp = document.createElement("span");
    messageTimestamp.className = "timestamp";
    messageTimestamp.innerText = timestamp;
    messageMetadata.appendChild(messageTimestamp);

    const user = createUser(nick, color, home, false, false, trusted);
    messageMetadata.appendChild(user);

    const messageTransition = document.createElement("span");
    messageMetadata.appendChild(messageTransition);

    const messageContent = document.createElement("span");
    messageContent.className = "content";
    content = he.decode(content);
    if (trusted) {
        messageTransition.innerText = " ";
        content = createLinks(content);
    } else {
        messageTransition.innerText = ": "
        content = createLinks(DOMPurify.sanitize(content, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true
        }));
    };
    messageContent.innerHTML = content;
    message.appendChild(messageContent);

    const MAX_MESSAGES = 250;
    while (chat.children.length >= MAX_MESSAGES) {
        chat.removeChild(chat.firstChild);
    }

    chat.appendChild(message);
    chat.lastChild.scrollIntoView(true);
};

function createUser(nick, color, home, blocked, bot, trusted) {
    const user = document.createElement("span");
    user.style.fontWeight = "bold";
    user.className = "user";
    const bdiWrapper = document.createElement("bdi");
    if (trusted) {
        nick = he.decode(nick);
    } else {
        nick = DOMPurify.sanitize(he.decode(nick), {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true
        });
    };
    const invisibleRegex = /^[\s\u200B\u200C\u200D\u2060\uFEFF]*$/;
    const leadingTrailingWhitespaceRegex = /^[\s\u200B\u200C\u200D\u2060\uFEFF]+|[\s\u200B\u200C\u200D\u2060\uFEFF]+$/g;
    const allVisibleWhitespaceGroupsRegex = /[\t\n\r\f\v\u00A0 ]+/g;
    if (invisibleRegex.test(nick)) {
        nick = "anonymous";
    } else {
        nick = nick.replace(leadingTrailingWhitespaceRegex, "")
        .replace(allVisibleWhitespaceGroupsRegex, " ");
    };
    bdiWrapper.innerText = nick;

    bdiWrapper.title = home;
    bdiWrapper.addEventListener('click', (event) => {
        copy(event.target.title);
    })
    user.appendChild(bdiWrapper);
    if (color && !isCssColorInvisible(color)) {
        user.style = "color: white; color: " + color + ";";
    } else {
        user.style = "color: white;";
    }
    if (blocked) {
        user.classList.add("blocked");
    };
    if (bot) {
        user.classList.add("bot");
    };
    bdiWrapper.setAttribute("onclick", "copy('" + home + "');");
    return user;
};

function isCssColorInvisible(color) {
    const testElement = document.createElement("span");
    testElement.style.color = color;
    testElement.style.display = "none"; // avoid flashing
    document.body.appendChild(testElement);

    const computed = getComputedStyle(testElement).color;
    document.body.removeChild(testElement);

    // Check for transparency
    if (computed === "transparent" || computed === "rgba(0, 0, 0, 0)") {
        return true;
    }

    // Check for background color
    const bg = getComputedStyle(document.body).backgroundColor;
    return computed === bg;
}



onSocketReceive(function (event) {
    if (event.name === "connect") {
        console.log("Connected");
        getAppConfig();

    } else if (event.name === "update users") {
        users.innerHTML = "";
        rooms.innerHTML = "";
        let roomsList = [];
        for (let user in event.data) {
            let userLocation = event.data[user]
            let createdUser = createUser(userLocation.nick, userLocation.color, userLocation.home, false, userLocation.isBot, false);
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
            createUser(event.data.nick, event.data.color, event.data.home, false, false, false).outerHTML + " has joined!", true);

    } else if (event.name === "user left") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        createMessage(timestamp, "<", "tomato", "client",
            createUser(event.data.nick, event.data.color, event.data.home, false, false, false).outerHTML + " has left!", true);

    } else if (event.name === "user change nick") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        createMessage(timestamp, "~", "gold", "client",
            createUser(event.data[0].nick, event.data[0].color, event.data[1].home, false, false, false).outerHTML +
            " is now known as " +
            createUser(event.data[1].nick, event.data[1].color, event.data[1].home, false, false, false).outerHTML + ".", true);

    } else if (event.name === "message") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        const parsedContent = he.decode(event.data.msg).replace(/(?:\r\n|\r|\n)/g, '\n');
        createMessage(timestamp, event.data.nick, event.data.color, event.data.home, parsedContent, event.data.home==='trollbox', false);
    };
});



chatInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
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
