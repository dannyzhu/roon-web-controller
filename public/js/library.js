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
    console.log('[Library] Socket.io Connected to server.');
    // socket.emit("subscribe", {
    //     type: "roon",
    // });
});

socket.on('disconnect', (reason) => {
    console.log(`[Library] Socket.io Disconnected from server. Reason: ${reason}`);
    // 在这里可以提示用户连接断开
});

socket.on('reconnect_attempt', (attempt) => {
    console.log(`[Library] Socket.io Reconnection attempt ${attempt}`);
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`[Library] Socket.io Reconnected to server on attempt ${attemptNumber}`);
});

socket.on('reconnect_failed', () => {
    console.log('[Library] Socket.io Failed to reconnect to the server.');
});

var settings = [];

$(document).ready(function () {
    showPage();
});

function showPage() {
    // Read settings from cookie
    settings.zoneID = readCookie("settings['zoneID']");
    settings.displayName = readCookie("settings['displayName']");

    // Set page fields to settings
    if (settings.zoneID === null) {
        $("#overlayZoneList").show();
    }

    if (settings.displayName !== null) {
        $(".buttonZoneName").html(settings.displayName);
        if (settings.zoneID !== null) {
            goHome();
        }
    }

    enableSockets();
}

function enableSockets() {
    socket.on("zoneList", function (payload) {
        $(".zoneList").html("");

        if (payload !== undefined) {
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
            }
            // Set zone button to active
            $(".buttonZoneId").removeClass("buttonSettingActive");
            $("#button-" + settings.zoneID).addClass("buttonSettingActive");
        }
    });
}

function selectZone(zone_id, display_name) {
    settings.zoneID = zone_id;
    settings.displayName = display_name;
    $(".buttonZoneName").html(settings.displayName);

    // Set zone button to active
    $(".buttonZoneId").removeClass("buttonSettingActive");
    $("#button-" + settings.zoneID).addClass("buttonSettingActive");
    $("#overlayZoneList").hide();
    goHome(settings.zoneID);
}

function goBack() {
    var data = {};
    data.zone_id = settings.zoneID;
    data.options = { pop_levels: 1 };

    console.log("goBack: ", JSON.stringify(data, null, 2));
    
    $.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        url: "/roonapi/goRefreshBrowse",
        success: function (payload) {
            showData(payload, settings.zoneID, 1);
        }
    });
}

function goHome() {
    var data = {};
    data.zone_id = settings.zoneID;
    data.options = { pop_all: true };

    console.log("goHome: ", JSON.stringify(data, null, 2));

    $.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        url: "/roonapi/goRefreshBrowse",
        success: function (payload) {
            showData(payload, settings.zoneID);
        }
    });
}

function goRefresh() {
    var data = {};
    data.zone_id = settings.zoneID;
    data.options = { refresh_list: true };

    console.log("goRefresh: ", JSON.stringify(data, null, 2));

    $.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        url: "/roonapi/goRefreshBrowse",
        success: function (payload) {
            showData(payload, settings.zoneID);
        }
    });
}

function goList(item_key, listoffset) {
    var data = {};
    data.zone_id = settings.zoneID;
    data.options = { item_key: item_key };

    if (listoffset === undefined) {
        data.listoffset = 0;
    } else {
        data.listoffset = listoffset;
    }

    console.log("goList: ", JSON.stringify(data, null, 2));

    $.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        url: "/roonapi/goRefreshBrowse",
        success: function (payload) {
            showData(payload, settings.zoneID);
        }
    });
}

function goPage(listoffset) {
    var data = {};
    if (listoffset === undefined) {
        data.listoffset = 0;
    } else {
        data.listoffset = listoffset;
    }

    console.log("goPage: ", JSON.stringify(data, null, 2));

    $.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        url: "/roonapi/goLoadBrowse",
        success: function (payload) {
            showData(payload, settings.zoneID);
        }
    });
}

function goSearch() {
    var data = {};
    data.zone_id = settings.zoneID;
    data.options = {};
    if ($("#searchText").val() === "" || $("#searchItemKey").val() === "") {
        return;
    } else {
        data.options.item_key = $("#searchItemKey").val();
        data.options.input = $("#searchText").val();
    }

    $.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        url: "/roonapi/goRefreshBrowse",
        success: function (payload) {
            showData(payload, settings.zoneID);
        }
    });
}

function showData(payload, zone_id) {

    if (payload.error) {
        console.log('[showData()] Server Response Error: ' + payload.error);
        if (payload.error != 'ZoneNotFound') {
            setTimeout(function () {
                window.location.reload();
            }, 2000)
        }
        return;
    }

    // console.log(JSON.stringify(payload, null, 2));

    $("#buttonRefresh")
        .html(getSVG("refresh"))
        .attr("onclick", "goRefresh()");

    var items = payload.data.items;
    var list = payload.data.list;

    $("#items").html("");

    $("#coverBackground").css("background-image", "url('/img/ma352_0.jpg')");
    $("#coverBackground").css("z-index", "-1");
    $("#coverBackground").show();

    if (items !== null) {
        $("#listTitle").html(list.title);
        $("#listSubtitle").html(list.subtitle);

        if (list.image_key) {
            $("#listImage")
                .html(
                    '<img class="listInfoImage" src="/roonapi/image/' +
                    list.image_key + '.jpg' +
                    '" alt="">'
                )
                .show();
            $("#listImage").css("width", "29%");
            $("#listInfo").css("width", "69%");
            $("#coverBackground")
                .css(
                    "background-image",
                    'url("/roonapi/image/' + list.image_key + '.jpg")'
                )
                .show();
        } else {
            $("#listImage")
                .html("")
                .hide();
            $("#listInfo").css("width", "95%");
            // $("#coverBackground").hide();
            $("#coverBackground").css("background-image", "url('/img/ma352_0.jpg')");
            $("#coverBackground").css("z-index", "-1");
            $("#coverBackground").show();
        }

        for (var x in items) {
            var html = "";
            if (items[x].input_prompt) {
                html += '<form action="javascript:goSearch();" class="searchGroup">';
                html +=
                    '<input type="search" id="searchText" name="search" class="searchForm" placeholder="' +
                    items[x].input_prompt.prompt +
                    '" autocomplete="off">';
                html +=
                    '<button type="submit" class="itemListButton">' +
                    getSVG("search") +
                    "</button>";
                html +=
                    '<input type="text" id="searchItemKey" class="hidden" value="' +
                    items[x].item_key +
                    '" ></span>';
                html += "</form>";

                $("#items").append(html);
            } else {
                let image_key = items[x].image_key;
                // if (image_key === null || image_key.trim() === "") {
                //   image_key = list.image_key;
                // }
                html +=
                    '<button type="button" class="itemListItem" onclick="goList(\'' +
                    items[x].item_key +
                    "')\">";
                if (image_key === null || image_key.trim() === "") {
                    html += getSVGOrImageForItem(items[x], list);
                } else {
                    html += '<img class="itemInfoImage" src="/roonapi/image/' +
                        image_key + '.jpg' +
                        '" alt="">';
                }
                html += '<span><span class="itemInfoTitle">' + items[x].title + "</span>";
                if (items[x].subtitle === null || items[x].subtitle == "") {
                } else {
                    html +=
                        '<br><span class="itemInfoSubTitle">(' + items[x].subtitle + ")</span>";
                }
                html += "</span></button>";
                // html += "</form>";
                $("#items").append(html);
            }
        }

        if (list.level == 0) {
            $("#buttonBack")
                .prop("disabled", true)
                .attr("aria-disabled", true)
                .html(getSVG("back"));
            $("#buttonHome")
                .prop("disabled", true)
                .attr("aria-disabled", true)
                .html(getSVG("home"));
        } else {
            $("#buttonBack")
                .attr("onclick", "goBack()")
                .attr("aria-disabled", false)
                .html(getSVG("back"))
                .prop("disabled", false);
            $("#buttonHome")
                .attr("onclick", "goHome()")
                .attr("aria-disabled", false)
                .html(getSVG("home"))
                .prop("disabled", false);
        }

        if (list.display_offset > 0) {
            $("#buttonPrev")
                .prop("disabled", false)
                .attr("onclick", "goPage('" + (list.display_offset - 100) + "')")
                .attr("aria-disabled", false)
                .html(getSVG("prev"));
        } else {
            $("#buttonPrev")
                .prop("disabled", true)
                .attr("aria-disabled", true)
                .html(getSVG("prev"));
        }

        if (list.display_offset + items.length < list.count) {
            $("#buttonNext")
                .prop("disabled", false)
                .attr("aria-disabled", false)
                .attr("onclick", "goPage('" + (list.display_offset + 100) + "')")
                .html(getSVG("next"));
        } else {
            $("#buttonNext")
                .prop("disabled", true)
                .attr("aria-disabled", true)
                .html(getSVG("next"));
        }

        $("#pageNumber").html(
            list.display_offset +
            1 +
            "-" +
            (list.display_offset + items.length) +
            " of " +
            list.count
        );

        if (
            $("#buttonPrev").prop("disabled") === true &&
            $("#buttonNext").prop("disabled") === true
        ) {
            $("#navLine2").hide();
            $("#content").css("bottom", "0");
        } else {
            $("#navLine2").show();
            $("#content").css("bottom", "48px");
        }
        contentScrollToTop();
    }
}

function readCookie(name) {
    return Cookies.get(name);
}

function getSVG(cmd) {
    switch (cmd) {
        case "home":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 9.99939,19.998L 9.99939,13.998L 13.9994,13.998L 13.9994,19.998L 18.9994,19.998L 18.9994,11.998L 21.9994,11.998L 11.9994,2.99805L 1.99939,11.998L 4.99939,11.998L 4.99939,19.998L 9.99939,19.998 Z "/></svg>';
        case "back":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 20,11L 20,13L 7.98958,13L 13.4948,18.5052L 12.0806,19.9194L 4.16116,12L 12.0806,4.08058L 13.4948,5.49479L 7.98958,11L 20,11 Z "/></svg>';
        case "refresh":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 17.65,6.35C 16.2,4.9 14.21,4 12,4C 7.58,4 4.01,7.58 4.01,12C 4.01,16.42 7.58,20 12,20C 15.73,20 18.84,17.45 19.73,14L 17.65,14C 16.83,16.33 14.61,18 12,18C 8.69,18 6,15.31 6,12C 6,8.69 8.69,6 12,6C 13.66,6 15.14,6.69 16.22,7.78L 13,11L 20,11L 20,4L 17.65,6.35 Z "/></svg>';
        case "prev":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 15.4135,16.5841L 10.8275,11.9981L 15.4135,7.41207L 13.9995,5.99807L 7.99951,11.9981L 13.9995,17.9981L 15.4135,16.5841 Z "/></svg>';
        case "next":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 8.58527,16.584L 13.1713,11.998L 8.58527,7.41198L 9.99927,5.99798L 15.9993,11.998L 9.99927,17.998L 8.58527,16.584 Z "/></svg>';
        case "backspace":
            return '<svg viewBox="0 0 24 24"><path d="M22,3H7C6.31,3 5.77,3.35 5.41,3.88L0,12L5.41,20.11C5.77,20.64 6.31,21 7,21H22A2,2 0 0,0 24,19V5A2,2 0 0,0 22,3M19,15.59L17.59,17L14,13.41L10.41,17L9,15.59L12.59,12L9,8.41L10.41,7L14,10.59L17.59,7L19,8.41L15.41,12" /></svg>';
        case "search":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 9.5,3C 13.0899,3 16,5.91015 16,9.5C 16,11.1149 15.411,12.5923 14.4362,13.7291L 14.7071,14L 15.5,14L 20.5,19L 19,20.5L 14,15.5L 14,14.7071L 13.7291,14.4362C 12.5923,15.411 11.1149,16 9.5,16C 5.91015,16 3,13.0899 3,9.5C 3,5.91015 5.91015,3 9.5,3 Z M 9.5,5.00001C 7.01472,5.00001 5,7.01473 5,9.50001C 5,11.9853 7.01472,14 9.5,14C 11.9853,14 14,11.9853 14,9.50001C 14,7.01473 11.9853,5.00001 9.5,5.00001 Z "/></svg>';
        case "music":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 21,3L 21,15.5C 21,17.433 19.433,19 17.5,19C 15.567,19 14,17.433 14,15.5C 14,13.567 15.567,12 17.5,12C 18.0368,12 18.5454,12.1208 19,12.3368L 19,6.4698L 9,8.59536L 9,17.5C 9,19.433 7.433,21 5.5,21C 3.567,21 2,19.433 2,17.5C 2,15.567 3.567,14 5.5,14C 6.0368,14 6.54537,14.1208 7,14.3368L 7,5.97579L 21,3 Z "/></svg>';
        case "album":
            return '<svg width="48px" height="48px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M425.706,86.294A240,240,0,0,0,86.294,425.706,240,240,0,0,0,425.706,86.294ZM256,464C141.309,464,48,370.691,48,256S141.309,48,256,48s208,93.309,208,208S370.691,464,256,464Z"/><path d="M256,152A104,104,0,1,0,360,256,104.118,104.118,0,0,0,256,152Zm0,176a72,72,0,1,1,72-72A72.081,72.081,0,0,1,256,328Z"/><rect width="32" height="32" x="240" y="240"/><path d="M256,112V80a174.144,174.144,0,0,0-79.968,19.178A177.573,177.573,0,0,0,115.2,150.39l25.586,19.219A142.923,142.923,0,0,1,256,112Z"/></svg>';
        case "composer":
            return '<svg width="48px" height="48px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M15 5.4v-.9a.5.5 0 0 0-.5-.5H11c-4.112 0-7 2.063-7 6 0 2.672 1.531 5.833 3.34 7.466l.33.298a1 1 0 0 1 .33.742V20h7v-1.271a1 1 0 0 1 .565-.9l.564-.273c.464-.225 1-.442 1.595-.654l.421-.145a.506.506 0 0 0 .332-.601l-.507-2.03a1 1 0 0 1 .076-.69l1.13-2.26a.5.5 0 0 0-.19-.652L16.99 9.326a.5.5 0 0 1-.216-.267l-.178-.519a7.34 7.34 0 0 0-.711-1.502L13 8v2a1 1 0 0 1-1 1 1 1 0 0 0 0 2 1 1 0 0 1 0 2 3 3 0 0 1-1-5.83V7.678a1 1 0 0 1 .629-.928L15 5.4zM7 22a1 1 0 0 1-1-1v-2.05C4.087 17.225 2 13.613 2 10c0-6 5-8 9-8h4a2 2 0 0 1 2 2v1.15a9.296 9.296 0 0 1 1.489 2.743l2.717 1.63a1 1 0 0 1 .38 1.305l-1.503 3.007a.5.5 0 0 0-.038.344l.712 2.85a1.033 1.033 0 0 1-.723 1.234c-.77.223-1.865.569-2.75.961a.484.484 0 0 0-.284.446V21a1 1 0 0 1-1 1H7z"/></svg>';
        case "library":
            return '<svg width="48px" height="48px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9v11M4 9h16M4 9H3l9-5 9 5h-1M4 20h16M4 20H3m17 0V9m0 11h1M8 13v3m4 0v-3m4 0v3"/></svg>';
        case "track":
            return '<svg width="48px" height="48px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M10.0909 11.9629L19.3636 8.63087V14.1707C18.8126 13.8538 18.1574 13.67 17.4545 13.67C15.4964 13.67 13.9091 15.096 13.9091 16.855C13.9091 18.614 15.4964 20.04 17.4545 20.04C19.4126 20.04 21 18.614 21 16.855C21 16.855 21 16.8551 21 16.855L21 7.49236C21 6.37238 21 5.4331 20.9123 4.68472C20.8999 4.57895 20.8852 4.4738 20.869 4.37569C20.7845 3.86441 20.6352 3.38745 20.347 2.98917C20.2028 2.79002 20.024 2.61055 19.8012 2.45628C19.7594 2.42736 19.716 2.39932 19.6711 2.3722L19.6621 2.36679C18.8906 1.90553 18.0233 1.93852 17.1298 2.14305C16.2657 2.34086 15.1944 2.74368 13.8808 3.23763L11.5963 4.09656C10.9806 4.32806 10.4589 4.52419 10.0494 4.72734C9.61376 4.94348 9.23849 5.1984 8.95707 5.57828C8.67564 5.95817 8.55876 6.36756 8.50501 6.81203C8.4545 7.22978 8.45452 7.7378 8.45455 8.33743V16.1307C7.90347 15.8138 7.24835 15.63 6.54545 15.63C4.58735 15.63 3 17.056 3 18.815C3 20.574 4.58735 22 6.54545 22C8.50355 22 10.0909 20.574 10.0909 18.815C10.0909 18.815 10.0909 18.8151 10.0909 18.815L10.0909 11.9629Z"/></svg>';
        case "artist":
            return '<svg width="48px" height="48px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"><g><path d="M270.16,128.905c20.016,8.398,43.083-1.019,51.489-21.067c8.406-20.04-1.035-43.082-21.059-51.48 c-20.048-8.414-43.09,1.028-51.497,21.051C240.688,97.441,250.121,120.507,270.16,128.905z"/><path d="M352.496,122.739c8.526,1.911,16.981-3.468,18.876-11.995c1.902-8.518-3.469-16.972-11.987-18.884 c-8.518-1.894-16.989,3.485-18.884,12.012C338.59,112.382,343.962,120.844,352.496,122.739z"/><path d="M507.467,428.7l-52.741-13.296l-57.639-289.429l26.84,4.761l3.091-13.842l-51.657-13.931l-4.111,18.426 l13.159,2.337l0.081,0.394c-5.5-0.161-10.799,2.962-13.095,8.326l-33.328,53.286l-35.366-20.987L108.486,49.14 c-7.065-4.657-16.556-2.706-21.212,4.359c-4.648,7.058-2.698,16.556,4.368,21.204l99.749,76.9 c2.842,1.999,3.452,6.255,0.883,11.104C188.412,169.98,5.003,417.122,5.003,417.122c-7.298,8.254-6.52,20.86,1.734,28.165 c8.262,7.298,20.883,6.52,28.182-1.742l139.66-130.757c3.998-3.998,6.222-6.222,16.884,0.876l61.917,35.551l6.52,90.757 c0.056,9.924,8.157,17.913,18.072,17.84c9.924-0.064,17.913-8.149,17.856-18.065l5.716-100.143 c0.538-10.268-2.128-16.612-9.94-23.925l-58.377-55.311c0,0,38.024-39.276,44.616-44.961c3.019-2.625,5.813-7.33,10.735-5.684 l46.824,18.643c12.324,6.013,18.908-1.325,25.298-7.17l30.14-65.17l52.187,262.116l-40.577,36.803 c-2.449,2.232-2.633,6.03-0.409,8.471c1.18,1.309,2.81,1.975,4.456,1.975c1.429,0,2.874-0.514,4.014-1.557l40.714-36.932 l53.303,13.424c0.498,0.128,0.988,0.185,1.478,0.185c2.674,0,5.13-1.814,5.812-4.528 C512.622,432.762,510.678,429.502,507.467,428.7z"/></g></svg>'
        case 'tag':
            return '<svg width="48px" height="48px" viewBox="0 -3 24 24"><path d="M11.586 15.071L13 13.657l1.414 1.414 6.165-6.165 1.09-3.552-2.484-2.483-1.079.336-1.598-1.598L18.591.96a2 2 0 0 1 2.008.496l2.483 2.483a2 2 0 0 1 .498 2L22.345 9.97l-7.93 7.93-2.83-2.828zM14.236.75l2.482 2.483a2 2 0 0 1 .498 2l-1.235 4.028-7.93 7.931-7.78-7.778L8.17 1.516 12.227.254a2 2 0 0 1 2.008.496zM3.1 9.414l4.95 4.95 6.164-6.165 1.09-3.552-2.484-2.483-3.585 1.115L3.1 9.414zm7.424-2.475a1.5 1.5 0 1 1 2.121-2.121 1.5 1.5 0 0 1-2.12 2.121zm6.886 1.022l.782-2.878c.45.152.755.325.917.518a1.5 1.5 0 0 1-.185 2.113c-.29.244-.795.326-1.514.247z"/></svg>';
        case 'playlist':
            return '<svg width="48px" height="48px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 5C2.25 4.58579 2.58579 4.25 3 4.25H15C15.4142 4.25 15.75 4.58579 15.75 5C15.75 5.41421 15.4142 5.75 15 5.75H3C2.58579 5.75 2.25 5.41421 2.25 5ZM19.8632 7.40036C19.667 7.47267 19.4083 7.59593 18.9996 7.79212L17.2451 8.63429C17.0656 8.72043 16.9633 8.76996 16.8888 8.81194C16.843 8.83773 16.8253 8.85121 16.8207 8.85503C16.7963 8.88014 16.7774 8.9101 16.7654 8.94296C16.7639 8.94872 16.7594 8.97052 16.756 9.02297C16.7504 9.10834 16.75 9.22201 16.75 9.42108C16.75 9.87446 16.7508 10.161 16.7705 10.3692C16.7827 10.4972 16.7991 10.5513 16.8044 10.5665C16.8397 10.6108 16.889 10.6418 16.9442 10.6545C16.9602 10.6527 17.0161 10.6441 17.1368 10.5996C17.333 10.5273 17.5917 10.4041 18.0004 10.2079L19.7549 9.36571C19.9344 9.27957 20.0367 9.23004 20.1112 9.18806C20.1571 9.16226 20.1748 9.14878 20.1793 9.14496C20.2037 9.11985 20.2226 9.08989 20.2346 9.05703C20.2361 9.05125 20.2406 9.02945 20.244 8.97703C20.2496 8.89166 20.25 8.77799 20.25 8.57892C20.25 8.12554 20.2492 7.83903 20.2295 7.63082C20.2173 7.50277 20.2009 7.44867 20.1956 7.4335C20.1603 7.38919 20.111 7.35817 20.0558 7.34553C20.0398 7.34726 19.9839 7.35589 19.8632 7.40036ZM16.7658 8.9413C16.7659 8.94135 16.7657 8.94202 16.7654 8.94296L16.7658 8.9413ZM16.8194 8.85619C16.8194 8.85618 16.8198 8.85577 16.8207 8.85503L16.8194 8.85619ZM19.3446 5.99286C19.6232 5.8902 19.9559 5.80212 20.3149 5.8678C20.7572 5.9487 21.1513 6.19672 21.4156 6.56043C21.6302 6.85569 21.6948 7.19367 21.7228 7.48928C21.75 7.77699 21.75 8.13579 21.75 8.5446V8.57892C21.75 8.60396 21.7501 8.62917 21.7501 8.65453C21.7509 8.95464 21.7518 9.27515 21.644 9.57044C21.559 9.80354 21.4254 10.0159 21.252 10.1934C21.0324 10.4183 20.7431 10.5562 20.4722 10.6854C20.4494 10.6963 20.4266 10.7072 20.404 10.718L18.6185 11.575C18.25 11.7519 17.9266 11.9072 17.6554 12.0071C17.3936 12.1036 17.0842 12.1872 16.75 12.1425V16.4286C16.75 18.2429 15.3147 19.75 13.5 19.75C11.6853 19.75 10.25 18.2429 10.25 16.4286C10.25 14.6143 11.6853 13.1071 13.5 13.1071C14.1477 13.1071 14.747 13.2991 15.25 13.6285V10H15.2529C15.25 9.83116 15.25 9.64888 15.25 9.4554L15.25 9.42108C15.25 9.39604 15.2499 9.37083 15.2499 9.34547C15.2491 9.04536 15.2482 8.72485 15.356 8.42957C15.441 8.19646 15.5746 7.9841 15.748 7.80658C15.9676 7.5817 16.2569 7.44376 16.5278 7.31461C16.5506 7.30369 16.5734 7.29284 16.596 7.282L18.3814 6.42498C18.75 6.24805 19.0734 6.09278 19.3446 5.99286ZM15.25 16.4286C15.25 15.4026 14.4467 14.6071 13.5 14.6071C12.5533 14.6071 11.75 15.4026 11.75 16.4286C11.75 17.4546 12.5533 18.25 13.5 18.25C14.4467 18.25 15.25 17.4546 15.25 16.4286ZM2.25 9C2.25 8.58579 2.58579 8.25 3 8.25H13C13.4142 8.25 13.75 8.58579 13.75 9C13.75 9.41421 13.4142 9.75 13 9.75H3C2.58579 9.75 2.25 9.41421 2.25 9ZM2.25 13C2.25 12.5858 2.58579 12.25 3 12.25H9C9.41421 12.25 9.75 12.5858 9.75 13C9.75 13.4142 9.41421 13.75 9 13.75H3C2.58579 13.75 2.25 13.4142 2.25 13ZM2.25 17C2.25 16.5858 2.58579 16.25 3 16.25H8C8.41421 16.25 8.75 16.5858 8.75 17C8.75 17.4142 8.41421 17.75 8 17.75H3C2.58579 17.75 2.25 17.4142 2.25 17Z"/></svg>';
        case 'genre':
            return '<svg width="48px" height="48px" viewBox="0 0 16 16"><path d="M5 1H8V15H5V1Z"/><path d="M0 3H3V15H0V3Z"/><path d="M12.167 3L9.34302 3.7041L12.1594 15L14.9834 14.2959L12.167 3Z"/></svg>';
        case 'settings':
            return '<svg viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"></path></svg>';
        case 'radio':
            return '<svg viewBox="0 0 24 24"><path d="M9,18a4,4,0,1,0-4-4A4,4,0,0,0,9,18Zm0-6a2,2,0,1,1-2,2A2,2,0,0,1,9,12Zm5,2a1,1,0,0,1,1-1h3a1,1,0,0,1,0,2H15A1,1,0,0,1,14,14Zm0,3a1,1,0,0,1,1-1h3a1,1,0,0,1,0,2H15A1,1,0,0,1,14,17Zm0-6a1,1,0,0,1,1-1h3a1,1,0,0,1,0,2H15A1,1,0,0,1,14,11Zm8.206-4.979-19-4a1,1,0,1,0-.412,1.958L12.4,6H2A1,1,0,0,0,1,7V21a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V7A1.055,1.055,0,0,0,22.206,6.021ZM21,20H3V8H21Z"/></svg>';
        case 'tidal':
            return '<svg viewBox="0 0 32 32"><path d="M16.016 5.323l-5.339 5.339-5.339-5.339-5.339 5.339 5.339 5.339 5.339-5.339 5.339 5.339-5.339 5.339 5.339 5.339 5.339-5.339-5.339-5.339 5.339-5.339zM21.391 10.661l5.302-5.307 5.307 5.307-5.307 5.307z"/></svg>';
        case 'qobuz':
            return '<svg viewBox="0 0 24 24" style="fill: currentcolor; opacity: 1;"><path d="M19.543 18.566A9.961 9.961 0 0 0 22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10a9.953 9.953 0 0 0 5.6-1.714l-1.394-1.372a8.092 8.092 0 1 1 1.98-1.697l-2.064-2.049c-.848-.34-1.44.546-1.107 1.298l5.618 5.527 1.176-1.176-2.266-2.251z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12 15.13a3.13 3.13 0 1 0 0-6.26 3.13 3.13 0 0 0 0 6.26zm0-2.443a.687.687 0 1 0 0-1.374.687.687 0 0 0 0 1.374z"></path></svg>';
        case 'favorite':
            return '<svg viewBox="0 0 24 24"><path d="M12.6719 2.75961L14.5163 6.504L13.75 6.50495L13.6493 6.50834L13.5475 6.51518L13.4466 6.52542L13.2898 6.55231C12.2582 6.76694 11.5 7.67945 11.5 8.75495C11.5 9.92024 12.3858 10.8786 13.5209 10.9934L13.6771 11.0038L13.6493 11.0034L13.5475 11.0102L13.4466 11.0205L13.2898 11.0474C12.3125 11.2507 11.5806 12.0804 11.5062 13.0816L11.5 13.25L11.5052 13.404C11.5808 14.5216 12.4724 15.4154 13.589 15.4943L13.75 15.5L14 15.501L13.75 15.5015L13.6493 15.5049L13.5475 15.5117L13.4466 15.5219L13.2898 15.5488C12.3125 15.7522 11.5806 16.5818 11.5062 17.5831L11.5 17.7515L11.5052 17.9055C11.5241 18.1848 11.5939 18.4501 11.7055 18.6923L6.62564 21.3682C6.07517 21.6581 5.43135 21.1904 5.53701 20.5772L6.5684 14.5921L2.21602 10.3563C1.77015 9.92234 2.01606 9.16549 2.63184 9.07651L8.64275 8.20791L11.3263 2.75961C11.6012 2.20147 12.397 2.20147 12.6719 2.75961ZM21.25 17.0015C21.6642 17.0015 22 17.3373 22 17.7515C22 18.1312 21.7178 18.445 21.3518 18.4946L21.25 18.5015H13.75C13.3358 18.5015 13 18.1657 13 17.7515C13 17.3718 13.2822 17.058 13.6482 17.0083L13.75 17.0015H21.25ZM21.25 12.5C21.6642 12.5 22 12.8358 22 13.25C22 13.6297 21.7178 13.9435 21.3518 13.9932L21.25 14H13.75C13.3358 14 13 13.6642 13 13.25C13 12.8703 13.2822 12.5565 13.6482 12.5068L13.75 12.5H21.25ZM21.25 8.00495C21.6642 8.00495 22 8.34074 22 8.75495C22 9.13465 21.7178 9.44845 21.3518 9.49811L21.25 9.50495H13.75C13.3358 9.50495 13 9.16917 13 8.75495C13 8.37526 13.2822 8.06146 13.6482 8.0118L13.75 8.00495H21.25Z"/></svg>';
        case 'new':
            return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">  <title>new-star</title>  <g id="Layer_2" data-name="Layer 2">    <g id="invisible_box" data-name="invisible box">      <rect width="48" height="48" fill="none"/>    </g>    <g id="icons_Q2" data-name="icons Q2">      <path d="M42.3,24l3.4-5.1a2,2,0,0,0,.2-1.7A1.8,1.8,0,0,0,44.7,16l-5.9-2.4-.5-5.9a2.1,2.1,0,0,0-.7-1.5,2,2,0,0,0-1.7-.3L29.6,7.2,25.5,2.6a2.2,2.2,0,0,0-3,0L18.4,7.2,12.1,5.9a2,2,0,0,0-1.7.3,2.1,2.1,0,0,0-.7,1.5l-.5,5.9L3.3,16a1.8,1.8,0,0,0-1.2,1.2,2,2,0,0,0,.2,1.7L5.7,24,2.3,29.1a2,2,0,0,0,1,2.9l5.9,2.4.5,5.9a2.1,2.1,0,0,0,.7,1.5,2,2,0,0,0,1.7.3l6.3-1.3,4.1,4.5a2,2,0,0,0,3,0l4.1-4.5,6.3,1.3a2,2,0,0,0,1.7-.3,2.1,2.1,0,0,0,.7-1.5l.5-5.9L44.7,32a2,2,0,0,0,1-2.9ZM18,31.1l-4.2-3.2L12.7,27h-.1l.6,1.4,1.7,4-2.1.8L9.3,24.6l2.1-.8L15.7,27l1.1.9h0a11.8,11.8,0,0,0-.6-1.3l-1.6-4.1,2.1-.9,3.5,8.6Zm3.3-1.3-3.5-8.7,6.6-2.6.7,1.8L20.7,22l.6,1.6L25.1,22l.7,1.7L22,25.2l.7,1.9,4.5-1.8.7,1.8Zm13.9-5.7-2.6-3.7-.9-1.5h-.1a14.7,14.7,0,0,1,.4,1.7l.8,4.5-2.1.9-5.9-7.7,2.2-.9,2.3,3.3,1.3,2h0a22.4,22.4,0,0,1-.4-2.3l-.7-4,2-.8L33.8,19,35,20.9h0s-.2-1.4-.4-2.4L34,14.6l2.1-.9,1.2,9.6Z"/>    </g>  </g></svg>';
        case 'rising':
            return '<svg viewBox="0 0 16 16"><path d="M10 3L9.00001 4L11.2929 6.29289L8.50001 9.08579L5.50001 6.08579L0.292908 11.2929L1.70712 12.7071L5.50001 8.91421L8.50001 11.9142L12.7071 7.70711L15 10L16 9L16 3H10Z"/></svg>';
        case "play":
            return '<svg viewBox="0 0 24 24"><path d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5L16,12L10,7.5V16.5Z" /></svg>';
        case "shuffle":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 17,3L 22.25,7.50002L 17,12L 22.25,16.5L 17,21L 17,18L 14.2574,18L 11.4393,15.182L 13.5607,13.0607L 15.5,15L 17,15L 17,12L 17,9L 15.5,9L 6.49999,18L 2,18L 2,15L 5.25736,15L 14.2574,6L 17,6L 17,3 Z M 2,6.00001L 6.5,6.00001L 9.31802,8.81803L 7.1967,10.9393L 5.25737,9.00001L 2,9.00001L 2,6.00001 Z "/></svg>';
        case 'queue':
            return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">  <path d="M6 10H18"/>  <path d="M6 6H18"/>  <path d="M6 14H10"/>  <path d="M14 16H18"/>  <path d="M16 14L16 18"/>  <path d="M6 18H10"/></svg>';
        case "next":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 16,18L 18,18L 18,5.99999L 16,5.99999M 6,18L 14.5,12L 6,5.99999L 6,18 Z "/></svg>';
        case 'recommended':
            return '<svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><g> <path d="M12,2 C16.418278,2 20,5.581722 20,10 C20,12.5480905 18.8087155,14.8179415 16.9527141,16.2829857 L17.0016031,16.2440856 L17.0007001,22.2453233 C17.0007001,22.7945586 16.4297842,23.157512 15.9324488,22.9244522 L12.0005291,21.0818879 L8.07069102,22.9243915 C7.5733438,23.1575726 7.00231009,22.7946207 7.00231009,22.2453233 L7.00069412,16.2459273 C5.1725143,14.7820178 4,12.5279366 4,10 C4,5.581722 7.581722,2 12,2 Z M15.5012202,17.1951723 L15.5414683,17.1754104 C14.4738996,17.7033228 13.2715961,18 12,18 C10.8745896,18 9.80345551,17.7676152 8.83196505,17.3482129 L8.50180347,17.1966457 L8.50231009,21.065345 L11.6820691,19.5745158 C11.8837425,19.4799613 12.1170099,19.479939 12.3187014,19.5744551 L15.5007001,21.0655937 L15.5012202,17.1951723 Z M12,3.5 C8.41014913,3.5 5.5,6.41014913 5.5,10 C5.5,13.5898509 8.41014913,16.5 12,16.5 C15.5898509,16.5 18.5,13.5898509 18.5,10 C18.5,6.41014913 15.5898509,3.5 12,3.5 Z M12.2287851,6.64234387 L13.1413078,8.49499737 L15.185271,8.79035658 C15.3945922,8.82060416 15.4782541,9.07783021 15.326776,9.22542655 L13.8484251,10.6658938 L14.1974269,12.7012993 C14.2331646,12.9097242 14.0143068,13.0685941 13.8272087,12.9700424 L12,12.0075816 L10.1727912,12.9700424 C9.98560603,13.06864 9.76668059,12.9095814 9.80260908,12.7010893 L10.1533251,10.6658938 L8.67333197,9.22553178 C8.52171667,9.07797642 8.60533875,8.82061413 8.81472896,8.79035658 L10.8586922,8.49499737 L11.7712148,6.64234387 C11.8646966,6.45255204 12.1353033,6.45255204 12.2287851,6.64234387 Z"></path></g>  </g></svg>';
        case 'top':
            return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4,5A1,1,0,0,0,5,6H21a1,1,0,0,1,1,1V21a1,1,0,0,1-1,1H16a1,1,0,0,1,0-2h4V8H5a2.966,2.966,0,0,1-1-.184V19a1,1,0,0,0,1,1h5a1,1,0,0,0,1-1V14.414L9.707,15.707a1,1,0,0,1-1.414-1.414l3-3a.99.99,0,0,1,.326-.217,1,1,0,0,1,.764,0,.99.99,0,0,1,.326.217l3,3a1,1,0,0,1-1.414,1.414L13,14.414V19a3,3,0,0,1-3,3H5a3,3,0,0,1-3-3V5A3,3,0,0,1,5,2H21a1,1,0,0,1,0,2H5A1,1,0,0,0,4,5Z"/></svg>';
        case 'award':
            return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z"/><path d="M12 7a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 3.5l-1.323 2.68-2.957.43 2.14 2.085-.505 2.946L12 17.25l2.645 1.39-.505-2.945 2.14-2.086-2.957-.43L12 10.5zm1-8.501L18 2v3l-1.363 1.138A9.935 9.935 0 0 0 13 5.049L13 2zm-2 0v3.05a9.935 9.935 0 0 0-3.636 1.088L6 5V2l5-.001z"/></g></svg>';
        case 'selection':
            return '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g><path d="m 11.453125 5.414062 c 0.789063 0.050782 1.144531 1.007813 0.585937 1.566407 l -3.988281 4.121093 c -0.359375 0.359376 -0.941406 0.359376 -1.300781 0 l -2.382812 -2.300781 c -0.867188 -0.867187 0.433593 -2.167969 1.300781 -1.300781 l 1.730469 1.652344 l 3.339843 -3.472656 c 0.1875 -0.191407 0.449219 -0.285157 0.714844 -0.265626 z m 0 0"/><path d="m 7.996094 0 c -4.402344 0 -7.996094 3.59375 -7.996094 8 s 3.59375 8 7.996094 8 c 4.40625 0 7.996094 -3.59375 7.996094 -8 s -3.589844 -8 -7.996094 -8 z m 0 2 c 3.324218 0 5.996094 2.675781 5.996094 6 s -2.671876 6 -5.996094 6 c -3.324219 0 -5.996094 -2.675781 -5.996094 -6 s 2.671875 -6 5.996094 -6 z m 0 0"/></g></svg>';
        default:
            break;
    }
}


var getWrapSVG = function (cmd) {
    return '<span class="itemInfoImage">' + getSVG(cmd) + '</span>';
}

var getWrapImage = function (image_key) {
    return '<img class="itemInfoImage" src="/roonapi/image/' + image_key + '.jpg" alt="">';
}

var getSVGOrImageForItem = function (item, list) {
    let hint = item.hint;
    let title = item.title;
    let subtitle = item.subtitle;
    let image_key = item.image_key;
    let listTitle = list.title;
    let listImageKey = list.image_key;

    if (hint === "list") {
        if (title === 'Library') {
            return getWrapSVG('library');
        }
        if (title === 'Artists' || title === 'Favorite Artists') {
            return getWrapSVG('artist');
        }
        if (title === 'Tracks' || title === 'Favorite Tracks') {
            return getWrapSVG('track');
        }
        if (title === 'Composers') {
            return getWrapSVG('composer');
        }
        if (title === 'Albums' || title === 'Favorite Albums') {
            return getWrapSVG('album');
        }
        if (title === 'Tags') {
            return getWrapSVG('tag');
        }
        if (title === 'Playlists' || title === 'My Playlists') {
            return getWrapSVG('playlist');
        }
        if (title === 'Genres') {
            return getWrapSVG('genre');
        }
        if (title === 'Settings') {
            return getWrapSVG('settings');
        }
        if (title === 'My Live Radio') {
            return getWrapSVG('radio');
        }
        if (title === 'TIDAL') {
            return getWrapSVG('tidal');
        }
        if (title === 'Qobuz') {
            return getWrapSVG('qobuz');
        }
        if (title === 'Your Favorites' || title === 'My Qobuz') {
            return getWrapSVG('favorite');
        }
        if (title === "What's New" || title === "New Releases" || title === "New Albums" || title === "New Tracks" || title === "New" || title === "New Playlists") {
            return getWrapSVG('new');
        }
        if (title === "TIDAL Rising" || title === "Still Trending") {
            return getWrapSVG('rising');
        }
        if (title === "Recommended") {
            return getWrapSVG('recommended');
        }
        if (title === "Top20" || title === "Top 20" || title === "Top albums on Qobuz") {
            return getWrapSVG('top');
        }
        if (title === "Press Awards") {
            return getWrapSVG('award');
        }
        if (title === "Qobuz grand selection") {
            return getWrapSVG('selection');
        }

        if (subtitle !== null && subtitle.indexOf('Tracks') > -1) {
            return getWrapSVG('playlist');
        }

        if (listTitle === 'Composers') {
            return getWrapSVG('composer');
        }

        if (listTitle === 'Playlists' || listTitle === 'My Playlists' || listTitle === 'Label Stories' || listTitle === 'Exclusive' || listTitle === 'Recommended' || listTitle === 'New Playlists') {
            return getWrapSVG('playlist');
        }

        if (listTitle === 'Genres') {
            return getWrapSVG('genre');
        }
        if (listTitle === 'Tags') {
            return getWrapSVG('tag');
        }

    }

    if (hint === "action" || hint === "action_list") {
        if (title.startsWith("Play ")) {
            return getWrapSVG('play');
        }
        if (title === "Shuffle") {
            return getWrapSVG('shuffle');
        }
        if (title === "Add Next") {
            return getWrapSVG('next');
        }
        if (title === "Queue") {
            return getWrapSVG('queue');
        }
        if (title === "Start Radio") {
            return getWrapSVG('radio');
        }
    }

    if (listImageKey !== null) {
        return getWrapImage(listImageKey);
    }

    return getWrapSVG('album');
}

document.addEventListener('DOMContentLoaded', function() {
    var scrollToTopBtn = document.getElementById("scrollToTopBtn");
    var content = document.getElementById("content");

    content.onscroll = function() {
        if (content.scrollTop > 100) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };

    scrollToTopBtn.onclick = function() {
        contentScrollToTop();
    };
});

function contentScrollToTop() {
    var content = document.getElementById("content");
    content.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
