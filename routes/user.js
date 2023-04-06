const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const Users = require("../models/mongoUsers.js");
const Tokens = require("../models/mongoTokens.js");
const waitList = require("../models/mongoWaitList.js");
const transporter = require("../models/gmail.js");

router.get("/", (req, res) => {
  res.render("user/user.ejs");
});

router.post("/check", async (req, res) => {
  try {
    const email = req.body.semail;
    if (!email) return res.sendStatus(404);
    const check = await Users.findOne({ email: email });
    if (!check) return res.render("user/error.ejs");
    res.render("user/answer.ejs", { message: check.credit });
  } catch (err) {
    res.sendStatus(404);
  }
});

router.post("/add", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const credit = req.body.credit;
    if (!email || !password || !credit) return res.render("user/error.ejs");
    const user = await Users.findOne({ email: email });
    if (user === "true") return res.render("user/error.ejs");
    bcrypt.hash(password, 10, (err, result) => {
      if (err) return res.render("user/error.ejs");
      else {
        var pattern = /[^0-9.-]+/g;
        const cena = "0.80"; //! CENA ZA EGZAMINz
        const koszt = parseFloat(cena.replace(pattern, "")) * credit;
        //! PUSH USER INTO A WAITLIST COLLECTION
        push(email, password, credit, koszt);
        async function push(email, password, credit, koszt) {
          const push = await waitList.create({
            email: email,
            password: password,
            credit: credit,
            price: koszt,
          });
          if (!push) return res.render("user/error.ejs");
          else {
            var mailOptions = {
              from: process.env.GMAIL_NAME,
              to: email,
              subject: "Czekamy na zapłatę",
              html: "<p>Twoje konto zostanie aktywowane w przeciągu 2-3h od momentu dotarcia przelewu o wysokości <b> "+koszt+" </b> zł na numer 532 083 973<p>"
            };
          
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                res.send(error);
              } else {
                return res.render("user/user.ejs", { message2: koszt });
              }
            });
          }
        }
      }
    });
  } catch (err) {
    res.sendStatus(404);
  }
});

router.post("/buy", async (req, res) => {
  try {
    const email = req.body.bemail;
    const creditIncrease = req.body.ikluczy;
    if (!email || !creditIncrease) return res.render("user/error.ejs");
    const user = await Users.findOne({ email: email });
    if (user === "false") return res.render("user/error.ejs");
    else{
        const newCredit = parseInt(user.credit) + parseInt(creditIncrease);
        const create = await waitList.create({email : email, password: user.password, credit: newCredit, used: user.used});
        if(!create) return res.render("user/error.ejs");
        var pattern = /[^0-9.-]+/g;
        const cena = "0.40"; //! CENA ZA EGZAMINz
        const koszt = parseFloat(cena.replace(pattern, "")) * creditIncrease;
        return res.status(301).render("user/succes.ejs", { message: koszt });
    }
  } catch (err) {
    res.sendStatus(404);
  }
});

router.post("/forgot",async  (req,res) =>{
  try{
    const user = await Users.findOne({email: req.body.femail});
    if(!user) return res.render("user/error.ejs");
    var token = await Tokens.findOne({userID: user._id});
    if(!token){
      token = await new Tokens({
        userId: user._id,
        code: crypto.randomBytes(32).toString("hex"),
      }).save();
    }
    const link = process.env.BASE_URL+"user/password-reset/"+ user._id +"/"+token.code;
    var mailOptions = {
      from: process.env.GMAIL_NAME,
      to: req.body.femail,
      subject: "Zmiana hasła",
      html: "<a href="+link+">"+link+"</a>"
    };
  
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        res.send("Ups there was an error");
        console.log(error);
      } else {
        return res.send("Email został wysłany")
      }
    });
  }
  catch(error){
    res.send("Ups there was an error");
    console.log(error);
  }
})

router.get("/password-reset/:userId/:code", async (req, res) => {
  try {
    const user = await Users.findOne({_id : req.params.userId});
    if (!user) return res.status(400).send("invalid link or expired");
    const token = await Tokens.findOne({
        userId: user._id,
        code: req.params.code,
    });
    if (!token) return res.status(400).send("Invalid link or expired");
      var link = req.protocol + '://' + req.get('host') + req.originalUrl;
      res.render("user/reset.ejs", {link: req.originalUrl} );
  } catch (error) {
      res.send("An error occured");
      console.log(error);
  }
});

router.post("/password-reset/:userId/:code", async (req, res) => {
  try {
    const user = await Users.findOne({_id:req.params.userId});
    if (!user) return res.status(400).send("invalid link or expired");
    const token = await Tokens.findOne({
        userId: user._id,
        code: req.params.code,
    });
    if (!token) return res.status(400).send("Invalid link or expired");

      const newPass = req.body.password;
      console.log(newPass);
    
      bcrypt.hash(newPass, 10, (err, result) => {
        if (err) return res.render("user/error.ejs");
        else {
          rewriteANDdelete();
          async function rewriteANDdelete(){
            user.password = result;
            await user.save();
            await Tokens.deleteOne({        userId: user._id,
              code: req.params.code});
      
            res.send("password reset sucessfully.");
          }
        }
      })
  } catch (error) {
      res.send("An error occured");
      console.log(error);
  }
});


function authenticateReset(req, res, next) {
  user = Users.findById(req.params.userId);
  if (!user) return res.status(400).send("invalid link or expired");

  token = Tokens.findOne({
      userId: user._id,
      code: req.params.code,
  });
  if (!token) return res.status(400).send("Invalid link or expired");
  else next();
}


module.exports = router;
