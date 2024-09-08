"use strict";
//var socket = io();
var socket = io(undefined, {
    reconnection: true,            // 启用自动重连
    reconnectionAttempts: Infinity, // 无限次重连尝试
    reconnectionDelay: 1000,       // 每次重连之间的延迟时间（毫秒）
    reconnectionDelayMax: 1000,    // 最大延迟时间，保持和 reconnectionDelay 一致
    timeout: 10000,                // 连接超时时间（毫秒）
    query: {
        subscribes: "roon",
    },
});

socket.on('connect', () => {
    console.log('[NowPlaying] Socket.io Connected to server.');
    // socket.emit("subscribe", {
    //     type: "roon",
    // });
});

socket.on('disconnect', (reason) => {
    console.log(`[NowPlaying] Socket.io Disconnected from server. Reason: ${reason}`);
    // 在这里可以提示用户连接断开
});

socket.on('reconnect_attempt', (attempt) => {
    console.log(`[NowPlaying] Socket.io Reconnection attempt ${attempt}`);
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`[NowPlaying] Socket.io Reconnected to server on attempt ${attemptNumber}`);
});

socket.on('reconnect_failed', () => {
    console.log('[NowPlaying] Socket.io Failed to reconnect to the server.');
});

var noSleep = new NoSleep();
var curZone;
var css = [];
var settings = [];
var state = [];
var inVolumeSlider = false;

$(document).ready(function () {
    showPage();
    fixFontSize();
});

function toggleCircleIcon() {
    if ($("#circleIconsSwitch").is(":checked", false)) {
        // Triggered when the unchecked toggle has been checked
        $("#circleIconsSwitch").prop("checked", true);
        settings.useCircleIcons = true;
        state = [];
    } else {
        // Triggered when the checked toggle has been unchecked
        $("#circleIconsSwitch").prop("checked", false);
        settings.useCircleIcons = false;
        state = [];
    }
    setCookie("settings['useCircleIcons']", settings.useCircleIcons);
}

function toggle4kImages() {
    if ($("#4kImagesSwitch").is(":checked", false)) {
        // Triggered when the unchecked toggle has been checked
        $("#4kImagesSwitch").prop("checked", true);
        settings.use4kImages = true;
        state = [];
    } else {
        // Triggered when the checked toggle has been unchecked
        $("#4kImagesSwitch").prop("checked", false);
        settings.use4kImages = false;
        state = [];
    }
    setCookie("settings['use4kImages']", settings.use4kImages);
}

function toggleScreensaver() {
    if ($("#screensaverSwitch").is(":checked", false)) {
        // Triggered when the unchecked toggle has been checked
        $("#screensaverSwitch").prop("checked", true);
        settings.screensaverDisable = true;
        state = [];
    } else {
        // Triggered when the checked toggle has been unchecked
        $("#screensaverSwitch").prop("checked", false);
        settings.screensaverDisable = false;
        state = [];
    }
    setCookie("settings['screensaverDisable']", settings.screensaverDisable);
}

function toggleNotifications() {
    if ($("#notificationsSwitch").is(":checked", false)) {
        // Triggered when the unchecked toggle has been checked
        $("#notificationsSwitch").prop("checked", true);
        settings.showNotifications = true;
        settings.showNotificationsChanged = true;
    } else {
        // Triggered when the checked toggle has been unchecked
        $("#notificationsSwitch").prop("checked", false);
        settings.showNotifications = false;
        settings.showNotificationsChanged = true;
    }
    setCookie("settings['showNotifications']", settings.showNotifications);
}

function notifyMe(three_line) {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var options = {
            body: three_line.line2 + " - " + three_line.line3,
            icon: "/roonapi/image/" + curZone.now_playing.image_key + ".jpg"
        };
        var notification = new Notification(three_line.line1, options);
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                var options = {
                    body: three_line.line2 + " - " + three_line.line3,
                    icon: "/roonapi/image/" + curZone.now_playing.image_key + ".jpg"
                };
                var notification = new Notification(three_line.line1, options);
            }
        });
    }

    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them any more.
    // console.log(notification);
}

function fixFontSize() {
    // $(".lineMusicInfo").css(
    //   "font-size",
    //   Math.round(parseInt($("#line1").height() * 0.75))
    // );
    $("#line1").css(
        "font-size",
        Math.round(parseInt($("#line1").height() * 0.8))
    );

    $("#line2").css(
        "font-size",
        Math.round(parseInt($("#line1").height() * 0.5))
    );

    $("#line3").css(
        "font-size",
        Math.round(parseInt($("#line1").height() * 0.5))
    );

    var zoneFontSize = Math.round(parseInt($("#containerZoneList").height() / 3));
    if (zoneFontSize <= 20) {
        $("#nowplayingZoneList").css("font-size", 20);
    } else {
        $("#nowplayingZoneList").css("font-size", zoneFontSize);
    }
}

function showPage() {
    // Read settings from cookie
    settings.zoneID = readCookie("settings['zoneID']");
    settings.displayName = readCookie("settings['displayName']");
    settings.theme = readCookie("settings['theme']");

    var showNotifications = readCookie("settings['showNotifications']");
    if (showNotifications === "true") {
        settings.showNotifications = true;
        $("#notificationsSwitch").prop("checked", true);
    } else {
        settings.showNotifications = false;
        $("#notificationsSwitch").prop("checked", false);
    }

    var useCircleIcons = readCookie("settings['useCircleIcons']");
    if (useCircleIcons === "true") {
        settings.useCircleIcons = true;
        $("#circleIconsSwitch").prop("checked", true);
    } else {
        settings.useCircleIcons = false;
        $("#circleIconsSwitch").prop("checked", false);
    }

    var use4kImages = readCookie("settings['use4kImages']");
    if (use4kImages === "true") {
        settings.use4kImages = true;
        $("#4kImagesSwitch").prop("checked", true);
    } else {
        settings.use4kImages = false;
        $("#4kImagesSwitch").prop("checked", false);
    }

    var screensaverDisable = readCookie("settings['screensaverDisable']");
    if (screensaverDisable === "true") {
        settings.screensaverDisable = true;
        $("#screensaverSwitch").prop("checked", true);
    } else {
        settings.screensaverDisable = false;
        $("#screensaverSwitch").prop("checked", false);
    }

    // Set page fields to settings
    if (settings.zoneID === undefined) {
        $("#overlayZoneList").show();
    }

    if (settings.displayName !== undefined) {
        $(".buttonZoneName").html(settings.displayName);
    }

    if (settings.theme === undefined) {
        settings.theme = "dark";
        setCookie("settings['theme']", settings.theme);
        setTheme(settings.theme);
    } else {
        setTheme(settings.theme);
    }

    // Get Buttons
    $("#buttonVolume").html(getSVG("volume"));
    $("#buttonSettings").html(getSVG("settings"));

    // Hide pages until player state is determined
    $("#notPlaying").hide();
    $("#isPlaying").hide();

    enableSockets();
}

function enableSockets() {
    socket.on("zoneList", function (payload) {
        $(".zoneList").html("");
        console.log("240 zoneList payload: " + JSON.stringify(payload));
        if (payload !== undefined && payload.length > 0) {
            var payloadids = [];
            for (var x in payload) {
                $(".zoneList").append(
                    '<button type="button" class="buttonOverlay buttonZoneId" id="button-' +
                    payload[x].zone_id +
                    '" onclick="selectZone(\'' +
                    payload[x].zone_id +
                    "', '" +
                    payload[x].display_name +
                    "')\">" +
                    payload[x].display_name +
                    "</button>"
                );
                payloadids.push(payload[x].zone_id);
            }
            if (payload.length == 1) {
                selectZone(payload[0].zone_id, payload[0].display_name);
            } else {
                if (payloadids.includes(settings.zoneID) === false) {
                    $("#overlayZoneList").show();
                }
            }
        } else {
            console.log('Zone Not Found.');
            $(".zoneList").html('<div class="messages"><p>Zone Not Found.</p></div>');
            $("#overlayZoneList").show();
            $('#overlayZoneList .overlayBackground').removeAttr('onclick');
        }
    });

    socket.on("zoneStatus", function (payload) {
        // console.log('269 zoneStatus: ' + JSON.stringify(payload));
        if (settings.zoneID !== undefined) {
            for (var x in payload) {
                if (payload[x].zone_id == settings.zoneID) {
                    curZone = payload[x];
                    // console.log(curZone);
                    // Set zone button to active
                    $(".buttonZoneId").removeClass("buttonSettingActive");
                    $("#button-" + settings.zoneID).addClass("buttonSettingActive");

                    updateZone(curZone);
                } else {
                    curZone = undefined;
                }
            }
        }
    });
}

function selectZone(zone_id, display_name) {
    settings.zoneID = zone_id;
    setCookie("settings['zoneID']", settings.zoneID);

    settings.displayName = display_name;
    setCookie("settings['displayName']", settings.displayName);
    $(".buttonZoneName").html(settings.displayName);

    // Set zone button to active
    $(".buttonZoneId").removeClass("buttonSettingActive");
    $("#button-" + settings.zoneID).addClass("buttonSettingActive");

    // Reset state on zone switch
    state = [];
    socket.emit("getZone", zone_id);

    $("#overlayZoneList").hide();
}

function updateZone(curZone) {
    if (curZone.now_playing) {
        showIsPlaying(curZone);
    } else {
        showNotPlaying();
    }
}

function showNotPlaying() {
    $("#notPlaying").show();
    $("#isPlaying").hide();

    // Reset icons
    $("#controlPrev")
        .html(getSVG("prev"))
        .removeClass("buttonAvailable")
        .addClass("buttonInactive");
    $("#controlPlayPauseStop")
        .html(getSVG("play"))
        .removeClass("buttonAvailable")
        .addClass("buttonInactive");
    $("#controlNext")
        .html(getSVG("next"))
        .removeClass("buttonAvailable")
        .addClass("buttonInactive");
    $("#buttonMute")
        .html(getSVG("mute"))
        .removeClass("buttonAvailable buttonActive")
        .addClass("buttonInactive");
    $("#buttonLoop")
        .html(getSVG("loop"))
        .removeClass("buttonAvailable buttonActive")
        .addClass("buttonInactive");
    $("#buttonShuffle")
        .html(getSVG("shuffle"))
        .removeClass("buttonAvailable buttonActive")
        .addClass("buttonInactive");
    $("#buttonRadio")
        .html(getSVG("radio"))
        .removeClass("buttonAvailable buttonActive")
        .addClass("buttonInactive");
    $("#buttonDevice")
        .html(getSVG("device"))
        .removeClass("buttonAvailable buttonActive")
        .addClass("buttonInactive");

    // Blank text fields
    $("#line1, #line2, #line3, #seekPosition, #seekLength").html("&nbsp;");
    $("#trackSeekValue").css("width", "0%");

    // Reset pictures
    $("#containerCoverImage").html(
        '<img src="/img/transparent.png" class="itemImage">'
    );
    $("#coverBackground").css("background-image", "url('/img/transparent.png')");

    // Turn off screensaverDisable
    noSleep.disable();

    // Reset state and browser title
    state = [];
    $(document).prop("title", "Roon Web Controller");
}

function showIsPlaying(curZone) {
    $("#notPlaying").hide();
    $("#isPlaying").show();

    if(!curZone.now_playing.three_line.line1 || curZone.now_playing.three_line.line1.length < 1) {
        console.log('380, curZone line1 is null, curZone: ' + JSON.stringify(curZone, null, 2));
    }
    if (state.line1 != curZone.now_playing.three_line.line1) {
        state.line1 = curZone.now_playing.three_line.line1;
        fixFontSize();
        $("#line1")
            .html(state.line1)
            .simplemarquee({
                cycles: Infinity,
                delayBetweenCycles: 5000,
                handleHover: false
            });
    }

    if (state.line2 != curZone.now_playing.three_line.line2) {
        state.line2 = curZone.now_playing.three_line.line2;
        $("#line2")
            .html(curZone.now_playing.three_line.line2)
            .simplemarquee({
                cycles: Infinity,
                delayBetweenCycles: 5000,
                handleHover: false
            });
    }

    if (state.line3 != curZone.now_playing.three_line.line3) {
        state.line3 = curZone.now_playing.three_line.line3;
        $("#line3")
            .html(curZone.now_playing.three_line.line3)
            .simplemarquee({
                cycles: Infinity,
                delayBetweenCycles: 5000,
                handleHover: false
            });
    }

    if (state.title != curZone.now_playing.one_line.line1) {
        state.title = curZone.now_playing.one_line.line1;
        $(document).prop("title", curZone.now_playing.one_line.line1);
        if (settings.showNotifications === true) {
            notifyMe(curZone.now_playing.three_line);
        }
    }

    if (settings.showNotificationsChanged === true) {
        if (settings.showNotifications === true) {
            notifyMe(curZone.now_playing.three_line);
        }
        settings.showNotificationsChanged = false;
    }

    if (curZone.is_seek_allowed === true) {
        $("#seekPosition").html(secondsConvert(curZone.now_playing.seek_position));
        $("#seekLength").html(secondsConvert(curZone.now_playing.length));
        $("#trackSeekValue").css(
            "width",
            Math.round(
                (curZone.now_playing.seek_position / curZone.now_playing.length) * 100
            ) + "%"
        );
    } else {
        $("#seekPosition, #seekLength").html("&nbsp;");
        $("#trackSeekValue").css("width", "0%");
    }

    if (
        state.image_key != curZone.now_playing.image_key ||
        state.image_key === undefined
    ) {
        state.image_key = curZone.now_playing.image_key;

        if (curZone.now_playing.image_key === undefined) {
            state.imgUrl = "/img/transparent.png";
        } else {
            if (settings.use4kImages === true) {
                state.imgUrl =
                    "/roonapi/image4k/" + curZone.now_playing.image_key + ".jpg";
                state.CTimgUrl =
                    "/roonapi/image/" + curZone.now_playing.image_key + ".jpg";
            } else {
                state.imgUrl =
                    "/roonapi/image/" + curZone.now_playing.image_key + ".jpg";
                state.CTimgUrl =
                    "/roonapi/image/" + curZone.now_playing.image_key + ".jpg";
            }
        }
        $("#containerCoverImage").html(
            '<img src="' +
            state.imgUrl +
            '" class="itemImage" alt="Cover art for ' +
            state.title +
            '">'
        );
        $("#coverBackground").css("background-image", "url(" + state.imgUrl + ")");

        if (settings.theme == "color") {
            var colorThief = new ColorThief();

            colorThief.getColorAsync(state.CTimgUrl, function (color) {
                var r = color[0];
                var g = color[1];
                var b = color[2];
                css.colorBackground = "rgb(" + color + ")";

                var yiq = (r * 299 + g * 587 + b * 114) / 1000;
                if (yiq >= 128) {
                    css.backgroundColor = "#eff0f1";
                    css.foregroundColor = "#232629";
                    css.trackSeek = "rgba(35, 38, 41, 0.33)";
                } else {
                    css.backgroundColor = "#232629";
                    css.foregroundColor = "#eff0f1";
                    css.trackSeek = "rgba(239, 240, 241, 0.33)";
                }
                $("#colorBackground").show();
                showTheme("color");
            });
        }
    }

    if (state.Prev != curZone.is_previous_allowed || state.Prev === undefined) {
        state.Prev = curZone.is_previous_allowed;
        if (curZone.is_previous_allowed === true) {
            $("#controlPrev")
                .attr("onclick", "goCmd('prev', '" + curZone.zone_id + "')")
                .attr("aria-disabled", false)
                .html(getSVG("prev"))
                .addClass("buttonAvailable")
                .removeClass("buttonInactive");
        } else {
            $("#controlPrev")
                .attr("onclick", "")
                .attr("aria-disabled", true)
                .html(getSVG("prev"))
                .addClass("buttonInactive")
                .removeClass("buttonAvailable");
        }
    }

    if (state.Next != curZone.is_next_allowed || state.Next === undefined) {
        state.Next = curZone.is_next_allowed;
        if (curZone.is_next_allowed === true) {
            $("#controlNext")
                .attr("onclick", "goCmd('next', '" + curZone.zone_id + "')")
                .attr("aria-disabled", false)
                .html(getSVG("next"))
                .addClass("buttonAvailable")
                .removeClass("buttonInactive");
        } else {
            $("#controlNext")
                .attr("onclick", "")
                .attr("aria-disabled", true)
                .html(getSVG("next"))
                .addClass("buttonInactive")
                .removeClass("buttonAvailable");
        }
    }

    if (curZone.is_play_allowed === true) {
        state.PlayPauseStop = "showPlay";
        noSleep.disable();
    } else if (curZone.state == "playing" && curZone.is_play_allowed === false) {
        if (curZone.is_pause_allowed === true) {
            state.PlayPauseStop = "showPause";
            if (settings.screensaverDisable === true) {
                noSleep.enable();
            } else {
                noSleep.disable();
            }
        } else {
            state.PlayPauseStop = "showStop";
            if (settings.screensaverDisable === true) {
                noSleep.enable();
            } else {
                noSleep.disable();
            }
        }
    } else {
        state.PlayPauseStop = "showPlayDisabled";
        noSleep.disable();
    }

    if (
        state.PlayPauseStopLast != state.PlayPauseStop ||
        state.PlayPauseStop === undefined
    ) {
        state.PlayPauseStopLast = state.PlayPauseStop;
        if (state.PlayPauseStop == "showPlay") {
            $("#controlPlayPauseStop")
                .attr("onclick", "goCmd('play', '" + curZone.zone_id + "')")
                .attr("aria-disabled", false)
                .html(getSVG("play"))
                .addClass("buttonAvailable")
                .removeClass("buttonInactive");
        } else if (state.PlayPauseStop == "showPause") {
            $("#controlPlayPauseStop")
                .attr("onclick", "goCmd('pause', '" + curZone.zone_id + "')")
                .attr("aria-disabled", false)
                .html(getSVG("pause"))
                .addClass("buttonAvailable")
                .removeClass("buttonInactive");
        } else if (state.PlayPauseStop == "showStop") {
            $("#controlPlayPauseStop")
                .attr("onclick", "goCmd('stop', '" + curZone.zone_id + "')")
                .attr("aria-disabled", false)
                .html(getSVG("stop"))
                .addClass("buttonAvailable")
                .removeClass("buttonInactive");
        } else if (state.PlayPauseStop == "showPlayDisabled") {
            $("#controlPlayPauseStop")
                .html(getSVG("play"))
                .attr("onclick", "")
                .attr("aria-disabled", true)
                .addClass("buttonInactive")
                .removeClass("buttonAvailable");
        }
    }

    // console.log(curZone);
    let outputs0 = curZone.outputs[0];
    let output_id = outputs0.output_id;
    let is_muted = outputs0.volume.is_muted;
    $("#buttonMute")
        .html(getSVG("mute"))
        .attr(
            "onclick",
            "changeMute('" + curZone.zone_id + "', '" + output_id + "', '" + (is_muted ? "unmute" : "mute") + "')"
        )
        .attr("name", "Mute")
        .attr("aria-label", "Mute")
        .attr("aria-disabled", false)
        .removeClass("buttonAvailable buttonInactive");
    if (is_muted) {
        $("#buttonMute").css("color", "#ee0000");
    } else {
        $("#buttonMute").css("color", css.foregroundColor);
    }

    $("#buttonDevice")
        .html(getSVG("device"))
        .attr("onclick", "parent.showSection('deviceBrowser')")
        .attr("name", "Device Control")
        .attr("aria-label", "Device Control")
        .attr("aria-disabled", false)
        .removeClass("buttonAvailable buttonInactive")
        .css("color", css.foregroundColor);

    if (state.Loop != curZone.settings.loop || state.Loop === undefined) {
        state.Loop = curZone.settings.loop;
        if (state.Loop == "disabled") {
            $("#buttonLoop")
                .html(getSVG("loop"))
                .attr(
                    "onclick",
                    "changeZoneSetting('loop', 'loop', '" + curZone.zone_id + "')"
                )
                .attr("name", "Loop off")
                .attr("aria-label", "Loop off")
                .attr("aria-disabled", false)
                .removeClass("buttonActive buttonInactive")
                .addClass("buttonAvailable")
                .css("color", css.foregroundColor);
        } else if (state.Loop == "loop_one") {
            $("#buttonLoop")
                .html(getSVG("loopOne"))
                .attr(
                    "onclick",
                    "changeZoneSetting('loop', 'disabled', '" + curZone.zone_id + "')"
                )
                .attr("name", "Loop one")
                .attr("aria-label", "Loop one")
                .attr("aria-disabled", false)
                .removeClass("buttonAvailable buttonInactive")
                .addClass("buttonActive")
                .css("color", "#3daee9");
        } else if (state.Loop == "loop") {
            $("#buttonLoop")
                .html(getSVG("loop"))
                .attr(
                    "onclick",
                    "changeZoneSetting('loop', 'loop_one', '" + curZone.zone_id + "')"
                )
                .attr("name", "Loop all")
                .attr("aria-label", "Loop all")
                .attr("aria-disabled", false)
                .removeClass("buttonAvailable buttonInactive")
                .addClass("buttonActive")
                .css("color", "#3daee9");
        } else {
            $("#buttonLoop")
                .html(getSVG("loop"))
                .attr("onclick", "")
                .attr("name", "Loop disabled")
                .attr("aria-label", "Loop disabled")
                .attr("aria-disabled", true)
                .removeClass("buttonAvailable buttonActive")
                .addClass("buttonInactive")
                .css("color", css.foregroundColor);
        }
    }

    if (
        state.Shuffle != curZone.settings.shuffle ||
        state.Shuffle === undefined
    ) {
        state.Shuffle = curZone.settings.shuffle;
        if (state.Shuffle === false) {
            $("#buttonShuffle")
                .html(getSVG("shuffle"))
                .attr(
                    "onclick",
                    "changeZoneSetting('shuffle', 'true', '" + curZone.zone_id + "')"
                )
                .attr("name", "Shuffle off")
                .attr("aria-label", "Shuffle off")
                .attr("aria-disabled", false)
                .removeClass("buttonActive buttonInactive")
                .addClass("buttonAvailable")
                .css("color", css.foregroundColor);
        } else if (state.Shuffle === true) {
            $("#buttonShuffle")
                .html(getSVG("shuffle"))
                .attr(
                    "onclick",
                    "changeZoneSetting('shuffle', 'false', '" + curZone.zone_id + "')"
                )
                .attr("name", "Shuffle on")
                .attr("aria-label", "Shuffle on")
                .attr("aria-disabled", false)
                .removeClass("buttonAvailable buttonInactive")
                .addClass("buttonActive")
                .css("color", "#3daee9");
        } else {
            $("#buttonShuffle")
                .html(getSVG("shuffle"))
                .attr("onclick", "")
                .attr("name", "Shuffle disabled")
                .attr("aria-label", "Shuffle disabled")
                .attr("aria-disabled", true)
                .removeClass("buttonAvailable buttonActive")
                .addClass("buttonInactive")
                .css("color", css.foregroundColor);
        }
    }

    if (state.Radio != curZone.settings.auto_radio || state.Radio === undefined) {
        state.Radio = curZone.settings.auto_radio;
        if (state.Radio === false) {
            $("#buttonRadio")
                .html(getSVG("radio"))
                .attr(
                    "onclick",
                    "changeZoneSetting('auto_radio', 'true', '" + curZone.zone_id + "')"
                )
                .attr("name", "Roon Radio off")
                .attr("aria-label", "Roon Radio off")
                .attr("aria-disabled", false)
                .removeClass("buttonActive buttonInactive")
                .addClass("buttonAvailable")
                .css("color", css.foregroundColor);
        } else if (state.Radio === true) {
            $("#buttonRadio")
                .html(getSVG("radio"))
                .attr(
                    "onclick",
                    "changeZoneSetting('auto_radio', 'false', '" + curZone.zone_id + "')"
                )
                .attr("name", "Roon Radio on")
                .attr("aria-label", "Roon Radio on")
                .attr("aria-disabled", false)
                .removeClass("buttonAvailable buttonInactive")
                .addClass("buttonActive")
                .css("color", "#3daee9");
        } else {
            $("#buttonRadio")
                .html(getSVG("radio"))
                .attr("onclick", "")
                .attr("name", "Roon Radio disabled")
                .attr("aria-label", "Roon Radio disabled")
                .attr("aria-disabled", true)
                .removeClass("buttonAvailable buttonActive")
                .addClass("buttonInactive")
                .css("color", css.foregroundColor);
        }
    }

    if (inVolumeSlider === false) {
        $("#volumeList").html("");
        for (var x in curZone.outputs) {
            if (x >= 1) {
                $("#volumeList").append("<hr>");
            }
            if (curZone.outputs[x].volume) {
                var html =
                    '<div class="textBold">' + curZone.outputs[x].display_name + "</div>";
                html += "<div>" + curZone.outputs[x].volume.value + "</div>";

                html += '<div class="volumeGroup">';
                html += '<button type="button" class="buttonFillHeight volumeButton"';
                html +=
                    "onclick=\"volumeButton('volumeValue" +
                    x +
                    "', " +
                    (curZone.outputs[x].volume.value - curZone.outputs[x].volume.step) +
                    ", '" +
                    curZone.outputs[x].output_id +
                    "')\"";
                html += 'name="Volume down"';
                html += 'aria-label="Volume down"';
                html += ">" + getSVG("volume-minus") + "</button>";
                html += '<div class="volumeSlider">';
                html +=
                    '<input type="range" min="' +
                    curZone.outputs[x].volume.min +
                    '"  max="' +
                    curZone.outputs[x].volume.max +
                    '" step="' +
                    curZone.outputs[x].volume.step +
                    '" value="' +
                    curZone.outputs[x].volume.value +
                    '" oninput="volumeInput(\'volumeValue' +
                    x +
                    "', this.value, '" +
                    curZone.outputs[x].output_id +
                    "')\" onchange=\"volumeChange('volumeValue" +
                    x +
                    "', this.value, '" +
                    curZone.outputs[x].output_id +
                    "')\">";
                html += "</div>";
                html += '<button type="button" class="buttonFillHeight volumeButton"';
                html +=
                    "onclick=\"volumeButton('volumeValue" +
                    x +
                    "', " +
                    (curZone.outputs[x].volume.value + curZone.outputs[x].volume.step) +
                    ", '" +
                    curZone.outputs[x].output_id +
                    "')\"";
                html += 'name="Volume up"';
                html += 'aria-label="Volume up"';
                html += ">" + getSVG("volume-plus") + "</button>";
                html += "</div>";

                $("#volumeList").append(html);
            } else {
                $("#volumeList")
                    .append(
                        '<div class="textBold">' +
                        curZone.outputs[x].display_name +
                        "</div>"
                    )
                    .append("<div>Fixed Volume</div>");
            }
        }
    }

    if (state.themeShowing === undefined) {
        state.themeShowing = true;
        showTheme(settings.theme);
    }
}

function goCmd(cmd, zone_id) {
    if (cmd == "prev") {
        socket.emit("goPrev", zone_id);
    } else if (cmd == "next") {
        socket.emit("goNext", zone_id);
    } else if (cmd == "play") {
        socket.emit("goPlay", zone_id);
    } else if (cmd == "pause") {
        socket.emit("goPause", zone_id);
    } else if (cmd == "stop") {
        socket.emit("goStop", zone_id);
    }
}

function changeZoneSetting(zoneSetting, zoneSettingValue, zone_id) {
    //		 for (x in curZone.outputs){
    var msg = JSON.parse(
        '{"zone_id": "' +
        zone_id +
        '", "setting": "' +
        zoneSetting +
        '", "value": "' +
        zoneSettingValue +
        '" }'
    );
    socket.emit("changeSetting", msg);
    //		 }
}

function changeMute(zone_id, output_id, how) {
    var msg = JSON.parse(
        '{"zone_id": "' +
        zone_id +
        '", "output_id": "' +
        output_id +
        '", "how": "' +
        how +
        '" }'
    );
    socket.emit("changeMute", msg);
}

function volumeButton(spanId, value, output_id) {
    $("#" + spanId + "").html(value);

    var msg = JSON.parse(
        '{"output_id": "' + output_id + '", "volume": "' + value + '" }'
    );
    socket.emit("changeVolume", msg);
}

function volumeInput(spanId, value, output_id) {
    inVolumeSlider = true;
    $("#" + spanId + "").html(value);

    var msg = JSON.parse(
        '{"output_id": "' + output_id + '", "volume": "' + value + '" }'
    );
    socket.emit("changeVolume", msg);
}

function volumeChange(id, value, output_id) {
    inVolumeSlider = false;
}

function setTheme(theme) {
    settings.theme = theme;
    state.themeShowing = undefined;
    setCookie("settings['theme']", theme);

    if (theme == "dark" || theme === undefined) {
        css.backgroundColor = "#232629";
        css.foregroundColor = "#eff0f1";
        css.trackSeek = "rgba(239, 240, 241, 0.33)";

        $("#coverBackground").hide();
        $("#colorBackground").hide();
        $("#buttonThemeDark").addClass("buttonSettingActive");
        $("#buttonThemeColor, #buttonThemeCover").removeClass(
            "buttonSettingActive"
        );
    } else if (theme == "cover") {
        css.backgroundColor = "#232629";
        css.foregroundColor = "#eff0f1";
        css.trackSeek = "rgba(239, 240, 241, 0.33)";

        $("#coverBackground").show();
        $("#colorBackground").hide();
        $("#buttonThemeCover").addClass("buttonSettingActive");
        $("#buttonThemeColor, #buttonThemeDark").removeClass("buttonSettingActive");
    } else if (theme == "color") {
        state.image_key = undefined;
        $("#coverBackground").hide();
        $("#colorBackground").show();
        $("#buttonThemeColor").addClass("buttonSettingActive");
        $("#buttonThemeDark, #buttonThemeCover").removeClass("buttonSettingActive");
    } else {
        settings.theme = undefined;
        setTheme(settings.theme);
    }
    state = [];
    socket.emit("getZone", true);
}

function showTheme(theme) {
    $("body")
        .css("background-color", css.backgroundColor)
        .css("color", css.foregroundColor);
    $(".colorChange").css("color", css.foregroundColor);
    $("#colorBackground").css("background-color", css.colorBackground);
    $(".buttonAvailable").css("color", css.foregroundColor);
    $(".buttonInactive").css("color", css.foregroundColor);
    $("#trackSeek").css("background-color", css.trackSeek);
    socket.emit("getZone", true);
}

function readCookie(name) {
    return Cookies.get(name);
}

function setCookie(name, value) {
    Cookies.set(name, value, { expires: 365 });
}

function secondsConvert(seconds) {
    seconds = Number(seconds);
    var hour = Math.floor(seconds / 3600);
    var minute = Math.floor((seconds % 3600) / 60);
    var second = Math.floor((seconds % 3600) % 60);
    return (
        (hour > 0 ? hour + ":" + (minute < 10 ? "0" : "") : "") +
        minute +
        ":" +
        (second < 10 ? "0" : "") +
        second
    );
}

// svg editor
// https://mediamodifier.com/svg-editor#
function getSVG(cmd) {
    // console.log("getSVG: " + cmd);
    if (settings.useCircleIcons === true) {
        switch (cmd) {
            case "play":
                return '<svg viewBox="0 0 24 24"><path d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5L16,12L10,7.5V16.5Z" /></svg>';
            case "pause":
                return '<svg viewBox="0 0 24 24"><path d="M13,16V8H15V16H13M9,16V8H11V16H9M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" /></svg>';
            case "stop":
                return '<svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M9,9V15H15V9" /></svg>';
            default:
                break;
        }
    } else {
        switch (cmd) {
            case "play":
                return '<svg viewBox="0 0 24.00 24.00"><path d="M 7.99939,5.13684L 7.99939,19.1368L 18.9994,12.1368L 7.99939,5.13684 Z "/></svg>';
            case "pause":
                return '<svg viewBox="0 0 24.00 24.00"><path d="M 14,19L 18,19L 18,4.99999L 14,4.99999M 6,19L 10,19L 10,4.99999L 6,4.99999L 6,19 Z "/></svg>';
            case "stop":
                return '<svg viewBox="0 0 24.00 24.00"><path d="M 18,18L 6,18L 5.99988,6.00011L 18,5.99999L 18,18 Z "/></svg>';
            default:
                break;
        }
    }

    switch (cmd) {
        case "mute":
            return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 1080 1080" xml:space="preserve"><desc>Created with Fabric.js 5.2.4</desc><defs></defs><g transform="matrix(1 0 0 1 540 540)" id="38928377-10bc-4748-b08e-d70914723c4e"  ></g><g transform="matrix(1 0 0 1 540 540)" id="371429bd-dac8-46f4-abbe-e82fe0be2a84"  ><rect style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1; visibility: hidden;" vector-effect="non-scaling-stroke"  x="-540" y="-540" rx="0" ry="0" width="1080" height="1080" /></g><g transform="matrix(45 0 0 45 540 540)"  ><path style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;"  transform=" translate(-12, -12)" d="M 3 9.00002 L 6.99998 9.00004 L 12 4.00002 L 12 20 L 6.99998 15 L 2.99998 15 L 3 9.00002 Z M 20.9999 12.0001 C 20.9999 16.2832 18.008 19.8676 14 20.777 L 14 18.7102 C 16.8914 17.8496 18.9999 15.1711 18.9999 12.0001 C 18.9999 8.8291 16.8914 6.15058 14 5.29 L 14 3.22307 C 18.008 4.13255 20.9999 7.71688 20.9999 12.0001 Z M 17 12 C 17 14.0503 15.7659 15.8124 14 16.584 L 14 7.41605 C 15.7659 8.1876 17 9.94968 17 12 Z" stroke-linecap="round" /></g><g transform="matrix(45 0 0 45 540 540)"  ><path style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; "  transform=" translate(-12, -12)" d="M 3 9.00002 L 6.99998 9.00004 L 12 4.00002 L 12 20 L 6.99998 15 L 2.99998 15 L 3 9.00002 Z M 20.9999 12.0001 C 20.9999 16.2832 18.008 19.8676 14 20.777 L 14 18.7102 C 16.8914 17.8496 18.9999 15.1711 18.9999 12.0001 C 18.9999 8.8291 16.8914 6.15058 14 5.29 L 14 3.22307 C 18.008 4.13255 20.9999 7.71688 20.9999 12.0001 Z M 17 12 C 17 14.0503 15.7659 15.8124 14 16.584 L 14 7.41605 C 15.7659 8.1876 17 9.94968 17 12 Z" stroke-linecap="round" /></g><g transform="matrix(11.12 11.12 -1.9 1.9 561.26 523.68)" id="d93fb998-08a3-41ff-8a37-a9e13e463e52"  ><rect vector-effect="non-scaling-stroke"  x="-37.46" y="-19.415" rx="0" ry="0" width="74.92" height="38.83" /></g></svg>';
        case "loop":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 17,17L 7,17L 7,14L 3,18L 7,22L 7,19L 19,19L 19,13L 17,13M 7,7L 17,7L 17,10L 21,6L 17,2L 17,5L 5,5L 5,11L 7,11L 7,7 Z "/></svg>';
        case "loopOne":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 13,15L 13,9L 12,9L 10,10L 10,11L 11.5,11L 11.5,15M 17,17L 7,17L 7,14L 3,18L 7,22L 7,19L 19,19L 19,13L 17,13M 7,7L 17,7L 17,10L 21,6L 17,2L 17,5L 5,5L 5,11L 7,11L 7,7 Z "/></svg>';
        case "shuffle":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 17,3L 22.25,7.50002L 17,12L 22.25,16.5L 17,21L 17,18L 14.2574,18L 11.4393,15.182L 13.5607,13.0607L 15.5,15L 17,15L 17,12L 17,9L 15.5,9L 6.49999,18L 2,18L 2,15L 5.25736,15L 14.2574,6L 17,6L 17,3 Z M 2,6.00001L 6.5,6.00001L 9.31802,8.81803L 7.1967,10.9393L 5.25737,9.00001L 2,9.00001L 2,6.00001 Z "/></svg>';
        case "radio":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 20,6C 21.1046,6 22,6.89543 22,8L 22,20C 22,21.1046 21.1046,22 20,22L 4,22C 2.89543,22 2,21.1046 2,20L 2,8C 2,7.15034 2.52983,6.42443 3.27712,6.13463L 15.707,0.986006L 16.4724,2.83377L 8.82842,6L 20,6 Z M 20,8.00001L 4,8.00001L 4,12L 16,12L 16,10L 18,10L 18,12L 20,12L 20,8.00001 Z M 7,14C 5.34314,14 4,15.3431 4,17C 4,18.6569 5.34314,20 7,20C 8.65685,20 10,18.6569 10,17C 10,15.3431 8.65685,14 7,14 Z "/></svg>';
        case "prev":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 6,17.9997L 6,5.99972L 8,5.99972L 8,17.9997L 6,17.9997 Z M 9.5,12L 18,6L 18,18L 9.5,12 Z "/></svg>';
        case "next":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 16,18L 18,18L 18,5.99999L 16,5.99999M 6,18L 14.5,12L 6,5.99999L 6,18 Z "/></svg>';
        case "volume":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 3,9.00002L 6.99998,9.00004L 12,4.00002L 12,20L 6.99998,15L 2.99998,15L 3,9.00002 Z M 20.9999,12.0001C 20.9999,16.2832 18.008,19.8676 14,20.777L 14,18.7102C 16.8914,17.8496 18.9999,15.1711 18.9999,12.0001C 18.9999,8.8291 16.8914,6.15058 14,5.29L 14,3.22307C 18.008,4.13255 20.9999,7.71688 20.9999,12.0001 Z M 17,12C 17,14.0503 15.7659,15.8124 14,16.584L 14,7.41605C 15.7659,8.1876 17,9.94968 17,12 Z "/></svg>';
        case "volume-minus":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 3,9.00002L 6.99998,9.00004L 12,4.00002L 12,20L 6.99998,15L 2.99998,15L 3,9.00002 Z M 14,11L 22,11L 22,13L 14,13L 14,11 Z "/></svg>';
        case "volume-plus":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 3,9.00002L 6.99998,9.00004L 12,4.00002L 12,20L 6.99998,15L 2.99998,15L 3,9.00002 Z M 14,11L 17,11L 17,8L 19,8L 19,11L 22,11L 22,13L 19,13L 19,16L 17,16L 17,13L 14,13L 14,11 Z "/></svg>';
        case "settings":
            return '<svg viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />';
        case "device":
            return '<svg viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g id="layer1"><path d="M 1 6 L 0 7 L 0 14 L 1 15 L 19 15 L 20 14 L 20 7 L 19 6 L 9.5 6 L 10.5 7 L 18.5 7 L 19 7.5 L 19 13.5 L 18.5 14 L 1.5 14 L 1 13.5 L 1 7.5 L 1.5 7 L 2.5 7 L 3.5 6 L 1 6 z M 6.5 6 C 4.5729257 6 3 7.5729257 3 9.5 C 3 11.427074 4.5729257 13 6.5 13 C 8.4270743 13 10 11.427074 10 9.5 C 10 7.5729257 8.4270743 6 6.5 6 z M 6.5 7 C 7.8866342 7 9 8.1133658 9 9.5 C 9 10.886634 7.8866342 12 6.5 12 C 5.1133658 12 4 10.886634 4 9.5 C 4 8.1133658 5.1133658 7 6.5 7 z M 13 8 L 13 9 L 17 9 L 17 8 L 13 8 z M 13 10 L 13 11 L 17 11 L 17 10 L 13 10 z M 13 12 L 13 13 L 17 13 L 17 12 L 13 12 z"></path></g></g></svg>';
        default:
            break;
    }
}
