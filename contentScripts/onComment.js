$(document).ready(async () => {
    console.log("[Arcacon+] onComment.js Loaded.");

    const aS = "ArcaconSearcher_c";

    var arcaconInfo = await new Promise(resolve =>
        chrome.storage.sync.get("arcaconInfo", data => resolve((() => {
            if(data.arcaconInfo) return JSON.parse(data.arcaconInfo, MapReviver);
            else return new Map();
        })()))
    );

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
    });


    $(document).on("click", ".btn-namlacon", function(e) {
        if(e.target.className == aS) {
            $(this).parent().parent().parent().find(".namlacon").css("display", "block");
        }

        var ArcaconSearcher = $(this).find(`.${aS}`);
        if(!ArcaconSearcher.length) {
            var conTainer = $(this).parent().parent().parent().find(".namlacon").get(0);
            observer.observe(conTainer, { attributes: true });

            var input = document.createElement("input");
            input.className = aS;
            input.placeholder = "아카콘 검색하기";
            $(this).prepend($(input))
                .ready(() => {
                    activateSearcher($(input));
                });

            var cThumbnails = $(this).parent().parent().parent().find(".thumbnails").get(0);
            titleLoader.observe(cThumbnails, { childList: true, subtree: true });
        }
    });

    $(document).on("change keyup paste", `.${aS}`, function() {
        var query = $(this).val();
        var cThumbnails = $(this).parent().parent().parent().parent().find(".thumbnails");
        displayArcacon(query, cThumbnails, arcaconInfo);
    });



    const width = "200px";
    function activateSearcher(target) {
        target.prop("active", true);
        target.css("opacity", "1");
        target.css("width", width);
        target.css("margin", "0 10px 0 5px");
        target.css("border-width", "2px");
    }
    function deactivateSearcher(target) {
        target.prop("active", false);
        target.css("opacity", "0");
        target.css("width", "0");
        target.css("margin", "0");
        target.css("border-width", "0");
    }
});
