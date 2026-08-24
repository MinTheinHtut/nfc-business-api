import { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import AdminHeader from '../components/AdminHeader.jsx';

const emptyForm = { id: null, tag_code: '', company_id: '', is_active: true, regenerate_token: false };

export default function AdminNfcTagsPage() {
  const [tags, setTags] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  function nfcUrl(tag) {
    return `${window.location.origin}/company/${encodeURIComponent(tag.public_token)}`;
  }

  async function loadData() {
    try {
      const [tagData, companyData] = await Promise.all([
        apiRequest('/admin/nfc-tags'),
        apiRequest('/admin/companies'),
      ]);
      setTags(tagData.nfcTags);
      setCompanies(companyData.companies.filter((company) => company.is_active));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function editTag(tag) {
    setForm({ id: tag.id, tag_code: tag.tag_code, company_id: String(tag.company_id), is_active: Boolean(tag.is_active), regenerate_token: false });
    setErrors({});
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setErrors({});
    try {
      await apiRequest(form.id ? `/admin/nfc-tags/${form.id}` : '/admin/nfc-tags', {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, company_id: Number(form.company_id) }),
      });
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      setMessage(error.message);
      setErrors(error.errors || {});
    } finally {
      setSubmitting(false);
    }
  }

  async function copyUrl(tag) {
    try {
      await navigator.clipboard.writeText(nfcUrl(tag));
      setCopiedId(tag.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setMessage('Could not access the clipboard. Select and copy the URL manually.');
    }
  }

  return (
    <div className="admin-page">
      <AdminHeader />
      <main className="admin-content">
        <div className="page-heading"><div><span className="eyebrow">Organizer</span><h1>NFC Simulation</h1><p>Opening one of these URLs simulates tapping the corresponding NFC tag. The physical NFC tag will later contain this same URL.</p></div></div>
        <form className="nfc-form panel" onSubmit={submit}>
          <div className="form-title">
            <h2>{form.id ? 'Edit NFC tag' : 'Create NFC tag'}</h2>
            <p>The generated URL can be written manually to a physical NFC tag.</p>
          </div>
          {message && <div className="error-message form-wide" role="alert">{message}</div>}
          <div className="form-field">
            <label htmlFor="tag_code">Tag Code *</label>
            <input id="tag_code" name="tag_code" value={form.tag_code} onChange={updateField} required aria-invalid={Boolean(errors.tag_code)} />
            {errors.tag_code && <small className="field-error">{errors.tag_code}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="company_id">Company *</label>
            <select id="company_id" name="company_id" value={form.company_id} onChange={updateField} required aria-invalid={Boolean(errors.company_id)}>
              <option value="">Select a company</option>
              {companies.map((company) => <option value={company.id} key={company.id}>{company.company_name} ({company.company_code})</option>)}
            </select>
            {errors.company_id && <small className="field-error">{errors.company_id}</small>}
          </div>
          {form.id && (
            <div className="nfc-options form-wide">
              <label className="checkbox"><input name="is_active" type="checkbox" checked={form.is_active} onChange={updateField} /> Tag is active</label>
              <label className="checkbox"><input name="regenerate_token" type="checkbox" checked={form.regenerate_token} onChange={updateField} /> Generate a new public token</label>
            </div>
          )}
          <div className="form-actions form-wide">
            {form.id && <button className="secondary-button" type="button" onClick={() => setForm(emptyForm)}>Cancel edit</button>}
            <button className="primary-button compact" type="submit" disabled={submitting}>{submitting ? 'Saving…' : form.id ? 'Save NFC tag' : 'Create NFC tag'}</button>
          </div>
        </form>

        <section className="nfc-list" aria-labelledby="nfc-list-title">
          <h2 id="nfc-list-title">NFC Demo Links</h2>
          <p>Opening these URLs simulates tapping the NFC tag.</p>
          {loading ? <div className="panel" role="status">Loading NFC tags…</div> : (
            <div className="nfc-grid">
              {tags.map((tag) => (
                <article className="nfc-card" key={tag.id}>
                  <div className="nfc-card-heading">
                    <div><strong>{tag.company_name}</strong><span>{tag.company_code}</span></div>
                    <span className={`badge ${tag.is_active ? 'active' : 'inactive'}`}>{tag.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <dl className="nfc-details">
                    <div><dt>Tag</dt><dd>{tag.tag_code}</dd></div>
                    <div><dt>Public token</dt><dd>{tag.public_token}</dd></div>
                  </dl>
                  <label htmlFor={`url-${tag.id}`}>NFC URL</label>
                  <input id={`url-${tag.id}`} value={nfcUrl(tag)} readOnly onFocus={(event) => event.target.select()} />
                  <div className="action-row">
                    <a className="primary-link" href={`/company/${encodeURIComponent(tag.public_token)}`} target="_blank" rel="noreferrer">Open</a>
                    <button className="secondary-button" type="button" onClick={() => copyUrl(tag)}>{copiedId === tag.id ? 'URL copied.' : 'Copy URL'}</button>
                    <button className="secondary-button" type="button" onClick={() => editTag(tag)}>Edit</button>
                  </div>
                </article>
              ))}
              {!tags.length && <div className="panel">No NFC tags yet.</div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
