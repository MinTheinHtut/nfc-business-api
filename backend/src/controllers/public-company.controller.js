import pool from '../config/database.js';

export async function getCompanyByToken(request, response, next) {
  const token = typeof request.params.token === 'string' ? request.params.token.trim() : '';

  if (!token) return response.status(400).json({ message: 'Invalid NFC link' });

  try {
    const [[company]] = await pool.execute(
      `SELECT c.id, c.company_name, c.company_code, c.description, c.industry,
              c.country, c.contact_name, c.contact_position, c.email, c.phone,
              c.website, c.address, c.logo_url, nt.id AS nfc_tag_id
       FROM nfc_tags nt
       JOIN companies c ON c.id = nt.company_id
       WHERE nt.public_token = ? AND nt.is_active = TRUE AND c.is_active = TRUE
       LIMIT 1`,
      [token],
    );

    if (!company) return response.status(404).json({ message: 'This NFC link is unavailable' });

    const { nfc_tag_id, ...publicCompany } = company;
    let confirmation = null;
    if (request.session?.user?.id) {
      const [[saved]] = await pool.execute(
        'SELECT saved_at FROM company_saves WHERE user_id = ? AND company_id = ?',
        [request.session.user.id, company.id],
      );
      if (saved) confirmation = { confirmedAt: saved.saved_at };
    }
    return response.json({ company: publicCompany, confirmation });
  } catch (error) {
    return next(error);
  }
}

export async function confirmCompanyContact(request, response, next) {
  const token = typeof request.params.token === 'string' ? request.params.token.trim() : '';
  if (!token) return response.status(400).json({ message: 'Invalid NFC link' });
  if (request.session.user.role !== 'exhibitor') return response.status(403).json({ message: 'Exhibitor access required' });

  try {
    const [[company]] = await pool.execute(
      `SELECT c.id, c.company_name FROM nfc_tags nt
       JOIN companies c ON c.id = nt.company_id
       WHERE nt.public_token = ? AND nt.is_active = TRUE AND c.is_active = TRUE LIMIT 1`,
      [token],
    );
    if (!company) return response.status(404).json({ message: 'This NFC link is unavailable' });

    const [result] = await pool.execute(
      'INSERT IGNORE INTO company_saves (user_id, company_id) VALUES (?, ?)',
      [request.session.user.id, company.id],
    );
    const [[confirmation]] = await pool.execute(
      'SELECT saved_at FROM company_saves WHERE user_id = ? AND company_id = ?',
      [request.session.user.id, company.id],
    );
    const alreadyConfirmed = result.affectedRows === 0;
    return response.json({
      success: true,
      alreadyConfirmed,
      message: alreadyConfirmed ? 'You already confirmed this contact.' : 'Contact confirmed successfully.',
      company: { id: company.id, company_name: company.company_name },
      confirmedAt: confirmation.saved_at,
    });
  } catch (error) {
    return next(error);
  }
}
