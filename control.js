var openlpChannel = new BroadcastChannel("obs_openlp_channel");
var currentLines;
var lastDisplayedIndex;

var autoResize = true;

var max_saved_lines = 5;
var pastLines = [];
var pastPreviews = [];
var historyIndex = 0;

var hiding = false;
var fadeDuration = 900;

openlpChannel.onmessage = function (ev) {
    var data = JSON.parse(ev.data);
    var type = data.type;
    if (type === "init") {
        openlpChannel.postMessage(JSON.stringify({type: "hideOnBlank", value: $("#auto-hide-checkbox").prop("checked")}));
        openlpChannel.postMessage(JSON.stringify({type: "fadeDuration", value: fadeDuration}));
        openlpChannel.postMessage(JSON.stringify({type: "hide", value: hiding}));
        openlpChannel.postMessage(JSON.stringify({type: "resize", value: autoResize}));
        openlpChannel.postMessage(JSON.stringify({type: "font", value: $("#lyrics-font-size-spinner").val()}));
    } else if (type === "lyrics") {
        currentLines = data.lines;
        lastDisplayedIndex = -1;
        if ($("#auto-update-checkbox").prop("checked")) {
            if ($("#display-all-checkbox").prop("checked")) {
                displayNext(currentLines.length);
            } else {
                displayNext(Number($("#increment-spinner-1").val()));
            }
        } else {
            var lines = "";
            for (var i = 0; i < currentLines.length; i++) {
                lines += currentLines[i] + "<br>";
            }
            $("#slide-text").html(lines);
        }
    }
};

function displayNext(amount) {
    if (amount <= 0) {
        return;
    }

    //for efficiency sake, prepare the lyrics and send them off, then prepare the preview
    var linesToDisplay = "";
    for (var i = lastDisplayedIndex + 1; i <= lastDisplayedIndex + amount && i < currentLines.length; i++) {
        linesToDisplay += currentLines[i] + "<br>";
    }
    if (linesToDisplay.length <= 0) {
        return;
    }
    openlpChannel.postMessage(JSON.stringify({type: "lyrics", value: linesToDisplay}));

    //update preview
    var preview = "";
    for (var i = 0; i < lastDisplayedIndex + 1 && i < currentLines.length; i++) {
        preview += currentLines[i] + "<br>";
    }
    preview += "<b>" + linesToDisplay + "</b>";
    lastDisplayedIndex += amount;
    for (var i = lastDisplayedIndex + 1; i < currentLines.length; i++) {
        preview += currentLines[i] + "<br>";
    }
    $("#slide-text").html(preview);

    //update previous lines
    for (var i = max_saved_lines - 1; i > 0; i--) {
        if (pastLines[i - 1] !== undefined) {
            pastLines[i] = pastLines[i - 1];
            console.log(i + " : " + pastLines[i]);
        }
        if (pastPreviews[i - 1] !== undefined) {
            pastPreviews[i] = pastPreviews[i - 1];
        }
    }
    pastLines[0] = linesToDisplay;
    pastPreviews[0] = preview;
    historyIndex = 0;
}

function displaySaved(index) {
    if (index < 0
            || index > max_saved_lines
            || pastLines[index] === undefined) {
        return;
    }
    openlpChannel.postMessage(pastLines[index]);
    $("#slide-text").html(pastPreviews[index]);
    historyIndex = index;
}

function updateFontSize(font) {
    $("*").css({"font-size": font + "pt"});
}
function updateButtonSize(opt) {
    if (opt === "Normal") {
        $("button").css({"padding-top": "4px", "padding-bottom": "4px"});
    } else if (opt === "Large") {
        $("button").css({"padding": "10px", "padding-bottom": "10px"});
    } else {
        $("button").css({"padding": "20px", "padding-bottom": "20px"});
    }
}
function loadSettings() {
    var loadedLineIncrement1 = window.localStorage.getItem("lineIncrement1");
    if (loadedLineIncrement1 !== null) {
        $("#increment-spinner-1").val(Number(loadedLineIncrement1));
    }
    var loadedLineIncrement2 = window.localStorage.getItem("lineIncrement2");
    if (loadedLineIncrement2 !== null) {
        $("#increment-spinner-2").val(Number(loadedLineIncrement2));
    }
    var loadedAutoUpdate = window.localStorage.getItem("autoUpdate");
    if (loadedAutoUpdate !== null) {
        $("#auto-update-checkbox").prop("checked", loadedAutoUpdate === "true");
    }
    var loadedAutoHide = window.localStorage.getItem("autoHide");
    if (loadedAutoHide !== null) {
        $("#auto-hide-checkbox").prop("checked", loadedAutoHide === "true");
    }
    var loadedResize = window.localStorage.getItem("autoResize");
    if (loadedResize !== null) {
        $("#resize-checkbox").prop("checked", loadedResize === "true");
    }
    var loadedDisplayAll = window.localStorage.getItem("displayAll");
    if (loadedDisplayAll !== null) {
        $("#display-all-checkbox").prop("checked", loadedDisplayAll === "true");
    }
    var loadedControlFont = window.localStorage.getItem("controlFont");
    if (loadedControlFont !== null) {
        updateFontSize(loadedControlFont);
        $("#control-font-size-spinner").val(Number(loadedControlFont));
    }
    var loadedLyricsFont = window.localStorage.getItem("lyricsFont");
    if (loadedLyricsFont !== null) {
        $("#lyrics-font-size-spinner").val(Number(loadedLyricsFont));
    }
    var loadedFadeDuration = window.localStorage.getItem("fadeDuration");
    if (loadedFadeDuration !== null) {
        fadeDuration = loadedFadeDuration;
        $("#fade-duration-spinner").val(Number(fadeDuration));
    }
    var loadedButtonSize = window.localStorage.getItem("buttonSize");
    if (loadedButtonSize !== null) {
        updateButtonSize(loadedButtonSize);
        $("#button-height-select").val(loadedButtonSize);
    }
}
$(function () {
    loadSettings();

    //add listeners
    $("#increment-spinner-1").change(function () {
        window.localStorage.setItem("lineIncrement1", $(this).val());
    });
    $("#increment-spinner-2").change(function () {
        window.localStorage.setItem("lineIncrement2", $(this).val());
    });
    $("#auto-update-checkbox").change(function () {
        window.localStorage.setItem("autoUpdate", $(this).prop("checked"));
    });
    $("#auto-hide-checkbox").change(function () {
        var checked = $(this).prop("checked");
        window.localStorage.setItem("autoHide", checked);
        openlpChannel.postMessage(JSON.stringify({type: "hideOnBlank", value: checked}));
    });
    $("#resize-checkbox").change(function () {
        var checked = $(this).prop("checked");
        window.localStorage.setItem("autoResize", checked);
        openlpChannel.postMessage(JSON.stringify({type: "resize", value: checked}));
    });
    $("#display-all-checkbox").change(function () {
        window.localStorage.setItem("displayAll", $(this).prop("checked"));
    });
    $("#control-font-size-spinner").change(function () {
        var font = $(this).val();
        updateFontSize(font);
        window.localStorage.setItem("controlFont", font);
    });
    $("#lyrics-font-size-spinner").change(function () {
        var font = $(this).val();
        window.localStorage.setItem("lyricsFont", font);
        openlpChannel.postMessage(JSON.stringify({type: "font", value: font}));
    });
    $("#fade-duration-spinner").change(function () {
        fadeDuration = $(this).val();
        window.localStorage.setItem("fadeDuration", fadeDuration);
        openlpChannel.postMessage(JSON.stringify({type: "fadeDuration", value: fadeDuration}));
    });
    $("#button-height-select").change(function () {
        var opt = $(this).val();
        updateButtonSize(opt);
        window.localStorage.setItem("buttonSize", opt);
    });
    $("#increment-button-1").click(function () {
        displayNext(Number($("#increment-spinner-1").val()));
    });
    $("#increment-button-2").click(function () {
        displayNext(Number($("#increment-spinner-2").val()));
    });
    $("#remaining-button").click(function () {
        displayNext(currentLines.length - (lastDisplayedIndex + 1));
    });
    $("#undo-button").click(function () {
        displaySaved(historyIndex + 1);
    });
    $("#redo-button").click(function () {
        displaySaved(historyIndex - 1);
    });
    $("#hide-button").click(function () {
        if (!hiding) {
            $(this).addClass("activeButton");
            hiding = true;
        } else {
            $(this).removeClass("activeButton");
            hiding = false;
        }
        openlpChannel.postMessage(JSON.stringify({type: "hide", value: hiding}));
    });
});
