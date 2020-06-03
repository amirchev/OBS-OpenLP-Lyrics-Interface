var openlpChannel = new BroadcastChannel("obs_openlp_channel");
var currentLines;
var lastDisplayedIndex;

var max_saved_lines = 5;
var pastLines = [];
var pastPreviews = [];
var historyIndex = 0;

openlpChannel.onmessage = function (ev) {
    currentLines = JSON.parse(ev.data).lines;
    lastDisplayedIndex = -1;
    if ($("#auto-show-checkbox").prop("checked")) {
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
    openlpChannel.postMessage(linesToDisplay);

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
    var loadedDisplayAll = window.localStorage.getItem("displayAll");
    if (loadedDisplayAll !== null) {
        $("#display-all-checkbox").prop("checked", loadedDisplayAll === "true");
    }
    var loadedFont = window.localStorage.getItem("font");
    if (loadedFont !== null) {
        updateFontSize(loadedFont);
        $("#font-size-spinner").val(Number(loadedFont));
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
    $("#display-all-checkbox").change(function () {
        window.localStorage.setItem("displayAll", $(this).prop("checked"));
    })
    $("#font-size-spinner").change(function () {
        var font = $(this).val();
        updateFontSize(font);
        window.localStorage.setItem("font", font);
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
});
