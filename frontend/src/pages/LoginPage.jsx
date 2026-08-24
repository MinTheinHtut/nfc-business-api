import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

function safeRedirect(value) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null;
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={safeRedirect(searchParams.get('redirect')) || (user.role === 'admin' ? '/admin' : '/saved')} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(username, password);
      const destination = safeRedirect(searchParams.get('redirect'))
        || (loggedInUser.role === 'admin' ? '/admin' : '/saved');
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Welcome back</span>
        <h1>Log in</h1>
        <p>Use your event account to manage or save company connections.</p>
        {error && <div className="error-message" role="alert">{error}</div>}
        <label htmlFor="username">Username</label>
        <input id="username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </main>
  );
}
