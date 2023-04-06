if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const router = express.Router();
const db = require("../models/conn.js");
const bcrypt = require("bcrypt");
var fs = require("fs");

const Admin = require("../models/mongoAdmin.js");
const Users = require("../models/mongoUsers.js");
const waitList = require("../models/mongoWaitList.js");
const jwt = require("jsonwebtoken");
//! EMAIL RELATED
const transporter = require("../models/gmail.js");

const cookieParser = require("cookie-parser");
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
            res.cookie("jwt", accessToken, {
              httpOnly: true,
              sameSite: "None",
              secure: true,
              maxAge: 300 * 1000,
            });
            //! DO A BACKUP OF COLLECTIONS AND SEND IT TO MY EMAIL
            res.redirect("/admin/panel");
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
  try {
    const allusers = await Users.find({});
    const allwaitList = await waitList.find({});
    //! READ ALL FILES IN ./backup dir put them in an array and pass it to render
    res.render("admin/panel/main.ejs", {
      allusers: allusers,
      allwaitlist: allwaitList,
    });
  } catch {
    res.redirect("/");
  }
});

router.post("/panel/update", authenticateToken, async (req, res) => {
  try {
    const what = req.body.what;
    if (what === "EMAIL") {
      const update = await Users.updateOne(
        { email: req.body.who },
        { email: req.body.newvalue }
      );
      if (update) res.redirect("/admin/panel");
      else {
        res.sendStatus(500);
      }
    }
    if (what === "PASSWORD") {
      const hashedPassword = await bcrypt.hash(req.body.newvalue, 10);
      if (hashedPassword) {
        const update = await Users.updateOne(
          { email: req.body.who },
          { password: hashedPassword }
        );
        if (update) res.redirect("/admin/panel");
      } else {
        res.sendStatus(500);
      }
    }
    if (what === "CREDIT") {
      const update = await Users.updateOne(
        { email: req.body.who },
        { $inc: { credit: req.body.newvalue } }
      );
      if (update) res.redirect("/admin/panel");
      else {
        res.sendStatus(500);
      }
    }
  } catch (err) {
    res.send(err);
  }
});

router.post("/panel/create", authenticateToken, async (req, res) => {
  try {
    const duplicate = await Users.findOne({ email: req.body.email });
    if (duplicate) return res.sendStatus(500);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    if (hashedPassword) {
      const newUser = await Users.create({
        email: req.body.email,
        password: hashedPassword,
        credit: req.body.credit,
        used: 0,
      });
      if (newUser) return res.redirect("/admin/panel");
      res.sendStatus(500);
    } else {
      res.sendStatus(500);
    }
  } catch (err) {
    res.send(err);
  }
});

router.post("/panel/delete", authenticateToken, async (req, res) => {
  try {
    const todelete = req.body.todelete;
    if (!todelete) return res.redirect("/admin/panel");
    const deleted = await Users.deleteOne({ email: todelete });
    if (deleted) return res.redirect("/admin/panel");
    res.sendStatus(500);
  } catch (err) {
    res.send(err);
  }
});

router.post("/approve", authenticateToken, async (req, res) => {
  try {
    const email = req.body.gemail;
    const check = await waitList.findOne({ email: email });
    if (!check) return res.sendStatus(500);
    const dcheck = await Users.findOne({ email: email });
    if (!dcheck) {
      swap();
    } else {
      updateSwap();
      async function updateSwap() {
        const email = req.body.gemail;
        const hashedPassword = await bcrypt.hash(check.password, 10);
        if (!hashedPassword) return res.sendStatus(500);
        const USdeleted = await Users.deleteOne({ email: email });
        if (!USdeleted) return res.sendStatus(500);
        const newUser = await Users.create({
          email: check.email,
          password: hashedPassword,
          credit: check.credit,
          used: 0,
        });
        if (!newUser) return res.sendStatus(500);
        const WLdeleted = await waitList.deleteOne({ email: email });
        if (!WLdeleted) return res.sendStatus(500);
        res.redirect("/admin/panel");
      }
    }
    async function swap() {
      const email = req.body.gemail;
      const hashedPassword = await bcrypt.hash(check.password, 10);
      if (!hashedPassword) return res.sendStatus(500);
      const newUser = await Users.create({
        email: check.email,
        password: hashedPassword,
        credit: check.credit,
        used: 0,
      });
      if (!newUser) return res.sendStatus(500);
      const deleted = await waitList.deleteOne({ email: email });
      if (!deleted) return res.sendStatus(500);
      var mailOptions = {
        from: process.env.GMAIL_NAME,
        to: check.email,
        subject: "Twoje konto zostało aktywowane",
        html:
          "<p>Od momentu przyjścia tej wiadomości możesz korzystać z usług strony. Masz <b> " +
          check.credit +
          " </b> kluczy </p>",
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.send(error);
        } else {
          res.redirect("/admin/panel");
        }
      });
    }
  } catch {
    res.redirect("/admin/panel");
  }
});

router.post("/disapprove", authenticateToken, async (req, res) => {
  try {
    const email = req.body.gemail;
    const check = await waitList.findOne({ email: email });
    if (!check) return res.sendStatus(500);
    swap();
    async function swap() {
      const email = req.body.gemail;
      const deleted = await waitList.deleteOne({ email: email });
      if (!deleted) return res.sendStatus(500);
      res.redirect("/admin/panel");
    }
  } catch {
    res.redirect("/admin/panel");
  }
});

router.post("/backup", authenticateToken, async (req, res) => {
  //! MODEL FOR BACKUP FILES STRUCTUER
  function backup(allusers, allwaitList) {
    this.users = allusers;
    this.waitlist = allwaitList;
  }

  const allusers = await Users.find({});
  const allwaitList = await waitList.find({});
  const newBackup = new backup(allusers, allwaitList);
  let date_ob = new Date();
  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  var currDate = hours + ":" + minutes + "AT" + date + "." + month + "." + year;
  const newFile = fs.writeFileSync(
    "./backup/" + currDate + ".json",
    JSON.stringify(newBackup)
  );

  if (newFile == "false") return res.send("ERROR I GUESS");
  res.send("BACKUP HAS BEEN COMPLETED");
});

//! DO A BACKUP ROUTE THAT GETS A FILENAME FROM req.body.fname AND THEN GETS THIS FILE JSON AND SPLITS IT INTO 2 ARRAYS
//! USER ARRAY AND WAITLIST ARRAY
//! IF SUCCESFUL DELETE ALL DOCUMENTS IN users AND waitlists COLLECTION
//! 2 FOR LOOP THAT INPUTS ALL THE DATA 
//! OR JUST TWO INSERTMANY(user[]) and  INSERTMANY(waitlists[])
// router.post("/doabackup", authenticateToken, async (req, res) => {

// })

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
