const express = require('express')
const app = module.exports = express()
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');

const optionsCache = {
    etag: true,
    maxAge: 31537000,
    redirect: true
}
// working on mac today
require('dotenv').config()

const options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
}

const sessionStore = new MySQLStore(options);

app.use(express.static(path.join(__dirname, 'public'), optionsCache));
app.use(express.static(path.join(__dirname, 'js'), optionsCache));

app.set('view-engine', 'ejs')


app.use(session({
    secret: 'session_cookie_secret',
    cookie: { maxAge: 600000 }, // 10 minuti di login salvato
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/*
app.use((req, res, next) => {
    console.log(req.method);
    next();
})
*/

app.get('/', (req, res) => {
    if (req.session.authenticated) {
        let success = req.session.user.user
        res.render('home.ejs', { success: success })
    }
    else res.render('login.ejs');
})

const home = require('./routes/home.js')
const login = require('./routes/login.js')
const register = require('./routes/register.js')
const verify = require('./routes/verify.js')
const recover = require('./routes/recover.js')
const recovery = require('./routes/recovery.js')
const user = require('./routes/user.js')
const doublefa = require('./routes/doublefa.js')

app.use(home)
app.use(login)
app.use(register)
app.use(verify)
app.use(recover)
app.use(recovery)
app.use(user)
app.use(doublefa)

const port = process.env.port || 8080;

app.listen(port) 