import multer from 'multer';
import pool from '../config/database.js';
import { analyzeCompanyImport, IMPORT_EXTENSIONS, MAX_IMPORT_BYTES, parseCompanyWorkbook, publicImportResult } from '../utils/company-import.js';
import path from 'node:path';
import { createInitialNfcTag } from '../utils/initial-nfc-tag.js';

const spreadsheetMimeTypes = new Set(['text/csv','application/csv','text/plain','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/octet-stream','application/zip']);
export const companyImportUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMPORT_BYTES, files: 1 }, fileFilter(request, file, callback) { const extension = path.extname(file.originalname || '').toLowerCase(); if (!IMPORT_EXTENSIONS.has(extension) || (file.mimetype && !spreadsheetMimeTypes.has(file.mimetype))) return callback(Object.assign(new Error('Use a .csv or .xlsx file.'), { status: 400 })); callback(null, true); } }).single('file');

export function handleCompanyImportUpload(request, response, next) { companyImportUpload(request, response, (error) => { if (!error) return next(); if (error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ message: 'The spreadsheet exceeds the 10 MB limit.' }); response.status(error.status || 400).json({ message: error.message || 'The spreadsheet could not be uploaded.' }); }); }

async function prepare(request) {
  if (!request.file) throw Object.assign(new Error('Choose a CSV or Excel file to upload.'), { status: 400 });
  return analyzeCompanyImport(await parseCompanyWorkbook(request.file), pool);
}

export async function previewCompanyImport(request, response, next) { try { response.json(publicImportResult(await prepare(request))); } catch (error) { if (error.status) return response.status(error.status).json({ message: error.message }); next(error); } }

export async function applyCompanyImport(analysis, connection) {
  let created = 0; let updated = 0; let nfcTagsGenerated = 0;
  for (const row of analysis.rows.filter((item) => item.valid)) {
    if (row.action === 'create') {
      const fields = ['company_code','company_name',...row.present.filter((field) => !['company_code','company_name'].includes(field))];
      const uniqueFields = [...new Set(fields)]; if (!uniqueFields.includes('is_active')) { uniqueFields.push('is_active'); row.data.is_active = 1; }
      const [companyResult] = await connection.execute(`INSERT INTO companies (${uniqueFields.join(',')}) VALUES (${uniqueFields.map(() => '?').join(',')})`, uniqueFields.map((field) => row.data[field] ?? null));
      await createInitialNfcTag(connection, companyResult.insertId, row.companyCode);
      created += 1; nfcTagsGenerated += 1;
    } else if (Object.keys(row.changes).length) {
      const fields = Object.keys(row.changes); await connection.execute(`UPDATE companies SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE company_code = ?`, [...fields.map((field) => row.data[field]), row.companyCode]); updated += 1;
    }
  }
  return { created, updated, nfcTagsGenerated };
}

export async function commitCompanyImport(request, response, next) {
  let analysis; try { analysis = await prepare(request); } catch (error) { if (error.status) return response.status(error.status).json({ message: error.message }); return next(error); }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { created, updated, nfcTagsGenerated } = await applyCompanyImport(analysis, connection);
    await connection.commit();
    const result = { created, updated, nfcTagsGenerated, skipped: analysis.summary.invalidRows, errors: analysis.rows.filter((row) => !row.valid).map((row) => ({ rowNumber: row.rowNumber, companyCode: row.companyCode, errors: row.errors })) };
    console.info('Company import completed', { adminUserId: request.session.user.id, rowsProcessed: analysis.summary.totalRows, ...result, errors: undefined, timestamp: new Date().toISOString() });
    response.json(result);
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
}
