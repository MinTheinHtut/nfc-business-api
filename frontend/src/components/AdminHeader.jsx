import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function AdminHeader() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="admin-header">
      <NavLink className="brand" to="/admin"><span className="brand-mark">N</span><span>NFC Connect<small>Event organizer</small></span></NavLink>
      <nav aria-label="Admin navigation">
        <NavLink end to="/admin">Overview</NavLink>
        <NavLink to="/admin/companies">Companies</NavLink>
        <NavLink to="/admin/exhibitors">Exhibitors</NavLink>
        <NavLink to="/admin/nfc-tags">NFC Tags</NavLink>
        <NavLink to="/admin/connections">Confirmations</NavLink>
        <button type="button" onClick={handleLogout}>Log out</button>
      </nav>
    </header>
  );
}
