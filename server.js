const express = require("express");
const app = express();
const mongoose=require("mongoose");
const usermodel=require("./models/usermodel");
const clc=require("cli-color");
const bcrypt=require("bcrypt");
const {userdatavalidation}=require("./utils/auth.js")
const validator=require("validator");
const {isAuth}=require("./middlewares/Authmiddleware.js")
require("dotenv").config();
app.set("view engine","ejs");
const PORT=process.env.PORT;
const session=require("express-session");
const todomodel = require("./models/todomodel.js");
const mongodbsession=require("connect-mongodb-session")(session);
const ratelimiting=require("./middlewares/ratelimiting.js")
//const mongo_URI=`mongodb+srv://bhanu:12345@cluster0.6mael57.mongodb.net/feb24`
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
  const store=mongodbsession(
    {
        uri:process.env.mongo_URI,
        collection:"sessions"
     }
  )
 app.use(session({
    secret:"this is a march class",
    resave:false,
    saveUninitialized:false,
    store:store
 }))
 app.use(express.static("public"))
app.get("/", (req, res) => {
    return res.send("server is running");
});
 mongoose.connect(process.env.mongo_URI).then(()=>{
    console.log(clc.yellowBright("mongodb connected successfully"))
 }).catch((err)=>{
 console.log(err)
 })
app.get("/register", (req, res) => {
    return res.render("registerpage")
});
 
app.post("/register", async(req, res) => {
    console.log(req.body);
     const {name,email,username,password}=req.body;
     try{
        await userdatavalidation({name,email,username,password})
     }
     catch(err){
        return res.send({
            status:500,
            message:"userdata error",
            data:err
        })
     }
     const emailexist=await usermodel.findOne({email});
     if(emailexist){
        return res.send({
            status:400,
            message:"email already exists"
        })
     }
     const usernameexist=await usermodel.findOne({username})
     if(usernameexist){
        return res.send({
            status:400,
            message:"username already exists"
        })
     }
     const hashedpassword=await bcrypt.hash(password,parseInt(process.env.SALT))
     const userobj=new usermodel({
        name:name,
        email:email,
        username:username,
        password:hashedpassword
     })
    try{
        const userdb=await userobj.save();
        return res.send({
            status:201,
            message:"user created successfully",
            data:userdb
        })
    }
    catch(err){
        return res.send({
            status:500,
            message:"database error",
            data:err
        })
    }
});
 app.get("/login",(req,res)=>{
    return res.render("loginpage")
 })
 app.post("/login",async(req,res)=>{
    const {loginId,password}=req.body;
    //console.log(req.body)
    if(!loginId||!password){
        return res.send({
            status:400,
            message:"missing credentials"
        })
    }
    try{
    let userdb;
    if(validator.isEmail(loginId)){
        userdb=await usermodel.findOne({email:loginId})
    }
    else{
        userdb=await usermodel.findOne({name:loginId})
    }
    if(!userdb){
        return res.send({
            status:404,
            message:"user not found, please register!"
        })
    }
    console.log(password,userdb.password)
    const ismatched= await bcrypt.compare(password,userdb.password);
    if(!ismatched){
     return res.send({
        status:400,
        message:"password incorrect"
     })
    }
   //console.log(req.session)
   req.session.isAuth=true,
   req.session.user={
    userId:userdb._id,
    email:userdb.email,
    username:userdb.username
   }
        return res.redirect("/dashboard")
    }
    catch(err){
        return res.send({
            status:500,
            message:"database error",
            data:err
        })
    }
 })
 app.get("/dashboard",isAuth,(req,res)=>{
    return res.render("Dashboardpage")
 })
 app.post("/logout",isAuth,(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            return res.send({
                status:500,
                message:"logout unsuccessfull"
            })
        }
        else{
            return res.redirect("/login")
        }
    })
 })
 app.post("/logout-from-all-devices",isAuth,async(req,res)=>{
    const username=req.session.user.username;
    const sessionschema= new mongoose.Schema({_id:String},{strict:false})
      const sessionmodel = mongoose.model('session', sessionschema);
    try{
        const deletedb=await sessionmodel.deleteMany({"session.user.username":username})
        return res.redirect("/login")
    }
    catch(err){
        return res.send({
            status:500,
            message:"database error"
        })
    }
 })
 app.post("/create-item",isAuth,ratelimiting, async(req,res)=>{
    console.log(req.body)
    const todotext=req.body.todo;
    const username=req.session.user.username;
    if(!todotext){
        return res.send({
            status:400,
            message:"missing credentials"
        })
    }
    if(typeof(todotext)!=="string"){
        return res.send({
            message:"todo is not a string"
        })
    }
    if(todotext.length<3||todotext.length>200){
        return res.send({
            message:"todo length should be in between 3 and 200 characters"
        })
    }
    // return res.send({
    //     status:201,
    //     message:"todo created successfully"
    // })
    const todoobj=todomodel({
        todo:todotext,
        username:username
    })
    try{
     const tododb=await todoobj.save();
     return res.send({
        status:201,
        message:"todo created successfully",
        data:tododb
     })
    }
    catch(err){
        return res.send({
            status:500,
            message:"database error",
            data:err
        })
    }
 })
 app.get("/read-item",isAuth,async(req,res)=>{
    const username=req.session.user.username;
    // try{
    //   const todos=await todomodel.find({username});
    //   console.log(todos)
    //   if(todos.length===0){
    //     return res.send({
    //         status:400,
    //         message:"todos not found"
    //     })
    //   }
    //   return res.send({
    //     status:200,
    //     message:"read successfully",
    //     data:todos
    //   })
    // }
    // catch(err){
    // return res.send({
    //     status:500,
    //     message:"database error",
    //     data:err
    // })
    // }
    //mongodb aggregate, skip,limit,match
    const SKIP=Number(req.query.skip)||0;
    const LIMIT=5;
    try{
    const todos=await todomodel.aggregate([
        {
            $match:{username:username}
        },
        {
            $facet:{
                data:[{$skip:SKIP},{$limit:LIMIT}]
            }
        }
    ])
    console.log(todos[0].data)
    if(todos[0].data.length===0){
        return res.send({
            status:400,
            message:SKIP===0?"no todos found":"no more todos found"
        })
    }
    return res.send({
        status:200,
        message:"read success",
        data:todos[0].data
    })
}
catch(err){
    return res.send({
        status:500,
        message:"database error",
        data:err
    })
}
 })
 app.post("/edit-item",isAuth,async(req,res)=>{
    const {id,newdata}=req.body;
    const username=req.session.user.username;
    try{
    const tododb=await todomodel.findOne({_id:id});
    if(!tododb){
        return res.send({
            status:400,
            message:"todo not found",
        })
    }
    if(username!==tododb.username){
        return res.send({
            status:403,
            message:"not authorized user"
        })
    }
    const prevtodo=await todomodel.findOneAndUpdate({_id:id},{todo:newdata})
    return res.send({
        status:200,
        message:"todo edited successfully",
        data:prevtodo
    })
    }
    catch(err){
   return res.send({
    status:500,
    message:"database error",
    data:err
   })
    }
 })
 app.post("/delete-item",isAuth,ratelimiting,async(req,res)=>{
    const id=req.body.id;
    const username=req.session.user.username;
    if(!id){
        return res.send({
            status:400,
            message:"missing todo id"
        })
    }
    try{
       const tododb=await todomodel.findOne({_id:id});
       if(!tododb){
        return res.send({
            status:404,
            message:`todo not found with the id:${id}`
        })
       }
       if(username!==tododb.username){
        return res.send({
            status:403,
            message:"not authorized user",
        })
       }
       const deletedb=await todomodel.findOneAndDelete({_id:id})
       return res.send({
        status:200,
        message:"todo deleted successfully",
        data:deletedb
       })
    }
    catch(err){
   return res.send({
    status:500,
    message:"database error",
    data:err
   })
    }
 })

app.listen(PORT, () => {
    console.log(clc.blueBright(`server is running on the PORT:${PORT}`));
});
 