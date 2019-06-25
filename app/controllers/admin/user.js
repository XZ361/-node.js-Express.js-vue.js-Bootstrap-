const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Post = mongoose.model('Post');

module.exports = (app) => {
    app.use('/admin/users', router);
};
/*获取用户登录界面*/
router.get('/login', (req, res, next) => {
   res.render('admin/user/login',{
   		pretty:true
   })
});
/*实现用户登录*/
router.post('/login',
    passport.authenticate('local',{
     failureRedirect: '/admin/users/login'}),(req, res, next) => {
         console.log(req.body);
         // res.jsonp(req.body);
         res.redirect("/admin/posts");
});
/*获取用户注册界面*/
router.get('/register', (req, res, next) => {
   res.render('admin/user/register',{
   	pretty:true,
   })
});
/*实现用户注册*/
router.post('/register', (req, res, next) => {
   res.jsonp(req.body);
});
/*实现用户注销*/
router.get('/logout', (req, res, next) => {
  req.logout();
   res.redirect('/')
});
