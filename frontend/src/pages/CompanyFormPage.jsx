import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAdminCompany, saveAdminCompany } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AdminHeader from '../components/AdminHeader.jsx';
import CompanyLogo, { safeLogoUrl } from '../components/CompanyLogo.jsx';

const empty = { company_name:'', company_code:'', description:'', industry:'', country:'', contact_name:'', contact_position:'', email:'', phone:'', website:'', address:'', logo_url:'', is_active:true };
const sections = [
  ['Basic information', [['company_name','Company name',true],['company_code','Company code (generated if blank)'],['industry','Industry'],['country','Country']]],
  ['Contact information', [['contact_name','Contact name'],['contact_position','Contact position'],['email','Email',false,'email'],['phone','Phone'],['website','Website',false,'url']]],
];

export default function CompanyFormPage() {
  const { csrfToken } = useAuth(); const { id } = useParams(); const editing = Boolean(id); const navigate = useNavigate();
  const [company, setCompany] = useState(empty); const [errors, setErrors] = useState({}); const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(editing); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!editing) return; getAdminCompany(id).then((data) => setCompany({ ...empty, ...data.company, is_active:Boolean(data.company.is_active) })).catch((error) => setMessage(error.message)).finally(() => setLoading(false)); }, [editing, id]);
  function update(event) { const { name, value, type, checked } = event.target; setCompany((current) => ({ ...current, [name]:type === 'checkbox' ? checked : value })); setErrors((current) => ({ ...current, [name]:undefined })); }
  async function submit(event) { event.preventDefault(); setErrors({}); setMessage(''); setSubmitting(true); try { await saveAdminCompany(company, editing ? id : null, csrfToken); navigate('/admin/companies', { replace:true }); } catch (error) { setMessage(error.message); setErrors(error.status === 400 || error.status === 409 ? error.errors || {} : {}); } finally { setSubmitting(false); } }
  if (loading) return <div className="loading" role="status">Loading company…</div>;
  return <div className="admin-page"><AdminHeader/><main className="admin-content narrow"><div className="page-heading"><div><span className="eyebrow">Company management</span><h1>{editing ? 'Edit company' : 'Add company'}</h1><p>Keep business and contact information accurate for the public NFC profile.</p></div></div><form className="company-form panel" onSubmit={submit}>{message && <div className="error-message form-wide" role="alert">{message}</div>}{sections.map(([title, fields]) => <fieldset className="form-section" key={title}><legend>{title}</legend>{fields.map(([name,label,required,type='text']) => <div className="form-field" key={name}><label htmlFor={name}>{label}{required ? ' *' : ''}</label><input id={name} name={name} type={type} value={company[name] || ''} onChange={update} required={required} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{errors[name] && <small id={`${name}-error`} className="field-error">{errors[name]}</small>}</div>)}</fieldset>)}
    <fieldset className="form-section"><legend>Company details</legend><div className="form-field form-wide"><label htmlFor="logo_url">Company Logo URL</label><input id="logo_url" name="logo_url" type="url" maxLength="500" placeholder="https://example.com/logo.png" value={company.logo_url || ''} onChange={update} aria-invalid={Boolean(errors.logo_url)} aria-describedby={`logo-url-help${errors.logo_url ? ' logo_url-error' : ''}`}/><small id="logo-url-help" className="field-help">Optional · Use a direct image URL</small>{errors.logo_url && <small id="logo_url-error" className="field-error">{errors.logo_url}</small>}{safeLogoUrl(company.logo_url) && <div className="logo-preview"><span>Preview</span><CompanyLogo logoUrl={company.logo_url} companyName={company.company_name} size="medium"/></div>}</div><div className="form-field form-wide"><label htmlFor="description">Description</label><textarea id="description" name="description" rows="5" value={company.description || ''} onChange={update}/></div><div className="form-field form-wide"><label htmlFor="address">Address</label><textarea id="address" name="address" rows="3" value={company.address || ''} onChange={update}/></div></fieldset>
    {editing && <label className="checkbox form-wide"><input name="is_active" type="checkbox" checked={company.is_active} onChange={update}/> Company is active</label>}<div className="form-actions form-wide"><Link className="secondary-link" to="/admin/companies">Cancel</Link><button className="primary-button compact" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save company'}</button></div></form></main></div>;
}
