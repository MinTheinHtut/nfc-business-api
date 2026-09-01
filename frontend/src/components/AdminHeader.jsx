import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const primaryLinks = [
  ['/admin', 'Overview', true],
  ['/admin/companies', 'Companies'],
  ['/admin/exhibitors', 'Exhibitors'],
];

export default function AdminHeader() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const moreButtonRef = useRef(null);
  const moreActive = location.pathname.startsWith('/admin/nfc-tags') || location.pathname.startsWith('/admin/connections');

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    function closeOutside(event) {
      if (!moreRef.current?.contains(event.target)) setMoreOpen(false);
    }
    function closeWithEscape(event) {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [moreOpen]);

  async function handleLogout() {
    setMoreOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  return <header className="admin-header">
    <NavLink className="brand" to="/admin"><span className="brand-mark">N</span><span>NFC Connect<small>Event organizer</small></span></NavLink>

    <nav className="desktop-admin-nav" aria-label="Admin navigation">
      <NavLink end to="/admin">Overview</NavLink>
      <NavLink to="/admin/companies">Companies</NavLink>
      <NavLink to="/admin/exhibitors">Exhibitors</NavLink>
      <NavLink to="/admin/nfc-tags">NFC Tags</NavLink>
      <NavLink to="/admin/connections">Connections</NavLink>
      <button type="button" onClick={handleLogout}>Log out</button>
    </nav>

    <nav className="mobile-admin-nav" aria-label="Mobile admin navigation">
      {primaryLinks.map(([to, label, end]) => <NavLink key={to} end={end} to={to}>{label}</NavLink>)}
      <div className="admin-more" ref={moreRef}>
        <button ref={moreButtonRef} className={moreActive ? 'active' : ''} type="button" aria-expanded={moreOpen} aria-controls="admin-more-menu" onClick={() => setMoreOpen((open) => !open)}>More <span aria-hidden="true">⌄</span></button>
        <div id="admin-more-menu" className={`admin-more-menu ${moreOpen ? 'open' : ''}`} hidden={!moreOpen}>
          <NavLink to="/admin/nfc-tags" onClick={() => setMoreOpen(false)}>NFC Tags</NavLink>
          <NavLink to="/admin/connections" onClick={() => setMoreOpen(false)}>Connections</NavLink>
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </nav>
  </header>;
}
