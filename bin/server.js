#!/usr/bin/env node
if (process.argv.length !== 4) {
  console.error(`Usage: ${process.argv[0]} ${process.argv[1]} [name] [version]`);
  process.exit(-1);
}

const application = process.argv[2];
const version = process.argv[3];

const {startDiscovery} = require('../index.js');
startDiscovery({application, version});
