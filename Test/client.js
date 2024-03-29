"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PackageManager_1 = require("../src/PackageManager");
var net = require("net");
var client = new net.Socket();
var PORT = 3000;
var HOST = '127.0.0.1';
var dataManager = new PackageManager_1.PackageManager();
client.connect(PORT, HOST, function () {
    console.log('Connected to server');
    client.write('Send me data!');
});
client.on('data', function (data) {
    console.log('Datagram received in bytes: ' + data.toString('hex'));
    var messageBytes = dataManager.manageData(data); /* Manage the data received and get and array of messages */
    var messages = dataManager.translateMessages(messageBytes); /* Translates the array of message bytes into an array of parsed messages. */
    if (messages.length > 0)
        console.log("Messages: ".concat(JSON.stringify(messages)));
});
client.on('close', function () {
    console.log('Conexión cerrada');
});
