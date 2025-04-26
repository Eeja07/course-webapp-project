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

app.use(cors({
  origin: 'http://localhost:5173', // Replace with your client URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Uploads directory created: ${uploadsDir}`);
}

// Membuat folder 'uploads' dapat diakses secara publik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
// Add this function after your other imports and setup

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows);
  }
});
// Function to clean up unused files in uploads directory
const cleanupUnusedUploads = async () => {
  try {
    // Get all profile_photo values from the database
    const dbResult = await pool.query('SELECT profile_photo FROM dosen WHERE profile_photo IS NOT NULL');

    // Create a set of filenames that are in the database
    const databaseFiles = new Set();
    dbResult.rows.forEach(row => {
      if (row.profile_photo) {
        databaseFiles.add(row.profile_photo);
      }
    });

    console.log(`Found ${databaseFiles.size} profile photos in database`);

    // Read all files from uploads directory
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        console.error('Error reading uploads directory:', err);
        return;
      }

      // Loop through each file in the directory
      files.forEach(file => {
        // If the file is not in the database, delete it
        if (!databaseFiles.has(file)) {
          const filePath = path.join(uploadsDir, file);

          // Skip default profile picture if it exists
          if (file === '/profile.jpg') return;

          // Delete the file
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${file}:`, err);
            } else {
              console.log(`Deleted unused file: ${file}`);
            }
          });
        }
      });
    });

    console.log('Cleanup complete');
  } catch (error) {
    console.error('Error during uploads cleanup:', error);
  }
};

// Upload gambar ke server
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
// Add this after your other setups

// Run cleanup every 24 hours
setInterval(cleanupUnusedUploads, 24 * 60 * 60 * 1000);

// Also run once when the server starts
cleanupUnusedUploads();
// Endpoint untuk meng-upload foto profil
app.post('/upload-profile-picture', upload.single('profile_picture'), async (req, res) => {
  const { userId } = req.body;
  const filePath = `/uploads/${req.file.filename}`;

  try {
    await client.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2',
      [filePath, userId]
    );
    res.status(200).send('Profile picture updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile picture');
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
    // Add detailed logging
    console.log('Received user ID from token:', req.user.id);
    console.log('Received user email from token:', req.user.email);

    const query = 'SELECT id, nama, nip, email, fakultas, program_studi, profile_photo FROM dosen WHERE id = $1';

    // Log the actual query being executed
    console.log('Executing query with ID:', req.user.id);

    const result = await pool.query(query, [req.user.id]);

    // Log the query result
    console.log('Query result rows:', result.rows);
    console.log('Number of rows found:', result.rows.length);

    let user;

    if (result.rows.length === 0) {
      // Return a default user object with placeholder values if no user is found
      user = {
        nama: '',
        nip: '',
        email: req.user.email || '',
        fakultas: '',
        program_studi: '',
        profile_photo: '../profile.jpg'
      };

      console.log('No profile found. Returning default user object');
    } else {
      user = result.rows[0];

      // Check if the user has a profile photo
      if (user.profile_photo) {
        user.profile_photo = `/uploads/${user.profile_photo}`; // Serve the image from the uploads directory
      } else {
        user.profile_photo = '../profile.jpg'; // Default image if no profile photo exists
      }

      console.log('Profile found:', user);
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Detailed error fetching profile:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      errorDetails: error.message,
      stack: error.stack
    });
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

    // In registration route
    const result = await pool.query(
      'INSERT INTO login (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    const userId = result.rows[0].id; // This is now a UUID


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
  const userId = req.user.id; // Extract user ID for clarity

  // Store just the filename instead of the full path
  const photoFilename = req.file ? req.file.filename : null;

  // Input validation
  if (!nama || !nip || !email || !fakultas || !program_studi) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user exists in dosen table
    const checkQuery = 'SELECT * FROM dosen WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new user if not found
      const insertQuery = `
        INSERT INTO dosen (id, nama, nip, email, fakultas, program_studi, profile_photo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      result = await pool.query(insertQuery, [userId, nama, nip, email, fakultas, program_studi, photoFilename]);
    }
    else {
      // Update existing user
      const updateQuery = `
        UPDATE dosen
        SET id = $1, nama = $2, nip = $3, email = $4, fakultas = $5, program_studi = $6, profile_photo = $7, updated_at = NOW()
        WHERE id = $8 RETURNING *`;

      result = await pool.query(updateQuery, [userId, nama, nip, email, fakultas, program_studi, photoFilename, userId]);
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
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