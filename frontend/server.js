import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const directory = path.dirname(filename);
const distPath = path.join(directory, 'dist');
const indexPath = path.join(distPath, 'index.html');
const port = Number(process.env.PORT) || 8080;

const app = express();

app.disable('x-powered-by');
app.use(express.static(distPath, { index: false, fallthrough: true }));

// Middleware fallback avoids Express 5 wildcard route parsing differences.
app.use((request, response, next) => {
  if (request.method !== 'GET') return next();
  if (path.extname(request.path)) return response.status(404).end();
  return response.sendFile(indexPath);
});

app.use((request, response) => response.status(404).end());

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server listening on 0.0.0.0:${port}`);
});
