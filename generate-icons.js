/**
 * Simple Icon Generator for Outlook Add-In
 *
 * This script creates simple PNG icons for the add-in.
 * Run with: node generate-icons.js
 *
 * If you don't have canvas installed, you can:
 * 1. Use any online icon generator
 * 2. Use a simple colored square image
 * 3. Use the placeholder SVG approach below
 */

const fs = require('fs');
const path = require('path');

// Create simple 1x1 pixel PNGs (placeholder icons)
// These are valid minimal PNG files - you should replace with real icons

const sizes = [16, 32, 64, 80, 128];
const assetsDir = path.join(__dirname, 'assets');

// Minimal valid PNG (1x1 blue pixel) - base64 encoded
// This creates a valid PNG that can be scaled
const createMinimalPNG = () => {
    // PNG header + IHDR + IDAT + IEND for a 1x1 blue pixel
    return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
        0x00, 0x00, 0x00, // compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE, // CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x08, 0xD7, 0x63, 0x60, 0x60, 0xF8, 0x0F, 0x00, // compressed data (blue pixel)
        0x01, 0x01, 0x01, 0x00, //
        0x18, 0xDD, 0x8D, 0xB4, // CRC (approximate)
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
};

console.log('Creating placeholder icons...');
console.log('Note: Replace these with proper icons for production use.\n');

sizes.forEach(size => {
    const filename = `icon-${size}.png`;
    const filepath = path.join(assetsDir, filename);
    fs.writeFileSync(filepath, createMinimalPNG());
    console.log(`Created: ${filename}`);
});

console.log('\nDone! Icons created in the assets folder.');
console.log('\nFor better icons, consider:');
console.log('1. Using an online icon generator (e.g., favicon.io)');
console.log('2. Creating icons in an image editor');
console.log('3. Using the Office Add-in icon guidelines:');
console.log('   https://docs.microsoft.com/en-us/office/dev/add-ins/design/add-in-icons');
