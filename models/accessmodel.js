const mongoose=require("mongoose");
const schema=mongoose.Schema;
const accessschema=new schema({
    sessionId:{
        type:String,
        required:true
    },
    time:{
        type:String,
        required:true
    }
})
module.exports=mongoose.model("access",accessschema)