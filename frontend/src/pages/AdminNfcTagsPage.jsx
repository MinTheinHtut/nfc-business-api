import { useEffect, useRef, useState } from 'react';
import { deleteAdminNfcTag, getAdminCompanies, getAdminNfcTags, saveAdminNfcTag } from '../api.js';
import AdminHeader from '../components/AdminHeader.jsx';
import { useAuth } from '../AuthContext.jsx';

const emptyForm = { id: null, tag_code: '', company_id: '', is_active: true, regenerate_token: false };

export default function AdminNfcTagsPage() {
  const { csrfToken } = useAuth();
  const [tags, setTags] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [notice, setNotice] = useState('');
  const deleteButtonRef = useRef(null);

  function nfcUrl(tag) {
    return `${window.location.origin}/company/${encodeURIComponent(tag.public_token)}`;
  }

  async function loadData() {
    try {
      const [tagData, companyData] = await Promise.all([
        getAdminNfcTags(),
        getAdminCompanies(),
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

  useEffect(() => {
    if (!pendingDelete) return undefined;
    deleteButtonRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === 'Escape' && !deletingId) setPendingDelete(null);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [pendingDelete, deletingId]);

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
      await saveAdminNfcTag({ ...form, company_id: Number(form.company_id) }, csrfToken);
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

  async function deleteTag(tag) {
    setDeletingId(tag.id);
    setMessage('');
    setNotice('');
    try {
      await deleteAdminNfcTag(tag.id, csrfToken);
      if (form.id === tag.id) setForm(emptyForm);
      setPendingDelete(null);
      setNotice(`NFC tag ${tag.tag_code} was deleted. Saved connections were preserved.`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-page">
      <AdminHeader />
      <main className="admin-content">
        <div className="page-heading"><div><span className="eyebrow">Organizer</span><h1>NFC tags</h1><p>Link physical tags to company profiles and manage their public URLs.</p></div></div>
        <form className="nfc-form panel" onSubmit={submit}>
          <div className="form-title">
            <h2>{form.id ? 'Edit NFC tag' : 'Create NFC tag'}</h2>
            <p>The generated URL can be written manually to a physical NFC tag.</p>
          </div>
          {message && <div className="error-message form-wide" role="alert">{message}</div>}
          {notice && <div className="success-message form-wide motion-feedback" role="status">{notice}</div>}
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
          <h2 id="nfc-list-title">Tag links</h2>
          <p>Open a URL to verify the same profile visitors receive from an NFC tap.</p>
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
                    <button className="link-button danger" type="button" onClick={() => setPendingDelete(tag)}>Delete</button>
                  </div>
                </article>
              ))}
              {!tags.length && <div className="panel">No NFC tags yet.</div>}
            </div>
          )}
        </section>
      </main>
      {pendingDelete && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingId) setPendingDelete(null); }}>
        <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-tag-title" aria-describedby="delete-tag-description">
          <span className="eyebrow">Permanent action</span>
          <h2 id="delete-tag-title">Delete NFC tag?</h2>
          <p id="delete-tag-description"><strong>{pendingDelete.tag_code}</strong> will stop opening its public company profile. Existing saved connections will be preserved.</p>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => setPendingDelete(null)} disabled={Boolean(deletingId)}>Cancel</button>
            <button ref={deleteButtonRef} className="primary-button danger-action" type="button" onClick={() => deleteTag(pendingDelete)} disabled={Boolean(deletingId)}>{deletingId ? 'Deleting…' : 'Delete tag'}</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
