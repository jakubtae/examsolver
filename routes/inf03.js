const express = require("express");
const router = express.Router();
const cors = require("cors");
var fs = require("fs");
const db = require("../models/conn.js");
const bcrypt = require("bcrypt");

const users = require("../models/mongoUsers.js");

router.use(cors({
  origin: "https://egzamin-informatyk.pl"
}));

router.get("/", (req, res) => {
  res.render("inf03/inf03.ejs");
});

router.post("/solve", async (req, res) => {
  try {
    check();
    async function check() {
      // var passwordS = req.body.pass;
      // var sesja = [];
      const exist = await users.findOne({ email: req.body.email }); //exist is already getting all the user data so we can operate on it
      if (exist != null) {
        bcrypt.compare(req.body.pass, exist.password, (err, result) => {
          if (result == true) {
            if (exist.credit < 1) return res.send("Nie masz już zadnych kluczy do wykorzystania");
            else{update();}
            async function update() {
              await users
                .updateOne(
                  { email: req.body.email },
                  { $inc: { credit: -1, used: 1 } }
                )
                .then(() => {
                  //! PASTE READY CODE
                  var sesja = req.body.sesja;
                  //! GETTING THE ALL QUESTIONS FILE AS AN ARRAY OF OBJECTS
                  var fileString2 = fs.readFileSync("data.json").toString();
            
                  var wszystkie = JSON.parse(fileString2);
            
                  //! Declaring check var so it has global scope
                  var check;
                  var odpowiedzi = [];
                  //! CHECKING PART
                  // * LOOP START
                  for (var i = 0; i < sesja.length; i++) {
                    var Tresc = sesja[i].tresc;
                    //  console.log(i); TESTING COMMAND
                    // * LOOP START
                    for (var j = 0; j < wszystkie.length; j++) {
                      // console.log(j); TESTING COMMAND
                      var CzyTresc = wszystkie[j].tresc;
                      var CzyOdpowiedz = wszystkie[j].odpowiedz;
                      //! SPRAWDZ CZY Tresc PASUJE DO CzyTresc w tablicy gotowe;
                      check =
                        JSON.stringify(Tresc) === JSON.stringify(CzyTresc);
            
                      //! JESLI TAK
            
                      if (check === true) {
                        //! ZAKONCZ PETLE
                        //! WEZ ODPOWIEDZ
                        //! DOPISZ DO TABELII ODPOWIEDZI
                        j = wszystkie.length;
                        odpowiedzi.push(CzyOdpowiedz);
                      }
                    }
                    // * END OF SECOND FOR LOOP
                    //! JESLI NIE
                    if (check === false) {
                      //! WYLOSUJ LICZBE OD 1 do 4
                      //! DOPISZ DO TABELII ODPOWIEDZI
                      odpowiedzi.push(false);
                    }
                  }
                  res.send(odpowiedzi);
                })
                .catch((err) => {
                  res.send("Bład serwera, napisz wiadomość do administratora");
                });
            }
            //*if password is correct
          } else {
            //* if password is incorrect sends error
            res.send(
              "Zły login, sprawdź czy poprawnie wpisałeś dane logowania"
            );
          }
        });
      } else {
        res.send("Zły login");
      }
    }
  } catch (error) {
    res.send(error);
  }
});


module.exports = router;
