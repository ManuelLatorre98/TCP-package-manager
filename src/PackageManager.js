"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageManager = void 0;
var toLittleEndian_1 = require("./toLittleEndian");
var customTypes_1 = require("./customTypes");
global.Buffer = require('buffer').Buffer;
var PackageManager = /** @class */ (function () {
    function PackageManager() {
        var _this = this;
        this.messageBuffer = null;
        this.messageLength = null;
        this.msgPointer = 0;
        this.decodedMsg = [];
        this.amountOfBytes = 4;
        this.messageReaded = 0;
        this.lengthBytes = null;
        this.subArrayLengthBytes = null;
        this.lengthReaded = 0;
        /**
         * Handles the received message data.
         *
         * @param messageData The buffer containing the message data.
         * @returns The complete message bytes if available, otherwise null.
         */
        this.handleMessageData = function (messageData) {
            var messageBytes = Buffer.from('');
            if (_this.messageBuffer === null) {
                _this.messageBuffer = messageData;
            }
            else {
                _this.messageBuffer = Buffer.concat([_this.messageBuffer, messageData]);
            }
            // Check if the complete message has been received
            if (_this.messageLength != null && _this.messageBuffer.length >= _this.messageLength) {
                messageBytes = _this.messageBuffer.subarray(0, _this.messageLength);
                _this.messageBuffer = null;
            }
            return messageBytes;
        };
    }
    /**
     * Handles the received data, either in string or buffer format.
     * If a string is received, it converts it to Buffer in UTF-8 format.
     * Reads the received data to determine the message length and the message itself.
     *
     * @param data The received data, can be a string or a buffer.
     * @returns An array with the decoded messages.
     */
    PackageManager.prototype.manageData = function (data) {
        if (typeof data == "string") {
            data = Buffer.from(data, 'utf-8');
        }
        while (data.length > this.msgPointer) {
            if (this.messageLength === null) {
                this.readMessageLength(data); /* Reads the message length */
                /*
                * It may happen that the length arrives along with the message in the same datagram
                * if the message length is read and the datagram itself contains the message, it reads it
                */
                if (this.messageLength != null && data.length > this.msgPointer) {
                    this.readMessage(data);
                }
            }
            else { /* If the length has already been read and waiting for the message */
                this.readMessage(data);
            }
        }
        this.msgPointer = 0;
        var auxDecodedMsg = [];
        if (this.decodedMsg.length > 0) {
            auxDecodedMsg = Object.assign([], this.decodedMsg);
            this.decodedMsg = [];
        }
        return auxDecodedMsg;
    };
    /**
     * Reads the length of the message from the data buffer.
     *
     * @param data The buffer containing the data.
     */
    PackageManager.prototype.readMessageLength = function (data) {
        var remainingBytes = this.amountOfBytes - this.lengthReaded;
        this.subArrayLengthBytes = data.subarray(this.msgPointer, this.msgPointer + remainingBytes);
        this.msgPointer += this.subArrayLengthBytes.length;
        this.lengthReaded += this.subArrayLengthBytes.length;
        if (this.lengthBytes === null) {
            this.lengthBytes = this.subArrayLengthBytes;
        }
        else if (this.lengthBytes.length < this.amountOfBytes) {
            this.lengthBytes = Buffer.concat([this.lengthBytes, this.subArrayLengthBytes]);
        }
        /* If finished reading the message length, it translates it */
        if (this.lengthReaded == this.amountOfBytes) {
            this.lengthReaded = 0;
            this.messageLength = (0, toLittleEndian_1.fromLittleEndian)(this.lengthBytes);
        }
    };
    /**
     * Reads the message from the data buffer.
     *
     * @param data The buffer containing the message.
    */
    PackageManager.prototype.readMessage = function (data) {
        var message;
        var managedData;
        if (this.messageLength != null) {
            message = data.subarray(this.msgPointer, (this.msgPointer + (this.messageLength - this.messageReaded))); /* Reads the message */
            managedData = this.handleMessageData(message);
            if (managedData != undefined) {
                this.decodedMsg.push(managedData);
            }
            this.msgPointer += message.length;
            this.messageReaded += message.length; // Indicates that x bytes have been read
            /* Checks if the message is fully read */
            if (data.length > this.msgPointer && this.messageReaded == this.messageLength) {
                /* If finished reading a message, but there is more information available, reset variables to continue reading */
                this.startNewMessage();
            }
        }
    };
    /**
     * Resets the variables to start reading a new message.
     */
    PackageManager.prototype.startNewMessage = function () {
        this.messageLength = null;
        this.messageBuffer = null;
        this.messageReaded = 0;
        this.lengthBytes = null;
    };
    /**
     * Translates an array of message bytes into an array of parsed messages.
     *
     * @param messagesBytes An array containing the message bytes to translate.
     * @returns An array of parsed messages.
    */
    PackageManager.prototype.translateMessages = function (messagesBytes) {
        var messages = [];
        if (messagesBytes.length > 0) {
            messages = messagesBytes.map(function (message) {
                var messageString = String.fromCharCode.apply(null, Array.from(message));
                var resp = JSON.parse(messageString);
                return resp;
            });
        }
        return messages;
    };
    /**
     * Sends a message over the provided socket.
     *
     * @param socket The socket to send the message through.
     * @param message The message to send.
     * @returns A Promise that resolves with an ApiResponse if the message is successfully sent, or rejects with an ApiResponse if there is an error.
    */
    PackageManager.prototype.sendMessage = function (socket, message) {
        return new Promise(function (resolve, reject) {
            try {
                var dataToSend = JSON.stringify(message);
                var littleEndian = (0, toLittleEndian_1.toLittleEndian)(new Blob([dataToSend]).size);
                socket.write(littleEndian); //This shall use the method to send message provided by the TCP library. I asume that is socket.write 
                socket.write(dataToSend);
                resolve(new customTypes_1.ApiResponse(200, "Message sended to client"));
            }
            catch (e) {
                console.error("packageManager: sendMessage");
                console.error(e);
                reject(new customTypes_1.ApiResponse(500, "Error sending message"));
            }
        });
    };
    return PackageManager;
}());
exports.PackageManager = PackageManager;
