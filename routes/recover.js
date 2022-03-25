const express = require('express')
const router = express.Router()
const mysql = require('mysql');
const nodemailer = require('nodemailer');

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

router.get('/recover', (req, res) => {
    if (req.session.authenticated) {
        success = 'Sei già loggato, sarai portato alla home!'
        res.render('welcome.ejs', { success: success })
    }
    else res.render('recover.ejs') 
})

router.post('/recover', (req, res) => {
    function recover() {
        const email = req.body.email
        console.log(email)
        let validEmail = 'non_valido';
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (email.match(re)) validEmail = 'valido'
        if (email && validEmail == 'valido') {
            con.query("SELECT email FROM login WHERE email = ?", [email], function (err, result_email) {
                if (err) throw err
                if (result_email[0] != undefined) {
                    con.query("SELECT active FROM login WHERE email = ?", [email], function (err, result_active) {
                        if (err) throw err
                        if (result_active[0].active != "true") {
                            err_msg_mail = "email registrata ma non verificata, procedere prima con la verifica";
                            return res.render('recover.ejs', { err_msg_mail: err_msg_mail });
                        } else {
                            const piece1 = Math.random().toString(36).slice(2)
                            const piece2 = Math.random().toString(36).slice(2)
                            const piece3 = Math.random().toString(36).slice(2)
                            const token = piece1 + piece2 + piece3
                            const mailOptions = {
                                from: 'helpdesk-appagri@hotmail.com',
                                to: email,
                                subject: 'registrazione',
                                html: "<p>E' stato richiesto il cambio password \nDi seguito il link per effettuare il cambio password \n </p>" +
                                    '\n \n<a href="http://depas.cloud/recovery?email=' + email + '&token=' + token + '">click</a>' +
                                    "<p>Qualora tu non abbia chiesto il cambio password, puoi semplicemente ignorare questa e-mail</p>"
                            }
                            transporter.sendMail(mailOptions, function (err, info) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    con.query("UPDATE login SET token = ? WHERE email = ?", [token, email], function (err, result_token) {
                                        if (err) throw err
                                        console.log('Sent: ' + info.response);
                                        err_msg_mail = "email cambio password inviata";
                                        return res.render('recover.ejs', { err_msg_mail: err_msg_mail });
                                    })
                                }
                            });
                        }
                    })
                } else {
                    err_msg_mail = "L'indirizzo email fornito non e' registrato";
                    return res.render('recover.ejs', { err_msg_mail: err_msg_mail });
                }
            })
        } else {
            err_msg_mail = "L'email inserita non e' valida";
            return res.render('recover.ejs', { err_msg_mail: err_msg_mail });
        }
    }
    recover();
})

module.exports = router