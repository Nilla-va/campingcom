const express = require('express')
const router = express.Router()
const passport = require('passport')

const wrapAsync = require('../utils/wrapAsync')
const { storeReturnTo, validateUser } = require('../middleware')
const user = require('../controllers/users')


router.route('/register')
    .get(user.createUserForm)
    .post(validateUser, wrapAsync(user.createUser))

router.route('/login')
    .get(user.loginForm)
    .post([ passport.authenticate('local', { failureFlash: {type: 'danger'}, failureRedirect: '/login' }) ], user.login)

router.get('/logout', user.logout)

module.exports = router;