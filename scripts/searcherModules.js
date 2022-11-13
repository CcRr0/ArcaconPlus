function $arcaconSearcher(aS) {
    var input = document.createElement("input");
    input.className = aS;
    input.placeholder = "아카콘 검색하기";
    return $(input);
}

function displayArcacon(query, cThumbnails, arcaconInfo) {
    var ArcaconStore = cThumbnails.find(".ArcaconStore");
    if(!query.length) {
        cThumbnails.find("img").css("display", "");
        ArcaconStore.css("display", "none");
        return;
    }
    cThumbnails.find("img").css("display", "none");
    ArcaconStore.css("display", "flex");
    cThumbnails.find("img[data-id='0']").css("display", "");
    arcaconInfo.forEach((cTitle, cID) => {
        if(cTitle.replace(/ /g, "").includes(query)) {
            var c = cThumbnails.find(`img[data-id='${cID}']`);
            if(c.length) {
                c.css("display", "");
                ArcaconStore.css("display", "none");
            }
        }
    });
    ArcaconStore.find(".ArcaconStore_i").val(query);
}

function $storeSearcher() {
    var div = document.createElement("div");
    div.className = "ArcaconStore";

    var input = document.createElement("input");
    input.className = "ArcaconStore_i";
    input.placeholder = "아카콘 검색하기";

    var button = document.createElement("button");
    button.className = "ArcaconStore_b";
    button.innerText = "상점 검색";
    button.onclick = (e) => {
        e.preventDefault();
        window.open("/e/?target=title&keyword=" + encodeURIComponent(input.value));
    }

    div.append(input, button);
    
    return $(div);
}
