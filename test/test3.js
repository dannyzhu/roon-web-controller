


const deviceInfo = {
    ipAddress: '192.168.8.58',
    port: '50974',
    descriptionUrl: 'http://192.168.8.58:50974/lightningRender-bc-34-00-a0-71-83/Upnp/device.xml',
};
const MediaDeviceControl = require('./MediaDeviceControl');
const mediaDevice = new MediaDeviceControl(deviceInfo);
await mediaDevice.init();

//======
// 服务类型: urn:openhome-org:service:SubscriptionLongPoll:1, 实例: ServiceClass {
//     serviceType: 'urn:openhome-org:service:SubscriptionLongPoll:1',
//     controlUrl: '/lightningRender-bc-34-00-a0-71-83/openhome.org-SubscriptionLongPoll-1/control',
// 操作列表:
// - 操作: Unsubscribe         , In : [Sid]
// - 操作: Subscribe           , In : [ClientId, Udn, Service, RequestedDuration]
//                               Out: [Sid, Duration]
// - 操作: Renew               , In : [Sid, RequestedDuration]
//                               Out: [Duration]
// - 操作: GetPropertyUpdates  , In : [ClientId]
//                               Out: [Updates]

let serviceSubscriptionLongPoll = mediaDevice.getService('urn:openhome-org:service:SubscriptionLongPoll:1');
ret = await serviceSubscriptionLongPoll.Subscribe('1', 'uuid:lightningRender-bc-34-00-a0-71-83', 'urn:av-openhome-org:service:Product:1', 3600);

//======
// 操作列表:
// - 操作: Manufacturer        , Out: [Name, Info, Url, ImageUri]
// - 操作: Model               , Out: [Name, Info, Url, ImageUri]
// - 操作: Product             , Out: [Room, Name, Info, Url, ImageUri]
// - 操作: Standby             , Out: [Value]
// - 操作: SourceCount         , Out: [Value]
// - 操作: SourceXml           , Out: [Value]
// - 操作: SourceIndex         , Out: [Value]
// - 操作: Attributes          , Out: [Value]
// - 操作: SourceXmlChangeCount, Out: [Value]
// - 操作: SetStandby          , In : [Value]
// - 操作: SetSourceIndex      , In : [Value]
// - 操作: SetSourceIndexByName, In : [Value]
// - 操作: Source              , In : [Index]
//                               Out: [SystemName, Type, Name, Visible]
let serviceProduct = mediaDevice.getService('urn:av-openhome-org:service:Product:1');
let ret = null;
ret = await serviceProduct.Manufacturer(); //Name: [ 'AURALIC' ],
ret = await serviceProduct.Model();//Name: [ 'ALTAIR_G1.1' ],
ret = await serviceProduct.Product(); //  Room: [ 'AuralicG1.1' ], Name: [ 'ALTAIR_G1.1' ],
ret = await serviceProduct.Standby(); //Value: [ '1' ]
ret = await serviceProduct.SourceCount();//Value: [ '140' ]
ret = await serviceProduct.SourceXml(); //source xml
ret = await serviceProduct.SourceIndex(); //Value: [ '1' ]
ret = await serviceProduct.Attributes();
ret = await serviceProduct.SourceXmlChangeCount(); //Value: [ '336' ]
ret = await serviceProduct.Source({ Index: 6 });

//=====
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Pause               , 无参数
// - 操作: Stop                , 无参数
// - 操作: Next                , 无参数
// - 操作: Previous            , 无参数
// - 操作: DeleteAll           , 无参数
// - 操作: Repeat              , Out: [Value]
// - 操作: Shuffle             , Out: [Value]
// - 操作: TransportState      , Out: [Value]
// - 操作: Id                  , Out: [Value]
// - 操作: TracksMax           , Out: [Value]
// - 操作: IdArray             , Out: [Token, Array]
// - 操作: ProtocolInfo        , Out: [Value]
// - 操作: SetRepeat           , In : [Value]
// - 操作: SetShuffle          , In : [Value]
// - 操作: SeekSecondAbsolute  , In : [Value]
// - 操作: SeekSecondRelative  , In : [Value]
// - 操作: SeekId              , In : [Value]
// - 操作: SeekIndex           , In : [Value]
// - 操作: DeleteId            , In : [Value]
// - 操作: Read                , In : [Id]
//                               Out: [Uri, Metadata]
// - 操作: ReadList            , In : [IdList]
//                               Out: [TrackList]
// - 操作: SimpleReadList      , In : [IdList]
//                               Out: [TrackList]
// - 操作: Insert              , In : [AfterId, Uri, Metadata]
//                               Out: [NewId]
// - 操作: BatchInsert         , In : [AfterId, SongList]
//                               Out: [NewId]
// - 操作: IdArrayChanged      , In : [Token]
//                               Out: [Value]
let servicePlaylist = mediaDevice.getService('urn:av-openhome-org:service:Playlist:1');
ret = await servicePlaylist.Repeat();
ret = await servicePlaylist.Shuffle();
ret = await servicePlaylist.TransportState();
ret = await servicePlaylist.Id();
ret = await servicePlaylist.TracksMax();
ret = await servicePlaylist.IdArray();
ret = await servicePlaylist.ProtocolInfo();

//======
// 操作列表:
// - 操作: GetProtocolInfo     , Out: [Source, Sink]
// - 操作: GetCurrentConnectionIDs, Out: [ConnectionIDs]
// - 操作: ConnectionComplete  , In : [ConnectionID]
// - 操作: PrepareForConnection, In : [RemoteProtocolInfo, PeerConnectionManager, PeerConnectionID, Direction]
//                               Out: [ConnectionID, AVTransportID, RcsID]
// - 操作: GetCurrentConnectionInfo, In : [ConnectionID]
//                               Out: [RcsID, AVTransportID, ProtocolInfo, PeerConnectionManager, PeerConnectionID, Direction, Status]

let serviceConnectionManager = mediaDevice.getService('urn:schemas-upnp-org:service:ConnectionManager:1');
ret = await serviceConnectionManager.GetProtocolInfo();
ret = await serviceConnectionManager.GetCurrentConnectionIDs();

//=====
// 操作列表:
// - 操作: SetMute             , In : [InstanceID, Channel, DesiredMute]
// - 操作: SetVolume           , In : [InstanceID, Channel, DesiredVolume]
// - 操作: GetMute             , In : [InstanceID, Channel]
//                               Out: [CurrentMute]
// - 操作: GetVolume           , In : [InstanceID, Channel]
//                               Out: [CurrentVolume]
// urn:schemas-upnp-org:service:RenderingControl:1

//======
// 操作列表:
// - 操作: Time                , Out: [TrackCount, Duration, Seconds]
let serviceTime = mediaDevice.getService('urn:av-openhome-org:service:Time:1');
ret = await serviceTime.Time(); //连续播放时间

//======
// 操作列表:
// - 操作: Counters            , Out: [TrackCount, DetailsCount, MetatextCount]
// - 操作: Track               , Out: [Uri, Metadata]
// - 操作: Details             , Out: [Duration, BitRate, BitDepth, SampleRate, Lossless, CodecName]
// - 操作: Metatext            , Out: [Value]
let serviceInfo = mediaDevice.getService('urn:av-openhome-org:service:Info:1');

ret = await serviceInfo.Counters();
ret = await serviceInfo.Track(); //当前歌曲信息 xml
ret = await serviceInfo.Details(); //采样率等   Duration: [ '0' ], BitRate: [ '0' ],BitDepth: [ '32' ],SampleRate: [ '44100' ],Lossless: [ '0' ],
ret = await serviceInfo.Metatext();

//=====
// 操作列表:
// - 操作: GetGroupMode        , Out: [GroupMode, GroupID, GroupName]
// - 操作: GetGroupVolume      , Out: [GroupVolume]
// - 操作: GetGroupMute        , Out: [GroupMute]
// - 操作: GetGroupStatus      , Out: [GroupStatus]
// - 操作: GetBitPerfectMode   , Out: [BitPerfectMode]
// - 操作: SetGroupMode        , In : [GroupMode, GroupID, GroupName]
// - 操作: SetGroupVolume      , In : [GroupVolume]
// - 操作: SetGroupMute        , In : [GroupMute]
// - 操作: SetBitPerfectMode   , In : [BitPerfectMode]
let serviceGroupConfig = mediaDevice.getService('urn:av-openhome-org:service:GroupConfig:1');

ret = await serviceGroupConfig.GetGroupMode();
ret = await serviceGroupConfig.GetGroupVolume();
ret = await serviceGroupConfig.GetGroupMute();
ret = await serviceGroupConfig.GetGroupStatus();
ret = await serviceGroupConfig.GetBitPerfectMode();

//======
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Pause               , 无参数
// - 操作: Stop                , 无参数
// - 操作: Next                , 无参数
// - 操作: Previous            , 无参数
// - 操作: TransportState      , Out: [Value]
// - 操作: SeekSecondAbsolute  , In : [Value]
// - 操作: SeekSecondRelative  , In : [Value]
// - 操作: SetThumbRating      , In : [ThumbRating]
// - 操作: Insert              , In : [AfterId, Uri, Metadata]
//                               Out: [NewId]
//urn:av-openhome-org:service:MusicStation:1
let serviceMusicStation = mediaDevice.getService('urn:av-openhome-org:service:MusicStation:1');
ret = await serviceMusicStation.TransportState();

//======
// 操作列表:
// - 操作: SetAVTransportURI   , In : [InstanceID, CurrentURI, CurrentURIMetaData]
// - 操作: SetNextAVTransportURI, In : [InstanceID, NextURI, NextURIMetaData]
// - 操作: Stop                , In : [InstanceID]
// - 操作: Play                , In : [InstanceID, Speed]
// - 操作: Pause               , In : [InstanceID]
// - 操作: Seek                , In : [InstanceID, Unit, Target]
// - 操作: Next                , In : [InstanceID]
// - 操作: Previous            , In : [InstanceID]
// - 操作: SetPlayMode         , In : [InstanceID, NewPlayMode]
// - 操作: GetDeviceCapabilities, In : [InstanceID]
//                               Out: [PlayMedia, RecMedia, RecQualityModes]
// - 操作: GetMediaInfo        , In : [InstanceID]
//                               Out: [NrTracks, MediaDuration, CurrentURI, CurrentURIMetaData, NextURI, NextURIMetaData, PlayMedium, RecordMedium, WriteStatus]
// - 操作: GetTransportInfo    , In : [InstanceID]
//                               Out: [CurrentTransportState, CurrentTransportStatus, CurrentSpeed]
// - 操作: GetPositionInfo     , In : [InstanceID]
//                               Out: [Track, TrackDuration, TrackMetaData, TrackURI, RelTime, AbsTime, RelCount, AbsCount]
// - 操作: GetTransportSettings, In : [InstanceID]
//                               Out: [PlayMode, RecQualityMode]
let serviceAVTransport = mediaDevice.getService('urn:schemas-upnp-org:service:AVTransport:1');
ret = await serviceAVTransport.GetDeviceCapabilities({InstanceID: 1});
ret = await serviceAVTransport.GetMediaInfo({InstanceID: 1});
ret = await serviceAVTransport.GetTransportInfo({InstanceID: 1});
ret = await serviceAVTransport.GetPositionInfo({InstanceID: 1});
ret = await serviceAVTransport.GetTransportSettings({InstanceID: 1});

//======
// 操作列表:
// - 操作: GetIds              , Out: [Ids]
// - 操作: GetPublicKey        , Out: [PublicKey]
// - 操作: GetSequenceNumber   , Out: [SequenceNumber]
// - 操作: Set                 , In : [Id, UserName, Password]
// - 操作: Clear               , In : [Id]
// - 操作: SetEnabled          , In : [Id, Enabled]
// - 操作: Get                 , In : [Id]
//                               Out: [UserName, Password, Enabled, Status, Data]
// - 操作: Login               , In : [Id]
//                               Out: [Token]
// - 操作: ReLogin             , In : [Id, CurrentToken]
//                               Out: [NewToken]
let serviceCredentials = mediaDevice.getService('urn:av-openhome-org:service:Credentials:1');
ret = await serviceCredentials.GetIds();
ret = await serviceCredentials.GetPublicKey();
ret = await serviceCredentials.GetSequenceNumber();


//======
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Pause               , 无参数
// - 操作: PlayPause           , 无参数
// - 操作: Stop                , 无参数
// - 操作: Next                , 无参数
// - 操作: Previous            , 无参数
// - 操作: ToggleShuffle       , 无参数
// - 操作: ToggleLoop          , 无参数
// - 操作: Repeat              , Out: [Value]
// - 操作: Shuffle             , Out: [Value]
// - 操作: TransportState      , Out: [Value]
// - 操作: SeekSecondAbsolute  , In : [Value]
// - 操作: SeekSecondRelative  , In : [Value]
let serviceRoon = mediaDevice.getService('urn:av-openhome-org:service:Roon:1');
ret = await serviceRoon.Repeat(); //Value: [ '0' ]
ret = await serviceRoon.Shuffle(); //Value: [ '1' ]
ret = await serviceRoon.TransportState(); //Value: [ 'Playing' ]
ret = await serviceRoon.ToggleShuffle();

//====
// 操作列表:
// - 操作: VolumeInc           , 无参数
// - 操作: VolumeDec           , 无参数
// - 操作: Characteristics     , Out: [VolumeMax, VolumeUnity, VolumeSteps, VolumeMilliDbPerStep, BalanceMax, FadeMax]
// - 操作: Volume              , Out: [Value]
// - 操作: Mute                , Out: [Value]
// - 操作: VolumeLimit         , Out: [Value]
// - 操作: SetVolume           , In : [Value]
// - 操作: CanSetVolume        , In : [Value]
// - 操作: SetMute             , In : [Value]
// - 操作: CanSetMute          , In : [Value]
let serviceVolume = mediaDevice.getService('urn:av-openhome-org:service:Volume:1');
ret = await serviceVolume.Characteristics(); //  VolumeMax: [ '100' ], VolumeUnity: [ '80' ],
// VolumeSteps: [ '100' ],
// VolumeMilliDbPerStep: [ '1024' ],
// BalanceMax: [ '0' ],
// FadeMax: [ '0' ]
// ---
ret = await serviceVolume.Volume(); //Value: [ '68' ] 
ret = await serviceVolume.Mute(); //Value: [ '0' ]
ret = await serviceVolume.VolumeLimit(); //Value: [ '100' ]
ret = await serviceVolume.VolumeDec()

//====
// 操作列表:
// - 操作: GetMessage          , Out: [Message, MessageID]
let serviceMessageCenter = mediaDevice.getService('urn:av-openhome-org:service:MessageCenter:1');
ret = await serviceMessageCenter.GetMessage();

//====
// 操作列表:
// - 操作: Update              , 无参数
// - 操作: CheckUpdate         , 无参数
// - 操作: ResetDisplay        , 无参数
// - 操作: IsAlive             , Out: [Alive]
// - 操作: GetActiveStatus     , Out: [ActiveStatus]
// - 操作: GetVolumeControl    , Out: [VolumeControl]
// - 操作: GetPasswordProtect  , Out: [Protect, ProtectPassword]
// - 操作: GetHardWareInfo     , Out: [HardWareInfo]
// - 操作: GetOutChannel       , Out: [ChannelNum, CurrentChannel, OutChannel]
// - 操作: GetUpnpType         , Out: [UpnpType]
// - 操作: GetNetInterface     , Out: [InterfaceNum, CurrentUse, InterfaceList]
// - 操作: GetWaitingTime      , Out: [WaitingTime]
// - 操作: GetUpdateInfo       , Out: [Version, Progress]
// - 操作: GetHaltStatus       , Out: [HaltStatus]
// - 操作: GetSourceVisible    , Out: [VisibleInfo]
// - 操作: LogOut              , In : [ServiceName]
// - 操作: CancelLogIn         , In : [ServiceName]
// - 操作: Active              , In : [IsSubscribe, RealName, Email]
// - 操作: SetVolumeControl    , In : [VolumeControl]
// - 操作: SetPasswordProtect  , In : [Protect, ProtectPassword]
// - 操作: SetRoomName         , In : [RoomName]
// - 操作: SetOutChannel       , In : [Channel]
// - 操作: SetUpnpType         , In : [UpnpType]
// - 操作: SetNetWork          , In : [InterFace, IpAddress, NetMask, GateWay, DNS, Ssid, PassWord, EncrypType]
// - 操作: SetWaitingTime      , In : [WaitingTime]
// - 操作: SetHaltStatus       , In : [HaltStatus]
// - 操作: SetSourceVisible    , In : [SourceName, Visible]
// - 操作: SetFilterMode       , In : [FilterMode]
// - 操作: SetEnableResampler  , In : [EnableResampler]
// - 操作: SetEnableSpeaker    , In : [EnableSpeaker]
// - 操作: SetEnableEqualizer  , In : [EnableEqualizer]
// - 操作: SetEnableDirac      , In : [EnableDirac]
// - 操作: LogIn               , In : [ServiceName, MessageIn]
//                               Out: [MessageOut]
// - 操作: GetWirelessList     , In : [InterFace]
//                               Out: [Number, CurrentUse, WirelessList]
// - 操作: GetIpAddress        , In : [InterFace]
//                               Out: [IpAddress, NetMask, GateWay, DNS, DHCP]
let serviceHardwareConfig = mediaDevice.getService('urn:av-openhome-org:service:HardwareConfig:1');
ret = await serviceHardwareConfig.IsAlive(); //Alive: [ '1' ]
ret = await serviceHardwareConfig.GetActiveStatus(); //ActiveStatus: [ '' ]
ret = await serviceHardwareConfig.GetVolumeControl();//VolumeControl: [ '0' ]
ret = await serviceHardwareConfig.GetPasswordProtect();
ret = await serviceHardwareConfig.GetHardWareInfo(); //xml  HardWareInfo: ['xml']
ret = await serviceHardwareConfig.GetOutChannel();//xml OutChannel: ['<Channel><Device>hw:0,0</Device><Name>ALTAIR G1 USB Audio 2.0</Name></Channel>']
ret = await serviceHardwareConfig.GetUpnpType();
ret = await serviceHardwareConfig.GetWaitingTime(); //WaitingTime: [ '0' ]
ret = await serviceHardwareConfig.GetUpdateInfo(); //  Version: [ '10.0.4' ], Progress: [ '100%' ]
ret = await serviceHardwareConfig.GetHaltStatus(); //HaltStatus: [ '0' ]
ret = await serviceHardwareConfig.GetSourceVisible();//xml 'VisibleInfo': '<LIST><SOURCE>AirPlay</SOURCE><VISIBLE>true</VISIBLE><SOURCE>Bluetooth</SOURCE><VISIBLE>true</VISIBLE><SOURCE>Roon Ready</SOURCE><VISIBLE>true</VISIBLE></LIST>'

ret = await serviceHardwareConfig.GetNetInterface();//xml '<interface><name>eth0</name><type>wired</type></interface><interface><name>wlan0</name><type>wireless</type></interface>'
ret = await serviceHardwareConfig.GetWirelessList({ InterFace: 'wlan0' }); //xml
ret = await serviceHardwareConfig.GetIpAddress({ InterFace: 'wlan0' }); //xml

//=====
// 操作列表:
// - 操作: GetProcessorConfig  , Out: [ProcessorConfig]
// - 操作: SetProcessorConfig  , In : [ProcessorConfig]
let serviceWebProcessorConfig = mediaDevice.getService('urn:av-openhome-org:service:WebProcessorConfig:1');
ret = await serviceWebProcessorConfig.GetProcessorConfig();//xml long content

//====
// 操作列表:
// - 操作: GetRendererConfig   , Out: [RendererConfig]
// - 操作: SetRendererConfig   , In : [RendererConfig]
let serviceWebRendererConfig = mediaDevice.getService('urn:av-openhome-org:service:WebRendererConfig:1');
ret = await serviceWebRendererConfig.GetRendererConfig();//xml

//====
// 操作列表:
// - 操作: GetDeviceConfig     , Out: [DeviceConfig]
// - 操作: GetWiFiList         , Out: [WiFiList]
// - 操作: GetServiceLocation  , Out: [ServiceLoaction]
// - 操作: SetDeviceConfig     , In : [DeviceConfig]
// - 操作: SetTimeZone         , In : [TimeZone, CurrentTime, TimeStamp]
let serviceWebDeviceConfig = mediaDevice.getService('urn:av-openhome-org:service:WebDeviceConfig:1');
ret = await serviceWebDeviceConfig.GetDeviceConfig(); //xml
ret = await serviceWebDeviceConfig.GetWiFiList(); //xml
ret = await serviceWebDeviceConfig.GetServiceLocation(); //xml

//======
// 操作列表:
// - 操作: GetDACConfig        , Out: [DACConfig]
// - 操作: SetDACConfig        , In : [DACConfig]
let serviceWebDACConfig = mediaDevice.getService('urn:av-openhome-org:service:WebDACConfig:1');
ret = await serviceWebDACConfig.GetDACConfig();

//======
// 操作列表:
// - 操作: GetEntireInfo       , Out: [Info]
let serviceRenderingInfo = mediaDevice.getService('urn:av-openhome-org:service:RenderingInfo:1');
ret = await serviceRenderingInfo.GetEntireInfo();//json string


//===
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Pause               , 无参数
// - 操作: Stop                , 无参数
// - 操作: Next                , 无参数
// - 操作: Previous            , 无参数
// - 操作: ToggleShuffle       , 无参数
// - 操作: ToggleLoop          , 无参数
// - 操作: RequestMetadata     , 无参数
// - 操作: TransportState      , Out: [Value]
// - 操作: SeekSecondAbsolute  , In : [Value]
let serviceTidalConnect = mediaDevice.getService('urn:av-openhome-org:service:TidalConnect:1');
ret = await serviceTidalConnect.TransportState();

//===
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Pause               , 无参数
// - 操作: Next                , 无参数
// - 操作: Previous            , 无参数
// - 操作: TransportState      , Out: [Value]
let serviceSpotify = mediaDevice.getService('urn:av-openhome-org:service:Spotify:1');
ret = await serviceSpotify.TransportState();

//===
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Pause               , 无参数
// - 操作: Next                , 无参数
// - 操作: Previous            , 无参数
// - 操作: TransportState      , Out: [Value]
let serviceAirplay = mediaDevice.getService('urn:av-openhome-org:service:Airplay:1');
ret = await serviceAirplay.TransportState();

//==
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Pause               , 无参数
// - 操作: Stop                , 无参数
// - 操作: Next                , 无参数
// - 操作: Previous            , 无参数
// - 操作: TransportState      , Out: [Value]
let serviceBluetooth = mediaDevice.getService('urn:av-openhome-org:service:Bluetooth:1');
ret = await serviceBluetooth.TransportState();

//===
// 操作列表:
// - 操作: Play                , 无参数
// - 操作: Stop                , 无参数
// - 操作: Sender              , Out: [Uri, Metadata]
// - 操作: TransportState      , Out: [Value]
// - 操作: SetSender           , In : [Uri, Metadata]
let serviceInternetRadio = mediaDevice.getService('urn:av-openhome-org:service:InternetRadio:1');
ret = await serviceInternetRadio.TransportState();