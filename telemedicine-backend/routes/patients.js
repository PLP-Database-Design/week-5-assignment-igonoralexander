// routes/patients.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db'); // Import the database connection
const { body, validationResult } = require('express-validator'); // Validation library

// Patient Registration Route
router.post(
  '/register',
  // Use express-validator to enforce strong input validation
  [
    body('first_name').not().isEmpty().withMessage('First name is required'),
    body('last_name').not().isEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').not().isEmpty().withMessage('Phone number is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email, password, phone, date_of_birth, gender, address } = req.body;

    try {
      // Check if the patient already exists
      const [existingPatient] = await db.promise().query('SELECT * FROM Patients WHERE email = ?', [email]);
      if (existingPatient.length > 0) {
        return res.status(400).json({ message: 'Email already registered.' });
      }

      // Hash the password with a configurable salt rounds
      const saltRounds = 12; // More secure than 10
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new patient into the database
      const [result] = await db.promise().query(
        'INSERT INTO Patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, hashedPassword, phone, date_of_birth, gender, address]
      );

      // Send response
      res.status(201).json({ message: 'Patient registered successfully!', patientId: result.insertId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

// Patient Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the patient exists in the database
    const [results] = await db.promise().query('SELECT * FROM Patients WHERE email = ?', [email]);
    if (results.length > 0) {
      // Compare the hashed password
      const validPass = await bcrypt.compare(password, results[0].password_hash);
      if (validPass) {
        req.session.patientId = results[0].id;  // Save patient ID in session
        res.send('Logged in successfully');
      } else {
        res.status(401).send('Invalid password');
      }
    } else {
      res.status(404).send('Patient not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Patient Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Logout error. Please try again later.' });
    } else {
      res.send('Logged out successfully');
    }
  });
});

// Export the router
module.exports = router;
