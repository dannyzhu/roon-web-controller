"use strict";

var curZone;
var css = [];
var state = [];
var inVolumeSlider = false;
var socket;

var ma352status = {
    name: "Unknown",
    serialNumber: "Unknown",
    firmwareVersion: "Unknown",
    connected: false,
    mute: false,
    power: false,
    mute: false,
    volume: 0,
    input: -1,
    others: {},
};

var settings = {
    volumeMax: 70,
};

css.backgroundColor = "#232629";
css.foregroundColor = "#eff0f1";
css.selectedColor = "#3daee9";
css.trackSeek = "rgba(239, 240, 241, 0.33)";

var buttonStatus = [
    {
        svg: "equalizer",
        button: "buttonEqualizer",
        key: "TEQ",
        name: "Equalizer",
        clickEnable: true,
    },
    // {
    //     svg: "stereo",
    //     button: "buttonStereo",
    //     key: "TMO",
    //     name: "Mono / Stereo",
    //     clickEnable: true,
    // },
    {
        svg: "gauge",
        button: "buttonGauge",
        key: "TML",
        name: "Meter Light",
        clickEnable: true,
    },
    {
        svg: "tube",
        button: "buttonTube",
        key: "TTL",
        name: "Tube Light",
        clickEnable: true,
    },
    // {
    //     svg: "op1",
    //     button: "buttonOp1",
    //     key: "OP1",
    // },
    // {
    //     svg: "op2",
    //     button: "buttonOp2",
    //     key: "OP2",
    // }
];

var inputStatus = [
    {
        svg: "xlr",
        name: "XLR 1",
        key: 1,
    },
    {
        svg: "xlr",
        name: "XLR 2",
        key: 2,
    },
    {
        svg: "rca",
        name: "RCA 1",
        key: 3,
    },
    {
        svg: "rca",
        name: "RCA 2",
        key: 4,
    },
    {
        svg: "rca",
        name: "RCA 3",
        key: 5,
    },
    {
        svg: "phono",
        name: "Phono",
        key: 6,
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

    $("#buttonEqualizer").html(getSVG("settings"));
    $("#buttonShuffle").html(getSVG("shuffle"));
    $("#buttonRadio").html(getSVG("radio"));

    $("#buttonEqualizer").css("color", css.foregroundColor);
    $("#buttonShuffle").css("color", css.foregroundColor);
    $("#buttonRadio").css("color", css.foregroundColor);

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

    // Input Devices
    // $("#buttonInputDevice1")
    //     .attr("name", "Input Device 1")
    //     .attr("aria-label", "Input Device 1")
    //     .attr("aria-disabled", false)
    //     .removeClass("buttonAvailable buttonInactive")
    //     .css("color", css.foregroundColor);
    // $("#inputDeviceSvgSpan1").html(getSVG("phono"));
    // $("#inputDeviceNameSpan1").html("Phono");
    // $("#inputDeviceStatusSpan1").html(getSVG("triangle-up"));

    // $("#buttonInputDevice2")
    //     .attr("name", "Input Device 2")
    //     .attr("aria-label", "Input Device 2")
    //     .attr("aria-disabled", false)
    //     .removeClass("buttonAvailable buttonInactive")
    //     .css("color", css.foregroundColor);
    // $("#inputDeviceSvgSpan2").html(getSVG("xlr"));
    // $("#inputDeviceNameSpan2").html("XLR 1");
    // $("#inputDeviceStatusSpan2").html(getSVG("triangle-up"));


    // $("#buttonInputDevice3")
    //     .attr("name", "Input Device 3")
    //     .attr("aria-label", "Input Device 3")
    //     .attr("aria-disabled", false)
    //     .removeClass("buttonAvailable buttonInactive")
    //     .css("color", css.foregroundColor);
    // $("#inputDeviceSvgSpan3").html(getSVG("xlr"));
    // $("#inputDeviceNameSpan3").html("XLR 2");
    // $("#inputDeviceStatusSpan3").html(getSVG("triangle-up"));

    buttonStatusInit();
    inputStatusInit();
    enableSockets();
});

function clickDeviceButton() {
    if (window.self !== window.top) {
        // window.parent.document.getElementById('deviceBrowserFrame').src = 'auralic.html';
        parent.showSection('renderDeviceBrowser');
    } else {
        window.location.href = 'auralic.html';
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
            subscribes: "mcIntosh",
        },
    });

    socket.on('connect', () => {
        console.log('[McIntosh MA352] Socket.io Connected to server.');
        // socket.emit("subscribe", {
        //     type: "mcIntosh",
        // });
    });

    socket.on('disconnect', (reason) => {
        console.log(`[McIntosh MA352] Socket.io Disconnected from server. Reason: ${reason}`);
        // 在这里可以提示用户连接断开
    });

    socket.on('reconnect_attempt', (attempt) => {
        console.log(`[McIntosh MA352] Socket.io Reconnection attempt ${attempt}`);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`[McIntosh MA352] Socket.io Reconnected to server on attempt ${attemptNumber}`);
    });

    socket.on('reconnect_failed', () => {
        console.log('[McIntosh MA352] Socket.io Failed to reconnect to the server.');
    });

    socket.on("deviceCurrentStatus", (msg) => {
        console.log("deviceCurrentStatus: " + JSON.stringify(msg));
        if (msg.device_id === "MA352") {
            if (msg.status) {
                onConnected(msg.status.connected);
                onPowerChanged(msg.status.power);
                onMuteChanged(msg.status.mute);
                onInputChanged(msg.status.input);
                onVolumeChanged(msg.status.volume);
                if (msg.status.name) {
                    onNameChanged(msg.status.name);
                }
                if (msg.status.SerialNumber) {
                    onSerialNumberChanged(msg.status.SerialNumber);
                }
                if (msg.status.FWVersion) {
                    onFirmwareVersionChanged(msg.status.FWVersion);
                }
                if (msg.status.others) {
                    for (const [key, value] of Object.entries(msg.status.others)) {
                        onButtonStatusChange(key, value);
                    }
                }
            } else {
                console.log("deviceCurrentStatus: " + msg.device_id + " status is null");
            }
        } else {
            console.log("deviceCurrentStatus: " + msg.device_id + " is not supported");
        }
    });

    socket.on("deviceStatusChanged", (msg) => {
        console.log("deviceStatusChanged: " + JSON.stringify(msg));
        if (msg.key === "input") {
            onInputChanged(msg.value);
        } else if (msg.key === "volume") {
            onVolumeChanged(msg.value);
        } else if (msg.key === "mute") {
            onMuteChanged(msg.value ? true : false);
        } else if (msg.key === "power") {
            onPowerChanged(msg.value === 'on' ? true : false);
        } else if (msg.key === "connected") {
            onConnected(msg.value);
        } else if (msg.key === "error") {
            console.log("device error: " + msg.value);
        } else {
            onButtonStatusChange(msg.key, msg.value);
        }
    });
}

function onConnected(connected) {
    console.log("onConnected: " + connected);
    ma352status.connected = connected ? true : false;
    if (ma352status.connected) {
        $("#notConnecting").hide();
        $("#isConnecting").show();
    } else {
        $("#notConnecting").show();
        $("#isConnecting").hide();
    }
}

function onNameChanged(name) {
    console.log("onNameChanged: " + name);
    ma352status.name = name;
    $("#deviceName").html("McIntosh " + name);
}

function onSerialNumberChanged(sn) {
    console.log("onSerialNumberChanged: " + sn);
    ma352status.serialNumber = sn;
    $("#deviceSerial").html(sn);
}

function onFirmwareVersionChanged(fw) {
    console.log("onFirmwareVersionChanged: " + fw);
    ma352status.firmwareVersion = fw;
    $("#deviceVersion").html(fw);
}

function inputStatusInit() {
    inputStatus.forEach((input) => {
        $("#buttonInputDevice" + input.key)
            .attr("name", input.name)
            .attr("onclick", "changeInput('" + input.key + "')")
            .attr("aria-label", input.name)
            .attr("aria-disabled", false)
            .removeClass("buttonAvailable buttonInactive")
            .css("color", css.foregroundColor);
        $("#inputDeviceSvgSpan" + input.key).html(getSVG(input.svg));
        $("#inputDeviceNameSpan" + input.key).html(input.name);
        $("#inputDeviceStatusSpan" + input.key).html(getSVG("triangle-up"));
        $("#inputDeviceStatusSpan" + input.key).css("opacity", 0.1);
    });
}

function onInputChanged(inputValue) {
    console.log("onInputChanged: " + inputValue);
    let inputIntVal = parseInt(inputValue);
    if (inputIntVal < 0 || inputIntVal > 5) {
        console.log("onInputChanged: " + inputIntVal + " is invalid, must be between 0 and 5");
        return;
    }
    if (inputIntVal === ma352status.input) {
        console.log("onInputChanged: " + inputIntVal + " is same as current input: " + ma352status.input);
        return;
    }
    let oldValue = ma352status.input;
    let oldInput = inputStatus.find((x) => x.key === oldValue);
    if (oldInput) {
        console.log("onInputChanged: oldInput: " + oldInput.key);
        $("#buttonInputDevice" + oldInput.key).css("color", css.foregroundColor);
        $("#inputDeviceStatusSpan" + oldInput.key).css("opacity", 0.1);
    }

    ma352status.input = inputIntVal;
    let newInput = inputStatus.find((x) => x.key === inputIntVal);
    if (newInput) {
        console.log("onInputChanged: newInput: " + newInput.key);
        $("#buttonInputDevice" + newInput.key).css("color", css.selectedColor);
        $("#inputDeviceStatusSpan" + newInput.key).css("opacity", 1);
    }
}

function getOtherStatus(key) {
    let other = ma352status.others[key];
    if (other) {
        return other;
    }
    return null;
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
            let value = getOtherStatus(button.key);
            let val = value === 1 ? 0 : 1;
            $("#" + button.button).attr("onclick", "statusChange('" + key + "', " + val + ")");
        }
    });

}

function onMuteChanged(mute) {
    console.log("onMuteChanged: " + mute);
    ma352status.mute = mute ? true : false;
    if (mute) {
        $("#buttonMute")
            .css("color", "#ee0000");
    } else {
        $("#buttonMute")
            .css("color", css.foregroundColor);
    }
}

function onPowerChanged(power) {
    console.log("onPowerChanged: " + power);
    ma352status.power = power ? true : false;
    if (power) {
        $("#buttonPower")
            .css("color", css.selectedColor);
    } else {
        $("#buttonPower")
            .css("color", css.foregroundColor);
    }
}

function onButtonStatusChange(key, value) {
    console.log("buttonStatusChange: " + key + " = " + value);
    var button = buttonStatus.find((x) => x.key === key);
    if (button) {
        if (button.clickEnable) {
            let val = value === 1 ? 0 : 1;
            $("#" + button.button).attr("onclick", "statusChange('" + key + "', " + val + ")");
        }

        if ('TMO' === key) {
            value = value === 1 ? false : true;
        }

        if (value) {
            $("#" + button.button)
                .attr("aria-disabled", false)
                .removeClass("buttonAvailable buttonInactive")
                .addClass("buttonActive")
                .css("color", css.selectedColor);
        } else {
            $("#" + button.button)
                .attr("aria-disabled", false)
                .removeClass("buttonAvailable buttonInactive")
                .css("color", css.foregroundColor);
        }

    } else {
        console.log("buttonStatusChange: " + key + " is not supported");
    }

}

function showPowerMenu() {
    if (ma352status.power) {
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
        device_id: "MA352",
        power: "on",
    }
    if (socket) {
        socket.emit("webDevicePowerOn", msg);
    }
}

function powerOff() {
    console.log("Power Off");
    $("#overlayPowerMenu").hide();

    var msg = {
        device_id: "MA352",
        power: "off",
    }

    if (socket) {
        socket.emit("webDevicePowerOff", msg);
    }
}

function changeMute() {
    let how = ma352status.mute ? 'unmute' : 'mute';
    console.log("changeMute: " + how);
    var msg = {
        device_id: "MA352",
        "how": how,
    }
    if (socket) {
        socket.emit("webDeviceChangeMute", msg);
    }
}

function changeInput(input) {
    console.log("changeInput: " + input);
    let inputIntVal = parseInt(input);
    if (inputIntVal < 0 || inputIntVal > 5) {
        console.log("changeInput: " + input + " is invalid, must be between 0 and 5");
        return;
    }
    if (inputIntVal === ma352status.input) {
        console.log("changeInput: " + input + " is same as current input: " + ma352status.input);
        return;
    }
    var msg = {
        device_id: "MA352",
        input: input,
    }
    if (socket) {
        socket.emit("webDeviceChangeInput", msg);
    }
}

function statusChange(key, value) {
    console.log("statusChange: " + key + " = " + value);
    var msg = {
        device_id: "MA352",
        key: key,
        value: value,
    }
    if (socket) {
        socket.emit("webDeviceStatusChange", msg);
    }
}

function volumeButtonDown(spanId) {
    if (ma352status.power === false) {
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

    var msg = {
        device_id: "MA352",
        volume: newValue,
    }

    if (socket) {
        socket.emit("webDeviceChangeVolumeDown", msg);
    }
}

function volumeButtonUp(spanId) {
    if (ma352status.power === false) {
        console.log("volumeButtonUp: Power is off");
        return;
    }
    let oldValue = $("#" + spanId + "").text();
    let newValue = parseInt(oldValue) + 1;
    if (newValue > settings.volumeMax) {
        newValue = settings.volumeMax;
    }
    $("#volumeSliderInput").val(newValue);
    $("#" + spanId + "").html(newValue);

    if (newValue === parseInt(oldValue)) {
        // console.log("volumeInput: " + value + " is same as oldValue: " + oldValue);
        return;
    }

    var msg = {
        device_id: "MA352",
        volume: newValue,
    }

    if (socket) {
        socket.emit("webDeviceChangeVolumeUp", msg);
    }
}

function volumeInput(spanId, value) {
    console.log("volumeInput: " + value);
    let oldValue = $("#" + spanId + "").text();
    if (ma352status.power === false) {
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
        device_id: "MA352",
        volume: newValue,
    }

    if (socket) {
        socket.emit("webDeviceChangeVolume", msg);
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

function onVolumeChanged(volume) {
    console.log("onVolumeChanged: " + volume);
    if (inVolumeSlider) {
        console.log("volume slider is changing, ignore onVolumeChanged: " + volume);
        return;
    }
    let val = parseInt(volume);
    if (val < 0 || val > 100) {
        console.log("onVolumeChanged: " + val + " is invalid, must be between 0 and 100");
        return;
    }
    ma352status.volume = volume;
    volumeView(volume);
}

function getSVG(cmd) {
    // console.log("getSVG: " + cmd);
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
        //https://www.svgrepo.com/svg/437679/gauge
        case "gauge2":
            return '<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M 27.9999 51.9063 C 41.0546 51.9063 51.9063 41.0781 51.9063 28 C 51.9063 14.9453 41.0312 4.0937 27.9765 4.0937 C 14.8983 4.0937 4.0937 14.9453 4.0937 28 C 4.0937 41.0781 14.9218 51.9063 27.9999 51.9063 Z M 27.9999 47.9219 C 16.9374 47.9219 8.1014 39.0625 8.1014 28 C 8.1014 16.9609 16.9140 8.0781 27.9765 8.0781 C 39.0155 8.0781 47.8983 16.9609 47.9219 28 C 47.9454 39.0625 39.0390 47.9219 27.9999 47.9219 Z M 27.9765 17.3828 C 29.2421 17.3828 30.2733 16.3281 30.2733 15.0859 C 30.2733 13.7968 29.2421 12.7890 27.9765 12.7890 C 26.7109 12.7890 25.6796 13.7968 25.6796 15.0859 C 25.6796 16.3281 26.7109 17.3828 27.9765 17.3828 Z M 34.7265 19.4688 C 35.9921 19.4688 37.0234 18.4141 37.0234 17.1484 C 37.0234 15.8828 35.9921 14.8281 34.7265 14.8281 C 33.4609 14.8281 32.4296 15.8828 32.4296 17.1484 C 32.4296 18.4141 33.4609 19.4688 34.7265 19.4688 Z M 20.9218 19.4688 C 22.1874 19.4688 23.2187 18.4141 23.2187 17.1484 C 23.2187 15.8828 22.1874 14.8516 20.9218 14.8516 C 19.6562 14.8516 18.6249 15.8828 18.6249 17.1484 C 18.6249 18.4141 19.6562 19.4688 20.9218 19.4688 Z M 16.3046 24.4141 C 17.5702 24.4141 18.6014 23.3828 18.6014 22.1172 C 18.6014 20.8281 17.5702 19.7968 16.3046 19.7968 C 15.0390 19.7968 14.0077 20.8281 14.0077 22.1172 C 14.0077 23.3828 15.0390 24.4141 16.3046 24.4141 Z M 39.3436 24.4375 C 40.6093 24.4375 41.6405 23.4063 41.6405 22.1406 C 41.6405 20.8516 40.6093 19.8203 39.3436 19.8203 C 38.0780 19.8203 37.0468 20.8516 37.0468 22.1406 C 37.0468 23.4063 38.0780 24.4375 39.3436 24.4375 Z M 27.9765 42.2500 C 30.0390 42.2500 31.7030 40.5859 31.7030 38.5 C 31.7030 37 30.8124 35.7109 29.5234 35.1250 L 29.5234 24.1563 C 29.5234 23.2656 28.8202 22.5625 27.9765 22.5625 C 27.1327 22.5625 26.4296 23.2656 26.4296 24.1563 L 26.4296 35.1250 C 25.1405 35.7109 24.2499 37 24.2499 38.5 C 24.2499 40.5859 25.8905 42.2500 27.9765 42.2500 Z"></path></g></svg>';
        //https://www.svgrepo.com/svg/450782/dashboard
        case "gauge":
            return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M6.95 8.653A7.338 7.338 0 0 0 5.147 13H7v1H5.149a7.324 7.324 0 0 0 1.81 4.346l1.29-1.29.707.708C7.22 19.5 7.633 19.079 6.963 19.777a8.373 8.373 0 1 1 11.398-12.26l-.71.71A7.353 7.353 0 0 0 13 6.147V8h-1V6.146a7.338 7.338 0 0 0-4.342 1.8L8.973 9.26l-.707.707zm13.16 1.358l-.76.76a7.303 7.303 0 0 1-1.301 7.565L16.75 17.04l-.707.707 1.993 2.031a8.339 8.339 0 0 0 2.073-9.766zM3 13.5a9.492 9.492 0 0 1 16.15-6.772l.711-.71a10.493 10.493 0 1 0-14.364 15.29l.694-.725A9.469 9.469 0 0 1 3 13.5zm17.947-4.326a9.442 9.442 0 0 1-2.138 11.41l.694.724a10.473 10.473 0 0 0 2.19-12.88zm1.578-4.406l.707.707-8.648 8.649a2.507 2.507 0 1 1-.707-.707zM14 15.5a1.5 1.5 0 1 0-1.5 1.5 1.502 1.502 0 0 0 1.5-1.5z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>';
        case "stereo":
            return '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title></title><g data-name="Layer 14" id="Layer_14"><path d="M16,1A15,15,0,0,0,1,16v8a1,1,0,0,0,2,0V16a13,13,0,0,1,26,0v8a1,1,0,0,0,2,0V16A15,15,0,0,0,16,1Z"></path><path d="M8.49,17h-1A3.51,3.51,0,0,0,4,20.51v7A3.51,3.51,0,0,0,7.51,31h1A3.51,3.51,0,0,0,12,27.49v-7A3.51,3.51,0,0,0,8.49,17ZM10,27.49A1.52,1.52,0,0,1,8.49,29h-1A1.52,1.52,0,0,1,6,27.49v-7A1.52,1.52,0,0,1,7.51,19h1A1.52,1.52,0,0,1,10,20.51Z"></path><path d="M24.49,17h-1A3.51,3.51,0,0,0,20,20.51v7A3.51,3.51,0,0,0,23.51,31h1A3.51,3.51,0,0,0,28,27.49v-7A3.51,3.51,0,0,0,24.49,17ZM26,27.49A1.52,1.52,0,0,1,24.49,29h-1A1.52,1.52,0,0,1,22,27.49v-7A1.52,1.52,0,0,1,23.51,19h1A1.52,1.52,0,0,1,26,20.51Z"></path></g></g></svg>';
        case "device":
            return '<svg viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g id="layer1"><path d="M 1 6 L 0 7 L 0 14 L 1 15 L 19 15 L 20 14 L 20 7 L 19 6 L 9.5 6 L 10.5 7 L 18.5 7 L 19 7.5 L 19 13.5 L 18.5 14 L 1.5 14 L 1 13.5 L 1 7.5 L 1.5 7 L 2.5 7 L 3.5 6 L 1 6 z M 6.5 6 C 4.5729257 6 3 7.5729257 3 9.5 C 3 11.427074 4.5729257 13 6.5 13 C 8.4270743 13 10 11.427074 10 9.5 C 10 7.5729257 8.4270743 6 6.5 6 z M 6.5 7 C 7.8866342 7 9 8.1133658 9 9.5 C 9 10.886634 7.8866342 12 6.5 12 C 5.1133658 12 4 10.886634 4 9.5 C 4 8.1133658 5.1133658 7 6.5 7 z M 13 8 L 13 9 L 17 9 L 17 8 L 13 8 z M 13 10 L 13 11 L 17 11 L 17 10 L 13 10 z M 13 12 L 13 13 L 17 13 L 17 12 L 13 12 z"></path></g></g></svg>';
        default:
            break;
    }
}