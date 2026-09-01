import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginUser, logoutUser } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(({ user: currentUser, csrfToken: currentCsrfToken }) => {
        setUser(currentUser);
        setCsrfToken(currentCsrfToken || null);
      })
      .catch((error) => {
        if (error.status !== 401) console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const data = await loginUser(username, password);
    setUser(data.user);
    setCsrfToken(data.csrfToken || null);
    return data.user;
  }

  async function logout() {
    await logoutUser(csrfToken);
    setUser(null);
    setCsrfToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, csrfToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
