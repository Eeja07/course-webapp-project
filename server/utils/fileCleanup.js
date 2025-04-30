// utils/fileCleanup.js - File cleanup utilities
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const uploadsDir = path.join(__dirname, '..', 'uploads');

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

// Schedule cleanup to run periodically
const scheduleCleanup = () => {
  // Run cleanup every 24 hours
  setInterval(cleanupUnusedUploads, 24 * 60 * 60 * 1000);

  // Also run once when the server starts
  cleanupUnusedUploads();
};

module.exports = {
  cleanupUnusedUploads,
  scheduleCleanup
};