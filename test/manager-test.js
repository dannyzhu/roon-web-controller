
const MediaDeviceManager = require('../lib/MediaDeviceManager');

const manager = new MediaDeviceManager();

(async () => {
    
    await manager.init();

    // manager.on('deviceAdd', (device) => {
    //     console.log('11 deviceAdd: ' + device.id);
    //     device.printInfo();
    // });

    // manager.on('deviceUpdate', (device) => {
    //     console.log('16 deviceUpdate:', device);
    // });

    // manager.on('deviceRemove', (device) => {
    //     console.log('20 deviceRemove:', device);
    // });

    manager.on('renderDeviceInfo', (deviceInfo) => {
        console.log('24 renderDeviceInfo: ', JSON.stringify(deviceInfo, null, 2));
    });

    manager.on('renderDeviceStatus', (deviceStatus) => {
        console.log('24 renderDeviceStatus:', JSON.stringify(deviceStatus, null, 2));
    });

    await manager.start();
})();

setTimeout(async () => {
    await manager.stop();
}, 1000000);

