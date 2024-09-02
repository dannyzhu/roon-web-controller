var McIntosh = require(".");

var d = new McIntosh();

d.on('volume', (vol) => {
    console.log("*** Got volume", vol);
});

d.on('source', (src) => {
    console.log("*** Got source", src);
});

let first = true;
d.on('connected', () => {
    console.log("*** Connected");
    if (first) {
	first = false;
	let stdin = process.openStdin();
	stdin.addListener("data", ev_cmd);
    }
});

d.on('disconnected', () => {
    console.log("*** Disconnected");
});


function ev_cmd(line) {
    line = line.toString().trim();

    let m;
    if      ((m=line.match(/volume up/i))) d.volume_up();
    else if ((m=line.match(/volume down/i))) d.volume_down();
    else if ((m=line.match(/volume ([0-9]*)/i))) d.set_volume(m[1]);
    else if ((m=line.match(/source ([0-9]*)/i))) d.set_source(m[1]);
    else if ((m=line.match(/mute (.)/i))) d.mute(m[1]);
    else if ((m=line.match(/power on/i))) d.power_on();
    else if ((m=line.match(/power off/i))) d.power_off();
    else if ((m=line.match(/status/i))) d.get_status();
    else d.raw_command(line);
}

d.start({ "port" : "/dev/ttyUSB0", "baud": 115200 });
