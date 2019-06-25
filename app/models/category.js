// Example model
//引入mongoose库
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//调用Schema方法

//创建分类表schema对象
const CategorySchema = new Schema({
    name: {type:String,required:true},
    slug: {type:String,required:true},
    created: {type:Date},
});

mongoose.model('Category', CategorySchema);

