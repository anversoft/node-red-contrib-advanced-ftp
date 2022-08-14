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
    var fs = require('fs')

    //Funzione per la configurazione
    function AdvancedFtpNode(n) {
        RED.nodes.createNode(this, n);
        var credentials = RED.nodes.getCredentials(n.id) || {};
        this.options = {
            'host': n.host || 'localhost',
            'port': n.port || 21,
            'secure': n.secure || false,
            'secureOptions': n.secureOptions,
            'user': n.user || 'anonymous',
            'password': credentials.password || 'anonymous@',
            'connTimeout': n.connTimeout || 10000,
            'pasvTimeout': n.pasvTimeout || 10000,
            'keepalive': n.keepalive || 10000
        };
    }

    //Registra il Node
    RED.nodes.registerType('advanced-ftp-config', AdvancedFtpNode, {
        credentials: {
            password: { type: 'password' }
        }
    });

    //Funzione per il nodo FTP
    function AdvancedFtpInNode(n) {
        RED.nodes.createNode(this, n);
        //Imposta le variabili locali
        this.ftp = n.ftp;
        this.operation = n.operation;
        this.dataType = n.dataType;
        this.command = n.command;
        this.filename = n.filename;
        this.localFilename = n.localFilename;
        this.workingDir = n.workingDir;
        this.oldPath = n.oldPath;
        this.newPath = n.newPath
        this.useCompression = n.useCompression;
        this.recursive = n.recursive;
        this.throwError = n.throwError;
        this.showError = n.showError;
        this.ftpConfig = RED.nodes.getNode(this.ftp);

        this.status({});

        //Se la configurazione è presente continua
        if (this.ftpConfig) {
            var node = this;
            //Il nodo ha ricevuto un input
            node.on('input', function (msg, send, done) {

                node.status({});

                // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                send = send || function () { node.send.apply(node, arguments) }

                //Crea un costruttore per il server ftp
                var conn = new ftp();
                
                // Permetti all'utente di motificare le opzioni
                var options = msg.options || node.ftpConfig.options;

                delete msg.options;

                //Il msg.filename è prioritario sul filename impostato nel nodo
                var filename = msg.filename || node.filename || '';
                if (typeof filename != 'string') {
                    filename = '';
                }

                //Il msg.command è prioritario sul command impostato nel nodo
                var command = msg.command || node.command || '';
                if (typeof command != 'string') {
                    command = '';
                }

                //Il msg.dataType è prioritario sul dataType impostato nel nodo
                var dataType = msg.dataType || node.dataType || '';
                if (typeof dataType != 'string') {
                    dataType = 'binary';
                }

                dataType = dataType.toLocaleLowerCase();

                //Il msg.localFilename è prioritario sul localFilename impostato nel nodo
                var localFilename = msg.localFilename || node.localFilename || '';
                if (typeof localFilename != 'string') {
                    localFilename = '';
                }

                //Il msg.oldPath è prioritario sul oldPath impostato nel nodo
                var oldPath = msg.oldPath || msg.path || node.oldPath || '';
                if (typeof oldPath != 'string') {
                    oldPath = '';
                }

                //Il msg.newPath è prioritario sul newPath impostato nel nodo
                var newPath = msg.newPath || msg.path || node.newPath || '';
                if (typeof newPath != 'string') {
                    newPath = '';
                }

                //Il msg.workingDir è prioritario sul workingDir impostato nel nodo
                var workingDir = msg.workingDir || node.workingDir || '';
                if (typeof workingDir != 'string') {
                    workingDir = '';
                }

                //Il msg.recursive è prioritario sul recursive impostato nel nodo
                var recursive = node.recursive;

                if ((msg.recursive !== undefined) && (typeof msg.recursive === 'boolean')) {
                    recursive = msg.recursive;
                }

                //Il msg.useCompression è prioritario sul useCompression impostato nel nodo
                var useCompression = node.useCompression;

                if ((msg.useCompression !== undefined) && (typeof msg.useCompression === 'boolean')) {
                    useCompression = msg.useCompression;
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

                //Il msg.operation è prioritario sul operation impostato nel nodo
                var operation = msg.operation || node.operation || '';
                if (typeof operation != 'string') {
                    operation = '';
                }

                //Il msg.abort è prioritario sul abort impostato nel nodo
                var abort = msg.abort;

                this.abortCommand = function (err) {
                    if (err) {
                        if (done) {
                            // Node-RED 1.0 compatible
                            if (throwError) done(err);
                        } else {
                            // Node-RED 0.x compatible
                            if (throwError) node.error(err, msg);
                        }
                        if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                        return;
                    }


                    msg.payload = "Operation Aborted";
                    msg.abort = abort;
                    send(msg);
                    if (done) {
                        done();
                    }
                    return;
                }

                if (abort !== undefined && abort === true) {
                    conn.abort(node.abortCommand);
                    node.status({ fill: 'blue', shape: 'ring', text: 'Aborted' });
                } else {
                    operation = operation.toLocaleLowerCase();

                    //Gestisci operation quando viene inviato tramite un oggetto json

                    switch (operation) {
                        case 'status':
                            // Non fare niente, non richiede parametri aggiuntivi
                            break;
                        case 'list':
                            // Non fare niente, non richiede parametri aggiuntivi
                            break;
                        case 'listsafe':
                            // Non fare niente, non richiede parametri aggiuntivi
                            break;
                        case 'lastmod':
                            // Non fare niente, non richiede parametri aggiuntivi
                            break;
                        case 'size':
                            // Non fare niente, non richiede parametri aggiuntivi
                            break;
                        case 'site':
                            if (command === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'get':
                            if (filename === '' || localFilename === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'append':
                            if (filename === '' || localFilename === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'put':
                            if (filename === '' || localFilename === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'rename':
                            if (oldPath === '' || newPath === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'mkdir':
                            if (newPath === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'rmdir':
                            if (oldPath === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'delete':
                            if (filename === '') {
                                if (throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                                if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                                return;
                            }
                            break;
                        case 'pwd':
                            // Non fare niente, non richiede parametri aggiuntivi
                            break;
                        case 'system':
                            // Non fare niente, non richiede parametri aggiuntivi
                            break;
                        default:
                            if (throwError) node.error("Invalid Command");
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Operation" });
                            return;
                    }

                    //Visulizza lo status del nodo
                    node.status({ fill: 'yellow', shape: 'ring', text: operation.toLocaleUpperCase() + ' Operation: ' + options.host + ':' + options.port });

                    //Messaggi per le funzioni GET, PUT, APPEND, DELETE, LIST
                    this.sendMsg = function (err, result) {

                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                            conn.end();
                            return;
                        }

                        if (operation == 'get') {
                            try {
                                result.once('close', function () { conn.end(); });

                                node.status({ fill: 'yellow', shape: 'dot', text: 'Pending...' });
                                let writestream = fs.createWriteStream(localFilename);

                                writestream.on('error', (err) => {
                                    node.handleErrors(err);
                                });

                                result.on('end', function () {
                                    node.status({ fill: 'green', shape: 'ring', text: 'GET Successful' });
                                    msg.filename = filename;
                                    msg.localFilename = localFilename;
                                    msg.payload = 'GET operation successful. ' + localFilename;
                                    node.send(msg);
                                });

                                result.pipe(writestream);

                            } catch (err) {
                                node.handleErrors(err);
                            }
                        } else if (operation == 'put') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'PUT Successful' });
                            msg.filename = filename;
                            msg.localFilename = localFilename;
                            msg.payload = 'PUT operation successful.';
                        } else if (operation == 'append') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'APPEND Successful' });
                            msg.filename = filename;
                            msg.localFilename = localFilename;
                            msg.payload = 'APPEND operation successful.';
                        } else if (operation == 'list' || operation == 'listsafe') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: operation.toLocaleUpperCase() + ' Successful' });
                            msg.payload = result;
                        } else if (operation == 'delete') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'DELETE Successful' });
                            msg.filename = filename;
                            msg.payload = result;
                        }

                        if (operation !== 'get') {
                            send(msg);
                        }
                    };

                    //Gestisci l'errore del' operazione GET
                    this.handleErrors = function (err) {

                        node.status({ fill: 'red', shape: 'ring', text: 'Something went wrong...' });

                        if (done) {

                            // Node-RED 1.0 compatible

                            if (throwError) done(err);

                        } else {

                            // Node-RED 0.x compatible

                            if (throwError) node.error(err, msg);

                        }

                    }


                    this.sendStatus = function (err, result) {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                            conn.end();
                            return;
                        }

                        if (operation == 'status') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'STATUS Successful' });
                        } else if (operation == 'pwd') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'PWD Successful' });
                        } else if (operation == 'system') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'SYSTEM Successful' });
                        }
                        msg.payload = result;
                        send(msg);
                    };

                    this.sendPaths = function (err) {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                            conn.end();
                            return;
                        }

                        if (operation == 'rename') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'RENAME Successful' });
                            msg.payload = 'RENAME operation successful.';
                            msg.oldPath = oldPath;
                            msg.newPath = newPath;
                        }

                        if (operation == 'mkdir') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'MKDIR Successful' });
                            msg.payload = 'MKDIR operation successful.';
                            msg.path = newPath;
                        }

                        if (operation == 'rmdir') {
                            conn.end();
                            node.status({ fill: 'green', shape: 'ring', text: 'RMDIR Successful' });
                            msg.payload = 'RMDIR operation successful.';
                            msg.path = oldPath;
                        }

                        send(msg);
                    };

                    this.setDataType = function (err) {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                            conn.end();
                            return;
                        }

                    };

                    this.lastModified = function (err, date) {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                            conn.end();
                            return;
                        }

                        conn.end();

                        node.status({ fill: 'green', shape: 'ring', text: 'LASTMOD Successful' });

                        msg.path = oldPath;
                        msg.payload = Date.parse(date);
                        send(msg);
                    };

                    this.getSize = function (err, bytes) {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                            conn.end();
                            return;
                        }

                        conn.end();

                        node.status({ fill: 'green', shape: 'ring', text: 'SIZE Successful' });

                        msg.path = oldPath;
                        msg.payload = bytes;
                        send(msg);
                    };

                    this.siteCommand = function (err, response, result) {
                        if (err) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                if (throwError) done(err);
                            } else {
                                // Node-RED 0.x compatible
                                if (throwError) node.error(err, msg);
                            }
                            if (showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                            conn.end();
                            return;
                        }

                        node.status({ fill: 'green', shape: 'ring', text: 'SITE ' + command + ' Successful' });

                        msg.payload = response;
                        msg.responseCode = result;
                        send(msg);
                    };

                    conn.on('ready', function () {

                        if (dataType !== 'binary') {
                            conn.ascii(node.setDataType);
                        }

                        msg.operation = operation;
                        msg.dataType = dataType;

                        switch (operation) {
                            case 'status':
                                conn.status(node.sendStatus);
                                break;
                            case 'list':
                                if (workingDir != '') {
                                    if (workingDir.startsWith('./')) {
                                        conn.list(workingDir, useCompression, node.sendMsg);
                                    } else {
                                        conn.list('./' + workingDir, useCompression, node.sendMsg);
                                    }
                                } else {
                                    conn.list('./', useCompression, node.sendMsg);
                                }
                                break;
                            case 'listsafe':
                                if (workingDir != '') {
                                    if (workingDir.startsWith('./')) {
                                        conn.listSafe(workingDir,useCompression, node.sendMsg);
                                    } else {
                                        conn.listSafe('./' + workingDir, useCompression, node.sendMsg);
                                    }
                                } else {
                                    conn.listSafe('./', useCompression, node.sendMsg);
                                }
                                break;
                            case 'get':
                                conn.get(filename, useCompression, node.sendMsg);
                                break;
                            case 'append':
                                conn.append(localFilename, filename, useCompression, node.sendMsg);
                                break;
                            case 'put':
                                conn.put(localFilename, filename, useCompression, node.sendMsg);
                                break;
                            case 'rename':
                                conn.rename(oldPath, newPath, node.sendPaths);
                                break;
                            case 'mkdir':
                                conn.mkdir(newPath, recursive, node.sendPaths);
                                break;
                            case 'rmdir':
                                conn.rmdir(oldPath, recursive, node.sendPaths);
                                break;
                            case 'delete':
                                conn.delete(filename, node.sendMsg);
                                break;
                            case 'pwd':
                                conn.pwd(node.sendStatus);
                                break;
                            case 'system':
                                conn.system(node.sendStatus);
                                break;
                            case 'lastmod':
                                conn.lastMod(oldPath, node.lastModified);
                                break;
                            case 'size':
                                conn.size(oldPath, node.getSize);
                                break;
                            case 'site':
                                conn.site(command, node.siteCommand);
                                break;
                        }
                    });
                }

                //La connessione al server ha riscontrato un errore
                conn.on('error', function (err) {
                    if (throwError) node.error(err, msg);
                    if (showError) node.status({ fill: 'red', shape: 'ring', text: err.message });
                    return;
                });


                conn.connect(options);

                if (done) {
                    done();
                }

            });
        } else {
            this.error('Missing Advanced Ftp configuration');
        }

    }
    RED.nodes.registerType('advanced-ftp', AdvancedFtpInNode);

}