const express = require('express')
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const fs = require("fs");
const { Console } = require('console');
const app = express()
const port = 3000

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: '1q"W3e$R5t&Z',
  resave: true,
  saveUninitialized: true
}));

//

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  fs.readFile("data/nastavnici.json", (err, data) => {
    if (err) throw err;
    const nastavnici = JSON.parse(data);

    const korisnici = nastavnici.filter((x) => x.nastavnik.username === username);


    if (korisnici.length > 0) {
      console.log(korisnici[0].nastavnik.password_hash);
      console.log(bcrypt.hashSync("password", 10));
      const areEqual = bcrypt.compareSync(password, korisnici[0].nastavnik.password_hash);
      if (areEqual) {
        req.session.username = username;
        req.session.predmeti = korisnici[0].predmeti;
        res.json({
          poruka: "Uspješna prijava"
        });
        return;
      }
    }
    res.json({
      poruka: "Nespješna prijava"
    });
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.json({
      poruka: "Uspješna odjava",
    })// cannot access session here
  })
});

//

app.get('/predmeti', (req, res) => {
  if (req.session.username) {
    res.json({
      predmeti: req.session.predmeti,
    });
  } else {
    res.json({
      greska: "Nastavnik nije loginovan",
    });
  }

});

app.get('/predmet/:naziv', (req, res) => {
  if (!req.session.username) {
    res.json({
      greska: "Nastavnik nije loginovan",
    });
    return;
  }

  const data = fs.readFileSync('data/prisustva.json');
  const prisustva = JSON.parse(data);

  console.log(prisustva);
  console.log(req.params.naziv);
  const prisustvaZaPredmet = prisustva.filter((x) => x.predmet === req.params.naziv);
  if (prisustvaZaPredmet.length > 0) {
    res.json({
      prisustva: prisustvaZaPredmet[0],
    });
  } else {
    res.json({
      greska: "Ne postoji predmet",
    });
  }
  console.log(req.params.naziv);
});

app.post('/prisustvo/predmet/:naziv/student/:index', (req, res) => {
  const { naziv, index } = req.params;
  const { prisustvo } = req.body;
  console.log("SADA");
  console.log("SEDMICA" + req.body.sedmica);


  const data = fs.readFileSync('data/prisustva.json');
  const prisustvaJson = JSON.parse(data);

  console.log("SVA PRISUSTVA JSON ");
  console.log(JSON.stringify(prisustvaJson));

  let pronadjenPredmet = prisustvaJson.find(p => p.predmet === naziv);
  console.log("INDEX JS PREDMET");
  console.log(JSON.stringify(pronadjenPredmet));

  if (!pronadjenPredmet) {
    res.json({
      poruka: "Predmet nije pronađen"
    });
    return;
  }

  let prisustvaStudenta = pronadjenPredmet.prisustva.filter(p => p.index == index);
  console.log("INDEX JS STUDENT PRISUSTVA");
  console.log(JSON.stringify(prisustvaStudenta));

  if (!prisustvaStudenta) {
    res.json({
      poruka: "Student nije pronađen"
    });
    return;
  }

  let prisustvoZaSedmicu = prisustvaStudenta.filter(s => s.sedmica == prisustvo.sedmica);
  console.log("INDEX JS STUDENT PRISUSTVA SEDMICA");
  console.log(JSON.stringify(prisustvoZaSedmicu));
  console.log("PREDAVANJA I VJEZBE");
  console.log(prisustvo.predavanja);
  console.log(prisustvo.vjezbe);
  if (prisustvoZaSedmicu.length === 0) {
    prisustvoZaSedmicu = {
      sedmica: prisustvo.sedmica,
      predavanja: prisustvo.predavanja ?? 0,
      vjezbe: prisustvo.vjezbe ?? 0, // prisustvo.vjezbe ? prisustvo.vjezbe : 0
      index: Number(index),
    };

    console.log("DODAJEM RED");
    pronadjenPredmet.prisustva.push(prisustvoZaSedmicu);
    console.log("DODAN RED");
  } else {

    if (prisustvo.predavanja != null)
      prisustvoZaSedmicu[0].predavanja = prisustvo.predavanja;

    if (prisustvo.vjezbe != null)
      prisustvoZaSedmicu[0].vjezbe = prisustvo.vjezbe;
  }


  res.json(pronadjenPredmet);
  fs.writeFileSync('data/prisustva.json', JSON.stringify(prisustvaJson));
});

app.get("/", (req, res) => {
  console.log(req.session);
  res.json({
    username: req.session.username
  });
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

