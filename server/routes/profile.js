// routes/profile.js - Profile routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/upload');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
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

// Update user profile
router.post('/profile/update', authenticateToken, upload.single('profile_photo'), async (req, res) => {
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
    } else {
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

// Upload profile picture endpoint
router.post('/upload-profile-picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  const userId = req.user.id;
  const filePath = `/uploads/${req.file.filename}`;

  try {
    await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2',
      [filePath, userId]
    );
    res.status(200).send('Profile picture updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile picture');
  }
});

module.exports = router;