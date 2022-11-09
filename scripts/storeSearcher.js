function $storeSearcher(cThumbnails) {
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
