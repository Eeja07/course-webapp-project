const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // To load environment variables from .env file

// Initialize the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define uploads directory and ensure it exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created: ${uploadsDir}');
}

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg'))  {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));
// Add debugging to check middleware setup
console.log(`Serving static files from: ${uploadsDir}`);
console.log(`Files will be accessible at: http://localhost:4000/uploads/filename.jpg`);
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

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir); // Use the same uploadsDir variable
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Save with unique name
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Allowed file types
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
  }
});

// JWT Secret Key from environment variables for better security
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret'; // Use a strong secret key

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user; // Attach user info to the request
    next();
  });
};

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT id, nama, nip, email, fakultas, program_studi, profile_photo FROM dosen WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);

    // Check if no user is found, but return an empty profile object or a default response
    if (result.rows.length === 0) {
      return res.status(200).json({ user: {} });  // Returning an empty object when no user is found
    }
    const user = result.rows[0];
    if (user.profile_photo) {
      user.profile_photo = path.join('/uploads', user.profile_photo); // Serve the image from the uploads directory
    }
    // Log the user data for debugging
    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile backend:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Register route for creating new users
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const checkUser = await pool.query('SELECT * FROM login WHERE email = $1', [email]);

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user with hashed password
    const result = await pool.query(
      'INSERT INTO login (email, password) VALUES ($1, $2) RETURNING *',
      [email, hashedPassword]
    );

    res.status(201).json({
      message: 'Registration successful',
      user: { email: result.rows[0].email },
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login route for authenticating users
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const query = 'SELECT * FROM login WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const user = result.rows[0];

    // Compare the password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { email: user.email },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Add a test endpoint to verify static file serving
app.get('/api/test-uploads', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const fileInfo = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          url: `/uploads/${file}`,
          fullPath: filePath,
          exists: fs.existsSync(filePath)
        };
      } catch (err) {
        return {
          name: file,
          error: err.message
        };
      }
    });
    
    res.json({
      uploadsDir,
      fileCount: files.length,
      files: fileInfo
    });
  });
});


app.post('/api/profile/update', authenticateToken, upload.single('profile_photo'), async (req, res) => {
  const { nama, nip, email, fakultas, program_studi } = req.body;
  
  // Store just the filename instead of the full path
  const photoFilename = req.file ? req.file.filename : null;
  
  // Input validation
  if (!nama || !nip || !email || !fakultas || !program_studi) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user exists in dosen table
    const checkQuery = 'SELECT * FROM dosen WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [req.user.id]);
    console.log('User exists check:', checkResult.rows.length > 0, 'User ID:', req.user.id);
    
    let result;
    
    if (checkResult.rows.length === 0) {
      // User doesn't exist - INSERT a new record
      const insertQuery = `INSERT INTO dosen (id, nama, nip, email, fakultas, program_studi, profile_photo) 
                          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      
      result = await pool.query(insertQuery, [req.user.id, nama, nip, email, fakultas, program_studi, photoFilename]);
      console.log('Created new user profile');
    } else {
      // User exists - UPDATE existing record
      const updateQuery = `UPDATE dosen SET nama = $1, nip = $2, email = $3, fakultas = $4, program_studi = $5, 
                         profile_photo = COALESCE($6, profile_photo) WHERE id = $7 RETURNING *`;
      
      result = await pool.query(updateQuery, [nama, nip, email, fakultas, program_studi, photoFilename, req.user.id]);
      console.log('Updated existing user profile');
    }

    if (result.rows.length > 0) {
      res.status(200).json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } else {
      console.log(`Operation completed but no rows returned for user ID ${req.user.id}`);
      res.status(500).json({ message: 'Profile operation completed but no data returned' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});