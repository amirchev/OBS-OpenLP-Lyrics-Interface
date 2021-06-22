window.OpenLP = {
    loadService: function (event) {
        $.getJSON(
                "/api/service/list",
                function (data, status) {
                    OpenLP.nextSong = "";
                    //$("#notes").html("");
                    for (idx in data.results.items) {
                        idx = parseInt(idx, 10);
                        if (data.results.items[idx]["selected"]) {
                            //$("#notes").html(data.results.items[idx]["notes"].replace(/\n/g, "<br />"));
                            if (data.results.items.length > idx + 1) {
                                OpenLP.nextSong = data.results.items[idx + 1]["title"];
                            }
                            break;
                        }
                    }
                    OpenLP.updateSlide();
                }
        );
    },
    loadSlides: function (event) {
        $.getJSON(
                "/api/controller/live/text",
                function (data, status) {
                    OpenLP.currentSlides = data.results.slides;
                    OpenLP.currentSlide = 0;
                    var tag = "";
                    var lastChange = 0;
                    $.each(data.results.slides, function (idx, slide) {
                        var prevtag = tag;
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
                                var match = true;
                                for (var idx2 = 0; idx2 < idx - lastChange; idx2++) {
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
                    OpenLP.loadService();
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
        var slide = OpenLP.currentSlides[OpenLP.currentSlide];
        var text = "";
        // use title if available
        if (slide["title"]) {
            text = slide["title"];
        } else {
            if (superscriptedVerseNumbers) {
                text = OpenLP.filterTags(slide["html"], new Array('sup'));
            } else {
                text = slide["text"];
            }
        }
        //text = text.replace(/\n/g, "<br />");
        obsChannel.postMessage(JSON.stringify({type: "lyrics", lines: text.split(/\n/g)}));
    },
    pollServer: function () {
        var lyricsContainer = $(".lyrics").eq(lyricsContainerIndex);
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
                    var blankScreen = data.results.display === true
                            || data.results.theme === true
                            || data.results.blank === true;
                    if (blankScreen && hideOnBlankScreen || alwaysHide) {
                        if (!lyricsHidden) {
                            lyricsContainer.fadeOut(fadeDuration);
                            lyricsHidden = true;
                        }
                    } else {
                        if (lyricsHidden) {
                            if (!emptyString) {
                                lyricsContainer.fadeIn(fadeDuration);
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
        var updateLayout = false;
        var lyricsContainer = $(".lyrics").eq(lyricsContainerIndex);
        var data = JSON.parse(ev.data);
        if (data.type === "hide") {
            alwaysHide = data.value;
        } else if (data.type === "hideOnBlank") {
            hideOnBlankScreen = data.value;
        } else if (data.type === "fadeDuration") {
            fadeDuration = Number(data.value);
        } else if (data.type === "crossfadeDuration") {
            crossfadeDuration = Number(data.value);
        } else if (data.type === "resize") {
            autoResize = data.value;
            updateLayout = true;
        } else if (data.type === "font") {
            defaultFont = data.value;
            updateLayout = true;
        } else if (data.type === "superscriptedVerseNumbers") {
            superscriptedVerseNumbers = data.value;
        } else if (data.type === "nextSlide") {
            $.get("/api/controller/live/next");
        } else if (data.type === "previousSlide") {
            $.get("/api/controller/live/previous");
        } else if (data.type === "lyrics") {

            if (data.value.length <= 4) { //empty str
                lyricsContainer.fadeOut(fadeDuration);
                emptyString = true;
            } else {
                if (crossfadeDuration == 0 || emptyString) {
                    lyricsContainer.html(data.value);
                    if (emptyString) {
                        emptyString = false;
                        if (!lyricsHidden) {
                            lyricsContainer.fadeIn(fadeDuration);
                        }
                    }
                } else {
                    var nextLyricsContainer = $(".lyrics").eq((lyricsContainerIndex + 1) % 2);
                    nextLyricsContainer.html(data.value);
                    lyricsContainer.fadeTo(Number(crossfadeDuration), 0);
                    nextLyricsContainer.fadeTo(Number(crossfadeDuration), 1);

                    lyricsContainerIndex = (lyricsContainerIndex + 1) % 2;
                    lyricsContainer = nextLyricsContainer;
                }
            }
            updateLayout = true;
        }

        if (updateLayout) {
            // Reset font size back to our "baseline"
            lyricsContainer.css('font-size', defaultFont + "pt");

            if (autoResize) {
                // Loop while our lyrics box is taller than our window
                while (lyricsContainer.outerHeight() > window.innerHeight) {
                    // Get the current font size (in px) and shrink it by 1 px
                    var currentSize = lyricsContainer.css('font-size')
                    var nextSize = (parseInt(currentSize) - 1) + 'px'
                    // Apply the new (smaller) font size
                    lyricsContainer.css('font-size', nextSize)
                }
            }
        }
    },
    filterTags: function (string, tags) {
        string = string
            // <br> comes through. Change to \n to preserve them and make line-counting accurate
            .replace(/<br>/gi, "\n")
            // If we find square brackets in the text, assume the user intends them to be
            // those literal characters and replace with their respective HTML entities
            .replace(/\[/g, "&#91;")
            .replace(/\]/g, "&#93;");

        $.each(tags, function(idx, tag) {
            string = string.replace(new RegExp('<(\/?)'+tag+'([^>]*)>', 'gi'), '[$1'+tag+'$2]');
        });

        string = string
            // remove remaining HTML tags
            .replace(/<[^>]+>/g, '')
            // restore the tags we preserved
            .replace(/\[(\/?)([^\]]+)\]/gi, '<$1$2>');

        return string;
    }
}
$.ajaxSetup({cache: false});
setInterval(OpenLP.pollServer, 250);
OpenLP.pollServer();
var obsChannel = new BroadcastChannel("obs_openlp_channel");

var hideOnBlankScreen = false;
var lyricsHidden = false;
var emptyString = false;
var alwaysHide = false;
var crossfadeDuration = 500;
var lyricsContainerIndex = 0;
var fadeDuration = 900;

var autoResize = false;
var superscriptedVerseNumbers = true;
var defaultFont = 36;

obsChannel.onmessage = OpenLP.channelReceive;

obsChannel.postMessage(JSON.stringify({type: "init"}));