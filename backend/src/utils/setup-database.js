import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pool, { databaseConfig } from '../config/database.js';

const schemaPath = fileURLToPath(new URL('../../sql/schema.sql', import.meta.url));
const schema = await readFile(schemaPath, 'utf8');
const statements = schema
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);
const connection = await pool.getConnection();

try {
  for (const statement of statements) await connection.query(statement);

  const [[activeColumn]] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'`,
  );
  if (!activeColumn) {
    await connection.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER role');
  }
  console.log(`Schema is ready in database ${databaseConfig.database}.`);
} finally {
  connection.release();
  await pool.end();
}
