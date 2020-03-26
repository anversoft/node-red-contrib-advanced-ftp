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
        var credentials = RED.nodes.getCredentials(n.id);
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
        this.filename = n.filename;
        this.localFilename = n.localFilename;
        this.workingDir = n.workingDir;
        this.oldPath = n.oldPath;
        this.newPath = n.newPath
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
                send = send || function() { node.send.apply(node,arguments) }

                //Crea un costruttore per il server ftp
                var conn = new ftp();

                //Il msg.filename è prioritario sul filename impostato nel nodo
                var filename = msg.filename || node.filename || '';
                if(typeof filename != 'string') {
                    filename = '';
                }

                //Il msg.localFilename è prioritario sul localFilename impostato nel nodo
                var localFilename = msg.localFilename || node.localFilename || '';
                if(typeof localFilename != 'string') {
                    localFilename = '';
                }

                //Il msg.oldPath è prioritario sul oldPath impostato nel nodo
                var oldPath = msg.oldPath || msg.path || node.oldPath || '';
                if(typeof oldPath != 'string') {
                    oldPath = '';
                }

                //Il msg.newPath è prioritario sul newPath impostato nel nodo
                var newPath = msg.newPath || msg.path || node.newPath || '';
                if(typeof newPath != 'string') {
                    newPath = '';
                }

                //Il msg.workingDir è prioritario sul workingDir impostato nel nodo
                var workingDir = msg.workingDir || node.workingDir || '';
                if(typeof workingDir != 'string') {
                    workingDir = '';
                }

                //Il msg.showError è prioritario sul showError impostato nel nodo
                var showError = node.showError;

                if(msg.showError !== undefined){
                    showError = msg.showError;
                }

                //Il msg.throwError è prioritario sul throwError impostato nel nodo
                var throwError = node.throwError;
                
                if(msg.throwError !== undefined){
                    throwError = msg.throwError;
                }

                //Il msg.operation è prioritario sul operation impostato nel nodo
                var operation = msg.operation || node.operation || '';
                if(typeof operation != 'string') {
                    operation = '';
                }

                operation = operation.toLocaleLowerCase();

                //Gestisci operation quando viene inviato tramite un oggetto json

                switch (operation) {
                    case 'status':
                        // Non fare niente, non richiede parametri aggiuntivi
                        break;
                    case 'list':
                        // Non fare niente, non richiede parametri aggiuntivi
                        break;
                    case 'get':
                        if(filename == '' || localFilename == ''){
                            if(throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                            if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                            return;
                        }
                        break;
                    case 'append':
                        if(filename == '' || localFilename == ''){
                            if(throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                            if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                            return;
                        }
                        break;
                    case 'put':
                        if(filename == '' || localFilename == ''){
                            if(throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                            if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                            return;
                        }
                        break;
                    case 'rename':
                        if(oldPath == '' || newPath == ''){
                            if(throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                            if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                            return;
                        }
                        break;
                    case 'mkdir':
                        if(newPath == ''){
                            if(throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                            if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                            return;
                        }
                        break;
                    case 'rmdir':
                        if(oldPath == ''){
                            if(throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                            if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
                            return;
                        }
                        break;
                    case 'delete':
                        if(filename == ''){
                            if(throwError) node.error("Invalid Parameters for " + operation.toLocaleUpperCase());
                            if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + " :Invalid Parameters" });
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
                        if(throwError) node.error("Invalid Command");
                        if(showError) node.status({ fill: 'red', shape: 'ring', text: "Invalid Operation" });
                        return;
                }

                //Visulizza lo status del nodo
                node.status({ fill: 'yellow', shape: 'ring', text: operation.toLocaleUpperCase() + ' Operation: ' + node.ftpConfig.options.host + ':' + node.ftpConfig.options.port });

                //Messaggi per le funzioni GET, PUT, APPEND, DELETE, LIST
                this.sendMsg = function (err, result) {

                    if (err) {
                        if (done) {
                            // Node-RED 1.0 compatible
                            if(throwError) done(err);
                        } else {
                            // Node-RED 0.x compatible
                            if(throwError) node.error(err, msg);
                        }
                        if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
                        return;
                    }

                    if (operation == 'get') {
                        result.once('close', function () { conn.end(); });
                        result.pipe(fs.createWriteStream(localFilename));
                        node.status({ fill: 'green', shape: 'ring', text: 'GET Successful' });
                        msg.filename = filename;
                        msg.localFilename = localFilename;
                        msg.payload = 'GET operation successful. ' + localFilename;
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
                    } else if (operation == 'list') {
                        conn.end();
                        node.status({ fill: 'green', shape: 'ring', text: 'LIST Successful' });
                        msg.payload = result;
                    } else {
                        conn.end();
                        node.status({ fill: 'green', shape: 'ring', text: 'DELETE Successful' });
                        msg.filename = filename;
                        msg.payload = result;
                    }

                    msg.operation = operation;
                    
                    send(msg);
                };


                this.sendStatus = function (err, result) {
                    if (err) {
                        if (done) {
                            // Node-RED 1.0 compatible
                            if(throwError) done(err);
                        } else {
                            // Node-RED 0.x compatible
                            if(throwError) node.error(err, msg);
                        }
                        if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
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
                    msg.operation = operation;
                    msg.payload = result;
                    send(msg);
                };

                this.sendPaths = function (err) {
                    if (err) {
                        if (done) {
                            // Node-RED 1.0 compatible
                            if(throwError) done(err);
                        } else {
                            // Node-RED 0.x compatible
                            if(throwError) node.error(err, msg);
                        }
                        if(showError) node.status({ fill: 'red', shape: 'ring', text: operation.toLocaleUpperCase() + ' Failed' });
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
                    msg.operation = operation;
                    send(msg);
                };

                conn.on('ready', function () {
                    switch (operation) {
                        case 'status':
                            conn.status(node.sendStatus);
                            break;
                        case 'list':
                            if(workingDir != ''){
                                if(workingDir.startsWith('./')){
                                    conn.list(workingDir, node.sendMsg);
                                } else {
                                    conn.list('./' + workingDir, node.sendMsg);
                                }
                            } else {
                                conn.list(node.sendMsg);
                            }  
                            break;
                        case 'get':
                            conn.get(filename, node.sendMsg);
                            break;
                        case 'append':
                            conn.append(localFilename, filename, node.sendMsg);
                            break;
                        case 'put':
                            conn.put(localFilename, filename, node.sendMsg);
                            break;
                        case 'rename':
                            conn.rename(oldPath, newPath, node.sendPaths);
                            break;
                        case 'mkdir':
                            conn.mkdir(newPath, node.sendPaths);
                            break;
                        case 'rmdir':
                            conn.rmdir(oldPath, node.sendPaths);
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
                    }
                });

                //La connessione al server ha riscontrato un errore
                conn.on('error', function (err) {
                    if(throwError)node.error(err, msg);
                    if(showError) node.status({ fill: 'red', shape: 'ring', text: err.message });
                    return;
                });

                conn.connect(node.ftpConfig.options);

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