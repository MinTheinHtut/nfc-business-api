import { Readable } from 'node:stream';
import path from 'node:path';
import ExcelJS from 'exceljs';

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;
export const IMPORT_EXTENSIONS = new Set(['.csv', '.xlsx']);

const aliases = {
  company_code: ['company_code', 'company code', 'code'],
  company_name: ['company_name', 'company name', 'name'],
  industry: ['industry'], country: ['country'], website: ['website', 'website url', 'url'],
  email: ['email', 'email address'], phone: ['phone', 'telephone', 'phone number'],
  address: ['address'], description: ['description', 'company description'],
  contact_name: ['contact_name', 'contact name', 'contact person', 'contact_person'],
  contact_position: ['contact_position', 'contact position', 'position'],
  logo_url: ['logo_url', 'logo url'], is_active: ['is_active', 'is active', 'active', 'status'],
};
const aliasLookup = new Map(Object.entries(aliases).flatMap(([field, names]) => names.map((name) => [normalizeHeader(name), field])));
const lengths = { company_code: 50, company_name: 255, industry: 150, country: 100, website: 255, email: 255, phone: 100, contact_name: 255, contact_position: 255, logo_url: 500 };

export function normalizeHeader(value) { return String(value ?? '').trim().toLowerCase().replace(/[_\s-]+/g, ' '); }
function cellValue(cell) {
  const value = cell?.value;
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('result' in value) return value.result == null ? '' : String(value.result).trim();
    if ('text' in value) return String(value.text).trim();
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('').trim();
  }
  return String(value).trim();
}
function parseActive(value) {
  const normalized = String(value).trim().toLowerCase();
  if (['true','1','yes','active'].includes(normalized)) return 1;
  if (['false','0','no','inactive'].includes(normalized)) return 0;
  return null;
}
function normalizeWebsite(value) {
  if (!value) return '';
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try { const url = new URL(candidate); return ['http:','https:'].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}

export async function parseCompanyWorkbook(file) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (!IMPORT_EXTENSIONS.has(extension)) throw Object.assign(new Error('Use a .csv or .xlsx file.'), { status: 400 });
  if (!file.buffer?.length) throw Object.assign(new Error('The uploaded file is empty.'), { status: 400 });
  const workbook = new ExcelJS.Workbook();
  try {
    if (extension === '.csv') await workbook.csv.read(Readable.from(file.buffer), { map: (value) => value });
    else await workbook.xlsx.load(file.buffer);
  } catch { throw Object.assign(new Error('The spreadsheet could not be read. Check the file and try again.'), { status: 400 }); }
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.actualRowCount < 1) throw Object.assign(new Error('The workbook does not contain any rows.'), { status: 400 });
  if (worksheet.actualRowCount - 1 > MAX_IMPORT_ROWS) throw Object.assign(new Error(`The spreadsheet exceeds the ${MAX_IMPORT_ROWS.toLocaleString()} row limit.`), { status: 400 });
  const headerRow = worksheet.getRow(1); const columns = new Map(); const unknownHeaders = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, number) => { const raw = cellValue(cell); const field = aliasLookup.get(normalizeHeader(raw)); if (field && !columns.has(field)) columns.set(field, number); else if (raw && !field) unknownHeaders.push(raw); });
  const missing = ['company_code','company_name'].filter((field) => !columns.has(field));
  if (missing.length) throw Object.assign(new Error(`Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`), { status: 400 });
  const rows = [];
  for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber); const data = {}; const present = [];
    for (const [field, column] of columns) { const value = cellValue(row.getCell(column)); if (value !== '') { data[field] = value; present.push(field); } }
    if (!present.length) continue;
    rows.push({ rowNumber, data, present });
  }
  if (!rows.length) throw Object.assign(new Error('The spreadsheet does not contain any company rows.'), { status: 400 });
  return { rows, unknownHeaders };
}

function validateRow(row) {
  const data = { ...row.data }; const errors = [];
  data.company_code = String(data.company_code || '').trim().toUpperCase();
  data.company_name = String(data.company_name || '').trim();
  if (!data.company_code) errors.push('Company code is required.');
  if (data.company_code && !/^[A-Z0-9_-]+$/.test(data.company_code)) errors.push('Company code may contain only letters, numbers, hyphens, or underscores.');
  if (!data.company_name) errors.push('Company name is required.');
  for (const [field, max] of Object.entries(lengths)) if (data[field] && String(data[field]).length > max) errors.push(`${field.replaceAll('_',' ')} must be ${max} characters or fewer.`);
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email address is invalid.');
  if (data.website) { const website = normalizeWebsite(data.website); if (!website) errors.push('Website must be a valid HTTP or HTTPS URL.'); else data.website = website; }
  if (data.logo_url) { const logo = normalizeWebsite(data.logo_url); if (!logo) errors.push('Logo URL must be a valid HTTP or HTTPS URL.'); else data.logo_url = logo; }
  if (data.is_active !== undefined) { const active = parseActive(data.is_active); if (active == null) errors.push('Active status must be true/false, 1/0, yes/no, or active/inactive.'); else data.is_active = active; }
  return { ...row, data, errors };
}

export async function analyzeCompanyImport(parsed, executor) {
  const checked = parsed.rows.map(validateRow); const counts = new Map();
  for (const row of checked) if (row.data.company_code) counts.set(row.data.company_code, (counts.get(row.data.company_code) || 0) + 1);
  for (const row of checked) if (counts.get(row.data.company_code) > 1) row.errors.push('Duplicate company code in this file.');
  const codes = [...new Set(checked.map((row) => row.data.company_code).filter(Boolean))];
  const existing = new Map();
  if (codes.length) { const placeholders = codes.map(() => '?').join(','); const [records] = await executor.query(`SELECT * FROM companies WHERE company_code IN (${placeholders})`, codes); for (const record of records) existing.set(String(record.company_code).toUpperCase(), record); }
  const rows = checked.map((row) => {
    const current = existing.get(row.data.company_code); const action = current ? 'update' : 'create'; const changes = {};
    if (current) for (const field of row.present) { if (field === 'company_code' || row.data[field] === undefined) continue; const oldValue = current[field] == null ? '' : current[field]; if (String(oldValue) !== String(row.data[field])) changes[field] = { old: oldValue, new: row.data[field] }; }
    return { rowNumber: row.rowNumber, action, valid: row.errors.length === 0, companyCode: row.data.company_code, data: row.data, changes, errors: row.errors, present: row.present };
  });
  return { summary: { totalRows: rows.length, newRows: rows.filter((r) => r.valid && r.action === 'create').length, updateRows: rows.filter((r) => r.valid && r.action === 'update').length, invalidRows: rows.filter((r) => !r.valid).length }, rows, unknownHeaders: parsed.unknownHeaders };
}

export function publicImportResult(analysis) { return { ...analysis, rows: analysis.rows.map(({ present, ...row }) => row) }; }
