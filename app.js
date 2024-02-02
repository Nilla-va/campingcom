// npm init -y
// npm i express mongoose ejs ejs-mate method-override morgan
// npm i (cookie-parser) express-session connect-flash connect-mongo
// npm i (bcrypt) passport passport-local passport-local-mongoose
// npm i multer dotenv cloudinary multer-storage-cloudinary mapbox-gl
// npm i express-mongo-sanitize express-validator joi sanitize-html helmet

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express')
const path = require('path')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')
const morgan = require('morgan')

const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')

const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')

const ExpressError = require('./utils/ExpressError')

const dbUrl = process.env.DB_URL
const dbOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } }
const mongoose = require('mongoose')
const User = require('./models/user')
main().catch(err => {console.log(err); console.log("CONNECTION ERROR D:");});
async function main() {
    await mongoose.connect(dbUrl, dbOptions);
    console.log("DATABASE CONNECTED :D")
}

const app = express()
const adminRoutes = require('./routes/admin')
const userRoutes = require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews')

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))

app.use(morgan('common'))
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

const secret = process.env.SECRET
app.use(session({
    secret: secret,
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
        mongoUrl: dbUrl,
        touchAfter: 24 * 3600 
    })
}));
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(mongoSanitize())
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://stackpath.bootstrapcdn.com", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://stackpath.bootstrapcdn.com", "https://fonts.googleapis.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://easepick.com"],
            workerSrc: ["blob:"],
            connectSrc: ["'self'", "https://*.tiles.mapbox.com", "https://api.mapbox.com", "https://events.mapbox.com"],
            imgSrc: ["'self'", "blob:", "data:", "https://res.cloudinary.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            upgradeInsecureRequests: [],
        },
    },
}))

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.warning = req.flash('warning')
    res.locals.danger = req.flash('danger')
    res.locals.currentUser = req.user;
    next();
})


//====================================


app.use('/admin', adminRoutes) 
app.use('/', userRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)

app.get('/', (req, res) => {
    res.render('home', { currPage: 'home' })
})

app.all('*', (req, res, next) => {
    next(new ExpressError(404, 'Page Not Found!'))
})

app.use((err, req, res, next) => {
    const { status = 500 } = err;
    if (!err.message) {
        err.message = 'Something Went Wrong.'
    }
    res.status(status).render('error', { status, err });
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})


