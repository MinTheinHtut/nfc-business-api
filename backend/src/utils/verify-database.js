import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const expectedTables = ['companies', 'company_saves', 'nfc_tags', 'users', 'visits'];

try {
  const [tableRows] = await pool.query('SHOW TABLES');
  const tables = tableRows.map((row) => Object.values(row)[0]).sort();
  const [users] = await pool.query(
    'SELECT username, full_name, email, role FROM users ORDER BY id',
  );
  const [[admin]] = await pool.execute(
    'SELECT password_hash FROM users WHERE username = ?',
    ['admin'],
  );
  const [companies] = await pool.query(
    'SELECT company_code, company_name, industry, country FROM companies ORDER BY id',
  );
  const [tags] = await pool.query(
    'SELECT tag_code, public_token FROM nfc_tags ORDER BY id',
  );
  const [[visitTagColumn]] = await pool.execute(
    `SELECT COLUMN_TYPE, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    ['visits', 'nfc_tag_id'],
  );

  const tablesMatch = JSON.stringify(tables) === JSON.stringify(expectedTables);
  const adminPasswordValid = Boolean(admin) && await bcrypt.compare('admin123', admin.password_hash);

  console.log({
    tables,
    tablesMatch,
    users,
    companies,
    nfcTags: tags,
    adminPasswordHashValid: adminPasswordValid,
    visitsNfcTagColumn: visitTagColumn,
  });

  if (!tablesMatch || !adminPasswordValid) {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
