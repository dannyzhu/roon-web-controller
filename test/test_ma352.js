"use strict";

const DeviceMa352 = require('../device_ma352.js');

let d = new DeviceMa352();
d.start({}, statusChangeCb);

function statusChangeCb(status, key, value) {
    console.log("statusChangeCb status=", status, ', ', key, ':', value);
}

// function ev_cmd(line) {
//     line = line.toString().trim();

//     let m;
//     if ((m = line.match(/volume up/i))) d.volume_up();
//     else if ((m = line.match(/volume down/i))) d.volume_down();
//     else if ((m = line.match(/volume ([0-9]*)/i))) d.set_volume(m[1]);
//     else if ((m = line.match(/source ([0-9]*)/i))) d.set_source(m[1]);
//     else if ((m = line.match(/mute (.)/i))) d.mute(m[1]);
//     else if ((m = line.match(/power on/i))) d.power_on();
//     else if ((m = line.match(/power off/i))) d.power_off();
//     else if ((m = line.match(/status/i))) d.get_status();
//     else d.raw_command(line);
// }

