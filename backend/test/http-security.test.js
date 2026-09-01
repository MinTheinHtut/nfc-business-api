import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { loginRateLimit } from '../src/middleware/security.middleware.js';

async function listen(app) {
  const server = await new Promise((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

test('login rate limit returns a generic 429 after repeated failures', async (t) => {
  const app = express();
  app.post('/login', loginRateLimit, (request, response) => response.status(401).json({ message: 'Invalid email/username or password' }));
  const { server, origin } = await listen(app); t.after(() => server.close());
  for (let attempt = 0; attempt < 10; attempt += 1) assert.equal((await fetch(`${origin}/login`, { method: 'POST' })).status, 401);
  const blocked = await fetch(`${origin}/login`, { method: 'POST' });
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), { message: 'Too many requests. Please wait and try again.' });
});

test('API rejects foreign origins, oversized JSON, and unauthenticated admin access safely', async (t) => {
  process.env.SESSION_STORE = 'memory';
  process.env.SESSION_SECRET = 'test-only-session-secret-with-32-characters';
  const { default: app } = await import('../src/app.js');
  const { server, origin } = await listen(app); t.after(() => server.close());
  const foreign = await fetch(`${origin}/api/health`, { headers: { Origin: 'https://evil.example' } });
  assert.equal(foreign.status, 403);
  assert.equal('stack' in await foreign.json(), false);
  const oversized = await fetch(`${origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'x'.repeat(110000), password: 'x' }) });
  assert.equal(oversized.status, 413);
  assert.equal('stack' in await oversized.json(), false);
  const admin = await fetch(`${origin}/api/admin/companies`);
  assert.equal(admin.status, 401);
  const confirm = await fetch(`${origin}/api/public/companies/invalid-token/confirm`, { method: 'POST' });
  assert.equal(confirm.status, 401);
});
