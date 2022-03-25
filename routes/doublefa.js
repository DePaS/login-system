const express = require('express')
const app = module.exports = express()
const router = express.Router()
const speakeasy = require('speakeasy')
const secret = speakeasy.generateSecret(20);
const url = speakeasy.otpauthURL({ secret: secret.ascii, label: 'depas.cloud', algorithm: 'sha1' });
const qrcode = require('qrcode')
const mysql = require('mysql');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    host: 'smtp.office365.com',
    port: '587',
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    },
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


router.get('/doublefa', (req, res) => {
    if (req.session.authenticated) {
        console.log('qui')
        const email = req.session.user.email
        con.query("SELECT dfa_enabled FROM login WHERE email = ?", [email], function (err, enabled) {
            if (enabled[0].dfa_enabled != 'true') {
                if (req.query.key) {
                    success = "il link fornito per la rimozione non e' valido oppure e' scaduto"
                    res.render('welcome.ejs', { success: success })
                } else {
                    qrcode.toDataURL(url, function (err, data_url) {
                        if (err) throw err
                        con.query("UPDATE login SET Dfa_token = ? WHERE email = ?", [
                            secret.base32,
                            email
                        ], function (err, result_token) {
                            if (err) throw err
                        })
                        let codice_qr = data_url
                        res.render('doublefa.ejs', { codice_qr: codice_qr })
                    });
                }
            } else {
                let key = req.query.key
                console.log(key)
                let remove = req.query.remove
                let rembymail = req.query.rembymail
                if (key != null && key != undefined) {
                    con.query("SELECT Dfa_token FROM login WHERE email = ?", [email], function (err, res_key) {
                        if (err) throw err
                        console.log(res_key[0].Dfa_token)
                        if (res_key[0].Dfa_token != undefined) {
                            if (res_key[0].Dfa_token == key) {
                                con.query("UPDATE login SET Dfa_token = NULL, dfa_enabled = NULL, Dfa_token_time = NULL WHERE email = ?", [email], function (err, res_key2) {
                                    if (err) throw err
                                    success = "autenticatore a due fattori rimosso con successo"
                                    res.render('welcome.ejs', { success: success })
                                })
                            } else {
                                success = "il link fornito per la rimozione non e' valido oppure e' scaduto"
                                res.render('welcome.ejs', { success: success })
                            }
                        } else {
                            success = 'Nessuna auth a 2 fattori da rimuovere'
                            res.render('welcome.ejs', { success: success })
                        }
                    })
                }
                if (key == null || key == undefined) {
                    console.log('qui')
                    if (remove == 'yes') {
                        if (rembymail == 'true') {
                            con.query("SELECT Dfa_token, Dfa_token_time FROM login WHERE email = ?", [email], function (err, result) {
                                if (err) throw err
                                var timestamp = result[0].Dfa_token_time
                                var timestamped = Date.parse(timestamp);
                                var timeutc = 7200000 + timestamped
                                var timediff = timeutc + 300000
                                var ora = new Date();
                                var adesso = ora.getTime()
                                function timedMail() {
                                    con.query("UPDATE login SET Dfa_token_time = CURRENT_TIMESTAMP WHERE email = ?", [email], function (err, result2) {
                                        if (err) throw err
                                        const mailOptions = {
                                            from: 'helpdesk-appagri@hotmail.com',
                                            to: email,
                                            subject: 'rimozione 2fa',
                                            html: '<p>clicka sul link di seguito per rimuovere il 2fa \n</p>' +
                                                '\n \n<a href="http://depas.cloud/doublefa?key=' + result[0].Dfa_token + '">click</a>'
                                        }
                                        transporter.sendMail(mailOptions, function (err, info) {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                                console.log('Sent: ' + info.response);
                                                success = "mail inviata per la rimozione dell'autenticatore a due fattori"
                                                res.render('welcome.ejs', { success: success })
                                            }
                                        });
                                    })
                                }

                                if (result[0].Dfa_token_time == undefined) {
                                    timedMail()
                                }
                                if (result[0].Dfa_token_time != undefined) {
                                    console.log('definito')
                                    if (timediff < adesso) {
                                        timedMail()
                                    } else {
                                        success = 'attendere 5 minuti per richiedere un nuovo link'
                                        res.render('welcome.ejs', { success: success })
                                    }
                                }
                            })
                        }
                        else {
                            let rimuovi = req.query.remove
                            let error = req.query.error
                            if (rimuovi == 'yes' && error == '1') {
                                doublefa = true
                                err_msg_psw = 'Il codice inserito non è valido'
                                res.render('doublefa.ejs', { doublefa: doublefa, err_msg_psw: err_msg_psw })
                            } else {
                                res.render('doublefa.ejs')
                            }
                        }
                    } else {
                        success = 'auth a 2 fattori gia aggiunta in precedenza'
                        res.render('welcome.ejs', { success: success })
                    }
                }
            }
        });
    } else {
        console.log('qui 1')
        const email = req.session.user.email
        let recovery_token = req.query.reset
        if (recovery_token == 'true') {
            con.query('SELECT dfa_enabled FROM login WHERE email = ?', [email], function (err, enabled) {
                if (err) throw err
                console.log('qui 2')
                if (enabled[0].dfa_enabled != undefined && enabled[0].dfa_enabled != null) {
                    if (enabled[0].dfa_enabled == 'true') {
                        console.log('qui 3')
                        let recovery_token = true
                        res.render('doublefa.ejs', { recovery_token: recovery_token })
                    }
                }
            })
        } else {
            console.log('qui 4')
            let success = 'non sei loggato'
            res.render('welcome.ejs', { success: success })
        }
    }
})

router.post('/doublefa', (req, res) => {
    if (req.session.authenticated) {
        const email = req.session.user.email
        con.query('SELECT Dfa_token FROM login WHERE email = ?', [req.session.user.email], function (err, token) {
            if (err) throw err
            let token_client = req.body.password
            let verified = speakeasy.totp.verify({
                secret: token[0].Dfa_token,
                encoding: 'base32',
                token: token_client
            });
            if (verified) {
                con.query('SELECT dfa_enabled FROM login WHERE email = ?', [req.session.user.email], function (err, enabled) {
                    if (err) throw err
                    if (enabled[0].dfa_enabled != 'true') {
                        const piece1 = Math.random().toString(36).slice(2)
                        con.query("UPDATE login SET dfa_enabled = 'true', recovery_token_dfa = ? WHERE email = ?", [piece1, email], function (err, result) {
                            if (err) throw err
                            success = 'auth a 2 fattori con app aggiunta'
                            token_recovery = piece1
                            reminder = "ATTENZIONE: E' necessario salvare il codice di seguito che permette la possibilita' di rimuovere il 2fa nel caso in cui non si ha più a disposizione il dispositivo."
                            res.render('recovery_doublefa.ejs', { success: success, token_recovery: token_recovery, reminder: reminder })
                        })
                    }
                    if (enabled[0].dfa_enabled == 'true') {
                        con.query("UPDATE login SET dfa_enabled = null, Dfa_token = null WHERE email = ?", [email], function (err, removed) {
                            if (err) throw err
                            success = 'auth a 2 fattori rimossa con successo'
                            res.render('welcome.ejs', { success: success })
                        })
                    }
                })
            } else {
                console.log('rimuovo qui')
                let rimuovi = req.query.remove
                if (rimuovi == 'yes') {
                    console.log('rimuovo qui 2')
                    doublefa = true
                    err_msg_psw = 'Il codice inserito non è valido'
                    res.render('doublefa.ejs', { doublefa: doublefa, err_msg_psw: err_msg_psw })
                } else {
                    res.render('doublefa.ejs')
                }
            }
        })
    } else {
        const email = req.session.user.email
        if (req.body.codice) {
            con.query('SELECT recovery_token_dfa FROM login WHERE email = ?', [email], function (err, rec_token) {
                if (err) throw err
                console.log(rec_token[0].recovery_token_dfa)
                if (rec_token[0].recovery_token_dfa != undefined && rec_token[0].recovery_token_dfa != null) {
                    console.log(rec_token[0].recovery_token_dfa)
                    if (rec_token[0].recovery_token_dfa == req.body.codice) {
                        con.query("UPDATE login SET Dfa_token = NULL, dfa_enabled = NULL, Dfa_token_time = NULL WHERE email = ? ", [email], function (err, rimosso) {
                            if (err) throw err
                            success = 'auth a 2 fattori rimossa con successo'
                            res.render('welcome.ejs', { success: success })
                        })
                    } else {
                        success = "il codice inserito non è valido, ripetere la procedura"
                        res.render('welcome.ejs', { success: success })
                    }
                } else {
                    success = "non è presente l'autenticazione a due fattori"
                    res.render('welcome.ejs', { success: success })
                }
            })
        }
        if (req.body.password) {
            con.query('SELECT Dfa_token FROM login WHERE email = ?', [email], function (err, token) {
                if (err) throw err
                let token_client = req.body.password
                let verified = speakeasy.totp.verify({
                    secret: token[0].Dfa_token,
                    encoding: 'base32',
                    token: token_client
                });
                if (verified) {
                    req.session.authenticated = true;
                    success = 'Login avvenuto con successo, benvenuto!'
                    res.render('welcome.ejs', { success: success });
                } else {
                    success = 'codice app 2fa errato!'
                    res.render('welcome.ejs', { success: success });
                }
            });
        }
    } // 7qyd3lxl8eh
})

module.exports = router