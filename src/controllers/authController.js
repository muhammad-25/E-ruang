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



// tampilkan halaman login (GET /login)
exports.showLogin = (req, res) => {
  res.render('pages/login', {
    errors: [],
    layout: false,
    title: 'Login Page',
    old: {}
  });
};

// proses login (POST /login)
exports.login = async (req, res) => {
  const errors = validationResult(req);
  const old = req.body || {};

  if (!errors.isEmpty()) {
    return res.status(422).render('pages/login', {
      errors: errors.array(),
      layout: false,
      title: 'Login Page',
      old
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).render('pages/login', {
        errors: [{ msg: 'Email atau password salah' }],
        layout: false,
        title: 'Login Page',
        old
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).render('pages/login', {
        errors: [{ msg: 'Email atau password salah' }],
        layout: false,
        title: 'Login Page',
        old
      });
    }

    // regenerasi session untuk mencegah session fixation
    if (req.session && req.session.regenerate) {
      req.session.regenerate(err => {
        if (err) {
          console.error('Session regenerate error:', err);
          return res.status(500).render('pages/login', {
            errors: [{ msg: 'Terjadi kesalahan server. Coba lagi nanti.' }],
            layout: false,
            title: 'Login Page',
            old
          });
        }
        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.userRoleId = user.role_id;
        req.session.userEmail = user.email;

        return res.redirect('/'); // atur redirect sesuai kebutuhan (mis. /dashboard)
      });
    } else {
      // fallback kalau session tidak mendukung regenerate
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userRoleId = user.role_id;
      req.session.userEmail = user.email;
      return res.redirect('/');
    }
  } catch (err) {
    
    console.error('Login error:', err);
    return res.status(500).render('pages/login', {
      errors: [{ msg: 'Terjadi kesalahan server. Coba lagi nanti.' }],
      layout: false,
      title: 'Login Page',
      old
    });
  }
};

// logout (POST /logout atau GET /logout sesuai preferensi)
exports.logout = (req, res) => {
  if (!req.session) return res.redirect('/login');

  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      // tetap redirect meskipun gagal destroy
      return res.redirect('/');
    }
    // hapus cookie session di client
    res.clearCookie('connect.sid', { path: '/' });
    return res.redirect('/login');
  });
};

/**
 * Middleware sederhana untuk melindungi route yang butuh login.
 * Gunakan: router.get('/protected', authController.ensureAuth, handler)
 */
exports.ensureAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
};

/**
 * Middleware opsional untuk membuat user tersedia di views (res.locals.currentUser)
 * Pasang di app.js: app.use(authController.attachUser);
 */
exports.attachUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.currentUser = user || null;
    } catch (err) {
      console.error('Attach user error:', err);
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }
  next();
};
