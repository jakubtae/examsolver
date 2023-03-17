const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("inf03/inf03.ejs");
});

router.post("/upload", (req, res) => {
  var multiparty = require("multiparty");
  var form = new multiparty.Form();
  var fs = require("fs");
  form.parse(req, function (err, fields, files) {
    //! GETTING THE UPLOADED FILE [SESSION] AS AN ARRAY OF OBJECTS
    var sesjaPlik = files.sesjaFile[0];

    var fileString = fs.readFileSync(sesjaPlik.path).toString();

    var sesja = JSON.parse(fileString);

    //! GETTING THE ALL QUESTIONS FILE AS AN ARRAY OF OBJECTS
    var fileString2 = fs.readFileSync("data.json").toString();

    var fileObj = JSON.parse(fileString2);

    var wszystkie = fileObj.gotowce;

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
    // * END OF FIRST FOR LOOP
    console.log(odpowiedzi);
    res.render("inf03/inf03.ejs", {odpowiedzi : odpowiedzi});
    //! RENDERING A PAGE WITH THE CODE WITH ARRAY
  });
});


module.exports = router;
