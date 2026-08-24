import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api.js';
import AdminHeader from '../components/AdminHeader.jsx';

const emptyCompany = {
  company_name: '', company_code: '', description: '', industry: '', country: '',
  contact_name: '', contact_position: '', email: '', phone: '', website: '',
  address: '', logo_url: '', is_active: true,
};

const fields = [
  ['company_name', 'Company Name', true], ['company_code', 'Company Code (generated if blank)'],
  ['industry', 'Industry'], ['country', 'Country'], ['contact_name', 'Contact Name'],
  ['contact_position', 'Contact Position'], ['email', 'Email', false, 'email'],
  ['phone', 'Phone'], ['website', 'Website', false, 'url'], ['logo_url', 'Logo URL', false, 'url'],
];

export default function CompanyFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const visitorMode = location.pathname.startsWith('/admin/visitors');
  const [company, setCompany] = useState(emptyCompany);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editing) return;
    apiRequest(`/admin/companies/${id}`)
      .then((data) => setCompany({ ...emptyCompany, ...data.company, is_active: Boolean(data.company.is_active) }))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setCompany((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    setErrors({});
    setMessage('');
    setSubmitting(true);
    try {
      await apiRequest(editing ? `/admin/companies/${id}` : '/admin/companies', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(company),
      });
      navigate(visitorMode ? '/admin/visitors' : '/admin/companies', { replace: true });
    } catch (error) {
      setMessage(error.message);
      setErrors(error.status === 400 || error.status === 409 ? error.errors || {} : {});
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading" role="status">Loading company…</div>;

  return (
    <div className="admin-page">
      <AdminHeader />
      <main className="admin-content narrow">
        <div className="page-heading"><div><span className="eyebrow">Visitor management</span><h1>{editing ? 'Edit visitor' : 'Add visitor'}</h1></div></div>
        <form className="company-form panel" onSubmit={submit}>
          {message && <div className="error-message form-wide" role="alert">{message}</div>}
          {fields.map(([name, label, required, type = 'text']) => (
            <div className="form-field" key={name}>
              <label htmlFor={name}>{label}{required ? ' *' : ''}</label>
              <input id={name} name={name} type={type} value={company[name] || ''} onChange={updateField} required={required} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} />
              {errors[name] && <small id={`${name}-error`} className="field-error">{errors[name]}</small>}
            </div>
          ))}
          <div className="form-field form-wide">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows="5" value={company.description || ''} onChange={updateField} />
          </div>
          <div className="form-field form-wide">
            <label htmlFor="address">Address</label>
            <textarea id="address" name="address" rows="3" value={company.address || ''} onChange={updateField} />
          </div>
          {editing && <label className="checkbox form-wide"><input name="is_active" type="checkbox" checked={company.is_active} onChange={updateField} /> Company is active</label>}
          <div className="form-actions form-wide">
            <Link className="secondary-link" to={visitorMode ? '/admin/visitors' : '/admin/companies'}>Cancel</Link>
            <button className="primary-button compact" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save company'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
