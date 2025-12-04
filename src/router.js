const express = require('express')
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express()
const adminController = require('./controllers/adminController');
const bodyParser = require("body-parser")
const multer = require('multer');
const { body } = require('express-validator');
const { ensureGuest, ensureUser, ensureAdmin, ensureAuth } = require('./middlewares/authMiddlewares');
const authController = require("./controllers/authController")
 const RoomModel = require('./models/roomModel');
const RoomPhoto = require('./models/roomphoto');
const RoomFacilities = require('./models/roomFacilities');
const session = require('express-session');
const roomController = require('./controllers/roomController'); 
const bookingController = require('./controllers/bookingController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Pastikan folder public/uploads/rooms sudah dibuat
    cb(null, 'public/uploads/rooms'); 
  },
  filename: function (req, file, cb) {
    // Format nama file: room-timestamp-random.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit 2MB
  fileFilter: function (req, file, cb) {
    // Hanya terima gambar
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar yang diperbolehkan!'));
  }
});

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

app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.isLoggedIn = true;
    res.locals.user = req.session; 
  } else {
    res.locals.isLoggedIn = false;
    res.locals.user = null;
  }
  next();
});



app.get('/', ensureUser, async (req, res) => {
  try {
    const rooms = await RoomModel.listRooms({ onlyActive: true });
    const roomsWithData = await Promise.all(rooms.map(async (room) => {
      const photos = await RoomPhoto.listPhotosByRoom(room.id);
      const mainPhoto = photos.find(p => p.is_main === 1) || photos[0];
      const facilities = await RoomFacilities.RoomFacilities.getFacilitiesByRoom(room.id);

      return {
        ...room, 
        thumbnail: mainPhoto ? mainPhoto.filename : null, 
        facilities: facilities || [] 
      };
    }));

    res.render('pages/index', { 
      title: 'Beranda', 
      user: req.user ? req.user.name : 'User', // Ambil nama user dari session jika ada
      rooms: roomsWithData // KIRIM DATA KE VIEW
    });

  } catch (error) {
    console.error("Error fetching homepage data:", error);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});

app.get('/history',(req, res) => {
  res.render('pages/history', { title: 'Riwayat', user: 'Vaazi' });
});

app.get('/listRuangan',(req, res) => {
  res.render('pages/listRuangan', { title: 'List Ruangan', user: 'Vaazi' });
});

app.get('/room/:id', roomController.getRoomDetail);
app.post('/booking/create', ensureUser, bookingController.processBooking);

app.get('/profile', (req, res) => {
    
    // Kita buat data bohong-bohongan (Dummy)
    // Biar EJS tidak error saat minta nama/email
    const userPalsu = {
        name: "Budi Mahasiswa",
        email: "budi@mahasiswa.unj.ac.id",
        role_id: 2 // Anggap aja role mahasiswa
    };

    res.render('pages/user-profile', { 
        title: 'Preview Profil',
        path: '/profile',
        user: userPalsu, // <--- INI OBATNYA (Kirim data palsu ke view)
        layout: 'layouts/main' // Pastikan pakai layout user biasa
    });
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
        title: 'Admin Dashboard',
        path: '/admin-dashboard'
    });

});

// 1. Route untuk Menampilkan Halaman Pengaturan
app.get('/admin-settings', ensureAdmin, (req, res) => {
    res.render('pages/admin-settings', { 
        layout: "layouts/admin", // PENTING: Agar sidebar admin tetap muncul
        title: 'Pengaturan Akun',
        user: req.session, // Mengirim data session (nama/email) ke form
        path: '/admin-settings'
    });
});

// Nanti kita buat controller khususnya, sementara kita redirect dulu biar gak error 404
app.post('/admin/settings/profile', ensureAdmin, (req, res) => {
    console.log('Update Profil:', req.body);
    res.redirect('/admin-settings'); // Balik lagi ke halaman setting
});

app.post('/admin/settings/general', ensureAdmin, (req, res) => {
    console.log('Update Info Umum:', req.body);
    res.redirect('/admin-settings');
});

app.post('/admin/settings/security', ensureAdmin, (req, res) => {
    console.log('Update Password:', req.body);
    res.redirect('/admin-settings');
});

app.get('/add', ensureAdmin ,adminController.viewTambahKelas);
app.post('/add', upload.array('photos', 3), adminController.storeClass);

app.get('/admin-settings', ensureAdmin ,(req, res) => {
    res.render('pages/admin-settings', { 
        layout: "layouts/admin", 
        title: 'Admin Dashboard' 
    });
});

app.get('/admin-DaftarRuangan', ensureAdmin ,(req, res) => {
    res.render('pages/admin-DaftarRuangan', { 
        layout: "layouts/admin", 
        title: 'Daftar Ruangan' 
    });
});

module.exports = app;