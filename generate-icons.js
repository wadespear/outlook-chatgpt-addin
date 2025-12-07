/**
 * Generate valid PNG icons using Node.js Canvas
 * First install: npm install canvas
 * Then run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available, if not provide alternative
let createCanvas;
try {
    createCanvas = require('canvas').createCanvas;
} catch (e) {
    console.log('Canvas module not installed. Creating simple valid PNGs...');
    createCanvas = null;
}

const assetsDir = path.join(__dirname, 'assets');
const sizes = [16, 32, 64, 80, 128];

// Simple valid PNG generator (creates a solid color PNG without external dependencies)
function createSimplePNG(size) {
    // PNG file structure
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(size, 0);  // width
    ihdrData.writeUInt32BE(size, 4);  // height
    ihdrData.writeUInt8(8, 8);        // bit depth
    ihdrData.writeUInt8(2, 9);        // color type (RGB)
    ihdrData.writeUInt8(0, 10);       // compression
    ihdrData.writeUInt8(0, 11);       // filter
    ihdrData.writeUInt8(0, 12);       // interlace

    const ihdrChunk = createChunk('IHDR', ihdrData);

    // Create image data (blue color: RGB 0, 120, 212 - Microsoft blue)
    const rawData = [];
    for (let y = 0; y < size; y++) {
        rawData.push(0); // filter byte for each row
        for (let x = 0; x < size; x++) {
            rawData.push(0);    // R
            rawData.push(120);  // G
            rawData.push(212);  // B
        }
    }

    // Compress with zlib
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idatChunk = createChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation for PNG
function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = [];

    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }

    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }

    return crc ^ 0xFFFFFFFF;
}

console.log('Generating valid PNG icons...\n');

sizes.forEach(size => {
    const filename = `icon-${size}.png`;
    const filepath = path.join(assetsDir, filename);
    const pngBuffer = createSimplePNG(size);
    fs.writeFileSync(filepath, pngBuffer);
    console.log(`Created: ${filename} (${pngBuffer.length} bytes)`);
});

console.log('\nDone! Valid PNG icons created.');
console.log('These are solid blue icons - you can replace them with custom designs later.');
