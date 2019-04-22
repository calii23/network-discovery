#!/usr/bin/env node
if (process.argv.length !== 3) {
  console.error(`Usage: ${process.argv[0]} ${process.argv[1]} [config_file]`);
  process.exit(-1);
}

const fs = require('fs');

const configFile = process.argv[2]
if (!fs.existsSync(configFile)) {
  console.error(`${process.argv[1]}: ${configFile}: no such file or directory`);
  process.exit(1);
}

try {
  fs.accessSync(configFile, fs.constants.R_OK);
} catch (e) {
  console.error(`${process.argv[1]}: ${configFile}: Permission denied`);
  process.exit(1);
}

if (!fs.lstatSync(configFile).isFile()) {
  console.error(`${process.argv[1]}: ${configFile}: Is a directory`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configFile).toString());

const {application, version, userData} = config;
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

const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

socket.on('error', err => {
  console.error('socket error', err);
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

socket.on('listening', () => {
  const address = socket.address();
  console.info(`socket listening ${address.address}:${address.port}`);
});

socket.bind(port);

