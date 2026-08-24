import mysql from 'mysql2/promise';

const pool = mysql.createPool({
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
});

export default pool;
