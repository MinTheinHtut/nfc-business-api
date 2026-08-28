import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(directory, 'dist');
const indexPath = path.join(distPath, 'index.html');
const port = Number(process.env.PORT) || 8080;

const mimeTypes = new Map([
  ['.avif', 'image/avif'], ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'], ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'], ['.jpeg', 'image/jpeg'], ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'], ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'], ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json'], ['.webp', 'image/webp'],
  ['.woff', 'font/woff'], ['.woff2', 'font/woff2'],
]);

function sendFile(request, response, filePath, fileStat) {
  response.statusCode = 200;
  response.setHeader('Content-Type', mimeTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream');
  response.setHeader('Content-Length', fileStat.size);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    response.setHeader('Cache-Control', 'no-cache');
  }
  if (request.method === 'HEAD') return response.end();
  const stream = createReadStream(filePath);
  stream.on('error', () => {
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
  return stream.pipe(response);
}

async function requestHandler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end();
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    return response.end();
  }

  if (pathname.includes('\0')) {
    response.writeHead(400);
    return response.end();
  }

  const requestedPath = path.resolve(distPath, `.${pathname}`);
  const relativePath = path.relative(distPath, requestedPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    return response.end();
  }

  try {
    const fileStat = await stat(requestedPath);
    if (fileStat.isFile()) return sendFile(request, response, requestedPath, fileStat);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
      response.writeHead(500);
      return response.end();
    }
  }

  // Requests that look like real files must not receive the SPA HTML fallback.
  if (path.posix.extname(pathname) || pathname.startsWith('/assets/')) {
    response.writeHead(404);
    return response.end();
  }

  try {
    const indexStat = await stat(indexPath);
    return sendFile(request, response, indexPath, indexStat);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Frontend build is unavailable.');
  }
}

const server = http.createServer((request, response) => {
  requestHandler(request, response).catch(() => {
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server listening on 0.0.0.0:${port}`);
});
