import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCompanyImport } from '../src/controllers/admin-company-import.controller.js';
import { createInitialNfcTag } from '../src/utils/initial-nfc-tag.js';
import { createCompanyWithInitialNfcTag } from '../src/services/company-creation.service.js';
import { readFile } from 'node:fs/promises';

function fakeConnection({ failTag = false } = {}) {
  let nextCompanyId = 100; const companies = []; const tags = []; const updates = [];
  return {
    companies, tags, updates,
    async execute(sql, values) {
      if (sql.startsWith('INSERT INTO companies')) { const id = nextCompanyId++; companies.push({ id, values }); return [{ insertId:id }]; }
      if (sql.startsWith('INSERT INTO nfc_tags')) { if (failTag) throw Object.assign(new Error('tag insert failed'), { code:'ER_NO_REFERENCED_ROW' }); const id = tags.length + 1; tags.push({ id, companyId:values[0], tagCode:values[1], token:values[2] }); return [{ insertId:id }]; }
      if (sql.startsWith('UPDATE companies')) { updates.push({ sql, values }); return [{ affectedRows:1 }]; }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

const createRow = (code) => ({ valid:true, action:'create', companyCode:code, data:{ company_code:code, company_name:`${code} Company` }, present:['company_code','company_name'], changes:{} });
const updateRow = (code, changes = { logo_url:{ old:'', new:'https://example.com/logo.png' } }) => ({ valid:true, action:'update', companyCode:code, data:{ company_code:code, company_name:`${code} Company`, logo_url:'https://example.com/logo.png' }, present:['company_code','company_name','logo_url'], changes });

test('initial tag belongs to its new company and uses the secure current format', async () => {
  const connection = fakeConnection(); const tag = await createInitialNfcTag(connection, 42, 'REALSCG');
  assert.equal(tag.company_id, 42); assert.equal(connection.tags.length, 1); assert.equal(connection.tags[0].companyId, 42);
  assert.match(tag.tag_code, /^NFC-REALSCG-001$/); assert.match(tag.public_token, /^REA-[A-Z2-9]{16}$/);
});

test('two new companies receive different tokens', async () => {
  const connection = fakeConnection(); const first = await createInitialNfcTag(connection, 1, 'REALSCG'); const second = await createInitialNfcTag(connection, 2, 'REALPTT');
  assert.notEqual(first.public_token, second.public_token); assert.equal(connection.tags.length, 2);
});

test('shared company creation creates exactly one company and one initial tag',async()=>{const connection=fakeConnection();const result=await createCompanyWithInitialNfcTag(connection,{fields:['company_code','company_name'],data:{company_code:'SHARED',company_name:'Shared Company'},companyCode:'SHARED'});assert.equal(connection.companies.length,1);assert.equal(connection.tags.length,1);assert.equal(result.nfcTag.company_id,result.companyId)});

test('shared company creation propagates NFC failure for caller rollback',async()=>{const connection=fakeConnection({failTag:true});await assert.rejects(()=>createCompanyWithInitialNfcTag(connection,{fields:['company_code','company_name'],data:{company_code:'FAIL',company_name:'Fail Company'},companyCode:'FAIL'}),/tag insert failed/);assert.equal(connection.companies.length,1);assert.equal(connection.tags.length,0)});

test('tag failure rejects the company creation operation for transaction rollback', async () => {
  await assert.rejects(() => createInitialNfcTag(fakeConnection({ failTag:true }), 42, 'FAILCO'), /tag insert failed/);
});

test('four imported CREATE rows generate four companies and four tags', async () => {
  const connection = fakeConnection(); const rows = ['REALSCG','REALPTT','REALAIS','REALBBL'].map(createRow);
  const result = await applyCompanyImport({ rows }, connection);
  assert.deepEqual(result, { created:4, updated:0, nfcTagsGenerated:4 }); assert.equal(connection.companies.length, 4); assert.equal(connection.tags.length, 4);
  assert.equal(new Set(connection.tags.map((tag) => tag.token)).size, 4);
});

test('import UPDATE and logo update create no tags', async () => {
  const connection = fakeConnection(); const result = await applyCompanyImport({ rows:[updateRow('REALSCG')] }, connection);
  assert.deepEqual(result, { created:0, updated:1, nfcTagsGenerated:0 }); assert.equal(connection.tags.length, 0); assert.equal(connection.updates.length, 1);
});

test('re-imported unchanged companies and companies with multiple tags remain untouched', async () => {
  const connection = fakeConnection(); const rows = ['REALSCG','REALPTT','REALAIS','REALBBL'].map((code) => updateRow(code, {}));
  const result = await applyCompanyImport({ rows }, connection);
  assert.deepEqual(result, { created:0, updated:0, nfcTagsGenerated:0 }); assert.equal(connection.tags.length, 0); assert.equal(connection.updates.length, 0);
});

test('manual create owns a transaction around the shared company and NFC service',async()=>{const source=await readFile(new URL('../src/controllers/admin-company.controller.js',import.meta.url),'utf8');const begin=source.indexOf('beginTransaction');const create=source.indexOf('createCompanyWithInitialNfcTag',source.indexOf('export async function createCompany'));const commit=source.indexOf('connection.commit',create);const rollback=source.indexOf('connection.rollback',commit);assert.ok(begin>-1&&begin<create&&create<commit&&commit<rollback)});
