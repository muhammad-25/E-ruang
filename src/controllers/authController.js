// src/controllers/authController.js
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/users');

const SALT_ROUNDS = 12;

/**
 * Tampilkan halaman register (GET /register)
 */
exports.showRegister = (req, res) => {
  res.render('pages/register', { 
    errors: [], 
    layout: false, 
    title: 'Register Page',
    old: {} 
  });
};

/**
 * Proses register (POST /register)
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  // selalu kirim old supaya ejs aman
  const old = req.body || {};

  if (!errors.isEmpty()) {
    return res.status(422).render('pages/register', { 
      errors: errors.array(), 
      layout: false,
      title: 'Register Page',
      old
    });
  }

  const { name, email, password, NIM } = req.body;
  const role_id = req.body.role_id ? parseInt(req.body.role_id, 10) : 2;

  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).render('pages/register', {
        errors: [{ msg: 'Email sudah terdaftar' }],
        layout: false,
        title: 'Register Page',
        old
      });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await User.create({
      role_id,
      email,
      password_hash: hash,
      name,
      NIM
    });
    console.log("register berhasil")

    // Pastikan kamu sudah pakai express-session di app.js
    if (req.session) {
      req.session.userId = created.id;
      req.session.userName = created.name;
      req.session.userRoleId = created.role_id || role_id;
      req.session.userEmail = created.email;
    }

    return res.redirect('/');
  } catch (err) {
    console.error('Register error:', err);
    // jangan lupa kirim old agar view tidak crash
    return res.status(500).render('pages/register', {
      errors: [{ msg: 'Terjadi kesalahan server. Coba lagi nanti.' }],
      layout: false,
      title: 'Register Page',
      old
    });
  }
};
