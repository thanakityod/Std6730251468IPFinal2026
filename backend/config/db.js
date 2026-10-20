const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;
let isConnected = false;

// Attempt MySQL connection only if DB_HOST is explicitly provided
async function initDatabase() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER || 'std6730251468';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'ip_std6730251468';
  const port = Number(process.env.DB_PORT) || 3306;

  if (!host) {
    console.log('ℹ️  Running in-memory mode (as specified in exam requirements)');
    return null;
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000
    });

    // Test connection
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isConnected = true;
    console.log(`✅ Connected to MySQL Database: ${database} at ${host}`);
    return pool;
  } catch (err) {
    console.warn(`⚠️ MySQL connection to ${host} failed: ${err.message}`);
    console.log('ℹ️ Falling back safely to in-memory array storage');
    isConnected = false;
    pool = null;
    return null;
  }
}

function getPool() {
  return isConnected ? pool : null;
}

module.exports = { initDatabase, getPool };
