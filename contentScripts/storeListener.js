var Log = pfLogger("[Arcacon+] [storeListener.js]");
Log("Loaded.");


var urlParts = window.location.pathname.split("/");
var cID = urlParts.pop() || urlParts.pop(); // Remove potential '/' end
var cTitle = $(".title-row .title").text().trim();

Log(`cID: ${cID}, cTitle: ${cTitle}`);


$(document).on("click", ".article-wrapper .btn-arca", () => { // Add
    var request = { req: "addArcaconInfo", cID, cTitle };
    sendCMessage(request); // To background.js
    Log(JSON.stringify(request));
});

$(document).on("click", ".article-wrapper .btn-danger", () => { // Remove
    var request = { req: "removeArcaconInfo", cID, cTitle };
    sendCMessage(request); // To background.js
    Log(JSON.stringify(request));
});
