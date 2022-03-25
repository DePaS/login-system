const express = require('express')
const router = express.Router()
const mysql = require('mysql');

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
})

router.get('/verify', (req, res) => {
    let user = req.query.user
    let token = req.query.token
    if (user == undefined || token == undefined) res.redirect('/login')
    if (req.session.authenticated) res.redirect('/')
    if (user != undefined && token != undefined) {
    con.query("SELECT user FROM login WHERE user = ?", [
        user
    ], function(err, result){
        if (err) throw err
        if (result[0] != undefined) {
            con.query("SELECT active FROM login WHERE user = ?", [
                user
            ], function(err, result_active){
                if (err) throw err
                if (result_active[0].active == 'false') {
                    con.query("SELECT token FROM login WHERE user = ?", [
                        user
                    ], function(err, result_token){
                    if (err) throw err
                        if (result_token[0].token == token) {
                            con.query("UPDATE login SET active = 'true', token = ''", function(err, result_done){
                                if (err) throw err
                                success = 'Email verificata con successo, benvenuto!'
                                res.render('welcome.ejs', { success: success });
                            })
                        } else {
                            success = "il link e' scaduto!"
                            res.render('welcome.ejs', { success: success });
                        }
                    })
                } else {
                    success = 'Email gia verificata, procedere con il login!'
                    res.render('welcome.ejs', { success: success });
                }
            })
        }
    })
} 
})

module.exports = router