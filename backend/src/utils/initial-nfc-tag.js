import { generatePublicToken } from './public-token.js';

export async function createInitialNfcTag(executor, companyId, companyCode) {
  const safeCode = String(companyCode || 'NFC').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 50) || 'NFC';
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const publicToken = generatePublicToken(safeCode);
    const tagCode = `NFC-${safeCode}-${String(attempt).padStart(3, '0')}`;
    try {
      const [result] = await executor.execute(
        'INSERT INTO nfc_tags (company_id, tag_code, public_token, is_active) VALUES (?, ?, ?, TRUE)',
        [companyId, tagCode, publicToken],
      );
      return { id: result.insertId, company_id: companyId, tag_code: tagCode, public_token: publicToken, is_active: 1 };
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error;
    }
  }
  const error = new Error('Could not generate a unique initial NFC tag');
  error.code = 'NFC_TAG_GENERATION_FAILED';
  throw error;
}
