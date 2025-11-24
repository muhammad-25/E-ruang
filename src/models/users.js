// models/User.js
const pool = require('../../database');

const User = {
  async create({ role_id, email, password_hash, name, NIM }) {
    const [result] = await pool.query(
      `INSERT INTO users (role_id, email, password_hash, name, NIM) VALUES (?, ?, ?, ?, ?)`,
      [role_id, email, password_hash, name, NIM]
    );

    return {
      id: result.insertId,
      role_id,
      email,
      name,
      NIM
    };
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0];
  }
};

module.exports = User;
