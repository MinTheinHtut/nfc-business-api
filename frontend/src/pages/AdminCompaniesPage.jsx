import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api.js';
import AdminHeader from '../components/AdminHeader.jsx';

export default function AdminCompaniesPage() {
  const [companies,setCompanies]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [copied,setCopied]=useState(null);
  const nfcUrl=(tag)=>`${window.location.origin}/company/${encodeURIComponent(tag.public_token)}`;
  async function load(){setError('');try{const data=await apiRequest('/admin/companies');setCompanies(data.companies);}catch(e){setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  async function deactivate(company){if(!window.confirm(`Deactivate ${company.company_name}?`))return;try{await apiRequest(`/admin/companies/${company.id}`,{method:'DELETE'});await load();}catch(e){setError(e.message);}}
  async function copy(tag){try{await navigator.clipboard.writeText(nfcUrl(tag));setCopied(tag.id);window.setTimeout(()=>setCopied(null),1500);}catch{setError('Could not access the clipboard.');}}
  return <div className="admin-page"><AdminHeader/><main className="admin-content"><div className="page-heading"><div><span className="eyebrow">Organizer</span><h1>Visitors / Companies</h1></div><Link className="primary-link" to="/admin/visitors/new">Add visitor</Link></div>
    {error&&<div className="error-message">{error}</div>}{loading?<div className="panel">Loading visitors…</div>:<div className="visitor-grid">{companies.map(company=><article className="visitor-card" key={company.id}><div className="visitor-heading"><div><h2>{company.company_name}</h2><span>{company.company_code}</span></div><span className={`badge ${company.is_active?'active':'inactive'}`}>{company.is_active?'Active':'Inactive'}</span></div><p className="confirmation-count"><strong>{company.confirmations}</strong> confirmation{Number(company.confirmations)===1?'':'s'}</p><div className="tag-list"><h3>NFC Tags</h3>{company.nfc_tags.map(tag=><div className="visitor-tag" key={tag.id}><div><strong>{tag.tag_code}</strong><code>{tag.public_token}</code><span className={`badge ${tag.is_active?'active':'inactive'}`}>{tag.is_active?'Active':'Inactive'}</span></div><div className="action-row"><a href={`/company/${tag.public_token}`} target="_blank" rel="noreferrer">Open</a><button className="link-button" onClick={()=>copy(tag)}>{copied===tag.id?'URL copied.':'Copy URL'}</button></div></div>)}{!company.nfc_tags.length&&<p>No NFC tags assigned.</p>}</div><div className="action-row visitor-actions"><Link to={`/admin/visitors/${company.id}/edit`}>Edit</Link>{company.is_active&&<button className="link-button danger" onClick={()=>deactivate(company)}>Deactivate</button>}</div></article>)}</div>}
  </main></div>;
}
