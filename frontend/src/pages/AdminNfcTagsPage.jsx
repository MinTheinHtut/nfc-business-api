import { useEffect, useRef, useState } from 'react';
import { deleteAdminNfcTag, getAdminCompanies, getAdminNfcTags, saveAdminNfcTag } from '../api.js';
import AdminHeader from '../components/AdminHeader.jsx';
import { useAuth } from '../AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

const emptyForm = { id: null, tag_code: '', company_id: '', is_active: true, regenerate_token: false };

export default function AdminNfcTagsPage() {
  const { csrfToken } = useAuth(); const { t } = useI18n();
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
      setMessage(t('nfc.clipboardError'));
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
      setNotice(t('nfc.deleted',{ code:tag.tag_code }));
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
        <div className="page-heading"><div><span className="eyebrow">{t('common.organizer')}</span><h1>{t('nfc.title')}</h1><p>{t('nfc.intro')}</p></div></div>
        <form className="nfc-form panel" onSubmit={submit}>
          <div className="form-title">
            <h2>{t(form.id ? 'nfc.edit' : 'nfc.create')}</h2><p>{t('nfc.generatedUrl')}</p>
          </div>
          {message && <div className="error-message form-wide" role="alert">{message}</div>}
          {notice && <div className="success-message form-wide motion-feedback" role="status">{notice}</div>}
          <div className="form-field">
            <label htmlFor="tag_code">{t('nfc.tagCode')} *</label>
            <input id="tag_code" name="tag_code" value={form.tag_code} onChange={updateField} required aria-invalid={Boolean(errors.tag_code)} />
            {errors.tag_code && <small className="field-error">{errors.tag_code}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="company_id">{t('common.company')} *</label>
            <select id="company_id" name="company_id" value={form.company_id} onChange={updateField} required aria-invalid={Boolean(errors.company_id)}>
              <option value="">{t('nfc.selectCompany')}</option>
              {companies.map((company) => <option value={company.id} key={company.id}>{company.company_name} ({company.company_code})</option>)}
            </select>
            {errors.company_id && <small className="field-error">{errors.company_id}</small>}
          </div>
          {form.id && (
            <div className="nfc-options form-wide">
              <label className="checkbox"><input name="is_active" type="checkbox" checked={form.is_active} onChange={updateField} /> {t('nfc.tagActive')}</label><label className="checkbox"><input name="regenerate_token" type="checkbox" checked={form.regenerate_token} onChange={updateField} /> {t('nfc.regenerate')}</label>
            </div>
          )}
          <div className="form-actions form-wide">
            {form.id && <button className="secondary-button" type="button" onClick={() => setForm(emptyForm)}>{t('common.cancel')}</button>}
            <button className="primary-button compact" type="submit" disabled={submitting}>{t(submitting?'common.saving':form.id?'nfc.save':'nfc.create')}</button>
          </div>
        </form>

        <section className="nfc-list" aria-labelledby="nfc-list-title">
          <h2 id="nfc-list-title">{t('nfc.links')}</h2><p>{t('nfc.verify')}</p>
          {loading ? <div className="panel" role="status">{t('nfc.loading')}</div> : (
            <div className="nfc-grid">
              {tags.map((tag) => (
                <article className="nfc-card" key={tag.id}>
                  <div className="nfc-card-heading">
                    <div><strong>{tag.company_name}</strong><span>{tag.company_code}</span></div>
                    <span className={`badge ${tag.is_active ? 'active' : 'inactive'}`}>{t(tag.is_active?'common.active':'common.inactive')}</span>
                  </div>
                  <dl className="nfc-details">
                    <div><dt>{t('nfc.tag')}</dt><dd>{tag.tag_code}</dd></div><div><dt>{t('nfc.publicToken')}</dt><dd>{tag.public_token}</dd></div>
                  </dl>
                  <label htmlFor={`url-${tag.id}`}>{t('nfc.url')}</label>
                  <input id={`url-${tag.id}`} value={nfcUrl(tag)} readOnly onFocus={(event) => event.target.select()} />
                  <div className="action-row">
                    <a className="primary-link" href={`/company/${encodeURIComponent(tag.public_token)}`} target="_blank" rel="noreferrer">{t('common.open')}</a><button className="secondary-button" type="button" onClick={() => copyUrl(tag)}>{t(copiedId===tag.id?'nfc.copied':'common.copyUrl')}</button><button className="secondary-button" type="button" onClick={() => editTag(tag)}>{t('common.edit')}</button><button className="link-button danger" type="button" onClick={() => setPendingDelete(tag)}>{t('common.delete')}</button>
                  </div>
                </article>
              ))}
              {!tags.length && <div className="panel">{t('nfc.none')}</div>}
            </div>
          )}
        </section>
      </main>
      {pendingDelete && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingId) setPendingDelete(null); }}>
        <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-tag-title" aria-describedby="delete-tag-description">
          <span className="eyebrow">{t('nfc.permanent')}</span><h2 id="delete-tag-title">{t('nfc.deleteTitle')}</h2><p id="delete-tag-description">{t('nfc.deleteDescription',{code:pendingDelete.tag_code})}</p>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => setPendingDelete(null)} disabled={Boolean(deletingId)}>{t('common.cancel')}</button>
            <button ref={deleteButtonRef} className="primary-button danger-action" type="button" onClick={() => deleteTag(pendingDelete)} disabled={Boolean(deletingId)}>{t(deletingId?'common.deleting':'nfc.deleteTag')}</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
