import pool from '../config/database.js';

export async function listConfirmedContacts(request, response, next) {
  try {
    const [contacts] = await pool.execute(
      `SELECT cs.id, cs.saved_at AS confirmed_at, c.id AS company_id,
              c.company_name, c.industry, c.country, c.logo_url
       FROM company_saves cs JOIN companies c ON c.id = cs.company_id
       WHERE cs.user_id = ? ORDER BY cs.saved_at DESC, cs.id DESC`,
      [request.session.user.id],
    );
    return response.json({ contacts });
  } catch (error) {
    return next(error);
  }
}
