import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

const sslSetting = (process.env.DB_SSL || 'false').trim().toLowerCase();

if (!['true', 'false'].includes(sslSetting)) {
  throw new Error('DB_SSL must be either "true" or "false"');
}

const sslEnabled = sslSetting === 'true';
const caPath = process.env.DB_SSL_CA_PATH?.trim();

let ssl;

if (sslEnabled) {
  ssl = {
    rejectUnauthorized: true,
  };

  // Optional custom CA file.
  // Azure App Service can normally use its system CA trust store.
  if (caPath) {
    try {
      const ca = readFileSync(caPath, 'utf8');

      if (!ca.trim()) {
        throw new Error('CA file is empty');
      }

      ssl.ca = ca;
    } catch {
      throw new Error('Unable to read a valid DB SSL CA file');
    }
  }
}

export const databaseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'nfc_business_matching',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',

  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',

  ...(ssl ? { ssl } : {}),
};

const pool = mysql.createPool(databaseConfig);

export default pool;