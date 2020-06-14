//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt=require("mongoose-encryption");
// const md5=require('md5');
const bcrypt=require('bcrypt');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
const saltRounds = 3;

/*const userSchema={
  email:String,
  password:String
};*/
//change schema type for encryption purpose
const userSchema=new mongoose.Schema({
  email:String,
  password:String
});

// const secret="Thisisourlittlesecret";presrnt in .env for safety
const secret=process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User=mongoose.model("User",userSchema);

app.get("/",function(req,res)
{
  res.render("home");

})

app.get("/login",function(req,res)
{
  res.render("login");

})

app.get("/register",function(req,res)
{
  res.render("register");

})

app.post("/register",function(req,res)
{
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.


  const newUser=new User(
  {
    email:req.body.username,
    // password:req.body.password
    password:hash
  }
);
newUser.save(function(err)
{
  if(err)
  {
    console.log(err);
  }
  else {
    res.render("secrets");
    //only when user registers or logins he should be take to secrets page.
  }

});
});
})

app.post("/login",function(req,res)
{
  const username=req.body.username;
  // const password=req.body.password;
  const password=md5(req.body.password);//hashing
  User.findOne({email:username},function(err,foundUser)
{
  if(err)
    console.log(err);
    else {
      if(foundUser)
      {
        bcrypt.compare(password, foundUser.password, function(err, result) {
    // result == true
        if(result===true)
        {
          res.render("secrets");
        }

        });
                
      }
    }
})
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
