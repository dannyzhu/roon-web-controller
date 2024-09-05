"use strict";
// Setup general variables
var defaultListenPort = 8080;

var core, transport;
var pairStatus = 0;
var zoneStatus = [];
var zoneList = [];

// Change to working directory
try {
    process.chdir(__dirname);
    console.log(`Working directory: ${process.cwd()}`);
} catch (err) {
    console.error(`chdir: ${err}`);
}

// Read command line options
var commandLineArgs = require("command-line-args");
var getUsage = require("command-line-usage");

var optionDefinitions = [
    {
        name: "help",
        alias: "h",
        description: "Display this usage guide.",
        type: Boolean
    },
    {
        name: "port",
        alias: "p",
        description: "Specify the port the server listens on.",
        type: Number
    }
];

var options = commandLineArgs(optionDefinitions, { partial: true });

var usage = getUsage([
    {
        header: "Roon Web Controller",
        content:
            "A web based controller for the Roon Music Player.\n\nUsage: {bold node app.js <options>}"
    },
    {
        header: "Options",
        optionList: optionDefinitions
    },
    {
        content:
            "Project home: {underline https://github.com/pluggemi/roon-web-controller}"
    }
]);

if (options.help) {
    console.log(usage);
    process.exit();
}

// Read config file
var config = require("config");

var configPort = config.get("server.port");

// Determine listen port
if (options.port) {
    var listenPort = options.port;
} else if (configPort) {
    var listenPort = configPort;
} else {
    var listenPort = defaultListenPort;
}
// Setup Express
var express = require("express");
var http = require("http");
var bodyParser = require("body-parser");

var app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// Setup Socket IO
var server = http.createServer(app);
var io = require("socket.io").listen(server);

server.listen(listenPort, function () {
    console.log("Listening on port " + listenPort);
});

// Setup Roon
var RoonApi = require("node-roon-api");
var RoonApiImage = require("node-roon-api-image");
var RoonApiStatus = require("node-roon-api-status");
var RoonApiTransport = require("node-roon-api-transport");
var RoonApiBrowse = require("node-roon-api-browse");
const fs = require('fs');
const path = require('path');
var Ma352 = require('./device_ma352.js');

var roon = new RoonApi({
    extension_id: "com.pluggemi.web.controller",
    display_name: "Web Controller",
    display_version: "1.2.13",
    publisher: "Mike Plugge",
    log_level: "none",
    email: "masked",
    website: "https://github.com/pluggemi/roon-web-controller",

    core_paired: function (core_) {
        core = core_;

        pairStatus = true;
        io.emit("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + "}"));

        transport = core_.services.RoonApiTransport;

        transport.subscribe_zones(function (response, data) {
            // console.log('127 response: ' + JSON.stringify(response, null, 2));
            // console.log('128 data: ' + JSON.stringify(data, null, 2));
            var i, x, y, zone_id, display_name;
            if (response == "Subscribed") {
                for (x in data.zones) {
                    zone_id = data.zones[x].zone_id;
                    display_name = data.zones[x].display_name;
                    var item = {};
                    item.zone_id = zone_id;
                    item.display_name = display_name;

                    zoneList.push(item);
                    zoneStatus.push(data.zones[x]);
                }

                removeDuplicateList(zoneList, "zone_id");
                removeDuplicateStatus(zoneStatus, "zone_id");
            } else if (response == "Changed") {
                for (i in data) {
                    if (i == "zones_changed" || i == "zones_seek_changed") {
                        for (x in data.zones_changed) {
                            for (y in zoneStatus) {
                                if (zoneStatus[y].zone_id == data.zones_changed[x].zone_id) {
                                    zoneStatus[y] = data.zones_changed[x];
                                }
                            }
                        }
                        io.emit("zoneStatus", zoneStatus);
                    } else if (i == "zones_added") {
                        for (x in data.zones_added) {
                            zone_id = data.zones_added[x].zone_id;
                            display_name = data.zones_added[x].display_name;

                            item = {};
                            item.zone_id = zone_id;
                            item.display_name = display_name;

                            zoneList.push(item);
                            zoneStatus.push(data.zones_added[x]);
                        }

                        removeDuplicateList(zoneList, "zone_id");
                        removeDuplicateStatus(zoneStatus, "zone_id");
                    } else if (i == "zones_removed") {
                        // console.log('171 zoneList: ' + JSON.stringify(zoneList, null, 2));
                        for (x in data.zones_removed) {
                            zoneList = zoneList.filter(function (zone) {
                                return zone.zone_id != data.zones_removed[x];
                            });
                            zoneStatus = zoneStatus.filter(function (zone) {
                                return zone.zone_id != data.zones_removed[x];
                            });
                        }
                        removeDuplicateList(zoneList, "zone_id");
                        removeDuplicateStatus(zoneStatus, "zone_id");
                        // console.log('171 zoneList: ' + JSON.stringify(zoneList, null, 2));
                    }
                }
            }
        });
    },

    core_unpaired: function (core_) {
        pairStatus = false;
        io.emit("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + "}"));
    }
});

var svc_status = new RoonApiStatus(roon);

roon.init_services({
    required_services: [RoonApiTransport, RoonApiImage, RoonApiBrowse],
    provided_services: [svc_status]
});

svc_status.set_status("Extension enabled", false);

roon.start_discovery();

// Remove duplicates from zoneList array
function removeDuplicateList(array, property) {
    var x;
    var new_array = [];
    var lookup = {};
    for (x in array) {
        lookup[array[x][property]] = array[x];
    }

    for (x in lookup) {
        new_array.push(lookup[x]);
    }

    zoneList = new_array;
    io.emit("zoneList", zoneList);
}

// Remove duplicates from zoneStatus array
function removeDuplicateStatus(array, property) {
    var x;
    var new_array = [];
    var lookup = {};
    for (x in array) {
        lookup[array[x][property]] = array[x];
    }

    for (x in lookup) {
        new_array.push(lookup[x]);
    }

    zoneStatus = new_array;
    io.emit("zoneStatus", zoneStatus);
}

function refresh_browse(zone_id, options, callback, onerror) {
    options = Object.assign(
        {
            hierarchy: "browse",
            zone_or_output_id: zone_id
        },
        options
    );

    // console.log("browse options: " + JSON.stringify(options, null, 2));

    core.services.RoonApiBrowse.browse(options, function (error, payload) {
        if (error) {
            console.log("249:", error, payload);
            if (onerror) onerror(error);
            return;
        }

        // console.log("browse payload: " + JSON.stringify(payload, null, 2));

        if (payload.action == "list") {
            var items = [];
            if (payload.list.display_offset > 0) {
                var listoffset = payload.list.display_offset;
            } else {
                var listoffset = 0;
            }
            core.services.RoonApiBrowse.load(
                {
                    hierarchy: "browse",
                    offset: listoffset,
                    set_display_offset: listoffset
                },
                function (error, payload) {
                    if (error) {
                        console.log("270 load error: " + JSON.stringify(error, null, 2));
                    }
                    // console.log("load payload: " + JSON.stringify(payload, null, 2));
                    callback(payload);
                }
            );
        }
    });
}

function load_browse(listoffset, callback, onerror) {
    core.services.RoonApiBrowse.load(
        {
            hierarchy: "browse",
            offset: listoffset,
            set_display_offset: listoffset
        },
        function (error, payload) {
            if (error) {
                console.log("289 load error: " + JSON.stringify(error, null, 2));
            }
            callback(payload);
        }
    );
}
// ---------------------------- DEVICE --------------
console.log("Starting device");
var device = new Ma352();
device.start({}, statusChangeCb);

function statusChangeCb(status, key, value) {
    // console.log("device statusChangeCb status=", status, ", ", key, ":", value);
    if (key == "error") {
        console.log("Device error: " + value);
    }
    io.emit("deviceStatusChanged", { status: status, key: key, value: value });
}

// ---------------------------- WEB SOCKET --------------
io.on("connection", function (socket) {
    io.emit("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + "}"));
    io.emit("zoneList", zoneList);
    io.emit("zoneStatus", zoneStatus);

    io.emit("deviceCurrentStatus", {
        device_id: "MA352",
        status: device.getStatus()
    });

    socket.on("getZone", function () {
        io.emit("zoneStatus", zoneStatus);
    });

    socket.on("changeVolume", function (msg) {
        transport.change_volume(msg.output_id, "absolute", msg.volume);
    });

    socket.on("changeSetting", function (msg) {
        var settings = [];

        if (msg.setting == "shuffle") {
            settings.shuffle = msg.value;
        } else if (msg.setting == "auto_radio") {
            settings.auto_radio = msg.value;
        } else if (msg.setting == "loop") {
            settings.loop = msg.value;
        }

        transport.change_settings(msg.zone_id, settings, function (error) { });
    });

    socket.on("goPrev", function (msg) {
        transport.control(msg, "previous");
    });

    socket.on("goNext", function (msg) {
        transport.control(msg, "next");
    });

    socket.on("goPlayPause", function (msg) {
        transport.control(msg, "playpause");
    });

    socket.on("goPlay", function (msg) {
        transport.control(msg, "play");
    });

    socket.on("goPause", function (msg) {
        transport.control(msg, "pause");
    });

    socket.on("goStop", function (msg) {
        transport.control(msg, "stop");
    });

    socket.on("changeMute", function (msg) {
        console.log("Mute: " + JSON.stringify(msg));
        transport.mute(msg.output_id, msg.how);
    });

    // ---------------------------- DEVICE --------------
    socket.on("webDeviceChangeVolumeUp", function (msg) {
        console.log("webDeviceChangeVolumeUp: " + JSON.stringify(msg));
        device.volumeUp();
    });

    socket.on("webDeviceChangeVolumeDown", function (msg) {
        console.log("webDeviceChangeVolumeDown: " + JSON.stringify(msg));
        device.volumeDown();
    });

    socket.on("webDeviceChangeVolume", function (msg) {
        console.log("webDeviceChangeVolume: " + JSON.stringify(msg));
        device.setVolume(msg.volume);
    });

    socket.on("webDeviceChangeInput", function (msg) {
        console.log("webDeviceChangeInput: " + JSON.stringify(msg));
        device.setInput(msg.input);
    });

    socket.on("webDeviceChangeMute", function (msg) {
        console.log("webDeviceChangeMute: " + JSON.stringify(msg));
        if (msg.how == "unmute") {
            device.mute(0);
        } else {
            device.mute(1);
        }
    });

    socket.on("webDeviceStatusChange", function (msg) {
        console.log("webDeviceStatusChange: " + JSON.stringify(msg));
        device.setStatus(msg.key, msg.value);
    });

    socket.on("webDevicePowerOn", function (msg) {
        console.log("webDevicePowerOn: " + JSON.stringify(msg));
        device.powerOn();
    });

    socket.on("webDevicePowerOff", function (msg) {
        console.log("webDevicePowerOff: " + JSON.stringify(msg));
        device.powerOff();
    });
});

function imageHandle(req, res, imageKey, imageSize) {
    let fileName = imageKey + '_' + imageSize + '.jpg';
    //add subdirectory to fileDir
    let fileDir = __dirname + '/public/download_images/' + imageKey.substring(0, 1);
    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir);
    }
    let filePath = fileDir + '/' + fileName;
    // console.log("imageHandle: " + filePath);
    // Check if file exists
    if (fs.existsSync(filePath)) {
        // console.log("File exists: " + filePath);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.sendFile(filePath);
    } else {
        core.services.RoonApiImage.get_image(
            imageKey,
            { scale: "fit", width: imageSize, height: imageSize, format: "image/jpeg" },
            function (cb, contentType, body) {

                if (body == null) {
                    // console.log("Image not found: " + imageKey);
                    // res.writeHead(404);
                    // res.end();
                    // return;
                    return res.redirect(307, '/img/default.png');
                }

                res.contentType = contentType;

                res.writeHead(200, {
                    "Content-Type": "image/jpeg",
                    'Cache-Control': 'public, max-age=31536000'
                });
                res.end(body, "binary");

                //save image to file
                fs.writeFile(filePath, body, 'binary', function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        );
    }
}

// Web Routes
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/fullscreen.html");
});

app.get("/roonapi/image/:image_key.jpg", function (req, res) {
    let imageKey = req.params.image_key;
    imageHandle(req, res, imageKey, 1080);
});

app.get("/roonapi/image4k/:image_key.jpg", function (req, res) {
    let imageKey = req.params.image_key;
    imageHandle(req, res, imageKey, 2160);
});

app.get("/roonapi/getImage", function (req, res) {
    let fileName = req.query.image_key + '.jpg';
    let filePath = __dirname + '/public/images/' + fileName;
    console.log("getImage: " + filePath);
    // Check if file exists
    if (fs.existsSync(filePath)) {
        console.log("File exists: " + filePath);
        res.sendFile(filePath);
    } else {
        core.services.RoonApiImage.get_image(
            req.query.image_key,
            { scale: "fit", width: 1080, height: 1080, format: "image/jpeg" },
            function (cb, contentType, body) {
                res.contentType = contentType;

                res.writeHead(200, { "Content-Type": "image/jpeg" });
                res.end(body, "binary");

                //save image to file
                fs.writeFile(filePath, body, 'binary', function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        );
    }
});

app.get("/roonapi/getImage4k", function (req, res) {
    let fileName = req.query.image_key + '.jpg';
    let filePath = __dirname + '/public/images4k/' + fileName;
    console.log("getImage4k: " + filePath);
    // Check if file exists
    if (fs.existsSync(filePath)) {
        console.log("File exists: " + filePath);
        res.sendFile(filePath);
    } else {
        core.services.RoonApiImage.get_image(
            req.query.image_key,
            { scale: "fit", width: 2160, height: 2160, format: "image/jpeg" },
            function (cb, contentType, body) {
                res.contentType = contentType;

                res.writeHead(200, { "Content-Type": "image/jpeg" });
                res.end(body, "binary");

                //save image to file
                fs.writeFile(filePath, body, 'binary', function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        );
    }
});

app.post("/roonapi/goRefreshBrowse", function (req, res) {
    refresh_browse(req.body.zone_id, req.body.options, function (payload) {
        res.send({ data: payload });
    }, function (error) {
        res.send({ error: error });
    });
});

app.post("/roonapi/goLoadBrowse", function (req, res) {
    load_browse(req.body.listoffset, function (payload) {
        res.send({ data: payload });
    }, function (error) {
        res.send({ error: error });
    });
});

app.use(
    "/jquery/jquery.min.js",
    express.static(__dirname + "/node_modules/jquery/dist/jquery.min.js")
);

app.use(
    "/js-cookie/js.cookie.js",
    express.static(__dirname + "/node_modules/js-cookie/src/js.cookie.js")
);

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

