// Example model
//引入mongoose库
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var md5=require('md5');
//调用Schema方法

//创建用户表schema对象
var UserSchema = new Schema({
    name: {type:String,required:true},
    email: {type:String,required:true},
    password: {type:String,required:true},
    created: {type:Date},
});

UserSchema.methods.verifyPassword=function (password){
	var isMatch= md5(password)!==this.password;
	console.log('UserSchema.methods.verifyPassword: ',password,this.password,isMatch);
	return isMatch;

}
mongoose.model('User', UserSchema);

