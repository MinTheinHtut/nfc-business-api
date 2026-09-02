import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('automatic exhibitor connection remains idempotent and rejects admin saves',async()=>{const source=await read('../src/controllers/public-company.controller.js');assert.match(source,/INSERT IGNORE INTO company_saves/);assert.match(source,/affectedRows === 0/);assert.match(source,/role !== 'exhibitor'/)});
test('company save uniqueness remains the database authority',async()=>{const schema=await read('../../database/schema.sql');assert.match(schema,/UNIQUE KEY `uq_company_saves_user_company` \(`user_id`, `company_id`\)/)});
test('admin exhibitor detail returns connected companies newest first',async()=>{const source=await read('../src/controllers/admin-exhibitor.controller.js');assert.match(source,/FROM company_saves cs JOIN companies c/);assert.match(source,/ORDER BY cs\.saved_at DESC,cs\.id DESC/);assert.match(source,/res\.json\(\{exhibitor,connections\}\)/)});
