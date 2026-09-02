export const CONNECTION_EXPORT_COLUMNS=['connection_id','visitor_code','visitor_name','visitor_company','visitor_job_title','visitor_email','visitor_phone','preferred_language','connected_company_code','connected_company_name','connected_company_website','connected_at','status','notes','nfc_tag_code'];
export function neutralizeFormula(value){const text=String(value??'');return /^[=+\-@]/.test(text)?`'${text}`:text}
export function csvCell(value){const safe=neutralizeFormula(value).replaceAll('"','""');return `"${safe}"`}
export function connectionsToCsv(rows){return '\uFEFF'+[CONNECTION_EXPORT_COLUMNS.join(','),...rows.map(row=>CONNECTION_EXPORT_COLUMNS.map(column=>csvCell(row[column])).join(','))].join('\r\n')}
