"use strict";

const logger = require('./lib/logger');

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
    logger.info("Listening on port " + listenPort);
});

// Setup Roon
var RoonApi = require("node-roon-api");
var RoonApiImage = require("node-roon-api-image");
var RoonApiStatus = require("node-roon-api-status");
var RoonApiTransport = require("node-roon-api-transport");
var RoonApiBrowse = require("node-roon-api-browse");

// import RoonApiSettings   from 'node-roon-api-settings';
// import RoonApiAudioInput from 'node-roon-api-audioinput';

const fs = require('fs');
const path = require('path');
var Ma352 = require('./lib/device_ma352.js');
const MediaDeviceManager = require('./lib/MediaDeviceManager');

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
        emitToRoonSocket("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + "}"));

        transport = core_.services.RoonApiTransport;

        transport.subscribe_zones(function (response, data) {
            // console.log('127 response: ' + JSON.stringify(response, null, 2));
            // console.log('128 data: ' + JSON.stringify(data, null, 2));
            var i, x, y, zone_id, display_name;
            if (response == "Subscribed") {
                let newZoneList = [];
                for (x in data.zones) {
                    zone_id = data.zones[x].zone_id;
                    display_name = data.zones[x].display_name;
                    var item = {};
                    item.zone_id = zone_id;
                    item.display_name = display_name;

                    zoneList.push(item);
                    newZoneList.push(item);
                    zoneStatus.push(data.zones[x]);
                }

                removeDuplicateList(zoneList, "zone_id");
                removeDuplicateStatus(zoneStatus, "zone_id");

                for (const zone of newZoneList) {
                    onNewZone(zone);
                }
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
                        emitToRoonSocket("zoneStatus", zoneStatus);
                    } else if (i == "zones_added") {
                        let newZoneList = [];
                        for (x in data.zones_added) {
                            zone_id = data.zones_added[x].zone_id;
                            display_name = data.zones_added[x].display_name;

                            item = {};
                            item.zone_id = zone_id;
                            item.display_name = display_name;

                            zoneList.push(item);
                            newZoneList.push(item);
                            zoneStatus.push(data.zones_added[x]);
                        }

                        removeDuplicateList(zoneList, "zone_id");
                        removeDuplicateStatus(zoneStatus, "zone_id");

                        for (const zone of newZoneList) {
                            onNewZone(zone);
                        }
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
        emitToRoonSocket("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + "}"));
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
    // console.log("225 zoneList: " + JSON.stringify(zoneList, null ,2));
    emitToRoonSocket("zoneList", zoneList);
    // checkSubscribeQueue(zoneList);
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
    emitToRoonSocket("zoneStatus", zoneStatus);
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
            logger.error("browse error: ", error, ", payload: ", payload);
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
                        logger.error("load error: ", error, ", payload: ", payload);
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
                logger.error("load error: ", error, ", payload: ", payload);
            }
            callback(payload);
        }
    );
}

var subscribeQueueList = [];
var lastSubscribeQueueMsgs = {};
// function checkSubscribeQueue(zoneList) {
//     for (const zid of subscribeQueueList) {
//         //if zid is not in zoneList, remove zid from subscribeQueueList
//         if (!zoneList.find((x) => x.zone_id == zid)) {
//             console.log("314 checkSubscribeQueue: " + zid + " removed from subscribeQueueList");
//             subscribeQueueList = subscribeQueueList.filter((x) => x != zid);
//             delete lastSubscribeQueueMsgs[zid];
//         }
//     }
//     //if zoneList is not in subscribeQueueList, add zoneList to subscribeQueueList  
//     for (const zone of zoneList) {
//         if (!subscribeQueueList.find((x) => x == zone.zone_id)) {
//             console.log("320 checkSubscribeQueue: " + zone.zone_id + " added to subscribeQueueList");
//             subscribeQueueList.push(zone.zone_id);
//             transport.subscribe_queue(zone.zone_id, 50, function (response, msg) {
//                 console.log("subscribe_queue response: " + JSON.stringify(response, null, 2));
//                 console.log("subscribe_queue msg: " + JSON.stringify(msg, null, 2));
//                 if (msg) {
//                     msg.response = response;
//                     msg.zone_id = zone.zone_id;
//                     lastSubscribeQueueMsgs[zone.zone_id] = msg;
//                     emitToRoonSocket("queueStatus", msg);
//                 }
//             });
//         }
//     }
//     console.log("331 subscribeQueueList: " + JSON.stringify(subscribeQueueList, null, 2));
// }

function onNewZone(zone) {
    logger.info("onNewZone: ", zone);
    delete lastSubscribeQueueMsgs[zone.zone_id];
    //add to subscribeQueueList if not in subscribeQueueList
    if (!subscribeQueueList.find((x) => x == zone.zone_id)) {
        subscribeQueueList.push(zone.zone_id);
    }
    subscribeQueue(zone.zone_id);
}

function onRemoveZone(zone_id) {
    logger.info("onRemoveZone: ", zone_id);
    delete lastSubscribeQueueMsgs[zone_id];
    subscribeQueueList = subscribeQueueList.filter((x) => x != zone_id);
}

function subscribeQueue(zone_id) {
    logger.info("subscribeQueue: ", zone_id);
    transport.subscribe_queue(zone_id, 50, function (response, msg) {
        // console.log("subscribe_queue response: " + JSON.stringify(response, null, 2));
        // console.log("subscribe_queue msg: " + JSON.stringify(msg, null, 2));
        if (msg) {
            msg.response = response;
            msg.zone_id = zone_id;
            lastSubscribeQueueMsgs[zone_id] = msg;
            emitToRoonSocket("queueStatus", msg);
        }
    });
}

var roonSocketList = {};
var mcIntoshSocketList = {};
var renderDeviceSocketList = {};

// ---------------------------- DEVICE --------------
console.log("Starting device");
var mcIntoshDevice = new Ma352();
mcIntoshDevice.start({}, statusChangeCb);

function statusChangeCb(status, key, value) {
    // console.log("device statusChangeCb status=", status, ", ", key, ":", value);
    if (key == "error") {
        logger.error("Device error: ", value);
    }
    emitToMcIntoshSocket("deviceStatusChanged", { status: status, key: key, value: value });
}

var renderDevices = [];
var renderDeviceStatusArray = [];
const manager = new MediaDeviceManager();
(async () => {
    await manager.init();
    manager.on('renderDeviceInfo', (deviceInfo) => {
        // console.log('renderDeviceInfo: ' + JSON.stringify(deviceInfo, null, 2));
        //find device in renderDevices
        var findDevice = renderDevices.find((x) => x.id === deviceInfo.id);
        let changed = false;
        if (findDevice) {
            if (JSON.stringify(findDevice) !== JSON.stringify(deviceInfo)) {
                //remove device from renderDevices
                renderDevices = renderDevices.filter((x) => x.id !== deviceInfo.id);
                changed = true;
            }
        } else {
            changed = true;
        }
        if (changed) {
            renderDevices.push(deviceInfo);
            emitToRenderDeviceSocket("renderDeviceInfoList", renderDevices);
        }
    });
    manager.on('renderDeviceStatus', (deviceStatus) => {
        // console.log('339 renderDeviceStatus: ' + JSON.stringify(deviceStatus, null, 2));
        //find device in renderDeviceStatus
        var findDevice = renderDeviceStatusArray.find((x) => x.id === deviceStatus.id);
        let changed = false;
        if (findDevice) {
            // console.log('344 findDevice: ###' + JSON.stringify(findDevice) + '###');
            // console.log('345 deviceStatus: ###' + JSON.stringify(deviceStatus) + '###');
            if (JSON.stringify(findDevice) !== JSON.stringify(deviceStatus)) {
                //remove device from renderDeviceStatusArray
                // console.log('350 findDevice and changed');
                renderDeviceStatusArray = renderDeviceStatusArray.filter((x) => x.id !== deviceStatus.id);
                changed = true;
            }
        } else {
            // console.log('353 findDevice not found');
            changed = true;
        }
        if (changed) {
            // console.log('356 changed');
            renderDeviceStatusArray.push(deviceStatus);
            emitToRenderDeviceSocket("renderDeviceStatus", deviceStatus);
        }
    });
    await manager.start();
})();

// ---------------------------- WEB SOCKET --------------
io.on("connection", function (socket) {

    let subscribes = socket.handshake.query.subscribes;
    // console.log("subscribes: " + subscribes);
    //split subscribes by comma
    if (subscribes) {
        let subscribesArray = subscribes.split(',');
        for (const type of subscribesArray) {
            if (type == "roon") {
                roonSocketList[socket.id] = socket;
                initRoonSocket(socket);
            } else if (type == "mcIntosh") {
                mcIntoshSocketList[socket.id] = socket;
                initMcIntoshSocket(socket);
            } else if (type == "renderDevice") {
                renderDeviceSocketList[socket.id] = socket;
                initRenderDeviceSocket(socket);
            }
        }
    }

    socket.on("subscribe", function (msg) {
        // console.log("subscribe: " + JSON.stringify(msg) + ", from " + socket.id);
        // if (msg.type == "roon") {
        //     roonSocketList[socket.id] = socket;
        //     initRoonSocket(socket);
        // } else if (msg.type == "mcIntosh") {
        //     mcIntoshSocketList[socket.id] = socket;
        //     initMcIntoshSocket(socket);
        // } else if (msg.type == "renderDevice") {
        //     renderDeviceSocketList[socket.id] = socket;
        //     initRenderDeviceSocket(socket);
        // }
    });

    socket.on("disconnect", function () {
        // console.log("disconnect: " + socket.id);
        delete roonSocketList[socket.id];
        delete mcIntoshSocketList[socket.id];
        delete renderDeviceSocketList[socket.id];
    });

});

// ------ emit to socket ------

function emitToRoonSocket(event, data) {
    for (const socket of Object.values(roonSocketList)) {
        socket.emit(event, data);
    }
}

function emitToMcIntoshSocket(event, data) {
    for (const socket of Object.values(mcIntoshSocketList)) {
        socket.emit(event, data);
    }
}

function emitToRenderDeviceSocket(event, data) {
    for (const socket of Object.values(renderDeviceSocketList)) {
        socket.emit(event, data);
    }
}

// ---------------------------- ROON --------------
var subscribeQueueList = [];

function initRoonSocket(socket) {

    socket.on("getZone", function () {
        io.to(socket.id).emit("zoneStatus", zoneStatus);
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
        logger.info("Mute: ", msg);
        transport.mute(msg.output_id, msg.how);
    });

    io.to(socket.id).emit("pairStatus", JSON.parse('{"pairEnabled": ' + pairStatus + "}"));
    io.to(socket.id).emit("zoneList", zoneList);
    io.to(socket.id).emit("zoneStatus", zoneStatus);

    for (const zone_id of Object.keys(lastSubscribeQueueMsgs)) {
        io.to(socket.id).emit("queueStatus", lastSubscribeQueueMsgs[zone_id]);
    }
}

// ---------------------------- McIntosh DEVICE --------------
function initMcIntoshSocket(socket) {

    socket.on("webDeviceChangeVolumeUp", function (msg) {
        logger.info("webDeviceChangeVolumeUp: ", msg);
        mcIntoshDevice.volumeUp();
    });

    socket.on("webDeviceChangeVolumeDown", function (msg) {
        logger.info("webDeviceChangeVolumeDown: ", msg);
        mcIntoshDevice.volumeDown();
    });

    socket.on("webDeviceChangeVolume", function (msg) {
        logger.info("webDeviceChangeVolume: ", msg);
        mcIntoshDevice.setVolume(msg.volume);
    });

    socket.on("webDeviceChangeInput", function (msg) {
        logger.info("webDeviceChangeInput: ", msg);
        mcIntoshDevice.setInput(msg.input);
    });

    socket.on("webDeviceChangeMute", function (msg) {
        logger.info("webDeviceChangeMute: ", msg);
        if (msg.how == "unmute") {
            mcIntoshDevice.mute(0);
        } else {
            mcIntoshDevice.mute(1);
        }
    });

    socket.on("webDeviceStatusChange", function (msg) {
        logger.info("webDeviceStatusChange: ", msg);
        mcIntoshDevice.setStatus(msg.key, msg.value);
    });

    socket.on("webDevicePowerOn", function (msg) {
        logger.info("webDevicePowerOn: ", msg);
        mcIntoshDevice.powerOn();
    });

    socket.on("webDevicePowerOff", function (msg) {
        logger.info("webDevicePowerOff: ", msg);
        mcIntoshDevice.powerOff();
    });

    io.to(socket.id).emit("deviceCurrentStatus", {
        device_id: "MA352",
        status: mcIntoshDevice.getStatus()
    });

}

// ---------------------------- Render Deivce --------------
function initRenderDeviceSocket(socket) {

    socket.on("webRenderDeviceChangeVolumeUp", async function (msg) {
        logger.info("webRenderDeviceChangeVolumeUp: ", msg);
        let deviceId = msg.deviceId;
        let device = manager.getMediaDeviceById(deviceId);
        if (device) {
            await device.setVolumeUp();
        }
    });

    socket.on("webRenderDeviceChangeVolumeDown", async function (msg) {
        logger.info("webRenderDeviceChangeVolumeDown: ", msg);
        let deviceId = msg.deviceId;
        let device = manager.getMediaDeviceById(deviceId);
        if (device) {
            await device.setVolumeDown();
        }
    });

    socket.on("webRenderDeviceChangeVolume", async function (msg) {
        logger.info("webRenderDeviceChangeVolume: ", msg);
        let deviceId = msg.deviceId;
        let volume = msg.volume;
        let device = manager.getMediaDeviceById(deviceId);
        if (device) {
            await device.setVolume(volume);
        }
    });

    socket.on("webRenderDeviceChangeInput", async function (msg) {
        logger.info("webRenderDeviceChangeInput: ", msg);
        let deviceId = msg.deviceId;
        let inputIndex = msg.input;
        let device = manager.getMediaDeviceById(deviceId);
        if (device) {
            await device.setSourceIndex(inputIndex);
        }
    });

    socket.on("webRenderDeviceChangeMute", async function (msg) {
        logger.info("webRenderDeviceChangeMute: ", msg);
        let deviceId = msg.deviceId;
        let device = manager.getMediaDeviceById(deviceId);
        if (device) {
            if (msg.how == "mute") {
                await device.setMute(true);
            } else {
                await device.setMute(false);
            }
        }
    });

    socket.on("webRenderDeviceStatusChange", async function (msg) {
        logger.info("webRenderDeviceStatusChange: ", msg);
        let deviceId = msg.deviceId;
        let device = manager.getMediaDeviceById(deviceId);
        if (device) {
            if (msg.key == "shuffle") {
                // console.log("webRenderDeviceStatusChange: shuffle");
                await device.setToggleShuffle();
            } else if (msg.key == "repeat") {
                // console.log("webRenderDeviceStatusChange: repeat");
                await device.setToggleLoop();
            }
        }
    });

    socket.on("webRenderDevicePowerOn", async function (msg) {
        logger.info("webRenderDevicePowerOn: ", msg);
    });

    socket.on("webRenderDevicePowerOff", async function (msg) {
        logger.info("webRenderDevicePowerOff: ", msg);
    });

    io.to(socket.id).emit("renderDeviceInfoList", renderDevices);
    //for renderDeviceStatusArray
    for (const deviceStatus of renderDeviceStatusArray) {
        io.to(socket.id).emit("renderDeviceStatus", deviceStatus);
    }

}

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
    logger.info("getImage: " + filePath);
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
    logger.info("getImage4k: " + filePath);
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

