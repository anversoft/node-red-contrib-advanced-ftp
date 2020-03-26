# node-red-contrib-advanced-ftp
A Node-RED node to and Advanced FTP Server

node-red-contrib-advanced-ftp is a modified version of <a href="https://github.com/joeartsea/node-red-contrib-ftp" target="_new">node-red-contrib-ftp</a> with the addition of multiple commands and the possibility to modify the parameters during runtime

Pre-requisites
-------

The node-red-contrib-advanced-ftp requires <a href="http://nodered.org" target="_new">Node-RED</a> to be installed.

Install
-------

Run the following command in the root directory of your Node-RED install

    `npm install node-red-contrib-ftp`

Restart your Node-RED instance, the ftp node appears in the palette and ready for use.

Or use the `Menu - Manage palette` option and search for `node-red-contrib-advanced-ftp`.

Example
---------
```
[{"id":"f3b0d791.c94aa8","type":"inject","z":"e40b45d4.16e328","name":"Send Operation PWD","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":140,"wires":[["594fd1f8.44d368"]]},{"id":"c79bb273.7e9f8","type":"advanced-ftp","z":"e40b45d4.16e328","ftp":"42a903ea.527e3c","operation":"status","filename":"","localFilename":"","workingDir":"","oldPath":"","newPath":"","throwError":false,"showError":true,"name":"","x":880,"y":300,"wires":[["a4bab21e.22c468"]]},{"id":"8fc610d7.ce8f18","type":"inject","z":"e40b45d4.16e328","name":"Send Default Operation","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":420,"y":100,"wires":[["c79bb273.7e9f8"]]},{"id":"a4bab21e.22c468","type":"debug","z":"e40b45d4.16e328","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":1050,"y":300,"wires":[]},{"id":"594fd1f8.44d368","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"pwd\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":140,"wires":[["c79bb273.7e9f8"]]},{"id":"69625dfd.2fa504","type":"inject","z":"e40b45d4.16e328","name":"Send Operation SYSTEM","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":180,"wires":[["22cd548.772ebac"]]},{"id":"22cd548.772ebac","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"system\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":180,"wires":[["c79bb273.7e9f8"]]},{"id":"18051ec6.111841","type":"inject","z":"e40b45d4.16e328","name":"Send Operation LIST","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":220,"wires":[["96f8acb6.808a7"]]},{"id":"96f8acb6.808a7","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"list\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":220,"wires":[["c79bb273.7e9f8"]]},{"id":"6b1b9ce3.228384","type":"inject","z":"e40b45d4.16e328","name":"Send Operation GET","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":260,"wires":[["5c8823bc.65fb9c"]]},{"id":"5c8823bc.65fb9c","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"get\";\nmsg.filename = \"foo.txt\";\nmsg.localFilename = \"bar.txt\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":260,"wires":[["c79bb273.7e9f8"]]},{"id":"fdb2b3a4.46988","type":"inject","z":"e40b45d4.16e328","name":"Send Operation PUT","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":300,"wires":[["443b6266.c2cf94"]]},{"id":"443b6266.c2cf94","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"put\";\nmsg.filename = \"foo.txt\";\nmsg.localFilename = \"bar.txt\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":300,"wires":[["c79bb273.7e9f8"]]},{"id":"f0214f5c.474568","type":"inject","z":"e40b45d4.16e328","name":"Send Operation APPEND","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":340,"wires":[["bfb0c8c5.4092b"]]},{"id":"bfb0c8c5.4092b","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"append\";\nmsg.filename = \"foo.txt\";\nmsg.localFilename = \"bar.txt\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":340,"wires":[["c79bb273.7e9f8"]]},{"id":"c0dc6fbb.76abd","type":"inject","z":"e40b45d4.16e328","name":"Send Operation RENAME","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":380,"wires":[["d457a7d3.764f8"]]},{"id":"d457a7d3.764f8","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"rename\";\nmsg.oldPath = \"foo.txt\";\nmsg.newPath = \"bar.txt\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":380,"wires":[["c79bb273.7e9f8"]]},{"id":"b15fd507.1e184","type":"inject","z":"e40b45d4.16e328","name":"Send Operation DELETE","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":420,"wires":[["89708a8d.6038a8"]]},{"id":"89708a8d.6038a8","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"delete\";\nmsg.filename = \"foo.txt\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":420,"wires":[["c79bb273.7e9f8"]]},{"id":"253a0e82.a6341a","type":"inject","z":"e40b45d4.16e328","name":"Send Operation MKDIR","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":460,"wires":[["4aee2785.c27138"]]},{"id":"24c41fcb.b971","type":"inject","z":"e40b45d4.16e328","name":"Send Operation RMDIR","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":500,"wires":[["6ff3fce8.4743cc"]]},{"id":"4aee2785.c27138","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"mkdir\";\nmsg.path = \"foo\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":460,"wires":[["c79bb273.7e9f8"]]},{"id":"6ff3fce8.4743cc","type":"function","z":"e40b45d4.16e328","name":"","func":"msg.operation = \"rmdir\";\nmsg.path = \"foo\";\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":500,"wires":[["c79bb273.7e9f8"]]},{"id":"42a903ea.527e3c","type":"advanced-ftp-config","z":"","host":"HOST","port":"21","secureOptions":"","user":"username","connTimeout":"","pasvTimeout":"","keepalive":""}]
```

Acknowledgements
----------------

The node-red-contrib-advanced-ftp uses the following open source software:

- [node-ftp](https://github.com/mscdex/node-ftp): node-ftp is an FTP client module for node.js that provides an asynchronous interface for communicating with an FTP server.

License
-------

See [license](https://github.com/anversoft/node-red-contrib-advanced-ftp/blob/master/LICENSE) (Apache License Version 2.0).

Contributing
-------

Both submitting issues to [GitHub issues](https://github.com/anversoft/node-red-contrib-advanced-ftp/issues) and Pull requests are welcome to contribute.
