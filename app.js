require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require('md5');

const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));


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
  password : "String"
});


const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
});


app.get("/login",function(req,res){
    res.render("login");
});


app.get("/register",function(req,res){
    res.render("register");
});


app.post("/register",function(req,res){

  const newUser = new User({
    email :  req.body.username,
    password : md5(req.body.password)
  });
   
  newUser.save().then(()=>{
     res.render("secrets");
  }).catch((err)=>{
    console.log(err);
 });

});

app.post("/login",function(req,res){
  const username = req.body.username;
  const password  = md5(req.body.password);

  User.findOne({email : username}).then((founduser,err)=>{
   if(founduser.password === password){
    res.render("secrets");
   }
   else{
    console.log(err);
   }
  });
});
