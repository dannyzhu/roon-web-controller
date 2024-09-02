"use strict";

var McIntosh = require('./mcintosh_rs232.js');

// TMO 0 立体声 1 Mono
// TEQ 0 均衡
// TIN 增益， 5 表示 2.5DB；可以是负数
// TDB 数字显示屏亮度，最大4，最小1
// TDS， DISplay always 0、1
// TBA ， 左右平衡，可为负数
// OP1 output 1
// OP2 output 2
// TML ， 指针屏幕亮
// TTL ， 电子管亮
// STA: 1,
// TPC: 1,
// THH: 1,
// HPS: 0
function DeviceMa352() {
    this.inputReceiveCount = 0;
    this.status = {
        others: {},
    };
    this.settings = {
        port: "/dev/tty.usbserial-AB9ELUTS",
        baud: 115200,
    };
}

DeviceMa352.prototype.getStatus = function () {
    return this.status;
}

DeviceMa352.prototype.setVolume = function (vol) {
    if (this.status.connected && this.status.power) {
        this.device.set_volume(vol);
    }
}

DeviceMa352.prototype.volumeUp = function () {
    if (this.status.connected && this.status.power) {
        this.device.volume_up();
    }
}

DeviceMa352.prototype.volumeDown = function () {
    if (this.status.connected && this.status.power) {
        this.device.volume_down();
    }
}

DeviceMa352.prototype.powerOff = function () {
    if (this.status.connected && this.status.power) {
        this.device.power_off();
    }
}

DeviceMa352.prototype.powerOn = function () {
    if (this.status.connected && !this.status.power) {
        this.device.power_on();
    }
}

DeviceMa352.prototype.setInput = function (src) {
    if (this.status.connected && this.status.power) {
        this.device.set_source(src);
    }
}

DeviceMa352.prototype.mute = function (on) {
    if (this.status.connected && this.status.power) {
        this.device.mute(on ? 1 : 0);
    }
}

const supportedCommands = [
    'OP1', 'OP2', 'STA', 'TBA', 'TIN', 'TEQ', 'TPC', 'TMO', 'TML', 'TTL', 'TDB', 'TDS', 'THH', 'HPS'];

DeviceMa352.prototype.setStatus = function (key, value) {
    if (this.status.connected && this.status.power) {
        if (supportedCommands.indexOf(key) >= 0) {
            this.device.raw_command("(" + key + " " + value + ")");
        } else {
            console.log("Unsupported command: ", key);
        }
    }
}

DeviceMa352.prototype.init = function (opts, closecb) {
    this.settings.port = opts.port || this.settings.port;
    this.status.connected = false;
    this.status.power = false;
    this.status.mute = false;
    this.status.volume = 0;
    this.status.input = 0;
    this.device = new McIntosh();
    this.device.on('volume', (vol) => {
        // console.log("*** Got volume", vol);
        this.status.volume = vol;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "volume", vol);
        }
    });
    this.device.on('source', (src) => {
        // console.log("*** Got source", src);
        let name = null;
        let value = null;
        if (src == 'UnMuted') {
            name = "mute";
            value = false;
            this.status.mute = false;
        } else if (src == 'Muted') {
            name = "mute";
            value = true;
            this.status.mute = true;
        }
        if (this.statusChangeCb && name) {
            this.statusChangeCb(this.status, name, value);
        }
    });
    this.device.on('Input', (src) => {
        this.status.input = parseInt(src);
        this.inputReceiveCount++;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "input", this.status.input);
        }
    });
    this.device.on('connected', () => {
        // console.log("*** Connected");
        this.status.connected = true;
        this.inputReceiveCount = 0;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "connected", true);
        }
    });
    this.device.on('disconnected', () => {
        // console.log("*** Disconnected");
        this.status.connected = false;
        this.inputReceiveCount = 0;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "connected", false);
        }
    });
    this.device.on('DeviceName', (name) => {
        // console.log("*** DeviceName", name);
        this.status.name = name;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "name", name);
        }
    });
    this.device.on("SerialNumber", (sn) => {
        // console.log("*** SerialNumber", sn);
        this.status.SerialNumber = sn;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "SerialNumber", sn);
        }
    });
    this.device.on("FWVersion", (fw) => {
        // console.log("*** FWVersion", fw);
        this.status.FWVersion = fw;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "FWVersion", fw);
        }
    });
    this.device.on("Other", (name, value) => {
        // console.log("*** Other", name, value);
        this.status.others[name] = value;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, name, value);
        }
    });
    this.device.on("Power", (on) => {
        // console.log("*** Power", on);
        this.inputReceiveCount = 0;
        this.status.power = on == 1 ? true : false;
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "power", this.status.power);
        }
    });
    this.device.on("Error", (err) => {
        // console.log("*** Error", err);
        if (this.statusChangeCb) {
            this.statusChangeCb(this.status, "error", err);
        }
    });
}

DeviceMa352.prototype.start = function (opts, statusChangeCb) {
    this.init(opts || {});
    this.statusChangeCb = statusChangeCb;
    this.device.start({ "port": this.settings.port, "baud": this.settings.baud });
}

exports = module.exports = DeviceMa352;
