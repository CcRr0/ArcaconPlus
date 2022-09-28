$(document).ready(async () => {
    console.log("[Arcacon+] onWrite.js Loaded.");

    const aS = "ArcaconSearcher_w";

    var arcaconInfo = await new Promise(resolve =>
        chrome.storage.sync.get("arcaconInfo", data => resolve((() => {
            if(data.arcaconInfo) return JSON.parse(data.arcaconInfo, MapReviver);
            else return new Map();
        })()))
    );

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
    });


    $(document).arrive("#arcacon-1", function() {
        var input = document.createElement("input");
        input.className = aS;
        input.placeholder = "아카콘 검색하기";
        $(this).before($(input));
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

    $(document).on("change keyup paste", `.${aS}`, function() {
        var query = $(this).val();
        var cThumbnails = $(".thumbnails");
        displayArcacon(query, cThumbnails, arcaconInfo);
    });



    const width = "200px";
    const margin = "10px";
    function activateSearcher(target) {
        target.prop("active", true);
        target.css("opacity", "1");
        target.css("width", width);
        target.css("border-width", "2px");
        target.css({ transform: `translate(calc((${width} + ${margin}) * -1), -50%)` });
    }
    function deactivateSearcher(target) {
        target.prop("active", false);
        target.css("opacity", "0");
        target.css("width", "0");
        target.css("border-width", "0");
        target.css({ transform: "translate(0, -50%)" });
    }
});
