
const MediaDeviceDiscover = require('./MediaDeviceDiscover');

const discover = new MediaDeviceDiscover({
    serviceTypes: ['urn:schemas-upnp-org:device:MediaRenderer:1'],
}, (type, device) => {
    console.log('type:', type, 'device:', device);
});

(async () => {
    await discover.discover();
})();


setTimeout(async () => {
    await discover.stop();
}, 50000);