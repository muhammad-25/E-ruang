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
const User = require('./models/users');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/rooms'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit 2MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar yang diperbolehkan!'));
  }
});

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));



// pakai express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main'); 

// static files (css/js/images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ======== SESSION SETUP ========

const sessionOptions = {
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'rahasia_development', 
  resave: false,               
  saveUninitialized: false,     
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, 
    httpOnly: true,
  }
};

app.use(session(sessionOptions));


app.use(authController.attachUser); 
// ---------------------------

app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.isLoggedIn = true;
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
    const stats = await RoomModel.getRoomStatistics();

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
      rooms: roomsWithData,
      stats: stats
    });

  } catch (error) {
    console.error("Error fetching homepage data:", error);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});

app.get('/history', ensureAuth, bookingController.userHistory);

app.get('/listRuangan', ensureUser, async (req, res) => {
  try {
    const filters = {
        search: req.query.search || '',
        gedung: req.query.gedung || '',
        kapasitas: req.query.kapasitas || ''
    };
    const stats = await RoomModel.getRoomStatistics();
    const rooms = await RoomModel.listRooms({ 
        onlyActive: true, 
        filters: filters 
    });

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

    res.render('pages/listRuangan', { 
      title: 'Daftar Ruangan', 
      user: req.user ? req.user.name : 'User',
      rooms: roomsWithData,
      query: filters, 
      stats: stats
    });

  } catch (error) {
    console.error("Error fetching listRuangan data:", error);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});

app.get('/room/:id', roomController.getRoomDetail);
app.post('/booking/create', ensureUser, bookingController.processBooking);

app.get('/profile', ensureAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const userAsli = await User.findById(userId);

        if (!userAsli) {
            return res.redirect('/login');
        }

        res.render('pages/user-profile', { 
            title: 'Profil Saya',
            path: '/profile',
            user: userAsli, 
            layout: 'layouts/main' 
        });

    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).send("Terjadi kesalahan saat memuat profil.");
    }
});

// Route untuk submit form biodata
app.post('/profile/update', ensureAuth, authController.updateProfile);

// Route untuk submit form ganti password
app.post('/profile/security', ensureAuth, authController.updateSecurity);

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


app.get('/admin-settings', ensureAdmin, (req, res) => {
    res.render('pages/admin-settings', { 
        layout: "layouts/admin", 
        title: 'Pengaturan Admin',
        user: req.session, 
        path: '/admin-settings'
    });
});

app.post('/admin/settings/security', ensureAdmin, authController.updateAdminSecurity);

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
        const rawBookings = await BookingModel.getAllBookings();
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
app.post('/admin/booking/update', ensureAdmin, async (req, res) => {
    try {
        const { booking_id, new_status } = req.body;
        
        const adminId = req.session.userId; 

        if (!adminId) {
            return res.status(401).send("Sesi tidak valid/kadaluarsa.");
        }

        console.log(`Update Booking ID: ${booking_id} to ${new_status} by Admin ID: ${adminId}`);

        let dbStatus = 'pending';
        if (new_status === 'Disetujui') dbStatus = 'approved';
        if (new_status === 'Ditolak') dbStatus = 'rejected';

        await BookingModel.updateStatus(booking_id, dbStatus, adminId);

        res.redirect('/admin/pengajuan');

    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).send("Gagal mengupdate status.");
    }
});

module.exports = app;

module.exports = app;