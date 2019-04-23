# network-discovery
This is a lightweight service which can be used to find a service in a network.
## CLI Usage
There is a server which provides a simple REST API. On that server the discovery service
must be started:
```bash
discovery-service simple-api 1.0
```
Now on any other device in the same network, this service can be found with:
```bash
discover-service simple-api 1.0
```
## Node Module Usage
This service can also be integrated in any node application.
Just install it:
```bash
npm install --save network-discovery
```
And then start the discovery service with:
```javascript
const {startDiscovery} = require('network-discovery');
startDiscovery({application: 'simple-api', version: '1.0'});
```
Now the server can be found by the CLI.
## Protocol
The protocol is very simple. It just listen to an UDP port. The client sends a datagram
to the network broadcaster. When the server receive a datagram with the same application
name and the same version, the server will response to the address and port where the
datagram came from.
### Packet
The structure of the packet is as the following:
* 2 bytes magic number: 0xaf 0xbf
* 2 bytes length of application name (big endian)
* application name in ascii
* 2 bytes length of version (big endian)
* version in ascii
And the response:
* 2 bytes magic number: 0xaf 0xcf
