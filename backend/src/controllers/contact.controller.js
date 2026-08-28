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

export async function getConfirmedContact(request, response, next) {
  const id = Number.parseInt(request.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return response.status(400).json({ message: 'Invalid contact' });
  try {
    const [[contact]] = await pool.execute(
      `SELECT cs.saved_at AS confirmed_at, c.id AS company_id, c.company_name,
              c.description, c.industry, c.country, c.contact_name, c.contact_position,
              c.email, c.phone, c.website, c.address, c.logo_url
       FROM company_saves cs JOIN companies c ON c.id = cs.company_id
       WHERE cs.user_id = ? AND c.id = ? LIMIT 1`, [request.session.user.id, id]);
    if (!contact) return response.status(404).json({ message: 'Contact not found' });
    return response.json({ contact });
  } catch (error) { return next(error); }
}
