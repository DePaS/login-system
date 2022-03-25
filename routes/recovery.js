const express = require('express')
const router = express.Router()
const mysql = require('mysql');
const bcrypt = require('bcryptjs')

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
})

router.get('/recovery', (req, res) => {
    const email = req.query.email
    const token = req.query.token
    console.log(token, email)
    //if (email == undefined || token == undefined) res.redirect('/login') 
    if (req.session.authenticated) res.redirect('/')
    if (email != undefined || token != undefined) {
        console.log('mail esiste e anche token lato utente')
        con.query("SELECT email FROM login WHERE email = ?", [
            email
        ], function (err, result) {
            if (err) throw err
            if (result[0] != undefined) {
                con.query("SELECT active FROM login WHERE email = ?", [
                    email
                ], function (err, result_active) {
                    if (err) throw err
                    if (result_active[0].active == 'true') {
                        con.query("SELECT token FROM login WHERE email = ?", [
                            email
                        ], function (err, result_token) {
                            if (err) throw err
                            if (result_token[0].token == token) {
                                console.log("e' possibile procedere con il cambio password")
                                res.render('recovery.ejs');
                            } else {
                                success = "il link e' scaduto!"
                                res.render('welcome.ejs', { success: success });
                            }
                        })
                    } else {
                        success = 'Email non ancora verificata, procedere prima con la verifica!'
                        res.render('welcome.ejs', { success: success });
                    }
                })
            } else {
                success = 'Email non registrata, procedere con la registrazione!'
                res.render('welcome.ejs', { success: success });
            }
        })
    } else {
        success = "il link non esiste!"
        res.render('welcome.ejs', { success: success });
    }
})

router.post('/recovery', (req, res) => {
    async function cambioPass() {
        const numbers = /[0-9]/g;
        var upperCaseLetters = /[A-Z]/g;
        var lowerCaseLetters = /[a-z]/g;
        const hashedPassword = await bcrypt.hash(req.body.email, 10)
        let nuova_psw = req.body.email
        let conferma_psw = req.body.password
        if (nuova_psw.length > 7 && nuova_psw.length < 16) {
            console.log('lunghezza giusta')
            if (nuova_psw.match(numbers) && nuova_psw.match(upperCaseLetters) && nuova_psw.match(lowerCaseLetters) && !(/\s/.test(nuova_psw))) {
                console.log('sintassi giusta')
                if (conferma_psw == nuova_psw) {
                    console.log('password diverse')
                    con.query("UPDATE login SET password = ?, token = ''", [hashedPassword], function (err, result_done) {
                        if (err) throw err
                        success = 'Password aggiornata con successo!'
                        res.render('welcome.ejs', { success: success });
                    })
                } else {
                    console.log('le password non combaciano')
                    err_msg_psw = 'Le password devono combaciare!'
                    res.render('recovery.ejs', { err_msg_psw: err_msg_psw });
                }
            }
        }

    } cambioPass()
})

module.exports = router