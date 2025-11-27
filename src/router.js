const express = require('express')
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express()
const port = 3000
const bodyParser = require("body-parser")
const  db = require("../database");
const { body } = require('express-validator');
const { ensureGuest, ensureUser, ensureAdmin, ensureAuth } = require('./middlewares/authMiddlewares');
const authController = require("./controllers/authController")

const session = require('express-session');

// ubah info yang di terima ke bentuk json
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));


// pakai express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // layout default (views/layouts/main.ejs)

// static files (css/js/images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ======== SESSION SETUP ========

const sessionOptions = {
  name: 'connect.sid', // nama cookie default
  secret: process.env.SESSION_SECRET || 'rahasia_development', // ganti di production lewat env var
  resave: false,                // jangan simpan session kalau tidak berubah
  saveUninitialized: false,     // jangan simpan session kosong
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 hari (ms) — sesuaikan jika perlu
    httpOnly: true,
  }
};

app.use(session(sessionOptions));


app.get('/', ensureUser,(req, res) => {
  res.render('pages/index', { title: 'Beranda', user: 'Vaazi' });
});


// Route Login
app.get('/login', ensureGuest, authController.showLogin);

app.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Email tidak valid')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password wajib diisi')
  ],
  authController.login
);

// Route Register

app.get('/register', ensureGuest, authController.showRegister);
app.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nama harus diisi'),
    body('email').isEmail().withMessage('Email tidak valid').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('passwordConfirm').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Konfirmasi password tidak cocok');
      return true;
    })
  ],
  authController.register
);

// ---------- LOGOUT ----------
app.get('/logout', authController.logout);
// app.post('/logout', authController.logout);


// Route Dashboard Admin
app.get('/admin-dashboard', ensureAdmin ,(req, res) => {
    res.render('pages/admin-dashboard', { 
        layout: "layouts/admin", 
        title: 'Admin Dashboard' 
    });
});

app.get('/add', ensureAdmin ,(req, res) => {
    res.render('pages/tambahKelas', { 
        layout: "layouts/admin", 
        title: 'Tambah Kelas' 
    });
});


module.exports = app;