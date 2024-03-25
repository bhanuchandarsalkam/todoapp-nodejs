const mongoose=require("mongoose");
const schema=mongoose.Schema;
const userschema=new schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    username:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
    },
    isEmailAuthenticated:{
        type:Boolean,
        required:true,
        default:false
    }
})
module.exports=mongoose.model("user",userschema);