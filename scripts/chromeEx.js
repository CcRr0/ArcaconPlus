// Logging with Prefix
function pfLogger(pF) {
    return log => console.log(`${pF} ${log}`);
}


// popup.js
function getHostName(url) {
    return (new URL(url)).hostname;
}

async function getActiveTabID() {
    return new Promise(resolve =>
        chrome.tabs.query({ active: true, currentWindow: true }, tabs =>
            resolve(tabs[0].id)
        )
    );
}


// Chrome Storage
async function getCStorage(storage) {
    return new Promise(resolve =>
        chrome.storage.local.get([storage], data => resolve(data[storage]))
    );
}

async function setCStorage(data) {
    return new Promise(resolve =>
        chrome.storage.local.set(data, resolve)
    );
}


// ArcaconInfo
async function getArcaconInfo() {
    var arcaconInfo = await getCStorage("arcaconInfo");
    if(arcaconInfo) return JSON.parse(arcaconInfo, MapReviver);
    else return new Map();
}

async function setArcaconInfo(arcaconInfo) { // Requires moment.js
    return setCStorage({
        arcaconInfo: JSON.stringify(arcaconInfo, MapReplacer),
        arcaconSaveDate: moment().format("YYYY-MM-DD HH:mm:ss")
    });
}


// Map Parse & Stringify
function MapReplacer(key, value) {
    if(value instanceof Map) {
        return {
            dataType: "Map",
            value: Array.from(value.entries())
        };
    } else {
        return value;
    }
}

function MapReviver(key, value) {
    if(typeof value === "object" && value !== null) {
        if(value.dataType === "Map") {
            return new Map(value.value);
        }
    }
    return value;
}


// Chrome Extension Messaging
async function sendCMessage(request, tabID = undefined) {
    return new Promise(resolve => {
        if(!tabID) chrome.runtime.sendMessage(request, resolve);
        else chrome.tabs.sendMessage(tabID, request, resolve);
    });
}


// Watching Tab Changes
async function findTabIDByHost(host) {
    return new Promise(resolve => {
        chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
                if(getHostName(tab.url) == host) {
                    resolve(tab.id);
                }
            });
            resolve(false);
        });
    });
}

async function getActiveTabURL() {
    return new Promise(resolve =>
        chrome.tabs.query({ active: true, currentWindow: true }, tabs =>
            resolve(tabs[0].url)
        )
    );
}


// Badge
function setBadgeText(text, color = undefined, tabId = undefined) {
    if(color) setBadgeColor(color, tabId);
    chrome.action.setBadgeText({ text: String(text), tabId });
}

function setBadgeColor(color, tabId = undefined) {
    chrome.action.setBadgeBackgroundColor({ color, tabId });
}
