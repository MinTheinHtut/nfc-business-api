import test from 'node:test';import assert from 'node:assert/strict';import { getInitialLanguage,translate } from './core.js';
test('defaults to English and rejects invalid stored languages',()=>{assert.equal(getInitialLanguage({getItem:()=>null}),'en');assert.equal(getInitialLanguage({getItem:()=>'fr'}),'en')});
test('restores supported Thai and Japanese preferences',()=>{assert.equal(getInitialLanguage({getItem:()=>'th'}),'th');assert.equal(getInitialLanguage({getItem:()=>'ja'}),'ja')});
test('translates all languages and interpolates values',()=>{assert.equal(translate('en','common.save'),'Save');assert.equal(translate('th','common.save'),'บันทึก');assert.equal(translate('ja','common.save'),'保存');assert.equal(translate('ja','dashboard.welcome',{name:'Aki'}),'おかえりなさい、Akiさん')});
test('missing locale entries fall back to English and unknown keys are hidden',()=>{assert.equal(translate('th','dashboard.organizerOverview'),'ภาพรวมผู้จัดงาน');assert.equal(translate('ja','does.not.exist'),'')});
test('arbitrary company-entered values are not dynamically translated',()=>{assert.equal(translate('th','Thai Airways International Public Company Limited'),'')});
