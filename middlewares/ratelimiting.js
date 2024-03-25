const accessmodel=require("../models/accessmodel.js");
const ratelimiting= async(req,res,next)=>{
    const sessionId=req.session.id;
    try{
     const accessdb=await accessmodel.findOne({sessionId:sessionId});
     if(!accessdb){
        const accessobj=new accessmodel({
            sessionId:sessionId,
            time:Date.now()
        })
        await accessobj.save();
        next();
        return;
     }
     const diff=(Date.now()-accessdb.time)/1000;
     if(diff<2){
        return res.send({
            status:400,
            message:"too many requests"
        })
     }
     await accessmodel.findOneAndUpdate({sessionId},{time:Date.now()});
     next();
    }
    catch(err){
        return res.send({
            status:500,
            message:"database error via ratelimiting",
            data:err
        })
    }
}
module.exports=ratelimiting;