import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const users = [
  ['admin', 'admin123', 'Administrator', 'admin@example.com', 'admin'],
  ['exhibitor1', 'exhibitor123', 'Demo Exhibitor One', 'exhibitor1@example.com', 'exhibitor'],
  ['exhibitor2', 'exhibitor123', 'Demo Exhibitor Two', 'exhibitor2@example.com', 'exhibitor'],
  ['exhibitor3', 'exhibitor123', 'Demo Exhibitor Three', 'exhibitor3@example.com', 'exhibitor'],
];
const companies = [
  ['ALT001', 'ALT Design Tech', 'Digital solutions for business events.', 'Digital Solutions', 'Thailand / Japan', 'Demo Contact', 'Business Development', 'contact@example.com', '+66 2 000 0001', 'https://example.com', 'Bangkok, Thailand', 'https://placehold.co/240x240/08745b/ffffff?text=ALT'],
  ['SAK001', 'Sakura Technology', 'Demo technology company from Japan.', 'Technology', 'Japan', 'Sakura Demo', 'Partnership Manager', 'sakura@example.com', '+81 3 0000 0002', 'https://example.com/sakura', 'Tokyo, Japan', 'https://placehold.co/240x240/123b31/ffffff?text=SAK'],
  // Demo-only broken URL verifies the frontend initials fallback without affecting production data.
  ['BKK001', 'Bangkok Digital Solutions', 'Demo digital services company from Thailand.', 'Digital Services', 'Thailand', 'Bangkok Demo', 'Account Manager', 'bangkok@example.com', '+66 2 000 0003', 'https://example.com/bangkok', 'Bangkok, Thailand', 'https://example.invalid/demo-logo.png'],
  ['TESTCO', 'Test Company', 'Demo visitor used for the end-to-end NFC confirmation flow.', null, null, null, null, null, null, null, null, null],
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
  await connection.beginTransaction();
  for (const [username, password, fullName, email, role] of users) {
    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(
      `INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name),
       email = VALUES(email), role = VALUES(role), is_active = TRUE`,
      [username, passwordHash, fullName, email, role],
    );
  }
  for (const company of companies) {
    await connection.execute(
      `INSERT INTO companies (company_code, company_name, description, industry, country, contact_name,
       contact_position, email, phone, website, address, logo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), description = VALUES(description),
       industry = VALUES(industry), country = VALUES(country), contact_name = VALUES(contact_name),
       contact_position = VALUES(contact_position), email = VALUES(email), phone = VALUES(phone),
       website = VALUES(website), address = VALUES(address), logo_url = VALUES(logo_url), is_active = TRUE`,
      company,
    );
  }
  for (const [tagCode, publicToken, companyCode] of tags) {
    const [[company]] = await connection.execute('SELECT id FROM companies WHERE company_code = ?', [companyCode]);
    await connection.execute(
      `INSERT INTO nfc_tags (company_id, tag_code, public_token) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE company_id = VALUES(company_id), public_token = VALUES(public_token), is_active = TRUE`,
      [company.id, tagCode, publicToken],
    );
  }
  await connection.commit();
  console.log('Seeded 4 users, 4 companies, and 5 NFC tags.');
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
