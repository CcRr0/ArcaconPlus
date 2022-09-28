
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    var hostname = (new URL(tabs[0].url)).hostname;
    if(hostname == "arca.live") {
        executeScript();
    } else {
        window.close();
    }
});

function executeScript() {
    $(document).ready(async () => {
        var activeTabID = await new Promise(resolve => {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                resolve(tabs[0].id);
            });
        });

        var arcaconStatus = await new Promise(resolve => {
            chrome.tabs.sendMessage(activeTabID, { req: "arcaconStatus" }, resolve);
        });
        var arcaconInfo = JSON.parse(arcaconStatus.arcaconInfo, MapReviver);
        var arcaconSaveDate = arcaconStatus.arcaconSaveDate;
        var cIDUpdated = arcaconStatus.cIDUpdated;
        var cIDRemoved = arcaconStatus.cIDRemoved;
        var totalCount = arcaconInfo.size + cIDUpdated.length - cIDRemoved.length;

        var updateRequired = cIDUpdated.length + cIDRemoved.length;

        var statusDisplay = () => { return `(${arcaconInfo.size - cIDRemoved.length}/${totalCount})` };
        var progressDisplay = (cTitle = String()) => {
            $(".loadProgress")
                .attr("max", totalCount)
                .attr("value", arcaconInfo.size - cIDRemoved.length)
                .attr("data-label", `${cTitle} ${statusDisplay()}`);
        };
        progressDisplay();

        if(arcaconSaveDate) {
            $(".status").text("마지막 업데이트: " + arcaconSaveDate);
        } else {
            $(".status").text("마지막 업데이트: 기록 없음");
        }
        if(cIDUpdated.length) $(".cIDUpdated").html(`추가된 아카콘: ${cIDUpdated.length}개<br>`);
        if(cIDRemoved.length) $(".cIDRemoved").html(`삭제된 아카콘: ${cIDRemoved.length}개<br>`);

        var loadDelay = 0.25; //sec
        $(".loadDelay").val(loadDelay);

        if(updateRequired) {
            $(".loadArcacon").text(`아카콘 로드하기 (${cIDUpdated.length})`);
            $(".loadDelayCt").css("display", "inline");
            $(".loadArcacon").on("click", function() {
                $(this).off("click");
                $(this).text("업데이트 중...");
                $(".status").text("업데이트 중...");
                $(".loadDelay").prop("readonly", true);

                cIDRemoved.forEach(e => arcaconInfo.delete(e));
                cIDRemoved = new Array();

                if(!cIDUpdated.length) {
                    chrome.storage.sync.set({
                        arcaconInfo: JSON.stringify(arcaconInfo, MapReplacer),
                        arcaconSaveDate: moment().format(timeFormat)
                    }, () => {
                        $(".eta").text("");
                        $(".status").text("업데이트 완료!");
                        $(".loadArcacon").text("업데이트 완료!");
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    });
                    return;
                }

                loadDelay = Number($(".loadDelay").val());
                chrome.tabs.sendMessage(activeTabID, { req: "loadArcacon", loadDelay });
            });
        } else {
            $(".loadArcacon").text("최신 상태입니다.");
        }

        var cFinished = 0;
        var errorCaught = false;
        const timeFormat = "YYYY-MM-DD HH:mm:ss";
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if(request.req == "newArcaconInfo") {
                if(!request.status && !errorCaught) {
                    errorCaught = true;
                    chrome.storage.sync.set({
                        arcaconInfo: JSON.stringify(arcaconInfo, MapReplacer),
                        arcaconSaveDate: moment().format(timeFormat)
                    }, () => {
                        $(".eta").text("");
                        $(".status").text(`Error ${request.statusCode}, 다시 시도하세요.`);
                        $(".loadArcacon").text("업데이트 실패.");
                    });

                    return true;
                }

                var cID = request.cID;
                var cTitle = request.cTitle;
                arcaconInfo.set(cID, cTitle);

                progressDisplay(cTitle);
                var eta = (cIDUpdated.length - ++cFinished) * loadDelay;
                var m = Math.floor(eta / 60); var s = Math.round(eta - m * 60);
                $(".eta").text(`(남은 시간: ${m}:${s})`);

                if(cFinished == cIDUpdated.length) {
                    chrome.storage.sync.set({
                        arcaconInfo: JSON.stringify(arcaconInfo, MapReplacer),
                        arcaconSaveDate: moment().format(timeFormat)
                    }, () => {
                        $(".eta").text("");
                        $(".status").text("업데이트 완료!");
                        $(".loadArcacon").text("업데이트 완료!");
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    });
                }

                return true;
            }
        });
    });
}
