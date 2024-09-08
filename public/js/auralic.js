"use strict";

var curDeviceId;
var css = [];
var state = [];
var inVolumeSlider = false;
var socket;

var deviceList = [];

/**
 * Example:
 * auralicStatus = {
  "deviceId": "uuid:lightningRender-bc-34-00-a0-71-83::urn:schemas-upnp-org:device:MediaRenderer:1",
  "track": {
    "title": "Triple Concerto in C Major, Op. 56: II. Largo - attacca (Live at Philharmonie, Berlin / 2019) - West–Eastern Divan Orchestra / Anne‐Sophie Mutter / Yo‐Yo Ma / Daniel Barenboim / Ludwig van Beethoven",
    "album": "Beethoven: Triple Concerto & Symphony No. 7 (Live)",
    "artistAlbum": "Anne‐Sophie Mutter / Yo‐Yo Ma / Daniel Barenboim / West–Eastern Divan Orchestra",
    "artist": "Anne‐Sophie Mutter / Yo‐Yo Ma / Daniel Barenboim / West–Eastern Divan Orchestra",
    "resource": {
      "duration": "0:05:13",
      "size": 0,
      "bitsPerSample": 24,
      "bitrate": 2304000,
      "sampleFrequency": 48000,
      "nrAudioChannels": 2,
      "protocolInfo": "http-get:*:audio/x-flac:DLNA.ORG_OP=01;DLNA.ORG_FLAGS=01700000000000000000000000000000"
    },
    "clazz": "object.item.audioItem.musicTrack",
    "details": {
      "duration": "0",
      "bitrate": 0,
      "bitDepth": 32,
      "sampleRate": 48000,
      "lossless": 0,
      "codecName": ""
    }
  },
  "roon": {
    "repeat": 0,
    "shuffle": 0,
    "transportState": "Playing"
  },
  "volume": {
    "volume": 82,
    "mute": 0,
    "volumeLimit": 100
  },
  "sourceIndex": 6,
  "standby": 1,
  "isAlive": 1
  },
  roon: { repeat: '0', shuffle: '0', transportState: 'Playing' },
  volume: { volume: '43', mute: '0', volumeLimit: '100' },
  deviceId: 'uuid:lightningRender-bc-34-00-a0-71-83::urn:schemas-upnp-org:device:MediaRenderer:1',
  isAlive: '1'
}
 */
var auralicStatus = {
};

/**
 * Example:
 * auralicDeviceInfo = {
  "deviceId": "uuid:lightningRender-bc-34-00-a0-71-83::urn:schemas-upnp-org:device:MediaRenderer:1",
  "ipAddress": "192.168.8.58",
  "manufacturer": "AURALIC",
  "model": "ALTAIR_G1.1",
  "product": "ALTAIR_G1.1",
  "sourceCount": 140,
  "sourceList": [
    {
      "Name": "Playlist",
      "Type": "Playlist",
      "Visible": true,
      "Index": 0
    },
    {
      "Name": "Receiver",
      "Type": "Receiver",
      "Visible": true,
      "Index": 1
    },
    {
      "Name": "AirPlay",
      "Type": "AirPlay",
      "Visible": true,
      "Index": 2
    },
    {
      "Name": "Radio",
      "Type": "InternetRadio",
      "Visible": true,
      "Index": 4
    },
    {
      "Name": "Bluetooth",
      "Type": "Bluetooth",
      "Visible": true,
      "Index": 5
    },
    {
      "Name": "Roon",
      "Type": "Roon",
      "Visible": true,
      "Index": 6
    },
    {
      "Name": "AES",
      "Type": "AES",
      "Visible": true,
      "Index": 9
    },
    {
      "Name": "COAX",
      "Type": "COAX",
      "Visible": true,
      "Index": 10
    },
    {
      "Name": "TOS",
      "Type": "TOS",
      "Visible": true,
      "Index": 11
    },
    {
      "Name": "USB",
      "Type": "USB",
      "Visible": true,
      "Index": 12
    },
    {
      "Name": "Spotify",
      "Type": "Spotify",
      "Visible": true,
      "Index": 14
    },
    {
      "Name": "TidalConnect",
      "Type": "TidalConnect",
      "Visible": true,
      "Index": 17
    }
  ],
  "sourceXmlChangeCount": 336,
  "sourceVisible": [
    {
      "source": "AirPlay",
      "visible": true
    },
    {
      "source": "Bluetooth",
      "visible": true
    },
    {
      "source": "Roon Ready",
      "visible": true
    }
  ],
  "hardWareInfo": {
    "MFG": "AURALiC",
    "TYPE": "ALTAIR_G1.1",
    "SN": "48C0G5OL",
    "CORE": "1.5",
    "WIFI": "8265NGW",
    "MAIN": "15110063",
    "FW": "10.0.4",
    "MAC0": "BC:34:00:A0:71:83",
    "MAC1": "E8:84:A5:F7:7C:7C",
    "BDMAC": "E8:84:A5:F7:7C:80"
  }
}
 */
var auralicDeviceInfo = {
};

var settings = {
    volumeMax: 100,
};

css.backgroundColor = "#232629";
css.foregroundColor = "#eff0f1";
css.selectedColor = "#3daee9";
css.trackSeek = "rgba(239, 240, 241, 0.33)";

// buttonPower
// buttonMute
// buttonRepeat
// buttonShuffle
// buttonPlay
// buttonHiRes

var buttonStatus = [
    {
        svg: "loop",
        button: "buttonRepeat",
        key: "repeat",
        name: "Repeat",
        clickEnable: true,
    },
    {
        svg: "shuffle",
        button: "buttonShuffle",
        key: "shuffle",
        name: "Shuffle",
        clickEnable: true,
    },
    {
        svg: "play",
        button: "buttonPlay",
        key: "transportState",
        name: "Play",
        clickEnable: true,
    },
    {
        svg: "hi-res",
        button: "buttonHiRes",
        key: "track",
        name: "Hi-Res",
        clickEnable: false,
    },
];

var inputStatus = [
    {
        svg: "roon",
        Name: "Roon",
        Type: "Roon",
        Index: -1,
        Visible: true,
        key: 1,
    },
    {
        svg: "usb",
        Name: "USB",
        Type: "USB",
        Index: -1,
        Visible: true,
        key: 2,
    },
    {
        svg: "airplay",
        Name: "AirPlay",
        Type: "AirPlay",
        Index: -1,
        Visible: true,
        key: 3,
    },
    {
        svg: "radio",
        Name: "Radio",
        Type: "InternetRadio",
        Index: -1,
        Visible: true,
        key: 4,
    },
    {
        svg: "bluetooth",
        Name: "Bluetooth",
        Type: "Bluetooth",
        Index: -1,
        Visible: true,
        key: 5,
    },
    {
        svg: "spotify",
        Name: "Spotify",
        Type: "Spotify",
        Index: -1,
        Visible: true,
        key: 6,
    },
    {
        svg: "tidal",
        Name: "TidalConnect",
        Type: "TidalConnect",
        Index: -1,
        Visible: true,
        key: 7,
    },
];

$(document).ready(function () {
    // showPage();
    // fixFontSize();
    $("#coverBackground").css("background-image", "url('/img/ma352_0.jpg')");
    $("#coverBackground").css("z-index", "-1");
    $("#coverBackground").show();

    $("#notConnecting").show();
    $("#isConnecting").hide();

    // volumeView(30);

    // $("#buttonShuffle").html(getSVG("shuffle"));
    // $("#buttonRadio").html(getSVG("radio"));

    // $("#buttonShuffle").css("color", css.foregroundColor);
    // $("#buttonRadio").css("color", css.foregroundColor);

    $("#buttonMute")
        .html(getSVG("mute"))
        .attr(
            "onclick",
            "changeMute()"
        )
        .attr("name", "Mute")
        .attr("aria-label", "Mute")
        .attr("aria-disabled", false)
        .removeClass("buttonAvailable buttonInactive")
        .css("color", css.foregroundColor);

    $("#buttonPower")
        .html(getSVG("power"))
        .attr("onclick", "showPowerMenu()")
        .attr("name", "Power")
        .attr("aria-label", "Power")
        .attr("aria-disabled", false)
        .removeClass("buttonAvailable buttonInactive")
        .css("color", css.foregroundColor);

    $("#buttonDevice")
        .html(getSVG("device"))
        .attr("onclick", "clickDeviceButton()")
        .attr("name", "Device Control")
        .attr("aria-label", "Device Control")
        .attr("aria-disabled", false)
        .removeClass("buttonAvailable buttonInactive")
        .css("color", css.foregroundColor);

    buttonStatusInit();
    inputStatusInit();
    enableSockets();
});

function clickDeviceButton() {
    if (window.self !== window.top) {
        // window.parent.document.getElementById('deviceBrowserFrame').src = 'ma352.html';
        parent.showSection('deviceBrowser');
    } else {
        window.location.href = 'ma352.html';
    }
}

function enableSockets() {
    socket = io(undefined, {
        reconnection: true,            // 启用自动重连
        reconnectionAttempts: Infinity, // 无限次重连尝试
        reconnectionDelay: 1000,       // 每次重连之间的延迟时间（毫秒）
        reconnectionDelayMax: 1000,    // 最大延迟时间，保持和 reconnectionDelay 一致
        timeout: 10000,                // 连接超时时间（毫秒）
        query: {
            subscribes: "renderDevice",
        },
    });

    socket.on('connect', () => {
        console.log('[Auralic] Socket.io Connected to server.');
        // socket.emit("subscribe", {
        //     type: "renderDevice",
        // });
    });

    socket.on('disconnect', (reason) => {
        console.log(`[Auralic] Socket.io Disconnected from server. Reason: ${reason}`);
        // 在这里可以提示用户连接断开
    });

    socket.on('reconnect_attempt', (attempt) => {
        console.log(`[Auralic] Socket.io Reconnection attempt ${attempt}`);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`[Auralic] Socket.io Reconnected to server on attempt ${attemptNumber}`);
    });

    socket.on('reconnect_failed', () => {
        console.log('[Auralic] Socket.io Failed to reconnect to the server.');
    });

    socket.on("renderDeviceInfoList", (msg) => {
        console.log("renderDeviceInfoList: " + JSON.stringify(msg));
        updateDeviceList(msg);
    });

    socket.on("renderDeviceStatus", (msg) => {
        console.log("renderDeviceStatus: " + JSON.stringify(msg));
        console.log("curDeviceId: " + curDeviceId);
        if (msg.deviceId === curDeviceId) {
            if (JSON.stringify(auralicStatus) !== JSON.stringify(msg)) {
                onDeviceStatusChanged(msg);
            } else {
                console.log("renderDeviceStatus: " + msg.deviceId + " is same as current deviceStatus");
            }
        } else {
            console.log("renderDeviceStatus: " + msg.deviceId + " is not supported");
        }
    });
}

function onDeviceStatusChanged(msg) {
    console.log("onDeviceStatusChanged");
    onVolumeChanged(msg);
    onMuteChanged(msg);
    onPowerChanged(msg);
    onInputChanged(msg);
    onQualityChanged(msg);
    onPlayChanged(msg);

    auralicStatus = msg;
}

function updateDeviceList(msg) {
    for (const deviceInfo of msg) {
        console.log("deviceInfo: " + JSON.stringify(deviceInfo));
        if (deviceInfo.manufacturer !== "AURALIC") {
            console.log("deviceInfo: " + JSON.stringify(deviceInfo) + " is not supported");
            continue;
        }
        //find device in deviceList
        let findDevice = deviceList.find((x) => x.id === deviceInfo.id);
        if (findDevice) {
            if (JSON.stringify(findDevice) !== JSON.stringify(deviceInfo)) {
                //update device
                for (const key in deviceInfo) {
                    findDevice[key] = deviceInfo[key];
                }
            }
        } else {
            deviceList.push(deviceInfo);
            //TODO multiple device support
            curDeviceId = deviceInfo.deviceId;
            console.log("updateDeviceList: curDeviceId = " + curDeviceId);
            auralicDeviceInfo = deviceInfo;
            onDeviceInfoChanged();
            break;
        }
    }
}

function getDeviceInfoValue(key, defaultValue) {
    return getValue(auralicDeviceInfo, key, defaultValue);
}

function getStatusValue(key, defaultValue) {
    return getValue(auralicStatus, key, defaultValue);
}

//key is like 'a.b.c', defaultValue is default value if key is not found
function getValue(obj, key, defaultValue = null) {
    let keys = key.split('.');
    let value = obj;
    for (const k of keys) {
        value = value[k];
        if (value === undefined) {
            return defaultValue;
        }
    }
    return value;
}

function onConnected(deviceInfo) {
    if (deviceInfo) {
        $("#notConnecting").hide();
        $("#isConnecting").show();
    } else {
        $("#notConnecting").show();
        $("#isConnecting").hide();
    }
}

function onDeviceInfoChanged() {
    let hwInfo = auralicDeviceInfo.hardWareInfo;
    $("#deviceName").html(hwInfo.MFG + " " + hwInfo.TYPE);
    $("#deviceSerial").html('Serial Number: ' + hwInfo.SN);
    $("#deviceVersion").html('FW Version: ' + hwInfo.FW);

    let sourceList = auralicDeviceInfo.sourceList;
    if (sourceList) {
        for (const input of inputStatus) {
            let findInput = sourceList.find((x) => x.Name === input.Name);
            if (findInput) {
                input.Index = findInput.Index;
                input.Visible = findInput.Visible;
                input.Type = findInput.Type;
            }
        }
        inputStatusInit();
    }

    onConnected(auralicDeviceInfo);
}

function inputStatusInit() {
    inputStatus.forEach((input) => {
        $("#buttonInputDevice" + input.key)
            .attr("name", input.Name)
            .attr("onclick", "changeInput('" + input.Index + "','" + input.Name + "')")
            .attr("aria-label", input.Name)
            .attr("aria-disabled", false)
            .removeClass("buttonAvailable buttonInactive");
        $("#inputDeviceSvgSpan" + input.key).html(getSVG(input.svg));
        $("#inputDeviceNameSpan" + input.key).html(input.Name);
        $("#inputDeviceStatusSpan" + input.key).html(getSVG("triangle-up"));

        $("#buttonInputDevice" + input.key).css("color", css.foregroundColor);
        $("#inputDeviceStatusSpan" + input.key).css("opacity", 0.1);

        // if (input.Index === sourceIndex) {
        //     console.log("inputStatusInit: " + input.Name + " is selected");
        //     $("#buttonInputDevice" + input.key).css("color", css.selectedColor);
        //     $("#inputDeviceStatusSpan" + input.key).css("opacity", 1);
        // }
    });
}

function buttonStatusInit() {
    buttonStatus.forEach((button) => {
        $("#" + button.button)
            .html(getSVG(button.svg))
            .attr("name", button.name)
            .attr("aria-label", button.name)
            .attr("aria-disabled", false)
            .removeClass("buttonAvailable buttonInactive")
            .css("color", css.foregroundColor);
        if (button.clickEnable) {
            let key = button.key;
            $("#" + button.button).attr("onclick", "statusChange('" + key + "')");
        }
    });
}

function onPlayChanged(deviceStatus) {
    if (deviceStatus.transportState === 'Playing') {
        $("#buttonPlay").html(getSVG("play"));
        $("#buttonPlay").css("color", css.selectedColor);
    } else {
        $("#buttonPlay").html(getSVG("pause"));
        $("#buttonPlay").css("color", css.foregroundColor);
    }

    if (deviceStatus.sourceName === 'Roon') {
        let newPlay = getValue(deviceStatus, 'roon', null);
        if (newPlay.shuffle == 0) {
            $("#buttonShuffle").css("color", css.foregroundColor);
        } else {
            $("#buttonShuffle").css("color", css.selectedColor);
        }

        if (newPlay.repeat == 0) {
            $("#buttonRepeat").css("color", css.foregroundColor);
        } else {
            $("#buttonRepeat").css("color", css.selectedColor);
        }
    }
}

function onQualityChanged(deviceStatus) {
    let newQuality = getValue(deviceStatus, 'track.resource', null);
    if (newQuality) {
        let sampleFrequency = parseInt(newQuality.sampleFrequency);
        let bitsPerSample = parseInt(newQuality.bitsPerSample);
        let nrAudioChannels = parseInt(newQuality.nrAudioChannels);
        // 44100 -> 44.1kHz, 48000 -> 48kHz, 96000 -> 96kHz, 192000 -> 192kHz
        // remove 0 from the end of sampleFrequencyStr
        let sampleFrequencyStr = (sampleFrequency / 1000).toFixed(1).replace(/\.0$/, '') + "kHz";
        let bitsPerSampleStr = bitsPerSample + "bit";
        let nrAudioChannelsStr = nrAudioChannels + "ch";
        if (bitsPerSample == 1) {
            sampleFrequencyStr = (sampleFrequency / 1000 / 1000) + "MHz";
            $('#buttonHiRes').html(getSVG("hi-dsd"));
            $("#qualityTypeSpan").html("DSD");
            $('#buttonHiRes').css("color", css.selectedColor);
        } else if (sampleFrequency == 44100 && bitsPerSample == 16 && nrAudioChannels == 2) {
            $("#qualityTypeSpan").html("CD");
            $('#buttonHiRes').html(getSVG("hi-cd"));
            $('#buttonHiRes').css("color", css.selectedColor);
        } else if (nrAudioChannels >= 2 && (bitsPerSample > 16 || sampleFrequency == 44100)) {
            $("#qualityTypeSpan").html("Hi-Res");
            $('#buttonHiRes').html(getSVG("hi-res"));
            $('#buttonHiRes').css("color", css.selectedColor);
        } else {
            $("#qualityTypeSpan").html("Low");
            $('#buttonHiRes').html(getSVG("hi-cd"));
            $('#buttonHiRes').css("color", css.foregroundColor);
        }
        $("#qualityValueSpan").html(sampleFrequencyStr + "&nbsp;/&nbsp;" + bitsPerSampleStr + "&nbsp;&nbsp;" + nrAudioChannelsStr);
    } else {
        $("#qualityTypeSpan").html("High");
        $("#qualityValueSpan").html("44.1kHz&nbsp;/&nbsp;16bit&nbsp;&nbsp;2ch");
    }
}

function onInputChanged(deviceStatus) {
    let newInput = getValue(deviceStatus, 'sourceIndex', null);
    let oldInput = getStatusValue('sourceIndex', null);
    if (oldInput !== newInput) {
        console.log("onInputChanged: " + newInput);
        for (const input of inputStatus) {
            if (input.Index == newInput) {
                $("#buttonInputDevice" + input.key).css("color", css.selectedColor);
                $("#inputDeviceStatusSpan" + input.key).css("opacity", 1);
            } else {
                $("#buttonInputDevice" + input.key).css("color", css.foregroundColor);
                $("#inputDeviceStatusSpan" + input.key).css("opacity", 0.1);
            }
        }
    }
}

function onMuteChanged(deviceStatus) {
    let newMute = getValue(deviceStatus, 'volume.mute', null);
    let oldMute = getStatusValue('volume.mute', null);
    if (oldMute !== newMute) {
        console.log("onMuteChanged: " + newMute);
        let mute = newMute == 1 ? true : false;
        if (mute) {
            $("#buttonMute").css("color", "#ee0000");
        } else {
            $("#buttonMute").css("color", css.foregroundColor);
        }
    }
}

function onPowerChanged(deviceStatus) {
    let newPower = getValue(deviceStatus, 'standby', null);
    let oldPower = getStatusValue('standby', null);
    if (oldPower !== newPower) {
        console.log("onPowerChanged: " + newPower);
        let power = newPower == 1 ? true : false;
        if (power) {
            $("#buttonPower").css("color", css.selectedColor);
        } else {
            $("#buttonPower").css("color", css.foregroundColor);
        }
    }
}

function showPowerMenu() {
    if (getStatusValue('standby', null) == 1) {
        $("#overlayPowerButton")
            .html("Power Off")
            .attr("name", "Power Off")
            .attr("aria-label", "Power Off")
            .attr("onclick", "powerOff()");

    } else {
        $("#overlayPowerButton")
            .html("Power On")
            .attr("name", "Power On")
            .attr("aria-label", "Power On")
            .attr("onclick", "powerOn()");
    }
    $("#overlayPowerMenu").show()
}

function powerOn() {
    console.log("Power On");
    $("#overlayPowerMenu").hide();
    var msg = {
        deviceId: auralicStatus.deviceId,
        power: "on",
    }
    // if (socket) {
    //     socket.emit("webRenderDevicePowerOn", msg);
    // }
}

function powerOff() {
    console.log("Power Off");
    $("#overlayPowerMenu").hide();

    var msg = {
        deviceId: auralicStatus.deviceId,
        power: "off",
    }

    // if (socket) {
    //     socket.emit("webRenderDevicePowerOff", msg);
    // }
}

function changeMute() {
    let mute = parseInt(getStatusValue('volume.mute', 0));
    let how = mute ? 'unmute' : 'mute';
    console.log("changeMute: " + how);
    var msg = {
        deviceId: auralicStatus.deviceId,
        how: how,
    }
    if (socket) {
        socket.emit("webRenderDeviceChangeMute", msg);
    }
}

function changeInput(input, name) {
    console.log("changeInput: " + input + ", Name: " + name);
    let inputIntVal = parseInt(input);
    //find input in inputStatus
    let inputObj = inputStatus.find((x) => x.Index == inputIntVal);
    if (!inputObj) {
        console.log("changeInput: " + input + " is invalid");
        return;
    }
    let oldInput = parseInt(getStatusValue('sourceIndex', -1));
    if (inputIntVal === oldInput) {
        console.log("changeInput: " + input + " is same as current input: " + oldInput);
        return;
    }
    var msg = {
        deviceId: auralicStatus.deviceId,
        input: input,
    }
    if (socket) {
        socket.emit("webRenderDeviceChangeInput", msg);
    }
}

function statusChange(key, value) {
    console.log("statusChange: " + key);
    var msg = {
        deviceId: auralicStatus.deviceId,
        key: key,
        value: value,
    }
    if (socket) {
        socket.emit("webRenderDeviceStatusChange", msg);
    }
}

function volumeButtonDown(spanId) {
    if (auralicStatus.standby != 1) {
        console.log("volumeButtonDown: Power is off");
        return;
    }
    let oldValue = $("#" + spanId + "").text();
    let newValue = parseInt(oldValue) - 1;
    if (newValue < 0) {
        newValue = 0;
    }
    $("#volumeSliderInput").val(newValue);
    $("#" + spanId + "").html(newValue);

    if (newValue === parseInt(oldValue)) {
        // console.log("volumeInput: " + value + " is same as oldValue: " + oldValue);
        return;
    }
    console.log("volumeButtonDown: " + newValue);
    var msg = {
        deviceId: auralicStatus.deviceId,
        volume: newValue,
    }

    if (socket) {
        socket.emit("webRenderDeviceChangeVolumeDown", msg);
    }
}

function volumeButtonUp(spanId) {
    if (auralicStatus.standby != 1) {
        console.log("volumeButtonUp: Power is off");
        return;
    }
    let oldValue = $("#" + spanId + "").text();
    let newValue = parseInt(oldValue) + 1;
    if (newValue > settings.volumeMax) {
        newValue = settings.volumeMax;
    }
    console.log("volumeButtonUp: " + newValue);
    $("#volumeSliderInput").val(newValue);
    $("#" + spanId + "").html(newValue);

    if (newValue === parseInt(oldValue)) {
        // console.log("volumeInput: " + value + " is same as oldValue: " + oldValue);
        return;
    }

    var msg = {
        deviceId: auralicStatus.deviceId,
        volume: newValue,
    }

    if (socket) {
        socket.emit("webRenderDeviceChangeVolumeUp", msg);
    }
}

function volumeInput(spanId, value) {
    console.log("volumeInput: " + value);
    let oldValue = $("#" + spanId + "").text();
    if (auralicStatus.standby != 1) {
        console.log("volumeInput: Power is off");
        volumeView(oldValue);
        return;
    }
    inVolumeSlider = true;
    let newValue = parseInt(value);
    if (newValue > settings.volumeMax) {
        newValue = settings.volumeMax;
        $("#volumeSliderInput").val(newValue);
    }
    if (newValue === parseInt(oldValue)) {
        // console.log("volumeInput: " + value + " is same as oldValue: " + oldValue);
        return;
    }
    $("#volumeSliderInput").val(newValue);
    $("#" + spanId + "").html(newValue);

    var msg = {
        deviceId: auralicStatus.deviceId,
        volume: newValue,
    }

    if (socket) {
        socket.emit("webRenderDeviceChangeVolume", msg);
    }
}

function volumeChange(id, value) {
    console.log("volumeChange: " + value);
    inVolumeSlider = false;
}

function volumeView(value) {
    $("#volumeSliderInput").val(value);
    $("#volumeValueSpan").html(value);
}

function onVolumeChanged(deivceStatus) {
    let newVolume = getValue(deivceStatus, 'volume.volume', null);
    let oldVolume = getStatusValue('volume.volume', null);
    if (oldVolume !== newVolume) {
        console.log("onVolumeChanged: " + newVolume);
        if (inVolumeSlider) {
            console.log("volume slider is changing, ignore onVolumeChanged: " + newVolume);
            return;
        }
        let val = parseInt(newVolume);
        if (val < 0 || val > 100) {
            console.log("onVolumeChanged: " + val + " is invalid, must be between 0 and 100");
            return;
        }
        volumeView(val);
    }
}

function getSVG(cmd) {
    // console.log("getSVG: " + cmd);
    switch (cmd) {
        case "play":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 7.99939,5.13684L 7.99939,19.1368L 18.9994,12.1368L 7.99939,5.13684 Z "/></svg>';
        case "pause":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 14,19L 18,19L 18,4.99999L 14,4.99999M 6,19L 10,19L 10,4.99999L 6,4.99999L 6,19 Z "/></svg>';
        case "stop":
            return '<svg viewBox="0 0 24.00 24.00"><path d="M 18,18L 6,18L 5.99988,6.00011L 18,5.99999L 18,18 Z "/></svg>';
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
        case "power":
            return '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="none">  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>  <g id="SVGRepo_iconCarrier">    <g>      <path class="st0" d="M423.262,91.992c-16.877-15.91-43.434-15.098-59.32,1.778c-15.894,16.877-15.098,43.434,1.779,59.32 c32.082,30.213,49.754,71.238,49.754,115.5c0,87.934-71.541,159.476-159.476,159.476S96.525,356.524,96.525,268.59 c0-44.262,17.668-85.287,49.754-115.5c16.877-15.885,17.672-42.442,1.779-59.32c-15.885-16.885-42.455-17.688-59.32-1.778 C40.344,137.557,12.59,201.926,12.59,268.59C12.59,402.803,121.783,512,256,512c134.213,0,243.41-109.197,243.41-243.41 C499.41,201.926,471.656,137.557,423.262,91.992z"></path>      <path class="st0" d="M256,268.59c23.178,0,41.967-15.033,41.967-33.574V33.574C297.967,15.033,279.178,0,256,0 c-23.178,0-41.967,15.033-41.967,33.574v201.443C214.033,253.557,232.822,268.59,256,268.59z"></path>    </g>  </g></svg>';
        case "power2":
            return '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g><g><path d="M366.463,172.539c-8.552-9.595-23.262-10.439-32.858-1.885c-9.595,8.552-10.439,23.263-1.885,32.858c16.561,18.578,25.681,42.532,25.682,67.449c0,55.913-45.489,101.402-101.402,101.402s-101.402-45.489-101.402-101.402c0-24.919,9.12-48.873,25.682-67.449c8.554-9.595,7.709-24.306-1.885-32.86c-9.595-8.552-24.306-7.708-32.86,1.885c-24.171,27.114-37.485,62.068-37.485,98.423C108.052,352.54,174.421,418.909,256,418.909S403.948,352.54,403.948,270.96C403.946,234.606,390.634,199.652,366.463,172.539z"></path></g></g><g><g><path d="M256,93.091c-12.853,0-23.273,10.42-23.273,23.273v99.739c0,12.853,10.42,23.273,23.273,23.273c12.853,0,23.273-10.42,23.273-23.273v-99.739C279.273,103.511,268.853,93.091,256,93.091z"></path></g></g><g><g><path d="M256,0C114.842,0,0,114.842,0,256s114.842,256,256,256s256-114.842,256-256S397.158,0,256,0zM256,465.455c-115.495,0-209.455-93.961-209.455-209.455S140.505,46.545,256,46.545S465.455,140.507,465.455,256S371.493,465.455,256,465.455z"></path></g></g></g></svg>';
        case "phono":
            return '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M180,120v-10H60v10H25L146,18c4-4,5-10,1-14c-4-4-10-5-14-1L3,113c-2,1-3,4-3,7l0,0v39c0,13,8,24,20,28v12h20v-10h120v10h20v-12c12-4,20-15,20-28v-39C200,120,180,120,180,120z"></path></g></svg>';
        case "xlr":
            return '<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g fill-rule="evenodd"><path d="M128 220c-50.81 0-92-41.19-92-92 0-34.045 18.492-63.77 45.98-79.68 26.471 0 69.646.367 92.67.367C201.79 64.685 220 94.216 220 128c0 50.81-41.19 92-92 92zm0-15c42.526 0 77-34.474 77-77 0-26.467-13.353-49.815-33.69-63.675-21.734 0-65.127-.18-86.353-.18C64.47 77.98 51 101.418 51 128c0 42.526 34.474 77 77 77z"></path><circle cx="128" cy="176" r="16"></circle><circle cx="176" cy="134" r="16"></circle><circle cx="80" cy="135" r="16"></circle></g></g></svg>';
        case "triangle-up":
            return '<svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><rect width="16" height="16" id="icon-bound" fill="none"></rect><polygon points="8,3 16,11 0,11"></polygon></g></svg>';
        case "rca":
            return '<svg viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M 8.0178672,12.4507 C 7.8973281,12.89624 7.4419844,13 7,13 6.5580391,13 6.1026719,12.89624 5.9821562,12.4507 5.8029766,11.78439 5.5,10.1148 5.5,9.33789 5.5,8.51392 6.2298906,8.3125 7,8.3125 c 0.7701094,0 1.5,0.20142 1.5,1.02539 0,0.77224 -0.3016641,2.4417 -0.4821328,3.11281 z M 5.4265703,7.76298 C 4.9884531,7.33389 4.7244297,6.72768 4.7519453,6.06145 4.8000863,4.89604 5.7455781,3.9531 6.9111016,3.90798 8.1920781,3.85839 9.25,4.8861 9.25,6.15625 c 0,0.62876 -0.2593125,1.19803 -0.6765469,1.60669 -0.062695,0.0614 -0.056273,0.16373 0.014719,0.21532 0.21825,0.15855 0.3857812,0.3596 0.4976718,0.59444 0.040805,0.0856 0.1522735,0.10922 0.221461,0.0443 C 9.9829143,7.98318 10.398391,7.07521 10.373969,6.07251 10.330492,4.28643 8.8834611,2.83326 7.0975705,2.78261 5.1922424,2.72861 3.6250002,4.26283 3.6250002,6.15623 c 0,0.9694 0.4109063,1.84453 1.0675781,2.46068 0.069211,0.0649 0.1807266,0.0415 0.2215547,-0.0442 C 5.0260236,8.33785 5.1935783,8.13682 5.4118283,7.97827 5.4828203,7.92667 5.4892653,7.82438 5.4265703,7.76299 Z M 7,1 C 4.0985312,1 1.75,3.34809 1.75,6.25 c 0,2.10919 1.2328594,3.88235 2.9470078,4.7205 0.1015547,0.0496 0.2171953,-0.0362 0.2000391,-0.14789 -0.055828,-0.36356 -0.1017657,-0.7253 -0.1267031,-1.0392 -0.00342,-0.043 -0.02693,-0.0817 -0.062766,-0.10575 C 3.5966403,8.93221 2.8662341,7.66166 2.87507,6.22422 2.888945,3.96866 4.7334294,2.13091 6.9890309,2.12502 9.2685859,2.11902 11.125,3.9718 11.125,6.25 c 0,1.45153 -0.753703,2.73023 -1.8902344,3.46563 -0.023414,0.32899 -0.07193,0.71691 -0.1318125,1.10696 -0.017156,0.11172 0.098508,0.19755 0.2000391,0.14789 C 11.013133,10.13423 12.25,8.36376 12.25,6.25 12.25,3.34855 9.9019141,1 7,1 Z m 0,3.75 c -0.8284219,0 -1.5,0.67158 -1.5,1.5 0,0.82842 0.6715781,1.5 1.5,1.5 0.8284219,0 1.5,-0.67158 1.5,-1.5 C 8.5,5.42158 7.8284219,4.75 7,4.75 Z"></path></g></svg>';
        case "tube2":
            return '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g><path d="M8 0a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1A.75.75 0 018 0zM13.28 2.22a.75.75 0 010 1.06l-.707.707a.75.75 0 11-1.06-1.06l.707-.707a.75.75 0 011.06 0zM2.72 3.28a.75.75 0 011.06-1.06l.707.707a.75.75 0 01-1.06 1.06L2.72 3.28zM15.5 7.5a.75.75 0 01-.75.75h-1a.75.75 0 010-1.5h1a.75.75 0 01.75.75zM2.25 8.25a.75.75 0 000-1.5h-1a.75.75 0 000 1.5h1zM6.25 15.25A.75.75 0 017 14.5h2A.75.75 0 019 16H7a.75.75 0 01-.75-.75z"></path><path fill-rule="evenodd" d="M8 3.5A4.5 4.5 0 003.5 8c0 1.53.926 2.465 1.718 3.264l.2.203c.05.05.081.124.081.208.001 1.008.818 1.825 1.826 1.825H8.69c1 0 1.811-.81 1.811-1.81 0-.083.033-.159.088-.213l.067-.066C11.492 10.592 12.5 9.605 12.5 8A4.5 4.5 0 008 3.5zM5 8a3 3 0 016 0c0 .928-.54 1.502-1.462 2.406-.347.34-.538.803-.538 1.283a.31.31 0 01-.31.311H7.324A.326.326 0 017 11.674c0-.461-.175-.914-.507-1.255l-.115-.117C5.49 9.397 5 8.894 5 8z" clip-rule="evenodd"></path></g></g></svg>';
        //https://www.svgrepo.com/svg/305409/bulb-outline?edit=true
        case "tube":
            return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g data-name="Layer 2"><g data-name="bulb"><rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"></rect><path d="M12 7a5 5 0 0 0-3 9v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a5 5 0 0 0-3-9zm1.5 7.59a1 1 0 0 0-.5.87V20h-2v-4.54a1 1 0 0 0-.5-.87A3 3 0 0 1 9 12a3 3 0 0 1 6 0 3 3 0 0 1-1.5 2.59z"></path><path d="M12 6a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1z"></path><path d="M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z"></path><path d="M5 11H3a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z"></path><path d="M7.66 6.42L6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.06-1.41z"></path><path d="M19.19 5.05a1 1 0 0 0-1.41 0l-1.44 1.37a1 1 0 0 0 0 1.41 1 1 0 0 0 .72.31 1 1 0 0 0 .69-.28l1.44-1.39a1 1 0 0 0 0-1.42z"></path></g></g></g></svg>';
        case "equalizer":
            return '<svg viewBox="-1 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"><g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-365.000000, -571.000000)" fill="currentColor"><path d="M376,582.578 L376,597 C376,598.104 376.896,599 378,599 C379.104,599 380,598.104 380,597 L380,582.578 C379.387,582.847 378.712,583 378,583 C377.288,583 376.613,582.847 376,582.578 L376,582.578 Z M378,575 C376.343,575 375,576.343 375,578 C375,579.657 376.343,581 378,581 C379.657,581 381,579.657 381,578 C381,576.343 379.657,575 378,575 L378,575 Z M386,596.578 L386,597 C386,598.104 386.896,599 388,599 C389.104,599 390,598.104 390,597 L390,596.578 C389.387,596.847 388.712,597 388,597 C387.288,597 386.613,596.847 386,596.578 L386,596.578 Z M368,585 C366.343,585 365,586.343 365,588 C365,589.657 366.343,591 368,591 C369.657,591 371,589.657 371,588 C371,586.343 369.657,585 368,585 L368,585 Z M370,583.422 L370,573 C370,571.896 369.104,571 368,571 C366.896,571 366,571.896 366,573 L366,583.422 C366.613,583.154 367.288,583 368,583 C368.712,583 369.387,583.154 370,583.422 L370,583.422 Z M390,587.422 L390,573 C390,571.896 389.104,571 388,571 C386.896,571 386,571.896 386,573 L386,587.422 C386.613,587.153 387.288,587 388,587 C388.712,587 389.387,587.153 390,587.422 L390,587.422 Z M380,573.422 L380,573 C380,571.896 379.104,571 378,571 C376.896,571 376,571.896 376,573 L376,573.422 C376.613,573.153 377.288,573 378,573 C378.712,573 379.387,573.153 380,573.422 L380,573.422 Z M366,592.578 L366,597 C366,598.104 366.896,599 368,599 C369.104,599 370,598.104 370,597 L370,592.578 C369.387,592.847 368.712,593 368,593 C367.288,593 366.613,592.847 366,592.578 L366,592.578 Z M388,589 C386.343,589 385,590.343 385,592 C385,593.657 386.343,595 388,595 C389.657,595 391,593.657 391,592 C391,590.343 389.657,589 388,589 L388,589 Z" id="equalizer" sketch:type="MSShapeGroup"></path></g></g></g></svg>';
        case 'roon':
            return '<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300.000000pt" height="300.000000pt" viewBox="0 0 300.000000 300.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" stroke="none"><path d="M0 1500 l0 -1500 1500 0 1500 0 0 1500 0 1500 -1500 0 -1500 0 0 -1500z m1500 0 l0 -840 -54 0 c-78 0 -230 42 -323 88 -207 104 -360 288 -433 517 -30 94 -39 299 -17 401 29 137 98 278 189 385 135 160 385 284 581 288 l57 1 0 -840z m190 0 l0 -740 -40 0 -40 0 0 740 0 740 40 0 40 0 0 -740z m340 0 l0 -530 -40 0 -40 0 0 530 0 530 40 0 40 0 0 -530z m-165 0 l0 -315 -42 -3 -43 -3 0 321 0 321 43 -3 42 -3 0 -315z m335 0 l0 -110 -40 0 -40 0 0 110 0 110 40 0 40 0 0 -110z"/></g></svg>';
        case 'usb':
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path style="opacity:.87000002;fill:currentColor;fill-opacity:1;stroke:none;stroke-width:.5;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="m15 3-3 4h2v12l-4-4v-1.021a2 2 0 0 0 1-1.729 2 2 0 1 0-3 1.73v1.848l6 6v1.443A2 2 0 0 0 13 25a2 2 0 0 0 4 0c0-.704-.374-1.35-.977-1.71L16 22v-1l6-6.172V13h1V9h-4v4h1v1l-4 4.127V7h2z"/></svg>';
        case 'bluetooth':
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path style="color:currentColor;font-style:normal;font-variant:normal;font-weight:400;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-feature-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:currentColor;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;opacity:1;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:currentColor;solid-opacity:1;vector-effect:none;fill:currentColor;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:2;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto" d="M11.005 292.064v9.591l-5.623-5.623c-.502 1.107-.31 2.465.594 3.37l3.955 3.954.67.71-.67.703-3.955 3.955c-.905.904-1.096 2.262-.594 3.369l5.623-5.623v9.591l2.047-2.214v-.002l2.976-2.977a3.015 3.015 0 0 0 0-4.242l-1.855-1.857s-.514-.464-.762-.706l.762-.707 1.855-1.857a3.015 3.015 0 0 0 0-4.242l-2.976-2.977v-.002zm2.047 5.044 1.562 1.563a.976.976 0 0 1 0 1.414l-1.562 1.564v-.025zm0 9.368 1.562 1.564a.976.976 0 0 1 0 1.414l-1.562 1.563V306.5z" transform="translate(0 -289.063)"/><path style="fill:currentColor;fill-opacity:1;stroke:none;stroke-width:2;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="m22.391 296.535-1.404 1.404a6.98 6.98 0 0 1 2.045 4.956 6.98 6.98 0 0 1-2.045 4.955l1.404 1.404a8.97 8.97 0 0 0 2.64-6.36 8.97 8.97 0 0 0-2.64-6.359m-2.121 2.121-1.406 1.406a4 4 0 0 1 1.168 2.833c0 1.11-.446 2.11-1.168 2.832l1.406 1.406a5.98 5.98 0 0 0 0-8.477" transform="translate(0 -289.063)"/></svg>';
        case 'airplay':
            return '<svg viewBox="0 -2.5 29 29" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path d="M7.076 24v-.007a1.201 1.201 0 0 1-.701-2.066l.001-.001 7.076-8.262a1.2 1.2 0 0 1 1.896-.003l.002.003 7.076 8.261a1.2 1.2 0 0 1-.695 2.067h-.005v.007zm14.35-6-2.057-2.4h7.025V2.4H2.4v13.2h7.024L7.367 18H2.4A2.4 2.4 0 0 1 0 15.6V2.401a2.4 2.4 0 0 1 2.4-2.4h23.999a2.4 2.4 0 0 1 2.4 2.4V15.6a2.4 2.4 0 0 1-2.4 2.4z"/></svg>';
        case 'spotify':
            return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path d="M15.915 8.865c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 0 1-.543-1.79c3.533-1.073 9.405-.866 13.116 1.337a.936.936 0 0 1-.955 1.609M15.81 11.7a.78.78 0 0 1-1.073.257c-2.687-1.652-6.785-2.13-9.964-1.165A.78.78 0 0 1 4.32 9.3c3.631-1.102 8.146-.568 11.233 1.329a.78.78 0 0 1 .257 1.071m-1.224 2.723a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.759-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.871 7.076-.496 9.712 1.115.294.18.387.563.207.857M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523.001 10 .001z" fill-rule="evenodd"/></svg>';
        case 'tidal':
            return '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path d="m16.016 5.323-5.339 5.339-5.339-5.339-5.339 5.339 5.339 5.339 5.339-5.339 5.339 5.339-5.339 5.339 5.339 5.339 5.339-5.339-5.339-5.339 5.339-5.339zm5.375 5.338 5.302-5.307L32 10.661l-5.307 5.307z"/></svg>';
        case 'hi-res':
            return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path d="M3 7v6a1 1 0 0 0 2 0v-2h2v2a1 1 0 0 0 2 0V7a1 1 0 0 0-2 0v2H5V7a1 1 0 0 0-2 0m12 1.5a.5.5 0 0 0-.5-.5H13v4h1.5c.275 0 .5-.225.5-.5zm.395 5.5H12a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.395C16.282 6 17 6.718 17 7.605v4.79c0 .887-.718 1.605-1.605 1.605M2 0a2 2 0 0 0-2 2v1a1 1 0 0 0 2 0 1 1 0 0 1 1-1h14a1 1 0 0 1 1 1 1 1 0 0 0 2 0V2a2 2 0 0 0-2-2zm16 17a1 1 0 0 1 2 0v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-1a1 1 0 0 1 2 0 1 1 0 0 0 1 1h14a1 1 0 0 0 1-1" fill-rule="evenodd"/></svg>';
        case 'hi-cd':
            return '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#a)"><path d="M18.008 1.133A15 15 0 0 0 16 1C7.716 1 1 7.716 1 16s6.716 15 15 15 15-6.716 15-15m0-5V1L21 3v10m10-2a2 2 0 1 0-4.001.001A2 2 0 0 0 31 11m-10 2a2 2 0 1 0-4.001.001A2 2 0 0 0 21 13m-6.946-1.606a5.001 5.001 0 1 0 6.515 6.64M8 8l2 2m14 14-2-2" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath id="a"><path d="M0 0h32v32H0z"/></clipPath></defs></svg>';
        case 'hi-dsd':
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420"><path d="M286.663 242.562c0-44.581-14-68.181-40.816-68.181-8.685 0-13.201 3.38-13.634 14.568-1.406 36.714-1.406 82.701 0 115.487.433 9.946 3.61 14.712 13.634 14.712 26.99 0 40.816-25.824 40.816-76.586l34.201 3.206c0 57.618-30.956 85.118-82.556 85.118h-40.672c3.283-41.384 4.342-124.153 0-168.55h40.18c46.401 0 83.048 14.433 83.048 83.432zm273.773 0c0-44.581-13.99-68.181-40.806-68.181-8.685 0-13.23 3.38-13.654 14.568-1.396 36.714-1.396 82.701 0 115.487.424 9.946 3.65 14.712 13.654 14.712 26.989 0 40.806-25.824 40.806-76.586l34.211 3.206c0 57.618-30.956 85.118-82.557 85.118h-40.662c3.293-41.384 4.324-124.153 0-168.55h40.152c46.41 0 83.067 14.433 83.067 83.432zM341.104 196.71c0 51.234 96.816 49.462 96.816 94.573.016 27.105-14.616 42.607-50.897 42.607-25.699 0-41.24-5.296-50.252-8.964v-34.307c0-2.86 1.81-2.918 3.225-.309 9.494 17.823 25.362 32.391 42.877 32.391 18.94 0 27.76-10.774 27.76-27.114 0-35.867-74.344-36.29-74.344-87.862 0-3.861.944-9.956 1.29-11.256.704-2.706 3.525-2.532 3.525.24" style="fill:currentColor;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(-185 -29)"/><path d="M451.92 269.32c0-49.27-76.683-50.262-76.683-81.46 0-13.267 11.786-17.812 25.844-17.812 17.65 0 31.534 11.535 39.43 24.438 1.675 2.022 3.476 1.771 3.476-1.233v-26.7c-6.144-2.668-23.62-8.29-41.857-8.29-30.426 0-53.487 9.137-53.487 32.284 0 45.602 97.664 44.793 97.664 92.012 0 4.353-.25 6.375-.53 8.782-.24 2.407 2.524 3.322 3.448.52 1.57-4.728 2.696-11.747 2.696-22.541" style="fill:currentColor;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(-185 -29)"/></svg>';
        case "device":
            return '<svg viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g id="layer1"><path d="M 1 6 L 0 7 L 0 14 L 1 15 L 19 15 L 20 14 L 20 7 L 19 6 L 9.5 6 L 10.5 7 L 18.5 7 L 19 7.5 L 19 13.5 L 18.5 14 L 1.5 14 L 1 13.5 L 1 7.5 L 1.5 7 L 2.5 7 L 3.5 6 L 1 6 z M 6.5 6 C 4.5729257 6 3 7.5729257 3 9.5 C 3 11.427074 4.5729257 13 6.5 13 C 8.4270743 13 10 11.427074 10 9.5 C 10 7.5729257 8.4270743 6 6.5 6 z M 6.5 7 C 7.8866342 7 9 8.1133658 9 9.5 C 9 10.886634 7.8866342 12 6.5 12 C 5.1133658 12 4 10.886634 4 9.5 C 4 8.1133658 5.1133658 7 6.5 7 z M 13 8 L 13 9 L 17 9 L 17 8 L 13 8 z M 13 10 L 13 11 L 17 11 L 17 10 L 13 10 z M 13 12 L 13 13 L 17 13 L 17 12 L 13 12 z"></path></g></g></svg>';
        default:
            break;
    }
}
