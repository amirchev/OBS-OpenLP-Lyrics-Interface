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
            return
        }
        var slide = OpenLP.currentSlides[OpenLP.currentSlide];
        var text = "";
        // use title if available
        if (slide["title"]) {
            text = slide["title"];
        } else {
            text = slide["text"];
        }
        //text = text.replace(/\n/g, "<br />");
        obsChannel.postMessage(JSON.stringify({lines: text.split(/\n/g)}));
    },
    pollServer: function () {
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
                }
        );
    },
    channelReceive: function (ev) {
        var lyricsContainer = $("#lyrics")
        // Reset font size back to our "baseline"
        lyricsContainer.css('font-size', '36pt')
        // Populate with our newest lyrics
        lyricsContainer.html(ev.data);

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
$.ajaxSetup({cache: false});
setInterval(OpenLP.pollServer, 250);
OpenLP.pollServer();
var obsChannel = new BroadcastChannel("obs_openlp_channel");
obsChannel.onmessage = OpenLP.channelReceive;