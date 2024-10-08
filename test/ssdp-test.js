
const { Client } = require('node-ssdp');
const client = new Client();

const IP = process.argv[2];

client.on('response', (headers, code, info) => {
  if (IP) {
    if (info.address === IP) {
      console.log(headers);
    }
    return;
  }

  console.log(info.address, headers);
});

const serviceType = 'ssdp:all';
// client.search(serviceType);
client.search('urn:schemas-upnp-org:service:ContentDirectory:1');
// have to wait for responses
setTimeout(() => {
  console.log('');
}, 5000);
