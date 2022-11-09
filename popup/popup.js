validHost("arca.live", () => {
    $(document).ready(async () => {
        $(".contact").click(function() {
            chrome.tabs.create({ url: $(this).attr("href") });
        });


        var arcaconStatus = await sendCMessage({ req: "arcaconStatus" }); // To background.js
        var totalCount = arcaconStatus.totalCount;
        var cIDUpdatedN = arcaconStatus.cIDUpdatedN;
        var arcaconSaveDate = arcaconStatus.arcaconSaveDate;
        var loadDelay = arcaconStatus.loadDelay;

        if(cIDUpdatedN) $(".cIDUpdated").html(`추가된 아카콘: ${cIDUpdatedN}개<br>`);

        $(".loadDelayCt").css("display", "inline");
        $(".loadDelay").val(loadDelay).attr("placeholder", loadDelay);;


        var displayProgress = (value = totalCount - cIDUpdatedN, max = totalCount, cTitle = "") => {
            $(".loadProgress").attr({
                max,
                value,
                "data-label": `${cTitle} (${value}/${totalCount})`
            });
        };


        const arcaconUpdating = await sendCMessage({ req: "arcaconUpdating" });
        if(!arcaconUpdating) { // Normal status
            displayProgress();

            if(arcaconSaveDate)
                $(".status").text("마지막 업데이트: " + arcaconSaveDate);
            else
                $(".status").text("마지막 업데이트: 기록 없음");

            if(cIDUpdatedN) {
                $(".loadArcacon").text(`아카콘 로드하기 (${etaString(cIDUpdatedN * loadDelay)})`);
                $(".loadArcacon").on("click", function() {
                    loadDelay = Number($(".loadDelay").val());
                    if(isNaN(loadDelay)) return;

                    $(this).off("click");
                    $(this).text("업데이트 중...");
                    $(".status").text("업데이트 중...");
                    $(".loadDelay").prop("readonly", true);

                    sendCMessage({
                        req: "arcaconUpdateInit", // To background.js
                        loadDelay
                    }).then(lD => $(".loadDelay").val(loadDelay = lD)); // If loadDelay changed to defaultLoadDelay...
                });

                $(".loadDelay").on("input", function() {
                    loadDelay = Number($(".loadDelay").val());

                    if(isNaN(loadDelay)) $(".loadArcacon").text("아카콘 로드하기");
                    else $(".loadArcacon").text(`아카콘 로드하기 (${etaString(cIDUpdatedN * loadDelay)})`);
                });
            } else {
                $(".loadArcacon").text("최신 상태입니다.");
            }
        } else { // Updating...
            $(".loadArcacon").text("업데이트 중...");
            $(".status").text("업데이트 중...");
            $(".loadDelay").prop("readonly", true);
        }


        var errorCaught = false;
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if(request.req == "arcaconUpdateStatus") {
                if(!request.status) {
                    if(!errorCaught) {
                        errorCaught = true;
                        $(".eta").text("");
                        $(".status").text(`Error ${request.statusCode}, 다시 시도하세요.`);
                        $(".loadArcacon").text("업데이트 중단.");
                    }
                    return true;
                } else if(errorCaught) return true;

                var currentCount = totalCount - cIDUpdatedN + request.cFinished;
                displayProgress(currentCount, totalCount, request.cTitle);

                var etaStr = etaString((totalCount - currentCount) * loadDelay);
                $(".eta").text(`(남은 시간: ${etaStr})`);
                $(".loadArcacon").text(`업데이트 중... (${etaStr})`);


                if(currentCount == totalCount) {
                    $(".eta").text("");
                    $(".status").text("업데이트 완료!");
                    $(".loadArcacon").text("업데이트 완료!");
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }
            }

            return true;
        });



        function etaString(sec) {
            var m = Math.floor(sec / 60); var s = Math.round(sec - m * 60);
            return `${m}:${String(s).padStart(2, '0')}`;
        }
    });
});
