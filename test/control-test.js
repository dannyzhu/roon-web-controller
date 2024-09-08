const MediaDeviceControl = require('../lib/MediaDeviceControl');

let port = '50974';
const deviceInfo = {
    ipAddress: '192.168.8.58',
    port: '50974',
    descriptionUrl: `http://192.168.8.58:50974/lightningRender-bc-34-00-a0-71-83/Upnp/device.xml`,
};

(async function () {
    const mediaDevice = new MediaDeviceControl(deviceInfo);
    await mediaDevice.init();
    await mediaDevice.printServicesInfo();
    const attributes = mediaDevice.getAttributes();
    console.log('attributes:', attributes);
})();
