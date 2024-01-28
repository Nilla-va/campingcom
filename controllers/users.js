const User = require('../models/user')
const express = require('express')


module.exports.createUserForm = (req, res) => {
    res.render('users/register')
}

module.exports.createUser = async (req, res) => {

    // 이미 wrapAsync로 감쌌지만.. 이 경우 공통에러화면으로 넘어가게하고싶지않으므로 또 try-catch처리..
    try {

        console.log(req.body.user);
        const { email, username, password } = req.body.user;
        const user = new User({ email, username });                  // 비밀번호는 빼고 인스턴스생성
        const registeredUser = await User.register(user, password);
        console.log(registeredUser)

        // 회원가입 완료 시 자동으로 로그인
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash('success', 'Welcome to YelpCamp!')
            res.redirect('/campgrounds')
        })

    } catch (error) {
        if (error.message === 'A user with the given username is already registered') {
            req.flash('danger', '이미 사용 중인 username 입니다.')
        } else if (error.message.slice(0, 6) === 'E11000') {
            req.flash('danger', '이미 사용 중인 email 입니다.')
        }
        res.redirect('/register')
    }
}

module.exports.loginForm = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!')
    console.log(res.locals.returnTo)
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success', 'Goodbye!')
        res.redirect('/campgrounds')
    })
}