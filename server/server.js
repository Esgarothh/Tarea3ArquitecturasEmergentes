const express = require('express');
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const session = require('express-session');
const app = express();
const db = new sqlite3.Database('mydatabase.db');
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));


db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER,
    name TEXT PRIMARY KEY ,
    isAdmin INTEGER DEFAULT 0,
    hash TEXT,
    companyId INTEGER,
    FOREIGN KEY (companyId) REFERENCES companys (id)
  )`);

  db.run('CREATE TABLE IF NOT EXISTS companys (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, companyId INTEGER, FOREIGN KEY (companyId) REFERENCES companys (id))');
  db.run('CREATE TABLE IF NOT EXISTS sensors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, locationId INTEGER, FOREIGN KEY (locationId) REFERENCES locations (id))');
  db.run('CREATE TABLE IF NOT EXISTS sensor_data (id INTEGER PRIMARY KEY AUTOINCREMENT, sensorId INTEGER, data TEXT, time TEXT, FOREIGN KEY (sensorId) REFERENCES sensors (id))');
  console.log("Connection with SQLite has been established");
});

function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) {
    // User is logged in
    next();
  } else {
    // Redirect to login page with a message
    req.session.errorMessage = 'Debes estar logeado.';
    res.redirect('/login');
  }
}

function requireAuthAsAdmin(req, res, next) {
  if (req.session && req.session.loggedAsAdmin) {
    // User is logged in
    next();
  } else {
    // Redirect to login page with a message
    req.session.errorMessage = 'Debes ser administrador.';
    res.redirect('/login');
  }
}

app.get('/registrar', (req, res) => {

  res.render('registrar');
});

app.post('/registrar', (req, res) => {
  // Process the request
  db.run('INSERT OR IGNORE INTO usuarios (name,isAdmin) VALUES (?,?)', [req.body.username, req.body.admin], (error, rows) => {
    if (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const responseData = { message: 'Registrado exitosamente!', data: rows };
      res.json(responseData);
    }
  });
});

app.get('/login', (req, res) => {
  const errorMessage = req.session.errorMessage;
  // Clear the error message from the session
  req.session.errorMessage = null;
  res.render('login', { errorMessage });
});


app.post('/login', (req, res) => {

  db.all('SELECT * FROM usuarios where name= ?', [req.body.username], (error, rows) => {
    if (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (rows.length > 0) {
        let fila = rows[0]
        if (fila.name === req.body.username) {
          req.session.loggedIn = true;
          req.session.loggedAsAdmin = false
          let responseData = { message: 'Has ingresado como cliente!' };
          console.log(fila)
          console.log(fila.isAdmin)
          if (fila.isAdmin === 1) {
            req.session.loggedAsAdmin = true
            responseData = { message: 'Has ingresado como admin!' };
          }

          res.json(responseData);
        }
      }
      else {

        req.session.errorMessage = 'El usuario no existe!!';
        res.redirect('/login');

      }

    }
  });

});




app.get('/show', requireAuth, (req, res) => {
  // Access the database inside an async function
  db.all('SELECT * FROM langs', (error, rows) => {
    if (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const responseData = { message: 'Hello from the server!', data: rows };
      res.json(responseData);
    }
  });
});



app.get('/create-sensor', requireAuthAsAdmin, (req, res) => {

  res.render('create_sensor');
});

app.post('/create-sensor', (req, res) => {
  // Process the request
  db.run('INSERT INTO sensors (name) VALUES (?)', [req.body.id], (error, rows) => {
    if (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const responseData = { message: 'Hello from the server!', data: rows };
      res.json(responseData);
    }
  });
});



app.get('/ver-sensores', (req, res) => {
  db.all('SELECT * FROM sensors', (error, rows) => {
    if (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      db.all('SELECT * FROM sensor_data', (error, rows2) => {
        if (error) {
          console.error(error.message);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          const responseData = { message: 'Hello from the server!', data: rows, sensores: rows2 };
          res.json(responseData);
        }
      });
    }
  });
});






app.post('/upload-data', (req, res) => {
  // Process the request
  db.all('SELECT * FROM sensors where name= ?', [req.body.api_key], (error, rows) => {
    if (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const names = rows.map(item => item.name);
      if (names.includes(req.body.api_key)) {
        console.log(req.body.api_key)
        db.run('INSERT INTO sensor_data (sensorId,data) VALUES (?,?)', [req.body.api_key, req.body.json_data], (error, rows) => {
          if (error) {
            console.error(error.message);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            const responseData = { message: 'Hello from the server!', data: rows };
            res.json(responseData);
          }
        });

      }
      else {

        console.log(rows)
        console.log(names)
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
