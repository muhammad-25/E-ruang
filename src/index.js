const express = require('express')
const app = express()
const port = 3000
const bodyParser = require("body-parser")
const  db = require("../database")

// ubah info yang di terima ke bentuk json
app.use(bodyParser.json())

app.get('/', (req, res) => {
  // ngambil data atau query yang ada di url, dengan key value username (cek postman : params)
  const nama = req.query.username
  res.send(('Hello ' + nama), )
})

app.get('/login',(req,res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Error saat ambil data:', err);
      return res.status(500).send('Gagal ambil data');
    } else {
      console.log(results); 
    }
  });
  res.send('ini halaman login')
})  

app.get('/username',(req,res) => {
  res.send('ini halaman username')
})


// post itu bisa minta rquest dan ngirim respon tanpa terlihat oleh user
app.post('/login', (req,res) => {
  // minta request dari body
  console.log({"req dari luar" : req.body})  
  res.send("login berhasil")
})

app.put("/username", (req,res) => {
  console.log({ "updateData" : req.body })
  res.send("update berhasil!")
})

module.exports = app;