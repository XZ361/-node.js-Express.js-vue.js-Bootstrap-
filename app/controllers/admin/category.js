const express = require('express');
const router = express.Router();
const slug = require('slug');
const pinyin = require('pinyin');
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const Category = mongoose.model('Category');

module.exports = (app) => {
    /*后台路由*/
    app.use('/admin/categories', router);
};
/*分类列表*/
router.get('/', (req, res, next) => {
    res.render('admin/category/index', {
        // pretty属性用来控制pug模板再渲染后的代码解压缩
        pretty: true
    });
});
/*获取添加分类功能*/
router.get('/add', (req, res, next) => {
    res.render('admin/category/add', {
        // pretty属性用来控制pug模板再渲染后的代码解压缩
        action:"/admin/categories/add",
        pretty: true,
        category:{_id:''}
    });
});
/*实现添加分类功能*/
router.post('/add', (req, res, next) => {
     var name=req.body.name.trim();
    var py=pinyin(name,{
        style:pinyin.STYLE_NORMAL,
        heteronym:false
    }).map((item)=>{
        return item[0];
    }).join(' ');
    var category= new Category({
        name:name,
        slug:slug(py),
        created:new Date()

    })
    category.save((err,category)=>{
        if(err){
            req.flash('error','分类保存失败！');
            // 调到分类的添加页面
            res.redirect('/admin/categories/add');
            return next(err);
        }else{
            req.flash('info','分类保存成功！');
            // 保存成功就跳到文章列表页
            res.redirect('/admin/categories');    
        }
        
    })
});
/*获取后台分类编辑提交功能*/
router.get('/edit/:id', (req, res, next) => {
     if(!req.params.id){
        return next(new Error('no category id provided!'))
    }
   


    Category.findOne({_id:req.params.id})
        .exec((err, category) => {
            if (err) return next(err);
            if(!category){
                return next(new Error('category not found: ',req.params.id))
            }
            res.render('admin/category/add', {
                action:"/admin/categories/edit/"+category._id,
                category: category
            })
        });
});
/*实现后台分类编辑提交功能*/
router.post('/edit/:id', (req, res, next) => {
     if(!req.params.id){
        return next(new Error('no post id provided!'))
    }
   
    Category.findOne({_id:req.params.id})
        .exec((err,post)=>{
            if(err){
                return next(err);
            }
            var name=req.body.name.trim();

            var py=pinyin(name,{
                style:pinyin.STYLE_NORMAL,
                heteronym:false
            }).map((item)=>{
                return item[0];
            }).join(' ');

            category.name=name;
            category.slug=slug(py);
            category.save((err,category)=>{
                if(err){
                    req.flash('error','分类编辑失败！');
                    // 调到文章的添加页面
                    res.redirect('/admin/categories/edit/'+post._id);
                    // return next(err);
                }else{
                    req.flash('info','分类编辑成功！');
                    // 保存成功就跳到文章列表页
                    res.redirect('/admin/categories');    
                }
                
            })
        })
         
});
/*后台文章删除功能*/
router.get('/delete/:id', (req, res, next) => {
    if(!req.params.id)return next(new Error('no Category is provided'));

    Category.remove({_id:req.params.id}).exec((err,rowsRemoved)=>{
        if(err)return next(err);
        if(rowsRemoved){
            req.flash('success','分类删除成功！');
        }else{
            req.flash('success','分类删除失败！');
        }
        res.redirect('/admin/categories');
    });
});
