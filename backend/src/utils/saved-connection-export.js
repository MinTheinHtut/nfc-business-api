import { csvCell } from './csv-export.js';

export const SAVED_CONNECTION_EXPORT_COLUMNS = [
  ['Connection ID','connection_id'],['Exhibitor ID','exhibitor_id'],['Exhibitor Username','exhibitor_username'],
  ['Exhibitor Name','exhibitor_name'],['Exhibitor Email','exhibitor_email'],['Company ID','company_id'],
  ['Company Code','company_code'],['Company Name','company_name'],['Industry','industry'],['Country','country'],
  ['Contact Person','contact_person'],['Company Email','company_email'],['Company Phone','company_phone'],
  ['Company Website','company_website'],['Connected At','connected_at_export'],
];

export function savedConnectionsToCsv(rows){const header=SAVED_CONNECTION_EXPORT_COLUMNS.map(([label])=>csvCell(label)).join(',');const body=rows.map(row=>SAVED_CONNECTION_EXPORT_COLUMNS.map(([,key])=>csvCell(row[key])).join(','));return `\uFEFF${[header,...body].join('\r\n')}`}
