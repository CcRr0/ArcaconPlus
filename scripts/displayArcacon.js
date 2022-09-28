function displayArcacon(query, cThumbnails, arcaconInfo) {
    if(!query.length) {
        cThumbnails.find("img").css("display", "");
        return;
    }
    cThumbnails.find("img").css("display", "none");
    cThumbnails.find("img[data-id='0']").css("display", "");
    arcaconInfo.forEach((cTitle, cID) => {
        if(cTitle.replace(/ /g, '').includes(query)) {
            cThumbnails.find(`img[data-id='${cID}']`).css("display", "");
        }
    });
}
