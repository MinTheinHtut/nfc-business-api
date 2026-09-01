import pool from '../config/database.js';
import { createInitialNfcTag } from '../utils/initial-nfc-tag.js';

const companyFields = [
  'company_name', 'company_code', 'description', 'industry', 'country',
  'contact_name', 'contact_position', 'email', 'phone', 'website',
  'address', 'logo_url',
];

export function cleanCompany(body) {
  return Object.fromEntries(companyFields.map((field) => [
    field,
    typeof body[field] === 'string' ? body[field].trim() || null : null,
  ]));
}

export function validateCompany(company) {
  const errors = {};
  const limits = { company_name: 255, company_code: 50, description: 5000, industry: 150, country: 100, contact_name: 255, contact_position: 255, email: 255, phone: 100, website: 255, address: 5000, logo_url: 500 };
  if (!company.company_name) errors.company_name = 'Company name is required';
  if (company.company_code && !/^[A-Z0-9_-]+$/i.test(company.company_code)) errors.company_code = 'Use letters, numbers, hyphens, or underscores only';
  for (const [field, limit] of Object.entries(limits)) if (company[field] && company[field].length > limit) errors[field] = `Must be ${limit} characters or fewer`;
  if (company.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (company.website) {
    try {
      const url = new URL(company.website);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      errors.website = 'Website must be a valid http or https URL';
    }
  }
  if (company.logo_url) {
    try {
      const url = new URL(company.logo_url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      errors.logo_url = 'Logo URL must be a valid http or https URL';
    }
  }
  return errors;
}

function parseId(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    response.status(400).json({ message: 'Invalid company ID' });
    return null;
  }
  return id;
}

export async function listCompanies(request, response, next) {
  try {
    const [companies] = await pool.query(
      `SELECT c.*,
        (SELECT nt.public_token FROM nfc_tags nt WHERE nt.company_id = c.id AND nt.is_active = TRUE ORDER BY nt.id LIMIT 1) AS public_token,
        (SELECT nt.tag_code FROM nfc_tags nt WHERE nt.company_id = c.id AND nt.is_active = TRUE ORDER BY nt.id LIMIT 1) AS tag_code,
        (SELECT COUNT(*) FROM company_saves cs WHERE cs.company_id = c.id) AS confirmations
       FROM companies c ORDER BY c.company_name`,
    );
    const [tags] = await pool.query('SELECT id, company_id, tag_code, public_token, is_active FROM nfc_tags ORDER BY id');
    response.json({ companies: companies.map((company) => ({ ...company, nfc_tags: tags.filter((tag) => tag.company_id === company.id) })) });
  } catch (error) {
    next(error);
  }
}

export async function getCompany(request, response, next) {
  const id = parseId(request, response);
  if (!id) return;
  try {
    const [[company]] = await pool.execute(
      `SELECT c.*,
        (SELECT nt.public_token FROM nfc_tags nt
         WHERE nt.company_id = c.id AND nt.is_active = TRUE ORDER BY nt.id LIMIT 1) AS public_token
       FROM companies c WHERE c.id = ?`,
      [id],
    );
    if (!company) return response.status(404).json({ message: 'Company not found' });
    response.json({ company });
  } catch (error) {
    next(error);
  }
}

export async function createCompany(request, response, next) {
  const company = cleanCompany(request.body);
  if (!company.company_code) company.company_code = company.company_name?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || null;
  const errors = validateCompany(company);
  if (Object.keys(errors).length) {
    return response.status(400).json({ message: 'Please correct the highlighted fields', errors });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const baseCode = company.company_code;
    for (let suffix = 1; suffix < 100; suffix += 1) {
      const candidate = suffix === 1 ? baseCode : `${baseCode.slice(0, 5)}${suffix}`;
      const [[existing]] = await connection.execute('SELECT id FROM companies WHERE company_code = ?', [candidate]);
      if (!existing) { company.company_code = candidate; break; }
    }
    const values = companyFields.map((field) => company[field]);
    const [result] = await connection.execute(
      `INSERT INTO companies (${companyFields.join(', ')}) VALUES (${companyFields.map(() => '?').join(', ')})`,
      values,
    );
    const nfcTag = await createInitialNfcTag(connection, result.insertId, company.company_code);
    await connection.commit();
    response.status(201).json({ id: result.insertId, company_code: company.company_code, tag_code: nfcTag.tag_code, public_token: nfcTag.public_token, nfc_tag: nfcTag, message: 'Company created successfully. NFC tag generated automatically.' });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ message: 'Company code already exists', errors: { company_code: 'Company code must be unique' } });
    }
    next(error);
  } finally { connection.release(); }
}

export async function updateCompany(request, response, next) {
  const id = parseId(request, response);
  if (!id) return;
  const company = cleanCompany(request.body);
  const errors = validateCompany(company);
  if (Object.keys(errors).length) {
    return response.status(400).json({ message: 'Please correct the highlighted fields', errors });
  }
  const isActive = request.body.is_active === false || request.body.is_active === 0 ? 0 : 1;
  try {
    const assignments = companyFields.map((field) => `${field} = ?`).join(', ');
    const [result] = await pool.execute(
      `UPDATE companies SET ${assignments}, is_active = ? WHERE id = ?`,
      [...companyFields.map((field) => company[field]), isActive, id],
    );
    if (!result.affectedRows) return response.status(404).json({ message: 'Company not found' });
    response.json({ message: 'Company updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ message: 'Company code already exists', errors: { company_code: 'Company code must be unique' } });
    }
    next(error);
  }
}

export async function deactivateCompany(request, response, next) {
  const id = parseId(request, response);
  if (!id) return;
  try {
    const [result] = await pool.execute('UPDATE companies SET is_active = FALSE WHERE id = ?', [id]);
    if (!result.affectedRows) return response.status(404).json({ message: 'Company not found' });
    response.json({ message: 'Company deactivated successfully' });
  } catch (error) {
    next(error);
  }
}
