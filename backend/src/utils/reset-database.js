import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const databaseName = process.env.DB_NAME || 'nfc_business_matching';
if (process.env.NODE_ENV === 'production') throw new Error('Database reset is disabled in production.');
if (databaseName !== 'nfc_business_matching') throw new Error('Reset is restricted to the nfc_business_matching development database.');

const users = [
  ['admin', 'admin123', 'Administrator', 'admin@example.com', 'admin'],
  ['exhibitor1', 'exhibitor123', 'Demo Exhibitor One', 'exhibitor1@example.com', 'exhibitor'],
  ['exhibitor2', 'exhibitor123', 'Demo Exhibitor Two', 'exhibitor2@example.com', 'exhibitor'],
  ['exhibitor3', 'exhibitor123', 'Demo Exhibitor Three', 'exhibitor3@example.com', 'exhibitor'],
];
const companies = [
  ['ALT001', 'ALT Design Tech', 'Digital solutions for business events.', 'Digital Solutions', 'Thailand / Japan'],
  ['SAK001', 'Sakura Technology', 'Demo technology company from Japan.', 'Technology', 'Japan'],
  ['BKK001', 'Bangkok Digital Solutions', 'Demo digital services company from Thailand.', 'Digital Services', 'Thailand'],
  ['TESTCO', 'Test Company', 'Demo visitor used for the end-to-end NFC confirmation flow.', null, null],
];
const tags = [
  ['NFC-ALT-001', 'ALT-K8F29A', 'ALT001'],
  ['001', 'ALT-9MYF2Z', 'ALT001'],
  ['NFC-SAK-001', 'SAK-P4M72Q', 'SAK001'],
  ['NFC-BKK-001', 'BKK-R9C31L', 'BKK001'],
  ['NFC-TESTCO-001', 'TES-YHE4QJ', 'TESTCO'],
];

const connection = await pool.getConnection();
try {
  console.log('DEVELOPMENT ONLY: resetting nfc_business_matching demo data...');
  await connection.beginTransaction();
  await connection.query('DELETE FROM company_saves');
  await connection.query('DELETE FROM visits');
  await connection.query('DELETE FROM nfc_tags');
  await connection.query('DELETE FROM companies');
  await connection.query('DELETE FROM users');
  for (const [username,password,fullName,email,role] of users) {
    await connection.execute('INSERT INTO users (username,password_hash,full_name,email,role,is_active) VALUES (?,?,?,?,?,TRUE)', [username,await bcrypt.hash(password,12),fullName,email,role]);
  }
  for (const company of companies) {
    await connection.execute('INSERT INTO companies (company_code,company_name,description,industry,country,is_active) VALUES (?,?,?,?,?,TRUE)', company);
  }
  for (const [tagCode,token,companyCode] of tags) {
    const [[company]] = await connection.execute('SELECT id FROM companies WHERE company_code=?',[companyCode]);
    await connection.execute('INSERT INTO nfc_tags (company_id,tag_code,public_token,is_active) VALUES (?,?,?,TRUE)',[company.id,tagCode,token]);
  }
  await connection.commit();
  console.log('Reset complete: 1 admin, 3 exhibitors, 4 visitors, 5 NFC tags, 0 confirmations.');
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
