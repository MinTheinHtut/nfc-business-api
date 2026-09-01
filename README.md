# NFC Business Matching

An NFC-enabled event platform for opening company profiles, confirming business connections, and managing exhibitors, companies, tags, and confirmations.

## Architecture

```text
Browser
  -> Azure App Service: nfc-business-web
  -> Azure App Service: nfc-business-api
  -> Azure Database for MySQL Flexible Server
```

## Frontend

- React and Vite
- Azure App Service: `nfc-business-web`
- Deployed from `frontend/**`
- `frontend/server.js` serves the Vite `dist/` build with SPA fallback
- `VITE_API_URL` selects the API base at build time
- Requests use `credentials: 'include'`

Production: https://nfc-business-web-dzaxbdfxc8eteuhs.japaneast-01.azurewebsites.net

## Backend

- Node.js 22 and Express
- `mysql2`
- `express-session` with `express-mysql-session`
- Azure App Service: `nfc-business-api`
- `npm start` runs `node src/server.js`

Production: https://nfc-business-api-c3gwhab7brh4hnfh.japaneast-01.azurewebsites.net

## Database

- Azure Database for MySQL Flexible Server
- Database: `nfc_business`
- Runtime schema: `backend/sql/schema.sql`
- Manual/documented copy: `database/schema.sql`
- Automated setup and seed: `backend/src/utils/`

## Development setup

Create local environment files from the checked-in examples. Never commit real credentials.

Backend:

```bash
cd backend
npm ci
npm run db:setup
npm run db:seed
npm start
```

Frontend, in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Verify the configured database target before running setup or seed commands. Never run `db:reset` against production.

## Production deployment

GitHub Actions deploy changes from `main`:

```text
backend/** -> npm ci --omit=dev -> nfc-business-api
frontend/** -> npm ci -> npm run build -> nfc-business-web
```

The workflows are under `.github/workflows/`. Runtime secrets belong in Azure App Service settings and publish profiles belong in GitHub Actions secrets.

## Environment variables

Backend names:

- `NODE_ENV`
- `FRONTEND_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`
- `DB_SSL_CA_PATH`
- `SESSION_SECRET`
- `SESSION_STORE`

Frontend build name:

- `VITE_API_URL`

## Authentication

Authentication is session-based. The API stores sessions in MySQL. Production cookies are HTTP-only and secure, and the frontend includes credentials in API requests. `FRONTEND_URL` must exactly match the deployed frontend origin. Production requires a strong `SESSION_SECRET` and `SESSION_STORE=mysql`.

## NFC flow

```text
NFC tap
  -> public company profile
  -> login if necessary
  -> confirm/save connection
  -> contacts
```

## Admin

The protected admin area provides:

- Dashboard
- Companies
- Exhibitors
- NFC Tags
- Confirmations

## Health checks

- API process: `/api/health`
- Database connectivity: `/api/db-test`

## Legacy deployment

Historical cPanel/PHP deployment files were removed after migration to Azure.
