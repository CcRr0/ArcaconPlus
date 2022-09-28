console.log("[Arcacon+] background.js Loaded.");

var cIDUpdated, cIDRemoved;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.req == "loadArcacon") {
        console.log("[Arcacon+] [loadArcacon] Received request.");

        var loadDelay = request.loadDelay; //sec
        var jqError = false;
        var _Promise = Promise.resolve();
        cIDUpdated.forEach(cID => {
            _Promise = _Promise.then(() => {
                if(jqError) return Promise.reject();
                $.get("/e/" + cID)
                    .done(data => {
                        var cTitle = $(data).find(".title-row .title").text().trim();
                        chrome.runtime.sendMessage({ req: "newArcaconInfo", status: true, cID, cTitle });
                    }).fail(jqXHR => {
                        jqError = true;
                        var statusCode = jqXHR.status;
                        console.log("[Arcacon+] [loadArcacon] Error: " + statusCode);
                        chrome.runtime.sendMessage({ req: "newArcaconInfo", status: false, statusCode });
                    });
                return new delay(loadDelay * 1000);
            });
        });

        return true;
    }


    if(request.req == "arcaconStatus") {
        console.log("[Arcacon+] [arcaconStatus] Received request.");

        (async () => {
            var arcaconStatus = await new Promise(resolve =>
                chrome.storage.sync.get(["arcaconInfo", "arcaconSaveDate"], resolve)
            );
            var arcaconInfo = (() => {
                if(arcaconStatus.arcaconInfo) return JSON.parse(arcaconStatus.arcaconInfo, MapReviver);
                else return new Map();
            })();
            var arcaconSaveDate = arcaconStatus.arcaconSaveDate;

            await $.get("/settings/emoticons", async (data) => {
                var $emoticonList = $(data).find("table[data-action-role='emoticons.enabled'] .emoticon-list input");
                cIDUpdated = new Array();
                cIDRemoved = Array.from(arcaconInfo.keys()); //Only Removed Will Remain
                await $emoticonList.each(function() {
                    var cID = $(this).attr("value");
                    if(arcaconInfo.has(cID)) {
                        cIDRemoved.splice(cIDRemoved.indexOf(cID), 1); //Remove cID from cIDRemoved
                        return true; //continue;
                    }
                    cIDUpdated.push(cID);
                });
            });

            sendResponse({ arcaconInfo: JSON.stringify(arcaconInfo, MapReplacer), arcaconSaveDate, cIDUpdated, cIDRemoved });
        })();

        return true;
    }

    if(request.req == "loadArcacon") {
        console.log("[Arcacon+] [loadArcacon] Received request.");

        var loadDelay = request.loadDelay; //sec
        var _Promise = Promise.resolve();
        cIDUpdated.forEach(cID => {
            _Promise = _Promise.then(() => {
                $.get("/e/" + cID, data => {
                    var cTitle = $(data).find(".title-row .title").text().trim();
                    chrome.runtime.sendMessage({ req: "newArcaconInfo", cID, cTitle });
                }).fail(jqXHR => {
                    console.log("[Arcacon+] [loadArcacon] Error: " + jqXHR);
                });
                return new Promise(resolve => setTimeout(resolve, loadDelay * 1000));
            });
        });

        return true;
    }
});

