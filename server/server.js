// server.js - Main entry point
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env file

// Initialize the Express app
const app = express();

// Middleware setup
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your client URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Uploads directory created: ${uploadsDir}`);
}

// Make uploads directory accessible publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug static files setup
// console.log(`Serving static files from: ${uploadsDir}`);
// console.log(`Files will be accessible at: http://localhost:4000/uploads/filename.jpg`);

// Import database configuration
const pool = require('./config/db');

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows);
  }
});

// Import file cleanup utility
const { cleanupUnusedUploads, scheduleCleanup } = require('./utils/fileCleanup');

// Schedule file cleanup
scheduleCleanup();

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const gradesRoutes = require('./routes/grades');

// Mount routes
app.use('/api', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', gradesRoutes);

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

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});