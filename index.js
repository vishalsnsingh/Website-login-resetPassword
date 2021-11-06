//jshint esversion:6
require('dotenv').config()
const express = require("express")
const jwt = require('jsonwebtoken')
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")


const app = express()

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)


const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const JWT_SECRET = 'some super secret...'
app.get('/', (req, res) => {
    res.render('home')
})



app.get('/register', (req, res) => {
    res.render("register")
})

app.get('/login', (req, res) => {
    res.render('login')
})


app.get('/Dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("Dashboard")
    } else {
        res.redirect("/login")
    }
})

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect("/")
})

app.post('/register', (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/Dashboard")
            })
        }
    })

})




app.post('/login', (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.pasword
    })
    req.login(user, (err) => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/Dashboard")
            })
        }
    })

})

app.get('/reset', (req, res) => {
    res.render('reset')
})

app.post('/reset', (req, res) => {
    const { username } = req.body.username
    if (username !== User.email) {
        res.send("User not registered")
        return
    }

    const secret = JWT_SECRET + User.password
    const payload = {
        username: User.email,
        _id: User._id
    }
    const token = jwt.sign(payload, secret, { expiresIn: '15m' })
    const link = `http://localhost:3000/reset-password/${token}`
    console.log(link)
    res.send("Password reset link has been sent to our email")

})


app.get('/reset-password/:_id/:token', (req, res) => {
    const { _id, token } = req.params
    if (_id !== User._id) {
        res.send('Invalid id...')
        return
    }
    const secret = JWT_SECRET + User.password
    try {
        const payload = jwt.verify(token, secret)
        res.render('reset-password', { email: user.username })
    } catch (error) {
        console.log(error.message)
        res.send(error.message)
    }
})
app.post('/reset-password/:_id/:token', (req, res) => {
    const { _id, token } = req.params
    res.send(User)


})

app.listen(3000, () => {
    console.log("Server running on Port 3000!")
})