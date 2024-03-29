export const toLittleEndian = (number: number): Uint8Array => {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, number, false);

  const uint8Array = new Uint8Array(buffer);

  return uint8Array;
};

export const fromLittleEndian = (bytes: Uint8Array): number => {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteLength+bytes.byteOffset) 
  const view = new DataView(buffer);
  const number = view.getUint32(0, false);
  return number;
};