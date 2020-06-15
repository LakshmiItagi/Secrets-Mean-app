//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt=require("mongoose-encryption");
// const md5=require('md5');
// const bcrypt=require('bcrypt');
const app = express();
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: 'My little secret.',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
mongoose.set("useCreateIndex",true);
const saltRounds = 3;

/*const userSchema={
  email:String,
  password:String
};*/
//change schema type for encryption purpose
const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret="Thisisourlittlesecret";presrnt in .env for safety
const secret=process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});



const User=mongoose.model("User",userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

//above 2 lines are replaced so that it should work with any kind of authentication
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

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

app.get("/secrets",function(req,res)
{ //if user is authenticated then driect him to secrets
  /*if(req.isAuthenticated()){
    res.render("secrets");
  }
  else {
    res.redirect("/login");
  */
  User.find({"secret":{$ne:null}},function(err,foundUsers)
{
  if(!err)
  {
    res.render("secrets",{userwithSecrets:foundUsers});
  }
})
});

app.get("/logout",function(req,res)
{
  req.logout();
  res.redirect("/");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });

app.get("/submit",function(req,res)
    { //if user is authenticated then driect him to secrets
      if(req.isAuthenticated()){
        res.render("submit");
      }
      else {
        res.redirect("/login");
      }
    });

app.post("/register",function(req,res)
{
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//
//
//   const newUser=new User(
//   {
//     email:req.body.username,
//     // password:req.body.password
//     password:hash
//   }
// );
// newUser.save(function(err)
// {
//   if(err)
//   {
//     console.log(err);
//   }
//   else {
//     res.render("secrets");
//     //only when user registers or logins he should be take to secrets page.
//   }
//
// });
// });
User.register({username:req.body.username}, req.body.password, function(err, user)
{
  if(err)
  {
    console.log(err);
    res.redirect("/register");
  }
  else {
    passport.authenticate("local")(req,res,function()
  {
    res.redirect("/secrets");
  })
  }
});
});

app.post("/login",function(req,res)
{
//   const username=req.body.username;
//   // const password=req.body.password;
//   const password=md5(req.body.password);//hashing
//   User.findOne({email:username},function(err,foundUser)
// {
//   if(err)
//     console.log(err);
//     else {
//       if(foundUser)
//       {
//         bcrypt.compare(password, foundUser.password, function(err, result) {
//     // result == true
//         if(result===true)
//         {
//           res.render("secrets");
//         }
//
//         });
//
//       }
//     }
// })
const user=new User({
  username:req.body.username,
  password:req.body.password
});
req.login(user,function(err)
{
  if(err)
    console.log(err);
  else {
    passport.authenticate("local")(req,res,function()
  {
    res.redirect("/secrets");
  })
  }
})
});

app.post("/submit",function(req,res)
{
  const secret=req.body.secret;
  console.log(secret);
  console.log(req.user.id);
  User.findById(req.user.id,function(err,foundUser)
{
  if(err)
  {
    console.log(err);
  }
  else {
    foundUser.secret=secret;
    foundUser.save(function()
  {
    res.redirect("/secrets");
  });
  }
});
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
