const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types for serving files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Check for Office Add-in dev certs first, then fall back to local certs
const officeDevCertPath = path.join(require('os').homedir(), '.office-addin-dev-certs', 'localhost.crt');
const officeDevKeyPath = path.join(require('os').homedir(), '.office-addin-dev-certs', 'localhost.key');
const localCertPath = path.join(__dirname, 'certs', 'localhost.crt');
const localKeyPath = path.join(__dirname, 'certs', 'localhost.key');

// Use Office dev certs if available, otherwise use local certs
const certPath = fs.existsSync(officeDevCertPath) ? officeDevCertPath : localCertPath;
const keyPath = fs.existsSync(officeDevKeyPath) ? officeDevKeyPath : localKeyPath;

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('\n========================================');
    console.log('SSL CERTIFICATES NOT FOUND');
    console.log('========================================\n');
    console.log('Office Add-ins require HTTPS. Please generate certificates:\n');
    console.log('Option 1: Using mkcert (recommended)');
    console.log('  1. Install mkcert: https://github.com/FiloSottile/mkcert');
    console.log('  2. Run: mkcert -install');
    console.log('  3. Run: mkdir certs && cd certs && mkcert localhost\n');
    console.log('Option 2: Using OpenSSL');
    console.log('  1. mkdir certs');
    console.log('  2. openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\');
    console.log('     -keyout certs/localhost.key -out certs/localhost.crt \\');
    console.log('     -subj "/CN=localhost"\n');
    console.log('After generating certificates, run this server again.\n');
    process.exit(1);
}

const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

const server = https.createServer(options, (req, res) => {
    // Handle CORS for Office Add-in
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parse URL
    let filePath = req.url === '/' ? '/src/taskpane.html' : req.url;
    filePath = path.join(__dirname, filePath);

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log('\n========================================');
    console.log('ChatGPT Email Assistant - Dev Server');
    console.log('========================================\n');
    console.log(`Server running at https://localhost:${PORT}`);
    console.log('\nTo sideload the add-in:');
    console.log('1. Open Outlook (web or desktop)');
    console.log('2. Go to Home > Get Add-ins > My Add-ins');
    console.log('3. Click "Add a custom add-in" > "Add from file"');
    console.log(`4. Select: ${path.join(__dirname, 'manifest.xml')}`);
    console.log('\nPress Ctrl+C to stop the server.\n');
});
