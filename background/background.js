importScripts("/scripts/chromeEx.js", "/scripts/moment.min.js");
var Log = pfLogger("[Arcacon+] [background.js]");



var arcaconUpdating = false;
var arcaconStatus, currentTabID;
var arcaconInfo, cIDList = new Array(), cIDUpdatedN, totalCount, arcaconSaveDate; // arcaconStatus
const defaultLoadDelay = 0.5;
var loadDelay, cFinished, errorCaught; // From popup.js, req: arcaconUpdateInit


var displayCurrent = async (tabID = undefined) => {
    setBadgeTextV(arcaconInfo.size, "green", tabID);
};
(async () => {
    arcaconInfo = await getArcaconInfo();
    displayCurrent();
})();


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


chrome.tabs.onActivated.addListener(async activeInfo => {
    if(!arcaconUpdating && getHostName(await getActiveTabURL()) != "arca.live") {
        setBadgeText("", false, activeInfo.tabId);
    }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    Log(JSON.stringify(request));

    if(request.req == "arcaconUpdating") { // from popup.js
        sendResponse(arcaconUpdating);
    }

    else if(request.req == "arcaconStatus") { // from popup.js
        (async () => {
            if(!arcaconUpdating) {
                setBadgeTextV(" ... ", "blue", currentTabID = await getActiveTabID());

                arcaconStatus = await sendCMessage({ req: "arcaconStatus" }, currentTabID); // to contentScript.js
                arcaconInfo = JSON.parse(arcaconStatus.arcaconInfo, MapReviver);
                cIDList = arcaconStatus.cIDUpdated;
                cIDUpdatedN = cIDList.length;
                totalCount = arcaconInfo.size + cIDList.length;
                arcaconSaveDate = arcaconStatus.arcaconSaveDate;

                if(cIDUpdatedN) {
                    setBadgeTextV(`${cIDUpdatedN}!`, "blue", currentTabID); // For onComment, onWrite
                } else {
                    displayCurrent(currentTabID);
                    displayCurrent();
                }
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

                    setBadgeTextV(request.statusCode, "red", currentTabID);
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
        setBadgeTextV(statusPt + "%", "blue", currentTabID);

        if(!cIDList.length) { // Update finished
            setArcaconInfo(arcaconInfo).then(() => {
                arcaconUpdating = false;
                Log("arcaconInfo Updated.");

                setBadgeTextV("100%", "green", currentTabID);
                setTimeout(() => {
                    displayCurrent();
                }, 1500);

                chrome.tabs.onUpdated.removeListener(autoReconnector);
                chrome.tabs.onRemoved.removeListener(autoReconnector);
            });
        }
    }

    else if(request.req == "addArcaconInfo") { // From storeListener.js
        (async () => {
            arcaconInfo = await getArcaconInfo();
            arcaconInfo.set(request.cID, request.cTitle);
            await setArcaconInfo(arcaconInfo);
            Log(`arcaconInfo Updated. cID: ${request.cID}, cTitle: ${request.cTitle}`);
            displayCurrent();
        })();
    }

    else if(request.req == "removeArcaconInfo") { // From storeListener.js
        (async () => {
            arcaconInfo = await getArcaconInfo();
            arcaconInfo.delete(request.cID);
            await setArcaconInfo(arcaconInfo);
            Log(`arcaconInfo Removed. cID: ${request.cID}, cTitle: ${request.cTitle}`);
            displayCurrent();
        })();
    }

    else if(request.req == "status") { // From onComment.js || onWrite.js
        if(arcaconUpdating || cIDList.length) return true;

        if(request.status == "comment")
            text = " C ";
        else if(request.status == "write")
            text = " W ";

        setBadgeText(text, "mediumspringgreen", sender.tab.id);
    }


    return true;
});
