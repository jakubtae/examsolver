function pytanie(numer, tresc) {
  this.numer = numer;
  this.tresc = tresc;
}
const pytania = document.querySelectorAll(".trescE");
const array = [];
var x = 0;
for (var i = 0; i < pytania.length; i++) {
  const tekst = pytania[i].innerText;
  const numer = tekst.substring(0, tekst.indexOf("."));
  const tresc = tekst.substring(tekst.indexOf(".") + 2, tekst.length);
  const newPytanie = new pytanie(numer, tresc);
  array.push(newPytanie);
}
var xj = new XMLHttpRequest();
xj.open("POST", "http://localhost:3000/inf03/solve", true);
xj.setRequestHeader("Content-Type", "application/json");
xj.send(JSON.stringify({ sesja: array }));
xj.onreadystatechange = function () {
  if (xj.readyState == 4) {
    var odpowiedzi = JSON.parse(xj.responseText);
    var SesjaOdpowiedzi = document.getElementsByClassName("odpowiedzE");
    for (var i = 0; i < SesjaOdpowiedzi.length; i++) {
      const poprawa = SesjaOdpowiedzi[i].innerText.slice(
        4,
        SesjaOdpowiedzi[i].innerText.lenght
      );
      for (var x = 0; x < odpowiedzi.length; x++) {
        if (poprawa === odpowiedzi[x]) {
          const parent = SesjaOdpowiedzi[i];
          parent.querySelector("input").checked = true;
          parent.classList.toggle("odpowiedzEzazn");
        x = odpowiedzi.length;
        } else {
          console.log(":(");
        }
      }
    }
    const bledy = [];
    for (var z = 0; z < 4; z++) {
      var v = Math.round(Math.random() * (40 - 0) + 0);
      if (bledy.indexOf(v) === -1) {
        console.log(v)
        bledy.push(v);
        vz = 4 * v;
    for (var i = 0; i < 4; i++) {
      const poprawa = SesjaOdpowiedzi[vz].innerText.slice(
        4,
        SesjaOdpowiedzi[vz].innerText.lenght
      );
      for (var x = 0; x < odpowiedzi.length; x++) {
        if (poprawa === odpowiedzi[x]) {
          const parent = SesjaOdpowiedzi[vz];
          parent.querySelector("input").checked = false;
          parent.classList.toggle("odpowiedzEzazn");
        x = odpowiedzi.length;
            --vz;
        } else {
          console.log(":(");
        }
      }
    }
      } else {
        z = z - 1;
      }
    }
  }
};
