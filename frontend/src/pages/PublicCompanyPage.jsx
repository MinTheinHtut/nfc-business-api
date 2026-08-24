import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function PublicCompanyPage() {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    setError('');
    apiRequest(`/public/companies/${encodeURIComponent(token)}`)
      .then(({ company: result, confirmation: existing }) => {
        setCompany(result);
        setConfirmation(existing ? { ...existing, message: 'You already confirmed this contact.' } : null);
      })
      .catch((requestError) => setError(requestError.message));
  }, [token, user, authLoading]);

  async function handleConfirm() {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/company/${token}`)}`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await apiRequest(`/public/companies/${encodeURIComponent(token)}/confirm`, { method: 'POST' });
      setConfirmation({ confirmedAt: result.confirmedAt, message: result.message });
    } catch (requestError) {
      if (requestError.status === 401) navigate(`/login?redirect=${encodeURIComponent(`/company/${token}`)}`);
      else setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/saved');
    else setCancelled(true);
  }

  if (error) {
    return <main className="public-shell"><section className="public-card public-message"><span className="eyebrow">NFC Business Match</span><h1>Invalid or inactive NFC link.</h1><p>Please ask the organizer for a valid NFC link.</p><Link className="secondary-link" to="/login">Go to sign in</Link></section></main>;
  }

  if (!company) return <div className="loading">Loading company profile…</div>;

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
            {error && <div className="error-message" role="alert">{error}</div>}
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
