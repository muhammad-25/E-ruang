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




module.exports = app;