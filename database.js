const mysql = require("mysql2")

const connection = mysql.createConnection ({
    host: 'localhost',
    user: 'root',       // default user XAMPP
    password: '',       // kosong kalau belum diatur
    database: 'e-ruang'
})

connection.connect((err) => {
  if (err) {
    console.error('Koneksi database gagal:', err);
  } else {
    console.log('Terhubung ke MySQL!');
  }
});

module.exports = connection