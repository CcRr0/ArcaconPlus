importScripts("/scripts/chromeEx.js", "/scripts/moment.min.js");


var arcaconUpdating = false;
var arcaconStatus, currentTabID;
var arcaconInfo, cIDList, cIDUpdatedN, totalCount, arcaconSaveDate; // arcaconStatus
const defaultLoadDelay = 0.25;
var loadDelay, cFinished, errorCaught; // From popup.js, req: arcaconUpdateInit


var autoReconnector = (tabID, change, tab) => {
    if((tabID == currentTabID && (change.status == "complete" || "isWindowClosing" in change)) || // Current tab loaded or closed
        (!currentTabID && change.status == "complete")) { // New tab loaded

        if(tab && (new URL(tab.url)).hostname == "arca.live") { // Just a refresh on current tab || New arca.live tab loaded
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

/*var activeTabReconnector = async (activeInfo) => {
    if(new URL(await getActiveTabURL()).hostname == "arca.live") {
        currentTabID = activeInfo.tabId;
        console.log(currentTabID);
        sendCMessage({ req: "loadArcacon", cIDList, loadDelay }, currentTabID);
    }
};*/


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.req == "arcaconUpdating") { // from popup.js
        console.log("[Arcacon+] [background.js] req: arcaconUpdating");

        sendResponse(arcaconUpdating);
    }

    else if(request.req == "arcaconStatus") { // from popup.js
        console.log("[Arcacon+] [background.js] req: arcaconStatus");

        (async () => {
            if(!arcaconUpdating) {
                arcaconStatus = await sendCMessage({ req: "arcaconStatus" }, currentTabID = await getActiveTabID()); // to contentScript.js
                arcaconInfo = JSON.parse(arcaconStatus.arcaconInfo, MapReviver);
                cIDList = arcaconStatus.cIDUpdated;
                cIDUpdatedN = cIDList.length;
                totalCount = arcaconInfo.size + cIDList.length;
                arcaconSaveDate = arcaconStatus.arcaconSaveDate;
            }

            sendResponse({ totalCount, cIDUpdatedN, arcaconSaveDate, loadDelay: defaultLoadDelay });
        })();
    }

    else if(request.req == "arcaconUpdateInit") {
        console.log("[Arcacon+] [background.js] req: arcaconUpdateInit");

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
        //chrome.tabs.onActivated.addListener(activeTabReconnector);
    }

    else if(request.req == "newArcaconInfo") {
        console.log("[Arcacon+] [background.js] req: newArcaconInfo");

        if(!arcaconUpdating) return true;

        if(!request.status) {
            if(!errorCaught) {
                errorCaught = true;
                setArcaconInfo(arcaconInfo).then(() => {
                    arcaconUpdating = false;
                    console.log(`[Arcacon+] [background.js] Error, statusCode: ${request.statusCode}`);
                    console.log("[Arcacon+] [background.js] arcaconInfo Updated.");

                    chrome.tabs.onUpdated.removeListener(autoReconnector);
                    chrome.tabs.onRemoved.removeListener(autoReconnector);
                    //chrome.tabs.onActivated.removeListener(activeTabReconnector);
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
        chrome.action.setBadgeText({ text: statusPt + "%" });

        if(!cIDList.length) { // Update finished
            setArcaconInfo(arcaconInfo).then(() => {
                arcaconUpdating = false;
                console.log("[Arcacon+] [background.js] arcaconInfo Updated.");

                chrome.tabs.onUpdated.removeListener(autoReconnector);
                chrome.tabs.onRemoved.removeListener(autoReconnector);
                //chrome.tabs.onActivated.removeListener(activeTabReconnector);
            });
        }
    }


    return true;
});
