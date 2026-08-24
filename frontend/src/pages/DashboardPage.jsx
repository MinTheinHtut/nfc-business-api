import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function DashboardPage({ admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    if (admin) { apiRequest('/admin/dashboard').then(setAdminData).catch((requestError)=>setError(requestError.message)); return; }
    apiRequest('/contacts').then(({ contacts: result }) => setContacts(result)).catch((requestError) => setError(requestError.message));
  }, [admin]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="page-shell">
      <section className="welcome-card dashboard-card">
        <span className="eyebrow">{admin ? 'Organizer dashboard' : 'Saved companies'}</span>
        <h1>Hello, {user.fullName}</h1>
        <p>
          {admin ? 'Manage companies and their NFC tags for the event.' : 'Your confirmed NFC contacts appear below.'}
        </p>
        <div className="user-row">
          <span className="status">Signed in as {user.role}</span>
          {admin && <Link className="primary-link" to="/admin/companies">Manage companies</Link>}
          {admin && <Link className="secondary-link" to="/admin/nfc-tags">Manage NFC tags</Link>}
          <button className="secondary-button" type="button" onClick={handleLogout}>Logout</button>
        </div>
        {admin && <>
          {error&&<div className="error-message">{error}</div>}
          {adminData&&<><section className="summary-grid">
            <article><span>Active Exhibitors</span><strong>{adminData.summary.total_exhibitors}</strong></article><article><span>Active Visitors</span><strong>{adminData.summary.total_companies}</strong></article><article><span>Total Confirmations</span><strong>{adminData.summary.total_confirmations}</strong></article><article><span>Visitors With Confirmations</span><strong>{adminData.summary.matched_companies}</strong></article>
          </section><section className="confirmed-section"><h2>Confirmation Summary</h2><div className="table-panel"><table><thead><tr><th>Visitor / Company</th><th>Confirmations</th></tr></thead><tbody>{adminData.companies.map(x=><tr key={x.id}><td>{x.company_name}</td><td>{x.confirmations}</td></tr>)}</tbody></table></div></section></>}
          {adminData&&<section className="confirmed-section"><h2>Recent Confirmations</h2><div className="table-panel"><table><thead><tr><th>Exhibitor</th><th>Visitor / Company</th><th>Confirmed At</th></tr></thead><tbody>{adminData.recentConfirmations.map(x=><tr key={x.record_id}><td>{x.username}</td><td>{x.company_name}</td><td>{new Date(x.confirmed_at).toLocaleString()}</td></tr>)}</tbody></table></div></section>}
        </>}
        {!admin && <section className="confirmed-section">
          <h2>Confirmed Contacts</h2>
          {error && <div className="error-message">{error}</div>}
          {!error && contacts.length === 0 && <p className="empty-contact">No confirmed contacts yet. Tap a company NFC tag to begin.</p>}
          <div className="contact-list">{contacts.map((contact) => <article key={contact.id} className="confirmed-contact"><div><strong>{contact.company_name}</strong><span>{[contact.industry, contact.country].filter(Boolean).join(' · ')}</span></div><time dateTime={contact.confirmed_at}>{new Date(contact.confirmed_at).toLocaleString()}</time></article>)}</div>
        </section>}
      </section>
    </main>
  );
}
