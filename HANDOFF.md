# Azure Operational Handoff

## 1. Current architecture

```text
Browser
  -> nfc-business-web (React/Vite on Azure App Service)
  -> nfc-business-api (Node.js/Express on Azure App Service)
  -> nfc-business-db (Azure MySQL Flexible Server)
```

The application database is `nfc_business`. The frontend and API are separate origins and use credentialed CORS plus a secure session cookie.

## 2. Azure resources

- Frontend App Service: `nfc-business-web`
- Backend App Service: `nfc-business-api`
- MySQL Flexible Server: `nfc-business-db`
- Application database: `nfc_business`

## 3. GitHub deployment flow

`.github/workflows/main_nfc-business-api.yml` deploys `backend/**` changes on `main` to `nfc-business-api` after installing production dependencies.

`.github/workflows/main_nfc-business-web.yml` builds `frontend/**` changes on `main`, packages `dist/`, `server.js`, and the package manifests, and deploys them to `nfc-business-web`.

Both workflows support manual dispatch. Publish profiles are stored as GitHub Actions secrets.

## 4. Backend startup

```bash
cd backend
npm ci
npm start
```

`npm start` runs `node src/server.js`. It initializes the configured session store and listens on the Azure-provided `PORT` at `0.0.0.0`.

## 5. Frontend startup

Development:

```bash
cd frontend
npm ci
npm run dev
```

Production form:

```bash
npm run build
npm start
```

`frontend/server.js` serves `dist/` and provides the React SPA fallback.

## 6. Required environment variable names

Backend:

- `NODE_ENV`
- `FRONTEND_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`
- `DB_SSL_CA_PATH` when needed
- `SESSION_SECRET`
- `SESSION_STORE`

Frontend build:

- `VITE_API_URL`

Values belong in Azure or GitHub configuration, never in source control.

## 7. Database setup

`backend/sql/schema.sql` is canonical and is read by `backend/src/utils/setup-database.js`. `database/schema.sql` is the synchronized manual copy.

After confirming the configured database target:

```bash
cd backend
npm run db:setup
```

Do not run `db:reset` against production.

## 8. Seed process

The canonical automated development seed is:

```bash
cd backend
npm run db:seed
```

`database/demo_seed.sql` is a development/test-only manual equivalent. Demo credentials are not production credentials.

## 9. Session table

`express-mysql-session` requires:

```sql
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

The table is included in the canonical schema and can also be created by the session-store package.

## 10. Health checks

- `GET /api/health` checks the API process.
- `GET /api/db-test` checks MySQL connectivity.

Test health first. If health passes but the database test fails, focus on MySQL settings, networking, TLS, or credentials.

## 11. Authentication test

1. Sign in through the production frontend.
2. Confirm `/api/auth/login` succeeds and the browser receives `nfc.sid`.
3. Confirm `/api/auth/me` returns the user.
4. Refresh a protected route and verify the session persists.
5. Log out and verify protected routes redirect to login.

Never share credentials or session cookies in logs or tickets.

## 12. NFC test flow

1. Open an active `/company/:token` URL on a phone-sized viewport.
2. Verify the company profile loads.
3. If signed out, confirm login returns to the same profile.
4. Save the connection once and verify the connected state appears.
5. Verify the company appears in Contacts and admin Confirmations.

## 13. Troubleshooting

### CORS

- `FRONTEND_URL` must exactly match the frontend origin.
- Browser requests must include credentials.
- Review API App Service logs for origin failures.

### Session cookie

- Production requires HTTPS, `NODE_ENV=production`, a strong `SESSION_SECRET`, and `SESSION_STORE=mysql`.
- Confirm the secure `SameSite=None` cookie is accepted.
- Confirm the `sessions` table is writable.

### MySQL connectivity

- Check host, port, database, user, password, firewall/network access, and TLS.
- If `DB_SSL_CA_PATH` is set, confirm the file exists in the API environment.

### Azure App Service logs

- Review application and deployment logs for the affected App Service.
- Confirm each service starts with `npm start`.
- Do not override the Azure-provided `PORT` incorrectly.

### GitHub Actions

- Confirm the changed path matches the workflow filter.
- Inspect install, build, artifact, and deploy steps independently.
- Verify each publish-profile secret belongs to the intended App Service.

## 14. Security reminders

- Never commit passwords, connection strings, `.env` files, session cookies, or publish profiles.
- Rotate or retire credentials used by an old deployment.
- Keep a strong, unique `SESSION_SECRET` in Azure App Service settings.
- Keep the database password in protected Azure configuration.
- Keep MySQL TLS verification enabled in production.
