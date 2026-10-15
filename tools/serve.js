'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

function createServer({ root = path.resolve(__dirname, '../dist'), basePath = '/' } = {}) {
  root = path.resolve(root);
  if (!basePath.startsWith('/') || !basePath.endsWith('/') || basePath.includes('..')) {
    throw new Error('basePath must begin and end with / and contain no ..');
  }
  return http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch (_) { response.writeHead(400); response.end(); return; }
    if (basePath !== '/' && pathname === basePath.slice(0, -1)) {
      response.writeHead(302, { Location: basePath }); response.end(); return;
    }
    if (!pathname.startsWith(basePath) || pathname.includes('\0') || pathname.includes('\\')) {
      response.writeHead(404); response.end('Not found'); return;
    }
    let relative = pathname.slice(basePath.length);
    if (!relative) relative = 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(403); response.end(); return;
    }
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': path.basename(file) === 'sw.js' ? 'no-store' : 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      response.end(request.method === 'HEAD' ? undefined : data);
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 4180;
  const host = process.env.HOST || '127.0.0.1';
  const basePath = process.env.APP_BASE_PATH || '/';
  createServer({ basePath }).listen(port, host, () => {
    console.log(`追星人 · Astertrail http://${host}:${port}${basePath}`);
    console.log('Use an HTTPS address for phone camera, location and motion permissions.');
  }).on('error', error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { createServer };
