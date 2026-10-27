import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Simple solid color PNG generator with CRC32
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bit depth
  ihdr.writeUInt8(2, 9); // Truecolor RGB
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines: 1 filter byte (0) + width * 3 bytes
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None

    // Draw a dark navy shield pattern with golden center
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = width * 0.45;

      if (dist < maxR * 0.5) {
        // Gold emblem center
        rawData[pxOffset] = 234;     // R
        rawData[pxOffset + 1] = 179; // G
        rawData[pxOffset + 2] = 8;   // B
      } else if (dist < maxR * 0.8) {
        // Royal Blue ring
        rawData[pxOffset] = 29;
        rawData[pxOffset + 1] = 78;
        rawData[pxOffset + 2] = 216;
      } else {
        // Dark Navy background
        rawData[pxOffset] = 11;
        rawData[pxOffset + 1] = 19;
        rawData[pxOffset + 2] = 43;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, 29, 78, 216));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, 29, 78, 216));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512, 29, 78, 216));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, 29, 78, 216));
console.log('Icons generated successfully!');
