import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { sessionLifetimeMs, sessionStore } from './config/session-store.js';
import adminCompanyRouter from './routes/admin-company.routes.js';
import adminNfcRouter from './routes/admin-nfc.routes.js';
import authRouter from './routes/auth.routes.js';
import databaseRouter from './routes/database.routes.js';
import healthRouter from './routes/health.routes.js';
import publicCompanyRouter from './routes/public-company.routes.js';
import contactRouter from './routes/contact.routes.js';
import adminDashboardRouter from './routes/admin-dashboard.routes.js';
import adminExhibitorRouter from './routes/admin-exhibitor.routes.js';
import adminConfirmationRouter from './routes/admin-confirmation.routes.js';
import adminVisitorRouter from './routes/admin-visitor.routes.js';
import adminVisitorConnectionRouter from './routes/admin-visitor-connection.routes.js';
import publicVisitorRouter from './routes/public-visitor.routes.js';
import { requireCsrf } from './middleware/security.middleware.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production');
}
if (isProduction && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is required in production');
}

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: false,
  referrerPolicy: { policy: 'no-referrer' },
}));
app.use((request, response, next) => {
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
});

// Hosting providers normally terminate HTTPS before forwarding to Express.
// Trusting the first proxy lets express-session recognize the original secure request.
if (isProduction) app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin.replace(/\/$/, '') === frontendUrl) return callback(null, true);
      const error = new Error('Origin not allowed');
      error.status = 403;
      return callback(error);
    },
    credentials: true,
  }),
);
app.use(requireCsrf);
app.use(express.json({ limit: '100kb' }));
app.use(
  session({
    name: 'nfc.sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // The Azure frontend and API use different sites, so production cookies
      // must explicitly opt in to cross-site credentialed requests over HTTPS.
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: sessionLifetimeMs,
    },
  }),
);

app.use('/api', healthRouter);
app.use('/api', databaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/companies', adminCompanyRouter);
app.use('/api/admin/nfc-tags', adminNfcRouter);
app.use('/api/public/companies', publicCompanyRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/exhibitors', adminExhibitorRouter);
app.use('/api/admin/confirmations', adminConfirmationRouter);
app.use('/api/admin/connections', adminConfirmationRouter);
app.use('/api/admin/visitors', adminVisitorRouter);
app.use('/api/admin/visitor-connections', adminVisitorConnectionRouter);
app.use('/api/public/visitors', publicVisitorRouter);

app.use((request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

app.use((error, request, response, next) => {
  const status = Number.isInteger(error.status) ? error.status : error.type === 'entity.too.large' ? 413 : 500;
  console.error('Request failed', { method: request.method, path: request.path, status, name: error.name, code: error.code, message: error.message });
  if (status === 403 && error.message === 'Origin not allowed') return response.status(403).json({ message: 'Origin not allowed' });
  if (status === 413) return response.status(413).json({ message: 'Request body is too large' });
  if (status >= 400 && status < 500) return response.status(status).json({ message: 'Request could not be processed' });
  return response.status(500).json({ message: 'Internal server error' });
});

export default app;
