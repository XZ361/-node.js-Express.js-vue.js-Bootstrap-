const express = require('express');
const router = express.Router();
const slug = require('slug');
const pinyin = require('pinyin');
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');

module.exports = (app) => {
    /*后台路由*/
    app.use('/admin/posts', router);
};
/*首页路由，及其文章列表的页面逻辑*/
/*后台文章列表页*/
router.get('/', (req, res, next) => {
    //后台文章列表排序
    //安什么顺序排
    var sortby=req.query.sortby ? sortby : 'created';
    //默认降序排列
    var sortdir=req.query.sortdir ? sortdir :'desc';
    if(['title','category','author','created','published'].indexOf(sortby)===-1){
        sortby='created';
    }
    if(['desc','asc'].indexOf(sortdir)===-1){
        sortdir='desc';
    }
    var sortObj = {};
    sortObj[sortby]=sortdir;
    //conditions
    var conditions={};
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
    /*
    .populate('')方法可以从对应的表中拉取对应的数据，并用exec()方法填充到当前查询的文档中
    * */
    User.find({},(err,authors)=>{
        if (err) return next(err);
            // {published: true}
        Post.find(conditions)
            .sort(sortObj)
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

                res.render('admin/post/index', {
                    //文章切段
                    posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
                    pageNum: pageNum,
                    pageCount: pageCount,
                    sortdir: sortdir,
                    sortby: sortby,
                    authors:authors,
                    filter:{
                        category:req.query.category || "",
                        author:req.query.author || " ",
                        keyword:req.query.keyword || " ",
                    },


                    // pretty属性用来控制pug模板再渲染后的代码解压缩
                    pretty: true
                });
            });
    });

});

/*后台获取文章*/
router.get('/add', (req, res, next) => {
    res.render('admin/post/add', {
        // pretty属性用来控制pug模板再渲染后的代码解压缩
        action:"/admin/post/add",
        pretty: true,
        post:{
            category:{_id:''}
        }
    });
});
/*后台添加文章*/
router.post('/add', (req, res, next) => {
    // 创建文章之前，进行post字段校验
    // req.checkBody('title','文章标题不能为空').notEmpty();
    // req.checkBody('category','必须选定文章分类').notEmpty();
    // req.checkBody('content','文章内容不能为空').notEmpty();
    // 获取所有的验证错误
    /*var errors=req.validationErrors();
    if(errors){
        // 若存在错误，则重新渲染
        return req.render('/admin/post/add',{
            errors:errors,
            title:req.body.title,
            content:req.body.content
        })
    }*/

    
    var title=req.body.title.trim();
    var category=req.body.category.trim();
    var content=req.body.content;
    User.findOne({},(err,author)=>{
        if(err){
            return next(err);
        }
        var py=pinyin(title,{
            style:pinyin.STYLE_NORMAL,
            heteronym:false
        }).map((item)=>{
            return item[0];
        }).join(' ');
        var post= new Post({
            title:title,
            slug:slug(py),
            category:category,
            content:content,
            author:author,
            published:true,
            meta:{favorite:0},
            comments:[],
            created:new Date()

        })
        post.save((err,post)=>{
            if(err){
                req.flash('error','文章保存失败！');
                // 调到文章的添加页面
                res.redirect('/admin/posts/add');
                return next(err);
            }else{
                req.flash('info','文章保存成功！');
                // 保存成功就跳到文章列表页
                res.redirect('/admin/posts');    
            }
            
        })
    })

});
/*添加分类*/
router.post('/add', (req, res, next) => {
});
/*后台获取文章编辑*/
router.get('/edit/:id', (req, res, next) => {
       if(!req.params.id){
        return next(new Error('no post id provided!'))
    }
   


    Post.findOne({_id:req.params.id})
        .populate('category')
        .populate('author')
        .exec((err, post) => {
            if (err) return next(err);
            res.render('admin/post/add', {
                action:"/admin/post/edit/"+post._id,
                post: post
            })
        });

});

/*后台文章编辑提交功能*/
router.post('/edit/:id', (req, res, next) => {
     if(!req.params.id){
        return next(new Error('no post id provided!'))
    }
   
    Post.findOne({_id:req.params.id})
        .exec((err,post)=>{
            if(err){
                return next(err);
            }
            var title=req.body.title.trim();
            var category=req.body.category.trim();
            var content=req.body.content;

            var py=pinyin(title,{
                style:pinyin.STYLE_NORMAL,
                heteronym:false
            }).map((item)=>{
                return item[0];
            }).join(' ');

            post.title=title;
            post.category=category;
            post.content=content;
            post.slug=slug(py);
            post.save((err,post)=>{
                if(err){
                    req.flash('error','文章编辑失败！');
                    // 调到文章的添加页面
                    res.redirect('/admin/posts/edit/'+post._id);
                    // return next(err);
                }else{
                    req.flash('info','文章编辑成功！');
                    // 保存成功就跳到文章列表页
                    res.redirect('/admin/posts');    
                }
                
            })
        })
         

});
/*后台文章删除功能*/
router.get('/delete/:id', (req, res, next) => {
    if(!req.params.id)return next(new Error('no post is provided'));

    Post.remove({_id:req.params.id}).exec((err,rowsRemoved)=>{
        if(err)return next(err);
        if(rowsRemoved){
            req.flash('success','文章删除成功！');
        }else{
            req.flash('success','文章删除失败！');
        }
        res.redirect('/admin/posts');
    });
});