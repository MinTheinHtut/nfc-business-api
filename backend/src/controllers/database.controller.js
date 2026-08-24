import pool from '../config/database.js';

export async function testDatabase(request, response, next) {
  try {
    await pool.query('SELECT 1');
    response.json({ database: 'connected' });
  } catch (error) {
    next(error);
  }
}
