const express = require('express')
const router = express.Router()
const mysql = require('mysql')

const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_TABLE
})

router.get('/home', (req, res) => {
  if (req.session.authenticated) {
    con.query("SELECT user FROM login WHERE email = ?", [req.session.user.email], function(err, result_user){
      if (err) throw err
      console.log(result_user[0].user)
      success = result_user[0].user
      res.render('home.ejs', { success: success });
    })
  }
  else res.redirect('/login')
})

router.post('/home', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(400).send('Unable to log out')
    } else {
      success = 'Logout avvenuto con successo, arrivederci!'
      res.render('welcome.ejs', { success: success });
    }
  });
})

module.exports = router