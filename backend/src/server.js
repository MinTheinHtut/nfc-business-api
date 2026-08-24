import 'dotenv/config';
import app from './app.js';
import pool from './config/database.js';
import { sessionStore, sessionStoreMode, sessionStoreReady } from './config/session-store.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

try {
  await sessionStoreReady;
  const server = app.listen(port, host, () => {
    console.log(`API server listening on ${host}:${port} with ${sessionStoreMode} session storage`);
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down gracefully.`);

    const forceExitTimer = setTimeout(() => {
      console.error('Graceful shutdown timed out.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    server.close(async (serverError) => {
      let exitCode = serverError ? 1 : 0;
      try {
        if (typeof sessionStore.close === 'function') await sessionStore.close();
        await pool.end();
      } catch (error) {
        exitCode = 1;
        console.error(`Resource shutdown failed${error.code ? ` (${error.code})` : ''}.`);
      }
      clearTimeout(forceExitTimer);
      process.exit(exitCode);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
} catch (error) {
  console.error(`Session store initialization failed${error.code ? ` (${error.code})` : ''}.`);
  process.exitCode = 1;
}
