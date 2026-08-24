import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const schemaPath = fileURLToPath(new URL('../../sql/schema.sql', import.meta.url));
const schema = await readFile(schemaPath, 'utf8');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

try {
  await connection.query(schema);
  const [[activeColumn]] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = 'nfc_business_matching' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'`,
  );
  if (!activeColumn) await connection.query('ALTER TABLE nfc_business_matching.users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER role');
  console.log('Database and tables created successfully.');
} finally {
  await connection.end();
}
