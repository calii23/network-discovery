#!/usr/bin/env node
if (process.argv.length !== 4 && process.argv.length !== 6) {
  console.error(`Usage: ${process.argv[0]} ${process.argv[1]} [application] [version] {server port} {client port}`);
  process.exit(-1);
}

const application = process.argv[2];
const version = process.argv[3];

let serverPort = parseInt(process.argv[4]);
let clientPort = parseInt(process.argv[5]);
if (!serverPort || !clientPort) {
  let hash = 0;
  for (let i = 0; i < application.length; i++) {
    hash = (31 * hash + application.charCodeAt(i)) & 0xffff;
  }
  while ((hash & 0xffff) < 0xff) {
    hash = (hash * 0xffff) & 0xffff;
  }
  serverPort = hash & 0xffff;
  while ((hash & 0xffff) < 0xff || (hash & 0xffff) === serverPort) {
    hash = (hash * 0xffff) & 0xffff;
  }
  clientPort = hash & 0xffff;
}

const dgram = require('dgram');
const os = require('os');
const socket = dgram.createSocket('udp4');

let interval;

socket.on('message', (msg, rinfo) => {
  if (msg.length !== 2 || msg[0] !== 0xaf || msg[1] !== 0xcf) return;
  console.log(rinfo.address);
  socket.close();
  clearInterval(interval);
});

socket.on('listening', () => {
  socket.setBroadcast(true);
  const message = Buffer.alloc(application.length + version.length + 6);
  message.writeUInt8(0xaf, 0);
  message.writeUInt8(0xbf, 1);
  message.writeUInt16BE(application.length, 2);
  message.write(application, 4);
  message.writeUInt16BE(version.length, application.length + 4);
  message.write(version, application.length + 6);
  getBroadcastAddresses().forEach(address => socket.send(message, serverPort, address));
  interval = setInterval(() => getBroadcastAddresses().forEach(address => socket.send(message, serverPort, address)), 1000);
});

socket.bind(clientPort);

function getBroadcastAddresses() {
  let result = [];
  let interfaces = os.networkInterfaces();
  for (let i in interfaces) {
    for (let data of interfaces[i]) {
      if (data.family !== 'IPv4') continue;
      if (data.address === '127.0.0.1') continue;
      const address = data.address.split('.').map(e => parseInt(e));
      const netmask = data.netmask.split('.').map(e => parseInt(e));
      result.push(address.map((e, i) => (~netmask[i] & 0xff) | e).join('.'))
    }
  }
  return result;
}

