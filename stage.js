const LEFT = 0, RIGHT = 1, CENTER = 2, TOP = 0, BOTTOM = 1;

$.ajaxSetup({cache: false});
var obsChannel = new BroadcastChannel("obs_openlp_channel");

var hideOnBlankScreen = false;
var lyricsHidden = false;
var emptyString = false;
var alwaysHide = false;
var crossfadeDuration = 500;
var lyricsContainerIndex = 0;
var fadeDuration = 900;

var autoResize = false;
var maxWidth = 600;
var textFormatting = {
    "all": false,
    "bold": true,
    "italics": true,
    "underline": true,
    "colors": false,
    "superscript": true,
    "subscript": false,
    "paragraph": false
};
var startingFont = 36;

obsChannel.postMessage(JSON.stringify({type: "init"}));

window.OpenLP = {
    updateTitle: function (event) {
        $.getJSON("/api/service/list",
                function (data, status) {
                    let found = false;
                    let titleDiv = $(".title");
                    for (idx in data.results.items) {
                        idx = parseInt(idx, 10);
                        if (data.results.items[idx]["selected"]) {
                            titleDiv.html(data.results.items[idx]["title"]);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        titleDiv.fadeOut(fadeDuration);
                    } else {
                        titleDiv.fadeIn(fadeDuration);
                    }
                }
        );
    },
    loadSlides: function (event) {
        $.getJSON(
                "/api/controller/live/text",
                function (data, status) {
                    OpenLP.currentSlides = data.results.slides;
                    OpenLP.currentSlide = 0;
                    let tag = "";
                    let lastChange = 0;
                    $.each(data.results.slides, function (idx, slide) {
                        let prevtag = tag;
                        tag = slide["tag"];
                        if (tag != prevtag) {
                            // If the tag has changed, add new one to the list
                            lastChange = idx;
                        } else {
                            if ((slide["text"] == data.results.slides[lastChange]["text"]) &&
                                    (data.results.slides.length >= idx + (idx - lastChange))) {
                                // If the tag hasn't changed, check to see if the same verse
                                // has been repeated consecutively. Note the verse may have been
                                // split over several slides, so search through. If so, repeat the tag.
                                let match = true;
                                for (let idx2 = 0; idx2 < idx - lastChange; idx2++) {
                                    if (data.results.slides[lastChange + idx2]["text"] != data.results.slides[idx + idx2]["text"]) {
                                        match = false;
                                        break;
                                    }
                                }
                                if (match) {
                                    lastChange = idx;
                                }
                            }
                        }
                        if (slide["selected"])
                            OpenLP.currentSlide = idx;
                    })
                    OpenLP.updateTitle();
                    OpenLP.updateSlide();
                }
        );
    },
    updateSlide: function () {
        // Show the current slide on top. Any trailing slides for the same verse
        // are shown too underneath in grey.
        // Then leave a blank line between following verses
        if (OpenLP.currentSlides == undefined) {
            // Bail if we're not fully initialized yet
            return;
        }
        let slide = OpenLP.currentSlides[OpenLP.currentSlide];
        let text = "";
        let tags = new Array();
        // use title if available
        if (slide["title"]) {
            text = slide["title"];
        } else {
            if (textFormatting['all'] === true) {
                tags.push('all');
            } else {
                $.each(textFormatting, function (key, val) {
                    if (val === true) {
                        switch (key) {
                            case 'bold':
                                tags.push('strong');
                                break;
                            case 'italics':
                                tags.push('em');
                                break;
                            case 'underline':
                                tags.push('span style="text-decoration: underline');
                                break;
                            case 'colors':
                                tags.push('span style="-webkit-text-fill-color');
                                break;
                            case 'superscript':
                                tags.push('sup');
                                break;
                            case 'subscript':
                                tags.push('sub');
                                break;
                            case 'paragraph':
                                tags.push('p');
                                break;
                        }
                    }
                });
            }

            if (tags.length > 0) {
                text = OpenLP.filterTags(slide["html"], tags);
            } else {
                text = slide["text"];
            }
        }

        obsChannel.postMessage(JSON.stringify({type: "lyrics", lines: text.split(/\n/g)}));
    },
    pollServer: function () {
        let lyricsContainer = $(".lyrics").eq(lyricsContainerIndex);
        let titleDiv = $(".title");
        $.getJSON(
                "/api/poll",
                function (data, status) {
                    if (OpenLP.currentItem != data.results.item ||
                            OpenLP.currentService != data.results.service) {
                        OpenLP.currentItem = data.results.item;
                        OpenLP.currentService = data.results.service;
                        OpenLP.loadSlides();
                    } else if (OpenLP.currentSlide != data.results.slide) {
                        OpenLP.currentSlide = parseInt(data.results.slide, 10);
                        OpenLP.updateSlide();
                    }
                    //if screen is blanked, hide on stream as well
                    let blankScreen = data.results.display === true
                            || data.results.theme === true
                            || data.results.blank === true;
                    if (blankScreen && hideOnBlankScreen || alwaysHide) {
                        if (!lyricsHidden) {
                            lyricsContainer.fadeOut(fadeDuration);
                            titleDiv.fadeOut(fadeDuration);
                            lyricsHidden = true;
                        }
                    } else {
                        if (lyricsHidden) {
                            if (!emptyString) {
                                lyricsContainer.fadeIn(fadeDuration);
                                titleDiv.fadeIn(fadeDuration);
                            }
                            lyricsHidden = false;
                        }
                    }
                }
        );
    },
    channelReceive: function (ev) {
        if (ev.data === null) {
            return;
        }
        let updateLayout = false;
        let lyricsContainer = $(".lyrics").eq(lyricsContainerIndex);
        let data = JSON.parse(ev.data);
        console.log(data.type);
        switch (data.type) {
            case "titleLayout":
                let mTitleContainer = $(".title-container");
                let mTitleDiv = $(".title");
                switch (data.hAnchor) {
                    case LEFT:
                        mTitleContainer.css("justify-content", "flex-start");
                        mTitleDiv.css({"margin-left": data.hOffset + "px", "margin-right": "0"});
                        break;
                    case RIGHT:
                        mTitleContainer.css("justify-content", "flex-end");
                        mTitleDiv.css({"margin-right": data.hOffset + "px", "margin-left": "0"});
                        break;
                    case CENTER:
                        mTitleContainer.css("justify-content", "center");
                        mTitleDiv.css({"margin-left": data.hOffset + "px", "margin-right": "0"});
                        break;
                }
                $(".title-container").eq(data.vAnchor).show();
                $(".title-container").eq(1 - data.vAnchor).hide();
                break;
            case "lyricsLayout":
                console.log(data);
                let mLyricsDiv = $(".lyrics");
                switch (data.hAnchor) {
                    case LEFT:
                        mLyricsDiv.css({left: data.hOffset + "px", right: ""});
                        break;
                    case RIGHT:
                        mLyricsDiv.css({left: "", right: data.hOffset + "px"});
                        break;
                    case CENTER:
                        mLyricsDiv.css({left: "", right: "", "margin-left": data.hOffset + "px" });
                        break;
                }
                switch (data.vAnchor) {
                    case TOP:
                        mLyricsDiv.css({top: data.vOffset + "px", bottom: ""});
                        break;
                    case BOTTOM:
                        mLyricsDiv.css({top: "", bottom: data.vOffset + "px"});
                        break;
                    case CENTER:
                        mLyricsDiv.css({top: "", bottom: "", "margin-top": data.vOffset + "px"});
                        break;
                }
                break;
            case "maxWidth":
                maxWidth = data.value;
                $(".lyrics").css("max-width", maxWidth + "px");
                break;
            case "lyricsHeight":
                $("#lyrics-container").css("height", data.value + "px");
                break;
            case "hide":
                alwaysHide = data.value;
                break;
            case "hideOnBlank":
                hideOnBlankScreen = data.value;
                break;
            case "fadeDuration":
                fadeDuration = Number(data.value);
                break;
            case "crossfadeDuration":
                crossfadeDuration = Number(data.value);
                break;
            case "resize":
                autoResize = data.value;
                updateLayout = true;
                break;
            case "lyricsFont":
                startingFont = data.value;
                updateLayout = true;
                break;
            case "titleFont":
                $(".title").css("font-size", data.value + "pt");
                break;
            case "textFormatting":
                textFormatting = data.value;
                break;
            case "nextSlide":
                $.get("/api/controller/live/next");
                break;
            case "previousSlide":
                $.get("/api/controller/live/previous");
                break;
            case "lyrics":
                if (data.value.length <= 4) { //empty str
                    lyricsContainer.fadeOut(fadeDuration);
                    emptyString = true;
                } else {
                    if (crossfadeDuration == 0 || emptyString || alwaysHide) {
                        lyricsContainer.html(data.value);
                        if (emptyString) {
                            emptyString = false;
                            if (!lyricsHidden && !alwaysHide) {
                                lyricsContainer.fadeIn(fadeDuration);
                            }
                        }
                    } else {
                        let nextLyricsContainer = $(".lyrics").eq((lyricsContainerIndex + 1) % 2);
                        nextLyricsContainer.html(data.value);
                        lyricsContainer.fadeTo(Number(crossfadeDuration), 0);
                        nextLyricsContainer.fadeTo(Number(crossfadeDuration), 1);

                        lyricsContainerIndex = (lyricsContainerIndex + 1) % 2;
                        lyricsContainer = nextLyricsContainer;
                    }
                }
                updateLayout = true;
                break;
            default:
                console.log("Unsupported message: " + data.type + ":");
                console.log(data);
                break;
        }

        if (updateLayout) {
            // Reset font size back to our "baseline"
            lyricsContainer.css('font-size', startingFont + "pt");

            if (autoResize) {
                // Loop while our lyrics box is taller than our window
                let lyricsParent = $("#lyrics-container");
                console.log("parent height: " + lyricsParent.innerHeight() + "px");
                console.log("lyrics height: " + lyricsContainer.outerHeight() + "px");
                while (lyricsContainer.outerHeight() > lyricsParent.innerHeight() && lyricsParent.innerHeight() > 0) {
                    console.log("lyrics height: " + lyricsContainer.outerHeight() + "px");
                    // Get the current font size (in px) and shrink it by 1 px
                    let currentSize = lyricsContainer.css('font-size');
                    let nextSize = (parseInt(currentSize) - 1) + 'px';
                    // Apply the new (smaller) font size
                    lyricsContainer.css('font-size', nextSize);
                }
            }
        }
    },
    filterTags: function (string, allowedTags) {
        string = string
                // <br> comes through. Change to \n to preserve them and make line-counting accurate
                .replace(/<br>/gi, "\n")
                // If we find square brackets in the text, assume the user intends them to be
                // those literal characters and replace with their respective HTML entities
                .replace(/\[/g, "&#91;")
                .replace(/\]/g, "&#93;");

        if (allowedTags[0] === 'all') {
            return string;
        }

        $.each(allowedTags, function (idx, longTag) {
            // the longTag may include attributes as well the tag name
            onlyTag = longTag.replace(/^([^ ]+) .+$/, '$1');
            string = string.replace(new RegExp('<' + longTag + '([^>]*)>', 'gi'), '[' + longTag + '$1]');
            string = string.replace(new RegExp('</' + onlyTag + '>', 'gi'), '[/' + onlyTag + ']');
        });

        string = string
                // remove remaining HTML tags
                .replace(/<[^>]+>/g, '')
                // restore the tags we preserved
                .replace(/\[(\/?)([^\]]+)\]/gi, '<$1$2>');

        return string;
    }
};

setInterval(OpenLP.pollServer, 250);
OpenLP.pollServer();
obsChannel.onmessage = OpenLP.channelReceive;