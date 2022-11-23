importScripts("/scripts/chromeEx.js", "/scripts/moment.min.js");
var Log = pfLogger("[Arcacon+] [background.js]");



var startupChecked = false;
var arcaconUpdating = false;
var arcaconStatus, currentTabID;
var arcaconInfo, cIDList = new Array(), cIDUpdatedN, totalCount, arcaconSaveDate; // arcaconStatus
const defaultLoadDelay = 0.4;
var loadDelay, cFinished, errorCaught; // From popup.js, req: arcaconUpdateInit


var displayCurrent = () => {
    setBadgeText(arcaconInfo.size, "green");
};
(async () => {
    arcaconInfo = await getArcaconInfo();
    displayCurrent();
})();

var loadArcaconStatus = async () => {
    setBadgeText(" ... ", "blue");

    arcaconStatus = await sendCMessage({ req: "arcaconStatus" }, currentTabID = await getActiveTabID()); // to contentScript.js
    arcaconInfo = JSON.parse(arcaconStatus.arcaconInfo, MapReviver);
    cIDList = arcaconStatus.cIDUpdated;
    cIDUpdatedN = cIDList.length;
    totalCount = arcaconInfo.size + cIDList.length;
    arcaconSaveDate = arcaconStatus.arcaconSaveDate;

    if(cIDUpdatedN) {
        setBadgeText(`${cIDUpdatedN}!`, "blue");
    } else {
        displayCurrent();
    }
};


var autoReconnector = (tabID, change, tab) => {
    if((tabID == currentTabID && (change.status == "complete" || "isWindowClosing" in change)) || // Current tab loaded or closed
        (!currentTabID && change.status == "complete")) { // New tab loaded

        if(tab && getHostName(tab.url) == "arca.live") { // Just a refresh on current tab || New arca.live tab loaded
            sendCMessage({ req: "loadArcacon", cIDList, loadDelay }, currentTabID = tabID); // If !currentTabID then replace it
        } else { // Tab closed or moved to another host
            (async () => {
                currentTabID = await findTabIDByHost("arca.live"); // Will be false if not found
                if(currentTabID) {
                    sendCMessage({ req: "loadArcacon", cIDList, loadDelay }, currentTabID); // Move to another tab
                }
            })();
        }
    }
};



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    Log(JSON.stringify(request));

    if(request.req == "contentScript") {
        chrome.action.setPopup({ popup: "/popup/popup.html", tabId: sender.tab.id });
        if(!startupChecked) {
            loadArcaconStatus().then(() => startupChecked = true);
        }
    }

    if(request.req == "arcaconUpdating") { // from popup.js
        sendResponse(arcaconUpdating);
    }

    else if(request.req == "arcaconStatus") { // from popup.js
        (async () => {
            if(!arcaconUpdating) {
                await loadArcaconStatus();
            }

            sendResponse({ totalCount, cIDUpdatedN, arcaconSaveDate, loadDelay: defaultLoadDelay });
        })();
    }

    else if(request.req == "arcaconUpdateInit") {
        arcaconUpdating = true;

        loadDelay = request.loadDelay;
        if(loadDelay < defaultLoadDelay) {
            loadDelay = defaultLoadDelay;
        }
        sendResponse(loadDelay);

        cFinished = 0;
        errorCaught = false;

        sendCMessage({ req: "loadArcacon", cIDList, loadDelay }, currentTabID);

        chrome.tabs.onUpdated.addListener(autoReconnector);
        chrome.tabs.onRemoved.addListener(autoReconnector);
    }

    else if(request.req == "newArcaconInfo") {
        if(!arcaconUpdating) return true;

        if(!request.status) {
            if(!errorCaught) {
                errorCaught = true;
                setArcaconInfo(arcaconInfo).then(() => {
                    arcaconUpdating = false;
                    Log(`Error, statusCode: ${request.statusCode}`);
                    Log("arcaconInfo Updated.");

                    setBadgeText(request.statusCode, "red");
                    setTimeout(() => {
                        displayCurrent();
                    }, 1500);

                    chrome.tabs.onUpdated.removeListener(autoReconnector);
                    chrome.tabs.onRemoved.removeListener(autoReconnector);
                    sendCMessage({ req: "arcaconUpdateStatus", status: false, statusCode: request.statusCode });
                });
            }
            return true;
        } else if(errorCaught) return true;

        if(!cIDList.includes(request.cID)) { // Duplicate?
            return true;
        }


        arcaconInfo.set(request.cID, request.cTitle);
        cIDList.splice(cIDList.indexOf(request.cID), 1); // Remove finished, only send remained to contentScript.js

        sendCMessage({
            req: "arcaconUpdateStatus",
            status: true,
            cTitle: request.cTitle,
            cFinished: ++cFinished
        }); // To popup.js

        var statusPt = Math.floor((arcaconInfo.size / totalCount) * 100);
        setBadgeText(statusPt + "%", "blue");

        if(!cIDList.length) { // Update finished
            setArcaconInfo(arcaconInfo).then(() => {
                arcaconUpdating = false;
                Log("arcaconInfo Updated.");

                setBadgeText("100%", "green");
                setTimeout(() => {
                    displayCurrent();
                }, 1500);

                chrome.tabs.onUpdated.removeListener(autoReconnector);
                chrome.tabs.onRemoved.removeListener(autoReconnector);
            });
        }
    }

    else if(request.req == "addArcaconInfo") { // From storeListener.js
        if(arcaconUpdating) return true;
        (async () => {
            arcaconInfo = await getArcaconInfo();
            arcaconInfo.set(request.cID, request.cTitle);
            await setArcaconInfo(arcaconInfo);
            Log(`arcaconInfo Updated. cID: ${request.cID}, cTitle: ${request.cTitle}`);
            setBadgeText("100%", "green");
            setTimeout(() => {
                displayCurrent();
            }, 1500);
        })();
    }

    else if(request.req == "removeArcaconInfo") { // From storeListener.js
        if(arcaconUpdating) return true;
        (async () => {
            arcaconInfo = await getArcaconInfo();
            arcaconInfo.delete(request.cID);
            await setArcaconInfo(arcaconInfo);
            Log(`arcaconInfo Removed. cID: ${request.cID}, cTitle: ${request.cTitle}`);
            setBadgeText("100%", "green");
            setTimeout(() => {
                displayCurrent();
            }, 1500);
        })();
    }

    else if(request.req == "status") { // From onComment.js || onWrite.js
        if(!startupChecked || arcaconUpdating || cIDList.length) return true;
        setBadgeColor("mediumspringgreen", sender.tab.id);
    }


    return true;
});
