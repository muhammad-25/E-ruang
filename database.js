// db.js
const mysql = require('mysql2/promise');
// require('dotenv').config();

// konfigurasi pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'e-ruang',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// test koneksi sekali saat start (opsional)
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping(); // cek koneksi
    conn.release();
    console.log('Terhubung ke MySQL (pool)!');
  } catch (err) {
    console.error('Koneksi database gagal:', err);
  }
})();

module.exports = pool;
