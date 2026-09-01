import { randomBytes, timingSafeEqual } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';

export function issueCsrfToken(request) {
  const token = randomBytes(32).toString('base64url');
  request.session.csrfToken = token;
  return token;
}

export function requireCsrf(request, response, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method) || request.path === '/api/auth/login') return next();
  if (!request.session?.user) return next();
  const expected = request.session?.csrfToken;
  const supplied = request.get('x-csrf-token');
  if (!expected || !supplied) return response.status(403).json({ message: 'Invalid security token. Refresh and try again.' });
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return response.status(403).json({ message: 'Invalid security token. Refresh and try again.' });
  }
  return next();
}

const commonRateLimit = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(request, response) {
    response.status(429).json({ message: 'Too many requests. Please wait and try again.' });
  },
};

export const loginRateLimit = rateLimit({
  ...commonRateLimit,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const publicProfileRateLimit = rateLimit({ ...commonRateLimit, windowMs: 15 * 60 * 1000, limit: 120 });
export const publicConfirmRateLimit = rateLimit({ ...commonRateLimit, windowMs: 15 * 60 * 1000, limit: 30 });
