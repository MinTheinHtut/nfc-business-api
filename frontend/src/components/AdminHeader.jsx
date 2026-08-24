import { Link, useNavigate } from 'react-router-dom';
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
      <Link className="brand" to="/admin">NFC Match</Link>
      <nav aria-label="Admin navigation">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/exhibitors">Exhibitors</Link>
        <Link to="/admin/visitors">Visitors</Link>
        <Link to="/admin/nfc">NFC Links</Link>
        <Link to="/admin/confirmations">Confirmations</Link>
        <button type="button" onClick={handleLogout}>Logout</button>
      </nav>
    </header>
  );
}
