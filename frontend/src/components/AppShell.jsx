import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
const navigation = [['/dashboard', 'Home', '⌂'], ['/contacts', 'Contacts', '◎']];
export default function AppShell({ title, eyebrow, children }) {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  async function signOut() { await logout(); navigate('/login', { replace: true }); }
  const links = navigation.map(([to,label,icon]) => <NavLink key={to} to={to} end={to==='/dashboard'}><span aria-hidden="true">{icon}</span><span>{label}</span></NavLink>);
  return <div className="app-layout"><aside className="app-sidebar"><Link className="brand-lockup" to="/dashboard"><span className="brand-mark">N</span><span>NFC Connect<small>Business matching</small></span></Link><nav aria-label="Main navigation">{links}</nav><div className="sidebar-user"><span className="avatar">{user?.fullName?.charAt(0)||'U'}</span><div><strong>{user?.fullName}</strong><small>Exhibitor</small></div></div><button className="sidebar-logout" type="button" onClick={signOut}>Log out</button></aside><main className="app-main"><header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div><span className="event-chip">Event connected</span></header>{children}</main><nav className="bottom-nav" aria-label="Mobile navigation">{links}</nav></div>;
}
export function CompanyAvatar({company,large=false}){return company.logo_url?<img className={`company-avatar ${large?'large':''}`} src={company.logo_url} alt={`${company.company_name} logo`}/>:<span className={`company-avatar monogram ${large?'large':''}`} aria-hidden="true">{company.company_name?.charAt(0)?.toUpperCase()||'C'}</span>;}
export function EmptyState({title,children}){return <section className="empty-state-card"><span className="empty-icon" aria-hidden="true">◇</span><h2>{title}</h2><p>{children}</p></section>;}
export function LoadingState({children='Loading…'}){return <div className="loading-card" role="status"><span className="spinner" aria-hidden="true"/>{children}</div>;}
export function ErrorState({children}){return <div className="error-message" role="alert">{children||'Something went wrong. Please try again.'}</div>;}
