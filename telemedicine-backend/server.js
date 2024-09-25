require('dotenv').config();  // Load environment variables from .env file

const express = require('express');

const session = require('express-session');

const bodyParser = require('body-parser');

const bcrypt = require('bcryptjs');

const mysql = require('mysql2');

const patientsRoutes = require('./routes/patients');

const db = require('./db'); // Import the database connection


const app = express();

db.getConnection((err, connection) => {
  if (err) throw err;
  console.log('Connected to MySQL!');
});


// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


// Make db available to all routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Define a route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Telemedicine Application API!'); // A simple response for testing
});

app.get('/patients', (req, res) => {
  const query = 'SELECT id, first_name, last_name, date_of_birth FROM patients';
  db.query(query, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);
  });
});


app.get('/providers', (req, res) => {
  const query = 'SELECT first_name, last_name, provider_specialty FROM providers';
  db.query(query, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);
  });
});


app.get('/patients/:firstName', (req, res) => {
  const query = 'SELECT * FROM patients WHERE first_name = ?';
  db.query(query, [req.params.firstName], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);
  });
});


app.get('/providers/specialty/:specialty', (req, res) => {
  const query = 'SELECT * FROM providers WHERE provider_specialty = ?';
  db.query(query, [req.params.specialty], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});