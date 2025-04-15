const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Initialize the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'eeja', 
  host: 'localhost',
  database: 'basdat', 
  password: '1', 
  port: 5432, 
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows);
  }
});

// GET route for fetching users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM login'); // Fetch all users
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// POST route for adding a user
app.post('/api/users', async (req, res) => {
  const { nama, email } = req.body;
  if (!nama || !email) {
    return res.status(400).json({ message: 'Nama and email are required' });
  }

  try {
    const result = await pool.query('INSERT INTO login (nama, email) VALUES ($1, $2)', [nama, email]);
    console.log('Insert result:', result);
    res.status(201).json({ message: 'User added successfully' });
  } catch (err) {
    console.error('Error inserting user:', err); 
    res.status(500).json({ message: 'Error adding user js' });
  }
});

// Start the server
app.listen(4000, () => {
  console.log('Server is running on port 4000');
});