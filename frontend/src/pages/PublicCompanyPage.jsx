import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function PublicCompanyPage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCompany() {
      setCompanyLoading(true);
      setCompanyError('');
      setCompany(null);
      try {
        const result = await apiRequest(`/public/companies/${encodeURIComponent(token)}`);
        if (!active) return;
        setCompany(result.company);
        setConfirmation(result.confirmation
          ? { ...result.confirmation, message: 'You already confirmed this contact.' }
          : null);
      } catch {
        if (active) setCompanyError('Unable to load company profile.');
      } finally {
        if (active) setCompanyLoading(false);
      }
    }

    loadCompany();
    return () => { active = false; };
  }, [token]);

  async function handleConfirm() {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/company/${token}`)}`);
      return;
    }
    setSubmitting(true);
    setActionError('');
    try {
      const result = await apiRequest(`/public/companies/${encodeURIComponent(token)}/confirm`, { method: 'POST' });
      setConfirmation({ confirmedAt: result.confirmedAt, message: result.message });
    } catch (requestError) {
      if (requestError.status === 401) navigate(`/login?redirect=${encodeURIComponent(`/company/${token}`)}`);
      else setActionError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/saved');
    else setCancelled(true);
  }

  if (companyLoading) return <div className="loading" role="status">Loading company profile…</div>;

  if (companyError || !company) {
    return <main className="public-shell"><section className="public-card public-message"><span className="eyebrow">NFC Business Match</span><h1>Unable to load company profile.</h1><p>The NFC link may be invalid or inactive. Please ask the organizer for a valid link.</p><Link className="secondary-link" to="/login">Go to sign in</Link></section></main>;
  }

  const dashboard = user?.role === 'admin' ? '/admin' : '/saved';
  return (
    <main className="public-shell">
      <article className="public-card confirm-card">
        <header className="confirm-company">
          {company.logo_url ? <img src={company.logo_url} alt={`${company.company_name} logo`} /> : <div className="company-monogram" aria-hidden="true">{company.company_name.charAt(0)}</div>}
          <span className="eyebrow">{company.industry || 'Company contact'}</span>
          <h1>{company.company_name}</h1>
          {company.country && <p className="company-location">{company.country}</p>}
        </header>
        <section className="confirm-actions" aria-live="polite">
          {confirmation ? <>
            <div className="success-mark" aria-hidden="true">✓</div>
            <h2>{confirmation.message}</h2>
            {confirmation.confirmedAt && <p>Confirmed {new Date(confirmation.confirmedAt).toLocaleString()}</p>}
            <Link className="primary-link" to={dashboard}>Back to Dashboard</Link>
          </> : cancelled ? <>
            <h2>Contact not confirmed.</h2><p>No contact record was created.</p>
            {user ? <Link className="secondary-link" to={dashboard}>Back to Dashboard</Link> : <button className="secondary-button" type="button" onClick={() => setCancelled(false)}>Back</button>}
          </> : <>
            <h2>Do you want to confirm this contact?</h2>
            <p>{user ? `You are confirming as ${user.fullName}.` : 'You will be asked to sign in before confirming.'}</p>
            {actionError && <div className="error-message" role="alert">{actionError}</div>}
            <div className="confirm-buttons">
              <button className="secondary-button" type="button" onClick={handleCancel} disabled={submitting}>Cancel</button>
              <button className="primary-button compact" type="button" onClick={handleConfirm} disabled={submitting}>{submitting ? 'Confirming…' : 'Confirm'}</button>
            </div>
          </>}
        </section>
      </article>
    </main>
  );
}
