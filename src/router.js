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
const BookingModel = require('./models/bookingModel'); 

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



// Cari bagian ini di router.js
app.get('/', ensureUser, async (req, res) => {
  try {
    // 1. Ambil data ruangan (kode lama kamu)
    const rooms = await RoomModel.listRooms({ onlyActive: true });
    
    // 2. [BARU] Ambil Statistik Ruangan
    const stats = await RoomModel.getRoomStatistics();

    // 3. Proses data ruangan (kode lama kamu)
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

    // 4. Render View dengan data tambahan 'stats'
    res.render('pages/index', { 
      title: 'Beranda', 
      user: req.user ? req.user.name : 'User',
      rooms: roomsWithData,
      stats: stats // <--- KIRIM STATISTIK KE SINI
    });

  } catch (error) {
    console.error("Error fetching homepage data:", error);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});

app.get('/history', ensureAuth, bookingController.userHistory);

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




app.get('/admin-dashboard', ensureAdmin, async (req, res) => {
    try {
        
        const stats = await BookingModel.getDashboardStats();

        
        const recentRequestsRaw = await BookingModel.getRecentPendingBookings(5);

        
        const recentRequests = recentRequestsRaw.map(b => {
            const start = new Date(b.start_datetime);
            const end = new Date(b.end_datetime);

            return {
                id: b.id,
                user_name: b.user_name,
                room_name: b.room_name,
                date: start.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
                time: `${start.getHours().toString().padStart(2, '0')}.${start.getMinutes().toString().padStart(2, '0')}-${end.getHours().toString().padStart(2, '0')}.${end.getMinutes().toString().padStart(2, '0')}`
            };
        });

        res.render('pages/admin-dashboard', { 
            layout: "layouts/admin", 
            title: 'Admin Dashboard',
            path: '/admin-dashboard',
            stats: stats,            
            requests: recentRequests 
        });

    } catch (error) {
        console.error("Error loading Admin Dashboard:", error);
        res.status(500).send("Terjadi kesalahan server.");
    }
});

app.get('/edit', ensureAdmin, adminController.viewEditKelas);
app.post('/edit/update', ensureAdmin, upload.array('photos', 3), adminController.updateClass);

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



app.get('/admin-DaftarRuangan', ensureAdmin, adminController.viewDaftarRuangan);

app.delete('/admin/room/delete/:id', ensureAdmin, adminController.deleteRoom);


app.get('/admin/pengajuan', ensureAdmin, async (req, res) => {
    try {
        // 1. Ambil data asli dari Database
        const rawBookings = await BookingModel.getAllBookings();

        // 2. Mapping data agar sesuai format yang diminta EJS 
        // (EJS minta: nim, date, time, room, status, id)
        const formattedBookings = rawBookings.map(b => {
            const start = new Date(b.start_datetime);
            const end = new Date(b.end_datetime);

            // Format Tanggal: "25-11-2005"
            const dateStr = start.toLocaleDateString('id-ID', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            }).replace(/\//g, '-');

            // Format Waktu: "08.00-12.30"
            const timeStart = start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
            const timeEnd = end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
            
            // Mapping Status DB ke Tampilan
            // DB: pending, approved, rejected
            // Tampilan: Menunggu, Disetujui, Ditolak
            let statusDisplay = 'Menunggu';
            if (b.status === 'approved') statusDisplay = 'Disetujui';
            if (b.status === 'rejected') statusDisplay = 'Ditolak';

            return {
                id: b.id,
                nim: b.NIM || ' - ',
                requester_name: b.user_name, // Nama Akun Peminjam
                date: dateStr,
                time: `${timeStart}-${timeEnd}`,
                room: b.room_name,
                gedung: b.gedung,
                status: statusDisplay,
                // --- DATA DETAIL ---
                pj: b.penanggung_jawab,
                desc: b.description,
                count: b.attendees_count
            };
        });

        res.render('pages/admin-pengajuan', {
            layout: 'layouts/admin',
            title: 'Daftar Pengajuan',
            path: '/admin/pengajuan',
            bookings: formattedBookings // Kirim data yang sudah diformat
        });

    } catch (error) {
        console.error("Error fetching admin bookings:", error);
        res.status(500).send("Terjadi kesalahan server saat mengambil data pengajuan.");
    }
});

// === ROUTE BARU: HANDLE UPDATE STATUS (TERIMA/TOLAK) ===
// Ini diperlukan karena form di EJS action-nya ke '/admin/booking/update'
app.post('/admin/booking/update', ensureAdmin, async (req, res) => {
    try {
        const { booking_id, new_status } = req.body;
        
        // Ambil ID Admin dari session
        const adminId = req.session.userId; 

        if (!adminId) {
            return res.status(401).send("Sesi tidak valid/kadaluarsa.");
        }

        console.log(`Update Booking ID: ${booking_id} to ${new_status} by Admin ID: ${adminId}`);

        // Konversi status tampilan ke status database
        let dbStatus = 'pending';
        if (new_status === 'Disetujui') dbStatus = 'approved';
        if (new_status === 'Ditolak') dbStatus = 'rejected';

        // Panggil fungsi model dengan parameter adminId
        await BookingModel.updateStatus(booking_id, dbStatus, adminId);

        // Redirect kembali ke halaman pengajuan
        res.redirect('/admin/pengajuan');

    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).send("Gagal mengupdate status.");
    }
});

module.exports = app;

module.exports = app;