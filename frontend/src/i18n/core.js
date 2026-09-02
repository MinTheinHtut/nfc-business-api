import { translations } from './translations.js';
export const LANGUAGE_KEY='nfc-language';export const supportedLanguages=['en','th','ja'];
export function getInitialLanguage(storage=globalThis.localStorage){try{const saved=storage?.getItem(LANGUAGE_KEY);return supportedLanguages.includes(saved)?saved:'en'}catch{return'en'}}
function lookup(dictionary,key){return key.split('.').reduce((value,part)=>value?.[part],dictionary)}
export function translate(language,key,values={}){const template=lookup(translations[language],key)??lookup(translations.en,key)??'';return String(template).replace(/\{(\w+)\}/g,(_,name)=>values[name]??'')}
