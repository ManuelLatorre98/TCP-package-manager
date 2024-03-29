"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromLittleEndian = exports.toLittleEndian = void 0;
var toLittleEndian = function (number) {
    var buffer = new ArrayBuffer(4);
    var view = new DataView(buffer);
    view.setUint32(0, number, false);
    var uint8Array = new Uint8Array(buffer);
    return uint8Array;
};
exports.toLittleEndian = toLittleEndian;
var fromLittleEndian = function (bytes) {
    var buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteLength + bytes.byteOffset);
    var view = new DataView(buffer);
    var number = view.getUint32(0, false);
    return number;
};
exports.fromLittleEndian = fromLittleEndian;
