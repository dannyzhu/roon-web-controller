"use strict";

const { SerialPort } = require("serialport");
const { ReadlineParser } = require('@serialport/parser-readline');
let util = require("util"),
    events = require('events');
const { usb } = require('usb');
const e = require("express");

function McIntosh() {
    this.seq = 0;
}

util.inherits(McIntosh, events.EventEmitter);

let _processw = function () {
    if (!this._port)
        return;
    if (this._woutstanding)
        return;
    if (this._qw.length == 0)
        return;

    this._woutstanding = true;
    // console.log("[McIntosh] writing:", this._qw[0]);

    this._port.write(this._qw[0] + "\n",
        (err) => {
            if (err)
                return;
            this._qw.shift();
            this._woutstanding = false;
            setTimeout(() => {
                _processw.call(this);
            }, 150);
        });
}

function send(val, cb) {
    this._qw.push(val);
    _processw.call(this);
};

McIntosh.prototype.volume_up = function () {
    if (this.properties.volume >= this.properties.maxVolume) {
        console.log('Volume too high, not changing');
        return;
    }
    if (this.serialCommandMode == "Zone") {
        send.call(this, "(VUP Z1)\n");
    } else {
        send.call(this, "(VOL U)\n");
    }
};
McIntosh.prototype.volume_down = function () {
    if (this.serialCommandMode == "Zone") {
        send.call(this, "(VDN Z1)\n");
    } else {
        send.call(this, "(VOL D)\n");
    }

};
McIntosh.prototype.set_volume = function (val) {
    if (this.properties.volume == val)
        return;
    if (this.volumetimer)
        clearTimeout(this.volumetimer);
    var self = this;
    if (val > this.properties.maxVolume) {
        console.log('Volume too high, setting to max ' + this.properties.maxVolume);
        val = this.properties.maxVolume;
    }
    this.volumetimer = setTimeout(() => {
        if (self.serialCommandMode == "Zone") {
            send.call(this, "(VST Z1 " + val + ")\n");
        } else {
            send.call(this, "(VOL " + val + ")\n");
        }
    }, 50)
};
McIntosh.prototype.get_status = function () {
    send.call(this, "(QRY)\n");
};

McIntosh.prototype.power_off = function () {
    if (this.serialCommandMode == "Zone") {
        send.call(this, "(POF Z1)\n");
    } else {
        send.call(this, "(PWR 0)\n");
    }
    let val = "Standby";
    if (this.properties.source != val) {
        this.properties.source = val;
        this.emit('source', val);
    }
};

McIntosh.prototype.power_on = function () {
    if (this.serialCommandMode == "Zone") {
        send.call(this, "(PON Z1)\n");
    } else {
        send.call(this, "(PWR 1)\n");
    }
};

McIntosh.prototype.set_source = function (val) {
    if (this.serialCommandMode == "Zone") {
        send.call(this, "(INP Z1 " + val + ")\n");
    } else {
        send.call(this, "(INP " + val + ")\n");
    }
};

McIntosh.prototype.mute = function (val) {
    if (this.serialCommandMode == "Zone") {
        send.call(this, "(MUT Z1 " + val + ")\n");
    } else {
        send.call(this, "(MUT " + val + ")\n");
    }
};

McIntosh.prototype.raw_command = function (val) {
    send.call(this, val + "\n");
};

McIntosh.prototype.init = function (opts, closecb) {
    let self = this;

    this._qw = [];
    this._woutstanding = false;

    this.properties = {
        volume: opts.volume || 1,
        source: opts.source || '8',
        usbVid: opts.usbVid,
        maxVolume: opts.maxVolume || 70,
        autoReconnect: opts.autoReconnect || true,
    };

    this.initializing = true;
    this.serialCommandMode = null;

    this._port = new SerialPort({
        path: opts.port,
        baudRate: opts.baud || 115200
    });
    this._parser = new ReadlineParser({
        delimiter: ')'
    });
    this._port.pipe(this._parser);

    this._parser.on('data', data => {
        if (this.initializing) {
            this.initializing = false;
            console.log("155 [McIntosh] connected emit.");
            this.emit('connected');
        }
        data = data.replace(/[\x00-\x1F\x7F]/g, "").trim();
        // console.log("[McIntosh] received: '%s'", data);

        if (/^\(VST.* ([0-9]*)$/.test(data)) {
            // console.log('VST received: ' + data);
            let val = Number(data.trim().replace(/^\(VST.* ([0-9]*)$/, "$1"));
            if (this.properties.volume != val) {
                console.log('Changing volume from %d to %d', this.properties.volume, val);
                this.properties.volume = val;
                this.emit('volume', parseInt(val));
            }
        } else if (/^.*\(POF.*$/.test(data)) {
            // console.log('POF received: ' + data);
            let val = "Standby";
            if (this.properties.source != val) {
                this.properties.source = val;
                this.emit('source', val);
            }
            this.emit('Power', 0);
        } else if (/^.*\(MUT.* 1$/.test(data)) { // Mute or Muted
            // console.log('MUT 1 received: ' + data);
            let val = "Muted";
            if (this.properties.source != val) {
                this.properties.source = val;
                this.emit('source', val);
            }

        } else if (/^.*\(MUT.* 0$/.test(data)) { // UnMute or UnMuted
            // console.log('MUT 0 received: ' + data);
            let val = "UnMuted";
            if (this.properties.source != val) {
                this.properties.source = val;
                this.emit('source', val);
            }

        } else if (/^.*\(INP.* ([0-9]*)$/.test(data)) {
            // console.log('INP received: ' + data);
            let val = data.trim().replace(/^.*\(INP.* ([0-9]*)$/, "$1");
            if (this.properties.source != val) {
                this.properties.source = val;
                this.emit('source', val);
            }
            this.emit('Input', parseInt(val));
        } else if (/^.*\(OP1.* ([0-9])$/.test(data)) {
            // console.log('OP1 received: ' + data);
            let intVal = data.trim().replace(/^.*\(OP1.* ([0-9]*)$/, "$1");
            let val = "Passthru";
            if (this.properties.source != val) {
                this.properties.source = val;
                this.emit('source', val);
            }
            this.emit('Other', 'OP1', parseInt(intVal));
        } else if (/^.*\(PWR .*$/.test(data)) {
            // console.log('PWR received: ' + data);
            //if PWR is received, device that is not using Zones is in use -> use 'NoZone' mode
            this.serialCommandMode = "NoZone";

            if (/^.*\(PWR 0$/.test(data)) {
                let val = "Standby";
                if (this.properties.source != val) {
                    this.properties.source = val;
                    this.emit('source', val);
                }
                this.emit('Power', 0);
            } else if (/^.*\(PWR 1$/.test(data)) {
                this.emit('Power', 1);
            }
        } else if (/^\(VOL ([0-9]*)$/.test(data)) {
            // console.log('VOL received: ' + data);
            let val = Number(data.trim().replace(/^\(VOL ([0-9]*)$/, "$1"));
            if (this.properties.volume != val) {
                // console.log('Changing volume from %d to %d', this.properties.volume, val);
                this.properties.volume = val;
                this.emit('volume', parseInt(val));
            }
        } else if (/^\(([A-Za-z0-9]+)\)?$/.test(data)) {
            // console.log('Device name data: ', data);
            const name = data.substring(1);
            // console.log('Device name: ', name);
            this.emit('DeviceName', name);
        } else if (/^\(Serial Number: (.+)$/.test(data)) {
            const serialNumber = data.substring(1);
            // console.log('Serial Number: ', serialNumber);
            this.emit('SerialNumber', serialNumber);
        } else if (/^\(FW Version: (.+)$/.test(data)) {
            const softwareVersion = data.substring(1);
            // console.log('FW Version: ', softwareVersion);
            this.emit('FWVersion', softwareVersion);
        } else if (/\(ERROR - (.*)$/.test(data)) {
            // console.log('Error: ', data);
            const matches = data.match(/\(ERROR - (.*)$/);
            const error = matches[1];
            this.emit('Error', error);
        } else if (/^\(([A-Z0-9]{3}) (-?\d+)$/.test(data)) {
            // console.log('Other data: ', data);
            const matches = data.match(/^\(([A-Z0-9]{3}) (-?\d+)$/);
            const name = matches[1]; // 获取第一个部分 (三个大写字母或数字)
            const value = matches[2]; // 获取第二个部分 (数字)
            // console.log('Other: ', name, ', ', value);
            this.emit('Other', name, parseInt(value));
        } else {
            console.log('No matching string: ' + data);
        }
    });

    // let timer = setTimeout(() => {
    //     if (this.initializing) {
    //         this.initializing = false;
    //         console.log("263 [McIntosh] connected emit.");
    //         this.emit('connected');
    //     }
    // }, 3000);

    this._port.on('open', err => {
        this.emit('preconnected');
        let val = "Standby";
        this.properties.source = val;
        //get device status in case it's up
        send.call(this, "(QRY)\n");
        //get volume in case device is running (QRY does not report volume, so we need to use a 'trick')
        // send.call(this, "(VDN Z1)\n");
        // send.call(this, "(VUP Z1)\n");
        // send.call(this, "(VOL D)\n");
        // send.call(this, "(VOL U)\n");
        //        send.call(this, "(PON Z1)\n");
        //        send.call(this, "(INP Z1 " + this.properties.source + ")\n");
        //        send.call(this, "(VST Z1 " + this.properties.volume + ")\n");
    });

    //detection of McIntosh USB disconnection (at power-off)
    usb.on('detach', device => {
        if (this.properties.usbVid == device.deviceDescriptor.idVendor) {
            console.log('remove', device);
            let val = "Standby";
            if (this.properties.source != val) {
                this.properties.source = val;
                this.emit('source', val);
            }
        }
    });

    this._port.on('close', () => {
        this._port.close(() => {
            this._port = undefined;
            if (closecb) {
                var cb2 = closecb;
                closecb = undefined;
                cb2('close');
            }
        })
    });
    this._port.on('error', err => {
        this._port.close(() => {
            this._port = undefined;
            if (closecb) {
                var cb2 = closecb;
                closecb = undefined;
                cb2('error');
            }
        })
    });
    this._port.on('disconnect', () => {
        this._port.close(() => {
            this._port = undefined;
            if (closecb) {
                var cb2 = closecb;
                closecb = undefined;
                cb2('disconnect');
            }
        })
    });
};

McIntosh.prototype.start = function (opts) {
    this.seq++;

    let closecb = (why) => {
        console.log("[McIntosh] disconnected, reason: %s", why , ', autoReconnect: ', this.properties.autoReconnect);
        this.emit('disconnected');
        if (why != 'close' || this.properties.autoReconnect) {
            var seq = ++this.seq;
            setTimeout(() => {
                if (seq != this.seq)
                    return;
                console.log("[McIntosh] reconnecting");
                this.start(opts);
            }, 2000);
        }
    };

    if (this._port) {        
        this._port.close(() => {
            this.init(opts, closecb);
        });
    } else {
        this.init(opts, closecb);
    }
};

McIntosh.prototype.stop = function () {
    this.seq++;
    if (this._port)
        this._port.close(() => { });
};

exports = module.exports = McIntosh;
