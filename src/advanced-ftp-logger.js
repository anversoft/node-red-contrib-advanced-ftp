/**
 * Copyright 2020 Andrea Verardi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
    'use strict'
    var ftp = require('ftp');
    var fs = require('fs-extra');

    //Funzione del nodo
    function AdvancedFtpLoggerNode(n) {
        RED.nodes.createNode(this, n);

        //Imposta le variabili locali
        this.ftp = n.ftp;
        this.localDirectory = n.localDirectory;
        this.ftpDirectory = n.ftpDirectory;
        this.ftpFilename = n.ftpFilename;
        this.maxFiles = n.maxFiles;
        this.maxFileSize = n.maxFileSize;
        this.fileSizeDim = n.fileSizeDim;
        this.includeTimestamps = n.includeTimestamps;
        this.throwError = n.throwError
        this.showError = n.showError;
        this.ftpConfig = RED.nodes.getNode(this.ftp);

        this.status({});

        //Se la configurazione è presente continua
        if (this.ftpConfig) {
            var node = this;
            node.on('input', function (msg, send, done) {

                //Crea un costruttore per il server ftp
                var conn = new ftp();

                //#region VARIABILI LOCALI

                //Il msg.includeTimestamps è prioritario sul includeTimestamps impostato nel nodo NON IMPLEMETATO
                var includeTimestamps = node.includeTimestamps;

                if ((msg.includeTimestamps !== undefined) && (typeof msg.includeTimestamps === 'boolean')) {
                    includeTimestamps = msg.includeTimestamps;
                }

                //Il msg.showError è prioritario sul showError impostato nel nodo
                var showError = node.showError;

                if ((msg.showError !== undefined) && (typeof msg.showError === 'boolean')) {
                    showError = msg.showError;
                }

                //Il msg.throwError è prioritario sul throwError impostato nel nodo
                var throwError = node.throwError;

                if ((msg.throwError !== undefined) && (typeof msg.throwError === 'boolean')) {
                    throwError = msg.throwError;
                }

                //Il msg.localDirectory è prioritario sul localDirectory impostato nel nodo
                var localDirectory = msg.localDirectory || node.localDirectory || '/';
                if (typeof localDirectory != 'string') {
                    localDirectory = '/';
                }

                //Il msg.ftpDirectory è prioritario sul ftpDirectory impostato nel nodo
                var ftpDirectory = msg.ftpDirectory || node.ftpDirectory || '';
                if (typeof ftpDirectory != 'string') {
                    ftpDirectory = '';
                }

                //Il msg.ftpFilename è prioritario sul ftpFilename impostato nel nodo
                var ftpFilename = msg.ftpFilename || node.ftpFilename || '';
                if (typeof ftpFilename != 'string') {
                    ftpFilename = 'data#';
                }

                let fileReg = new RegExp(/^([a-zA-Z]{1,14}#{1})$/);

                if(!fileReg.test(ftpFilename)){
                    if (throwError) node.error("msg.ftpFilename invalid format");
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Parameters" });
                    return;
                }

                //Il msg.maxFiles è prioritario sul maxFiles impostato nel nodo
                var maxFiles = msg.maxFiles || parseInt(node.maxFiles);
                if (typeof maxFiles != 'number') {
                    if (throwError) node.error("msg.maxFiles must be a Number");
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Parameters" });
                    return;
                } else if ((maxFiles < 1) || (maxFiles > 100)) {
                    if (throwError) node.error("msg.maxFiles must be between 1 and 100");
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Parameters" });
                    return;
                }

                //Il msg.maxFileSize è prioritario sul maxFileSize impostato nel nodo
                var maxFileSize = msg.maxFileSize || parseInt(node.maxFileSize);
                if (typeof maxFileSize != 'number') {
                    if (throwError) node.error("msg.maxFileSize must be a Number");
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Parameters" });
                    return;
                } else if ((maxFileSize < 1) || (maxFileSize > 1024)) {
                    if (throwError) node.error("msg.maxFileSize must be between 1 and 1024");
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Parameters" });
                    return;
                }

                //Il msg.fileSizeDim è prioritario sul fileSizeDim impostato nel nodo

                var fileSizeDim = msg.fileSizeDim || node.fileSizeDim || '';
                if (typeof fileSizeDim != 'string') {
                    if (throwError) node.error("msg.fileSizeDim must be a String");
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Parameters" });
                    return;
                } else if ((fileSizeDim !== 'b') && (fileSizeDim !== 'kb') && (fileSizeDim !== 'mb') && (fileSizeDim !== 'gb')) {
                    if (throwError) node.error("Incorrect msg.fileSizeDim format: " + fileSizeDim);
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Parameters" });
                    return;
                }

                //#endregion 

                // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                send = send || function () { node.send.apply(node, arguments) }

                node.status({ fill: 'blue', shape: 'ring', text: "Connecting: " + node.ftpConfig.options.host + ':' + node.ftpConfig.options.port });

                //#region Funzioni Server FTP

                function listDeleteLastFileAndPutNew(path, end) {
                    conn.list(ftpDirectory, (err, res) => {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: 'FTP List Failed' });
                            conn.end();
                            return;
                        }

                        let _elements = [];
                        let _masterfound = false;

                        let comp = ftpFilename.slice(0, -1);
                        let regsting = "^((" + comp + ")[0-9]{1,3})$";
                        let reg = new RegExp(regsting);

                        //Trova tutti i file con il nome impostato
                        if (res.length > 0) {

                            for (let x in res) {

                                if (reg.test((res[x].name).substring(0, res[x].name.indexOf('.'))) && res[x].type === "-") {


                                    let filenum = (res[x].name).substring(0, res[x].name.indexOf('.')).substring(comp.length);

                                    let c = {
                                        num: parseInt(filenum),
                                        master: ((res[x].name).substring(0, res[x].name.indexOf('.')) === (comp + "0")) ? true : false,
                                        index: x,
                                        data: res[x]
                                    }

                                    //Trova il master
                                    if (!_masterfound) _masterfound = c.master;

                                    _elements.push(c);
                                }
                            }

                            _elements.sort(function (a, b) {
                                return a.num - b.num;
                            });

                            if (_elements.length > 0) {

                                node.status({ fill: 'blue', shape: 'ring', text: "FTP Delete: " + _elements[_elements.length - 1].data.name });
                                conn.delete(_elements[_elements.length - 1].data.name, (err) => {

                                    node.status({ fill: 'green', shape: 'ring', text: "Delete: " + _elements[_elements.length - 1].data.name + " Complete" });

                                    let ftppath = ftpDirectory + "/" + ftpFilename.replace('#', '0') + ".txt";

                                    putFile(path, ftppath, true);

                                });
                            }

                        }


                    })
                }

                function listPutFileAndRename(path) {
                    conn.list(ftpDirectory, (err, res) => {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: 'FTP List Failed' });
                            conn.end();
                            return;
                        }

                        let _elements = [];
                        let _masterfound = false;

                        let comp = ftpFilename.slice(0, -1);
                        let regsting = "^((" + comp + ")[0-9]{1,3})$";
                        let reg = new RegExp(regsting);

                        //Trova tutti i file con il nome impostato
                        if (res.length > 0) {

                            for (let x in res) {

                                if (reg.test((res[x].name).substring(0, res[x].name.indexOf('.'))) && res[x].type === "-") {


                                    let filenum = (res[x].name).substring(0, res[x].name.indexOf('.')).substring(comp.length);

                                    let c = {
                                        num: parseInt(filenum),
                                        master: ((res[x].name).substring(0, res[x].name.indexOf('.')) === (comp + "0")) ? true : false,
                                        index: x,
                                        data: res[x]
                                    }

                                    //Trova il master
                                    if (!_masterfound) _masterfound = c.master;

                                    _elements.push(c);
                                }
                            }

                            _elements.sort(function (a, b) {
                                return a.num - b.num;
                            });

                            if (_elements.length > 0) {
                                for (var el in _elements) {
                                    let ind = (_elements.length - 1) - parseInt(el) + 1;

                                    let back = (_elements.length - 1) - parseInt(el);

                                    if (reg.test((_elements[back].data.name).substring(0, _elements[back].data.name.indexOf('.'))) && _elements[back].data.type === "-") {

                                        node.status({ fill: 'blue', shape: 'ring', text: "Rename: " + (ftpDirectory + "/" + _elements[back].data.name) + " to " + (ftpDirectory + "/" + ftpFilename.replace('#', (ind).toString()) + ".txt") });

                                        let newName = ftpFilename.replace('#', (ind).toString()) + ".txt";

                                        renameFile((ftpDirectory + "/" + _elements[back].data.name), (ftpDirectory + "/" + ftpFilename.replace('#', (ind).toString()) + ".txt"), true);
                                    }

                                }
                            }

                            //Crea il file Master
                            let ftppath = ftpDirectory + "/" + ftpFilename.replace('#', '0') + ".txt";

                            node.status({ fill: 'blue', shape: 'ring', text: "FTP Put: " + path + " to " + ftppath });
                            conn.put(path, ftppath, (err) => {
                                if (err) {
                                    if (done) {
                                        // Node-RED 1.0 compatible
                                        if (throwError) done(err);
                                    } else {
                                        // Node-RED 0.x compatible
                                        if (throwError) node.error(err, msg);
                                    }
                                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "FTP Put failed from: " + path + " to " + ftppath });
                                    conn.end();
                                    return;
                                }

                                node.status({ fill: 'green', shape: 'ring', text: "FTP Put: " + path + " to " + ftppath + "Complete" });

                                conn.end();

                            });



                        }


                    });

                    return;
                }

                function listAndOrdFiles(end, offset) {
                    conn.list(ftpDirectory, (err, res) => {

                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'yellow', shape: 'ring', text: 'FTP List Failed, Create new Directory' });
                            conn.end();
                            return;
                        }

                        let _elements = [];
                        let _masterfound = false;

                        let comp = ftpFilename.slice(0, -1);
                        let regsting = "^((" + comp + ")[0-9]{1,3})$";
                        let reg = new RegExp(regsting);

                        //Trova tutti i file con il nome impostato
                        if (res.length > 0) {

                            for (let x in res) {

                                if (reg.test((res[x].name).substring(0, res[x].name.indexOf('.'))) && res[x].type === "-") {


                                    let filenum = (res[x].name).substring(0, res[x].name.indexOf('.')).substring(comp.length);

                                    let c = {
                                        num: parseInt(filenum),
                                        master: ((res[x].name).substring(0, res[x].name.indexOf('.')) === (comp + "0")) ? true : false,
                                        index: x,
                                        data: res[x]
                                    }

                                    //Trova il master
                                    if (!_masterfound) _masterfound = c.master;

                                    _elements.push(c);
                                }
                            }

                            _elements.sort(function (a, b) {
                                return a.num - b.num;
                            });

                            if (_elements.length > 0) {
                                for (var el in _elements) {
                                    let ind = (_elements.length - 1) - parseInt(el) + offset;

                                    let back = (_elements.length - 1) - parseInt(el);

                                    if (reg.test((_elements[back].data.name).substring(0, _elements[back].data.name.indexOf('.'))) && _elements[back].data.type === "-") {

                                        let conend = ((el + 1) >= _elements.length) ? true : false;

                                        if (!end) {
                                            conend = false;
                                        }

                                        renameFile((ftpDirectory + "/" + _elements[back].data.name), (ftpDirectory + "/" + ftpFilename.replace('#', (ind).toString()) + ".txt"), conend);
                                    }

                                }
                            }



                        }


                    });

                    return;
                }

                function renameFile(oldPath, newPath, end, errors) {
                    node.status({ fill: 'blue', shape: 'ring', text: "FTP Rename: " + oldPath + " to " + newPath });
                    conn.rename(oldPath, newPath, (err) => {
                        if (err && errors) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: "FTP Rename failed from: " + oldPath + " to " + newPath });
                            if (end === true) conn.end();
                            return;
                        }

                        node.status({ fill: 'green', shape: 'ring', text: "FTP Append: " + oldPath + " to " + newPath + " Complete" });

                        if (end === true) conn.end();
                    });


                }

                function putFile(local, ftp, end) {
                    node.status({ fill: 'blue', shape: 'ring', text: "FTP Put: " + local + " to " + ftp });
                    conn.put(local, ftp, (err) => {

                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: "FTP Put failed from: " + local + " to " + ftp });
                            conn.end();
                            return;
                        }

                        node.status({ fill: 'green', shape: 'ring', text: "FTP Put: " + local + " to " + ftp + " Complete" });

                        if (end === true) conn.end();

                    });
                }

                function appendFile(local, ftp, end) {
                    node.status({ fill: 'blue', shape: 'ring', text: "FTP Append: " + local + " to " + ftp });
                    conn.append(local, ftp, (err) => {

                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: "FTP Append failed from: " + local + " to " + ftp });
                            conn.end();
                            return;
                        }

                        node.status({ fill: 'green', shape: 'ring', text: "FTP Append: " + local + " to " + ftp + " Complete" });
                        if (end === true) conn.end();

                    });
                }

                function deleteFile(ftp, end) {
                    node.status({ fill: 'blue', shape: 'ring', text: "FTP Delete: " + ftp });
                    conn.delete(ftp, (err) => {

                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: "FTP Remove failed: " + ftp });
                            conn.end();
                            return;
                        }

                        node.status({ fill: 'green', shape: 'ring', text: "FTP Delete: " + ftp + " Complete" });
                        if (end === true) conn.end();

                    });
                }



                //#endregion

                //#region CONNESSIONE AL SERVER FTP

                //Il Server FTP è collegato e funzionante
                conn.on('ready', function () {

                    //#region VERIFICA LA PRESENZA DEI FILE
                    //Verifica la presenza del file locale

                    node.status({ fill: 'green', shape: 'ring', text: "Ready" });

                    var localpath = msg.filename || (localDirectory + "/data.txt");

                    try {
                        if (fs.pathExistsSync(localpath)) {
                            node.status({ fill: 'blue', shape: 'ring', text: "Local Directory Exist" });
                        } else {
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: "No such file: " + localpath });
                            if (throwError) node.error("No such file: " + localpath);
                            conn.end();
                            return;
                        }
                    } catch (err) {
                        if (done) {
                            // Node-RED 1.0 compatible
                            if (throwError) done(err);
                        } else {
                            // Node-RED 0.x compatible
                            if (throwError) node.error(err, msg);
                        }

                        if (showError) node.status({ fill: 'red', shape: 'ring', text: err.message });
                        conn.end();
                        return;
                    }

                    //Verifica la presenza del file sul server FTP

                    conn.list(ftpDirectory, (err, listing) => {

                        if (err) {

                            //Crea la cartella sul server FTP

                            node.status({ fill: 'yellow', shape: 'ring', text: 'FTP List Failed, Create new Directory' });

                            conn.mkdir(ftpDirectory, true, (err) => {

                                if (err) {
                                    if (done) {
                                        // Node-RED 1.0 compatible
                                        if (throwError) done(err);
                                    } else {
                                        // Node-RED 0.x compatible
                                        if (throwError) node.error(err, msg);
                                    }
                                    if (showError) node.status({ fill: 'red', shape: 'ring', text: "FTP MKDIR failed from: " + ftpDirectory });
                                    conn.end();
                                    return;
                                }


                                //Non Esiste alcun file nella cartella, crealo
                                let ftppath = ftpDirectory + "/" + ftpFilename.replace('#', '0') + ".txt";

                                node.status({ fill: 'blue', shape: 'ring', text: "Sending: " + localpath + " to " + ftppath });

                                putFile(localpath, ftppath);

                                send(msg);

                            });
                            return;
                        }

                        //Numero di File nella cartella
                        var fileNumber = -1;

                        var comp = ftpFilename.slice(0, -1);
                        var regsting = "^((" + comp + ")[0-9]{1,3})$";
                        var reg = new RegExp(regsting);

                        var maxBytes = 0;

                        //Determina la dimensione massima in bytes
                        switch (fileSizeDim) {
                            case "b":
                                maxBytes = maxFileSize;
                                break;
                            case "kb":
                                maxBytes = maxFileSize * Math.pow(2, 10);
                                break;
                            case "mb":
                                maxBytes = maxFileSize * Math.pow(2, 20);
                                break;
                            case "gb":
                                maxBytes = maxFileSize * Math.pow(2, 30);
                                break;
                            default:
                                maxBytes = maxFileSize * Math.pow(2, 10);
                                break;
                        }

                        var elements = [];
                        var masterfound = false;

                        //Trova tutti i file con il nome impostato
                        if (listing.length > 0) {

                            let count = 0;

                            for (let x = 0; x < listing.length; x++) {
                                if (reg.test((listing[x].name).substring(0, listing[x].name.indexOf('.'))) && listing[x].type === "-") {

                                    let filenum = (listing[x].name).substring(0, listing[x].name.indexOf('.')).substring(comp.length);

                                    let c = {
                                        num: parseInt(filenum),
                                        master: ((listing[x].name).substring(0, listing[x].name.indexOf('.')) === (comp + "0")) ? true : false,
                                        index: x,
                                        data: listing[x]
                                    }

                                    //Trova il master
                                    if (!masterfound) masterfound = c.master;

                                    elements.push(c);

                                }
                            }

                            elements.sort(function (a, b) {
                                return a.num - b.num;
                            });
                        }

                        //Se ci sono più file con il nome impostato continua
                        if (elements.length > 0) {

                            if (elements.length > maxFiles) {
                                for (let j in elements) {

                                    let back = (elements.length - 1) - parseInt(j);
                                    if (back >= (maxFiles)) {
                                        let removeftppath = ftpDirectory + "/" + elements[back].data.name;
                                        deleteFile(removeftppath, false);
                                    } else break;
                                }
                            }

                            //Se il master non è stato trovato rinomina tutto
                            if (!masterfound) {

                                //Se il numero di file è minore del numero impostato
                                if (elements.length < maxFiles) {

                                    //Crea il file Master
                                    let ftppath = ftpDirectory + "/" + ftpFilename.replace('#', '0') + ".txt";

                                    putFile(localpath, ftppath, false);

                                    listAndOrdFiles(true, 0);

                                    send(msg);

                                } else {

                                    let newftppath = ftpDirectory + "/" + ftpFilename.replace('#', '0') + ".txt";
                                    putFile(localpath, newftppath, false);

                                    listAndOrdFiles(true, 0);

                                    send(msg);
                                }
                            } else {
                                if (elements.length < maxFiles) {
                                    if (elements[0].data.size >= maxBytes) {

                                        listPutFileAndRename(localpath);

                                        send(msg);

                                    } else {

                                        let ftppath = ftpDirectory + "/" + ftpFilename.replace('#', '0') + ".txt";

                                        appendFile(localpath, ftppath, false);

                                        listAndOrdFiles(true, 0);

                                        send(msg);

                                    }
                                } else {

                                    if (elements[0].data.size >= maxBytes) {

                                        listDeleteLastFileAndPutNew(localpath, false);

                                        listAndOrdFiles(true, 1);

                                        send(msg);

                                    } else {

                                        let ftppath = ftpDirectory + "/" + elements[0].data.name;

                                        appendFile(localpath, ftppath, false);

                                        listAndOrdFiles(true, 0);

                                        send(msg);

                                    }

                                }

                            }


                        } else if (elements.length == 0) {

                            //Non Esiste alcun file nella cartella, crealo
                            let ftppath = ftpDirectory + "/" + ftpFilename.replace('#', '0') + ".txt";

                            node.status({ fill: 'blue', shape: 'ring', text: "Sending: " + localpath + " to " + ftppath });

                            putFile(localpath, ftppath, true);

                            send(msg);

                        }


                    });



                    //#endregion

                    //Fai la lista di tutti i file presenti nella cartella FTP


                });

                //La connessione al server ha riscontrato un errore
                conn.on('error', function (err) {
                    if (throwError) node.error(err, msg);
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: err.message });
                    return;
                });

                //La connessione al server ha riscontrato un errore
                conn.on('close', function (err) {
                    if (err) {
                        if (throwError) node.error(err, msg);
                        if (showError) node.status({ fill: 'red', shape: 'ring', text: err.message });
                        return;
                    }
                    node.status({ fill: 'green', shape: 'ring', text: "Closed" });
                    return;

                });

                //Connetti il Server FTP
                conn.connect(node.ftpConfig.options);
                //#endregion
                if (done) {
                    done();
                }
            });
        }
        else {
            this.error('Missing Advanced Ftp configuration');
        }



    }

    RED.nodes.registerType('advanced-ftp-logger', AdvancedFtpLoggerNode);

}