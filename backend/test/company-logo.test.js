import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanCompany, validateCompany } from '../src/controllers/admin-company.controller.js';
import { analyzeCompanyImport, parseCompanyWorkbook } from '../src/utils/company-import.js';

const executor = (records = []) => ({ query: async () => [records] });
const csv = (text) => ({ originalname: 'companies.csv', buffer: Buffer.from(text) });

test('company accepts an optional valid HTTPS or HTTP logo URL', () => {
  const withLogo = cleanCompany({ company_name:'Example', company_code:'EX1', logo_url:'  https://example.com/logo.png  ' });
  assert.equal(withLogo.logo_url, 'https://example.com/logo.png');
  assert.deepEqual(validateCompany(withLogo), {});
  const withoutLogo = cleanCompany({ company_name:'Example', company_code:'EX1', logo_url:'' });
  assert.equal(withoutLogo.logo_url, null);
  assert.deepEqual(validateCompany(withoutLogo), {});
  assert.deepEqual(validateCompany(cleanCompany({ company_name:'Example', company_code:'EX1', logo_url:'http://localhost/logo.png' })), {});
});

test('company logo can be changed or removed', () => {
  assert.equal(cleanCompany({ company_name:'Example', logo_url:'https://example.com/new.png' }).logo_url, 'https://example.com/new.png');
  assert.equal(cleanCompany({ company_name:'Example', logo_url:'   ' }).logo_url, null);
});

test('unsafe and malformed company logo URLs are rejected', () => {
  for (const logo_url of ['javascript:alert(1)', 'data:image/png;base64,abc', 'file:///tmp/logo.png', 'ftp://example.com/logo.png', 'not a url']) {
    assert.match(validateCompany(cleanCompany({ company_name:'Example', company_code:'EX1', logo_url })).logo_url, /valid http or https/i);
  }
});

test('import accepts canonical and alias logo headers', async () => {
  const canonical = await analyzeCompanyImport(await parseCompanyWorkbook(csv('company_code,company_name,logo_url\nA1,Alpha,https://example.com/a.png')), executor());
  assert.equal(canonical.rows[0].data.logo_url, 'https://example.com/a.png');
  const alias = await analyzeCompanyImport(await parseCompanyWorkbook(csv('company_code,company_name,company logo\nB1,Beta,https://example.com/b.png')), executor());
  assert.equal(alias.rows[0].data.logo_url, 'https://example.com/b.png');
});

test('blank imported logo does not erase an existing logo', async () => {
  const parsed = await parseCompanyWorkbook(csv('company_code,company_name,logo_url\nOLD1,Existing,'));
  const result = await analyzeCompanyImport(parsed, executor([{ company_code:'OLD1', company_name:'Existing', logo_url:'https://example.com/existing.png' }]));
  assert.equal(result.rows[0].changes.logo_url, undefined);
});
