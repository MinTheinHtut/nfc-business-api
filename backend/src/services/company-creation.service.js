import { createInitialNfcTag } from '../utils/initial-nfc-tag.js';

export async function createCompanyWithInitialNfcTag(executor,{fields,data,companyCode}){
  const values=fields.map(field=>data[field]??null);
  const[result]=await executor.execute(
    `INSERT INTO companies (${fields.join(', ')}) VALUES (${fields.map(()=>'?').join(', ')})`,
    values,
  );
  const nfcTag=await createInitialNfcTag(executor,result.insertId,companyCode);
  return{companyId:result.insertId,nfcTag};
}
