const MediaDeviceDiscover = require('./MediaDeviceDiscover');
const MediaDeviceControl = require('./MediaDeviceControl');
const { EventEmitter } = require('events');
const { DOMParser } = require('xmldom');
const xml2js = require('xml2js');

class MediaDeviceManager extends EventEmitter {
    constructor() {
        super();
        this.mediaDevices = [];
    }

    getAllMediaDevices() {
        return this.mediaDevices;
    }

    getMediaDeviceById(id) {
        return this.mediaDevices.find(d => d.id === id);
    }

    async init() {
        console.log('MediaDeviceManager init');
        this.discover = new MediaDeviceDiscover({
            serviceTypes: ['urn:schemas-upnp-org:device:MediaRenderer:1'],
        }, async (type, device) => {
            // console.log('type:', type, 'device:', device);
            const find = this.mediaDevices.find(d => d.device.usn === device.usn);
            if (find) {
                find.update(device);
                this.emit('deviceUpdate', find);
            } else {
                let newDevice = new MediaDevice(device, this);
                await newDevice.init();
                this.mediaDevices.push(newDevice);
                this.emit('deviceAdd', newDevice);
            }
        });
    }

    async start() {
        console.log('MediaDeviceManager start');
        await this.discover.discover();
    }

    async stop() {
        console.log('MediaDeviceManager stop');
        await this.discover.stop();
        for (let device of this.mediaDevices) {
            await device.stop();
        }
    }
}

class MediaDevice {

    constructor(device, manager) {
        this.manager = manager;
        this.device = device;
        this.deviceInfo = {
        };
        this.playStatusUpdateTime = 5000;
        this.deviceStatusUpdateTime = 60000;
        this.intervalPlay = null;
        this.intervalDevice = null;
        this.id = device.usn;
        this.status = {
        };
        this.firstUpdate = true;
    }

    async init() {
        this.control = new MediaDeviceControl(this.device);
        await this.control.init();

        this.serviceProduct = this.control.getService('urn:av-openhome-org:service:Product:1');
        this.serviceTime = this.control.getService('urn:av-openhome-org:service:Time:1');
        this.serviceInfo = this.control.getService('urn:av-openhome-org:service:Info:1');
        this.serviceRoon = this.control.getService('urn:av-openhome-org:service:Roon:1');
        this.serviceVolume = this.control.getService('urn:av-openhome-org:service:Volume:1');
        this.serviceHardwareConfig = this.control.getService('urn:av-openhome-org:service:HardwareConfig:1');
        this.serviceTidalConnect = this.control.getService('urn:av-openhome-org:service:TidalConnect:1');
        this.serviceSpotify = this.control.getService('urn:av-openhome-org:service:Spotify:1');
        this.serviceAirplay = this.control.getService('urn:av-openhome-org:service:Airplay:1');
        this.serviceBluetooth = this.control.getService('urn:av-openhome-org:service:Bluetooth:1');

        await this.#updateDeviceInfo();
        this.manager.emit('renderDeviceInfo', this.deviceInfo);

        await this.#updatePlayStatus();
        // await this.#updateDeviceStatus();
        this.manager.emit('renderDeviceStatus', this.status);

        this.firstUpdate = false;

        this.intervalPlay = setInterval(async () => {
            await this.#updatePlayStatus();
        }, this.playStatusUpdateTime);
        // this.intervalDevice = setInterval(async () => {
        //     await this.#updateDeviceStatus();
        // }, this.deviceStatusUpdateTime);
    }

    update(device) {
        console.log('MediaDevice update : ', this.device.usn);
        this.device = device;
        this.control.update(device);
    }

    async getSourceName(sourceIndex) {
        let sourceList = this.deviceInfo.sourceList;
        let source = sourceList.find(s => s.Index === sourceIndex);
        return source?.Name ?? null;
    }

    async getCurrentSourceName() {
        let sourceIndex = this.status?.sourceIndex ?? null;
        return this.getSourceName(sourceIndex);
    }

    async stop() {
        console.log('MediaDevice stop : ', this.device.usn);
        clearInterval(this.intervalPlay);
        clearInterval(this.intervalDevice);
    }

    printInfo() {
        console.log('device:', this.device);
        console.log('deviceInfo:', this.deviceInfo);
        console.log('status:', this.status);
    }

    async setVolume(volume) {
        console.log('setVolume : ', volume);
        await this.#serviceCall(this.serviceVolume, 'SetVolume', { Value: volume });
    }

    async setVolumeUp() {
        console.log('setVolumeUp : ');
        let currentVolume = parseInt(this.status?.volume?.volume ?? null);
        if (currentVolume) {
            let newVolume = currentVolume + 1;
            await this.#serviceCall(this.serviceVolume, 'SetVolume', { Value: newVolume });
        }
    }

    async setVolumeDown() {
        console.log('setVolumeDown : ');
        let currentVolume = parseInt(this.status?.volume?.volume ?? null);
        if (currentVolume) {
            let newVolume = currentVolume - 1;
            await this.#serviceCall(this.serviceVolume, 'SetVolume', { Value: newVolume });
        }
    }

    async setMute(mute) {
        console.log('setMute : ', mute);
        //mute is string 'mute' or 'unmute'
        //else mute is boolean 
        let muteValue = null;
        if (typeof mute === 'boolean') {
            muteValue = mute ? '1' : '0';
        } else {
            muteValue = mute === 'unmute' ? '0' : '1';
        }
        await this.#serviceCall(this.serviceVolume, 'SetMute', { Value: muteValue });
    }

    async setToggleShuffle() {
        console.log('setToggleShuffle : ');
        await this.#serviceCall(this.serviceRoon, 'ToggleShuffle');
    }

    async setToggleLoop() {
        console.log('setToggleLoop : ');
        await this.#serviceCall(this.serviceRoon, 'ToggleLoop');
    }

    async play() {
        console.log('play : ');
        await this.#serviceCall(this.serviceRoon, 'Play');
    }

    async pause() {
        console.log('pause : ');
        await this.#serviceCall(this.serviceRoon, 'Pause');
    }

    async setSourceIndex(index) {
        console.log('setSourceIndex : ', index);
        await this.#serviceCall(this.serviceProduct, 'SetSourceIndex', { Value: index });
        // try {
        //     await this.serviceProduct.SetSourceIndex({ Value: index });
        // } catch (error) {
        //     console.error('setSourceIndex error : ', error);
        //     this.manager.emit('renderDeviceError', {
        //         deviceId: this.id,
        //         error: error.message,
        //     });
        // }
    }

    async #serviceCall(service, method, params = null) {
        try {
            if (params) {
                return await service[method](params);
            } else {
                return await service[method]();
            }
        } catch (error) {
            console.error('serviceCall error : ', error);
            this.manager.emit('renderDeviceError', {
                deviceId: this.id,
                error: error.message,
            });
        }
    }

    /**
     * 更新设备信息
     */
    async #updateDeviceInfo() {
        try {
            let newDeviceInfo = {
                deviceId: this.device.usn,
                ipAddress: this.device.ipAddress,
                manufacturer: this.#getValue0('Name', await this.serviceProduct.Manufacturer()),
                model: this.#getValue0('Name', await this.serviceProduct.Model()),
                product: this.#getValue0('Name', await this.serviceProduct.Product()),
                sourceCount: this.#getValue0Int('Value', await this.serviceProduct.SourceCount()),
                sourceList: this.#sourceXMLToObject(this.#getValue0('Value', await this.serviceProduct.SourceXml())),
                sourceXmlChangeCount: this.#getValue0Int('Value', await this.serviceProduct.SourceXmlChangeCount()),

                // version: this.#getValue0('Version', await serviceHardwareConfig.GetUpdateInfo()),
                sourceVisible: this.#sourceVisibleXMLToObject(this.#getValue0('VisibleInfo', await this.serviceHardwareConfig.GetSourceVisible())),
                hardWareInfo: this.#hardWareInfoXMLToObject(this.#getValue0('HardWareInfo', await this.serviceHardwareConfig.GetHardWareInfo())),
            }
            //check if deviceInfo is changed
            if (this.firstUpdate) {
                this.deviceInfo = newDeviceInfo;
            } else {
                let changed = false;
                if (JSON.stringify(this.deviceInfo) !== JSON.stringify(newDeviceInfo)) {
                    this.deviceInfo = newDeviceInfo;
                    console.log('120 deviceInfo changed : ', this.device.usn);
                    changed = true;
                }
                if (changed) {
                    this.manager.emit('renderDeviceInfo', this.deviceInfo);
                }
            }
        } catch (error) {
            console.error('updateDeviceInfo error : ', error);
            this.manager.emit('renderDeviceError', {
                deviceId: this.id,
                error: error.message,
            });
        }
    }

    /**
     * 更新播放状态
     */
    async #updatePlayStatus() {
        try {
            let newStatus = {
                deviceId: this.id,
            };

            newStatus.sourceIndex = this.#getValue0Int('Value', await this.serviceProduct.SourceIndex());
            newStatus.standby = this.#getValue0Int('Value', await this.serviceProduct.Standby());
            newStatus.isAlive = this.#getValue0Int('Alive', await this.serviceHardwareConfig.IsAlive());

            newStatus.track = this.#trackXMLToObject(this.#getValue0('Metadata', await this.serviceInfo.Track()));
            if (newStatus.track) {
                let details = await this.serviceInfo.Details();
                newStatus.track.details = {
                    duration: this.#getValue0('Duration', details),
                    bitrate: this.#getValue0Int('BitRate', details),
                    bitDepth: this.#getValue0Int('BitDepth', details),
                    sampleRate: this.#getValue0Int('SampleRate', details),
                    lossless: this.#getValue0Int('Lossless', details),
                    codecName: this.#getValue0('CodecName', details),
                };
            } else {
                console.log('track is null');
            }

            newStatus.roon = {
                repeat: 0,
                shuffle: 0,
                transportState: 'Stopped',
            }            

            let sourceName = await this.getSourceName(newStatus.sourceIndex);
            newStatus.sourceName = sourceName;
            newStatus.transportState = 'Stopped';

            if (newStatus.sourceName == 'TidalConnect') {
                newStatus.transportState = this.#getValue0('Value', await this.serviceTidalConnect.TransportState());
            } else if (newStatus.sourceName == 'Spotify') {
                newStatus.transportState = this.#getValue0('Value', await this.serviceSpotify.TransportState());
            } else if (newStatus.sourceName == 'Airplay') {
                newStatus.transportState = this.#getValue0('Value', await this.serviceAirplay.TransportState());
            } else if (newStatus.sourceName == 'Bluetooth') {
                newStatus.transportState = this.#getValue0('Value', await this.serviceBluetooth.TransportState());
            } else if (newStatus.sourceName == 'Roon') {
                newStatus.roon = {
                    repeat: this.#getValue0Int('Value', await this.serviceRoon.Repeat()),
                    shuffle: this.#getValue0Int('Value', await this.serviceRoon.Shuffle()),
                    transportState: this.#getValue0('Value', await this.serviceRoon.TransportState()),
                }
                newStatus.transportState = newStatus.roon.transportState;
            } else {
                console.log('unknown source : ', newStatus.sourceName);
            }

            newStatus.volume = {
                volume: this.#getValue0Int('Value', await this.serviceVolume.Volume()),
                mute: this.#getValue0Int('Value', await this.serviceVolume.Mute()),
                volumeLimit: this.#getValue0Int('Value', await this.serviceVolume.VolumeLimit()),
            }

            //check if status is changed
            if (this.firstUpdate) {
                for (let key in newStatus) {
                    this.status[key] = newStatus[key];
                }
            } else {
                let changed = false;
                for (let key in newStatus) {
                    if (JSON.stringify(this.status[key]) !== JSON.stringify(newStatus[key])) {
                        // console.log('163 status changed : ', this.device.usn, ', key:', key, ', new value:', newStatus[key], ', old value:', this.status[key]);
                        // this.status[key] = newStatus[key];
                        changed = true;
                        break;
                    }
                }
                if (changed) {
                    this.status = newStatus;
                    this.manager.emit('renderDeviceStatus', this.status);
                }
            }
        } catch (error) {
            console.error('updatePlayStatus error : ', error);
            this.manager.emit('renderDeviceError', {
                deviceId: this.id,
                error: error.message,
            });
        }
    }

    async #updateDeviceStatus() {
        // let serviceProduct = this.control.getService('urn:av-openhome-org:service:Product:1');
        // let serviceHardwareConfig = this.control.getService('urn:av-openhome-org:service:HardwareConfig:1');
        // let newStatus = {
        //     sourceIndex: this.#getValue0('Value', await serviceProduct.SourceIndex()),
        //     standby: this.#getValue0('Value', await serviceProduct.Standby()),
        //     isAlive: this.#getValue0('Alive', await serviceHardwareConfig.IsAlive()),
        // }
        // //check if status is changed, only check newStatus keys
        // if (this.firstUpdate) {
        //     for (let key in newStatus) {
        //         this.status[key] = newStatus[key];
        //     }
        // } else {
        //     let changed = false;
        //     for (let key in newStatus) {
        //         if (JSON.stringify(this.status[key]) !== JSON.stringify(newStatus[key])) {
        //             // console.log('177 status changed : ', this.device.usn, ', key:', key, ', new value:', newStatus[key], ', old value:', this.status[key]);
        //             this.status[key] = newStatus[key];
        //             changed = true;
        //         }
        //     }
        //     if (changed) {
        //         this.manager.emit('renderDeviceStatus', this.status);
        //     }
        // }
    }

    /**
     * {
     *  '$': { 'xmlns:u': 'urn:av-openhome-org:service:Product:1' },
     *  Value: [ '336' ]
     * }
     */
    #getValue0(name, obj) {
        // check obj is not null and is array 
        if (obj && obj[name] && obj[name].length > 0) {
            return obj[name][0];
        }
        return null;
    }

    #getValue0Int(name, obj, defaultValue = 0) {
        let value = this.#getValue0(name, obj);
        return this.#toInt(value, defaultValue);
    }

    #toInt(value, defaultValue = 0) {
        let ret = parseInt(value);
        if (!isNaN(ret)) {
            return ret;
        } else {
            console.log('toInt value is NaN : ', value);
        }
        return defaultValue;
    }

    #sourceXMLToObject(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

            const sourceElements = xmlDoc.getElementsByTagName('Source');
            const sourceArray = [];

            for (let i = 0; i < sourceElements.length; i++) {
                const name = sourceElements[i].getElementsByTagName('Name')[0].textContent;
                const type = sourceElements[i].getElementsByTagName('Type')[0].textContent;
                const visible = sourceElements[i].getElementsByTagName('Visible')[0].textContent;

                if (visible === '1') {
                    sourceArray.push({
                        Name: name,
                        Type: type,
                        Visible: visible === '1', // 转换为布尔值,
                        Index: i,
                    });
                }
            }

            // console.log(sourceArray);
            return sourceArray;
        } catch (error) {
            console.error('sourceXMLToObject error : ', error);
            this.manager.emit('renderDeviceError', {
                deviceId: this.id,
                error: error.message,
            });
        }
    }

    #trackXMLToObject(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

            // 获取 <item> 元素
            const itemElement = xmlDoc.getElementsByTagName('item')[0];

            // 提取数据
            const title = itemElement.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'title')[0]?.textContent;
            const album = itemElement.getElementsByTagNameNS('urn:schemas-upnp-org:metadata-1-0/upnp/', 'album')[0]?.textContent;
            const albumArtURI = itemElement.getElementsByTagNameNS('urn:schemas-upnp-org:metadata-1-0/upnp/', 'albumArtURI')[0]?.textContent;

            // const artistAlbum = itemElement.querySelector('upnp\\:artist[role="AlbumArtist"]').textContent;
            const artistElements = itemElement.getElementsByTagName('upnp:artist');

            // 查找 role="AlbumArtist" 的元素
            let artistAlbum = null;
            for (let i = 0; i < artistElements.length; i++) {
                if (artistElements[i].getAttribute('role') === 'AlbumArtist') {
                    artistAlbum = artistElements[i].textContent;
                    break;
                }
            }
            const artist = itemElement.getElementsByTagNameNS('urn:schemas-upnp-org:metadata-1-0/upnp/', 'artist')[1]?.textContent;
            const resElement = itemElement.getElementsByTagName('res')[0];

            // 提取 <res> 元素的属性
            const duration = resElement.getAttribute('duration');
            const size = this.#toInt(resElement.getAttribute('size'));
            const bitsPerSample = this.#toInt(resElement.getAttribute('bitsPerSample'));
            const bitrate = this.#toInt(resElement.getAttribute('bitrate'));
            const sampleFrequency = this.#toInt(resElement.getAttribute('sampleFrequency'));
            const nrAudioChannels = this.#toInt(resElement.getAttribute('nrAudioChannels'));
            const protocolInfo = resElement.getAttribute('protocolInfo');
            const upnpClass = itemElement.getElementsByTagNameNS('urn:schemas-upnp-org:metadata-1-0/upnp/', 'class')[0]?.textContent;

            // 构造 JavaScript 对象
            const result = {
                title: title,
                album: album,
                albumArtURI: albumArtURI,
                artistAlbum: artistAlbum,
                artist: artist,
                resource: {
                    duration: duration,
                    size: size,
                    bitsPerSample: bitsPerSample,
                    bitrate: bitrate,
                    sampleFrequency: sampleFrequency,
                    nrAudioChannels: nrAudioChannels,
                    protocolInfo: protocolInfo
                },
                clazz: upnpClass
            };

            // console.log(result);
            return result;
        } catch (error) {
            console.error('trackXMLToObject error : ', error);
            this.manager.emit('renderDeviceError', {
                deviceId: this.id,
                error: error.message,
            });
        }
    }

    #sourceVisibleXMLToObject(xmlString) {
        try {
            const parser = new xml2js.Parser();
            let combined = null;

            parser.parseString(xmlString, (err, result) => {
                if (err) {
                    console.error('XML parsing error:', err);
                    return;
                }

                // 解析后的结果
                const sources = result.LIST.SOURCE;
                const visibilities = result.LIST.VISIBLE;

                combined = sources.map((source, index) => ({
                    source,
                    visible: visibilities[index] === 'true'
                }));

                // console.log(combined);
            });

            return combined;
        } catch (error) {
            console.error('sourceVisibleXMLToObject error : ', error);
            this.manager.emit('renderDeviceError', {
                deviceId: this.id,
                error: error.message,
            });
        }
    }

    #hardWareInfoXMLToObject(xmlString) {
        try {
            const parser = new xml2js.Parser({ explicitArray: false });
            let combined = null;

            xmlString = '<root>' + xmlString + '</root>';
            parser.parseString(xmlString, (err, result) => {
                if (err) {
                    console.error('XML parsing error:', err);
                    return;
                }
                combined = result.root;
            });

            return combined;
        } catch (error) {
            console.error('hardWareInfoXMLToObject error : ', error);
            this.manager.emit('renderDeviceError', {
                deviceId: this.id,
                error: error.message,
            });
        }
    }
}

module.exports = MediaDeviceManager;
