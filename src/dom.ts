const roomPanel = <HTMLDivElement>document.getElementById("rooms");
const chatPanel = <HTMLDivElement>document.getElementById("chat");
const settingPanel = <HTMLDivElement>document.getElementById("settings");
const userPanel = <HTMLDivElement>document.getElementById("users");
const settingsButton = <HTMLButtonElement>document.getElementById("settingsButton");
const chatInput = <HTMLFormElement>document.getElementById("chatInput");
const sendButton = <HTMLButtonElement>document.getElementById("sendButton");
const blockInputAdd = <HTMLButtonElement>document.getElementById("blockInputAdd");

const optionInput: Record<string, HTMLFormElement> = {
    nicknameForm: <HTMLFormElement>document.getElementById("nicknameForm"),
    nicknameInput: <HTMLFormElement>document.getElementById("nicknameInput"),
    colorForm: <HTMLFormElement>document.getElementById("colorForm"),
    colorInputPicker: <HTMLFormElement>document.getElementById("colorInputPicker"),
    colorInputText: <HTMLFormElement>document.getElementById("colorInputText"),
    blockForm: <HTMLFormElement>document.getElementById("blockForm"),
    blockInput: <HTMLFormElement>document.getElementById("blockInput"),
    checkboxForm: <HTMLFormElement>document.getElementById("checkboxForm"),
    embedImagesInput: <HTMLFormElement>document.getElementById("embedImagesInput"),
    embedYoutubeInput: <HTMLFormElement>document.getElementById("embedYoutubeInput"),
    debugInput: <HTMLFormElement>document.getElementById("debugInput"),
    serverInput: <HTMLFormElement>document.getElementById("serverInput"),
    serverInputContainer: <HTMLFormElement>document.getElementById("serverContainer"),
    reloadConfigInput: <HTMLFormElement>document.getElementById("reloadConfigInput"),
    restoreServer: <HTMLFormElement>document.getElementById("restoreServer"),
    extraData: <HTMLFormElement>document.getElementById("userBio")
};

export {roomPanel, chatInput, chatPanel, settingPanel, settingsButton, sendButton, userPanel, blockInputAdd, optionInput}