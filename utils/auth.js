const validator=require("validator");
const userdatavalidation=({name,email,username,password})=>{
    return new Promise((resolve,reject)=>{
        console.log(name,email,username,password);
        if(!name||!email||!username||!password){
            reject("missing credentials")
        }
        if(typeof(name)!=="string"){
            reject("name is not a string")
        }
        if(typeof(email)!=="string"){
            reject("email is not a string")
        }
        if(typeof(username)!=="string"){
            reject("username is not a string")
        }
        if(username.length<3||username.length>20){
            reject("username should be in between 3 to 20 characters")
        }
        if(!validator.isAlphanumeric(password)){
            reject("password should contains A-Z,a-z and 0-9")
        }
        if(!validator.isEmail(email)){
            reject("email incorrect")
        }
        resolve();
    })
} 
module.exports={userdatavalidation};