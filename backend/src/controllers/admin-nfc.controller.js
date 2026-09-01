import pool from '../config/database.js';
import { generatePublicToken } from '../utils/public-token.js';

const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function withPublicUrl(tag) {
  return { ...tag, public_url: `${frontendUrl}/company/${tag.public_token}` };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function findCompany(companyId) {
  const [[company]] = await pool.execute(
    'SELECT id, company_code FROM companies WHERE id = ? AND is_active = TRUE',
    [companyId],
  );
  return company;
}

async function uniqueToken(companyCode) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generatePublicToken(companyCode);
    const [[existing]] = await pool.execute('SELECT id FROM nfc_tags WHERE public_token = ?', [token]);
    if (!existing) return token;
  }
  throw new Error('Could not generate a unique public token');
}

export async function listNfcTags(request, response, next) {
  try {
    const [tags] = await pool.query(
      `SELECT nt.id, nt.company_id, nt.tag_code, nt.public_token, nt.is_active, nt.created_at,
              c.company_name, c.company_code
       FROM nfc_tags nt JOIN companies c ON c.id = nt.company_id
       ORDER BY nt.created_at DESC, nt.id DESC`,
    );
    response.json({ nfcTags: tags.map(withPublicUrl) });
  } catch (error) {
    next(error);
  }
}

export async function createNfcTag(request, response, next) {
  const tagCode = typeof request.body.tag_code === 'string' ? request.body.tag_code.trim() : '';
  const companyId = parseId(request.body.company_id);
  const errors = {};
  if (!tagCode) errors.tag_code = 'Tag code is required';
  if (!companyId) errors.company_id = 'Select a company';
  if (Object.keys(errors).length) return response.status(400).json({ message: 'Please correct the highlighted fields', errors });

  try {
    const company = await findCompany(companyId);
    if (!company) return response.status(400).json({ message: 'Select an active company', errors: { company_id: 'Company is unavailable' } });
    const publicToken = await uniqueToken(company.company_code);
    const [result] = await pool.execute(
      'INSERT INTO nfc_tags (company_id, tag_code, public_token) VALUES (?, ?, ?)',
      [companyId, tagCode, publicToken],
    );
    response.status(201).json({
      message: 'NFC tag created successfully',
      nfcTag: withPublicUrl({ id: result.insertId, company_id: companyId, tag_code: tagCode, public_token: publicToken, is_active: 1 }),
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ message: 'Tag code already exists', errors: { tag_code: 'Tag code must be unique' } });
    }
    next(error);
  }
}

export async function updateNfcTag(request, response, next) {
  const id = parseId(request.params.id);
  const companyId = parseId(request.body.company_id);
  const tagCode = typeof request.body.tag_code === 'string' ? request.body.tag_code.trim() : '';
  if (!id) return response.status(400).json({ message: 'Invalid NFC tag ID' });
  const errors = {};
  if (!tagCode) errors.tag_code = 'Tag code is required';
  if (!companyId) errors.company_id = 'Select a company';
  if (Object.keys(errors).length) return response.status(400).json({ message: 'Please correct the highlighted fields', errors });

  try {
    const company = await findCompany(companyId);
    if (!company) return response.status(400).json({ message: 'Select an active company', errors: { company_id: 'Company is unavailable' } });
    const [[current]] = await pool.execute('SELECT public_token FROM nfc_tags WHERE id = ?', [id]);
    if (!current) return response.status(404).json({ message: 'NFC tag not found' });
    const publicToken = request.body.regenerate_token ? await uniqueToken(company.company_code) : current.public_token;
    const isActive = request.body.is_active === false || request.body.is_active === 0 ? 0 : 1;
    await pool.execute(
      'UPDATE nfc_tags SET company_id = ?, tag_code = ?, public_token = ?, is_active = ? WHERE id = ?',
      [companyId, tagCode, publicToken, isActive, id],
    );
    response.json({ message: 'NFC tag updated successfully', nfcTag: withPublicUrl({ id, company_id: companyId, tag_code: tagCode, public_token: publicToken, is_active: isActive }) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ message: 'Tag code already exists', errors: { tag_code: 'Tag code must be unique' } });
    }
    next(error);
  }
}

export async function deleteNfcTag(request, response, next) {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: 'Invalid NFC tag ID' });

  try {
    const [result] = await pool.execute('DELETE FROM nfc_tags WHERE id = ?', [id]);
    if (!result.affectedRows) return response.status(404).json({ message: 'NFC tag not found' });
    return response.json({ message: 'NFC tag deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
