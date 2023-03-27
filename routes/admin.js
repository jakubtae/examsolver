const express = require("express");
const router = express.Router();
const db = require("../models/conn.js");
const bcrypt = require("bcrypt");
const Admin = require("../models/mongoAdmin.js");
const Tokens = require("../models/mongoTokens.js");
const jwt = require("jsonwebtoken");
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
            //! start JWT token
            const accessToken = generateAccessToken(admin);
            const refreshToken = jwt.sign(
              admin.toJSON(),
              process.env.REFRESH_TOKEN_SECRET
            );

            //! PUSH THIS refreshToken TO DB
            const token = new Tokens({ refreshToken: refreshToken });
            token
              .save()
              .then((res) => {
                console.log("Refresh token created succesfully");
              })
              .catch((err) => {
                console.log(err);
              });

            res.json({ accessToken: accessToken, refreshToken: refreshToken });
            //! receive this and instantly save in localstorage then redirect to /admin/panel
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

router.get("/panel", authenticateToken, (req, res) => {
  res.send(req.admin.uname);
  //! RENDER THE PANEL
  //! res.render.panel
});

router.post("/token", async (req, res) => {
  try {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);

    Tokens.findOne({ refreshToken: refreshToken }).then(() => {
      if (check == null) return res.sendStatus(403);
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, admin) => {
        if (err) return res.sendStatus(403);
        const accessToken = regenerateAccessToken({ uname: admin.uname });
        res.json({ accessToken: accessToken });
        //! I DONT EVEN KNOW WHEN AM I SUPPOSED TO USE THIS
      });
    }).catch((err) => {
      res.sendStatus(403);
    })

  } catch (err) {
    res.send(err);
  }
});

router.delete('/logout', async (req, res) => {
  Tokens.deleteOne({refreshToken: req.body.token}).then(() => {
    console.log("logged out");
    //! LOGOUT LIKE REALLY BY DESTROYING USER DATA FROM LOCAL STORAGE
  }).catch((err) => {
    console.log(err);
  })
})
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, admin) => {
    if (err) return res.sendStatus(403);
    req.admin = admin;
    next();
  });
}

function generateAccessToken(admin) {
  return jwt.sign(admin.toJSON(), process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30s",
  });
}

function regenerateAccessToken(admin) {
  return jwt.sign({ uname: admin.uname }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30s",
  });
}
module.exports = router;
