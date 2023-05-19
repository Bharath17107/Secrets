require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require("mongoose-findorcreate")

const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));



app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));  


 app.use(passport.initialize());
 app.use(passport.session());


const DB_URL = "mongodb://127.0.0.1:27017/UserDB";
mongoose.connect(DB_URL,{useNewUrlParser: true,useUnifiedTopology:true}).then(()=>{
  console.log("Connected to MongoDB")
  app.listen(3000,()=>{
    console.log("Server is started running at the port 3000");
  });
}).catch((err)=>{
  console.log(err);
});


const userSchema = new mongoose.Schema ({
  email : "String",
  password : "String",
  googleId : "String",
  secret : "String"
});

userSchema.plugin(passportlocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

//For getting clientid and clientsecret from Google

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


app.get("/",function(req,res){
    res.render("home");
});


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }
));


app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });


app.get("/login",function(req,res){
    res.render("login");
});


app.get("/register",function(req,res){
    res.render("register");
});


app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


app.get("/secrets",function(req,res){
    
    User.find({"secret": { $ne: null }}).then((foundUsers)=> {
      res.render("secrets", { usersWithSecrets: foundUsers });
    }).catch((err)=>{
      console.log(err);
    });
  
});


app.get("/submit",function(req,res){          
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.render("/login");
  }
});


app.post("/register",function(req,res){

  User.register({username : req.body.username},req.body.password,function(err,user){
    if(err)
    {
      console.log(err);
      res.redirect("/register");
    }
    else
    {
          passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        });
    }
  });

});



app.post("/login",function(req,res){
  const user = new User({
    username : req.body.username,
    password: req.body.passport
  });

  req.login(user, function(err){
      if(err)
      {
        console.log(err);
      }
      else
      {
        passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
        });
      }
  });
});


app.post("/submit",function(req,res){
  const submittedsecret = req.body.secret;


  User.findById(req.user.id).then((foundUser)=>{
    foundUser.secret = submittedsecret;
        foundUser.save().then(()=>{
          res.redirect("/secrets");
    });
  });
  
});



