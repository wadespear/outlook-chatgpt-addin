/**
 * Generate GPT-themed PNG icons
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, 'assets');
const sizes = [16, 32, 64, 80, 128];

// OpenAI green color: #10a37f = RGB(16, 163, 127)
const GREEN_R = 16;
const GREEN_G = 163;
const GREEN_B = 127;

// White for text
const WHITE_R = 255;
const WHITE_G = 255;
const WHITE_B = 255;

// Simple 5x7 font for "GPT" - each letter is 5 wide, 7 tall
const letterG = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [1,0,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
];

const letterP = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0]
];

const letterT = [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0]
];

function createGPTIcon(size) {
    // Create pixel array
    const pixels = [];

    // Calculate text positioning
    const textWidth = 17; // 5 + 1 + 5 + 1 + 5 (three letters with spacing)
    const textHeight = 7;

    // Scale factor
    const scale = Math.max(1, Math.floor(size / 24));
    const scaledTextWidth = textWidth * scale;
    const scaledTextHeight = textHeight * scale;

    // Center the text
    const startX = Math.floor((size - scaledTextWidth) / 2);
    const startY = Math.floor((size - scaledTextHeight) / 2);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Default to green background
            let r = GREEN_R;
            let g = GREEN_G;
            let b = GREEN_B;

            // Check if this pixel is part of the text
            const textX = Math.floor((x - startX) / scale);
            const textY = Math.floor((y - startY) / scale);

            if (textX >= 0 && textX < textWidth && textY >= 0 && textY < textHeight) {
                let isWhite = false;

                // Check G (columns 0-4)
                if (textX >= 0 && textX < 5 && letterG[textY] && letterG[textY][textX]) {
                    isWhite = true;
                }
                // Check P (columns 6-10)
                else if (textX >= 6 && textX < 11 && letterP[textY] && letterP[textY][textX - 6]) {
                    isWhite = true;
                }
                // Check T (columns 12-16)
                else if (textX >= 12 && textX < 17 && letterT[textY] && letterT[textY][textX - 12]) {
                    isWhite = true;
                }

                if (isWhite) {
                    r = WHITE_R;
                    g = WHITE_G;
                    b = WHITE_B;
                }
            }

            pixels.push(r, g, b);
        }
    }

    return createPNG(size, pixels);
}

function createPNG(size, pixels) {
    // PNG signature
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

    // Create raw image data with filter bytes
    const rawData = [];
    let pixelIndex = 0;
    for (let y = 0; y < size; y++) {
        rawData.push(0); // filter byte for each row
        for (let x = 0; x < size; x++) {
            rawData.push(pixels[pixelIndex++]); // R
            rawData.push(pixels[pixelIndex++]); // G
            rawData.push(pixels[pixelIndex++]); // B
        }
    }

    // Compress with zlib
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

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Generating GPT-themed icons...\n');

sizes.forEach(size => {
    const filename = `icon-${size}.png`;
    const filepath = path.join(assetsDir, filename);
    const pngBuffer = createGPTIcon(size);
    fs.writeFileSync(filepath, pngBuffer);
    console.log(`Created: ${filename} (${pngBuffer.length} bytes)`);
});

console.log('\nDone! Green GPT icons created.');
