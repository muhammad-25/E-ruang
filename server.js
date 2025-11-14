const express = require('express')

const port = 3000

const app = require("./src/index.js")
app.listen(port, () => {
  console.log(`E-ruang listening on port ${port}`)
})