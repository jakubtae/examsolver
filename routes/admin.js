const express = require("express");
const router = express.Router();
const db = require("../models/conn.js");
const bcrypt = require("bcrypt");
const Admin = require("../models/mongoAdmin.js");
const Users = require("../models/mongoUsers.js");
const waitList = require("../models/mongoWaitList.js");

const jwt = require("jsonwebtoken");

const cookieParser = require('cookie-parser');
router.use(cookieParser());

router.get("/", (req, res) => {
  res.render("admin/admin.ejs");
});

router.post("/", async (req, res) => {
  try {
    login();
    async function login() {
      //! searching through mongodb if such email exists
      const admin = await Admin.findOne({ uname: req.body.uname }); //check is already getting all the user data so we can operate on it
      if (admin != null) {
        //! compares the password with the one in the database using bcrypt
        bcrypt.compare(req.body.password, admin.password, (err, result) => {
          if (result == true) {
            //*if password is correct
            //! generate JWT token
            const accessToken = generateAccessToken(admin);
              res.cookie('jwt', accessToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 300 * 1000 });
              //! DO A BACKUP OF COLLECTIONS AND SEND IT TO MY EMAIL
              res.redirect("/admin/panel")
          } else {
            //* if password is incorrect sends error
            res.send("Check if you typed your name and password correctly");
            
          }
        });
      } else {
        //* if user does not exist sends error
        res.send("Check if you typed your name and password correctly");
      }
    }
  } catch {
    res.status(500).send("Something went wrong");
  }
});

router.get("/panel", authenticateToken, async (req, res) => {
 try{
  const allusers = await Users.find({});
  const allwaitList = await waitList.find({});
  res.render("admin/panel/main.ejs", { allusers : allusers, allwaitlist: allwaitList});
 } 
 catch{
  res.redirect("/");
 }
});

router.post("/panel/update", authenticateToken, async (req, res) => {
  try{
    const what = req.body.what;
    if(what === "EMAIL") {
      const update = await Users.updateOne({email : req.body.who}, { email : req.body.newvalue});
      if(update) res.redirect("/admin/panel")
      else{res.sendStatus(500)}
    }
    if(what === "PASSWORD"){
      const hashedPassword = await bcrypt.hash(req.body.newvalue, 10);
      if(hashedPassword){
        const update = await Users.updateOne({email : req.body.who}, { password : hashedPassword});
        if(update) res.redirect("/admin/panel")
      } 
      else{res.sendStatus(500)}
    }
    if(what === "CREDIT"){
      const update =  await Users.updateOne({email : req.body.who}, {$inc:{credit:req.body.newvalue}});
      if(update) res.redirect("/admin/panel")
      else{res.sendStatus(500)}
    }
  }
  catch(err){
    res.send(err);
  }
})

router.post("/panel/create", authenticateToken, async (req, res) => {
  try{
    const duplicate = await Users.findOne({email : req.body.email});
    if(duplicate) return res.sendStatus(500);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    if(hashedPassword){
      const newUser = await Users.create({email: req.body.email, password: hashedPassword, credit: req.body.credit, used : 0})
      if(newUser) return res.redirect("/admin/panel");
      res.sendStatus(500);
    }
    else{
      res.sendStatus(500);
    }
  }
  catch(err){
    res.send(err);
  }
})

router.post("/panel/delete", authenticateToken, async (req, res) => {
  try{
    const todelete = req.body.todelete;
    if(!todelete) return res.redirect("/admin/panel")
    const deleted = await Users.deleteOne({email : todelete});
    if(deleted) return res.redirect("/admin/panel")
    res.sendStatus(500)
  }
  catch(err){
    res.send(err)
  }
})

router.post("/approve",authenticateToken, async (req, res) => {
  try{
    const email = req.body.gemail;
    const check = await waitList.findOne({email: email});
    if(!check) return res.sendStatus(500)
    swap();
    async function swap() {
      const email = req.body.gemail;
      const newUser = await Users.create({email: check.email, password: check.password, credit: check.credit, used : 0})
      if(!newUser) return res.sendStatus(500);
      const deleted = await waitList.deleteOne({email: email});
      if(!deleted) return res.sendStatus(500);
      res.redirect("/admin/panel");
    }
  } 
  catch{
    res.redirect("/admin/panel")
  }
})

router.post("/disapprove",authenticateToken, async (req, res) => {
  try{
    const email = req.body.gemail;
    const check = await waitList.findOne({email: email});
    if(!check) return res.sendStatus(500)
    swap();
    async function swap() {
      const email = req.body.gemail;
      const deleted = await waitList.deleteOne({email: email});
      if(!deleted) return res.sendStatus(500);
      res.redirect("/admin/panel");
    }
  } 
  catch{
    res.redirect("/admin/panel")
  }
})

function authenticateToken(req, res, next) {
  const token = req.cookies.jwt;
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, admin) => {
    if (err) return res.sendStatus(403);
    req.admin = admin;
    next();
  });
}

function generateAccessToken(admin) {
  return jwt.sign(admin.toJSON(), process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "300s",
  });
}




module.exports = router;
