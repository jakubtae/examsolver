const express = require("express");
const router = express.Router();
const cors = require("cors");
var fs = require("fs");

router.use(cors({
  origin: "https://egzamin-informatyk.pl"
}));

router.get("/", (req, res) => {
  res.render("inf03/inf03.ejs");
});

router.post('/solve', (req, res) => {
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
        check = JSON.stringify(Tresc) === JSON.stringify(CzyTresc);

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


module.exports = router;
