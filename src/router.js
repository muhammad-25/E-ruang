const express = require('express')
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express()
const port = 3000
const bodyParser = require("body-parser")
const  db = require("../database")

// ubah info yang di terima ke bentuk json
app.use(bodyParser.json())

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));


// pakai express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // layout default (views/layouts/main.ejs)

// static files (css/js/images)
app.use(express.static(path.join(__dirname, '..', 'public')));




app.get('/', (req, res) => {
  res.render('pages/index', { title: 'Beranda', user: 'Vaazi' });
});

// ... (kode atas biarkan saja)

// Route Login
app.get('/login', (req, res) => {
    // layout: false -> agar tidak menggunakan template default (main.ejs)
    res.render('pages/login', { 
        layout: false, 
        title: 'Login Page' 
    });
});

// Route Register
app.get('/register', (req, res) => {
    res.render('pages/register', { 
        layout: false, 
        title: 'Register Page' 
    });
});

// Route Dashboard Admin
app.get('/admin-dashboard', (req, res) => {
    // Sesuaikan nama file: admin-dasboard (tanpa 'h' sesuai screenshotmu)
    res.render('pages/admin-dashboard', { 
        layout: false, 
        title: 'Admin Dashboard' 
    });
});

// ... (module.exports = app; jangan dihapus)


module.exports = app;