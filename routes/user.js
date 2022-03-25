const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs')

const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: 'helpdesk-appagri@hotmail.com',
        pass: 'Life16!/75'
    }
});

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
})

router.get('/user', (req, res) => {
    if (req.session.authenticated) {
        console.log(req.session.cookie._expires)
        con.query("SELECT user, dfa_enabled FROM login WHERE email = ?", [req.session.user.email], function (err, result_user) {
            if (err) throw err
            email_session = req.session.user.email
            success = result_user[0].user
            const token = req.query.token
            const email = req.session.user.email
            let tokeninv;
            if (token == 'true') {
                tokeninv = true
                con.query("SELECT token_auth_time FROM login WHERE email = ?", [email], function (err, auth_time) {
                    var timestamp = auth_time[0].token_auth_time
                    var timestamped = Date.parse(timestamp);
                    var timeutc = 7200000 + timestamped
                    var timediff = timeutc + 300000
                    var ora = new Date();
                    var adesso = ora.getTime()
                    if (timediff < adesso) {
                        const piece1 = Math.random().toString(36).slice(2)
                        const token_auth = piece1
                        const mailOptions = {
                            from: 'helpdesk-appagri@hotmail.com',
                            to: email,
                            subject: 'Richiesta cambio password',
                            html: "<p>E' stata richiesto il cambio password. \nDi seguito il token da inserire per validare la richiesta \n </p>" + token_auth
                        }
                        transporter.sendMail(mailOptions, function (err, info) {
                            if (err) {
                                console.log(err)
                            } else {
                                con.query("UPDATE login SET token_auth = ?, token_auth_time = CURRENT_TIMESTAMP WHERE email = ?", [token_auth, email], function (err, result_token) {
                                    if (err) throw err
                                    console.log('Sent: ' + info.response);
                                })
                            }
                        });
                    } else {
                        console.log('5 minuti non passati')
                    }
                })
            }
            doublefa = result_user[0].dfa_enabled
            res.render('user.ejs', { success: success, email_session: email_session, tokeninv: tokeninv, doublefa: doublefa });
        })
    } else {
        success = 'Pagina non disponibile, effettuare la registrazione o il login'
        res.render('welcome.ejs', { success: success })
    }
})

router.post('/user', (req, res) => {
    async function cambioPass() {
        const email = req.session.user.email
        const numbers = /[0-9]/g;
        var upperCaseLetters = /[A-Z]/g;
        var lowerCaseLetters = /[a-z]/g;
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        let nuova_psw = req.body.password
        let conferma_psw = req.body.confirm_password
        let token = req.body.token
        con.query("SELECT token_auth FROM login WHERE email = ?", [email], function (err, token_ok) {
            if (err) throw err;
            console.log(token_ok[0].token_auth)
            if (token_ok[0].token_auth != null && token_ok[0].token_auth == token) {
                if (nuova_psw.length > 7 && nuova_psw.length < 16) {
                    console.log('lunghezza giusta')
                    if (nuova_psw.match(numbers) && nuova_psw.match(upperCaseLetters) && nuova_psw.match(lowerCaseLetters) && !(/\s/.test(nuova_psw))) {
                        console.log('sintassi giusta')
                        if (conferma_psw == nuova_psw) {
                            con.query("UPDATE login SET password = ?, token_auth = '' WHERE email = ?", [hashedPassword, email], function (err, result_done) {
                                if (err) throw err
                                success = 'Password aggiornata con successo!'
                                res.render('welcome.ejs', { success: success });
                            })
                        } else {
                            console.log('le password non combaciano')
                            err_msg_psw = 'Le password devono combaciare!'
                            res.render('user.ejs', { err_msg_psw: err_msg_psw });
                        }
                    }
                }
            } else {
                email_session = req.session.user.email
                success = result_user[0].user
                res.render('user.ejs', { success: success, email_session: email_session });
            }
        })
    } cambioPass()
})

module.exports = router