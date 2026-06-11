/**
 * Matrix Preview Server — 纯 Node.js，零依赖
 * 用法: node scripts/server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'build', 'web-mobile');
const PORT = 7456;

const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wasm': 'application/wasm',
    '.data': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
    
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        // SPA fallback
        filePath = path.join(ROOT, 'index.html');
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`  🎮 Matrix Match-3 Preview`);
    console.log(`  http://localhost:${PORT}`);
    console.log('═══════════════════════════════════════');
    console.log('');
});
