$(document).ready(async () => {
    var log = pfLogger("[Arcacon+] [onWrite.js]");
    log("Loaded.");
    sendCMessage({ req: "status", status: "write" });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if(request.req == "status") sendResponse("write");
        return true;
    });


    const aS = "ArcaconSearcher_w";

    var arcaconInfo = await getArcaconInfo();

    var searcherActive = false;
    var observer = new MutationObserver(mutations => {
        var conActive = mutations[0].target.classList.contains("fr-active");
        if(conActive && !searcherActive) {
            activateSearcher($(`.${aS}`));
            searcherActive = true;
        } else if(!conActive && searcherActive) {
            deactivateSearcher($(`.${aS}`));
            searcherActive = false;
        }
    });

    var titleLoader = new MutationObserver((mutations, observer) => {
        observer.disconnect();
        var cThumbnails = $(mutations[0].target);
        cThumbnails.find("img").each(function() {
            $(this).attr("title", arcaconInfo.get($(this).attr("data-id")));
        });
        cThumbnails.append($storeSearcher());
    });


    $(document).arrive("#arcacon-1", function() {
        $(this).before($arcaconSearcher(aS));
    });

    $(document).arrive(".namlacon", function() {
        activateSearcher($(`.${aS}`));
        searcherActive = true;
        observer.observe(this.parentNode, { attributes: true });
        titleLoader.observe($(".thumbnails").get(0), { childList: true, subtree: true });
    });

    $(document).on("click", `.${aS}`, () => {
        $(".fr-toolbar").css("z-index", "5");
        $("#arcacon-1").addClass("fr-btn-active-popup");
        $(".namlacon").parent().addClass("fr-active");
    });

    $(document).arrive(".thumbnails", function() {
        var cThumbnails = $(this);
        $(document).on("input", `.${aS}`, function() {
            var query = $(this).val();
            displayArcacon(query, cThumbnails, arcaconInfo);
        });
    });



    const width = "200px";
    const margin = "10px";
    function activateSearcher(target) {
        target
            .css({
                "opacity": "1",
                "width": width,
                "border-width": "2px",
                "transform": `translate(calc((${width} + ${margin}) * -1), -50%)`
            });
    }
    function deactivateSearcher(target) {
        target
            .val("")
            .css({
                "opacity": "0",
                "width": "0",
                "border-width": "0",
                "transform": "translate(0, -50%)"
            });
        displayArcacon("", $(".thumbnails"));
    }
});
