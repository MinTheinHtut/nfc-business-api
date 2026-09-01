import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { issueCsrfToken } from '../middleware/security.middleware.js';

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };
}

export async function login(request, response, next) {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';

  if (!username || !password || username.length > 255 || password.length > 256) {
    return response.status(400).json({ message: 'Email or username and password are required' });
  }

  try {
    const [[user]] = await pool.execute(
      `SELECT id, username, password_hash, full_name, email, role, is_active
       FROM users WHERE username = ? OR email = ? LIMIT 1`,
      [username, username],
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      console.warn('Authentication failed', { ip: request.ip, timestamp: new Date().toISOString() });
      return response.status(401).json({ message: 'Invalid email/username or password' });
    }
    if (!user.is_active) {
      console.warn('Authentication failed', { ip: request.ip, timestamp: new Date().toISOString() });
      return response.status(401).json({ message: 'Invalid email/username or password' });
    }

    request.session.regenerate((error) => {
      if (error) return next(error);

      const safeUser = publicUser(user);
      request.session.user = safeUser;
      const csrfToken = issueCsrfToken(request);
      request.session.save((saveError) => {
        if (saveError) return next(saveError);
        console.info('Authentication succeeded', { userId: safeUser.id, role: safeUser.role, timestamp: new Date().toISOString() });
        return response.json({ user: safeUser, csrfToken });
      });
    });
  } catch (error) {
    next(error);
  }
}

export function logout(request, response, next) {
  request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie('nfc.sid', { path: '/' });
    return response.json({ success: true });
  });
}

export function getCurrentUser(request, response) {
  const csrfToken = request.session.csrfToken || issueCsrfToken(request);
  response.json({ user: request.session.user, csrfToken });
}
