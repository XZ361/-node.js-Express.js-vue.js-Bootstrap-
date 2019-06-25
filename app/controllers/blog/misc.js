const express = require('express');
const router = express.Router();

module.exports = (app) => {
    app.use('/', router);
};
/*首页路由*/
router.get('/', (req, res, next) => {
    //默认调到文章列表页
    res.redirect('/posts');
});

/*关于路由*/
router.get('/about', (req, res, next) => {
    res.render('blog/about', {
        title: 'Node Blog about',
        // pretty属性用来控制pug模板再渲染后的代码解压缩
        pretty:true
    });
});

/*联系页面路由*/
router.get('/contact', (req, res, next) => {
    res.render('blog/contact', {
        title: 'Node Blog contact',
        // pretty属性用来控制pug模板再渲染后的代码解压缩
        pretty:true
    });
});
