const express = require('express')
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const { Console } = require('console');
const app = express()
const port = 3000

const sequelize = new Sequelize("wt22", "root", "password", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
  define: {
    freezeTableName: true,
  }
});

const Student = sequelize.define('Student', {
  ime: DataTypes.STRING,
  index: DataTypes.INTEGER,
}, { timestamps: false });

const Predmet = sequelize.define('Predmet', {
  naziv: DataTypes.STRING,
  brojPredavanjaSedmicno: DataTypes.INTEGER,
  brojVjezbiSedmicno: DataTypes.INTEGER,
}, { timestamps: false });

const Nastavnik = sequelize.define('Nastavnik', {
  username: DataTypes.STRING,
  password_hash: DataTypes.STRING,
}, { timestamps: false });

Nastavnik.belongsToMany(Predmet, { through: 'NastavnikPredmet' });
Predmet.belongsToMany(Nastavnik, { through: 'NastavnikPredmet' });

const Prisustvo = sequelize.define('Prisustvo', {
  sedmica: DataTypes.INTEGER,
  predavanja: DataTypes.INTEGER,
  vjezbe: DataTypes.INTEGER,
  PredmetId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  StudentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
}, {
  timestamps: false,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: '1q"W3e$R5t&Z',
  resave: true,
  saveUninitialized: true
}));


function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  Nastavnik.findOne({
    where: {
      username: username,
    },
    include: Predmet,
  }).then(nastavnikModel => {
    if (nastavnikModel === null) {
      res.json({
        poruka: "Nespješna prijava"
      });
      return;
    }
    const nastavnik = nastavnikModel.get({ plain: true });
    const areEqual = bcrypt.compareSync(password, nastavnik.password_hash);
    if (areEqual) {
      req.session.username = username;
      req.session.predmeti = nastavnik.Predmets.map(p => p.naziv);
      res.json({
        poruka: "Uspješna prijava"
      });
      return;
    } else {
      res.json({
        poruka: "Nespješna prijava"
      });
    }
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.json({
      poruka: "Uspješna odjava",
    });
  })
});

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

const getPredmet = async (naziv) => {
  const predmet = await Predmet.findOne({
    where: {
      naziv: naziv,
    }
  });

  if (predmet === null) {
    res.json({
      greska: "Ne postoji predmet",
    });
    return;
  }

  const prisustva = await Prisustvo.findAll({
    where: {
      PredmetId: predmet.id,
    }
  });

  const studenti = await Student.findAll();
  return {
      studenti: [
        ...prisustva.map(p => p.StudentId)
          .filter(onlyUnique)
          .map(id => studenti.filter(s => s.id === id)[0])
      ],
      prisustva: [
        ...prisustva.map(p => {
          return {
            ...p.dataValues,
            index: studenti.filter(s => s.id === p.StudentId)[0].index,
          }
        }),
      ],
      predmet: predmet.naziv,
      brojPredavanjaSedmicno: predmet.brojPredavanjaSedmicno,
      brojVjezbiSedmicno: predmet.brojVjezbiSedmicno,
  };
}

app.get('/predmet/:naziv', async (req, res) => {
  if (!req.session.username) {
    res.json({
      greska: "Nastavnik nije loginovan",
    });
    return;
  }

  res.json({
    prisustva: await getPredmet(req.params.naziv)
  });
});

app.post('/prisustvo/predmet/:naziv/student/:index', async (req, res) => {
  const { naziv, index } = req.params;
  const { prisustvo } = req.body;


  const predmet = await Predmet.findOne({
    where: {
      naziv: naziv,
    },
  });
  
  if (!predmet) {
    res.json({
      poruka: "Predmet nije pronađen"
    });
    return;
  }

  const student = await Student.findOne({
    where: {
      index: index,
    },
  });

  let prisustva = (await Prisustvo.findAll({
    where: {
      PredmetId: predmet.id,
      StudentId: student.id,
    }
  })).map(p => p.dataValues);


  if (prisustva.length === 0) {
    res.json({
      poruka: "Student nije pronađen"
    });
    return;
  }

  let prisustvoZaSedmicu = prisustva.filter(s => s.sedmica === prisustvo.sedmica);

  if (prisustvoZaSedmicu.length === 0) {
    await Prisustvo.create({
      sedmica: prisustvo.sedmica,
      predavanja: prisustvo.predavanja,
      vjezbe: prisustvo.vjezbe,
      StudentId: student.id,
      PredmetId: predmet.id,
    })
  } else {
    const p = prisustvoZaSedmicu[0];
    if (prisustvo.predavanja) {
      p.predavanja = prisustvo.predavanja;
    } else if(prisustvo.vjezbe) {
      p.vjezbe = prisustvo.vjezbe;
    }
    await Prisustvo.update(p, {
      where: {
        id: p.id,
      },
    });
  }

  res.json(await getPredmet(naziv));
});

app.get("/", (req, res) => {
  console.log(req.session);
  res.json({
    username: req.session.username
  });
});


sequelize.authenticate().then(_ => {
  initialize().then(_ => {
    app.listen(port, () => {
      console.log(`Spirala app listening on port ${port}`);
    })
  }).catch(error => {
    console.log("Sync failed");
    console.log(error);
  });
}).catch(error => {
  console.log("Authentication failed");
  console.log(error);
})

const initialize = async () => {
  await sequelize.sync({
    force: true,
  });
  const nastavnik1 = await Nastavnik.create({
    username: 'nastavnik1',
    password_hash: bcrypt.hashSync('password', 10),
  });
  const nastavnik2 = await Nastavnik.create({
    username: 'nastavnik2',
    password_hash: bcrypt.hashSync('password', 10),
  });
  const predmet1 = await Predmet.create({
    naziv: "Predmet1",
    brojPredavanjaSedmicno: 3,
    brojVjezbiSedmicno: 2,
  });
  const predmet2 = await Predmet.create({
    naziv: "Predmet2",
    brojPredavanjaSedmicno: 3,
    brojVjezbiSedmicno: 2,
  });
  const predmet3 = await Predmet.create({
    naziv: "Predmet3",
    brojPredavanjaSedmicno: 3,
    brojVjezbiSedmicno: 2,
  });
  await nastavnik1.addPredmet(predmet1);
  await nastavnik1.addPredmet(predmet2);
  await nastavnik1.addPredmet(predmet3);

  await nastavnik2.addPredmet(predmet1);

  const student1 = await Student.create({
    ime: "Neko",
    index: 12345,
  });
  const student2 = await Student.create({
    ime: "Neko Nekic",
    index: 12346,
  });

  await Prisustvo.bulkCreate([
    {
      sedmica: 1,
      predavanja: 1,
      vjezbe: 1,
      PredmetId: predmet1.id,
      StudentId: student1.id,
    },
    {
      sedmica: 2,
      predavanja: 2,
      vjezbe: 1,
      PredmetId: predmet1.id,
      StudentId: student1.id,
    },
    {
      sedmica: 1,
      predavanja: 3,
      vjezbe: 2,
      PredmetId: predmet1.id,
      StudentId: student2.id,
    }
  ]);

  await Prisustvo.bulkCreate([
    {
      sedmica: 1,
      predavanja: 1,
      vjezbe: 1,
      PredmetId: predmet2.id,
      StudentId: student1.id,
    },
    {
      sedmica: 2,
      predavanja: 2,
      vjezbe: 1,
      PredmetId: predmet2.id,
      StudentId: student1.id,
    },
    {
      sedmica: 1,
      predavanja: 3,
      vjezbe: 2,
      PredmetId: predmet2.id,
      StudentId: student2.id,
    },
    {
      sedmica: 2,
      predavanja: 3,
      vjezbe: 2,
      PredmetId: predmet2.id,
      StudentId: student2.id,
    },
  ]);

  await Prisustvo.bulkCreate([
    {
      sedmica: 1,
      predavanja: 1,
      vjezbe: 1,
      PredmetId: predmet3.id,
      StudentId: student1.id,
    },
    {
      sedmica: 2,
      predavanja: 2,
      vjezbe: 1,
      PredmetId: predmet3.id,
      StudentId: student1.id,
    },
    {
      sedmica: 1,
      predavanja: 3,
      vjezbe: 2,
      PredmetId: predmet3.id,
      StudentId: student2.id,
    },
    {
      sedmica: 2,
      predavanja: 3,
      vjezbe: 2,
      PredmetId: predmet3.id,
      StudentId: student2.id,
    },
  ]);

}

