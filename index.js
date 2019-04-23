const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

module.exports.startDiscovery = (config) => {
  const {application, version} = config;
  let {port} = config;
  
  if (!port) {
    let hash = 0;
    for (let i = 0; i < application.length; i++) {
      hash = (31 * hash + application.charCodeAt(i)) & 0xffff;
    }
    while ((hash & 0xffff) < 0xff) {
      hash = (hash * 0xffff) & 0xffff;
    }
    port = hash & 0xffff;
  }

  socket.on('error', err => {
    console.error('error in network discovery', err);
    socket.close();
  });

  socket.on('message', (msg, rinfo) => {
    if (msg[0] !== 0xaf || msg[1] !== 0xbf) return; // magic number
    const nameLength = msg.readUInt16BE(2);
    if (nameLength !== application.length) return;
    if (msg.asciiSlice(4, nameLength + 4) !== application) return;
    const versionLength = msg.readUInt16BE(nameLength + 4);
    if (msg.asciiSlice(nameLength + 6, nameLength + 6 + versionLength) !== version) return;
    console.info(`sending response to ${rinfo.address}:${rinfo.port}`);
    socket.send(Buffer.from([0xaf, 0xcf]), rinfo.port, rinfo.address);
  });

  socket.bind(port);
};

