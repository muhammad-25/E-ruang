const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/users');

const SALT_ROUNDS = 12;

exports.showRegister = (req, res) => {
  res.render('pages/register', { 
    errors: [], 
    layout: false, 
    title: 'Register Page',
    old: {} 
  });
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
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

    if (req.session) {
      req.session.userId = created.id;
      req.session.userName = created.name;
      req.session.userRoleId = created.role_id || role_id;
      req.session.userEmail = created.email;
    }

    return res.redirect('/');
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).render('pages/register', {
      errors: [{ msg: 'Terjadi kesalahan server. Coba lagi nanti.' }],
      layout: false,
      title: 'Register Page',
      old
    });
  }
};

exports.showLogin = (req, res) => {
  res.render('pages/login', {
    errors: [],
    layout: false,
    title: 'Login Page',
    old: {}
  });
};

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

        return res.redirect('/');
      });
    } else {
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


exports.logout = (req, res) => {
  if (!req.session) return res.redirect('/login');

  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid', { path: '/' });
    return res.redirect('/login');
  });
};


exports.ensureAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
};

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


exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.session.userId;

  try {
    await User.updateProfile(userId, { name, email });

    req.session.userName = name;
    req.session.userEmail = email;

    console.log("Update profile berhasil");
    return res.redirect('/profile'); 
    
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).send("Gagal mengupdate profil.");
  }
};

exports.updateSecurity = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.userId;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.send('<script>alert("Semua kolom harus diisi!"); window.history.back();</script>');
  }

  if (newPassword !== confirmPassword) {
    return res.send('<script>alert("Konfirmasi password tidak cocok!"); window.history.back();</script>');
  }

  if (newPassword.length < 6) {
    return res.send('<script>alert("Password baru minimal 6 karakter!"); window.history.back();</script>');
  }

  try {

    const user = await User.findById(userId);

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.send('<script>alert("Password lama salah!"); window.history.back();</script>');
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await User.updatePassword(userId, newHash);

    console.log("Password berhasil diubah");
    return res.send('<script>alert("Password berhasil diubah!"); window.location.href="/profile";</script>');

  } catch (err) {
    console.error('Update password error:', err);
    return res.status(500).send("Terjadi kesalahan server.");
  }
};