$(document).ready(async () => {
    var Log = pfLogger("[Arcacon+] [onComment.js]");
    Log("Loaded.");
    sendCMessage({ req: "status", status: "comment" });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if(request.req == "status") sendResponse("comment");
        return true;
    });
    

    const aS = "ArcaconSearcher_c";

    var arcaconInfo = await getArcaconInfo();

    var observer = new MutationObserver(mutations => {
        var ArcaconSearcher = $(mutations[0].target).parent().find(`.${aS}`);
        if(!ArcaconSearcher.prop("active"))
            activateSearcher(ArcaconSearcher);
        else
            deactivateSearcher(ArcaconSearcher);
    });

    var titleLoader = new MutationObserver((mutations, observer) => {
        observer.disconnect();
        var cThumbnails = $(mutations[0].target);
        cThumbnails.find("img").each(function() {
            $(this).attr("title", arcaconInfo.get($(this).attr("data-id")));
        });
        cThumbnails.append($storeSearcher());
    });


    $(document).on("click", ".btn-namlacon", function(e) {
        if(e.target.className == aS) {
            $(this).parent().parent().parent().find(".namlacon").css("display", "block");
            return;
        }

        var ArcaconSearcher = $(this).find(`.${aS}`);
        if(!ArcaconSearcher.length) {
            var conTainer = $(this).parent().parent().parent().find(".namlacon").get(0);
            observer.observe(conTainer, { attributes: true });

            var $aS = $arcaconSearcher(aS);
            $(this).prepend($aS)
                .ready(() => {
                    activateSearcher($aS);
                });

            var cThumbnails = $(this).parent().parent().parent().find(".thumbnails").get(0);
            titleLoader.observe(cThumbnails, { childList: true, subtree: true });
        }
    });

    $(document).on("focusin", `.${aS}`, function() {
        var cThumbnails = $(this).parent().parent().parent().parent().find(".thumbnails");
        $(this).on("input", function() {
            var query = $(this).val();
            displayArcacon(query, cThumbnails, arcaconInfo);
        });
    });

    $(document).on("focusout", `.${aS}`, function() {
        $(this).off("input");
    });



    const width = "200px";
    function activateSearcher(target) {
        target
            .prop("active", true)
            .focus()
            .css({
                "opacity": "1",
                "width": width,
                "margin": "0 10px 0 5px",
                "border-width": "2px"
            });
    }
    function deactivateSearcher(target) {
        target
            .prop("active", false)
            .blur()
            .val("")
            .css({
                "opacity": "0",
                "width": "0",
                "margin": "0",
                "border-width": "0"
            });
        displayArcacon("", $(target).parent().parent().parent().parent().find(".thumbnails"));
    }
});
