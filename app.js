require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;


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

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    
    const newUser = new User({
      email :  req.body.username,
      password : hash
    });
     
    newUser.save().then(()=>{
       res.render("secrets");
    }).catch((err)=>{
      console.log(err);
   });
 });
});



app.post("/login",function(req,res){
  const username = req.body.username;
  const password  = req.body.password;

  User.findOne({email : username}).then((founduser,err)=>{
   if(err)
   {
      console.log(err);
   }
   else
  {
    if(founduser)
    {
      bcrypt.compare(password,founduser.password,function(err,result){
        if(result === true)
        {
          res.render("secrets");
        }
           
      });
    }
  }
  });
});
