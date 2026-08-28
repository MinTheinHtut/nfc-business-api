import pool from '../config/database.js';

export async function getAdminDashboard(request, response, next) {
  try {
    const [[summary]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'exhibitor' AND is_active = TRUE) AS total_exhibitors,
        (SELECT COUNT(*) FROM companies WHERE is_active = TRUE) AS total_companies,
        (SELECT COUNT(*) FROM company_saves) AS total_confirmations,
        (SELECT COUNT(*) FROM nfc_tags) AS total_nfc_tags,
        (SELECT COUNT(DISTINCT company_id) FROM company_saves) AS matched_companies`,
    );
    const [companies] = await pool.query(
      `SELECT c.id, c.company_name, COUNT(cs.id) AS confirmations
       FROM companies c LEFT JOIN company_saves cs ON cs.company_id = c.id
       GROUP BY c.id, c.company_name ORDER BY confirmations DESC, c.company_name`,
    );
    const [recentConfirmations] = await pool.query(
      `SELECT cs.id AS record_id, u.username, c.company_name, cs.saved_at AS confirmed_at
       FROM company_saves cs JOIN users u ON u.id = cs.user_id JOIN companies c ON c.id = cs.company_id
       ORDER BY cs.saved_at DESC, cs.id DESC LIMIT 8`,
    );
    response.json({ summary, companies, recentConfirmations });
  } catch (error) { next(error); }
}
