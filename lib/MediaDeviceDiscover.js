const { Client } = require('node-ssdp');
const logger = require('./logger');

class MediaDeviceDiscover {
    constructor(opts, callback) {
        this.settings = {
            serviceTypes: opts.serviceTypes || ['urn:schemas-upnp-org:device:MediaRenderer:1'],
        };
        this.callback = callback;
        this.foundDevices = [];
        this.#init();
    }

    #init() {
        logger.info('Initializing discovery...');
        this.ssdpClient = new Client();
        this.ssdpClient.on('response', (headers, statusCode, rinfo) => {
            // console.log('Received SSDP response headers:', JSON.stringify(headers, null, 2));
            // console.log('Received SSDP response statusCode:', statusCode);
            // console.log('Received SSDP response rinfo:', JSON.stringify(rinfo, null, 2));
            if (statusCode === 200) {
                let url = new URL(headers.LOCATION);
                let device = {
                    usn: headers.USN,
                    st: headers.ST,
                    descriptionUrl: headers.LOCATION,
                    server: headers.SERVER,
                    cacheControl: headers['CACHE-CONTROL'],
                    ipAddress: rinfo.address,
                    port: url.port, //rinfo.port,
                }
                //find usn is same in foundDevices
                const find = this.foundDevices.find(d => d.usn === device.usn);
                if (find) {
                    //check if device.location,ipAddress,port is same 
                    if (find.descriptionUrl === device.descriptionUrl && find.ipAddress === device.ipAddress && find.port === device.port) {
                        // console.log('Device already found:', device);
                    } else {
                        //update device 
                        this.foundDevices = this.foundDevices.map(d => d.usn === headers.USN ? device : d);
                        if (this.callback) {
                            this.callback('update', device);
                        }
                    }
                } else {
                    this.foundDevices.push(device);
                    if (this.callback) {
                        this.callback('new', device);
                    }
                }
            } else {
                logger.error('Error: Received SSDP response statusCode:', statusCode);
            }
        });
    }

    async discover() {
        this.ssdpClient.search(this.settings.serviceTypes);
    }

    async stop() {
        this.ssdpClient.stop();
    }
}

module.exports = MediaDeviceDiscover;
