"use strict";

const DateTime = luxon.DateTime;
const socketReceive = window.electronAPI.socketReceive;
const socketEmit = window.electronAPI.socketEmit;
const getConfig = window.electronAPI.getConfig;
const recieveConfig = window.electronAPI.recieveConfig;
const writeConfig = window.electronAPI.writeConfig;
const copy = window.electronAPI.copy;

const roomPanel = document.getElementById("rooms");
const chatPanel = document.getElementById("chat");
const settingPanel = document.getElementById("settings");
const userPanel = document.getElementById("users");
const settingsButton = document.getElementById("settingsButton");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

const optionInput = {
    nicknameForm: document.getElementById("nicknameForm"),
    nicknameInput: document.getElementById("nicknameInput"),
    colorForm: document.getElementById("colorForm"),
    colorInputPicker: document.getElementById("colorInputPicker"),
    colorInputText: document.getElementById("colorInputText"),
    blockForm: document.getElementById("blockForm"),
    blockInput: document.getElementById("blockInput"),
    checkboxForm: document.getElementById("checkboxForm"),
    embedImagesInput: document.getElementById("embedImagesInput"),
    embedYoutubeInput: document.getElementById("embedYoutubeInput"),
    debugInput: document.getElementById("debugInput"),
    reloadConfigInput: document.getElementById("reloadConfigInput"),
};

// class User {
//     constructor(nick, home, color, blocked, joinDate, trusted) {
//         this.nick = nick ?? "anonymous";
//         this.home = home;
//         this.color = color ?? "white";
//         this.blocked = blocked ?? false;
//         this.joinDate = joinDate ?? Date.now();
//         this.trusted = trusted ?? false;
//     };
// };

// class Message {
//     constructor(date, user, content, trusted) {
//         this.date = date ?? Date.now();
//         this.user = user;
//         this.content = content;
//         this.trusted = trusted ?? false;
//     };
// };

class Block {
    constructor(home, comment) {
        this.home = home;
        this.comment = comment;
    };
};

class Config {
    constructor(nick, color, blocks, embedImages, embedYoutube, font, debug) {
        this.nick = nick ?? "anonymous";
        this.color = color ?? "white";
        this.blocks = blocks ?? [];
        this.embedImages = embedImages ?? false;
        this.embedYoutube = embedYoutube ?? false;
        this.font = font ?? undefined;
        this.debug = debug ?? false
    };
};

// const userArray = [];
// const messageArray = [];
// const roomArray = [];
// let initialUserJoin = false;
let initialConfigRecieve = false;

let currentNick = "";
let currentColor = "";

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

    const user = createUser(nick, color, home, false, trusted);
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

function createUser(nick, color, home, bot, trusted) {
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
        })
    };
    const invisibleRegex = /^[\s\u200B\u200C\u200D\u2060\uFEFF\u200E]*$/;
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
    bdiWrapper.addEventListener("contextmenu", function (event) { // Right-click
        event.preventDefault();
        user.classList.toggle("blocked");
        if (user.classList.contains("blocked")) {
            if (!config.blocks.some(block => block.home === this.title)) {
                const block = new Block(this.title, this.innerText);
                config.blocks.push(block);
            }
        } else {
            if (config.blocks.some(block => block.home === this.title)) {
                config.blocks = config.blocks.filter(block => block.home !== this.title);
            }
        };
        applyConfig();
        writeConfig(config);
    });

    user.appendChild(bdiWrapper);
    if (color && !cssColor.isInvisible(color)) {
        user.style = "color: white; color: " + color + ";";
    } else {
        user.style = "color: white;";
    };
    if (isHomeBlocked(home)) {
        user.classList.add("blocked");
    };
    if (bot) {
        user.classList.add("bot");
    };

    return user;
};

function isHomeBlocked(home) {
    return config.blocks.some(block => block.home === home);
};

function createBlockOption(block) {
    const blockOption = document.createElement("span");
    blockOption.classList.add("blockOption");
    const blockRemoveButton = document.createElement("button");
    blockRemoveButton.innerText = "-";
    blockRemoveButton.classList.add("blockInputRemove");
    blockRemoveButton.addEventListener("click", function (event) {

    });
    blockOption.appendChild(blockRemoveButton);
    const blockInputHome = document.createElement("input");
    blockInputHome.type = "text";
    blockInputHome.name = "blockInputHome";
    blockInputHome.classList.add("blockInputHome");
    blockInputHome.addEventListener("change", function (event) {

    });
    if (block.home) {
        blockInputHome.value = block.home;
    };
    blockOption.appendChild(blockInputHome);
    const blockInputComment = document.createElement("input");
    blockInputComment.type = "text";
    blockInputComment.name = "blockInputComment";
    blockInputComment.classList.add("blockInputComment");
    blockInputComment.addEventListener("change", function (event) {

    });
    if (block.comment) {
        blockInputComment.value = block.comment;
    };
    blockOption.appendChild(blockInputComment);

    const lineBreak = document.createElement("br");
    blockOption.appendChild(lineBreak);

    const children = optionInput.blockForm.children;
    const lastChildIndex = optionInput.blockForm.children.length - 1;
    const lastChild = children[lastChildIndex] ?? null;
    optionInput.blockForm.insertBefore(blockOption, lastChild);
};

// CSS Colors

const cssColor = {
    isInvisible: function (color) {
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
        const bg = getComputedStyle(document.body).backgroundColor.toLowerCase();
        return computed.toLowerCase() === bg;
    },
    toComputedHex: function (colorInput) {
        const temp = document.createElement("div");
        temp.style.color = colorInput;
        temp.style.display = "none";
        document.body.appendChild(temp);

        const computed = getComputedStyle(temp).color;
        document.body.removeChild(temp);

        const [r, g, b, a] = computed.match(/\d+(\.\d+)?/g).map(Number);
        const toHex = (n) => n.toString(16).padStart(2, "0");

        const hex = "#" + toHex(r) + toHex(g) + toHex(b);
        return a !== undefined && a < 1 ? hex + toHex(Math.round(a * 255)) : hex;
    },
    namedToHex: function (colorName) {
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.fillStyle = colorName;
        return ctx.fillStyle;
    },
    rgbToHex: function (input) {
        const normalize = input.trim().toLowerCase();
        const legacyMatch = normalize.match(/rgba?\(([^)]+)\)/);
        const modernMatch = normalize.match(/rgba?\(([^/]+)\/([^)]+)\)/);

        let r, g, b, a = 1;

        if (legacyMatch) {
            const parts = legacyMatch[1].split(/[\s,]+/).map(Number);
            [r, g, b] = parts;
            if (parts.length === 4) a = parts[3];
        } else if (modernMatch) {
            [r, g, b] = modernMatch[1].split(/[\s]+/).map(Number);
            a = modernMatch[2].includes("%")
                ? parseFloat(modernMatch[2]) / 100
                : parseFloat(modernMatch[2]);
        } else {
            return null; // Not an RGB(A) value
        }

        const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
        const alphaHex = toHex(a * 255);

        return "#" + toHex(r) + toHex(g) + toHex(b) + (a < 1 ? alphaHex : "");
    },
    hslToHex: function (input) {
        input = input.trim().toLowerCase();

        const legacy = input.match(/hsla?\(([^)]+)\)/);          // hsl(...) or hsla(...)
        const modern = input.match(/hsla?\(([^/]+)\/([^)]+)\)/);  // hsl(... / ...) style

        let h, s, l, a = 1;

        if (legacy) {
            let parts = legacy[1].split(/[\s,]+/).map(p => p.trim());
            h = parseFloat(parts[0]);
            s = parseFloat(parts[1]) / 100;
            l = parseFloat(parts[2]) / 100;
            if (parts.length === 4) {
                a = parts[3].includes("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
            }
        } else if (modern) {
            const coords = modern[1].split(/[\s]+/).map(p => p.trim());
            h = parseFloat(coords[0]);
            s = parseFloat(coords[1]) / 100;
            l = parseFloat(coords[2]) / 100;
            a = modern[2].includes("%") ? parseFloat(modern[2]) / 100 : parseFloat(modern[2]);
        } else {
            return null; // Not a valid HSL/HSLA string
        }

        // Convert HSL to RGB
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else[r, g, b] = [c, 0, x];

        const toHex = v => Math.round(255 * (v + m)).toString(16).padStart(2, "0");
        const alphaHex = a < 1 ? Math.round(255 * a).toString(16).padStart(2, "0") : "";

        return "#" + toHex(r) + toHex(g) + toHex(b) + alphaHex;
    },
};

// Program flow

// Chat
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

// Settings
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

document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", function (event) {
        event.preventDefault();
    });
});

optionInput.nicknameInput.addEventListener("change", function () {
    const value = optionInput.nicknameInput.value;
    config.nick = value;
    applyConfig();
    writeConfig(config);
});

optionInput.colorInputPicker.addEventListener("change", function () {
    const value = optionInput.colorInputPicker.value;
    optionInput.colorInputText.value = value;
    config.color = value;
    applyConfig();
    writeConfig(config);
});

optionInput.colorInputPicker.addEventListener("input", function () {
    const value = optionInput.colorInputPicker.value;
    optionInput.colorInputText.value = value;
});

optionInput.colorInputText.addEventListener("change", function () {
    const value = optionInput.colorInputText.value;
    optionInput.colorInputPicker.value = cssColor.toComputedHex(value);
    config.color = value;
    applyConfig();
    writeConfig(config);
});

optionInput.embedImagesInput.addEventListener("change", function () {
    const value = optionInput.embedImagesInput.checked;
    config.embedImages = value;
    applyConfig();
    writeConfig(config);
});

optionInput.embedYoutubeInput.addEventListener("change", function () {
    const value = optionInput.embedYoutubeInput.checked;
    config.embedYoutube = value;
    applyConfig();
    writeConfig(config);
});

optionInput.debugInput.addEventListener("change", function () {
    const value = optionInput.debugInput.checked;
    config.debug = value;
    applyConfig();
    writeConfig(config);
});

optionInput.reloadConfigInput.addEventListener("click", function () {
    getConfig();
});

// Configuration
const config = new Config();

recieveConfig((recievedConfig) => {
    config.nick = recievedConfig.nick ?? "anonymous";
    config.color = recievedConfig.color ?? "white";
    config.blocks = recievedConfig.blocks ?? [];
    config.embedImages = recievedConfig.embedImages ?? false;
    config.embedYoutube = recievedConfig.embedYoutube ?? false;
    config.font = recievedConfig.font;
    config.debug = recievedConfig.debug;
    applyConfig();
    if (!initialConfigRecieve) {
        initialConfigRecieve = true;
    };
    console.log("recieveConfig");
});

function applyConfig() {
    settingsButton.innerText = config.nick;
    optionInput.nicknameInput.value = config.nick;
    optionInput.colorInputText.value = config.color;
    optionInput.colorInputPicker.value = cssColor.toComputedHex(config.color);
    optionInput.embedImagesInput.checked = config.embedImages;
    optionInput.embedYoutubeInput.checked = config.embedYoutube;
    optionInput.debugInput.checked = config.debug;

    while (optionInput.blockForm.children.length > 1) {
        optionInput.blockForm.removeChild(optionInput.blockForm.firstElementChild);
    };
    for (const block of config.blocks) {
        createBlockOption(block);
    };

    if (currentNick !== config.nick ||
        currentColor !== config.color
    ) {
        currentNick = config.nick;
        currentColor = config.color;
        socketUserJoin();
    };

    console.log("applyConfig");
};

// Socket
socketReceive(function (event) {
    if (event.name === "connect") {
        console.log("Connected");
        if (!initialConfigRecieve) {
            getConfig();
        } else {
            socketUserJoin();
        };
    } else if (event.name === "update users") {
        users.innerHTML = "";
        rooms.innerHTML = "";
        const roomsList = [];
        for (let user in event.data) {
            const userLocation = event.data[user]
            const createdUser = createUser(userLocation.nick, userLocation.color, userLocation.home, userLocation.isBot, false);
            users.appendChild(createdUser);
            if (!roomsList.includes(userLocation.room)) {
                roomsList.push(userLocation.room);
                createRoom(userLocation.room);
            }
        };
        users.firstChild.classList.add("king");

    } else if (event.name === "user joined") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        if (!isHomeBlocked(event.data.home)) {
            createMessage(timestamp, ">", "lightgreen", "client",
                createUser(event.data.nick, event.data.color, event.data.home, false, false).outerHTML + " has joined!", true);
        };
    } else if (event.name === "user left") {
        const date = DateTime.fromMillis(Date.now());
        const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
        if (!isHomeBlocked(event.data.home)) {
            createMessage(timestamp, "<", "tomato", "client",
                createUser(event.data.nick, event.data.color, event.data.home, false, false).outerHTML + " has left!", true);
        };
    } else if (event.name === "user change nick") {
        if (event.data[0].nick !== event.data[1].nick && !isHomeBlocked(event.data.home)) {
            const date = DateTime.fromMillis(Date.now());
            const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
            createMessage(timestamp, "~", "gold", "client",
                createUser(event.data[0].nick, event.data[0].color, event.data[1].home, false, false).outerHTML +
                " is now known as " +
                createUser(event.data[1].nick, event.data[1].color, event.data[1].home, false, false).outerHTML + ".", true);
        }

    } else if (event.name === "message") {
        if (!config.blocks.some(block => block.home === event.data.home)) {
            const date = DateTime.fromMillis(Date.now());
            const timestamp = date.toLocaleString(DateTime.TIME_SIMPLE);
            const parsedContent = he.decode(event.data.msg).replace(/(?:\r\n|\r|\n)/g, '\n');
            createMessage(timestamp, event.data.nick, event.data.color, event.data.home, parsedContent, event.data.home === 'trollbox', false);
        };
    };
});

function socketUserJoin() {
    socketEmit("user joined", config.nick, config.color, "", "");
};

function socketReconnect() {
    socketEmit("message", "");
};

socketReconnect();