const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const Category = mongoose.model('Category');

module.exports = (app) => {
    app.use('/posts', router);
};
/*首页路由，及其文章列表的页面逻辑*/
router.get('/', (req, res, next) => {
    /*
    .populate('')方法可以从对应的表中拉取对应的数据，并用exec()方法填充到当前查询的文档中
    * */
     //conditions
    var conditions={published: true};
    if(req.query.category){
        conditions.category=req.query.category.trim();
    }
    if(req.query.author){
        conditions.author=req.query.author.trim();
    }
    if(req.query.keyword){
        // 区分大小写
        conditions.title=new RegExp(req.query.keyword.trim(),'i');
        conditions.content=new RegExp(req.query.keyword.trim(),'i');
    }
    
    Post.find(conditions)
        .sort('-created')
        .populate('author')
        .populate('category')
        .exec((err, posts) => {
            if (err) return next(err);
            //Math.abs(parseInt());容错处理---abs回传数的绝对值,判断是否是第一页，并把请求的页数转换成 number 类型
            var pageNum=Math.abs(parseInt(req.query.page || 1,10));

            //每页的文章数
            var pageSize = 10;
            //文章总数
            var totalCount = posts.length;
            //翻页总数---ceil()求不小于给定实数的最小整数
            var pageCount = Math.ceil(totalCount / pageSize);

            if (pageNum > pageCount) {
                pageNum = pageCount;
            }

            res.render('blog/index', {
                //文章切段
                posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
                pageNum: pageNum,
                pageCount: pageCount,
                // pretty属性用来控制pug模板再渲染后的代码解压缩
                pretty: true
            });
        });
});

/*分类列表，及其页面逻辑*/
router.get('/category/:name', (req, res, next) => {
    Category.findOne({name:req.params.name}).exec((err,category)=>{
        if(err) return next(err);
        Post.find({category:category,published:true})
            .sort('created')
            .populate('category')
            .populate('author')
            .exec((err,posts)=> {
                if (err) return next(err);
                res.render('blog/category', {
                    //文章切段
                    posts: posts,
                    category:category,
                    // pretty属性用来控制pug模板再渲染后的代码解压缩
                    pretty: true
                });
            });
    });
});

/*文章详细页面的业务逻辑*/
router.get('/view/:id', (req, res, next) => {
    if(!req.params.id){
        return next(new Error('no post id provided!'))
    }
    var conditions = {};
    try{
        conditions._id=mongoose.Types.ObjectId(req.params.id);
    }catch(err) {
        conditions.slug=req.params.id;
    }


    Post.findOne(conditions)
        .populate('category')
        .populate('author')
        .exec((err, post) => {
            if (err) return next(err);
            res.render('blog/view', {
                post: post
            })
        });
});

/*点赞的业务逻辑*/
router.get('/favorite/:id', (req, res, next) => {
    if(!req.params.id){
        return next(new Error('no post id privided!'))
    }
    var conditions = {};
    try{
        conditions._id=mongoose.Types.ObjectId(req.params.id);
    }catch(err) {
        conditions.slug=req.params.id;
    }
    Post.findOne(conditions)
        .populate('category')
        .populate('author')
        .exec((err, post) => {
            if (err) return next(err);
            post.meta.favorite = post.meta.favorite ? post.meta.favorite + 1 : 1;
            post.markModified('meta');
            post.save((err) => {
                res.redirect('/posts/view/'+post.slug);
            });


        });
});
/*评论的页面逻辑*/
router.post('/comment/:id', (req, res, next) => {
    if(!req.body.email) {
        return next(new Error('no email provided for commenter!'))
    }
    if(!req.body.content){
        return next(new Error('no content provided for commenter!'))
    }
    var conditions = {};
    try{
        conditions._id=mongoose.Types.ObjectId(req.params.id);
    }catch(err) {
        conditions.slug=req.params.id;
    }

    Post.findOne(conditions).exec((err, post) => {
            if (err) return next(err);
            const comment={
                email:req.body.email,
                content:req.body.content,
                create:new Date()
            };
            /*unshift函数可向数组的开头添加一个或更多元素，并返回新的长度。*/
            post.comments.unshift(comment);
            post.markModified('comments');
            post.save((err)=>{
                req.flash('info', ' 评论添加成功!');
                //评论完成之后跳转到文章的详情页
                res.redirect('/posts/view/'+ post.slug);
            });
        });
});