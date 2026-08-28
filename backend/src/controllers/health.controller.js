import pool from '../config/database.js';
export async function getHealth(request, response) {
  try { await pool.query('SELECT 1'); return response.json({ status: 'ok', database: 'connected' }); }
  catch { return response.status(503).json({ status: 'degraded', database: 'unavailable' }); }
}
