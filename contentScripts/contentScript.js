console.log("[Arcacon+] [contentScript.js] Loaded.");


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.req == "arcaconStatus") {
        console.log("[Arcacon+] [contentScript.js] req: arcaconStatus");

        (async () => {
            var arcaconInfo = await getArcaconInfo();
            var arcaconSaveDate = await getCStorage("arcaconSaveDate");
            var cIDUpdated, cIDRemoved;

            await $.get("/settings/emoticons", async (data) => {
                var $emoticonList = $(data).find("table[data-action-role='emoticons.enabled'] .emoticon-list input");
                cIDUpdated = new Array();
                cIDRemoved = Array.from(arcaconInfo.keys()); //Only Removed Will Remain
                await $emoticonList.each(function() {
                    var cID = $(this).attr("value");
                    if(arcaconInfo.has(cID)) {
                        cIDRemoved.splice(cIDRemoved.indexOf(cID), 1); //Remove cID from cIDRemoved
                    } else { //New
                        cIDUpdated.push(cID);
                    }
                });
                cIDRemoved.forEach(e => arcaconInfo.delete(e));
            });

            sendResponse({ arcaconInfo: JSON.stringify(arcaconInfo, MapReplacer), cIDUpdated, arcaconSaveDate });
        })();
    }

    else if(request.req == "loadArcacon") {
        console.log("[Arcacon+] [contentScript.js] req: loadArcacon");

        loadArcacon(request.cIDList, "newArcaconInfo", request.loadDelay * 1000);
    }


    return true;
});


function loadArcacon(cIDList, req, loadDelay) {
    var jqError = false;
    var _Promise = Promise.resolve();
    cIDList.forEach(cID => {
        _Promise = _Promise.then(() => {
            if(jqError) return Promise.reject();
            $.get("/e/" + cID)
                .done(data => {
                    var cTitle = $(data).find(".title-row .title").text().trim();
                    sendCMessage({ req, status: true, cID, cTitle });
                }).fail(jqXHR => {
                    jqError = true;
                    var statusCode = jqXHR.status;
                    console.log("[Arcacon+] [loadArcacon] Error: " + statusCode);
                    sendCMessage({ req, status: false, statusCode });
                });
            return sleep(loadDelay);
        });
    });
}
