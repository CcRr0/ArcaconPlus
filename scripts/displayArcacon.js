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
