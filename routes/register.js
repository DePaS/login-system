const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
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

const pool = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
})

router.get('/register', (req, res) => {
    if (req.session.authenticated) {
        success = 'Sei già loggato, sarai portato alla home!'
        res.render('welcome.ejs', { success: success })
    }
    else res.render('register.ejs');
})

router.post('/register', (req, res) => {
    async function registra() {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const name = req.body.name
            const email = req.body.email
            const pass_check = req.body.password
            const confirm_psw = req.body.confirm_password
            const numbers = /[0-9]/g;
            var upperCaseLetters = /[A-Z]/g;
            var lowerCaseLetters = /[a-z]/g;
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            let validUser = 'non_valido';
            let validEmail = 'non_valido';
            let validPassword = 'non_valido';
            if (name.length > 2 && name.length < 15) validUser = 'valido'
            if (email.match(re)) validEmail = 'valido'
            if (pass_check.length > 7 && pass_check.length < 16) {
                if (pass_check.match(numbers) && pass_check.match(upperCaseLetters) && pass_check.match(lowerCaseLetters) && !(/\s/.test(pass_check))) {
                    validPassword = 'valido'
                }
            }
            if (name && email && pass_check) {
                if ((validUser == 'valido') && (validEmail == 'valido') && (validPassword == 'valido')) {
                    let emailPromise = new Promise(function (resolve, reject) {
                        pool.query("SELECT email FROM login WHERE email = ?", [email], function (err, result1) {
                            if (result1[0] != undefined) {
                                if (result1[0].email == email) {
                                    email_check = true;
                                    err_msg_mail = "L'email inserita è già registrata";
                                    resolve('bella pe noi')
                                }
                            } else {
                                if (confirm_psw === pass_check) {
                                    const piece1 = Math.random().toString(36).slice(2)
                                const piece2 = Math.random().toString(36).slice(2)
                                const piece3 = Math.random().toString(36).slice(2)
                                const token = piece1 + piece2 + piece3
                                email_check = false;
                                resolve('ez21')
                                pool.query("INSERT INTO login (user, email, password, active, token) VALUES (?, ?, ?, ?, ?);", [
                                    name,
                                    email,
                                    hashedPassword,
                                    'false',
                                    token
                                ], function (err, result2) {
                                    if (err) throw err
                                })
                                const mailOptions = {
                                    from: 'helpdesk-appagri@hotmail.com',
                                    to: email,
                                    subject: 'registrazione',
                                    html: '<p>registrazione avvenuta con successo \nTi resta solo da attivare il tuo account clickando sul link di seguito \n </p>' + 
                                    '\n \n<a href="http://depas.cloud/verify?user=' + name + '&token=' + token + '">click</a>'
                                }
                                transporter.sendMail(mailOptions, function (err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log('Sent: ' + info.response);
                                    }
                                });
                                success = 'Registrazione avvenuta con successo, benvenuto!'
                                res.render('welcome.ejs', { success: success });
                                } else {
                                    temp_email = req.body.email
                                    temp_user = req.body.name
                                    err_msg_confirm = "Le password non coincidono"
                                    return res.render('register.ejs', { err_msg_confirm: err_msg_confirm, temp_email: temp_email, temp_user: temp_user });
                                }
                                
                            }
                        });
                    })
                    let userPromise = new Promise(function (resolve, reject) {
                        pool.query("SELECT user FROM login WHERE user = ?", [name], function (err, username) {
                            if (username[0] != undefined) {
                                if (username[0].user == name) {
                                    user_check = true;
                                    resolve('ez')
                                }
                            } else {
                                user_check = false;
                                resolve('ez21')
                            }
                        })
                    })
                    Promise.all([userPromise, emailPromise]).then(values => {
                        if (user_check && email_check) {
                            err_msg_user = "L'username inserito è già registrato"
                            err_msg_mail = "L'E-mail inserita è già registrata"
                            res.render('register.ejs', { err_msg_user: err_msg_user, err_msg_mail: err_msg_mail })
                        }
                        if (user_check && !email_check) {
                            err_msg_user = "L'username inserito è già registrato"
                            res.render('register.ejs', { err_msg_user: err_msg_user })
                        }
                        if (!user_check && email_check) {
                            err_msg_mail = "L'E-mail inserita è già registrata"
                            res.render('register.ejs', { err_msg_mail: err_msg_mail })
                        }
                    })
                } else {
                    if ((validUser != 'valido') && (validEmail != 'valido')) {
                        err_msg_user = "L'username deve avere lunghezza compresa tra 6 e 15 caratteri"
                        err_msg_mail = "Controllare correttezza formale E-Mail"
                        err_msg_psw = "La password deve avere lunghezza compresa tra 8 e 16 caratteri e contenere almeno una lettera Maiuscola, una minuscola, un numero ed un carattere speciale"
                        temp_email = req.body.email
                        temp_user = req.body.name
                        if (validPassword != 'valido') {
                            return res.render('register.ejs', { err_msg_user: err_msg_user, err_msg_mail: err_msg_mail, err_msg_psw: err_msg_psw, temp_email: temp_email, temp_user: temp_user });
                        } else {
                            return res.render('register.ejs', { err_msg_user: err_msg_user, err_msg_mail: err_msg_mail, temp_email: temp_email, temp_user: temp_user });
                        }
                    } else if ((validUser != 'valido') && (validEmail == 'valido')) {
                        err_msg_user = "L'username deve avere lunghezza compresa tra 6 e 15 caratteri"
                        err_msg_mail = "Controllare correttezza formale E-Mail"
                        temp_email = req.body.email
                        return res.render('register.ejs', { err_msg_user: err_msg_user, temp_email: temp_email });
                    } else if ((validUser == 'valido') && (validEmail != 'valido')) {
                        temp_user = req.body.name
                        err_msg_user = "L'username deve avere lunghezza compresa tra 6 e 15 caratteri"
                        err_msg_mail = "Controllare correttezza formale E-Mail"
                        return res.render('register.ejs', { err_msg_mail: err_msg_mail, temp_user: temp_user });
                    } else if ((validUser == 'valido') && (validEmail == 'valido')) {
                        err_msg_psw = "La password deve avere lunghezza compresa tra 8 e 16 caratteri e contenere almeno una A, a e un numero"
                        temp_user = req.body.name
                        temp_email = req.body.email
                        if (validPassword != 'valido') {
                            return res.render('register.ejs', { err_msg_psw: err_msg_psw, temp_user: temp_user, temp_email: temp_email });
                        }
                    }
                }
            } else {
                if (name && email && !pass_check) {
                    err_msg_psw = "Inserire la password"
                    temp_user = req.body.name
                    temp_email = req.body.email
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, temp_user: temp_user, temp_email: temp_email });
                } else if (name && !email && !pass_check) {
                    err_msg_psw = "Inserire la password"
                    err_msg_mail = "Inserire l'e-mail"
                    temp_user = req.body.name
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, err_msg_mail: err_msg_mail, temp_user: temp_user });
                } else if (!name && email && !pass_check) {
                    err_msg_psw = "Inserire la password"
                    err_msg_user = "Inserire l'username"
                    temp_email = req.body.email
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, err_msg_user: err_msg_user, temp_email: temp_email });
                } else if (!name && !email && pass_check) {
                    err_msg_psw = "Inserire la password"
                    err_msg_user = "Inserire l'username"
                    return res.render('register.ejs', { err_msg_mail: err_msg_mail, err_msg_user: err_msg_user });
                } else if (!name && email && pass_check) {
                    err_msg_user = "Inserire l'username"
                    temp_email = req.body.email
                    return res.render('register.ejs', { err_msg_user: err_msg_user, temp_email: temp_email });
                } else if (name && !email && pass_check) {
                    err_msg_mail = "Inserire l'e-mail"
                    temp_user = req.body.name
                    return res.render('register.ejs', { err_msg_mail: err_msg_mail, temp_user: temp_user });
                } else if (!name && !email && !pass_check) {
                    err_msg_psw = "Inserire la password"
                    err_msg_mail = "Inserire l'e-mail"
                    err_msg_user = "Inserire l'username"
                    err_msg_confirm = "Confermare la password"
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, err_msg_mail: err_msg_mail, err_msg_user: err_msg_user, err_msg_confirm: err_msg_confirm });
                }
            }
        } catch {
            res.redirect('/register')
        }
    }
    registra();
})

module.exports = router