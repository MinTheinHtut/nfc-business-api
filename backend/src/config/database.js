import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

const sslSetting = (process.env.DB_SSL || 'false').trim().toLowerCase();

if (!['true', 'false'].includes(sslSetting)) {
  throw new Error('DB_SSL must be either "true" or "false"');
}

const sslEnabled = sslSetting === 'true';
let ssl;

if (sslEnabled) {
  const caPath = process.env.DB_SSL_CA_PATH?.trim();
  if (!caPath) throw new Error('DB_SSL_CA_PATH is required when DB_SSL=true');

  try {
    const ca = readFileSync(caPath, 'utf8');
    if (!ca.trim()) throw new Error('CA file is empty');
    ssl = { ca, rejectUnauthorized: true };
  } catch {
    throw new Error('Unable to read a valid DB SSL CA file');
  }
}

export const databaseConfig = {
  // Local defaults keep the health endpoint available before MySQL is configured.
  // Production deployments should always provide these values through the environment.
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
